// ==UserScript==
// @name         Pealim Parser
// @namespace    http://tampermonkey.net/
// @version      2025-07-27
// @description  try to take over the world!
// @author       Arseny Afonin
// @match        https://www.pealim.com/ru*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pealim.com
// @grant        GM_addElement
// ==/UserScript==

// 'past' or 'future' or empty
var VERB_PATTERN = "reg";

// ' /' for Android or ',' for iPhone
var DELIMETER = " /";

GM_addElement('script', {
  textContent: `window.VERB_PATTERN = "${VERB_PATTERN}"; window.DELIMETER = "${DELIMETER}";`
});

GM_addElement('script', {
  src: 'https://highandmighty.github.io/anki-addon/pealim-min.js',
  type: 'text/javascript'
});