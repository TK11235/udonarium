# -*- coding: utf-8 -*-
# frozen_string_literal: true

class InfiniteFantasia < DiceBot
  # ゲームシステムの識別子
  ID = 'InfiniteFantasia'

  # ゲームシステム名
  NAME = '無限のファンタジア'

  # ゲームシステム名の読みがな
  SORT_KEY = 'むけんのふあんたしあ'

  # ダイスボットの使い方
  HELP_MESSAGE = "失敗、成功レベルの自動判定を行います。\n"

  # ゲーム別成功度判定(1d20)
  def check_1D20(total, _dice_total, cmp_op, target)
    if cmp_op != :<=
      return ''
    elsif total > target
      return " ＞ 失敗"
    end

    output =
      if total <= (target / 32)
        " ＞ 32レベル成功(32Lv+)"
      elsif total <= (target / 16)
        " ＞ 16レベル成功(16LV+)"
      elsif total <= (target / 8)
        " ＞ 8レベル成功"
      elsif total <= (target / 4)
        " ＞ 4レベル成功"
      elsif total <= (target / 2)
        " ＞ 2レベル成功"
      else
        " ＞ 1レベル成功"
      end

    if total <= 1
      output += "/クリティカル"
    end

    output
  end
end
