# -*- coding: utf-8 -*-

# ダイスボットのテストデータを表すクラス
class DiceBotTestData
  # ゲームシステム
  attr_reader :gameType
  # テスト番号
  attr_accessor :index
  # 入力コマンド文字列の配列
  attr_reader :input
  # 期待される出力文字列
  attr_reader :output

  def self.parse(source, gameType, index)
    matches = source.match(/input:\n(.+)\noutput:(.*)\nrand:(.*)/m)
    raise "invalid data: #{source.inspect}" unless matches

    input = matches[1].lines.map(&:chomp)
    output = matches[2].lstrip

    rands = matches[3].split(',').map do |randStr|
      m = randStr.match(%r{(\d+)/(\d+)})
      raise "invalid rands: #{matches[3]}" unless m

      m.captures.map(&:to_i)
    end

    new(gameType, input, output, rands, index)
  end

  def initialize(gameType, input, output, rands, index)
    @gameType = gameType

    @input = input
    @output = output
    @rands = rands

    @index = index
  end

  # 乱数値の配列の複製を返す
  def rands
    @rands.dup
  end

  # 乱数値を文字列に変換して返す
  def randsText
    @rands.map { |r| "#{r[0]}/#{r[1]}" }.join(', ')
  end
end
