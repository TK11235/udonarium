# -*- coding: utf-8 -*-

class JamesBond < DiceBot
  def gameName
    'ジェームズ・ボンド007'
  end

  def gameType
    "JamesBond"
  end

  def getHelpMessage
    info = <<INFO_MESSAGE_TEXT
・1D100の目標値判定で、効果レーティングを1～4で自動判定。
　例）1D100<=50
　　　JamesBond : (1D100<=50) → 20 → 効果3（良）
INFO_MESSAGE_TEXT
  end

  def check_1D100(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max) # ゲーム別成功度判定(1d100)
    return '' unless signOfInequality == "<="

    if total_n >= 100 # 100は常に失敗
      return " ＞ 失敗"
    end

    base = ((diff + 9) / 10).floor

    if total_n <= base
      return " ＞ 効果1（完璧）"
    end

    if total_n <= base * 2
      return " ＞ 効果2（かなり良い）"
    end

    if total_n <= base * 5
      return " ＞ 効果3（良）"
    end

    if total_n <= diff
      return " ＞ 効果4（まあまあ）"
    end

    return " ＞ 失敗"
  end
end
