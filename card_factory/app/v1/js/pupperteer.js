// puppeteer.js
const puppeteer = require('puppeteer');
let browser = null;
(async () => {
  const inputHtmlPath = process.argv[2];
  const outputImagePath = process.argv[3];
  if (!inputHtmlPath || !outputImagePath) {
    throw new Error('Specify input and output.');
  }
  // ブラウザを起動
  browser = await puppeteer.launch({
    headless: true,
    args: [
            '--lang=ja',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
    slowMo: 200
  });
  // 新規ページ (タブに相当) で対象のファイルを開く
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ja-JP'
  });
  await page.goto(`file://${inputHtmlPath}`);
  // ページコンテキスト内でスクリーンショット対象の要素を取得
  // 注: 出力画像のサイズを要素と一致させるために必要
  const selector = '.card';
  const targetElement = await page.$(selector);
  // 要素をスクリーンショット
  await targetElement.screenshot({
    path: outputImagePath
  });
})().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => {
  if (browser) browser.close();
})
