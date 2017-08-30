# -*- coding: utf-8 -*-

require 'diceBot/NightWizard'

class NightWizard3rd < NightWizard
  
  def initialize
    super
  end
  
  def gameName
    'ナイトウィザード3版'
  end
  
  def gameType
    "NightWizard3rd"
  end
  
  
  def getFumbleTextAndTotal(base, modify, dice_str)
    total = base + modify
    total += -10
    text = "#{base + modify}-10[#{dice_str}]"
    return text, total
  end
  
  
end
