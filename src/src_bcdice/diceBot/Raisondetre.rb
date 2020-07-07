# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Raisondetre < DiceBot
  # ゲームシステムの識別子
  ID = 'Raisondetre'

  # ゲームシステム名
  NAME = '叛逆レゾンデートル'

  # ゲームシステム名の読みがな
  SORT_KEY = 'はんきやくれそんてとおる'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
判定：[判定値]RD[技能][@目標値]
ダメージロール：[骰子数]DD[装甲]

[]内のコマンドは省略可能。
「判定値」で判定に使用する骰子数を指定。省略時は「1」。0以下も指定可。
「技能」で有効な骰子数を指定。省略時は「1」。
達成値はクリティカルを含めて、「最も高くなる」ように計算します。
「@目標値」指定で、判定の成否を追加表示します。

ダメージロールは[装甲]指定で、有効な骰子数と0の出目の数を表示します。
[装甲]省略時は、骰子結果のみ表示します。（複数の対象への攻撃時用）

【書式例】
・RD → 1Dで達成値を表示。
・2RD1@8 → 2D（1個選択）で目標値8の判定。
・-3RD → 1Dで骰子ペナルティ-4の判定。
・4DD2 → 4Dで装甲2のダメージロール。
MESSAGETEXT

  def initialize
    super
    @sortType = 1 # ダイスのソート有
  end

  setPrefixes([
    '(-)?(\d+)?RD(\d+)?(@(\d+))?',
    '(-)?(\d+)?DD([1-9])?([\+\-]\d+)?'
  ])

  def rollDiceCommand(command)
    if /(-)?(\d+)?RD(\d+)?(@(\d+))?$/i === command
      diceCount = (Regexp.last_match(2) || 1).to_i
      diceCount *= -1 unless Regexp.last_match(1).nil?
      choiceCount = (Regexp.last_match(3) || 1).to_i
      target = (Regexp.last_match(5) || 0).to_i

      return checkRoll(diceCount, choiceCount, target)

    elsif /(-)?(\d+)?DD([1-9])?([\+\-]\d+)?$/i === command
      diceCount = (Regexp.last_match(2) || 1).to_i
      diceCount *= -1 unless Regexp.last_match(1).nil?
      armor = (Regexp.last_match(3) || 0).to_i
      if armor > 0
        armor += (Regexp.last_match(4) || 0).to_i
        armor = 1 if  armor < 1
        armor = 9 if  armor > 9
      end

      return checkDamage(diceCount, armor)

    end

    return nil
  end

  def checkRoll(diceCount, choiceCount, target)
    if diceCount <= 0
      correction = 1 + diceCount * -1
      rollCount = 1
    else
      correction = 0
      rollCount = diceCount
    end

    _dice, diceText = roll(rollCount, 10, @sortType)
    diceText2 = diceText.gsub('10', '0')
    diceArray = diceText2.split(/,/).collect { |i| i.to_i }
    diceArray.map! { |i| i - correction }
    diceText2 = diceArray.sort.join(',')

    funbleArray = diceArray.select { |i| i <= 1 }
    isFunble = (funbleArray.size >= rollCount)

    dice = 0
    success = 0
    unless isFunble
      criticalCount = diceArray.count(0)
      critical = criticalCount * 10

      choiceArray = diceArray.reverse
      choiceArray.delete(0)
      choiceArray = choiceArray.slice(0..(choiceCount - 1))
      choiceText = choiceArray.join(',')
      dice = choiceArray.inject(:+)
      success = dice + critical
    end

    result = "#{rollCount}D10"
    result += "-#{correction}" if correction > 0
    result += " ＞ [#{diceText}] ＞ [#{diceText2}] ＞ "

    if isFunble
      result += "達成値：0 (Funble)"
    else
      result += "#{dice}[#{choiceText}]"
      result += "+#{critical}" if critical > 0
      result += "=達成値：#{success}"
      result += " (#{criticalCount}Critical)" if critical > 0
    end

    if target > 0
      result += ">=#{target} "
      result += "【成功】" if  success >= target
      result += "【失敗】" if  success < target
    end

    return result
  end

  def checkDamage(diceCount, armor)
    if diceCount <= 0
      correction = 1 + diceCount * -1
      rollCount = 1
    else
      correction = 0
      rollCount = diceCount
    end

    _dice, diceText = roll(rollCount, 10, @sortType)
    diceText2 = diceText.gsub('10', '0')
    diceArray = (diceText2.split(/,/).collect { |i| i.to_i }).sort
    criticalCount = diceArray.count(0)
    diceArray.map! { |i| i - correction }
    diceText2 = diceArray.join(',')

    result = "#{rollCount}D10"
    result += "-#{correction}" if correction > 0
    result += " ＞ [#{diceText}] ＞ [#{diceText2}]"

    if armor > 0
      resultArray = []
      success = 0

      diceArray.each do |i|
        if i >= armor
          resultArray.push(i)
          success += 1
        else
          resultArray.push("×")
        end
      end
      resultText = resultArray.join(',')

      result += " ＞ [#{resultText}]>=#{armor} 有効数：#{success}"
    end

    result += "　0=#{criticalCount}個"

    return result
  end
end
