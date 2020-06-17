# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/DiceBot'
require 'utils/ArithmeticEvaluator'
require 'utils/modifier_formatter'

# スタンダードRPGシステムのダイスボット
#
# スタンダードRPGシステムにおいて共通な2D6成功判定を実装している。
# また、各ゲームシステムに合わせた2D6成功判定のエイリアスコマンドを
# 登録するクラスメソッド set_aliases_for_srs_roll を持つ。
class SRS < DiceBot
  # ゲームシステムの識別子
  ID = 'SRS'

  # ゲームシステム名
  NAME = 'Standard RPG System'

  # ゲームシステム名の読みがな
  SORT_KEY = 'すたんたあとRPGしすてむ'

  include ModifierFormatter

  HELP_MESSAGE_1 = <<HELP_MESSAGE
・判定
　・通常判定：2D6+m>=t[c,f]
　　修正値m、目標値t、クリティカル値c、ファンブル値fで判定ロールを行います。
　　修正値、クリティカル値、ファンブル値は省略可能です（[]ごと省略可）。
　　クリティカル値、ファンブル値の既定値は、それぞれ12、2です。
　　自動成功、自動失敗、成功、失敗を自動表示します。

　　例) 2d6>=10　　　　　修正値0、目標値10で判定
　　例) 2d6+2>=10　　　　修正値+2、目標値10で判定
　　例) 2d6+2>=10[11]　　↑をクリティカル値11で判定
　　例) 2d6+2>=10[12,4]　↑をクリティカル値12、ファンブル値4で判定
HELP_MESSAGE

  HELP_MESSAGE_2 = <<HELP_MESSAGE
　・クリティカルおよびファンブルのみの判定：2D6+m[c,f]
　　目標値を指定せず、修正値m、クリティカル値c、ファンブル値fで判定ロールを行います。
　　修正値、クリティカル値、ファンブル値は省略可能です（[]は省略不可）。
　　自動成功、自動失敗を自動表示します。

　　例) 2d6[]　　　　修正値0、クリティカル値12、ファンブル値2で判定
　　例) 2d6+2[11]　　修正値+2、クリティカル値11、ファンブル値2で判定
　　例) 2d6+2[12,4]　修正値+2、クリティカル値12、ファンブル値4で判定
HELP_MESSAGE

  HELP_MESSAGE_3 = <<HELP_MESSAGE
