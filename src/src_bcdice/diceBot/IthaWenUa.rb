# -*- coding: utf-8 -*-
# frozen_string_literal: true

class IthaWenUa < DiceBot
  # ゲームシステムの識別子
  ID = 'IthaWenUa'

  # ゲームシステム名
  NAME = 'イサー・ウェン＝アー'

  # ゲームシステム名の読みがな
  SORT_KEY = 'いさあうえんああ'

  # ダイスボットの使い方
  HELP_MESSAGE = "1D100<=m 方式の判定で成否、クリティカル(01)・ファンブル(00)を自動判定します。\n"

  def check_1D100(total, _dice_total, cmp_op, target)
    return '' unless cmp_op == :<=

    diceValue = total % 100
    dice0 = (diceValue / 10).floor # 10の位を代入 # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある 
    dice1 = diceValue % 10 # 1の位を代入

    if (dice0 == 0) && (dice1 == 1)
      ' ＞ 01 ＞ クリティカル'
    elsif (dice0 == 0) && (dice1 == 0)
      ' ＞ 00 ＞ ファンブル'
    elsif total <= target
      ' ＞ 成功'
    else
      ' ＞ 失敗'
    end
  end
end
