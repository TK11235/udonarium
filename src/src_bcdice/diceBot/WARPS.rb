# -*- coding: utf-8 -*-
# frozen_string_literal: true

class WARPS < DiceBot
  # ゲームシステムの識別子
  ID = 'WARPS'

  # ゲームシステム名
  NAME = 'ワープス'

  # ゲームシステム名の読みがな
  SORT_KEY = 'わあふす'

  # ダイスボットの使い方
  HELP_MESSAGE = "失敗、成功度の自動判定を行います。\n"

  def check_2D6(total, dice_total, _dice_list, cmp_op, target)
    if dice_total <= 2
      " ＞ クリティカル"
    elsif dice_total >= 12
      " ＞ ファンブル"
    elsif cmp_op == :<= && target != "?"
      if total <= target
        " ＞ #{target - total}成功"
      else
        " ＞ 失敗"
      end
    end
  end
end
