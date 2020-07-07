# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Elric < DiceBot
  # ゲームシステムの識別子
  ID = 'Elric!'

  # ゲームシステム名
  NAME = 'エルリック！'

  # ゲームシステム名の読みがな
  SORT_KEY = 'えるりつく'

  # ダイスボットの使い方
  HELP_MESSAGE = "貫通、クリティカル、ファンブルの自動判定を行います。\n"

  # ゲーム別成功度判定(1d100)
  def check_1D100(total, _dice_total, cmp_op, target)
    return '' unless cmp_op == :<=

    # 1は常に貫通
    return " ＞ 貫通" if total <= 1
    # 100は常に致命的失敗
    return " ＞ 致命的失敗" if total >= 100

    return " ＞ 決定的成功" if total <= (target / 5 + 0.9)
    return " ＞ 成功" if total <= target
    return " ＞ 致命的失敗" if (total >= 99) && (target < 100)

    return " ＞ 失敗"
  end
end
