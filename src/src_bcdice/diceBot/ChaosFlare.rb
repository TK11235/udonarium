# -*- coding: utf-8 -*-

class ChaosFlare < DiceBot
  # ダイスボット設定後に行う処理
  # @return [void]
  def postSet
    #if @@bcdice # TKfix @@bcdice が参照できない (Opal 0.11.4)
    #  @@bcdice.cardTrader.set2Decks2Jokers
    #  # 手札の他のカード置き場
    #  @@bcdice.cardTrader.card_place = 0
    #  # 場札のタップ処理の必要があるか？
    #  @@bcdice.cardTrader.canTapCard = false
    if bcdice
      bcdice.cardTrader.set2Decks2Jokers
      # 手札の他のカード置き場
      bcdice.cardTrader.card_place = 0
      # 場札のタップ処理の必要があるか？
      bcdice.cardTrader.canTapCard = false
    end
  end

  def gameName
    'カオスフレア'
  end

  def gameType
    "Chaos Flare"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
失敗、成功の判定。差分値の計算も行います。
ファンブル時は達成値を-20します。
INFO_MESSAGE_TEXT
  end

  # ゲーム別成功度判定(2D6)
  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    output = ''

    if dice_n <= 2
      total_n -= 20
      output += " ＞ ファンブル(-20)"
    end

    return output unless signOfInequality == ">="

    if total_n >= diff
      output += " ＞ 成功"
      if total_n > diff
        output += " ＞ 差分値#{total_n - diff}"
      end
    else
      output += " ＞ 失敗"
      output += " ＞ 差分値#{total_n - diff}"
    end

    return output
  end
end