・D66ダイスあり（入れ替えなし)
HELP_MESSAGE

  # 既定のダイスボット説明文
  DEFAULT_HELP_MESSAGE = "#{HELP_MESSAGE_1}\n#{HELP_MESSAGE_2}\n#{HELP_MESSAGE_3}"

  # 成功判定のエイリアスコマンド定義用のクラスメソッドを提供するモジュール
  module ClassMethods
    # ダイスボットの説明文を返す
    # @return [String]
    attr_reader :help_message

    # 目標値あり成功判定のエイリアスコマンドの正規表現を返す
    # @return [Regexp, nil]
    attr_reader :aliases_re_for_srs_roll_with_target_value

    # 目標値なし成功判定のエイリアスコマンドの正規表現を返す
    # @return [Regexp, nil]
    attr_reader :aliases_re_for_srs_roll_without_target_value

    # 成功判定のエイリアスコマンドを設定する
    # @param [String] aliases エイリアスコマンド（可変長引数）
    # @return [self]
    #
    # エイリアスコマンドとして指定した文字列がコマンドの先頭にあれば、
    # 実行時にそれが2D6に置換されるようになる。
    def set_aliases_for_srs_roll(*aliases)
      aliases_upcase = aliases.map(&:upcase)
      aliases_part = aliases_upcase.
                     map { |a| Regexp.escape(a) }.
                     join('|')

      #@aliases_re_for_srs_roll_with_target_value = Regexp.new(
      #  '\A' \
      #  "(?:#{aliases_part})" \
      #  '((?:[-+][-+\d]+)?>=\d+(?:\[\d*(?:,\d+)?\])?)\z'
      #)
      @aliases_re_for_srs_roll_with_target_value = /^(?:#{aliases_part})((?:[-+][-+\d]+)?>=\d+(?:\[\d*(?:,\d+)?\])?)$/ # TKfix 変数代入を持つ正規表現

      #@aliases_re_for_srs_roll_without_target_value = Regexp.new(
      #  '\A' \
      #  "(?:#{aliases_part})" \
      #  '([-+][-+\d]+)?(\[\d*(?:,\d+)?\])?\z'
      #)
      @aliases_re_for_srs_roll_without_target_value = /^(?:#{aliases_part})([-+][-+\d]+)?(\[\d*(?:,\d+)?\])?$/ # TKfix 変数代入を持つ正規表現

      prepare_help_msg_for_aliases_for_srs_roll(aliases_upcase)
      @help_message = concatenate_help_messages

      return self
    end

    # 成功判定のエイリアスコマンドを未設定にする
    # @return [self]
    def clear_aliases_for_srs_roll
      @aliases_re_for_srs_roll_with_target_value = nil
      @aliases_re_for_srs_roll_without_target_value = nil
      @help_message = SRS::DEFAULT_HELP_MESSAGE

      return self
    end

    private

    # 成功判定のエイリアスコマンドの説明文を用意する
    # @param [Array<String>] aliases エイリアスコマンドの配列
    # @return [self]
    # @todo 現在は2文字のエイリアスコマンドに幅を合わせてある。
    #   エイリアスコマンドの文字数が変わる場合があれば、位置を調整するコードが
    #   必要。
    def prepare_help_msg_for_aliases_for_srs_roll(aliases)
      @help_msg_for_aliases_for_srs_roll_with_target_value =
        aliases.
        map { |a| "　　例) #{a}+2>=10　　　　 2d6+2>=10と同じ（#{a}が2D6のショートカットコマンド）\n" }.
        join()

      @help_msg_for_aliases_for_srs_roll_without_target_value =
        aliases.
        map { |a|
          "　　例) #{a}　　　　　 2d6[]と同じ（#{a}が2D6のショートカットコマンド）\n" \
          "　　例) #{a}+2[12,4]　 2d6+2[12,4]と同じ（#{a}が2D6のショートカットコマンド）\n"
        }.
        join()

      return self
    end

    # ダイスボットの説明文を結合する
    # @return [String] 結合された説明文
    def concatenate_help_messages
      "#{SRS::HELP_MESSAGE_1}" \
        "#{@help_msg_for_aliases_for_srs_roll_with_target_value}\n" \
        "#{SRS::HELP_MESSAGE_2}" \
        "#{@help_msg_for_aliases_for_srs_roll_without_target_value}\n" \
        "#{SRS::HELP_MESSAGE_3}"
    end
  end

  class << self
    # クラスが継承されたときに行う処理
    # @return [void]
    def inherited(subclass)
      subclass.
        extend(ClassMethods).
        clear_aliases_for_srs_roll
    end

    # ダイスボットの説明文を返す
    # @return [String] 既定のダイスボット説明文
    def help_message
      DEFAULT_HELP_MESSAGE
    end

    # 目標値あり成功判定のエイリアスコマンドの正規表現を返す
    # @return [nil]
    def aliases_re_for_srs_roll_with_target_value
      nil
    end

    # 目標値なし成功判定のエイリアスコマンドの正規表現を返す
    # @return [nil]
    def aliases_re_for_srs_roll_without_target_value
      nil
    end
  end

  # 固有のコマンドの接頭辞を設定する
  setPrefixes(['2D6.*'])

  # ダイスボットを初期化する
  def initialize
    super

    # 式、出目ともに送信する
    @sendMode = 2
    # バラバラロール（Bコマンド）でソートする
    @sortType = 1
    # D66ダイスあり（出目をソートしない）
    @d66Type = 1
  end

  # ダイスボットの説明文を返す
  # @return [String]
  def help_message
    self.class.help_message
  end

  # 既定のクリティカル値
  DEFAULT_CRITICAL_VALUE = 12
  # 既定のファンブル値
  DEFAULT_FUMBLE_VALUE = 2

  # 目標値あり成功判定の正規表現
  SRS_ROLL_WITH_TARGET_VALUE_RE =
    /\A2D6([-+][-+\d]+)?>=(\d+)(?:\[(\d+)?(?:,(\d+))?\])?\z/.freeze
  # 目標値なし成功判定の正規表現
  SRS_ROLL_WITHOUT_TARGET_VALUE_RE =
    /\A2D6([-+][-+\d]+)?\[(\d+)?(?:,(\d+))?\]\z/.freeze

  # 既定の閾値指定表記
  SRS_ROLL_DEFAULT_THRESHOLDS =
    "[#{DEFAULT_CRITICAL_VALUE},#{DEFAULT_FUMBLE_VALUE}]"

  # 成功判定コマンドのノード
  SRSRollNode = Struct.new(
    :modifier, :critical_value, :fumble_value, :target_value
  ) do
    include ModifierFormatter

    # 成功判定の文字列表記を返す
    # @return [String]
    def to_s
      lhs = "2D6#{format_modifier(modifier)}"
      expression = target_value ? "#{lhs}>=#{target_value}" : lhs

      return "#{expression}[#{critical_value},#{fumble_value}]"
    end
  end

  # 固有のダイスロールコマンドを実行する
  # @param [String] command 入力されたコマンド
  # @return [String, nil] ダイスロールコマンドの実行結果
  def rollDiceCommand(command)
    alias_replaced_with_2d6 = replace_alias_for_srs_roll_with_2d6(command)

    if (node = parse(alias_replaced_with_2d6))
      return execute_srs_roll(node)
    end

    return nil
  end

  private

  # 成功判定のエイリアスコマンドを2D6に置換する
  # @param [String] input 入力文字列
  # @return [String]
  def replace_alias_for_srs_roll_with_2d6(input)
    case input
    when self.class.aliases_re_for_srs_roll_with_target_value
      return "2D6#{Regexp.last_match(1)}"
    when self.class.aliases_re_for_srs_roll_without_target_value
      modifier = Regexp.last_match(1)
      thresholds = Regexp.last_match(2) || SRS_ROLL_DEFAULT_THRESHOLDS

      return "2D6#{modifier}#{thresholds}"
    else
      return input
    end
  end

  # 構文解析する
  # @param [String] command コマンド文字列
  # @return [SRSRollNode, nil]
  def parse(command)
    case command
    when SRS_ROLL_WITH_TARGET_VALUE_RE
      return parse_srs_roll_with_target_value(Regexp.last_match)
    when SRS_ROLL_WITHOUT_TARGET_VALUE_RE
      return parse_srs_roll_without_target_value(Regexp.last_match)
    else
      return nil
    end
  end

  # 修正値を評価する
  # @param [String, nil] modifier_str 修正値部分の文字列
  # @return [Integer] 修正値
  def eval_modifier(modifier_str)
    return 0 unless modifier_str

    return ArithmeticEvaluator.new.eval(modifier_str, @fractionType.to_sym)
  end

  # 目標値あり成功判定の正規表現マッチ情報からノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [SRSRollNode]
  def parse_srs_roll_with_target_value(m)
    modifier = eval_modifier(m[1])
    target_value = m[2].to_i
    critical_value = (m[3] && m[3].to_i) || DEFAULT_CRITICAL_VALUE
    fumble_value = (m[4] && m[4].to_i) || DEFAULT_FUMBLE_VALUE

    return SRSRollNode.new(modifier, critical_value, fumble_value, target_value)
  end

  # 目標値なし成功判定の正規表現マッチ情報からノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [SRSRollNode]
  def parse_srs_roll_without_target_value(m)
    modifier = eval_modifier(m[1])
    critical_value = (m[2] && m[2].to_i) || DEFAULT_CRITICAL_VALUE
    fumble_value = (m[3] && m[3].to_i) || DEFAULT_FUMBLE_VALUE

    return SRSRollNode.new(modifier, critical_value, fumble_value, nil)
  end

  # 成功判定を実行する
  # @param [SRSRollNode] srs_roll 成功判定ノード
  # @return [String] 成功判定結果
  def execute_srs_roll(srs_roll)
    sum, dice_str, = roll(2, 6, @sortType & 1)
    modified_sum = sum + srs_roll.modifier

    parts = [
      "(#{srs_roll})",
      "#{sum}[#{dice_str}]#{format_modifier(srs_roll.modifier)}",
      modified_sum,
      compare_result(srs_roll, sum, modified_sum)
    ]

    return parts.compact.join(' ＞ ')
  end

  # ダイスロール結果を目標値、クリティカル値、ファンブル値と比較する
  # @param [SRSRollNode] srs_roll 成功判定ノード
  # @param [Integer] sum 出目の合計
  # @param [Integer] modified_sum 修正後の値
  # @return [String, nil] 比較結果
  def compare_result(srs_roll, sum, modified_sum)
    if sum >= srs_roll.critical_value
      return '自動成功'
    end

    if sum <= srs_roll.fumble_value
      return '自動失敗'
    end

    if srs_roll.target_value
      return modified_sum >= srs_roll.target_value ? '成功' : '失敗'
    end

    return nil
  end
end
