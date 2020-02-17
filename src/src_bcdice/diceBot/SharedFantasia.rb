# -*- coding: utf-8 -*-

class SharedFantasia < DiceBot
  setPrefixes(['SF.*', 'ST.*'])

  def initialize
    # $isDebug = true
    super()
  end

  def gameName
    'Shared†Fantasia'
  end

  def gameType
    "SharedFantasia"
  end

  def getHelpMessage
    return <<MESSAGETEXT
2D6の成功判定に 自動成功、自動失敗、致命的失敗、劇的成功 の判定があります。

SF/ST = 2D6のショートカット

例) SF+4>=9 : 2D6して4を足した値が9以上なら成功
MESSAGETEXT
  end

  def isGetOriginalMessage
    false
  end

  def changeText(string)
    @throwString = ''
    if string =~ /SF/i
      string = string.gsub(/SF/i) { "2D6" }
    end
    if string =~ /ST/i
      string = string.gsub(/ST/i) { "2D6" }
    end
    return string
  end

  def check_2D6(totalValue, dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(2D6)
    resultString = ''
    critical = false
    fumble   = false

    if dice_n == 12
      critical = true
    elsif dice_n == 2
      fumble   = true
    end

    totalValueBonus = 0
    if signOfInequality == '>='
      totalValueBonus = 1
    end

    if signOfInequality =~ />/
      if (totalValue + totalValueBonus) > diff
        if critical
          resultString += " ＞ 自動成功(劇的成功)"
        elsif fumble
          resultString += " ＞ 自動失敗"
        else
          resultString += " ＞ 成功"
        end
      else
        if critical
          resultString += " ＞ 自動成功"
        elsif fumble
          resultString += " ＞ 自動失敗(致命的失敗)"
        else
          resultString += " ＞ 失敗"
        end
      end
    end

    return resultString
  end
end
