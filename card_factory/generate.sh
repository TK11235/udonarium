#!/bin/bash
set -euxo pipefail

TARGET_DIR="${1:-*}"

SCRIPT_DIR=$(dirname "$0")
cd "${SCRIPT_DIR}"

#cd ../ # go to root dir

: "Generate card HTML"
node generate_html.js

OUTPUT_HTML_DIR_PATH="app/v1/card_html";
OUTPUT_IMAGE_DIR_PATH="../src/assets/images/card_factory";

for dir in ${OUTPUT_HTML_DIR_PATH}/${TARGET_DIR};
do
  for html in ${dir}/*.html;
  do
    dirname=${dir##*/}
    filename=${html##*/}
    output_image_dir_path="${OUTPUT_IMAGE_DIR_PATH}/${dirname}/${filename%.html}.png"
    mkdir -p "${OUTPUT_IMAGE_DIR_PATH}/${dirname}"
    node app/v1/js/pupperteer.js "$(pwd)/${html}" "${output_image_dir_path}"
  done
done
