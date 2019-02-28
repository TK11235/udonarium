# -*- coding: utf-8 -*-

class TherapieSein < DiceBot
  setPrefixes(['(TS|OP)(\d+)?([\+\-]\d)*(\@\d+)?'])

  def initialize
    super
  end

  def gameName
    '青春疾患セラフィザイン'
  end

  def gameType
    "TherapieSein"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・一般判定：TS[n][±m][@t]　　[]内のコマンドは省略可能。クリティカル無。
・戦闘判定：OP[n][±m][@t]　　[]内のコマンドは省略可能。クリティカル有。

「n」で能力値修正などを指定。
「±m」で達成値への修正値を追加指定。+5+1-3のように、複数指定も可能です。
「@t」で目標値を指定。省略時は達成値のみ表示、指定時は判定の正否を追加表示。

【書式例】
・TS → ダイスの合計値を達成値として表示。
・TS4 → ダイス合計+4を達成値表示。
・TS4-1 → ダイス合計+4-1（計+3）を達成値表示。
・TS2+1@10 → ダイス合計+2+1（計+3）の達成値と、判定の成否を表示。
・OP4+3+1 → ダイス合計+4+3+1（計+8）を達成値＆クリティカル表示。
・OP3@12 → ダイス合計+3の達成値＆クリティカル、判定の成否を表示。
MESSAGETEXT
  end

  def rollDiceCommand(command)

    output =
      case command.upcase

      when /(TS|OP)(\d+)?(([\+\-]\d+)*)(\@(\d+))?$/i
        hasCritical = ( $1 == "OP" )
        target = ($6 || 0).to_i
        modify = ($2 || 0).to_i
        modifyAddString = $3

        modify_list = modifyAddString.scan(/[\+\-]\d+/)  # 修正値を分割して配列へ
        modify_list.each{|i| modify += i.to_i }

        checkRoll(hasCritical, modify, target)

      else
        nil
      end

    return output
  end

  def checkRoll(hasCritical, modify, target)
    dice, diceText = roll(2, 6)
    successValue = dice + modify

    modifyText = getValueText(modify)
    targetText = (target == 0 ? '' : ">=#{target}")

    result = "(2D6#{modifyText}#{targetText})"
    result += " ＞ #{dice}(#{diceText})#{modifyText}"

    if( hasCritical and dice == 12 )
      result += " ＞ クリティカル！"
      return result
    end

    result += " ＞ #{successValue}#{targetText}"

    return result if( target == 0 )

    if( successValue >= target )
      result += " ＞ 【成功】"
    else
      result += " ＞ 【失敗】"
    end

    return result
  end

  def getValueText(value)
    return "" if( value == 0 )
    return "#{value}" if( value < 0 )
    return "\+#{value}"
  end

end
