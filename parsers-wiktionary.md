# Hebrew Wiktionary citation detection

## Goal

When copying definitions from Hebrew Wiktionary, keep ordinary usage examples but exclude quotations from classical Jewish sources.

## Findings from the saved HTML samples

Both `parsers-wiktionary.html` and `parsers-wiktionary-v2.html` contain three Tanakh quotations. Each quotation's `<li>` contains a MediaWiki transclusion element with:

```html
<span typeof="mw:Transclusion" data-mw="...">
```

The JSON stored in `data-mw` identifies the template that generated the quotation:

```json
{
  "template": {
    "target": {
      "wt": "צט/תנ\"ך"
    }
  }
}
```

After parsing the attribute with `JSON.parse`, the template name is `צט/תנ"ך`.

The three Tanakh examples in each sample use that template, while the three ordinary examples have no citation-template metadata. The samples also contain unrelated definition templates such as `בהשאלה` and `משלב`. Therefore, the parser must inspect templates inside each example `<li>` and compare their names against an explicit list; it must not reject every `mw:Transclusion` element.

## Findings from live Hebrew Wiktionary

Hebrew Wiktionary provides dedicated templates for several classical sources. Their common rendered citation formats include:

| Source | Template | Common rendered form |
| --- | --- | --- |
| Tanakh | `צט/תנ"ך` | `(ויקרא יט, פסוק יח)` or `(ויקרא יט, פסוקים יח–יט)` |
| Mishnah | `צט/משנה` | `(משנה, מסכת אבות – פרק ה, משנה כא)` |
| Tosefta | `צט/תוספתא` | `(תוספתא, מסכת נגעים – פרק ה, הלכה יא)` |
| Babylonian Talmud | `צט/בבלי` | `(בבלי, מסכת בבא בתרא – דף עו, עמוד א)` |
| Jerusalem Talmud | `צט/ירושלמי` or `צט/ירושלמי הלכה` | Commonly contains `ירושלמי`, `מסכת`, and a chapter or page |
| Midrash Rabbah | `צט/רבה` | `(בראשית רבה, פרשה לז, סימן א)` |

Relevant Wiktionary documentation:

- [Citation-template category](https://he.wiktionary.org/wiki/קטגוריה:תבניות_ציטוט)
- [Tanakh template](https://he.wiktionary.org/wiki/תבנית:צט/תנ%22ך)
- [Babylonian Talmud template](https://he.wiktionary.org/wiki/תבנית:צט/בבלי)
- [Tosefta template](https://he.wiktionary.org/wiki/תבנית:צט/תוספתא)
- [Midrash Rabbah template](https://he.wiktionary.org/wiki/תבנית:צט/רבה)

Older or manually edited pages are not completely consistent. They may contain a citation written as plain text instead of through a template.

## First implementation

For every example `<li>`, the parser:

1. Finds descendants matching `[typeof~="mw:Transclusion"][data-mw]`.
2. Parses each `data-mw` JSON value.
3. Reads template names from `parts[].template.target.wt`.
4. Removes an optional `תבנית:` prefix and surrounding whitespace.
5. Excludes the example if a template name is in the configured set of classical citation templates.

The initial excluded set is:

```text
צט/תנ"ך
צט/משנה
צט/תוספתא
צט/בבלי
צט/ירושלמי
צט/ירושלמי הלכה
צט/רבה
```

This version intentionally has no text-pattern fallback. It should reliably handle template-generated citations without treating generic words such as `פרק` as proof that an example is classical. Consequently, a modern source such as `(רוברט לואיס סטיבנסון, אי המטמון. פרק 22)` remains included.

## Limitation to verify in real use

Classical quotations written manually without a recognized citation template will remain included. Real-world testing will show whether those entries are frequent enough to justify a second, text-based fallback.
