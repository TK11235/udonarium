# -*- coding: utf-8 -*-

class WARPS < DiceBot
  def gameName
    'ワープス'
  end

  def gameType
    "WARPS"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
失敗、成功度の自動判定を行います。
INFO_MESSAGE_TEXT
  end

  def check_2D6(total_n, dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(2D6)
    debug('WARPS check_2D6 betgin')
    debug('diff', diff)
    debug('total_n', total_n)

    if dice_n <= 2
      return " ＞ クリティカル"
    elsif dice_n >= 12
      return " ＞ ファンブル"
    elsif signOfInequality == "<="
      if diff != "?"
        if total_n <= diff
          success = diff - total_n
          return " ＞ #{success}成功"
        else
          return " ＞ 失敗"
        end
      end
    end

    return output
  end
end
