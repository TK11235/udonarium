# -*- coding: utf-8 -*-

class RuneQuest < DiceBot
  def gameName
    'ルーンクエスト'
  end

  def gameType
    "RuneQuest"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
クリティカル、エフェクティブ(効果的成功)、ファンブルの自動判定を行います。
INFO_MESSAGE_TEXT
  end

  # ゲーム別成功度判定(1d100)
  def check_1D100(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return "" unless signOfInequality == "<="

    cliticalValue = ((1.0 * diff / 20) + 0.5)

    # 1は常に決定的成功
    return " ＞ 決定的成功" if (total_n <= 1) || (total_n <= cliticalValue)

    # 100は常に致命的失敗
    return " ＞ 致命的失敗" if total_n >= 100

    return " ＞ 効果的成功" if total_n <= (diff / 5 + 0.5)
    return " ＞ 成功" if total_n <= diff
    return " ＞ 致命的失敗" if total_n >= (95 + (diff / 20 + 0.5))

    return " ＞ 失敗"
  end
end
