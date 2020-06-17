# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Pendragon < DiceBot
  # ゲームシステムの識別子
  ID = 'Pendragon'

  # ゲームシステム名
  NAME = 'ペンドラゴン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'へんとらこん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
クリティカル、成功、失敗、ファンブルの自動判定を行います。
INFO_MESSAGE_TEXT

  # ゲーム別成功度判定(1d20)
  def check_1D20(total, _dice_total, cmp_op, target)
    return '' unless cmp_op == :<=

    if total <= target
      if (total >= (40 - target)) || (total == target)
        " ＞ クリティカル"
      else
        " ＞ 成功"
      end
    elsif total == 20
      " ＞ ファンブル"
    else
      " ＞ 失敗"
    end
  end
end
