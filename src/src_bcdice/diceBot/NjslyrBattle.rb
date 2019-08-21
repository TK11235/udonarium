# -*- coding: utf-8 -*-

class NjslyrBattle < DiceBot
  def gameName
    'NJSLYRBATTLE'
  end

  def gameType
    "NJSLYRBATTLE"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・カラテロール
2d6<=(カラテ点)
例）2d6<=5
(2D6<=5) ＞ 2[1,1] ＞ 2 ＞ 成功 重点 3 溜まる
INFO_MESSAGE_TEXT
  end

  # ゲーム別成功度判定(2D6)
  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return '' if signOfInequality != "<="

    success = checkSuccess(total_n, diff)
    juuten = getJuuten

    return success + juuten
  end

  def checkSuccess(total_n, diff)
    if total_n <= diff
      return " ＞ 成功"
    end

    return " ＞ 失敗"
  end

  def getJuuten
    diceList = getDiceList
    return '' if diceList.length != 2

    juuten = 0

    diceList.each do |i|
      juuten += 1 if  i == 1
      juuten += 1 if  i == 6
    end

    if diceList[0] == diceList[1]
      juuten += 1
    end

    if juuten > 0
      return " 重点 #{juuten} 溜まる"
    end

    return ''
  end
end
