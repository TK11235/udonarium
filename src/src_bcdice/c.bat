for /r ./dicebot %%i in (*.rb) do (
    opal -cO -I ./ -s 'kconv' %%i > dicebot/%%~ni.js
)
opal -c -I ./ -s 'kconv' cgiDiceBot.rb > cgiDiceBot.js