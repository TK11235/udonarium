# -*- coding: utf-8 -*-
# frozen_string_literal: true

class RuneQuest < DiceBot
  # ゲームシステムの識別子
  ID = 'RuneQuest'

  # ゲームシステム名
  NAME = 'ルーンクエスト'

  # ゲームシステム名の読みがな
  SORT_KEY = 'るうんくえすと'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
クリティカル、エフェクティブ(効果的成功)、ファンブルの自動判定を行います。
INFO_MESSAGE_TEXT

  # ゲーム別成功度判定(1d100)
  def check_1D100(total, _dice_total, cmp_op, target)
    return nil unless cmp_op == :<=

    # RuneQuest QUICK-START RULESを元に修正
    # https://www.chaosium.com/content/FreePDFs/RuneQuest/CHA4027%20-%20RuneQuest%20Quickstart.pdf
    critical_value = (target.to_f / 20).round

    if (total <= 1) || (total <= critical_value)
      # 1は常に決定的成功
      " ＞ 決定的成功"
    elsif total >= 100
      # 100は常に致命的失敗
      " ＞ 致命的失敗"
    elsif total <= (target.to_f / 5).round
      " ＞ 効果的成功"
    elsif total <= target
      " ＞ 成功"
    elsif total >= 95 + critical_value
      " ＞ 致命的失敗"
    else
      " ＞ 失敗"
    end
  end
end
