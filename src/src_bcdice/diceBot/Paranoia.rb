# -*- coding: utf-8 -*-

class Paranoia < DiceBot
  setPrefixes(['geta'])

  def initialize
    super
  end

  def gameName
    'パラノイア'
  end

  def gameType
    "Paranoia"
  end

  def getHelpMessage
    return <<MESSAGETEXT
※「パラノイア」は完璧なゲームであるため特殊なダイスコマンドを必要としません。
※このダイスボットは部屋のシステム名表示用となります。
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

    _, diceText = roll(1, 2)

    diceList = diceText.split(/,/).collect { |i| i.to_i }

    result += "幸福ですか？ ＞ "

    getaString = ''
    case (diceList[0])
    when 1
      getaString = '幸福です'
    when 2
      getaString = '幸福ではありません'
    end

    result += getaString

    return result
  end
end
