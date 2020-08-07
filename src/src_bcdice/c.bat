@echo off
echo START
set RUBYOPT=-EUTF-8
mkdir lib\diceBot
for /r ./dicebot %%i in (*.rb) do (
    opal -cO -I ./ -s 'kconv' %%i > lib/dicebot/%%~ni.js | echo %%~ni
)
opal -c -I ./ -s 'kconv' cgiDiceBot.rb > lib/cgiDiceBot.js | echo cgiDiceBot
echo OK