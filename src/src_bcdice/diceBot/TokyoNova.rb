# -*- coding: utf-8 -*-

class TokyoNova < DiceBot
  def initialize
    super
  end

  def gameName
    'トーキョーＮ◎ＶＡ'
  end

  def gameType
    "TokyoNova"
  end

  def getHelpMessage
    return <<MESSAGETEXT
※このダイスボットは部屋のシステム名表示用となります。
MESSAGETEXT
  end
end
