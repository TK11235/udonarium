# -*- coding: utf-8 -*-
# frozen_string_literal: true

class RecordOfSteam < DiceBot
  # ゲームシステムの識別子
  ID = 'RecordOfSteam'

  # ゲームシステム名
  NAME = 'Record of Steam'

  # ゲームシステム名の読みがな
  SORT_KEY = 'れこおとおふすちいむ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
2S2@1
RecordOfSteam : (2S2@1) ＞ 1,2,3,4 ＞ 1回転 ＞ 成功数2

4S3@2
RecordOfSteam : (4S3@2) ＞ 2,1,2,4,4,4,2,3,4,5,6,6 ＞ 4回転 ＞ 成功数5
MESSAGETEXT

  setPrefixes(['\d+S\d+.*'])

  # サンプルのダイスコマンドは「nSt@c」で n=ダイス個数, t=目標値, c=クリティカル値。@cのみ省略可

  def rollDiceCommand(command)
    unless /(\d+)[sS](\d+)(@(\d+))?/i =~ command
      return "1"
    end

    # $x の結果は正規表現マッチングすると新しい値に書き換わってしまうので、
    # マッチングした直後に変数に格納してしまうのが大事なポイント！
    diceCount = Regexp.last_match(1).to_i
    targetNumber = Regexp.last_match(2).to_i
    criticalValue = Regexp.last_match(4)
    criticalValue ||= 1
    criticalValue = criticalValue.to_i

    if diceCount >= 150
      return "(多分)無限個なので振れません！ ヤメテクダサイ、(プロセスが)死んでしまいますっ"
    end

    if criticalValue >= 3
      return "(多分)無限個なので振れません！ ヤメテクダサイ、(プロセスが)死んでしまいますっ"
    end

    specialValue = criticalValue

    rollResult, successCount, roundCount, specialCount, fumbleCount = getDiceRollResult(diceCount, targetNumber, criticalValue, specialValue)

    output = "(#{command}) ＞ #{rollResult}"

    roundCountText = getRoundCountText(roundCount)
    successText = getSuccessText(successCount)
    specialText = getSpecialText(specialCount)
    fumbleText = getFumbleText(fumbleCount)

    result = "#{output}#{roundCountText}#{specialText}#{successText}#{fumbleText}"

    return result
  end

  def getDiceRollResult(diceCount, targetNumber, criticalValue, specialValue)
    successCount = 0
    roundCount = 0
    rollResult = ""
    specialCount = 0
    specialFlag = false
    fumbleCount = 0
    fumbleFlag = false

    while diceCount > 0
      _, diceListText, = roll(diceCount, 6)
      debug("diceListText", diceListText)

      rollResult += "," if rollResult != ""
      rollResult += diceListText

      diceList = diceListText.split(/,/).collect { |i| i.to_i }
      if diceList.uniq.length == 1 && roundCount == 0
        if diceList.uniq.first <= specialValue
          specialFlag = true
        elsif diceList.uniq.first == 6
          fumbleFlag = true
        end
      end
      debug("diceList", diceList)

      if specialFlag
        specialCount = 1
        successCount = diceCount * 3

        return rollResult, successCount, roundCount, specialCount, fumbleCount
      elsif fumbleFlag
        fumbleCount = 1

        return rollResult, successCount, roundCount, specialCount, fumbleCount
      end

      diceCount = 0

      diceList.map do |diceValue|
        debug("diceValue", diceValue)
        debug("criticalValue", criticalValue)
        debug("specialValue", specialValue)

        if diceValue <= criticalValue
          diceCount += 2
          roundCount += 1
        end

        successCount += 1 if diceValue <= targetNumber
      end
    end

    return rollResult, successCount, roundCount, specialCount, fumbleCount
  end

  def getRoundCountText(roundCount)
    if  roundCount <= 0
      return ""
    end

    return " ＞ #{roundCount}回転"
  end

  def getSuccessText(successCount)
    if successCount > 0
      return " ＞ 成功数#{successCount}"
    end

    return " ＞ 失敗"
  end

  def getSpecialText(specialCount)
    if specialCount == 1
      return " ＞ スペシャル"
    end
  end

  def getFumbleText(fumbleCount)
    if fumbleCount == 1
      return " ＞ ファンブル"
    end
  end
end
