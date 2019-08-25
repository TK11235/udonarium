# -*- coding: utf-8 -*-

class Airgetlamh < DiceBot
  def initialize
    super
    @sortType = 1 # ダイスのソート有
  end

  setPrefixes([
    ['(\d+)?A(A|L)(\d+)?((x|\*)(\d+)(\+(\d+))?)?(C(\d+))?']
  ])

  def gameName
    '朱の孤塔のエアゲトラム'
  end

  def gameType
    "Airgetlamh"
  end

  def getHelpMessage
    return <<MESSAGETEXT
【Reg2.0『THE ANSWERER』～】
・調査判定（成功数を表示）：[n]AA[m]
・命中判定（ダメージ表示）：[n]AA[m]*p[+t][Cx]
【～Reg1.1『昇華』】
・調査判定（成功数を表示）：[n]AL[m]
・命中判定（ダメージ表示）：[n]AL[m]*p
----------------------------------------
[]内のコマンドは省略可能。

「n」でダイス数（攻撃回数）を指定。省略時は「2」。
「m」で目標値を指定。省略時は「6」。
「p」で威力を指定。「*」は「x」で代用可。
「+t」でクリティカルトリガーを指定。省略可。
「Cx」でクリティカル値を指定。省略時は「1」、最大値は「3」、「0」でクリティカル無し。

攻撃力指定で命中判定となり、成功数ではなく、ダメージを結果表示します。
クリティカルヒットの分だけ、自動で振り足し処理を行います。
（ALコマンドではクリティカル処理を行いません）

【書式例】
・AL → 2d10で目標値6の調査判定。
・5AA7*12 → 5d10で目標値7、威力12の命中判定。
・AA7x28+5 → 2d10で目標値7、威力28、クリティカルトリガー5の命中判定。
・9aa5*10C2 → 9d10で目標値5、威力10、クリティカル値2の命中判定。
・15AAx4c0 → 15d10で目標値6、威力4、クリティカル無しの命中判定。
MESSAGETEXT
  end

  def rollDiceCommand(command)
    # AA/ALコマンド：調査判定, 成功判定
    if /(\d+)?A(A|L)(\d+)?((x|\*)(\d+)(\+(\d+))?)?(C(\d+))?$/i === command
      diceCount = (Regexp.last_match(1) || 2).to_i
      target = (Regexp.last_match(3) || 6).to_i
      damage = (Regexp.last_match(6) || 0).to_i

      if Regexp.last_match(2) == 'L' # 旧Ver対応
        criticalTrigger = 0
        criticalNumber = 0
      else
        criticalTrigger = (Regexp.last_match(8) || 0).to_i
        criticalNumber = (Regexp.last_match(10) || 1).to_i
      end
      criticalNumber = 3 if criticalNumber > 4

      return checkRoll(diceCount, target, damage, criticalTrigger, criticalNumber)
    end

    return nil
  end

  def checkRoll(diceCount, target, damage, criticalTrigger, criticalNumber)
    totalSuccessCount = 0
    totalCriticalCount = 0
    text = ""

    rollCount = diceCount

    while rollCount > 0
      dice, diceText = roll(rollCount, 10, @sortType)
      diceArray = diceText.split(/,/).collect { |i| i.to_i }

      successCount = diceArray.count { |i| i <= target }
      criticalCount = diceArray.count { |i| i <= criticalNumber }

      totalSuccessCount += successCount
      totalCriticalCount += criticalCount

      text += "+" unless text.empty?
      text += "#{successCount}[#{diceText}]"

      rollCount = criticalCount
    end

    result = ""
    isDamage = (damage != 0)

    if isDamage
      totalDamage = totalSuccessCount * damage + totalCriticalCount * criticalTrigger

      result += "(#{diceCount}D10\<\=#{target}) ＞ #{text} ＞ Hits：#{totalSuccessCount}*#{damage}"
      result += " + Trigger：#{totalCriticalCount}*#{criticalTrigger}" if  criticalTrigger > 0
      result += " ＞ #{totalDamage}ダメージ"
    else
      result += "(#{diceCount}D10\<\=#{target}) ＞ #{text} ＞ 成功数：#{totalSuccessCount}"
    end

    result += " / #{totalCriticalCount}クリティカル" if totalCriticalCount > 0

    return result
  end
end
