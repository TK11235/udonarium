# -*- coding: utf-8 -*-

class GoldenSkyStories < DiceBot
  setPrefixes(['geta'])

  def initialize
    super
  end

  def gameName
    'ゆうやけこやけ'
  end

  def gameType
    "GoldenSkyStories"
  end

  def getHelpMessage
    return <<MESSAGETEXT
※「ゆうやけこやけ」はダイスロールを使用しないシステムです。
※このダイスボットは部屋のシステム名表示用となります。

・下駄占い (GETA)
  あーしたてんきになーれ
MESSAGETEXT
  end

  def isGetOriginalMessage
    true
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand command', command)

    result = ''

    case command
    when /geta/i
      result = getaRoll()
    end

    return nil if result.empty?

    return "#{command} ＞ #{result}"
  end

  def getaRoll()
    result = ""

    _, diceText = roll(1, 7)

    diceList = diceText.split(/,/).collect { |i| i.to_i }

    # result << " あーしたてんきになーれっ ＞ [#{diceList.join(',')}] ＞ "
    result += "下駄占い ＞ "

    getaString = ''
    case (diceList[0])
    when 1
      getaString = '裏：あめ'
    when 2
      getaString = '表：はれ'
    when 3
      getaString = '裏：あめ'
    when 4
      getaString = '表：はれ'
    when 5
      getaString = '裏：あめ'
    when 6
      getaString = '表：はれ'
    when 7
      getaString = '横：くもり'
    end

    result += getaString

    return result
  end
end
