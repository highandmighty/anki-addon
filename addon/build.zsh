#!/bin/zsh

set -euo pipefail

readonly addon_dir=${0:A:h}

cd "${addon_dir}"
zip -FS -r hebrew_addon.ankiaddon \
    __init__.py \
    manifest.json \
    assets \
    -x 'assets/*.psd'
