# -*- coding: utf-8 -*-

class Airgetlamh < DiceBot

  def initialize
    super
    @sortType = 1 #ダイスのソート有
  end
  
  
  def prefixs
    ['\d+AL\d+(x|\*)\d+',]
  end
  
  def gameName
    '朱の孤塔のエアゲトラム'
  end

  def gameType
    "Airgetlamh"
  end
  
  def getHelpMessage
    return <<MESSAGETEXT
・命中判定
[n]AL[X]*[p]：「n」で連射数を指定、「X」で目標値を指定、「p」で威力を指定。
「*」は「x」でも代用化。
例：3AL7*5 → 3連射で目標値7、威力5、5AL5x3 → 5連射で目標値5、威力3
MESSAGETEXT
  end
  
  
  def rollDiceCommand(command)
    
    output = 
      case command.upcase
        
      when /(\d+)AL(\d+)(x|\*)(\d+)$/i
        rapid = $1.to_i
        target = $2.to_i
        damage = $4.to_i
        checkRoll(rapid, target, damage)
        
      else
        nil
      end
    
    return output
  end
  
  
  def checkRoll(rapid, target, damage)
    dice, diceText = roll(rapid, 10, @sortType)
    diceArray = diceText.split(/,/).collect{|i|i.to_i}
    
    diceCount = 0
    diceArray.each do |i|
      if(i <= target)
        diceCount += 1
      end
    end
    
    resultDamage = diceCount * damage
    
    #TKfix << 
    result = ""
    result = result +  "(#{rapid}D10\<\=#{target}) ＞ #{diceText} ＞ Success：#{diceCount}*#{damage} ＞ #{resultDamage}ダメージ"
    return result
  end
  
  
end
