# -*- coding: utf-8 -*-
# frozen_string_literal: true

class OrgaRain < DiceBot
  # ゲームシステムの識別子
  ID = 'OrgaRain'

  # ゲームシステム名
  NAME = '在りて遍くオルガレイン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'おるかれいん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
判定：[n]OR(count)

[]内のコマンドは省略可能。
「n」で骰子数を指定。省略時は「1」。
(count)で命数を指定。「3111」のように記述。最大6つ。順不同可。

【書式例】
・5OR6042 → 5dで命数「0,2,4,6」の判定
・6OR33333 → 6dで命数「3,3,3,3,3」の判定。
MESSAGETEXT

  def initialize
    super
    @sortType = 1 # ダイスのソート有
  end

  setPrefixes([
    '(\d+)?OR([0-9])?([0-9])?([0-9])?([0-9])?([0-9])?([0-9])?'
  ])

  def rollDiceCommand(command)
    if /(\d+)?OR([0-9])?([0-9])?([0-9])?([0-9])?([0-9])?([0-9])?$/i === command
      diceCount = (Regexp.last_match(1) || 1).to_i
      countNo = [(Regexp.last_match(2) || -1).to_i, (Regexp.last_match(3) || -1).to_i, (Regexp.last_match(4) || -1).to_i, (Regexp.last_match(5) || -1).to_i, (Regexp.last_match(6) || -1).to_i, (Regexp.last_match(7) || -1).to_i]
      countNo.delete(-1)
      countNo = countNo.sort

      return checkRoll(diceCount, countNo)
    end

    return nil
  end

  def checkRoll(diceCount, countNo)
    _dice, diceText = roll(diceCount, 10, @sortType)
    diceText2 = diceText.gsub('10', '0')
    diceArray = diceText2.split(/,/).collect { |i| i.to_i }

    resultArray = []
    success = 0
    diceArray.each do |i|
      multiple = countNo.count(i)
      if multiple > 0
        resultArray.push("#{i}(x#{multiple})")
        success += multiple
      else
        resultArray.push("×")
      end
    end

    countText = countNo.join(',')
    resultText = resultArray.join(',')

    result = "#{diceCount}D10(命数：#{countText}) ＞ #{diceText} ＞ #{resultText} ＞ 成功数：#{success}"

    return result
  end
end
