# -*- coding: utf-8 -*-

require 'utils/ArithmeticEvaluator'
require 'utils/normalize'
require 'utils/format'
require 'utils/modifier_formatter'

# 上方無限ロール
#
# ダイスを1つ振る、その出目が閾値より大きければダイスを振り足すのを閾値未満の出目が出るまで繰り返す。
# これを指定したダイス数だけおこない、それぞれのダイスの合計値を求める。
# それらと目標値を比較し、成功した数を表示する。
#
# フォーマットは以下の通り
# 2U4+1U6[4]>=6
# 2U4+1U6>=6@4
#
# 閾値は角カッコで指定するか、コマンドの末尾に @6 のように指定する。
# 閾値の指定が重複した場合、角カッコが優先される。
# この時、出目が
#   "2U4" -> 3[3], 10[4,4,2]
#   "1U6" -> 6[4,2]
# だとすると、 >=6 に該当するダイスは2つなので成功数2となる。
#
# 2U4[4]+10>=6 のように修正値を指定できる。修正値は全てのダイスに補正を加え、以下のようになる。
#   "2U4" -> 3[3]+10=13, 10[4,4,2]+10=20
#
# 比較演算子が書かれていない場合、ダイスの最大値と全ダイスの合計値が出力される。
# 全ダイスの合計値には補正値が1回だけ適用される
# 2U4[4]+10
#   "2U4" -> 3[3]+10=13, 10[4,4,2]+10=20
#   最大値：20
#   合計値：23 = 3[3]+10[4,4,2]+10
class UpperDice
  include ModifierFormatter

  def initialize(bcdice, diceBot)
    @bcdice = bcdice
    @diceBot = diceBot
    @nick_e = @bcdice.nick_e
  end

  # 上方無限ロールを実行する
  #
  # @param string [String]
  # @return [String]
  def rollDice(string)
    unless (m = /^S?(\d+U\d+(?:\+\d+U\d+)*)(?:\[(\d+)\])?([\+\-\d]*)(?:([<>=]+)(\d+))?(?:@(\d+))?/i.match(string))
      return '1'
    end

    @command = m[1]
    @cmp_op = Normalize.comparison_operator(m[4])
    @target_number = @cmp_op ? m[5].to_i : nil
    @reroll_threshold = reroll_threshold(m[2] || m[6])

    @modify_number = m[3] ? ArithmeticEvaluator.new.eval(m[3], @diceBot.fractionType.to_sym) : 0

    if @reroll_threshold <= 1
      return "#{@nick_e}: (#{expr()}) ＞ 無限ロールの条件がまちがっています"
    end

    roll_list = []
    @command.split('+').each do |u|
      times, sides = u.split("U", 2).map(&:to_i)
      roll_list.concat(roll(times, sides))
    end

    result =
      if @cmp_op
        success_count = roll_list.count do |e|
          x = e[:sum] + @modify_number
          # Ruby 1.8のケア
          @cmp_op == :'!=' ? x != @target_number : x.send(@cmp_op, @target_number)
        end
        "成功数#{success_count}"
      else
        sum_list = roll_list.map { |e| e[:sum] }
        total = sum_list.inject(0, :+) + @modify_number
        max = sum_list.map { |i| i + @modify_number }.max
        "#{max}/#{total}(最大/合計)"
      end

    sequence = [
      "#{@nick_e}: (#{expr()})",
      dice_text(roll_list) + format_modifier(@modify_number),
      result
    ]

    return sequence.join(" ＞ ")
  end

  private

  # ダイスロールし、ダイスボットのソート設定に応じてソートする
  #
  # @param times [Integer] ダイスの個数
  # @param sides [Integer] ダイスの面数
  # @return [Array<Hash>]
  def roll(times, sides)
    if @diceBot.upperRollThreshold == "Max"
      @reroll_threshold = sides
    end

    ret = Array.new(times) do
      list = roll_ones(sides)
      {:sum => list.inject(0, :+), :list => list}
    end

    if @diceBot.sortType & 2 != 0
      ret = ret.sort_by { |e| e[:sum] }
    end

    return ret
  end

  # 一つだけダイスロールする
  #
  # @param sides [Integer] ダイスの面数
  # @return [Array<Integer>]
  def roll_ones(sides)
    dice_list = []

    loop do
      value, = @bcdice.roll(1, sides)
      dice_list.push(value)
      break if value < @reroll_threshold
    end

    return dice_list
  end

  # ダイスロールの結果を文字列に変換する
  # 振り足しがなければその数値、振り足しがあれば合計と各ダイスの出目を出力する
  #
  # @param roll_list [Array<Hash>]
  # @return [String]
  def dice_text(roll_list)
    roll_list.map do |e|
      if e[:list].size == 1
        e[:sum]
      else
        "#{e[:sum]}[#{e[:list].join(',')}]"
      end
    end.join(",")
  end

  # 振り足しの閾値を得る
  #
  # @param target [String]
  # @return [Integer]
  def reroll_threshold(target)
    if target
      target.to_i
    elsif @diceBot.upperRollThreshold == "Max"
      2
    else
      @diceBot.upperRollThreshold
    end
  end

  # パース済みのコマンドを文字列で表示する
  #
  # @return [String]
  def expr
    "#{@command}[#{@reroll_threshold}]#{format_modifier(@modify_number)}#{Format.comparison_operator(@cmp_op)}#{@target_number}"
  end
end
