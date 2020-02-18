# -*- coding: utf-8 -*-

class Cthulhu_ChineseTraditional < DiceBot
  setPrefixes(['CC(B)?\(\d+\)', 'CC(B)?.*', 'RES(B)?.*', 'CBR(B)?\(\d+,\d+\)'])

  def initialize
    # $isDebug = true
    super
    @special_percentage  = 20
    @critical_percentage = 1
    @fumble_percentage   = 1
  end

  def gameName
    '克蘇魯神話'
  end

  def gameType
    "Cthulhu:ChineseTraditional"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
c=爆擊率 ／ f=大失敗值 ／ s=特殊

1d100<=n    c・f・s全關閉（只進行單純數值比較判定）

・cfs付註判定指令

CC	 1d100擲骰 c=1、f=100
CCB  同上、c=5、f=96

例：CC<=80  （以技能值80來判定。cf適用於1%規則）
例：CCB<=55 （以技能值55來判定。cf適用於5%規則）

・關於組合骰組

CBR(x,y)	c=1、f=100
CBRB(x,y)	c=5、f=96

・關於對抗骰
RES(x-y)	c=1、f=100
RESB(x-y)	c=5、f=96

※故障率判定

・CC(x) c=1、f=100
x=故障率。擲出骰值x以上時、需在大失敗發生同時輸出（參照「大失敗＆故障」）
沒有大失敗時，無論成功或失敗只需參考[故障]來輸出(並非成功或失敗來輸出，而是覆蓋上去並對其輸出)

・CCB(x) c=5、f=96
同上

・瘋狂表
・短期瘋期　Short／長期瘋狂　Longer

INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    case command
    when /CCB/i
      # 5%
      @critical_percentage = 5
      @fumble_percentage   = 5
      return getCheckResult(command)
    when /CC/i
      # 1%
      @critical_percentage = 1
      @fumble_percentage   = 1
      return getCheckResult(command)
    when /RESB/i
      # 5%
      @critical_percentage = 5
      @fumble_percentage   = 5
      return getRegistResult(command)
    when /CBRB/i
      # 5%
      @critical_percentage = 5
      @fumble_percentage   = 5
      return getCombineRoll(command)
    when /RES/i
      # 1%
      @critical_percentage = 1
      @fumble_percentage   = 1
      return getRegistResult(command)
    when /CBR/i
      # 1%
      @critical_percentage = 1
      @fumble_percentage   = 1
      return getCombineRoll(command)
    end

    return nil
  end

  def getCheckResult(command)
    broken_num = 0
    diff = 0

    if (m = /CC(B)?(\d+)<=(\d+)/i.match(command))
      # /\(\d+\)/の()はpattern-killerにカイシャクされる
      broken_num = m[2].to_i
      diff = m[3].to_i
    elsif (m = /CC(B)?<=(\d+)/i.match(command))
      diff = m[2].to_i
    end

    output = ""

    if diff > 0
      output = "(1D100<=#{diff})"

      if broken_num > 0
        output += " 故障率[#{broken_num}]"
      end

      total_n, = roll(1, 100)

      output += " ＞ #{total_n}"
      output += " ＞ #{getCheckResultText(total_n, diff, broken_num)}"
    else
      total_n, = roll(1, 100)
      output = "(1D100) ＞ #{total_n}"
    end

    return output
  end

  def getCheckResultText(total_n, diff, broken_num = 0)
    result = ""
    diff_special = 0
    fumble = false

    if @special_percentage > 0
      # 需有special的數值設定才能做爆擊/大失敗的判定
      diff_special = (diff * @special_percentage / 100).floor
      if diff_special < 1
        diff_special = 1
      end
    end

    if (total_n <= diff) && (total_n < 100)
      result = "成功"

      if diff_special > 0
        if total_n <= @critical_percentage
          if total_n <= diff_special
            result = "決定性的成功/特殊"
          else
            result = "決定性的成功"
          end
        else
          if total_n <= diff_special
            result = "特殊"
          end
        end
      end
    else
      result = "失敗"

      if diff_special > 0
        if (total_n >= (101 - @fumble_percentage)) && (diff < 100)
          result = "致命性失敗"
          fumble = true
        end
      end
    end

    if broken_num > 0
      if total_n >= broken_num
        if fumble
          result += "/故障"
        else
          result = "故障"
        end
      end
    end

    return result
  end

  def getRegistResult(command)
    m = /RES(B)?([-\d]+)/i.match(command)
    unless m
      return "1"
    end

    value = m[2].to_i
    target = value * 5 + 50

    if target < 5
      return "(1d100<=#{target}) ＞ 自動失敗"
    end

    if target > 95
      return "(1d100<=#{target}) ＞ 自動成功"
    end

    # 通常判定
    total_n, = roll(1, 100)
    result = getCheckResultText(total_n, target)

    return "(1d100<=#{target}) ＞ #{total_n} ＞ #{result}"
  end

  def getCombineRoll(command)
    m = /CBR(B)?\((\d+),(\d+)\)/i.match(command)
    unless m
      return "1"
    end

    diff_1 = m[2].to_i
    diff_2 = m[3].to_i

    total, = roll(1, 100)

    result_1 = getCheckResultText(total, diff_1)
    result_2 = getCheckResultText(total, diff_2)

    successList = ["決定性成功/特殊", "決定性成功", "特殊", "成功"]

    succesCount = 0
    succesCount += 1 if successList.include?(result_1)
    succesCount += 1 if successList.include?(result_2)
    debug("succesCount", succesCount)

    rank =
      if succesCount >= 2
        "成功"
      elsif succesCount == 1
        "部分性成功"
      else
        "失敗"
      end

    return "(1d100<=#{diff_1},#{diff_2}) ＞ #{total}[#{result_1},#{result_2}] ＞ #{rank}"
  end
end
