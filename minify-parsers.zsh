#!/bin/zsh

set -euo pipefail

readonly script_dir=${0:A:h}
readonly source_file="${script_dir}/parsers.js"
readonly output_file="${script_dir}/docs/parsers-min.js"
readonly minifier_url="https://www.toptal.com/developers/javascript-minifier/api/raw"

temporary_file=$(mktemp "${TMPDIR:-/tmp}/parsers-min.XXXXXX")
trap 'rm -f "${temporary_file}"' EXIT

curl --fail --silent --show-error \
    --request POST \
    --data-urlencode "input@${source_file}" \
    --output "${temporary_file}" \
    "${minifier_url}"

if [[ ! -s "${temporary_file}" ]]; then
    print -u2 "The minifier returned an empty response."
    exit 1
fi

node --check --input-type=commonjs < "${temporary_file}"
mv "${temporary_file}" "${output_file}"
trap - EXIT

print "Minified ${source_file} -> ${output_file}"
