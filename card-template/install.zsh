#!/bin/zsh

set -euo pipefail

readonly card_template_dir=${0:A:h}

cp "${card_template_dir}/anki.js" \
    "$HOME/Library/Application Support/Anki2/User 1/collection.media/_anki-script2.js"
