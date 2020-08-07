# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/ArithmeticEvaluator'
require 'utils/modifier_formatter'

require 'diceBot/SwordWorld'

class SwordWorld2_0 < SwordWorld
  # ゲームシステムの識別子
  ID = 'SwordWorld2.0'

  # ゲームシステム名
  NAME = 'ソードワールド2.0'

  # ゲームシステム名の読みがな
  SORT_KEY = 'そおとわあると2.0'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
自動的成功、成功、失敗、自動的失敗の自動判定を行います。

・レーティング表　(Kx)
　"Kキーナンバー+ボーナス"の形で記入します。
　ボーナスの部分に「K20+K30」のようにレーティングを取ることは出来ません。
　また、ボーナスは複数取ることが出来ます。
　レーティング表もダイスロールと同様に、他のプレイヤーに隠れてロールすることも可能です。
　例）K20　　　K10+5　　　k30　　　k10+10　　　Sk10-1　　　k10+5+2

・クリティカル値の設定
　クリティカル値は"[クリティカル値]"で指定します。
　指定しない場合はクリティカル値10とします。
　クリティカル処理が必要ないときは13などとしてください。(防御時などの対応)
　またタイプの軽減化のために末尾に「@クリティカル値」でも処理するようにしました。
　例）K20[10]　　　K10+5[9]　　　k30[10]　　　k10[9]+10　　　k10-5@9

・レーティング表の半減 (HKx)
　レーティング表の先頭または末尾に"H"をつけると、レーティング表を振って最終結果を半減させます。
　クリティカル値を指定しない場合、クリティカルなしと扱われます。
　例）HK20　　K20h　　HK10-5@9　　K10-5@9H　　K20gfH

・ダイス目の修正（運命変転やクリティカルレイ用）
　末尾に「$修正値」でダイス目に修正がかかります。
　$＋１と修正表記ならダイス目に＋修正、＄９のように固定値ならダイス目をその出目に差し替え。
　クリティカルした場合でも固定値や修正値の適用は最初の一回だけです。
　例）K20$+1　　　K10+5$9　　　k10-5@9$+2　　　k10[9]+10$9

・首切り刀用レーティング上昇 r10
　例）K20r10　K30+24@8R10　K40+24@8$12r10

・グレイテストフォーチュンは末尾に gf
　例）K20gf　K30+24@8GF　K40+24@8$12r10gf

・超越判定用に2d6ロールに 2D6@10 書式でクリティカル値付与が可能に。
　例）2D6@10　2D6@10+11>=30

・成長　(Gr)
　末尾に数字を付加することで、複数回の成長をまとめて行えます。
　例）Gr3

・防御ファンブル表　(FT)
　防御ファンブル表を出すことができます。

