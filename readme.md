# Hebrew tools for Anki

## Browser scripts

### `parsers.js`

A copy-event handler for Hebrew dictionary websites. It recognizes definitions
selected on Rav-Milim, the Academy of the Hebrew Language, Milog, and Hebrew
Wiktionary, then copies them as consistently formatted numbered definitions
with indented examples.

### `pealim.js`

A browser snippet that extracts a Pealim dictionary entry and copies it as JSON
for use in an Anki note. It handles nouns, adjectives, and verbs and collects
the relevant pointed spelling, transcription, unpointed spelling, and root.

The variables above the `MINIFY STARTING FROM HERE!` marker configure the verb
form layout and delimiter for the environment where the snippet is embedded.

## Anki add-on

This repository also contains my custom Anki add-on for various Hebrew-learning
tasks. It adds editor controls that can:

- paste the JSON produced by `pealim.js` into the corresponding note fields;
- remove niqqud from selected Hebrew text;
- normalize Russian transcription;
- find other notes in the current deck with the same Hebrew root.

The add-on also converts parenthesized definition numbers to circled numbers and
applies the required formatting to semicolons when editor HTML is processed.

## Anki card template

The `card-template` project stores the source for my Hebrew Anki card templates.
The `card-template/templates/` directory contains the exemplary front and back
HTML for the three card directions, their shared CSS, and a JSON mapping of
Anki note-type IDs and template names. All Hebrew note types use these same
template sources, so duplicate per-note-type HTML and CSS are not stored.

`card-template/anki.js` compares the pointed and unpointed Hebrew forms and
highlights spelling differences when a card is displayed. The card templates
load it from Anki's collection media, and `card-template/install.zsh` copies it
into that directory.

### Synchronizing card templates

`card-template/sync-templates.py` synchronizes the Hebrew template HTML and CSS
through AnkiConnect. Anki must be running with AnkiConnect installed. Commands
without `--apply` only preview the changes.

Preview and then push the exemplary repository files to the other Hebrew note
types:

```sh
python3 card-template/sync-templates.py
python3 card-template/sync-templates.py --apply
```

Add `--include-source` to also replace the `Hebrew (3 cards)` templates in Anki:

```sh
python3 card-template/sync-templates.py --include-source --apply
```

To synchronize in the opposite direction, preview and then pull the live
`Hebrew (3 cards)` HTML and CSS into the exemplary repository files:

```sh
python3 card-template/sync-templates.py --pull-source
python3 card-template/sync-templates.py --pull-source --apply
```

## Personal Hebrew dictionary

The repository also serves a personal Hebrew dictionary built from my Anki
notes database. `dictionary/export.py` exports the relevant notes to
`docs/anki-table.json`, and [`docs/anki-table.html`](docs/anki-table.html) is the
dictionary's web interface.

The interface presents the notes as a searchable and sortable table. An entry
can be expanded to show all of its Anki fields, with controls for copying
individual values back into an Anki note. It also adjusts copied forms for
desktop and Android formatting conventions.

## Minifying JavaScript

Run these scripts from the repository root. They use the locally installed
Homebrew `swc` executable and validate the generated JavaScript with Node.js.

### `parsers.js`

```zsh
#!/bin/zsh

set -euo pipefail

swc compile \
    --config-json '{"minify":true,"jsc":{"target":"es2022","minify":{"compress":true,"mangle":true}}}' \
    parsers/parsers.js \
    --out-file docs/parsers-min.js

node --check docs/parsers-min.js
```

### `pealim.js`

The settings above the `MINIFY STARTING FROM HERE!` marker are intentionally
excluded from the hosted file.

```zsh
#!/bin/zsh

set -euo pipefail

sed '1,/^\/\/ MINIFY STARTING FROM HERE!$/d' pealim/pealim.js | \
    swc compile \
        --filename pealim/pealim.js \
        --config-json '{"minify":true,"jsc":{"target":"es2022","minify":{"compress":true,"mangle":true}}}' \
        --out-file docs/pealim-min.js

node --check docs/pealim-min.js
```
