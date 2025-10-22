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
            const explanation = group.querySelector(
                '[class*="Search_full_analyze_explanation"]:not([class*="group"]):not([class*="example"])');
            if (!explanation) return;
            
            markdown += processExplanation(explanation);
        });
    }
    
    // console.log(markdown.trim());
    copyToClipboard(markdown.trim());
}

function hebrewAcademyParser() {
    var selectedText = window.getSelection().toString();
    
    var lines = selectedText.trim().split('\n');
    var numberedLines = lines.map(function(line, index) {
        var trimmedLine = line.trim();
        return index + 1 + '. ' + trimmedLine;
    });
    var formattedText = numberedLines.join('\n');
    
    copyToClipboard(formattedText);
}

function milogParser() {
    var html = document.getSelection().getRangeAt(0).cloneContents();
    var result = '';
    console.log(html);
    
    var allItems = html.querySelectorAll('.ent_para');
    if (allItems.length === 0) {
        copyToClipboard(`1. ${html.textContent}`);
        return;
    }
    
    allItems.forEach((para, index) => {
        var text = para.querySelector('.ent_para_text').textContent.trim();
        result += `${index + 1}. ${text}\n`;
    });

    // Dettaching examples
    result = result.trim().replace(/\s"([^"]+)"/g, '\n    - $1');
    
    copyToClipboard(result);
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
            result += '    - ' + example.textContent.trim() + '\n';
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
        hebrewAcademyParser();
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