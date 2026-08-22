// ==UserScript==
// @name         Wiktionary Parser Test
// @namespace    http://tampermonkey.net/
// @version      2026-08-22
// @description  Format copied Hebrew Wiktionary definitions for Anki
// @author       Arseny Afonin
// @match        https://he.wiktionary.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wiktionary.org
// @grant        none
// ==/UserScript==

function addBrackets(element, selector) {
    element.querySelectorAll(selector).forEach(elem => {
        const newFrag = document.createRange()
            .createContextualFragment(`(${elem.innerHTML})`);
        elem.parentNode.replaceChild(newFrag, elem);
    });
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

    // Temp wrapper to target only top-level <li> elements.
    var tempContainer = document.createElement('div');
    tempContainer.id = 'top';
    tempContainer.appendChild(html);

    var result = '';
    var index = 1;
    console.log(html);

    var allItems = tempContainer.querySelectorAll('#top > li');

    // No top-level <li> means there is only one entry.
    if (allItems.length === 0) {
        allItems = [tempContainer];
    }

    allItems.forEach(function(item) {
        // Skip items inside a <ul>; they are examples.
        if (item.closest('ul')) return;

        // Get the definition without its nested examples.
        var text = item.cloneNode(true);
        addBrackets(text, 'span[typeof="mw:Transclusion"]');
        var nestedList = text.querySelector('ul');
        if (nestedList) nestedList.remove();
        result += index + '. ' + text.textContent.trim() + '\n';

        // Add examples that do not come from excluded citation templates.
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
    console.log('copy triggered!');
    wiktionaryParser();

    // Prevent the browser from replacing the parsed text with the selection.
    event.preventDefault();
});
