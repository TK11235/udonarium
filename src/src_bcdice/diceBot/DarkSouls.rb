# -*- coding: utf-8 -*-

class DarkSouls < DiceBot
  setPrefixes(['(\d+)?(A)?DS([\+\-\d+]*)(\@\d+)?'])

  def initialize
    super
  end

  def gameName
    'ダークソウルTRPG'
  end

  def gameType
    "DarkSouls"
  end

  def getHelpMessage
    return <<MESSAGETEXT
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
  end

  def rollDiceCommand(command)

    output =
      case command.upcase

      when /(\d+)?(A)?DS([\+\-\d+]*)(\@(\d+))?$/i
        #TKfix メソッドをまたぐと$xの中身がnilになっている
        reg1 = $1
        reg2 = $2
        reg3 = $3
        reg5 = $5

        diceCount = (reg1 || 2).to_i#($1 || 2).to_i
        isActive = !reg2.nil?#!$2.nil?
        modify = getValue(reg3)#getValue($3)
        target = (reg5 || 0).to_i#($5 || 0).to_i

        checkRoll(diceCount, isActive, modify, target)

      else
        nil
      end

    return output
  end

  def checkRoll(diceCount, isActive, modify, target)
    dice, diceText = roll(diceCount, 6)
    successValue = dice + modify
    modifyText = getValueText(modify)
    targetText = (target == 0 ? '' : ">=#{target}")

    if( isActive )
      diceArray = diceText.split(/,/).collect{|i|i.to_i}
      focusDamage = diceArray.count{|i| i == 1 }

      if( focusDamage > 0 )
        focusText = "■" * focusDamage
        focusText = "（FP#{focusText}消費）"
      end
    end

    result = "(#{diceCount}D6#{modifyText}#{targetText})"
    result += " ＞ #{dice}(#{diceText})#{modifyText}"
    result += " ＞ #{successValue}#{targetText}"

    if( target > 0 )
      if( successValue >= target )
        result += " ＞ 【成功】"
      else
        result += " ＞ 【失敗】"
      end
    end

    result += "#{focusText}"
    return result
  end

  def getValue(text)
    text ||= ""
    return parren_killer("(0#{ text })").to_i
  end

  def getValueText(value)
    return "" if( value == 0 )
    return "#{value}" if( value < 0 )
    return "\+#{value}"
  end
end
