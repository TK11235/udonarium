# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Paranoia < DiceBot
  # ゲームシステムの識別子
  ID = 'Paranoia'

  # ゲームシステム名
  NAME = 'パラノイア'

  # ゲームシステム名の読みがな
  SORT_KEY = 'はらのいあ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
※「パラノイア」は完璧なゲームであるため特殊なダイスコマンドを必要としません。
※このダイスボットは部屋のシステム名表示用となります。
MESSAGETEXT

  setPrefixes(['geta'])

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
