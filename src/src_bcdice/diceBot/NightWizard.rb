# -*- coding: utf-8 -*-
# frozen_string_literal: true

require "utils/normalize"

class NightWizard < DiceBot
  # ゲームシステムの識別子
  ID = 'NightWizard'

  # ゲームシステム名
  NAME = 'ナイトウィザード2版'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ないとういさあと2'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定用コマンド　(nNW+m@x#y)
　"(基本値)NW(常時および常時に準じる特技等及び状態異常（省略可）)@(クリティカル値)#(ファンブル値)（常時以外の特技等及び味方の支援効果等の影響（省略可））"でロールします。
　Rコマンド(2R6m[n,m]c[x]f[y]>=t tは目標値)に読替されます。
　クリティカル値、ファンブル値が無い場合は1や13などのあり得ない数値を入れてください。
　例）12NW-5@7#2　　1NW　　50nw+5@7,10#2,5　50nw-5+10@7,10#2,5+15+25
INFO_MESSAGE_TEXT

  setPrefixes(['\d+NW'])

  def initialize
    super
    @sendMode = 2
  end

  def changeText(string)
    return string unless string =~ /NW/i

    string = string.gsub(/([\-\d]+)NW([\+\-\d]*)@([,\d]+)#([,\d]+)([\+\-\d]*)/i) do
      modify = Regexp.last_match(5).empty? ? "" : ",#{Regexp.last_match(5)}"
      "2R6m[#{Regexp.last_match(1)}#{Regexp.last_match(2)}#{modify}]c[#{Regexp.last_match(3)}]f[#{Regexp.last_match(4)}]"
    end

    string = string.gsub(/([\-\d]+)NW([\+\-\d]*)/i) { "2R6m[#{Regexp.last_match(1)}#{Regexp.last_match(2)}]" }
    string = string.gsub(/NW([\+\-\d]*)/i) { "2R6m[0#{Regexp.last_match(1)}]" }
  end

  def dice_command_xRn(string, nick_e)
    return checkRoll(string, nick_e)
  end

  def checkRoll(string, nick_e)
    debug('checkRoll string', string)

    output = '1'

    num = '[,\d\+\-]+'
    return output unless /(^|\s)S?(2R6m\[(#{num})\](c\[(#{num})\])?(f\[(#{num})\])?(([>=]+)(\d+))?)(\s|$)/i =~ string

    debug('is valid string')

    string = Regexp.last_match(2)
    base_and_modify = Regexp.last_match(3)
    criticalText = Regexp.last_match(4)
    criticalValue = Regexp.last_match(5)
    fumbleText = Regexp.last_match(6)
    fumbleValue = Regexp.last_match(7)
    judgeText = Regexp.last_match(8)
    judgeOperator = Regexp.last_match(9)
    judgeValue = Regexp.last_match(10).to_i

    crit = "0"
    fumble = "0"
    cmp_op = nil
    diff = 0

    if criticalText
      crit = criticalValue
    end

    if fumbleText
      fumble = fumbleValue
    end
    if judgeText
      diff = judgeValue
      debug('judgeOperator', judgeOperator)
      cmp_op = Normalize.comparison_operator(judgeOperator)
    end

    base, modify = base_and_modify.split(/,/)
    base = parren_killer("(0#{base})").to_i
    modify = parren_killer("(0#{modify})").to_i
    debug("base_and_modify, base, modify", base_and_modify, base, modify)

    total, out_str = nw_dice(base, modify, crit, fumble)

    output = "#{nick_e}: (#{string}) ＞ #{out_str}"
    if cmp_op
      output += check_nDx(total, cmp_op, diff)
    end

    return output
  end

  def getValueText(text)
    value = text.to_i
    return value.to_s if value < 0

    return "+#{value}"
  end

  def nw_dice(base, modify, criticalText, fumbleText)
    debug("nw_dice : base, modify, criticalText, fumbleText", base, modify, criticalText, fumbleText)

    @criticalValues = getValuesFromText(criticalText, [10])
    @fumbleValues = getValuesFromText(fumbleText, [5])
    total = 0
    output = ""

    debug('@criticalValues', @criticalValues)
    debug('@fumbleValues', @fumbleValues)

    dice_n, dice_str, = roll(2, 6, 0)

    total = 0

    if @fumbleValues.include?(dice_n)
      fumble_text, total = getFumbleTextAndTotal(base, modify, dice_str)
      output = "#{fumble_text} ＞ ファンブル ＞ #{total}"
    else
      total = base + modify
      total, output = checkCritical(total, dice_str, dice_n)
    end

    return total, output
  end

  def getFumbleTextAndTotal(base, _modify, dice_str)
    total = base
    total += -10
    text = "#{base}-10[#{dice_str}]"
    return text, total
  end

  def setCriticalValues(text)
    @criticalValues = getValuesFromText(text, [10])
  end

  def getValuesFromText(text, default)
    if  text == "0"
      return default
    end

    return text.split(/,/).collect { |i| i.to_i }
  end

  def checkCritical(total, dice_str, dice_n)
    debug("addRollWhenCritical begin total, dice_str", total, dice_str)
    output = total.to_s

    criticalText = ""
    criticalValue = getCriticalValue(dice_n)

    while criticalValue
      total += 10
      output += "+10[#{dice_str}]"

      criticalText = "＞ クリティカル "
      dice_n, dice_str, = roll(2, 6, 0)

      criticalValue = getCriticalValue(dice_n)
      debug("criticalValue", criticalValue)
    end

    total += dice_n
    output += "+#{dice_n}[#{dice_str}] #{criticalText}＞ #{total}"

    return total, output
  end

  def getCriticalValue(dice_n)
    return @criticalValues.include?(dice_n)
  end
end
