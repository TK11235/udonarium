# -*- coding: utf-8 -*-
# frozen_string_literal: true

class DarkSouls < DiceBot
  # ゲームシステムの識別子
  ID = 'DarkSouls'

  # ゲームシステム名
  NAME = 'ダークソウルTRPG'

  # ゲームシステム名の読みがな
  SORT_KEY = 'たあくそうるTRPG'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・行為判定：[n]DS[a±b][@t]　　[]内のコマンドは省略可
・能動判定：[n]ADS[a±b][@t]　　FP消費を判定
　n：ダイス数。省略時は「2」
　a±b：修正値。「1+2-1」のように、複数定可
　@t：目標値。省略時は達成値を、指定時は判定の正否を表示
例）DS → 2D6の達成値を表示
　　1DS → 1D6の達成値を表示
　　ADS+2-2 → 2D6+2の達成値を表示（能動判定）
　　DS+2@10 → 2D6+2で目標値10の判定
MESSAGETEXT

  setPrefixes(['(\d+)?(A)?DS([-+\d]*)(@\d+)?'])

  def rollDiceCommand(command)
    return nil unless (m = /(\d+)?(A)?DS([-+\d]*)(@(\d+))?$/i.match(command.upcase))

    diceCount = (m[1] || 2).to_i
    isActive = !m[2].nil?
    modify = getValue(m[3])
    target = (m[5] || 0).to_i

    output = checkRoll(diceCount, isActive, modify, target)

    return output
  end

  def checkRoll(diceCount, isActive, modify, target)
    dice, diceText = roll(diceCount, 6)
    successValue = dice + modify
    modifyText = getValueText(modify)
    targetText = (target == 0 ? '' : ">=#{target}")

    if isActive
      diceArray = diceText.split(/,/).collect { |i| i.to_i }
      focusDamage = diceArray.count { |i| i == 1 }

      if focusDamage > 0
        focusText = "■" * focusDamage
        focusText = "（FP#{focusText}消費）"
      end
    end

    result = "(#{diceCount}D6#{modifyText}#{targetText})"
    result += " ＞ #{dice}(#{diceText})#{modifyText}"
    result += " ＞ #{successValue}#{targetText}"

    if target > 0
      if  successValue >= target
        result += " ＞ 【成功】"
      else
        result += " ＞ 【失敗】"
      end
    end

    result += focusText.to_s
    return result
  end

  def getValue(text)
    text ||= ""
    return parren_killer("(0#{text})").to_i
  end

  def getValueText(value)
    return "" if value == 0
    return value.to_s if value < 0

    return "\+#{value}"
  end
end
