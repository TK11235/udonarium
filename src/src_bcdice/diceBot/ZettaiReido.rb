# -*- coding: utf-8 -*-

class ZettaiReido < DiceBot
  setPrefixes(['\d+\-2DR.*'])

  def initialize
    super
  end

  def gameName
    '絶対隷奴'
  end

  def gameType
    "ZettaiReido"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定
m-2DR+n>=x
m(基本能力),n(修正値),x(目標値)
DPの取得の有無も表示されます。
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string
  end

  def rollDiceCommand(command)
    return nil unless /^(\d+)-2DR([\+\-\d]*)(>=(\d+))?$/i === command

    baseAvility = Regexp.last_match(1).to_i
    modText = Regexp.last_match(2)
    diffValue = Regexp.last_match(4)

    return roll2DR(baseAvility, modText, diffValue)
  end

  def roll2DR(baseAvility, modText, diffValue)
    diceTotal, diceText, darkPoint = roll2DarkDice()

    mod, modText = getModInfo(modText)
    diff, diffText = getDiffInfo(diffValue)

    output = ""
    output += "(#{baseAvility}-2DR#{modText}#{diffText})"
    output += " ＞ #{baseAvility}-#{diceTotal}[#{diceText}]#{modText}"

    total = baseAvility - diceTotal + mod
    output += " ＞ #{total}"

    successText = getSuccessText(diceTotal, total, diff)
    output += successText

    darkPointText = getDarkPointResult(total, diff, darkPoint)
    output += darkPointText

    return output
  end

  def roll2DarkDice()
    _, dice_str = roll(2, 6)
    dice1, dice2 = dice_str.split(',').collect { |i| i.to_i }

    darkDice1, darkPoint1 = changeDiceToDarkDice(dice1)
    darkDice2, darkPoint2 = changeDiceToDarkDice(dice2)

    darkPoint = darkPoint1 + darkPoint2
    if darkPoint == 2
      darkPoint = 4
    end

    darkTotal = darkDice1 + darkDice2
    darkDiceText = "#{darkDice1},#{darkDice2}"

    return darkTotal, darkDiceText, darkPoint
  end

  def changeDiceToDarkDice(dice)
    darkPoint = 0
    darkDice = dice
    if dice == 6
      darkDice = 0
      darkPoint = 1
    end

    return darkDice, darkPoint
  end

  def getModInfo(modText)
    value = parren_killer("(0#{modText})").to_i

    text = ""
    if value < 0
      text = value.to_s
    elsif  value > 0
      text = "+" + value.to_s
    end

    return value, text
  end

  def getDiffInfo(diffValue)
    diffText = ""

    unless diffValue.nil?
      diffValue = diffValue.to_i
      diffText = ">=#{diffValue.to_i}"
    end

    return diffValue, diffText
  end

  def getDarkPointResult(_total, _diff, darkPoint)
    text = ''

    if darkPoint > 0
      text = " ＞ #{darkPoint}DP"
    end

    return text
  end

  def getSuccessText(diceTotal, total, diff)
    if diceTotal == 0
      return " ＞ クリティカル"
    end

    if diceTotal == 10
      return " ＞ ファンブル"
    end

    if diff.nil?
      diff = 0
    end

    successLevel = (total - diff)
    if successLevel >= 0
      return " ＞ #{successLevel} 成功"
    end

    return ' ＞ 失敗'
  end
end
