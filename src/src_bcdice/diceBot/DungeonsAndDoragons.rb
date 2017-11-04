# -*- coding: utf-8 -*-

class DungeonsAndDoragons < DiceBot
  setPrefixes(['\d+e.*'])
  
  def initialize
    super
  end
  
  def prefixs
    []
  end
  
  def gameName
    'ダンジョンズ＆ドラゴンズ'
  end
  
  def gameType
    "DungeonsAndDoragons"
  end
  
  def getHelpMessage
    return <<MESSAGETEXT
※このダイスボットは部屋のシステム名表示用となります。
MESSAGETEXT
  end
  
end
