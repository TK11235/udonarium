# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Cthulhu_Korean < DiceBot
  # ゲームシステムの識別子
  ID = 'Cthulhu:Korean'

  # ゲームシステム名
  NAME = '크툴루'

  # ゲームシステム名の読みがな
  SORT_KEY = '国際化:Korean:크툴루의부름7'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
c=크리티컬치 ／ f=펌블치 ／ s=스페셜

1d100<=n    c・f・s 모두 오프（단순하게 수치만을 뽑아낼 때 사용）

・cfs이 붙는 판정의 커맨드

CC	 1d100 판정을 행함 c=1、f=100
CCB  위와 동일、c=5、f=96

예：CC<=80  （기능치 80로 행휘판정. 1%룰으로 cf적용）
예：CCB<=55 （기능치 55로 행휘판정. 5%룰으로 cf적용）

・경우의 수 판정에 대해서

CBR(x,y)	c=1、f=100
CBRB(x,y)	c=5、f=96

・저항 판정에 대해서
RES(x-y)	c=1、f=100
RESB(x-y)	c=5、f=96

※고장 넘버 판정

・CC(x) c=1、f=100
x=고장 넘버. 주사위 눈x이상이 나온 후에, 펌블이 동시에 발생했을 경우. 모두 출력한다. （텍스트 「펌블＆고장」）
펌블이 아닌 경우, 성공・실패에 관련되지 않고 「고장」만을 출력한다. （성공・실패를 출력하지 않고 덧쓰기한 것을 출력하는 형태）

・CCB(x) c=5、f=96
위와 동일
INFO_MESSAGE_TEXT

  setPrefixes(['CC(B)?\(\d+\)', 'CC(B)?.*', 'RES(B)?.*', 'CBR(B)?\(\d+,\d+\)'])

  def initialize
    # $isDebug = true
    super
    @special_percentage  = 20
    @critical_percentage = 1
    @fumble_percentage   = 1
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
      # /\(\d+\)/의()는 pattern-killer로 해석되는 듯 함
      broken_num = m[2].to_i
      diff = m[3].to_i
    elsif (m = /CC(B)?<=(\d+)/i.match(command))
      diff = m[2].to_i
    end

    output = ""

    if diff > 0
      output = "(1D100<=#{diff})"

      if broken_num > 0
        output += " 고장넘버[#{broken_num}]"
      end

      total_n, = roll(1, 100)

      output += " ＞ #{total_n}"
      output += " ＞ #{getCheckResultText(total_n, diff, broken_num)}"
    else
      # 1D100단순 치환 취급
      # 필요없을지도
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
      # special의 값설정이 없는 경우 크리티컬/펌블 판정도 없다
      diff_special = (diff * @special_percentage / 100).floor
      if diff_special < 1
        diff_special = 1
      end
    end

    if (total_n <= diff) && (total_n < 100)
      result = "성공"

      if diff_special > 0
        if total_n <= @critical_percentage
          if total_n <= diff_special
            result = "크리티컬/스페셜"
          else
            result = "크리티컬"
          end
        else
          if total_n <= diff_special
            result = "스페셜"
          end
        end
      end
    else
      result = "실패"

      if diff_special > 0
        if (total_n >= (101 - @fumble_percentage)) && (diff < 100)
          result = "펌블"
          fumble = true
        end
      end
    end

    if broken_num > 0
      if total_n >= broken_num
        if fumble
          result += "/고장"
        else
          result = "고장"
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
      return "(1d100<=#{target}) ＞ 자동실패"
    end

    if target > 95
      return "(1d100<=#{target}) ＞ 자동성공"
    end

    # 통상판정
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

    successList = ["크리티컬/스페셜", "크리티컬", "스페셜", "성공"]

    succesCount = 0
    succesCount += 1 if successList.include?(result_1)
    succesCount += 1 if successList.include?(result_2)
    debug("succesCount", succesCount)

    rank =
      if succesCount >= 2
        "성공"
      elsif  succesCount == 1
        "부분적 성공"
      else
        "실패"
      end

    return "(1d100<=#{diff_1},#{diff_2}) ＞ #{total}[#{result_1},#{result_2}] ＞ #{rank}"
  end
end
