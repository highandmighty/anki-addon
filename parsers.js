function ravMilimParser() {
    var text = window.getSelection().toString();
    var modified = text.trim().replace(/•\s/g, "    - ");
    copyToClipboard(modified);
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
    var paragraphs = html.querySelectorAll('.ent_para');
    var result = '';
    
    paragraphs.forEach((para, index) => {
        var text = para.querySelector('.ent_para_text').textContent.trim();
        result += `${index + 1}. ${text}\n`;
    });
    
    copyToClipboard(result);
}

function wiktionaryParser() {
    var html = document.getSelection().getRangeAt(0).cloneContents();
    var allItems = html.querySelectorAll('li');
    var result = '';
    var index = 1;
    
    allItems.forEach(function(item) {
        // Skip items that are inside ul (they are examples)
        if (item.closest('ul')) return;
        
        // Get main text by removing the nested ul
        var text = item.cloneNode(true);
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
    
    copyToClipboard(result);
}

function copyToClipboard(text) {
    console.log(text);
    navigator.clipboard.writeText(text);
}

document.addEventListener('copy', function(event) {
    console.log("copy triggered!");

    if (window.location.hostname === 'www.ravmilim.co.il') {
        ravMilimParser();
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