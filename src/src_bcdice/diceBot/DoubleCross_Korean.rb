# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/DiceBot'
require 'utils/ArithmeticEvaluator'
require 'utils/modifier_formatter'
require 'utils/range_table'

class DoubleCross_Korean < DiceBot
  # ゲームシステムの識別子
  ID = 'DoubleCross:Korean'

  # ゲームシステム名
  NAME = '더블크로스2nd,3rd'

  # ゲームシステム名の読みがな
  SORT_KEY = '国際化:Korean:더블크로스'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・판정 커맨드（xDX+y@c or xDXc+y）
　"(개수)DX(수정)@(크리티컬치)" 혹은 "(개수)DX(크리티컬치)(수정)" 으로 지정합니다.
　수정치도 붙일 수 있습니다.
　예）10dx　　10dx+5@8（OD tool식)　　5DX7+7-3（질풍노도식）
・각종표
　・감정표（ET）
　　포지티브와 네거티브 양쪽을 굴려, 겉으로 나타는 쪽에 O를 붙여 표시합니다.
　　물론 임의로 정하는 부분을 변경해도 괜찮습니다.
・D66다이스 있음
INFO_MESSAGE_TEXT

  setPrefixes(['\d+DX.*', 'ET'])

  # 成功判定コマンドのノード
  class DX
    include ModifierFormatter

    # ノードを初期化する
    # @param [Integer] num ダイス数
    # @param [Integer] critical_value クリティカル値
    # @param [Integer] modifier 修正値
    # @param [Integer] target_value 目標値
    def initialize(num, critical_value, modifier, target_value)
      @num = num
      @critical_value = critical_value
      @modifier = modifier
      @target_value = target_value

      @modifier_str = format_modifier(@modifier)
      @expression = node_expression()
    end

    # 成功判定を行う
    # @param [DiceBot] bot ダイスボット
    # @return [String] 判定結果
    def execute(bot)
      if @critical_value < 2
        return "(#{@expression}) ＞ 크리티컬치가 너무 낮습니다. 2 이상을 지정해주세요."
      end

      if @num < 1
        return "(#{@expression}) ＞ 자동실패"
      end

      # 出目のグループの配列
      value_groups = []
      # 次にダイスロールを行う際のダイス数
      num_of_dice = @num
      # 回転数
      loop_count = 0

      while num_of_dice > 0 && bot.should_reroll?(loop_count)
        values = Array.new(num_of_dice) { bot.roll(1, 10)[0] }

        value_group = ValueGroup.new(values, @critical_value)
        value_groups.push(value_group)

        # 次回はクリティカル発生数と等しい個数のダイスを振る
        # [3rd ルールブック1 p. 185]
        num_of_dice = value_group.num_of_critical_occurrences

        loop_count += 1
      end

      return result_str(value_groups)
    end

    private

    # 数式表記を返す
    # @return [String]
    def node_expression
      lhs = "#{@num}DX#{@critical_value}#{@modifier_str}"

      return @target_value ? "#{lhs}>=#{@target_value}" : lhs
    end

    # 判定結果の文字列を返す
    # @param [Array<ValueGroup>] value_groups 出目のグループの配列
    # @return [String]
    def result_str(value_groups)
      fumble = value_groups[0].values.all? { |value| value == 1 }
      # TODO: Ruby 2.4以降では Array#sum が使える
      sum = value_groups.map(&:max).reduce(0, &:+)
      achieved_value = fumble ? 0 : (sum + @modifier)

      parts = [
        "(#{@expression})",
        "#{value_groups.join('+')}#{@modifier_str}",
        achieved_value_with_if_fumble(achieved_value, fumble),
        compare_result(achieved_value, fumble)
      ]

      return parts.compact.join(' ＞ ')
    end

    # ファンブルかどうかを含む達成値の表記を返す
    # @param [Integer] achieved_value 達成値
    # @param [Boolean] fumble ファンブルしたか
    # @return [String]
    def achieved_value_with_if_fumble(achieved_value, fumble)
      fumble ? "#{achieved_value} (펌블)" : achieved_value.to_s
    end

    # 達成値と目標値を比較した結果を返す
    # @param [Integer] achieved_value 達成値
    # @param [Boolean] fumble ファンブルしたか
    # @return [String, nil]
    def compare_result(achieved_value, fumble)
      return nil unless @target_value

      # ファンブル時は自動失敗
      # [3rd ルールブック1 pp. 186-187]
      return '실패' if fumble

      # 達成値が目標値以上ならば行為判定成功
      # [3rd ルールブック1 p. 187]
      return achieved_value >= @target_value ? '성공' : '실패'
    end
  end

  # 出目のグループを表すクラス
  class ValueGroup
    # 出目の配列
    # @return [Array<Integer>]
    attr_reader :values
    # クリティカル値
    # @return [Integer]
    attr_reader :critical_value

    # 出目のグループを初期化する
    # @param [Array<Integer>] values 出目の配列
    # @param [Integer] critical_value クリティカル値
    def initialize(values, critical_value)
      @values = values.sort
      @critical_value = critical_value
    end

    # 出目のグループの文字列表記を返す
    # @return [String]
    def to_s
      "#{max}[#{@values.join(',')}]"
    end

    # 出目のグループ中の最大値を返す
    # @return [Integer]
    #
    # クリティカル値以上の出目が含まれていた場合は10を返す。
    # [3rd ルールブック1 pp. 185-186]
    def max
      @values.any? { |value| critical?(value) } ? 10 : @values.max
    end

    # クリティカルの発生数を返す
    # @return [Integer]
    def num_of_critical_occurrences
      @values.
        select { |value| critical?(value) }.
        length
    end

    private

    # クリティカルが発生したかを返す
    # @param [Integer] value 出目
    # @return [Boolean]
    #
    # クリティカル値以上の値が出た場合、クリティカルとする。
    # [3rd ルールブック1 pp. 185-186]
    def critical?(value)
      value >= @critical_value
    end
  end

  def check_nD10(total, _dice_total, dice_list, cmp_op, target)
    return '' if target == '?'
    return '' unless cmp_op == :>=

    if dice_list.count(1) == dice_list.size
      " ＞ 펌블"
    elsif total >= target
      " ＞ 성공"
    else
      " ＞ 실패"
    end
  end

  # ダイスボット固有コマンドの処理を行う
  # @param [String] command コマンド
  # @return [String] ダイスボット固有コマンドの結果
  # @return [nil] 無効なコマンドだった場合
  def rollDiceCommand(command)
    if (dx = parse_dx(command))
      return dx.execute(self)
    end

    if command == 'ET'
      return roll_emotion_table()
    end

    return nil
  end

  private

  # OD Tool式の成功判定コマンドの正規表現
  #
  # キャプチャ内容は以下のとおり:
  #
  # 1. ダイス数
  # 2. 修正値
  # 3. クリティカル値
  # 4. 達成値
  DX_OD_TOOL_RE = /\A(\d+)DX([-+]\d+(?:[-+*]\d+)*)?@(\d+)(?:>=(\d+))?\z/io.freeze

  # 疾風怒濤式の成功判定コマンドの正規表現
  #
  # キャプチャ内容は以下のとおり:
  #
  # 1. ダイス数
  # 2. クリティカル値
  # 3. 修正値
  # 4. 達成値
  DX_SHIPPU_DOTO_RE = /\A(\d+)DX(\d+)?([-+]\d+(?:[-+*]\d+)*)?(?:>=(\d+))?\z/io.freeze

  # 成功判定コマンドの構文解析を行う
  # @param [String] command コマンド文字列
  # @return [DX, nil]
  def parse_dx(command)
    case command
    when DX_OD_TOOL_RE
      return parse_dx_od(Regexp.last_match)
    when DX_SHIPPU_DOTO_RE
      return parse_dx_shippu_doto(Regexp.last_match)
    end

    return nil
  end

  # OD Tool式の成功判定コマンドの正規表現マッチ情報からノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [DX]
  def parse_dx_od(m)
    num = m[1].to_i
    modifier = m[2] ? ArithmeticEvaluator.new.eval(m[2]) : 0
    critical_value = m[3] ? m[3].to_i : 10

    target_value = m[4] && m[4].to_i

    return DX.new(num, critical_value, modifier, target_value)
  end

  # 疾風怒濤式の成功判定コマンドの正規表現マッチ情報からノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [DX]
  def parse_dx_shippu_doto(m)
    num = m[1].to_i
    critical_value = m[2] ? m[2].to_i : 10
    modifier = m[3] ? ArithmeticEvaluator.new.eval(m[3]) : 0

    target_value = m[4] && m[4].to_i

    return DX.new(num, critical_value, modifier, target_value)
  end

  # 感情表を振る
  #
  # ポジティブとネガティブの両方を振って、表になっている側に○を付ける。
  #
  # @return [String]
  def roll_emotion_table
    pos_result = POSITIVE_EMOTION_TABLE.roll(bcdice)
    neg_result = NEGATIVE_EMOTION_TABLE.roll(bcdice)

    positive = roll(1, 2)[0] == 1
    pos_neg_text =
      if positive
        ["○#{pos_result.content}", neg_result.content]
      else
        [pos_result.content, "○#{neg_result.content}"]
      end

    output_parts = [
      "감정표(#{pos_result.sum}-#{neg_result.sum})",
      pos_neg_text.join(' - ')
    ]

    return output_parts.join(' ＞ ')
  end

  # 感情表（ポジティブ）
  POSITIVE_EMOTION_TABLE = RangeTable.new(
    '감정표（포지티브）',
    '1D100',
    [
      # [0, '傾倒(けいとう)'],
      [1..5,    '호기심'],
      [6..10,   '동경'],
      [11..15,  '존경'],
      [16..20,  '연대감'],
      [21..25,  '자애'],
      [26..30,  '감복'],
      [31..35,  '순애'],
      [36..40,  '우정'],
      [41..45,  '모정(慕情)'],
      [46..50,  '동정'],
      [51..55,  '유지(遺志)'],
      [56..60,  '비호'],
      [61..65,  '행복감'],
      [66..70,  '신뢰'],
      [71..75,  '집착'],
      [76..80,  '친근감'],
      [81..85,  '성의'],
      [86..90,  '호의'],
      [91..95,  '유위(有為)'],
      [96..100, '진력'],
      # [101, '懐旧(かいきゅう)'],
      # [102, '任意(にんい)'],
    ]
  ).freeze

  # 感情表（ネガティブ）
  NEGATIVE_EMOTION_TABLE = RangeTable.new(
    '감정표(네거티브)',
    '1D100',
    [
      # [0, '侮蔑(ぶべつ)'],
      [1..5,    '식상'],
      [6..10,   '위협'],
      [11..15,  '질투'],
      [16..20,  '회개'],
      [21..25,  '공포'],
      [26..30,  '불안'],
      [31..35,  '열등감'],
      [36..40,  '소외감'],
      [41..45,  '치욕'],
      [46..50,  '연민'],
      [51..55,  '편애'],
      [56..60,  '증오'],
      [61..65,  '격의'],
      [66..70,  '혐오'],
      [71..75,  '시의심'],
      [76..80,  '싫음'],
      [81..85,  '불신감'],
      [86..90,  '불쾌감'],
      [91..95,  '분만(憤懣)'],
      [96..100, '적개심'],
      # [101, '無関心(むかんしん)'],
      # [102, '任意(にんい)'],
    ]
  ).freeze
end
