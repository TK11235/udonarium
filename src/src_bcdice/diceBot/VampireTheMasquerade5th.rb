# -*- coding: utf-8 -*-
# frozen_string_literal: true

class VampireTheMasquerade5th < DiceBot
  # ゲームシステムの識別子
  ID = 'VampireTheMasquerade5th'

  # ゲームシステム名
  NAME = 'ヴァンパイア：ザ マスカレード 第５版'

  # ゲームシステム名の読みがな
  SORT_KEY = 'うあんはいあさますかれえと5'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・判定コマンド(nVTFx+x)
  注意：難易度は必要成功数を表す

  難易度指定：判定成功と失敗、Critical判定、
             （Hungerダイスがある場合）Messy CriticalとBestial Failureチェックを行う
  例) (難易度)VMF(ダイスプール)+(Hungerダイス)
      (難易度)VMF(ダイスプール)

  難易度省略：判定失敗、Critical、（Hungerダイスがある場合）Bestial Failureチェックを行う
              判定成功、Messy Criticalのチェックを行わない
  例) VMF(ダイスプール)+(Hungerダイス)
      VMF(ダイスプール)

  難易度0指定：全てのチェックを行わない
  例) 0VMF(ダイスプール)+(Hungerダイス)
      0VMF(ダイスプール)

MESSAGETEXT

  DIFFICULTY_INDEX   = 1
  DICE_POOL_INDEX    = 3
  HUNGER_DICE_INDEX  = 5

  # 難易度に指定可能な特殊値
  NOT_CHECK_SUCCESS = -1 # 判定成功にかかわるチェックを行わない(判定失敗に関わるチェックは行う)

  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes(['\d*VMF.*'])

  def rollDiceCommand(command)
    m = /\A(\d+)?(VMF)(\d+)(\+(\d+))?/.match(command)
    unless m
      return ''
    end

    dicePool = m[DICE_POOL_INDEX]
    diceText, successDice, tenDice, = makeDiceRoll(dicePool)
    resultText = "(#{dicePool}D10"

    hungerDicePool = m[HUNGER_DICE_INDEX]
    if hungerDicePool
      hungerDiceText, hungerSuccessDice, hungerTenDice, hungerBotchDice = makeDiceRoll(hungerDicePool)

      tenDice += hungerTenDice
      successDice += hungerSuccessDice

      resultText = "#{resultText}+#{hungerDicePool}D10) ＞ [#{diceText}]+[#{hungerDiceText}] "
    else
      hungerTenDice = 0
      hungerBotchDice = 0
      resultText = "#{resultText}) ＞ [#{diceText}] "
    end

    successDice += getCriticalSuccess(tenDice)

    difficulty = m[DIFFICULTY_INDEX] ? m[DIFFICULTY_INDEX].to_i : NOT_CHECK_SUCCESS

    resultText = "#{resultText} 成功数=#{successDice}"

    if difficulty > 0
      if successDice >= difficulty
        judgmentResult = getSuccessResult(tenDice >= 2, hungerTenDice)
      else
        judgmentResult = getFailResult(hungerBotchDice)
      end
      resultText = "#{resultText} 難易度=#{difficulty}#{judgmentResult}"
    elsif difficulty < 0
      if successDice == 0
        judgmentResult = getFailResult(hungerBotchDice)
      else
        judgmentResult = ""
      end
      resultText = "#{resultText}#{judgmentResult}"
    end

    return resultText
  end

  def getCriticalSuccess(tenDice)
    # 10の目が2個毎に追加2成功
    return ((tenDice / 2).floor * 2) # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
  end

  def makeDiceRoll(dicePool)
    _, diceText, = roll(dicePool, 10)
    successDice = 0
    tenDice = 0
    botchDice = 0

    diceText.split(',').each do |takeDice|
      if takeDice.to_i >= 6
        successDice += 1
        if takeDice == "10"
          tenDice += 1
        end
      elsif takeDice == "1"
        botchDice += 1
      end
    end

    return diceText, successDice, tenDice, botchDice
  end

  def getSuccessResult(isCritical, hungerTenDice)
    judgmentResult = "：判定成功!"
    if hungerTenDice > 0 && isCritical
      return "#{judgmentResult} [Messy Critical]"
    elsif isCritical
      return "#{judgmentResult} [Critical Win]"
    end

    return judgmentResult
  end

  def getFailResult(hungerBotchDice)
    judgmentResult = "：判定失敗!"
    if hungerBotchDice > 0
      return "#{judgmentResult} [Bestial Failure]"
    end

    return judgmentResult
  end
end
