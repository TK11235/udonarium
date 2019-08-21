# -*- coding: utf-8 -*-

class WaresBlade < DiceBot
  def initialize
    super
  end

  def gameName
    'ワースブレイド'
  end

  def gameType
    "WaresBlade"
  end

  def getHelpMessage
    return <<MESSAGETEXT
nD10>=m 方式の判定で成否、完全成功、完全失敗を自動判定します。
MESSAGETEXT
  end

  def check_nD10(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)# ゲーム別成功度判定(nD10)
    return '' unless signOfInequality == '>='

    if dice_n == 10 * dice_cnt

      return ' ＞ 完全成功'

    elsif dice_n == 1 * dice_cnt

      return ' ＞ 絶対失敗'

    else

      if total_n >= diff
        return ' ＞ 成功'
      else
        return ' ＞ 失敗'
      end

    end
  end
end
