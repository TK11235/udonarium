# -*- coding: utf-8 -*-

class Pendragon < DiceBot
  def gameName
    'ペンドラゴン'
  end

  def gameType
    "Pendragon"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
クリティカル、成功、失敗、ファンブルの自動判定を行います。
INFO_MESSAGE_TEXT
  end

  # ゲーム別成功度判定(1d20)
  def check_1D20(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return '' unless signOfInequality == "<="

    if total_n <= diff
      if (total_n >= (40 - diff)) || (total_n == diff)
        return " ＞ クリティカル"
      end

      return " ＞ 成功"
    else
      if total_n == 20
        return " ＞ ファンブル"
      end

      return " ＞ 失敗"
    end
  end
end
