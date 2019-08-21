# -*- coding: utf-8 -*-

class StrangerOfSwordCity < DiceBot
  setPrefixes(['\d+SR.*'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @d66Type = 1
    @fractionType = "omit"
  end

  def gameName
    '剣の街の異邦人TRPG'
  end

  def gameType
    "StrangerOfSwordCity"
  end

  def getHelpMessage
    info = <<INFO_MESSAGE_TEXT
・判定　xSR or xSRy or xSR+y or xSR-y or xSR+y>=z
　x=ダイス数、y=修正値(省略可、±省略時は＋として扱う)、z=難易度(省略可)
　判定時はクリティカル、ファンブルの自動判定を行います。
・通常のnD6ではクリティカル、ファンブルの自動判定は行いません。
・D66ダイスあり
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand command', command)

    command = command.upcase

    result = ''

    result = checkRoll(command)
    return result unless result.empty?

    return result
  end

  def checkRoll(command)
    debug("checkRoll begin command", command)

    result = ''
    return result unless /^(\d+)SR([\+\-]?\d+)?(>=(\d+))?$/i === command

    diceCount = $1.to_i
    modify = $2.to_i
    difficulty = $4.to_i if $4

    dice, diceText = roll(diceCount, 6)
    diceList = diceText.split(/,/).collect { |i| i.to_i }.sort

    totalValue = (dice + modify)
    modifyText = getModifyText(modify)
    result += "(#{command}) ＞ #{dice}[#{diceList.join(',')}]#{modifyText} ＞ #{totalValue}"

    criticalResult = getCriticalResult(diceList)
    unless criticalResult.nil?
      result += " ＞ クリティカル(+#{criticalResult}D6)"
      return result
    end

    if isFumble(diceList, diceCount)
      result += ' ＞ ファンブル'
      return result
    end

    unless difficulty.nil?
      result += (totalValue >= difficulty) ? ' ＞ 成功' : ' ＞ 失敗'
    end

    return result
  end

  def getModifyText(modify)
    return "" if modify == 0
    return modify.to_s if modify < 0

    return "+#{modify}"
  end

  def getCriticalResult(diceList)
    dice6Count = diceList.select { |i| i == 6 }.size

    if dice6Count >= 2
      return dice6Count.to_s
    end

    return nil
  end

  def isFumble(diceList, diceCount)
    (diceList.select { |i| i == 1 }.size >= diceCount)
  end
end
