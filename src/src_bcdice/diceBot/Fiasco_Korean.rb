# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Fiasco_Korean < DiceBot
  # ゲームシステムの識別子
  ID = 'Fiasco:Korean'

  # ゲームシステム名
  NAME = '피아스코'

  # ゲームシステム名の読みがな
  SORT_KEY = '国際化:Korean:피아스코'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
  ・판정 커맨드(FSx, WxBx)
    관계, 비틀기 요소용(FSx)：관계나 비틀기 요소를 위해 x개의 다이스를 굴려 나온 값별로 분류한다.
    흑백차이판정용(WxBx)    ：비틀기, 후기를 위해 흰 다이스(W지정)과 검은 다이스(B지정)으로 차이를 구한다.
      ※ W와B는 한 쪽만 지정(Bx, Wx), 앞뒤 바꿔 지정(WxBx,BxWx)도 가능
INFO_MESSAGE_TEXT

  COMMAND_TYPE_INDEX = 1

  START_DICE_INDEX = 2

  BW_FIRST_DICE_INDEX = 2
  BW_SECOND_DICE_INDEX = 5
  BW_SECOND_DICE_TAG_INDEX = 4

  START_COMMAND_TAG = "FS"
  W_DICEROLL_COMMAND_TAG = "W"
  B_DICEROLL_COMMAND_TAG = "B"

  setPrefixes(['(FS|[WB])(\d+).*'])

  def rollDiceCommand(command)
    m = /\A(FS|[WB])(\d+)(([WB])(\d+))?/.match(command)
    unless m
      return ''
    end

    type = m[COMMAND_TYPE_INDEX]
    if type == START_COMMAND_TAG
      return makeStartDiceRoll(m)
    else
      return makeWhiteBlackDiceRoll(type, m)
    end
  end

  def makeStartDiceRoll(m)
    dice = m[START_DICE_INDEX]
    _, diceText, = roll(dice, 6)

    diceList = [0, 0, 0, 0, 0, 0]

    diceText.split(',').each do |takeDice|
      diceList[takeDice.to_i - 1] += 1
    end

    return "１ => #{diceList[0]}개 ２ => #{diceList[1]}개 ３ => #{diceList[2]}개 ４ => #{diceList[3]}개 ５ => #{diceList[4]}개 ６ => #{diceList[5]}개"
  end

  def makeWhiteBlackDiceRoll(type, m)
    if type == W_DICEROLL_COMMAND_TAG
      whiteTotal, whiteDiceText, blackTotal, blackDiceText = makeArgsDiceRoll(m[BW_FIRST_DICE_INDEX], m[BW_SECOND_DICE_INDEX])
      result = "흰색#{whiteTotal}[#{whiteDiceText}]"
      if blackDiceText
        if m[BW_SECOND_DICE_TAG_INDEX] == W_DICEROLL_COMMAND_TAG
          return "#{m}：흰색 지정(#{W_DICEROLL_COMMAND_TAG})은 중복될 수 없습니다."
        end

        result += " 검은색#{blackTotal}[#{blackDiceText}]"
      end
    elsif type == B_DICEROLL_COMMAND_TAG
      blackTotal, blackDiceText, whiteTotal, whiteDiceText = makeArgsDiceRoll(m[BW_FIRST_DICE_INDEX], m[BW_SECOND_DICE_INDEX])
      result = "검은색#{blackTotal}[#{blackDiceText}]"
      if whiteDiceText
        if m[BW_SECOND_DICE_TAG_INDEX] == B_DICEROLL_COMMAND_TAG
          return "#{m}：검은색 지정(#{B_DICEROLL_COMMAND_TAG})은 중복될 수 없습니다."
        end

        result += " 흰색#{whiteTotal}[#{whiteDiceText}]"
      end
    else
      return ''
    end

    if blackTotal > whiteTotal
      return "#{result} ＞ 검은색#{blackTotal - whiteTotal}"
    elsif blackTotal < whiteTotal
      return "#{result} ＞ 흰색#{whiteTotal - blackTotal}"
    end

    return "#{result} ＞ 0"
  end

  def makeArgsDiceRoll(firstDice, secondDice)
    secondTotal = 0

    firstTotal, firstDiceText, = roll(firstDice, 6)

    if secondDice
      if secondDice.to_i > 0
        secondTotal, secondDiceText, = roll(secondDice, 6)
      else
        secondDiceText = "0"
      end
    end

    return firstTotal, firstDiceText, secondTotal, secondDiceText
  end
end
