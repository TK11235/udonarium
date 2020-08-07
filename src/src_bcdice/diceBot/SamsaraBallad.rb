# -*- coding: utf-8 -*-
# frozen_string_literal: true

require "utils/command_parser"

class SamsaraBallad < DiceBot
  # ゲームシステムの識別子
  ID = 'SamsaraBallad'

  # ゲームシステム名
  NAME = 'サンサーラ・バラッド'

  # ゲームシステム名の読みがな
  #
  # 「ゲームシステム名の読みがなの設定方法」（docs/dicebot_sort_key.md）を参考にして
  # 設定してください
  SORT_KEY = 'さんさあらはらつと'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
SB	 通常のD100ロールを行う
SBS	 スワップロールでD100ロールを行う
SB#x@y	 F値をx、C値をyとして通常のD100ロールを行う
SBS#x@y	 F値をx、C値をyとしてスワップロールでD100ロールを行う

例：
SB<=85 通常の技能で成功率85%の判定
SBS<=70 習熟を得た技能で成功率70%の判定
SBS#3@7<=80 習熟を得た技能で、F値3、C値7で成功率80%の攻撃判定
SB<57 通常の技能で、能動側の達成値が57の受動判定
SBS<70 習熟を得た技能で、能動側の達成値が70の受動判定
MESSAGETEXT

  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes(['SBS?.*'])

  def rollDiceCommand(command)
    debug("rollDiceCommand Begin")

    parser = CommandParser.new('SB', 'SBS')
    cmd = parser.parse(command)

    unless cmd
      return nil
    end

    if cmd.command == 'SB'
      places_text = nil
      total, = roll(1, 100)
    else
      a, = roll(1, 10)
      b, = roll(1, 10)
      places_text = "#{a},#{b}"
      places = [a, b].map { |n| n == 10 ? 0 : n }.sort

      total = places[0] * 10 + places[1]
      total = 100 if total == 0
    end

    cmp_result = compare(total, cmd)

    sequence = [
      "(D100#{cmd.cmp_op}#{cmd.target_number})",
      places_text,
      total.to_s,
      cmp_result,
    ].compact

    return sequence.join(" ＞ ")
  end

  private

  # @return [String]
  # @return [nil]
  def compare(total, cmd)
    if [:<=, :<].include?(cmd.cmp_op)
      if !total.send(cmd.cmp_op, cmd.target_number)
        "失敗"
      elsif fumble?(total, cmd.fumble)
        "ファンブル"
      elsif critical?(total, cmd.critical)
        "クリティカル"
      else
        "成功"
      end
    elsif fumble?(total, cmd.fumble)
      # ファンブル優先
      "ファンブル"
    elsif critical?(total, cmd.critical)
      "クリティカル"
    end
  end

  # @param total [Integer]
  # @param fumble [Integer, nil]
  # @return [Boolean]
  def fumble?(total, fumble)
    fumble && (total % 10 <= fumble)
  end

  # @param total [Integer]
  # @param critical [Integer, nil]
  # @return [Boolean]
  def critical?(total, critical)
    critical && (total % 10 >= critical)
  end
end
