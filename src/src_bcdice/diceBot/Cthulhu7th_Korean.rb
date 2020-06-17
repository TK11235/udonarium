# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Cthulhu7th_Korean < DiceBot
  # ゲームシステムの識別子
  ID = 'Cthulhu7th:Korean'

  # ゲームシステム名
  NAME = '크툴루의 부름 7판'

  # ゲームシステム名の読みがな
  SORT_KEY = '国際化:Korean:크툴루'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・판정　CC(x)<=（목표치）
　x：보너스, 패널티 주사위：Bonus/Penalty Dice (2~-2). 생략 가능.
　대실패：Fumble／실패：Failure／보통 성공：Regular success／
　어려운 성공：Hard success／대단한 성공：Extreme success／
　대성공：Critical success　을 자동판정.
예）CC<=30　CC(2)<=50　CC(-1)<=75

・조합 판정　(CBR(x,y))
　목표치 x 와 y 로 동시에 ％판정을 한다.
　예）CBR(50,20)

・연사(Full Auto)판정　FAR(w,x,y,z)
　w：탄수(1~100), x：기능 수치(1~100), y：고장 넘버
　z：보너스, 패널티 주사위(-2~2). 생략 가능.
　명중수와 관통수, 잔탄수만을 계산. 데미지는 계산하지 않습니다.
예）FAR(25,70,98)　FAR(50,80,98,-1)
INFO_MESSAGE_TEXT

  setPrefixes(['CC\(\d+\)', 'CC.*', 'CBR\(\d+,\d+\)', 'FAR\(\d+\)', 'FAR.*'])

  def initialize
    # $isDebug = true
    super

    @bonus_dice_range = (-2..2)
  end

  def rollDiceCommand(command)
    case command
    when /CC/i
      return getCheckResult(command)
    when /CBR/i
      return getCombineRoll(command)
    when /FAR/i
      return getFullAutoResult(command)
    end

    return nil
  end

  def getCheckResult(command)
    nil unless /^CC([-\d]+)?<=(\d+)/i =~ command
    bonus_dice_count = Regexp.last_match(1).to_i # 보너스, 패널티 주사위의 개수
    diff = Regexp.last_match(2).to_i

    return "에러. 목표치는 1 이상입니다." if diff <= 0

    unless @bonus_dice_range.include?(bonus_dice_count)
      return "에러. 보너스, 패널티 주사위의 수치는 #{@bonus_dice_range.min}~#{@bonus_dice_range.max}입니다."
    end

    output = ""
    output += "(1D100<=#{diff})"
    output += " 보너스, 패널티 주사위[#{bonus_dice_count}]"

    units_digit = rollPercentD10
    total_list = getTotalLists(bonus_dice_count, units_digit)

    total = getTotal(total_list, bonus_dice_count)
    result_text = getCheckResultText(total, diff)

    output += " ＞ #{total_list.join(', ')} ＞ #{total} ＞ #{result_text}"

    return output
  end

  def rollPercentD10
    dice, = roll(1, 10)
    dice = 0 if dice == 10

    return dice
  end

  def getTotalLists(bonus_dice_count, units_digit)
    total_list = []

    tens_digit_count = 1 + bonus_dice_count.abs
    tens_digit_count.times do
      bonus = rollPercentD10
      total = (bonus * 10) + units_digit
      total = 100 if total == 0

      total_list.push(total)
    end

    return total_list
  end

  def getTotal(total_list, bonus_dice_count)
    return total_list.min if bonus_dice_count >= 0

    return total_list.max
  end

  def getCheckResultText(total, diff, fumbleable = false)
    if total <= diff
      return "대성공" if total == 1
      return "대단한 성공" if total <= (diff / 5)
      return "어려운 성공" if total <= (diff / 2)

      return "보통 성공"
    end

    fumble_text = "대실패"

    return fumble_text if total == 100

    if total >= 96
      if diff < 50
        return fumble_text
      else
        return fumble_text if fumbleable
      end
    end

    return "실패"
  end

  def getCombineRoll(command)
    return nil unless /CBR\((\d+),(\d+)\)/i =~ command

    diff_1 = Regexp.last_match(1).to_i
    diff_2 = Regexp.last_match(2).to_i

    total, = roll(1, 100)

    result_1 = getCheckResultText(total, diff_1)
    result_2 = getCheckResultText(total, diff_2)

    successList = ["대성공", "대단한 성공", "어려운 성공", "보통성공"]

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

  def getFullAutoResult(command)
    return nil unless /^FAR\((-?\d+)(,(-?\d+))(,(-?\d+))(,(-?\d+))?\)/i =~ command

    bullet_count = Regexp.last_match(1).to_i
    diff = Regexp.last_match(3).to_i
    broken_number = Regexp.last_match(5).to_i
    bonus_dice_count = (Regexp.last_match(7) || 0).to_i

    output = ""

    # 최대(8번*(PC기능 수치 최대값/10))＝72발밖에 쏠 수 없으니 상한
    bullet_count_limit = 100
    if bullet_count > bullet_count_limit
      output += "\n탄약이 너무 많습니다. 장전된 탄약을 #{bullet_count_limit}개로 변경합니다.\n"
      bullet_count = bullet_count_limit
    end

    return "탄약은 1 이상입니다." if bullet_count <= 0
    return "목표치는 1 이상입니다." if diff <= 0

    if broken_number < 0
      output += "\n고장 넘버는 1 이상입니다. 마이너스 기호를 제거합니다.\n"
      broken_number = broken_number.abs
    end

    unless @bonus_dice_range.include?(bonus_dice_count)
      return "\n에러. 보너스, 패널티 주사위의 수치는 #{@bonus_dice_range.min}~#{@bonus_dice_range.max}입니다."
    end

    output += "보너스, 패널티 주사위 [#{bonus_dice_count}]"
    output += rollFullAuto(bullet_count, diff, broken_number, bonus_dice_count)

    return output
  end

  def rollFullAuto(bullet_count, diff, broken_number, dice_num)
    output = ""
    loopCount = 0

    counts = {
      :hit_bullet => 0,
      :impale_bullet => 0,
      :bullet => bullet_count,
    }

    # 난이도 변경용 루프
    (0..3).each do |more_difficlty|
      output += getNextDifficltyMessage(more_difficlty)

      # 패널티 다이스를 줄이면서 굴리는 용 루프
      while dice_num >= @bonus_dice_range.min

        loopCount += 1
        hit_result, total, total_list = getHitResultInfos(dice_num, diff, more_difficlty)
        output += "\n#{loopCount}번째: ＞ #{total_list.join(', ')} ＞ #{hit_result}"

        if total >= broken_number
          output += " 총알 걸림"
          return getHitResultText(output, counts)
        end

        hit_type = getHitType(more_difficlty, hit_result)
        hit_bullet, impale_bullet, lost_bullet = getBulletResults(counts[:bullet], hit_type, diff)

        counts[:hit_bullet] += hit_bullet
        counts[:impale_bullet] += impale_bullet
        counts[:bullet] -= lost_bullet

        return getHitResultText(output, counts) if counts[:bullet] <= 0

        dice_num -= 1
      end

      dice_num += 1
    end

    return getHitResultText(output, counts)
  end

  def getHitResultInfos(dice_num, diff, more_difficlty)
    units_digit = rollPercentD10
    total_list = getTotalLists(dice_num, units_digit)
    total = getTotal(total_list, dice_num)

    fumbleable = getFumbleable(more_difficlty)
    hit_result = getCheckResultText(total, diff, fumbleable)

    return hit_result, total, total_list
  end

  def getHitResultText(output, counts)
    return "#{output}\n＞ #{counts[:hit_bullet]}발이 명중, #{counts[:impale_bullet]}발이 관통, 잔탄 #{counts[:bullet]}발"
  end

  def getHitType(more_difficlty, hit_result)
    successList, impaleBulletList = getSuccessListImpaleBulletList(more_difficlty)

    return :hit if successList.include?(hit_result)
    return :impale if impaleBulletList.include?(hit_result)

    return ""
  end

  def getBulletResults(bullet_count, hit_type, diff)
    bullet_set_count = getSetOfBullet(diff)
    hit_bullet_count_base = getHitBulletCountBase(diff, bullet_set_count)
    impale_bullet_count_base = (bullet_set_count / 2.to_f)

    lost_bullet_count = 0
    hit_bullet_count = 0
    impale_bullet_count = 0

    if !isLastBulletTurn(bullet_count, bullet_set_count)

      case hit_type
      when :hit
        hit_bullet_count = hit_bullet_count_base # 보통명중한 탄수의 계산

      when :impale
        hit_bullet_count = impale_bullet_count_base.floor
        impale_bullet_count = impale_bullet_count_base.ceil # 관통한 탄수의 계산
      end

      lost_bullet_count = bullet_set_count

    else

      case hit_type
      when :hit
        hit_bullet_count = getLastHitBulletCount(bullet_count)

      when :impale
        halfbull = bullet_count / 2.to_f

        hit_bullet_count = halfbull.floor
        impale_bullet_count = halfbull.ceil
      end

      lost_bullet_count = bullet_count
    end

    return hit_bullet_count, impale_bullet_count, lost_bullet_count
  end

  def getSuccessListImpaleBulletList(more_difficlty)
    successList = []
    impaleBulletList = []

    case more_difficlty
    when 0
      successList = ["어려운 성공", "보통 성공"]
      impaleBulletList = ["대성공", "대단한 성공"]
    when 1
      successList = ["어려운 성공"]
      impaleBulletList = ["대성공", "대단한 성공"]
    when 2
      successList = []
      impaleBulletList = ["대성공", "대단한 성공"]
    when 3
      successList = ["대성공"]
      impaleBulletList = []
    end

    return successList, impaleBulletList
  end

  def getNextDifficltyMessage(more_difficlty)
    case more_difficlty
    when 1
      return "\n    난이도가 어려운 성공으로 변경"
    when 2
      return "\n    난이도가 대단한 성공으로 변경"
    when 3
      return "\n    난이도가 대성공으로 변경"
    end

    return ""
  end

  def getSetOfBullet(diff)
    #bullet_set_count = diff / 10
    bullet_set_count = (diff / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if (diff >= 1) && (diff < 10)
      bullet_set_count = 1 # 기능 수치가 9 이하일 때의 최저수치 보장 처리
    end

    return bullet_set_count
  end

  def getHitBulletCountBase(diff, bullet_set_count)
    #hit_bullet_count_base = (bullet_set_count / 2)
    hit_bullet_count_base = (bullet_set_count / 2).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if (diff >= 1) && (diff < 10)
      hit_bullet_count_base = 1 # 기능 수치가 9 이하일 때의 최저수치 보장
    end

    return hit_bullet_count_base
  end

  def isLastBulletTurn(bullet_count, bullet_set_count)
    ((bullet_count - bullet_set_count) < 0)
  end

  def getLastHitBulletCount(bullet_count)
    # 잔탄 1발일 때의 최저수치 보장 처리
    if bullet_count == 1
      return 1
    end

    count = (bullet_count / 2.to_f).floor
    return count
  end

  def getFumbleable(more_difficlty)
    # 성공이 49 이하일때만이기 때문에 펌블치는 상승
    return (more_difficlty >= 1)
  end
end
