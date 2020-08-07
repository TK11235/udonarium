# -*- coding: utf-8 -*-
# frozen_string_literal: true

class WaresBlade < DiceBot
  # ゲームシステムの識別子
  ID = 'WaresBlade'

  # ゲームシステム名
  NAME = 'ワースブレイド'

  # ゲームシステム名の読みがな
  SORT_KEY = 'わあすふれいと'

  # ダイスボットの使い方
  HELP_MESSAGE = "nD10>=m 方式の判定で成否、完全成功、完全失敗を自動判定します。\n"

  def check_nD10(total, _dice_total, dice_list, cmp_op, target)
    return '' if target == '?'
    return '' unless cmp_op == :>=

    if dice_list.count(10) == dice_list.size
      ' ＞ 完全成功'
    elsif dice_list.count(1) == dice_list.size
      ' ＞ 絶対失敗'
    elsif total >= target
      ' ＞ 成功'
    else
      ' ＞ 失敗'
    end
  end
end
