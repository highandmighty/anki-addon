// ==UserScript==
// @name         Milog Parser Test
// @namespace    http://tampermonkey.net/
// @version      2026-08-22
// @description  Format copied Milog definitions for Anki
// @author       Arseny Afonin
// @match        https://milog.co.il/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=milog.co.il
// @grant        none
// ==/UserScript==

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

function copyToClipboard(text) {
    console.log(text);
    navigator.clipboard.writeText(text);
}

document.addEventListener('copy', function(event) {
    console.log('copy triggered!');
    milogParser();

    // Prevent the browser from replacing the parsed text with the selection.
    event.preventDefault();
});
