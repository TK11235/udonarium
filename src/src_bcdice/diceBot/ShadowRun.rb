# -*- coding: utf-8 -*-

class ShadowRun < DiceBot
  def initialize
    super
    @sortType = 3
    @upplerRollThreshold = 6
    @unlimitedRollDiceType = 6
  end

  def gameName
    'シャドウラン'
  end

  def gameType
    "ShadowRun"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
上方無限ロール(xUn)の境界値を6にセットします。
INFO_MESSAGE_TEXT
  end
end
