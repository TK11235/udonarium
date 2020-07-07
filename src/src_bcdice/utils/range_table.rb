# -*- coding: utf-8 -*-
# frozen_string_literal: true

# 各項目について、Rangeを用いて出目の合計の範囲を指定する、表のクラス。
#
# このクラスを使うと、表の定義を短く書ける。
# このクラスを使って表を定義するときは、各項目を以下の形で書く。
#
#     [出目の合計の範囲, 内容]
#
# 「出目の合計の範囲」には、Integerを要素とするRangeか、Integerを置ける。
#
# roll メソッドで表を振ると、出目の合計値と対応する項目が選ばれる。
#
# @example 表の定義（バトルテックの致命的命中表）
#   CRITICAL_TABLE = RangeTable.new(
#     '致命的命中表',
#     '2D6',
#     [
#       [2..7,   '致命的命中はなかった'],
#       [8..9,   '1箇所の致命的命中'],
#       [10..11, '2箇所の致命的命中'],
#       [12,     'その部位が吹き飛ぶ（腕、脚、頭）または3箇所の致命的命中（胴）']
#     ]
#   )
#
# @example 表を振った結果
#   CRITICAL_TABLE.roll(bcdice).formatted
#   # 出目の合計が7の場合 ："致命的命中表(7) ＞ 致命的命中はなかった"
#   # 出目の合計が8の場合 ："致命的命中表(8) ＞ 1箇所の致命的命中"
#   # 出目の合計が9の場合 ："致命的命中表(9) ＞ 1箇所の致命的命中"
#   # 出目の合計が10の場合："致命的命中表(10) ＞ 2箇所の致命的命中"
class RangeTable
  # 表を振った結果を表す構造体
  # @!attribute [rw] sum
  #   @return [Integer] 出目の合計
  # @!attribute [rw] values
  #   @return [Array<Integer>] 出目の配列
  # @!attribute [rw] content
  #   @return [Object] 選ばれた項目の内容
  # @!attribute [rw] formatted
  #   @return [String] 整形された結果
  RollResult = Struct.new(:sum, :values, :content, :formatted) do
    alias_method :to_s, :formatted
  end

  # 表の項目を表す構造体
  # @!attribute [rw] range
  #   @return [Range] 出目の合計の範囲
  # @!attribute [rw] content
  #   @return [Object] 内容
  Item = Struct.new(:range, :content)

  # 項目を選ぶときのダイスロールの方法を表す正規表現
  DICE_ROLL_METHOD_RE = /\A(\d+)D(\d+)\z/i.freeze

  # 表を振った結果の整形処理（既定の処理）
  DEFAULT_FORMATTER = lambda do |table, result|
    "#{table.name}(#{result.sum}) ＞ #{result.content}"
  end

  # @return [String] 表の名前
  attr_reader :name
  # @return [Integer] 振るダイスの個数
  attr_reader :num_of_dice
  # @return [Integer] 振るダイスの面数
  attr_reader :num_of_sides

  # 表を初期化する
  #
  # ブロックを与えると、独自の結果整形処理を指定できる。
  # ブロックは振った表（+table+）と振った結果（+result+）を引数として受け取る。
  #
  # @param [String] name 表の名前
  # @param [String] dice_roll_method
  #   項目を選ぶときのダイスロールの方法（+'1D6'+ など）
  # @param [Array<(Range, Object)>, Array<(Integer, Object)>] items
  #   表の項目の配列。[出目の合計の範囲, 内容]
  # @yieldparam [RangeTable] table 振った表
  # @yieldparam [RollResult] result 表を振った結果
  # @raise [ArgumentError] ダイスロール方法が正しい書式で指定されていなかった場合
  # @raise [TypeError] 範囲の型が正しくなかった場合
  # @raise [RangeError] 出目の合計の最小値がカバーされていなかった場合
  # @raise [RangeError] 出目の合計の最大値がカバーされていなかった場合
  # @raise [RangeError] 出目の合計の範囲にずれや重なりがあった場合
  #
  # @example 表の定義（バトルテックの致命的命中表）
  #   CRITICAL_TABLE = RangeTable.new(
  #     '致命的命中表',
  #     '2D6',
  #     [
  #       [2..7,   '致命的命中はなかった'],
  #       [8..9,   '1箇所の致命的命中'],
  #       [10..11, '2箇所の致命的命中'],
  #       [12,     'その部位が吹き飛ぶ（腕、脚、頭）または3箇所の致命的命中（胴）']
  #     ]
  #   )
  #
  # @example 独自の結果整形処理を指定する場合
  #   CRITICAL_TABLE_WITH_FORMATTER = RangeTable.new(
  #     '致命的命中表',
  #     '2D6',
  #     [
  #       [2..7,   '致命的命中はなかった'],
  #       [8..9,   '1箇所の致命的命中'],
  #       [10..11, '2箇所の致命的命中'],
  #       [12,     'その部位が吹き飛ぶ（腕、脚、頭）または3箇所の致命的命中（胴）']
  #     ]
  #   ) do |table, result|
  #     "致命的命中発生? ＞ #{result.sum}[#{result.values}] ＞ #{result.content}"
  #   end
  #
  #   CRITICAL_TABLE_WITH_FORMATTER.roll(bcdice).formatted
  #   #=> "致命的命中発生? ＞ 11[5,6] ＞ 2箇所の致命的命中"
  def initialize(name, dice_roll_method, items, &formatter)
    @name = name.freeze
    @formatter = formatter || DEFAULT_FORMATTER

    m = DICE_ROLL_METHOD_RE.match(dice_roll_method)
    unless m
      raise(
        ArgumentError,
        "#{@name}: invalid dice roll method: #{dice_roll_method}"
      )
    end

    @num_of_dice = m[1].to_i
    @num_of_sides = m[2].to_i

    store(items)
  end

  # 指定された値に対応する項目を返す
  # @param [Integer] value 値（出目の合計）
  # @return [Item] 指定された値に対応する項目
  # @raise [RangeError] 範囲外の値が指定された場合
  def fetch(value)
    item = @items.find { |i| i.range.include?(value) }
    unless item
      raise RangeError, "#{@name}: value is out of range: #{value}"
    end

    return item
  end

  # 表を振る
  # @param [BCDice] bcdice BCDice本体
  # @return [RollResult] 表を振った結果
  def roll(bcdice)
    sum, values_str, = bcdice.roll(@num_of_dice, @num_of_sides)

    # TODO: BCDice#roll から直接、整数の配列として出目を受け取りたい
    values = values_str.split(',').map(&:to_i)

    result = RollResult.new(sum, values, fetch(sum).content)
    result.formatted = @formatter[self, result]

    return result
  end

  private

  # 表の項目を格納する
  # @param [Array<(Range, Object)>, Array<(Integer, Object)>] items
  #   表の項目の配列。[出目の合計の範囲, 内容]
  # @return [self]
  # @raise [TypeError] 範囲の型が正しくなかった場合
  # @raise [RangeError] 出目の合計の最小値がカバーされていなかった場合
  # @raise [RangeError] 出目の合計の最大値がカバーされていなかった場合
  # @raise [RangeError] 出目の合計の範囲にずれや重なりがあった場合
  def store(items)
    items_with_range = items.map { |r, c| [coerce_to_int_range(r), c] }
    sorted_items = items_with_range.sort_by { |r, _| r.min }

    assert_min_sum_is_covered(sorted_items)
    assert_max_sum_is_covered(sorted_items)
    assert_no_gap_or_overlap_in_ranges(sorted_items)

    @items = sorted_items.
             map { |range, content| Item.new(range, content.freeze).freeze }.
             freeze

    self
  end

  # 引数を強制的に整数を要素とするRangeに変換する
  # @param [Range, Integer] x 変換対象
  # @return [Range] 整数を要素とするRange
  # @raise [TypeError] xの型に対応していなかった場合
  def coerce_to_int_range(x)
    case x
    when Integer
      return Range.new(x, x)
    when Range
      if x.begin.is_a?(Integer) && x.end.is_a?(Integer)
        return x
      end
    end

    raise(
      TypeError,
      "#{@name}: #{x} (#{x.class}) must be an Integer or a Range with Integers "
    )
  end

  # 出目の合計の最小値がカバーされていることを確認する
  # @param [Array<(Range, Object)>] sorted_items
  #   ソートされた、項目の配列
  # @return [self]
  # @raise [RangeError] 出目の合計の最小値がカバーされていなかった場合
  def assert_min_sum_is_covered(sorted_items)
    min_sum = @num_of_dice
    range = sorted_items.first[0]
    unless range.include?(min_sum)
      raise(
        RangeError,
        "#{@name}: min value (#{min_sum}) is not covered: #{range}"
      )
    end

    self
  end

  # 出目の合計の最大値がカバーされていることを確認する
  # @param [Array<(Range, Object)>] sorted_items
  #   ソートされた、項目の配列
  # @return [self]
  # @raise [RangeError] 出目の合計の最大値がカバーされていなかった場合
  def assert_max_sum_is_covered(sorted_items)
    max_sum = @num_of_dice * @num_of_sides
    range = sorted_items.last[0]
    unless range.include?(max_sum)
      raise(
        RangeError,
        "#{@name}: max value (#{max_sum}) is not covered: #{range}"
      )
    end

    self
  end

  # 出目の合計の範囲にずれや重なりがないことを確認する
  # @param [Array<(Range, Object)>] sorted_items
  #   ソートされた、項目の配列
  # @return [self]
  # @raise [RangeError] 出目の合計の範囲にずれや重なりがあった場合
  def assert_no_gap_or_overlap_in_ranges(sorted_items)
    sorted_items.each_cons(2) do |i1, i2|
      r1 = i1[0]
      r2 = i2[0]

      max1 = r1.max
      next_of_max1 = max1 + 1

      if r2.include?(max1)
        raise RangeError, "#{@name}: Range overlap: #{r1} and #{r2}"
      end

      unless r2.include?(next_of_max1)
        raise RangeError, "#{@name}: Range gap: #{r1} and #{r2}"
      end
    end

    self
  end
end
