const scriptUrl = 'https://highandmighty.github.io/anki-addon/parsers-min.js';

const customScript = document.createElement('script');
customScript.src = scriptUrl;
customScript.type = 'text/javascript';
customScript.async = true;

document.head.appendChild(customScript);
