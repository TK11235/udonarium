# -*- coding: utf-8 -*-

class DungeonsAndDoragons < DiceBot
  def initialize
    super
  end

  def gameName
    'ダンジョンズ＆ドラゴンズ'
  end

  def gameType
    "DungeonsAndDoragons"
  end

  def getHelpMessage
    return <<MESSAGETEXT
※この骰子ボットは部屋のシステム名表示用となります。
MESSAGETEXT
  end
end
