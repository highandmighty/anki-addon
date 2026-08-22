// ==UserScript==
// @name         Hebrew Academy Parser Test
// @namespace    http://tampermonkey.net/
// @version      2026-08-22
// @description  Format copied Hebrew Academy definitions for Anki
// @author       Arseny Afonin
// @match        https://hebrew-academy.org.il/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hebrew-academy.org.il
// @grant        none
// ==/UserScript==

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

function copyToClipboard(text) {
    console.log(text);
    navigator.clipboard.writeText(text);
}

document.addEventListener('copy', function(event) {
    console.log('copy triggered!');
    if (!hebrewAcademyParser()) return;

    // Prevent the browser from replacing parsed definitions with the selection.
    event.preventDefault();
});
