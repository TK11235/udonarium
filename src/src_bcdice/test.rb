# -*- coding: utf-8 -*-

# ダイスボットのテストを起動するプログラム
#
# 引数の数によって処理が変わる
#
# [0個] すべてのテストデータを使用してテストを行う
# [1個] 指定したテストデータを使用してテストを行う。
#       「.txt」で終わっていればテストデータのパスと見なす。
# [2個] 最初の引数でテストデータを指定し、2番目の引数で番号を指定する

if RUBY_VERSION < '1.9'
  $KCODE = 'u'
end

rootDir = File.expand_path(File.dirname(__FILE__))
libPaths = [
  "#{rootDir}/test",
  rootDir,
]
libPaths.each do |libPath|
  $:.push(libPath)
end

require 'test/setup'
require 'DiceBotTest'

# 引数を解析してテストデータファイルのパスを返す
getTestDataPath = lambda do |arg|
  arg.end_with?('.txt') ? arg : "#{rootDir}/test/data/#{arg}.txt"
end

# テストデータファイルのパス
testDataPath = nil
# テストデータ番号
dataIndex = nil

HELP_MESSAGE = "Usage: #{File.basename($0)} [TEST_DATA_PATH] [DATA_INDEX]".freeze

if ARGV.include?('-h') || ARGV.include?('--help')
  $stdout.puts(HELP_MESSAGE)
  exit
end

case ARGV.length
when 0
when 1
  # テストデータを指定する
  testDataPath = getTestDataPath[ARGV[0]]
when 2
  # テストデータおよびテストデータ番号を指定する
  testDataPath = getTestDataPath[ARGV[0]]
  dataIndex = ARGV[1].to_i
else
  warn(HELP_MESSAGE)
  abort
end

success = DiceBotTest.new(testDataPath, dataIndex).execute
abort unless success
