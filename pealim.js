const noun_ids = ["s", "p", "sc", "pc"];
const verb_ids = [
	"INF-L", "AP-ms", "AP-fs", "AP-mp",
	"PERF-1s", "PERF-1p", "PERF-2ms", "PERF-2fs", "PERF-2mp",
	"PERF-3ms", "PERF-3fs", "PERF-3p",
	"IMPF-1s", "IMPF-2ms", "IMPF-3mp"
	];
const adj_ids = ["ms-a", "fs-a", "mp-a", "fp-a"];
const data_w = {};
const data_tr = {};
const data_wr = {};

function myTr(text) {
  return text.replaceAll("е", "э").replaceAll("х", "кх").replaceAll("я", "йа");
}

function stripNiqqud(text) {
	var chars = Array.from(text).filter(c => {
        var code = c.charCodeAt(0);
        return (1488 <= code && code <= 1514) || (code <= 1000 && code !== 59 && code !== 34) || code === 1470 || (9312 <= code && code <= 9331);
    });
    var new_text = chars.join("");
	return new_text;
}

// Identifying Part of Speech (POS)
function containsString(paragraphs, string) {
	return Array.from(paragraphs).some(
		paragraph => paragraph.textContent.includes(string)
	);
}

function definePOS() {
	const pars = document.querySelectorAll('div.container p');

	if (containsString(pars, "Глагол")) {
		var POS = "verb";
	} else if (containsString(pars, "Существительное")) {
		var POS = "noun";
	} else if (containsString(pars, "Прилагательное")) {
		var POS = "adjective";
	}
	console.log(`POS detected: ${POS}`);
	return POS;
}

function findRoot() {
	const pars = document.querySelectorAll('div.container p');
	var root = undefined;

	for (const par of pars) {
		if (par.textContent.includes("Корень")) {
			root = par.querySelector("a")?.textContent.replaceAll(" ", "") || undefined;
			break;
		}
	}
	console.log(`Root: ${root}`);
	return root;
}

// Function for populating 3 data variable
function parseIDs(ids) {
	for (const id of ids) {
	    const parent = document.querySelector(`td.conj-td div#${id}`);
	    
	    if (parent) {
	        data_w[id] = parent.querySelector("span.menukad").textContent.trim();
	        const chaser = parent.querySelector("span.chaser");
	        if (chaser) {
	        	var written = chaser.textContent.replace(" ~ ", "");
	        } else {
	        	var written = stripNiqqud(data_w[id]);
	        }
	        data_wr[id] = written;
	        let trans_html = parent.querySelector("div.transcription").innerHTML;
	    	data_tr[id] = myTr(trans_html.replace(/<b>(.*?)<\/b>/g, '$1´'));

	    	console.log(`Data populated: ${data_w[id]} (${id})`);
	    }
	}
}

// Pattern for nouns
function patternNoun({ s, p, sc, pc }) {
	if (s) {
		return `${s}${p ? ` (${p})` : ''}${sc ? (pc ? `, ${sc} (${pc})` : `, ${sc}`) : ''}`;
	} else if (p) {
		return `${p}${pc ? `, ${pc}` : ''}`;
	}
}

// Pattern for adjectives
function patternAdj(objects) {
    return `${objects['ms-a']} / ${objects['fs-a']} / ${objects['mp-a']}`;
}

// Pattern for verbs
function patternVerb(objects, sep="") {
	// Grammar version
	// return `${objects['PERF-1s']} / ${objects['PERF-1p']}${sep}<br/>${objects['PERF-2ms']}, ${objects['PERF-2fs']} / ${objects['PERF-2mp']}${sep}<br/>${objects['PERF-3ms']}, ${objects['PERF-3fs']} / ${objects['PERF-3p']}${sep}<br/>${objects['INF-L']}`

	// Regular version
	return `${objects['AP-ms']} / ${objects['AP-fs']} / ${objects['AP-mp']} / ${objects['INF-L']}${sep}<br/>${objects['PERF-1s']} / ${objects['PERF-3ms']} / ${objects['PERF-3fs']}${sep}<br/>${objects['IMPF-1s']} / ${objects['IMPF-2ms']} / ${objects['IMPF-3mp']}`;
}

// Main function
function pealim() {
	var pos = definePOS();
	var root = findRoot();
	const pars = [];
	const texts = {};

	if (pos === "noun") {
		// NOUNS
		parseIDs(noun_ids);

		if ('sc' in data_w && 'pc' in data_w) {
			if (data_tr['s'] == data_tr['sc'].replace("-", "")) {
				if (data_w['s'] === data_w['sc'].replace("־", "")) {
					[data_w, data_tr, data_wr].forEach(el => el["sc"] = "~");
				} else {
					data_tr['sc'] = "~";
				}
			}
			if (data_tr['p'] == data_tr['pc'].replace("-", "")) {
				if (data_w['p'] === data_w['pc'].replace("־", "")) {
					[data_w, data_tr, data_wr].forEach(el => el["pc"] = "~");
				} else {
					data_tr['pc'] = "~";
				}
			}
		}

		var text_w = patternNoun(data_w);
		var text_tr = patternNoun(data_tr);
		var text_wr = patternNoun(data_wr);
	} else if (pos === "adjective") {
		// ADJECTIVES
		parseIDs(adj_ids);

		var text_w = patternAdj(data_w);
		var text_tr = patternAdj(data_tr);
		var text_wr = patternAdj(data_wr); 
	} else if (pos === "verb") {
		// VERBS
		parseIDs(verb_ids);

		var text_w = patternVerb(data_w, sep=";");
		var text_tr = patternVerb(data_tr);
		var text_wr = patternVerb(data_wr);
	}

	console.log(`Text extracted: ${text_w}`);

	texts["Niqqud"] = text_w;
	texts["Transcription"] = text_tr;

	// Writing result into the DOM
	const target = document.querySelector("table.conjugation-table");
	const par_w = document.createElement('p');
	par_w.dir = "rtl";
	par_w.style.textAlign = "left";
	par_w.innerHTML = text_w;

	const par_tr = document.createElement('p');
	par_tr.innerHTML = text_tr;

	if (stripNiqqud(text_w) !== text_wr.replaceAll(";", "")) {
		const par_wr = document.createElement('p');
		par_wr.dir = "rtl";
		par_wr.style.textAlign = "left";
		par_wr.innerHTML = text_wr;

		pars.push(par_wr, par_w, par_tr);
		texts["Word"] = text_wr;
	} else {
		pars.push(par_w, par_tr);
	}

	if (root) {
		const par_r = document.createElement('p');
		par_r.innerHTML = root;
		pars.push(par_r);
		texts["Root"] = root;
	}

	target.before(...pars);
	navigator.clipboard.writeText(
		// pars.map(p => p.innerText).join('|')
		JSON.stringify(texts)
	);
}

// Delay Pealim function by 2 seconds
setTimeout(pealim, 2000);
