# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Hieizan < DiceBot
  # ゲームシステムの識別子
  ID = 'Hieizan'

  # ゲームシステム名
  NAME = '比叡山炎上'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ひえいさんえんしよう'

  # ダイスボットの使い方
  HELP_MESSAGE = "大成功、自動成功、失敗、自動失敗、大失敗の自動判定を行います。\n"

  # ゲーム別成功度判定(1d100)
  def check_1D100(total, _dice_total, _cmp_op, target)
    return '' if target == '?'

    if total <= 1
      # 1は自動成功
      if total <= (target / 5)
        " ＞ 大成功"
      else
        " ＞ 自動成功"
      end
    elsif total >= 100
      # 00は大失敗(大失敗は自動失敗でもある)
      " ＞ 大失敗"
    elsif total >= 96
      # 96-00は自動失敗
      " ＞ 自動失敗"
    elsif total <= target
      if total <= (target / 5)
        # 目標値の1/5以下は大成功
        " ＞ 大成功"
      else
        " ＞ 成功"
      end
    else
      " ＞ 失敗"
    end
  end
end
