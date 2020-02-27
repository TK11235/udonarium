# -*- coding: utf-8 -*-

class Chill3 < DiceBot
  def gameName
    'Chill 3'
  end

  def gameType
    "Chill3"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・1D100で判定時に成否、Botchを判定
　例）1D100<=50
　　　Chill3 : (1D100<=50) ＞ 55 ＞ Botch
INFO_MESSAGE_TEXT
  end

  def check_1D100(total_n, dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(1D100)
    return '' unless signOfInequality == "<="

    # ゾロ目ならC-ResultかBotch
    s10 = dice_n.div(10) # 10'sダイスの出目
    s1 = dice_n % 10 # 1'sダイスの出目

    if s10 == 10
      s10 = 0 # 10'sと1'sの表記をそろえる
    end

    if s10 == s1
      if (total_n > diff) || (dice_n == 100) # 00は必ず失敗
        if diff > 100 # 目標値が100を超えている場合は、00を振ってもBotchにならない
          return " ＞ 失敗"
        end

        return " ＞ Botch"
      end
      return " ＞ Ｃ成功"
    end

    if (total_n <= diff) || (dice_n == 1) # 01は必ず成功
      if total_n <= (diff / 2)
        return " ＞ Ｈ成功"
      end

      return " ＞ Ｌ成功"
    end

    return " ＞ 失敗"
  end
end
