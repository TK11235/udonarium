# -*- coding: utf-8 -*-
# frozen_string_literal: true

class EclipsePhase < DiceBot
  # ゲームシステムの識別子
  ID = 'EclipsePhase'

  # ゲームシステム名
  NAME = 'エクリプス・フェイズ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'えくりふすふえいす'

  # ダイスボットの使い方
  HELP_MESSAGE =
    '1D100<=m 方式の判定で成否、クリティカル・ファンブルを自動判定'

  def check_1D100(total, _dice_total, cmp_op, target)
    return '' unless cmp_op == :<=

    diceValue = total % 100 # 出目00は100ではなく00とする
    dice_ten_place = (diceValue / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    dice_one_place = diceValue % 10

    if dice_ten_place == dice_one_place
      return ' ＞ 決定的失敗' if diceValue == 99
      return ' ＞ 00 ＞ 決定的成功' if diceValue == 0
      return ' ＞ 決定的成功' if total <= target

      return ' ＞ 決定的失敗'
    end

    diff_threshold = 30

    if total <= target
      if total >= diff_threshold
        ' ＞ エクセレント'
      else
        ' ＞ 成功'
      end
    elsif (total - target) >= diff_threshold
      ' ＞ シビア'
    else
      ' ＞ 失敗'
    end
  end
end
