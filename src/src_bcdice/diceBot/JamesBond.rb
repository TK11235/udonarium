# -*- coding: utf-8 -*-
# frozen_string_literal: true

class JamesBond < DiceBot
  # ゲームシステムの識別子
  ID = 'JamesBond'

  # ゲームシステム名
  NAME = 'ジェームズ・ボンド007'

  # ゲームシステム名の読みがな
  SORT_KEY = 'しええむすほんと007'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・1D100の目標値判定で、効果レーティングを1～4で自動判定。
　例）1D100<=50
　　　JamesBond : (1D100<=50) → 20 → 効果3（良）
INFO_MESSAGE_TEXT

  def check_1D100(total, _dice_total, cmp_op, target) # ゲーム別成功度判定(1d100)
    return '' unless cmp_op == :<=

    base = ((target + 9) / 10).floor

    if total >= 100
      # 100は常に失敗
      " ＞ 失敗"
    elsif total <= base
      " ＞ 効果1（完璧）"
    elsif total <= base * 2
      " ＞ 効果2（かなり良い）"
    elsif total <= base * 5
      " ＞ 効果3（良）"
    elsif total <= target
      " ＞ 効果4（まあまあ）"
    else
      " ＞ 失敗"
    end
  end
end
