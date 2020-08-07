# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Chill3 < DiceBot
  # ゲームシステムの識別子
  ID = 'Chill3'

  # ゲームシステム名
  NAME = 'Chill 3rd Edition'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ちる3'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・1D100で判定時に成否、Botchを判定
　例）1D100<=50
　　　Chill3 : (1D100<=50) ＞ 55 ＞ Botch
INFO_MESSAGE_TEXT

  def check_1D100(total, dice_total, cmp_op, target)
    return '' if target == '?'
    return '' unless cmp_op == :<=

    # ゾロ目ならC-ResultかBotch
    tens = (dice_total / 10).floor % 10 # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    ones = dice_total % 10

    if tens == ones
      if (total > target) || (dice_total == 100) # 00は必ず失敗
        if target > 100 # 目標値が100を超えている場合は、00を振ってもBotchにならない
          return " ＞ 失敗"
        else
          return " ＞ Botch"
        end
      else
        return " ＞ Ｃ成功"
      end
    elsif (total <= target) || (dice_total == 1) # 01は必ず成功
      if total <= (target / 2)
        return " ＞ Ｈ成功"
      else
        return " ＞ Ｌ成功"
      end
    else
      return " ＞ 失敗"
    end
  end
end
