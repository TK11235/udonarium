# -*- coding: utf-8 -*-

# D66を振って6x6マスの表を参照する
class D66GridTable
  # @param [String] name 表の名前
  # @param [Array<Array<String>>] items 表の項目の配列
  def initialize(name, items)
    @name = name
    @items = items.freeze
  end

  # 表を振る
  # @param [BCDice] bcdice ランダマイザ
  # @return [String] 結果
  def roll(bcdice)
    dice1, = bcdice.roll(1, 6)
    dice2, = bcdice.roll(1, 6)

    index1 = dice1 - 1
    index2 = dice2 - 1
    return "#{@name}(#{dice1}#{dice2}) ＞ #{@items[index1][index2]}"
  end
end
