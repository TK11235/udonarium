# -*- coding: utf-8 -*-

require 'diceBot/DungeonsAndDoragons'

class Pathfinder < DungeonsAndDoragons
  
  def initialize
    super
  end
  
  def gameName
    'Pathfinder'
  end
  
  def gameType
    "Pathfinder"
  end
  
  def getHelpMessage
    return <<MESSAGETEXT
※このダイスボットは部屋のシステム名表示用となります。
MESSAGETEXT
  end
  
end
