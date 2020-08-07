# -*- coding: utf-8 -*-
# frozen_string_literal: true

class NeverCloud < DiceBot
  # ゲームシステムの識別子
  ID = 'NeverCloud'

  # ゲームシステム名
  NAME = 'ネバークラウドTRPG'

  # ゲームシステム名の読みがな
  #
  # 「ゲームシステム名の読みがなの設定方法」（docs/dicebot_sort_key.md）を参考にして
  # 設定してください
  SORT_KEY = 'ねはあくらうとTRPG'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・判定(xNC±y>=z)
　xD6の判定を行います。ファンブル、クリティカルの場合、その旨を出力します。
　x：振るダイスの数。
　±y：固定値・修正値。省略可能。
　z：目標値。省略可能。
　例）　2NC+2>=5　1NC
MESSAGETEXT

  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes(['\d+NC.*', '\d+D6?([\+\-\d]*)>=\d+'])

  def rollDiceCommand(command)
    m = /^(\d+)(?:NC|D6?)((?:[-+]\d+)*)(>=(\d+))?$/i.match(command)
    unless m
      return nil
    end

    dice_count = m[1].to_i
    modify_str = m[2]
    modify_number = ArithmeticEvaluator.new.eval(modify_str)
    cmp_str = m[3]
    target = m[4] && m[4].to_i

    if modify_number == 0
      modify_str = ''
    end

    dice_value, dice_str, = roll(dice_count, 6)
    dice_list = dice_str.split(',').map(&:to_i)

    total = dice_value + modify_number

    result =
      if dice_list.count(1) == dice_count
        total = 0
        "ファンブル"
      elsif dice_list.count(6) >= 2
        "クリティカル"
      elsif target
        total >= target ? "成功" : "失敗"
      end

    sequence = [
      "(#{dice_count}D6#{modify_str}#{cmp_str})",
      "#{dice_value}[#{dice_str}]#{modify_str}",
      total,
      result
    ].compact

    return sequence.join(" ＞ ")
  end
end
