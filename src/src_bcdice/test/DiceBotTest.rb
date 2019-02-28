# -*- coding: utf-8 -*-

require 'bcdiceCore'
require 'diceBot/DiceBotLoader'
require 'cgiDiceBot'
require 'DiceBotTestData'

class DiceBotTest
  def initialize(testDataPath = nil, dataIndex = nil)
    testBaseDir = File.expand_path(File.dirname(__FILE__))

    @testDataPath = testDataPath
    @dataIndex = dataIndex

    @dataDir = "#{testBaseDir}/data"
    @tableDir = "#{testBaseDir}/../../extratables"

    @bot = CgiDiceBot.new

    @testDataSet = []
    @errorLog = []

    $isDebug = !!@dataIndex
  end

  # テストを実行する
  # @return [true] テストを実行できたとき
  # @return [false] テストに失敗した、あるいは実行できなかったとき
  def execute
    readTestDataSet

    if @testDataSet.empty?
      $stderr.puts('No matched test data!')
      return false
    end

    doTests

    if @errorLog.empty?
      # テスト成功
      puts('OK.')

      true
    else
      errorLog = $RUBY18_WIN ? @errorLog.map(&:tosjis) : @errorLog

      puts('[Failures]')
      puts(errorLog.join("\n===========================\n"))

      false
    end
  end

  # テストデータを読み込む
  def readTestDataSet
    if @testDataPath
      # 指定されたファイルが存在しない場合、中断する
      return unless File.exist?(@testDataPath)

      targetFiles = [@testDataPath]
    else
      # すべてのテストデータを読み込む
      targetFiles = Dir.glob("#{@dataDir}/*.txt")
    end

    targetFiles.each do |filename|
      next if /^_/ === File.basename(filename)
      
      source =
        if RUBY_VERSION < '1.9'
          File.read(filename)
        else
          File.read(filename, :encoding => 'UTF-8')
        end
      
      dataSetSources = source.
        gsub("\r\n", "\n").
        tr("\r", "\n").
        split("============================\n").
        map(&:chomp)
      
      # ゲームシステムをファイル名から判断する
      gameType = File.basename(filename, '.txt')

      # TKfix
      begin
        require(File.expand_path("../diceBot/#{gameType}.rb", File.dirname(__FILE__)))
        #require_tree File.expand_path("../diceBot", File.dirname(__FILE__))
      rescue LoadError, StandardError => e
        debug("DiceBot load ERROR!!!", e.to_s)
        nil
      end
      # TKfix

      dataSet =
        if RUBY_VERSION < '1.9'
          dataSetSources.each_with_index.map do |dataSetSource, i|
            DiceBotTestData.parse(dataSetSource, gameType, i + 1)
          end
        else
          dataSetSources.map.with_index(1) do |dataSetSource, i|
            DiceBotTestData.parse(dataSetSource, gameType, i)
          end
        end
      
      @testDataSet += 
        if @dataIndex.nil?
          dataSet
        else
          dataSet.select { |data| data.index == @dataIndex }
        end
      
    end
  end
  
  
  private :readTestDataSet

  # 各テストを実行する
  def doTests
    @testDataSet.each do |testData|
      begin
        result = executeCommand(testData).lstrip

        unless result == testData.output
          @errorLog << logTextForUnexpected(result, testData)
          print('X')

          # テスト失敗、次へ
          next
        end
      rescue => e
        @errorLog << logTextForException(e, testData)
        print('E')

        # テスト失敗、次へ
        next
      end

      # テスト成功
      print('.')
    end

    puts
  end

  # ダイスコマンドを実行する
  def executeCommand(testData)
    rands = testData.rands
    @bot.setRandomValues(rands)
    @bot.setTest

    result = ''
    testData.input.each do |message|
      result += @bot.roll(message, testData.gameType, @tableDir).first
    end

    unless rands.empty?
      result += "\nダイス残り："
      result += rands.map { |r| r.join('/') }.join(', ')
    end

    result
  end

  # 期待された出力と異なる場合のログ文字列を返す
  def logTextForUnexpected(result, data)
    logText = <<EOS
Game type: #{data.gameType}
Index: #{data.index}
Input:
#{indent(data.input)}
Expected:
#{indent(data.output)}
Result:
#{indent(result)}
Rands: #{data.randsText}
EOS

    logText.chomp
  end
  private :logTextForUnexpected

  # 例外が発生した場合のログ文字列を返す
  def logTextForException(e, data)
    logText = <<EOS
Game type: #{data.gameType}
Index: #{data.index}
Exception: #{e.message}
Backtrace:
#{indent(e.backtrace)}
Input:
#{indent(data.input)}
Expected:
#{indent(data.output)}
Rands: #{data.randsText}
EOS

    logText.chomp
  end
  private :logTextForException

  # インデントした結果を返す
  def indent(s)
    target =
      if s.kind_of?(Array)
        s
      elsif s.kind_of?(String)
        s.lines
      else
        raise TypeError
      end

    target.map { |line| "  #{line.chomp}" }.join("\n")
  end
  private :indent
end
