/* .rb ファイルと同じ階層に .js が生成されている必要がある */
const fs = require('fs');
const path = require('path');

const DiceBotDir = path.join(__dirname, './diceBot/');
const DataDir = path.join(__dirname, './test/data/');

const diceBots = fs.readdirSync(DiceBotDir).filter(file => file.match(/\.js$/));
const files = fs.readdirSync(DataDir).filter(file => file.match(/\.txt$/));

require('./cgiDiceBot.js');

const errorLog = [];

Opal.gvars.isDebug = false;
const cgiDiceBot = Opal.CgiDiceBot.$new();

files.forEach(file => {
  const gameType = file.replace(/\.txt$/, '');
  if (!diceBots.includes(gameType + '.js')) return;

  process.stdout.write(`\n${gameType} `);

  require(DiceBotDir + gameType);
  fs.readFileSync(path.join(DataDir, file)).toString()
    .replace(/\r/g, '')
    .split(/=+\n/g)
    .filter(a => a)
    .forEach((test, index) => {
      const testData = test.match(/input:((.|\n)*)?output:((.|\n)*)rand:((.|\n)*)/);

      const input = testData[1].trim();
      const output = testData[3].trim();
      const rands = testData[5].trim();
      const dir = [];

      let resultMsg = '';

      try {
        cgiDiceBot.$setRandomValues(rands.split(/,/g).map(a => a.split(/\//g)));
        cgiDiceBot.$setTest(true);

        const result = cgiDiceBot.$roll(input, gameType, dir);
        resultMsg = result[0].trim();

        const surplusRands = getSurplusRands(cgiDiceBot.rands);
        if (0 < surplusRands.length) resultMsg += 'ダイス残り：' + surplusRands;

      } catch (e) {
        resultMsg = logTextForException(e);
      }

      if (resultMsg == output) {
        process.stdout.write('.');
      } else {
        process.stdout.write('x');
        const log = logTextForUnexpected(gameType, index, input, output, resultMsg, rands);
        errorLog.push(log);
      }
    });
});

process.stdout.write('\n');
if (errorLog.length < 1) console.log('OK.');
errorLog.forEach(log => console.log(log));

function logTextForUnexpected(gameType, index, input, output, result, rands) {
  return `Game type: ${gameType} Index: ${index}
Input:     ${input}
Expected:  ${output}
Result:    ${result}
Rands:     ${rands}`;
}

function logTextForException(e) {
  return `
---JS---
${e.message}
${e.fileName} (${e.lineNumber})
${e.stack}
---Opal---
$@ -> ${Opal.gvars['@']}
$! -> ${Opal.gvars['!']}`;
}

function getSurplusRands(rands) {
  return rands.map(r => r.join('/')).join(', ');
}
