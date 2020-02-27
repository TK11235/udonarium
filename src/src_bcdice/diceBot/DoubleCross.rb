# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/DiceBot'
require 'utils/ArithmeticEvaluator'

class DoubleCross < DiceBot
  setPrefixes(['\d+DX.*', 'ET'])

  def initialize
    super
  end

  def gameName
    'ダブルクロス2nd,3rd'
  end

  def gameType
    "DoubleCross"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定コマンド　(xDX+y@c or xDXc+y)
　"(個数)DX(修正)@(クリティカル値)"もしくは"(個数)DX(クリティカル値)(修正)"で指定します。
　加算減算のみ修正値も付けられます。
　例）10dx　　　10dx+5@8(OD tool式)　　　5DX7+7-3(疾風怒濤式)

・各種表
　・感情表(ET)
　　ポジティブとネガティブの両方を振って、表になっている側に○を付けて表示します。もちろん任意で選ぶ部分は変更して構いません。

・D66ダイスあり
INFO_MESSAGE_TEXT
  end

  # OD Tool式の成功判定コマンドの正規表現
  #
  # キャプチャ内容は以下のとおり:
  #
  # 1. ダイス数
  # 2. 修正値
  # 3. クリティカル値
  # 4. 達成値
  DX_OD_TOLL_RE = /\A(\d+)DX([-+][-+\d]+)?@(\d+)(?:>=(\d+))?\z/io.freeze

  # 疾風怒濤式の成功判定コマンドの正規表現
  #
  # キャプチャ内容は以下のとおり:
  #
  # 1. ダイス数
  # 2. クリティカル値
  # 3. 修正値
  # 4. 達成値
  DX_SHIPPU_DOTO_RE = /\A(\d+)DX(\d+)?([-+][-+\d]+)?(?:>=(\d+))?\z/io.freeze

  # 成功判定コマンドのノード
  DXNode = Struct.new(:num, :critical_value, :modifier, :target_value) do
    # 成功判定の文字列表記を返す
    # @return [String]
    def to_s
      lhs = "#{num}DX#{critical_value}#{formatted_modifier}"

      return target_value ? "#{lhs}>=#{target_value}" : lhs
    end

    # 出力用に整形された修正値を返す
    # @return [String]
    def formatted_modifier
      if modifier == 0
        ''
      elsif modifier > 0
        "+#{modifier}"
      else
        modifier.to_s
      end
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

  # 成功判定コマンドのダイスロール結果を表すクラス
  class DXDiceRollResult
    # 成功判定コマンドのノード
    # @return [DXNode]
    attr_reader :dx_node
    # 出目のグループの配列
    # @return [Array<ValueGroup>]
    attr_reader :value_groups
    # 回転数
    # @return [Integer]
    attr_reader :loop_count

    # 達成値
    # @return [Integer]
    attr_reader :achieved_value
    # ファンブルかどうか
    # @return [Boolean]
    attr_reader :is_fumble

    # 成功判定コマンドのダイスロール結果を初期化する
    # @param [DXNode] dx_node 成功判定コマンドのノード
    # @param [Array<ValueGroup>] value_groups 出目のグループの配列
    # @param [Integer] loop_count 回転数
    def initialize(dx_node, value_groups, loop_count)
      @dx_node = dx_node
      @value_groups = value_groups
      @loop_count = loop_count

      # ダイスの目がすべて1の場合はファンブル [3rd ルールブック1 p. 186]
      @is_fumble = @value_groups[0].values.all? { |value| value == 1 }

      # 出目（各グループの最大値の和）
      sum = @value_groups.map(&:max).reduce(0, :+)
      # 達成値 = 出目 + (技能のレベル + 修正)。
      # ただしファンブルの場合は0。
      # [3rd ルールブック1 p. 187]
      @achieved_value = @is_fumble ? 0 : (sum + @dx_node.modifier)
    end

    # ダイスロール結果の文字列表記を返す
    # @return [String]
    def to_s
      long_str = to_s_long

      # 通常の表記が長すぎた場合は短い表記を返す
      return long_str.length > $SEND_STR_MAX ? to_s_short : long_str
    end

    private

    # ダイスロール結果の長い文字列表記を返す
    # @return [String]
    def to_s_long
      parts = [
        "(#{@dx_node})",
        "#{@value_groups.join('+')}#{@dx_node.formatted_modifier}",
        achieved_value_with_if_fumble,
        compare_result
      ]

      return parts.compact.join(' ＞ ')
    end

    # ダイスロール結果の短い文字列表記を返す
    # @return [String]
    def to_s_short
      parts = [
        "(#{@dx_node})",
        '...',
        "回転数#{@loop_count}",
        achieved_value_with_if_fumble,
        compare_result
      ]

      return parts.compact.join(' ＞ ')
    end

    # ファンブルかどうかを含む達成値の表記を返す
    # @return [String]
    def achieved_value_with_if_fumble
      @is_fumble ? "#{@achieved_value} (ファンブル)" : @achieved_value.to_s
    end

    # 達成値と目標値を比較した結果を返す
    # @return [String, nil]
    def compare_result
      return nil unless @dx_node.target_value

      # ファンブル時は自動失敗
      # [3rd ルールブック1 pp. 186-187]
      return '失敗' if @is_fumble

      # 達成値が目標値以上ならば行為判定成功
      # [3rd ルールブック1 p. 187]
      return @achieved_value >= @dx_node.target_value ? '成功' : '失敗'
    end
  end

  def check_nD10(total_n, _dice_n, signOfInequality, diff, dice_cnt, _dice_max, n1, _n_max) # ゲーム別成功度判定(nD10)
    return '' unless signOfInequality == ">="

    if n1 >= dice_cnt
      return " ＞ ファンブル"
    elsif total_n >= diff
      return " ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end

  def rollDiceCommand(command)
    if (dx = parse(command))
      return execute_dx(dx)
    end

    if command == 'ET'
      return get_emotion_table
    end

    return nil
  end

  private

  # 構文解析する
  # @param [String] command コマンド文字列
  # @return [DXNode, nil]
  def parse(command)
    case command
    when DX_OD_TOLL_RE
      return parse_dx_od(Regexp.last_match)
    when DX_SHIPPU_DOTO_RE
      return parse_dx_shippu_doto(Regexp.last_match)
    end

    return nil
  end

  # OD Tool式の成功判定コマンドの正規表現マッチ情報からノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [DXNode]
  def parse_dx_od(m)
    num = m[1].to_i
    modifier = m[2] ? ArithmeticEvaluator.new.eval(m[2]) : 0
    critical_value = m[3] ? m[3].to_i : 10

    # @type [Integer, nil]
    target_value = m[4] && m[4].to_i

    return DXNode.new(num, critical_value, modifier, target_value)
  end

  # 疾風怒濤式の成功判定コマンドの正規表現マッチ情報からノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [DXNode]
  def parse_dx_shippu_doto(m)
    num = m[1].to_i
    critical_value = m[2] ? m[2].to_i : 10
    modifier = m[3] ? ArithmeticEvaluator.new.eval(m[3]) : 0

    # @type [Integer, nil]
    target_value = m[4] && m[4].to_i

    return DXNode.new(num, critical_value, modifier, target_value)
  end

  # 成功判定を行う
  # @param [DXNode] node 成功判定ノード
  def execute_dx(node)
    if node.critical_value < 2
      return "(#{node}) ＞ クリティカル値が低すぎます。2以上を指定してください。"
    end

    if node.num < 1
      return "(#{node}) ＞ 自動失敗"
    end

    # 出目のグループの配列
    value_groups = []
    # 次にダイスロールを行う際のダイス数
    num_of_dice = node.num
    # 回転数
    loop_count = 0

    while num_of_dice > 0 && should_reroll?(loop_count)
      values = Array.new(num_of_dice) { roll(1, 10)[0] }

      value_group = ValueGroup.new(values, node.critical_value)
      value_groups.push(value_group)

      # 次回はクリティカル発生数と等しい個数のダイスを振る
      # [3rd ルールブック1 p. 185]
      num_of_dice = value_group.num_of_critical_occurrences

      loop_count += 1
    end

    return DXDiceRollResult.new(node, value_groups, loop_count).to_s
  end

  # ** 感情表
  def get_emotion_table()
    output = nil

    pos_dice, pos_table = dx_feel_positive_table
    neg_dice, neg_table = dx_feel_negative_table
    dice_now, = roll(1, 2)

    if (pos_table != '1') && (neg_table != '1')
      if dice_now < 2
        pos_table = "○" + pos_table
      else
        neg_table = "○" + neg_table
      end
      output = "感情表(#{pos_dice}-#{neg_dice}) ＞ #{pos_table} - #{neg_table}"
    end

    return output
  end

  # ** 感情表（ポジティブ）
  def dx_feel_positive_table
    table = [
      [0, '傾倒(けいとう)'],
      [5, '好奇心(こうきしん)'],
      [10, '憧憬(どうけい)'],
      [15, '尊敬(そんけい)'],
      [20, '連帯感(れんたいかん)'],
      [25, '慈愛(じあい)'],
      [30, '感服(かんぷく)'],
      [35, '純愛(じゅんあい)'],
      [40, '友情(ゆうじょう)'],
      [45, '慕情(ぼじょう)'],
      [50, '同情(どうじょう)'],
      [55, '遺志(いし)'],
      [60, '庇護(ひご)'],
      [65, '幸福感(こうふくかん)'],
      [70, '信頼(しんらい)'],
      [75, '執着(しゅうちゃく)'],
      [80, '親近感(しんきんかん)'],
      [85, '誠意(せいい)'],
      [90, '好意(こうい)'],
      [95, '有為(ゆうい)'],
      [100, '尽力(じんりょく)'],
      [101, '懐旧(かいきゅう)'],
      [102, '任意(にんい)'],
    ]

    return dx_feel_table(table)
  end

  # ** 感情表（ネガティブ）
  def dx_feel_negative_table
    table = [
      [0, '侮蔑(ぶべつ)'],
      [5, '食傷(しょくしょう)'],
      [10, '脅威(きょうい)'],
      [15, '嫉妬(しっと)'],
      [20, '悔悟(かいご)'],
      [25, '恐怖(きょうふ)'],
      [30, '不安(ふあん)'],
      [35, '劣等感(れっとうかん)'],
      [40, '疎外感(そがいかん)'],
      [45, '恥辱(ちじょく)'],
      [50, '憐憫(れんびん)'],
      [55, '偏愛(へんあい)'],
      [60, '憎悪(ぞうお)'],
      [65, '隔意(かくい)'],
      [70, '嫌悪(けんお)'],
      [75, '猜疑心(さいぎしん)'],
      [80, '厭気(いやけ)'],
      [85, '不信感(ふしんかん)'],
      [90, '不快感(ふかいかん)'],
      [95, '憤懣(ふんまん)'],
      [100, '敵愾心(てきがいしん)'],
      [101, '無関心(むかんしん)'],
      [102, '任意(にんい)'],
    ]

    return dx_feel_table(table)
  end

  def dx_feel_table(table)
    dice_now, = roll(1, 100)
    output = get_table_by_number(dice_now, table)

    return dice_now, output
  end
end
