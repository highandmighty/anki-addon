function ravMilimParser() {
    var html = document.getSelection().getRangeAt(0).cloneContents();
    addBrackets(html, 'span.main font');
    var text = html.textContent;
    var modified = text.trim().replace(/•\s/g, "    - ");
    copyToClipboard(modified);
}

function processExplanation(explanation) {
    var markdown = '';
    const definitionDiv = explanation.querySelector('[class*="WordExplain_explain"]');
    addBrackets(definitionDiv, '[class*="WordExplain_BOLD"]');
    const numberSpan = explanation.querySelector('span');
    
    const number = numberSpan ? numberSpan.textContent.trim() : '';
    const definition = definitionDiv ? definitionDiv.textContent.trim() : '';
    
    markdown += `${number} ${definition}\n`;

    const examples = explanation.querySelectorAll(
        '[class*="Search_full_analyze_explanation_example"] li');
    examples.forEach(example => {
        markdown += `    - ${example.textContent.trim()}\n`;
    });
    return markdown;
}

function ravMilimParser_v2() {
    var definitionTab = document.querySelector(
        'button[data-text="הסבר"][class*="Tabs_tab_selected"]');
    if (!definitionTab) {
        var selectedText = window.getSelection().toString();
        copyToClipboard(selectedText);
        return;
    }

    var markdown = '';
    var html = document.getSelection().getRangeAt(0).cloneContents();
    var groups = html.querySelectorAll(
        '[class*="Search_full_analyze_explanation_group"]');
    if (groups.length === 0) {
        markdown += processExplanation(html);
    } else {
        groups.forEach(group => {
            const explanations = group.querySelectorAll(
                '[class*="Search_full_analyze_explanation"]:not([class*="group"]):not([class*="example"])');
            
            explanations.forEach(explanation => {
                markdown += processExplanation(explanation);
            });
        });
    }
    
    // console.log(markdown.trim());
    copyToClipboard(markdown.trim());
}

function hebrewAcademyParser() {
    var selection = window.getSelection();
    var selectedElement = selection.anchorNode?.parentElement;

    // Use the parser only when the selection starts in a definition list.
    if (!selectedElement?.closest('ul.hagdara')) return false;

    var lines = selection.toString().trim().split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    var numberedLines = lines.map(function(line, index) {
        return index + 1 + '. ' + line;
    });
    var formattedText = numberedLines.join('\n');

    copyToClipboard(formattedText);
    return true;
}

function milogParser() {
    var html = document.getSelection().getRangeAt(0).cloneContents();
    var result = '';
    console.log(html);

    var allItems = Array.from(html.querySelectorAll('.ent_para'));
    // A selection inside one definition may omit the outer .ent_para wrapper.
    if (allItems.length === 0) {
        allItems = [html.querySelector('.ent_para_text') || html];
    }

    allItems.forEach((para, index) => {
        var textContainer = para.querySelector('.ent_para_text') || para;
        var text = textContainer.cloneNode(true);
        var examples = text.querySelectorAll('.ent_example');

        examples.forEach(example => example.remove());
        result += `${index + 1}. ${text.textContent.trim()}\n`;

        examples.forEach(example => {
            var exampleText = example.textContent.trim()
                .replace(/^["“”]|["“”]$/g, '');
            result += `    - ${exampleText}\n`;
        });
    });

    copyToClipboard(result.trim());
}

function addBrackets(element, selector) {
    element.querySelectorAll(selector).forEach(elem => {
        const newFrag = document.createRange()
            .createContextualFragment(`(${elem.innerHTML})`);
        elem.parentNode.replaceChild(newFrag, elem);
    });

    // element.querySelectorAll(selector).forEach(span => {
    //     const frag = document.createDocumentFragment();
    //     frag.append('(');
    //     while (span.firstChild) {
    //         frag.append(span.firstChild);
    //     }
    //     frag.append(')');
    //     span.replaceWith(frag);
    // });
}

const excludedWiktionaryCitationTemplates = new Set([
    'צט/תנ"ך',
    'צט/משנה',
    'צט/תוספתא',
    'צט/בבלי',
    'צט/ירושלמי',
    'צט/ירושלמי הלכה',
    'צט/רבה'
]);

function hasExcludedWiktionaryCitationTemplate(example) {
    var transclusions = example.querySelectorAll(
        '[typeof~="mw:Transclusion"][data-mw]');

    return Array.from(transclusions).some(function(element) {
        try {
            var metadata = JSON.parse(element.getAttribute('data-mw'));

            return metadata.parts.some(function(part) {
                var templateName = part.template?.target?.wt
                    ?.replace(/^תבנית:/, '')
                    .trim();

                return excludedWiktionaryCitationTemplates.has(templateName);
            });
        } catch (error) {
            console.warn('Could not read Wiktionary template metadata:', error);
            return false;
        }
    });
}

function wiktionaryParser() {
    var html = document.getSelection().getRangeAt(0).cloneContents();
    // Temp wrapper to target only top level <li> elements
    var tempContainer = document.createElement('div');
    tempContainer.id = 'top';
    tempContainer.appendChild(html);
    var result = '';
    var index = 1;
    console.log(html);
    
    var allItems = tempContainer.querySelectorAll('#top > li');
    // No <li> on top level means there only one entry
    if (allItems.length === 0) {
        allItems = [tempContainer];
    }
    
    allItems.forEach(function(item) {
        // Skip items that are inside ul (they are examples)
        if (item.closest('ul')) return;
        
        // Get main text by removing the nested ul
        var text = item.cloneNode(true);
        addBrackets(text, 'span[typeof="mw:Transclusion"]');
        var nestedList = text.querySelector('ul');
        if (nestedList) nestedList.remove();
        result += index + '. ' + text.textContent.trim() + '\n';
        
        // Get examples from nested ul
        var examples = item.querySelectorAll('ul > li');
        examples.forEach(function(example) {
            if (hasExcludedWiktionaryCitationTemplate(example)) return;

            var exampleText = example.textContent.trim();
            result += '    - ' + exampleText + '\n';
        });
        
        index++;
    });
    
    copyToClipboard(result.trim());
}

function copyToClipboard(text) {
    console.log(text);
    navigator.clipboard.writeText(text);
}

document.addEventListener('copy', function(event) {
    console.log("copy triggered!");

    if (window.location.hostname === 'www.ravmilim.com') {
        ravMilimParser_v2();
    } else if (window.location.hostname === 'hebrew-academy.org.il') {
        if (!hebrewAcademyParser()) return;
    } else if (window.location.hostname === 'milog.co.il') {
        milogParser();
    } else if (window.location.hostname === 'he.wiktionary.org') {
        wiktionaryParser();
    } else {
        console.log("not a valid host");
        return;
    }

    // Prevent the default copy action
    event.preventDefault();
});
