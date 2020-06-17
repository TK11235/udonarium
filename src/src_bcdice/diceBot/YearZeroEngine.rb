# -*- coding: utf-8 -*-
# frozen_string_literal: true

class YearZeroEngine < DiceBot
  # ゲームシステムの識別子
  ID = 'YearZeroEngine'

  # ゲームシステム名
  NAME = 'イヤーゼロエンジン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'いやあせろえんしん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定コマンド(YZEx+x+x)
  YZE(能力ダイス数)+(技能ダイス数)+(修正ダイス数)  # YearZeroEngine(TALES FROM THE LOOP等)の判定(6を数える)
  ※ 技能と修正ダイス数は省略可能
INFO_MESSAGE_TEXT

  ABILITY_INDEX    = 2 # 能力値ダイスのインデックス
  SKILL_INDEX      = 4 # 技能値ダイスのインデックス
  MODIFIED_INDEX   = 6 # 修正ダイスのインデックス

  setPrefixes(['YZE.*'])

  def rollDiceCommand(command)
    m = /\A(YZE)(\d+)(\+(\d+))?(\+(\d+))?/.match(command)
    unless m
      return ''
    end

    successDice = 0
    matchText = m[ABILITY_INDEX]
    abilityDiceText, successDice = makeDiceRoll(matchText, successDice)

    diceCountText = "(#{matchText}D6)"
    diceText = abilityDiceText

    matchText = m[SKILL_INDEX]
    if matchText
      skillDiceText, successDice = makeDiceRoll(matchText, successDice)

      diceCountText += "+(#{matchText}D6)"
      diceText += "+#{skillDiceText}"
    end

    matchText = m[MODIFIED_INDEX]
    if matchText
      modifiedDiceText, successDice = makeDiceRoll(matchText, successDice)

      diceCountText += "+(#{matchText}D6)"
      diceText += "+#{modifiedDiceText}"
    end

    return "#{diceCountText} ＞ #{diceText} 成功数:#{successDice}"
  end

  def makeDiceRoll(matchText, successDice)
    dice = matchText.to_i
    _, diceText, = roll(dice, 6)

    diceText.split(',').each do |takeDice|
      if takeDice == "6"
        successDice += 1
      end
    end
    return "[#{diceText}]", successDice
  end
end
