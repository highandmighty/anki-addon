// 'past' or 'future' or else
var VERB_PATTERN="reg";

// ' /' for Anki on Android or ',' for Anki on iPhone
var DELIMETER=" /";

const scriptUrl = 'https://highandmighty.github.io/anki-addon/pealim-min.js';

const script = document.createElement('script');
script.src = scriptUrl;
script.type = 'text/javascript';
script.async = true;

document.head.appendChild(script);
