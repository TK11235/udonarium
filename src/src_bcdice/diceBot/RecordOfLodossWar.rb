# -*- coding: utf-8 -*-

require 'utils/command_parser'

class RecordOfLodossWar < DiceBot
  ID = 'RecordOfLodossWar'.freeze
  NAME = 'ロードス島戦記RPG'.freeze
  SORT_KEY = 'ろおとすとうせんきRPG'.freeze

  HELP_MESSAGE = <<INFO_MESSAGE_TEXT.freeze
●判定
　LW<=(目標値)で判定。
　達成値が目標値の1/10(端数切り上げ)以下であれば大成功。1～10であれば自動成功。
　91～100であれば自動失敗となります。

●回避判定
　LWD<=(目標値)で回避判定。この時出目が51以上で自動失敗となります。

　判定と回避判定は、どちらもコマンドだけの場合、出目の表示と自動成功と自動失敗の判定のみを行います。
INFO_MESSAGE_TEXT

  setPrefixes(['LW.*'])

  def rollDiceCommand(command)
    parser = CommandParser.new("LW", "LWD")
    cmd = parser.parse(command)

    if cmd.nil? || ![nil, :<=].include?(cmd.cmp_op)
      return nil
    end

    auto_failure = cmd.command == "LWD" ? 51 : 91
    critical = (cmd.target_number.to_f / 10).ceil

    dice_value, = roll(1, 100)

    result =
      if dice_value >= auto_failure
        "自動失敗(#{auto_failure})"
      elsif dice_value <= critical
        "大成功(#{critical})"
      elsif dice_value <= 10
        "自動成功"
      elsif cmd.cmp_op
        dice_value <= cmd.target_number ? "成功" : "失敗"
      end

    sequence = [
      "(1D100#{cmd.cmp_op}#{cmd.target_number})",
      dice_value.to_s,
      result
    ].compact

    return sequence.join(" ＞ ")
  end
end
