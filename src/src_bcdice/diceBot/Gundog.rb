# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Gundog < DiceBot
  # ゲームシステムの識別子
  ID = 'Gundog'

  # ゲームシステム名
  NAME = 'ガンドッグ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'かんとつく'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
失敗、成功、クリティカル、ファンブルとロールの達成値の自動判定を行います。
nD9ロールも対応。
INFO_MESSAGE_TEXT

  # ゲーム別成功度判定(1d100)
  def check_1D100(total, _dice_total, cmp_op, target)
    return '' if target == '?'
    return '' unless cmp_op == :<=

    if total >= 100
      " ＞ ファンブル"
    elsif total <= 1
      " ＞ 絶対成功(達成値1+SL)"
    elsif total <= target
      dig10 = (total / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
      dig1 = total - dig10 * 10
      dig10 = 0 if dig10 >= 10
      dig1 = 0 if dig1 >= 10 # 条件的にはあり得ない(笑

      if dig1 <= 0
        " ＞ クリティカル(達成値20+SL)"
      else
        " ＞ 成功(達成値#{(dig10 + dig1)}+SL)"
      end
    else
      " ＞ 失敗"
    end
  end

  def isD9
    true
  end
end
