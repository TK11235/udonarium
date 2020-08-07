# -*- coding: utf-8 -*-
# frozen_string_literal: true

class SharedFantasia < DiceBot
  # ゲームシステムの識別子
  ID = 'SharedFantasia'

  # ゲームシステム名
  NAME = 'Shared†Fantasia'

  # ゲームシステム名の読みがな
  SORT_KEY = 'しえああとふあんたしあ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
2D6の成功判定に 自動成功、自動失敗、致命的失敗、劇的成功 の判定があります。

SF/ST = 2D6のショートカット

例) SF+4>=9 : 2D6して4を足した値が9以上なら成功
MESSAGETEXT

  setPrefixes(['SF.*', 'ST.*'])

  def changeText(string)
    @throwString = ''
    if string =~ /SF/i
      string = string.gsub(/SF/i) { "2D6" }
    end
    if string =~ /ST/i
      string = string.gsub(/ST/i) { "2D6" }
    end
    return string
  end

  def check_2D6(total, dice_total, _dice_list, cmp_op, target)
    return '' if target == '?'

    critical = false
    fumble   = false

    if dice_total == 12
      critical = true
    elsif dice_total == 2
      fumble   = true
    end

    totalValueBonus = 0
    if cmp_op == :>=
      totalValueBonus = 1
    end

    if [:>=, :>].include?(cmp_op)
      if (total + totalValueBonus) > target
        if critical
          return " ＞ 自動成功(劇的成功)"
        elsif fumble
          return " ＞ 自動失敗"
        else
          return " ＞ 成功"
        end
      else
        if critical
          return " ＞ 自動成功"
        elsif fumble
          return " ＞ 自動失敗(致命的失敗)"
        else
          return " ＞ 失敗"
        end
      end
    end
  end
end
