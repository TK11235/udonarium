# -*- coding: utf-8 -*-

class Ryutama < DiceBot
  setPrefixes(['R\d+.*'])

  def initialize
    super
    @validDiceTypes = [20, 12, 10, 8, 6, 4, 2]
  end
  def gameName
    'りゅうたま'
  end

  def gameType
    "Ryutama"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定
　Rx,y>=t（x,y：使用する能力値、t：目標値）
　1ゾロ、クリティカルも含めて判定結果を表示します
　能力値１つでの判定は Rx>=t で行えます
例）R8,6>=13
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand begin')

    unless( /^R(\d+)(,(\d+))?([\+\-\d]+)?(>=(\d+))?/ === command )
      debug('unmatched!')
      return ''
    end
    debug('matched')

    dice1 = $1.to_i
    dice2 = $3.to_i
    modifyString = $4
    difficulty = $6

    dice1, dice2 = getDiceType(dice1, dice2)
    if( dice1 == 0 )
      return ''
    end

    modifyString ||= ''
    modify = parren_killer("(" + modifyString + ")").to_i
    difficulty = getDiffculty(difficulty)

    value1 = getRollValue(dice1)
    value2 = getRollValue(dice2)
    total = value1 + value2 + modify

    result = getResultText(value1, value2, dice1, dice2, difficulty, total)
    unless( result.empty? )
      result = " ＞ #{result}"
    end

    value1Text = "#{value1}(#{dice1})"
    value2Text = ((value2 == 0) ? "" : "+#{value2}(#{dice2})")
    modifyText = getModifyString(modify)

    baseText = getBaseText(dice1, dice2, modify, difficulty)
    output = "(#{baseText}) ＞ #{value1Text}#{value2Text}#{modifyText} ＞ #{total}#{result}"
    return output
  end

  def getDiceType(dice1, dice2)
    debug('getDiceType begin')

    if( dice2 != 0 )
      if( isValidDiceOne(dice1) )
        return dice1, dice2
      else
        return 0, 0
      end
    end

    if( isValidDice(dice1, dice2) )
      return dice1, dice2
    end

    diceBase = dice1

    #dice1 = diceBase / 10
    dice1 = (diceBase / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    dice2 = diceBase % 10

    if( isValidDice(dice1, dice2) )
      return dice1, dice2
    end

    #dice1 = diceBase / 100
    dice1 = (diceBase / 100).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    dice2 = diceBase % 100

    if( isValidDice(dice1, dice2) )
      return dice1, dice2
    end

    if( isValidDiceOne(diceBase) )
      return diceBase, 0
    end

    return 0, 0
  end

  def isValidDice(dice1, dice2)
    return ( isValidDiceOne(dice1) and
             isValidDiceOne(dice2) )
  end

  def isValidDiceOne(dice)
    @validDiceTypes.include?(dice)
  end

  def getDiffculty(difficulty)

    unless( difficulty.nil? )
      difficulty = difficulty.to_i
    end

    return difficulty
  end

  def getRollValue(dice)
    return 0 if( dice == 0 )

    value = rand(dice) + 1
    return value
  end

  def getResultText(value1, value2, dice1, dice2, difficulty, total)
    if( isFamble(value1, value2) )
      return "１ゾロ【１ゾロポイント＋１】"
    end

    if( isCritical(value1, value2, dice1, dice2) )
      return "クリティカル成功"
    end

    if( difficulty.nil? )
      return ''
    end

    if( total >= difficulty )
      return "成功"
    end

    return "失敗"
  end

  def isFamble(value1, value2)
    return ((value1 == 1) and (value2 == 1 ))
  end

  def isCritical(value1, value2, dice1, dice2)
    return false if( value2 == 0 )

    if( ( value1 == 6 ) and (value2 == 6 ) )
      return true
    end

    if( (value1 == dice1) and (value2 == dice2) )
      return true
    end

    return false
  end

  def getBaseText(dice1, dice2, modify, difficulty)
    baseText = "R#{dice1}"

    if( dice2 != 0 )
      baseText += ",#{dice2}"
    end

    baseText += getModifyString(modify)

    unless( difficulty.nil? )
      baseText += ">=#{difficulty}"
    end

    return baseText
  end

  def getModifyString(modify)
    if( modify > 0 )
      return "+" + modify.to_s
    elsif( modify < 0 )
      return modify.to_s
    end
    return ''
  end
end
