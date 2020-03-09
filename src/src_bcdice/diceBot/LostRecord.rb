# -*- coding: utf-8 -*-

class LostRecord < DiceBot
  def initialize
    super()

    # D66は昇順に
    @d66Type = 2
  end

  def gameName
    "ロストレコード"
  end

  def gameType
    "LostRecord"
  end

  def getHelpMessage
    return <<MESSAGETEXT
※このダイスボットは部屋のシステム名表示用となります。
D66を振った時、小さい目が十の位になります。
MESSAGETEXT
  end
end
