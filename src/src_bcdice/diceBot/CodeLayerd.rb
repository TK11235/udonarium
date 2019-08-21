# -*- coding: utf-8 -*-

class CodeLayerd < DiceBot
  setPrefixes(['\d*CL[@\d]*.*'])

  def gameName
    'コード：レイヤード'
  end

  def gameType
    "CodeLayerd"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・行為判定（nCL@m） クリティカル・ファンブル判定あり
  n個のD10でmを判定値とした行為判定を行う。mは省略可能。（@6扱い）
  例）7CL>=5 ：サイコロ7個で判定値6のロールを行い、目標値5に対して判定
  例）4CL@7  ：サイコロ4個で判定値7のロールを行い達成値を出す
MESSAGETEXT
  end

  def isGetOriginalMessage
    true
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand command', command)

    result = ''

    case command
    when /(\d+)?CL(\@?(\d))?(>=(\d+))?/i
      base = ($1 || 1).to_i
      target = ($3 || 6).to_i
      diff = $5.to_i
      result = checkRoll(base, target, diff)
    end

    return nil if result.empty?

    return "#{command} ＞ #{result}"
  end

  def checkRoll(base, target, diff)
    result = ""

    base = getValue(base)
    target = getValue(target)

    return result if base < 1

    target = 10 if target > 10

    result += "(#{base}d10)"

    _, diceText = roll(base, 10)

    diceList = diceText.split(/,/).collect { |i| i.to_i }.sort

    result += " ＞ [#{diceList.join(',')}] ＞ "
    result += getRollResultString(diceList, target, diff)

    return result
  end

  def getRollResultString(diceList, target, diff)
    successCount, criticalCount = getSuccessInfo(diceList, target)

    successTotal = successCount + criticalCount
    result = ""

    result += "判定値[#{target}] 達成値[#{successCount}]"
    result += "+クリティカル[#{criticalCount}]=[#{successTotal}]" if criticalCount > 0

    successText = getSuccessResultText(successTotal, diff)
    result += " ＞ #{successText}"

    return result
  end

  def getSuccessResultText(successTotal, diff)
    return "ファンブル！" if successTotal == 0
    return successTotal.to_s if diff == 0
    return "成功" if successTotal >= diff

    return "失敗"
  end

  def getSuccessInfo(diceList, target)
    debug("checkSuccess diceList, target", diceList, target)

    successCount  = 0
    criticalCount = 0

    diceList.each do |dice|
      successCount += 1 if dice <= target
      criticalCount += 1 if dice == 1
    end

    return successCount, criticalCount
  end

  def getValue(number)
    return 0 if number > 100

    return number
  end
end
