// var text_naked = "ניתן / ניתנת / ניתנים / להינתן ②<br>" +
// "ניתתי / ניתן / ניתנה<br>" +
// "אנתן / תינתן / יינתנו<br>" +
// "②: רשות לא ניתנת / ניתן למצוא<br>" +
// "בהינתן...";


// var text_full = "נִתָּן / נִתֶּנֶת / נִתָּנִים / לְהִנָּתֵן ②<span>;</span><br>" +
// "נִתַּתִּי / נִתַּן / נִתְּנָה<span>;</span><br>" +
// "אֶנָּתֵן / תִּנָּתֵן / יִנָּתְנוּ<span>;</span><br>" +
// "②: רְשׁוּת לא ניתנת / ניתן למצוא<span>;</span><br>" + 
// "בְּהִינָּתֵן...";

function test_function(id) {
    var element = document.getElementById(id);
    if (element) {
        element.style.color = "red";
        element.textContent += " (test)";
    }
}

function strip_html(string) {
    var div = document.createElement("div");
	console.log(string);
    div.innerHTML = string.replace(/<br>/g, "\n");
    return div.innerText;
}

function isAllowed(char) {
    // Unicode ranges for Hebrew characters and other allowed characters
    const HEBREW_START = 1488;  // U+05D0 א
    const HEBREW_END = 1514;    // U+05EA ת
    const MAX_ASCII = 1000;     // U+03E8
    const SEMICOLON = 59;       // U+003B ;
    const DOUBLE_QUOTE = 34;    // U+0022 "
    const SINGLE_QUOTE = 39;    // U+0027 '
    const NIQQUD_MAQAF = 1470;  // U+05BE ־
    const CIRCLED_NUMBERS_START = 9312;  // U+2460 ①
    const CIRCLED_NUMBERS_END = 9331;    // U+2473 ⑳

    // Characters to exclude from the filtered text
    const ALLOWED_CHARS = [SEMICOLON, DOUBLE_QUOTE, SINGLE_QUOTE];

    var code = char.charCodeAt(0);
    return (HEBREW_START <= code && code <= HEBREW_END) || 
           (code <= MAX_ASCII && !ALLOWED_CHARS.includes(code)) || 
           code === NIQQUD_MAQAF || 
           (CIRCLED_NUMBERS_START <= code && code <= CIRCLED_NUMBERS_END);
}

function stripNiqqud(text) {
    var chars = Array.from(text).filter(isAllowed);
    var new_text = chars.join("");
    return new_text;
}

function highlightExtra(string_niqqud, string_full) {
    let result = '';
    let j = 0;
    for (let i = 0; i < string_full.length; i++) {
        console.log(`${string_full[i]}:${string_niqqud[j]}`);
        if (string_full[i] === string_niqqud[j]) {
            // Same character in both strings
            result += string_niqqud[j];
            j++;
        } else if (!isAllowed(string_niqqud[j])) {
            // Niqqud
            console.log(`Element number ${j} is niqqud: ${string_niqqud[j]}`);
            result += string_niqqud[j];
            j++;
            i--;  // One more lap
        } else {
            // Character in written form is different
            console.log(`Element number ${i} is different: ${string_full[i]}`);
            result += `<span class="marked">${string_full[i]}</span>`;
        }
    }
    return result;
}

function update_niqqud(niqqud_field, written_field, id) {
    var niqqud = strip_html(niqqud_field);
    var written = strip_html(written_field);
    // console.log(written);
    var stripped = stripNiqqud(niqqud);
    console.log(stripped);

    if (stripped !== written) {
        var highlighted = highlightExtra(niqqud, written);
        highlighted = highlighted.replace(/\n/g, "<br>");
        highlighted = highlighted.replace(/;/g, "<span>;</span>");
        document.getElementById(id).innerHTML = highlighted;
    }
}