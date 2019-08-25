# -*- coding: utf-8 -*-

class UpperDice
  def initialize(bcdice, diceBot)
    @bcdice = bcdice
    @diceBot = diceBot
    @nick_e = @bcdice.nick_e
  end

  # 上方無限型ダイスロール
  def rollDice(string)
    debug('udice begin string', string)

    output = '1'

    string = string.gsub(/-[sS]?[\d]+[uU][\d]+/, '') # 上方無限の引き算しようとしてる部分をカット

    unless (m = /(^|\s)[sS]?(\d+[uU][\d\+\-uU]+)(\[(\d+)\])?([\+\-\d]*)(([<>=]+)(\d+))?(\@(\d+))?($|\s)/.match(string))
      return output
    end

    command = m[2]
    signOfInequalityText = m[7]
    diff = m[8].to_i
    upperTarget1 = m[4]
    upperTarget2 = m[10]

    modify = m[5]
    debug('modify', modify)
    modify ||= ''

    debug('p $...', [m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10]])

    string = command

    @signOfInequality = @bcdice.getMarshaledSignOfInequality(signOfInequalityText)
    @upper = getAddRollUpperTarget(upperTarget1, upperTarget2)

    if @upper <= 1
      output = "#{@nick_e}: (#{string}\[#{@upper}\]#{modify}) ＞ 無限ロールの条件がまちがっています"
      return output
    end

    dice_a = (string + modify).split("+")
    debug('dice_a', dice_a)

    diceCommands = []
    bonusValues = []

    dice_a.each do |dice_o|
      if /[Uu]/ =~ dice_o
        diceCommands.push(dice_o)
      else
        bonusValues.push(dice_o)
      end
    end

    bonus = getBonusValue(bonusValues)
    debug('bonus', bonus)

    diceDiff = diff - bonus

    totalDiceString, totalSuccessCount, totalDiceCount, maxDiceValue, totalValue = getUpperDiceCommandResult(diceCommands, diceDiff)

    output = totalDiceString

    if bonus > 0
      output += "+#{bonus}"
    elsif bonus < 0
      output += bonus.to_s
    end

    maxValue = maxDiceValue + bonus
    totalValue += bonus

    string += "[#{@upper}]" + modify

    if @diceBot.isPrintMaxDice && (totalDiceCount > 1)
      output = "#{output} ＞ #{totalValue}"
    end

    if @signOfInequality != ""
      output = "#{output} ＞ 成功数#{totalSuccessCount}"
      string += "#{@signOfInequality}#{diff}"
    else
      output += getMaxAndTotalValueResultStirng(maxValue, totalValue, totalDiceCount)
    end

    output = "#{@nick_e}: (#{string}) ＞ #{output}"

    if output.length > $SEND_STR_MAX
      output = "#{@nick_e}: (#{string}) ＞ ... ＞ #{totalValue}"
      if @signOfInequality == ""
        output += getMaxAndTotalValueResultStirng(maxValue, totalValue, totalDiceCount)
      end
    end

    return output
  end

  def getMaxAndTotalValueResultStirng(maxValue, totalValue, _totalDiceCount)
    return " ＞ #{maxValue}/#{totalValue}(最大/合計)"
  end

  def getAddRollUpperTarget(target1, target2)
    if  target1
      return target1.to_i
    end

    if  target2
      return target2.to_i
    end

    if @diceBot.upplerRollThreshold == "Max"
      return 2
    else
      return @diceBot.upplerRollThreshold
    end
  end

  def getBonusValue(bonusValues)
    return 0 if bonusValues.empty?

    diceBonusText = bonusValues.join("+")
    bonus = @bcdice.parren_killer("(" + diceBonusText + ")").to_i

    return bonus
  end

  def getUpperDiceCommandResult(diceCommands, diceDiff)
    diceStringList = []
    totalSuccessCount = 0
    totalDiceCount = 0
    maxDiceValue = 0
    totalValue = 0

    diceCommands.each do |diceCommand|
      diceCount, diceMax = diceCommand.split(/[uU]/).collect { |s| s.to_i }

      if @diceBot.upplerRollThreshold == "Max"
        @upper = diceMax
      end

      total, diceString, cnt1, cnt_max, maxDiceResult, successCount, cnt_re =
        @bcdice.roll(diceCount, diceMax, (@diceBot.sortType & 2), @upper, @signOfInequality, diceDiff)

      diceStringList << diceString

      totalSuccessCount += successCount
      maxDiceValue = maxDiceResult if maxDiceResult > maxDiceValue
      totalDiceCount += diceCount
      totalValue += total
    end

    totalDiceString = diceStringList.join(",")

    return totalDiceString, totalSuccessCount, totalDiceCount, maxDiceValue, totalValue
  end
end
