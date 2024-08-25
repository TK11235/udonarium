import os
from pathlib import Path

# 定数
DATA_CARD_TEMPLATE_PATH = Path("data_card.xml.template")
DATA_TEMPLATE_PATH = Path("data.xml.template")
OUTPUT_DIR = Path("output_cards")
OUTPUT_DATA_PATH = Path(f"{OUTPUT_DIR}/data.xml")

FRONT_IMAGE_DIR_PREFIX = Path("../assets/images/card_factory")
BACK_IMAGE_DIR = Path("../assets/images/裏面")

def find_jpg_file(directory: Path, sub_dir_name: str) -> Path:
    """指定されたディレクトリ内の特定のサブディレクトリに対応するJPGファイルを見つける。"""
    return next(directory.glob(f"{sub_dir_name}.*"))

def read_file(file_path: Path) -> str:
    """ファイルの内容を読み込む。"""
    return file_path.read_text(encoding="utf-8")

def write_file(file_path: Path, content: str) -> None:
    """ファイルに内容を書き込む。"""
    file_path.write_text(content, encoding="utf-8")

def process_subdirectory(sub_dir: Path, back_image_value: Path) -> str:
    """サブディレクトリ内のすべてのPNGファイルを処理し、連結された内容を返す。"""
    concatenated_content = []

    for png_file in sub_dir.glob("*.png"):
        data_card_content = read_file(DATA_CARD_TEMPLATE_PATH)
        data_card_content = data_card_content.replace("${FROMT_IMAGE}", f"{png_file}")
        data_card_content = data_card_content.replace("${BACK_IMAGE}", f"{back_image_value}")
        concatenated_content.append(data_card_content)

    return "".join(concatenated_content)

def replace_placeholders_in_template(template_content: str, sub_dir_name: str, card_content: str) -> str:
    """テンプレートの内容にあるプレースホルダーを生成されたカード内容で置換する。"""
    return template_content.replace(rf"${{{sub_dir_name}}}", card_content)

def main():
    # 出力ディレクトリが存在しない場合は作成
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # メインテンプレートファイルを読み込む
    data_template_content = read_file(DATA_TEMPLATE_PATH)

    # フロント画像ディレクトリ内の各サブディレクトリを処理
    for sub_dir in FRONT_IMAGE_DIR_PREFIX.iterdir():
        if sub_dir.is_dir():
            sub_dir_name = sub_dir.name

            # 各サブディレクトリに対応するJPGファイルを取得
            back_image_value = find_jpg_file(BACK_IMAGE_DIR, sub_dir_name)

            concatenated_content = process_subdirectory(sub_dir, back_image_value)

            # 連結された内容を新しいXMLファイルとして保存
            output_file_path = OUTPUT_DIR / f"data_card_{sub_dir_name}.xml"
            write_file(output_file_path, concatenated_content)

            # メインテンプレート内の対応するプレースホルダーを置換
            data_template_content = replace_placeholders_in_template(data_template_content, sub_dir_name, concatenated_content)

    # 最終的なデータファイルを保存
    write_file(OUTPUT_DATA_PATH, data_template_content)

if __name__ == "__main__":
    main()
