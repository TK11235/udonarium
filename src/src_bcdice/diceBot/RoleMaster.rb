# -*- coding: utf-8 -*-

class RoleMaster < DiceBot
  def initialize
    super
    @upplerRollThreshold = 96
    @unlimitedRollDiceType = 100
  end

  def gameName
    'ロールマスター'
  end

  def gameType
    "RoleMaster"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
上方無限ロール(xUn)の境界値を96にセットします。
INFO_MESSAGE_TEXT
  end
end
