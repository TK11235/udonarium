# -*- coding: utf-8 -*-

class NightWizard < DiceBot
  setPrefixes(['\d+NW'])

  def initialize
    super
    @sendMode = 2
  end

  def gameName
    'ナイトウィザード2版'
  end

  def gameType
    "NightWizard"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定用コマンド　(nNW+m@x#y)
　"(基本値)NW(常時および常時に準じる特技等及び状態異常（省略可）)@(クリティカル値)#(ファンブル値)（常時以外の特技等及び味方の支援効果等の影響（省略可））"でロールします。
　Rコマンド(2R6m[n,m]c[x]f[y]>=t tは目標値)に読替されます。
　クリティカル値、ファンブル値が無い場合は1や13などのあり得ない数値を入れてください。
　例）12NW-5@7#2　　1NW　　50nw+5@7,10#2,5　50nw-5+10@7,10#2,5+15+25
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    return string unless(string =~ /NW/i)

    string = string.gsub(/([\-\d]+)NW([\+\-\d]*)@([,\d]+)#([,\d]+)([\+\-\d]*)/i) do
      modify = $5.empty? ? "" : ",#{$5}"
      "2R6m[#{$1}#{$2}#{modify}]c[#{$3}]f[#{$4}]"
    end

    string = string.gsub(/([\-\d]+)NW([\+\-\d]*)/i) {"2R6m[#{$1}#{$2}]"}
    string = string.gsub(/NW([\+\-\d]*)/i) {"2R6m[0#{$1}]"}
  end

  def dice_command_xRn(string, nick_e)
    return checkRoll(string, nick_e)
  end

  # ゲーム別成功度判定(2D6)
  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return '' unless(signOfInequality == ">=")

    if(total_n >= diff)
      return " ＞ 成功"
    end

    return " ＞ 失敗"
  end

  def checkRoll(string, nick_e)
    debug('checkRoll string', string)

    output = "1"

    num = "[,\\d\\+\\-]+"
    #Tkfix 正規表現オプション
    #return output unless(/(^|\s)S?(2R6m\[(#{num})\](c\[(#{num})\])?(f\[(#{num})\])?(([>=]+)(\d+))?)(\s|$)/i =~ string)
    pattern = "(^|\\s)S?(2R6m\\[(#{num})\\](c\\[(#{num})\\])?(f\\[(#{num})\\])?(([>=]+)(\d+))?)(\s|$)"
    return output unless(Regexp.new(pattern, Regexp::IGNORECASE) =~ string)

    debug('is valid string')

    string = $2
    base_and_modify = $3
    criticalText = $4
    criticalValue = $5
    fumbleText = $6
    fumbleValue = $7
    judgeText = $8
    judgeOperator = $9
    judgeValue = $10.to_i

    crit = "0"
    fumble = "0"
    signOfInequality = ""
    diff = 0

    if(criticalText)
      crit = criticalValue
    end

    if(fumbleText)
      fumble = fumbleValue
    end
    if(judgeText)
      diff = judgeValue
      debug('judgeOperator', judgeOperator)
      signOfInequality = marshalSignOfInequality(judgeOperator)
    end

    base, modify = base_and_modify.split(/,/)
    base = parren_killer("(0#{base})").to_i
    modify = parren_killer("(0#{modify})").to_i
    debug("base_and_modify, base, modify", base_and_modify, base, modify)

    total, out_str = nw_dice(base, modify, crit, fumble)

    output = "#{nick_e}: (#{string}) ＞ #{out_str}"
    if(signOfInequality != "")  # 成功度判定処理
      output += check_suc(total, 0, signOfInequality, diff, 3, 6, 0, 0)
    end

    return output
  end

  def getValueText(text)
    value = text.to_i
    return "#{value}" if(value < 0)
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

    if( @fumbleValues.include?(dice_n) )
      fumble_text, total = getFumbleTextAndTotal(base, modify, dice_str)
      output = "#{fumble_text} ＞ ファンブル ＞ #{total}"
    else
      total = base + modify
      total, output = checkCritical(total, dice_str, dice_n)
    end

    return total, output
  end

  def getFumbleTextAndTotal(base, modify, dice_str)
    total = base
    total += -10
    text = "#{base}-10[#{dice_str}]"
    return text, total
  end

  def setCriticalValues(text)
    @criticalValues = getValuesFromText(text, [10])
  end

  def getValuesFromText(text, default)
    if( text == "0" )
      return default
    end

    return text.split(/,/).collect{|i|i.to_i}
  end

  def checkCritical(total, dice_str, dice_n)
    debug("addRollWhenCritical begin total, dice_str", total, dice_str)
    output = "#{total}"

    criticalText = ""
    criticalValue = getCriticalValue(dice_n)

    while(criticalValue)
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
