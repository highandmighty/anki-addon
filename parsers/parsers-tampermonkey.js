// ==UserScript==
// @name         Hebrew Dictionary Parsers
// @namespace    http://tampermonkey.net/
// @version      2026-08-22
// @description  Load Anki parser helpers on supported Hebrew dictionary sites
// @author       Arseny Afonin
// @match        https://www.ravmilim.com/*
// @match        https://hebrew-academy.org.il/*
// @match        https://milog.co.il/*
// @match        https://he.wiktionary.org/*
// @grant        GM_addElement
// ==/UserScript==

GM_addElement('script', {
  src: 'https://highandmighty.github.io/anki-addon/parsers-min.js',
  type: 'text/javascript'
});