・絡み効果表　(TT)
　絡み効果表を出すことができます。
INFO_MESSAGE_TEXT

  setPrefixes(['H?K\d+.*', 'Gr(\d+)?', '2D6?@\d+.*', 'FT', 'TT'])

  # 超越判定のノード
  class TranscendentTest
    include ModifierFormatter

    # @param [Integer] critical_value クリティカル値
    # @param [Integer] modifier 修正値
    # @param [String, nil] cmp_op 比較演算子（> または >=）
    # @param [Integer, nil] target 目標値
    def initialize(critical_value, modifier, cmp_op, target)
      @critical_value = critical_value
      @modifier = modifier
      @cmp_op = cmp_op
      @target = target

      @modifier_str = format_modifier(@modifier)
      @expression = node_expression()
    end

    # 超越判定を行う
    # @param [SwordWorld2_0] bot ダイスボット
    # @return [String]
    def execute(bot)
      if @critical_value < 3
        return "(#{@expression}) ＞ クリティカル値が小さすぎます。3以上を指定してください。"
      end

      first_value_group = roll_2d6(bot)
      value_groups = [first_value_group]

      fumble = first_value_group == [1, 1]
      critical = first_value_group == [6, 6]

      if !fumble && !critical
        while sum_of_dice(value_groups.last) >= @critical_value
          value_groups.push(roll_2d6(bot))
        end
      end

      sum = sum_of_dice(value_groups)
      total_sum = sum + @modifier

      parts = [
        "(#{@expression})",
        "#{dice_str(value_groups, sum)}#{@modifier_str}",
        total_sum,
        @target && result_str(total_sum, value_groups.length, fumble, critical)
      ].compact

      return parts.join(' ＞ ')
    end

    private

    # 数式表記を返す
    # @return [String]
    def node_expression
      lhs = "2D6@#{@critical_value}#{@modifier_str}"

      return @target ? "#{lhs}#{@cmp_op}#{@target}" : lhs
    end

    # 出目の合計を返す
    # @param [(Integer, Integer), Array<(Integer, Integer)>] value_groups
    #   出目のグループまたはその配列
    # @return [Integer]
    def sum_of_dice(value_groups)
      # TODO: Ruby 2.4以降では Array#sum が使える
      value_groups.flatten.reduce(0, &:+)
    end

    # ダイス部分の文字列を返す
    # @param [Array<(Integer, Integer)>] value_groups 出目のグループの配列
    # @param [Integer] sum 出目の合計
    # @return [String]
    def dice_str(value_groups, sum)
      value_groups_str =
        value_groups.
        map { |values| "[#{values.join(',')}]" }.
        join

      return "#{sum}#{value_groups_str}"
    end

    # 判定結果の文字列を返す
    # @param [Integer] total_sum 合計値
    # @param [Integer] n_value_groups 出目のグループの数
    # @param [Boolean] fumble ファンブルかどうか
    # @param [Boolean] critical クリティカルかどうか
    # @return [String]
    def result_str(total_sum, n_value_groups, fumble, critical)
      return '自動的失敗' if fumble
      return '自動的成功' if critical

      if total_sum.send(@cmp_op, @target)
        # 振り足しが行われ、合計値が41以上ならば「超成功」
        n_value_groups >= 2 && total_sum >= 41 ? '超成功' : '成功'
      else
        '失敗'
      end
    end

    # 2D6を振る
    # @return [(Integer, Integer)] 出目のグループ
    def roll_2d6(bot)
      Array.new(2) { bot.roll(1, 6)[0] }
    end
  end

  def initialize
    rating_table = 2
    super()
    @rating_table = rating_table
  end

  # 超越判定のパターン
  TRANSCENDENT_TEST_RE = /\A2D6?@(\d+)([-+\d]+)?(?:(>=?)(\d+))?/.freeze

  def rollDiceCommand(command)
    case command
    when /^Gr(\d+)?/i
      if command =~ /^Gr(\d+)/i
        growth(Regexp.last_match(1).to_i)
      else
        growth
      end
    when TRANSCENDENT_TEST_RE
      m = Regexp.last_match

      critical_value = m[1].to_i
      modifier = m[2] ? ArithmeticEvaluator.new.eval(m[2]) : 0
      cmp_op = m[3]
      target = m[3] && m[4].to_i

      node = TranscendentTest.new(critical_value, modifier, cmp_op, target)
      node.execute(self)
    when 'FT'
      get_fumble_table
    when 'TT'
      get_tangle_table
    else
      super(command)
    end
  end

  def getRateUpFromString(string)
    rateUp = 0

    regexp = /r\[(\d+)\]/i

    if regexp === string
      rateUp = Regexp.last_match(1).to_i
      string = string.gsub(regexp, '')
    end

    return rateUp, string
  end

  def getAdditionalString(string, output)
    output, values = super(string, output)

    isGratestFortune, string = getGratestFortuneFromString(string)

    values['isGratestFortune'] = isGratestFortune
    output += "gf" if isGratestFortune

    return output, values
  end

  def rollDice(values)
    unless values['isGratestFortune']
      return super(values)
    end

    dice, diceText = roll(1, 6)

    dice *= 2
    diceText = "#{diceText},#{diceText}"

    return dice, diceText
  end

  def getGratestFortuneFromString(string)
    isGratestFortune = false

    regexp = /gf/i

    if regexp === string
      isGratestFortune = true
      string = string.gsub(regexp, '')
    end

    return isGratestFortune, string
  end

  def growth(count = 1)
    ((1..count).map { growth_step }).join " | "
  end

  def growth_step
    d1, = roll(1, 6)
    d2, = roll(1, 6)

    a1 = get_ability_by_dice(d1)
    a2 = get_ability_by_dice(d2)

    return a1 != a2 ? "[#{d1},#{d2}]->(#{a1} or #{a2})" : "[#{d1},#{d2}]->(#{a1})"
  end

  def get_ability_by_dice(dice)
    ['器用度', '敏捷度', '筋力', '生命力', '知力', '精神力'][dice - 1]
  end

  def get_fumble_table()
    table = [
      'この表を2回振り、その両方を適用する。（同じ出目による影響は累積しない）。この自動失敗により得られる経験点は、+50点される',
      'ダメージに、攻撃者を強化している「剣のかけら」の数が追加される',
      'ダメージに、攻撃者の「レベル」が追加される',
      'ダメージ決定を2回行い、より高い方を採用する',
      '合算ダメージを2倍する',
      '防護点無効'
    ]
    text, num = get_table_by_1d6(table)
    return "防御ファンブル表(#{num}) → #{text}"
  end

  def get_tangle_table()
    table = [
      '頭や顔：牙や噛みつきなどにおける命中力判定及び、魔法の行使やブレスに-2のペナルティ修正を受ける',
      '武器や盾：武器の使用不可、又は盾の回避力修正及び防護点を無効化する',
      '腕や手：武器や爪などにおける命中力判定に-2のペナルティ修正、盾を持つ腕方の腕ならその盾の回避力修正及び防護点を無効化する',
      '脚や足：移動不可、更に回避力判定に-2のペナルティ修正を受ける ※両足に絡んでも累積しない',
      '胴体：生命・精神抵抗力を基準値に用いる判定を除き、あらゆる行為判定に-1のペナルティ修正を受ける',
      '特殊：尻尾や翼などに命中。絡められた部位を使用する判定において-2のペナルティ修正、またはそこが使えていたことによるボーナス修正を失う ※存在しない場合は決め直し'
    ]
    text, num = get_table_by_1d6(table)
    return "絡み効果表(#{num}) → #{text}"
  end
end
