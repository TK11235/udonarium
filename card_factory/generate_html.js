const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// CSVファイルが格納されている親ディレクトリのパス
const parentCsvDirPath = 'source_csv';

// HTMLテンプレートのパス
const htmlTemplatePath = 'html/template.html';

const outputDirPathPrefix = 'app/v1/card_html';//'../src/assets/images/card_factory';

// HTMLテンプレートの読み込み
const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');

fs.readdir(parentCsvDirPath, (err, files) => {
  if (err) {
    console.error('Could not list the parent directory.', err);
    process.exit(1);
  }

  // CSVファイルのフィルタリング
  const csvFiles = files.filter(file => file.startsWith('無限カード生成 - ') && file.endsWith('.csv'));

  // CSVファイルを順番に処理
  csvFiles.forEach((file) => {
    const csvFilePath = path.join(parentCsvDirPath, file);

    // 出力ディレクトリ名を生成
    const outputFileName = file.replace('無限カード生成 - ', '').replace('.csv', '');
    const outputFilePath = path.join(outputDirPathPrefix, outputFileName);

    // 出力ディレクトリが存在しない場合は作成
    if (!fs.existsSync(outputFilePath)) {
      fs.mkdirSync(outputFilePath, { recursive: true });
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const cardName = row['名前'];
        let content = '';

        // 名前以外のすべてのヘッダーを{コンテンツ}部分に置換
        for (let [key, value] of Object.entries(row)) {
          if (key !== '名前') {
            content += `<p>${key}: ${value.replace(/\n/g, '<br>')}</p><br>\n`;
          }
        }

        // HTMLテンプレートの置換
        let outputHtml = htmlTemplate.replace(/{カードタイプ}/g, outputFileName).replace(/{名前}/g, cardName).replace(/{コンテンツ}/g, content);

        // 出力HTMLファイルパスを生成
        const outputHtmlPath = path.join(outputFilePath, `${cardName}.html`);

        // 出力HTMLファイルに追記
        fs.writeFileSync(outputHtmlPath, outputHtml, 'utf8');
      })
      .on('end', () => {
        console.log(`CSV file ${file} successfully processed.`);
      });
  });
});
