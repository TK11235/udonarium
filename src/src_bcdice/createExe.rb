#!/bin/ruby -Ku
# -*- coding: utf-8 -*-

require 'fileutils'

bcdiceRoot = File.expand_path(File.dirname(__FILE__))
$LOAD_PATH.unshift(bcdiceRoot) unless $LOAD_PATH.include?(bcdiceRoot)

require 'diceBot/DiceBotLoader'

def updateConfig
  nameList = DiceBotLoader.collectDiceBots.
    map { |diceBot| diceBot.gameType.gsub(' ', '_') }.
    sort
  writeToConfig(nameList)
end

def writeToConfig(nameList)
  fileName = 'configBcDice.rb'
  text = File.readlines(fileName).join

  text.gsub!(/\$allGameTypes = \%w\{.+\}/m) do
    "$allGameTypes = %w{\n" + nameList.join("\n") + "\n}"
  end

  File.open(fileName, "wb+") do |file|
    file.write(text)
  end
end

updateConfig

# EXEファイルをocraでコンパイルする時用に
# __createExe__.txt という名前で一時ファイルを用意しておく。
#
# B&C はこのファイルがある場合には全ダイスボットを読み込んで自動的に終了する。
# こうしないと、EXEの中に全ダイスボットの情報が出力されないため。
#
# exerb では exerb bcdice.rb createExe のように
# createExe という引数を渡すことで上記の全ダイスボット読み込みモードで起動させていたが、
# ocra ではEXEコンパイル時に渡した引数は EXE 起動時にも強制的に付与されるため、
# 一時ファイルを作ることでコンパイル時かどうかを区別しています。
#
compileMarkerFile = "__createExe__.txt"
File.open(compileMarkerFile, "w+") { |f| f.write("") }

`ocra bcdice.rb -- createExe`
sleep 2
FileUtils.move('bcdice.exe', '..')

FileUtils.remove(compileMarkerFile)
