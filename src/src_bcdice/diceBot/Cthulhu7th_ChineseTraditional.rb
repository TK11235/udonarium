# -*- coding: utf-8 -*-

class Cthulhu7th_ChineseTraditional < DiceBot
  setPrefixes(['CC\(\d+\)', 'CC.*', 'CBR\(\d+,\d+\)', 'FAR\(\d+\)', 'FAR.*'])

  def initialize
    # $isDebug = true
    super

    @bonus_dice_range = (-2 .. 2)
  end

  def gameName
    '克蘇魯神話第7版'
  end

  def gameType
    "Cthulhu7th:ChineseTraditional"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT

・判定　CC(x)<=（目標値）
　x：獎勵骰/懲罰骰：Bonus/Penalty Dice (2～－2)。沒有的話可以省略。
　致命的失敗：Fumble／失敗：Failure／通常成功：Regular success／
　困難成功：Hard success／極限成功：Extreme success／
　決定性的成功：Critical success　自動判定。
例）CC<=30　CC(2)<=50　CC(-1)<=75

・組合判定　(CBR(x,y))
　進行目標値 x 和 y 的判定。
　例）CBR(50,20)

・連射（Full Auto）判定　FAR(w,x,y,z)
　w：彈數(1～100）、x：技能値（1～100）、y：故障率
　z：獎勵、懲罰骰(-2～2)。可省略。
　只計算命中數、貫穿數及剩餘彈藥，不計算傷害。
例）FAR(25,70,98)　FAR(50,80,98,-1)

・瘋狂表
・實時型　Short／總結型　Longer
INFO_MESSAGE_TEXT
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
    bonus_dice_count = $1.to_i # 獎勵、懲罰骰數量
    diff = $2.to_i

    return "錯誤。目標值需為1以上。" if diff <= 0

    unless @bonus_dice_range.include?(bonus_dice_count)
      return "錯誤。獎勵、懲罰骰値為#{@bonus_dice_range.min}～#{@bonus_dice_range.max}。"
    end

    output = ""
    output += "(1D100<=#{diff})"
    output += " 獎勵、懲罰骰値[#{bonus_dice_count}]"

    units_digit = rollPercentD10
    total_list = getTotalLists(bonus_dice_count, units_digit)

    total = getTotal(total_list, bonus_dice_count)
    result_text = getCheckResultText(total, diff)

    output += " ＞ #{total_list.join(", ")} ＞ #{total} ＞ #{result_text}"

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
      return "決定性的成功" if total == 1
      return "極限的成功" if total <= (diff / 5)
      return "困難的成功" if total <= (diff / 2)

      return "通常成功"
    end

    fumble_text = "致命的失敗"

    return fumble_text if total == 100

    if total >= 96
      if diff < 50
        return fumble_text
      else
        return fumble_text if fumbleable
      end
    end

    return "失敗"
  end

  def getCombineRoll(command)
    return nil unless /CBR\((\d+),(\d+)\)/i =~ command

    diff_1 = $1.to_i
    diff_2 = $2.to_i

    total, = roll(1, 100)

    result_1 = getCheckResultText(total, diff_1)
    result_2 = getCheckResultText(total, diff_2)

    successList = ["決定性的成功", "極限的成功", "困難的成功", "通常成功"]

    succesCount = 0
    succesCount += 1 if successList.include?(result_1)
    succesCount += 1 if successList.include?(result_2)
    debug("succesCount", succesCount)

    rank =
      if succesCount >= 2
        "成功"
      elsif succesCount == 1
        "部分的成功"
      else
        "失敗"
      end

    return "(1d100<=#{diff_1},#{diff_2}) ＞ #{total}[#{result_1},#{result_2}] ＞ #{rank}"
  end

  def getFullAutoResult(command)
    return nil unless /^FAR\((-?\d+)(,(-?\d+))(,(-?\d+))(,(-?\d+))?\)/i =~ command

    bullet_count = $1.to_i
    diff = $3.to_i
    broken_number = $5.to_i
    bonus_dice_count = ($7 || 0).to_i

    output = ""

    # 射擊數不超過（8回*（PC技能値最大値/10））＝72的上限
    bullet_count_limit = 100
    if bullet_count > bullet_count_limit
      output += "\n彈藥太多。請改裝填#{bullet_count_limit}發。\n"
      bullet_count = bullet_count_limit
    end

    return "正確裝填數。" if bullet_count <= 0
    return "正確目標值。" if diff <= 0

    if broken_number < 0
      output += "\n正確故障值。排除獎勵記號。\n"
      broken_number = broken_number.abs
    end

    unless @bonus_dice_range.include?(bonus_dice_count)
      return "\n錯誤。獎勵、懲罰骰値為#{@bonus_dice_range.min}～#{@bonus_dice_range.max}です。"
    end

    output += "獎勵、懲罰骰値[#{bonus_dice_count}]"
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

    # 難度變更用Lｏｏｐ
    (0 .. 3).each do |more_difficlty|
      output += getNextDifficltyMessage(more_difficlty)

      # ペナルティダイスを減らしながらロール用ループ削減獎勵骰時角色用Lｏｏｐ
      while dice_num >= @bonus_dice_range.min

        loopCount += 1
        hit_result, total, total_list = getHitResultInfos(dice_num, diff, more_difficlty)
        output += "\n#{loopCount}次: ＞ #{total_list.join(", ")} ＞ #{hit_result}"

        if total >= broken_number
          output += "卡彈"
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
    return "#{output}\n＞ #{counts[:hit_bullet]}發射擊命中、#{counts[:impale_bullet]}射擊貫穿、剩餘彈藥#{counts[:bullet]}發"
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
        hit_bullet_count = hit_bullet_count_base # 正常命中彈藥數之計算

      when :impale
        hit_bullet_count = impale_bullet_count_base.floor
        impale_bullet_count = impale_bullet_count_base.ceil # 貫穿彈藥數之計算
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
      successList = ["困難的成功", "通常成功"]
      impaleBulletList = ["決定性的成功", "極限的成功"]
    when 1
      successList = ["困難的成功"]
      impaleBulletList = ["決定性的成功", "極限的成功"]
    when 2
      successList = []
      impaleBulletList = ["決定性的成功", "極限的成功"]
    when 3
      successList = ["決定性的成功"]
      impaleBulletList = []
    end

    return successList, impaleBulletList
  end

  def getNextDifficltyMessage(more_difficlty)
    case more_difficlty
    when 1
      return "\n    變更難度為困難的成功"
    when 2
      return "\n    變更難度為極限的成功"
    when 3
      return "\n    變更難度為決定性的成功"
    end

    return ""
  end

  def getSetOfBullet(diff)
    #bullet_set_count = diff / 10
    bullet_set_count = (diff / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if (diff >= 1) && (diff < 10)
      bullet_set_count = 1 # 技能值９以下的最低限度保障處理
    end

    return bullet_set_count
  end

  def getHitBulletCountBase(diff, bullet_set_count)
    #hit_bullet_count_base = (bullet_set_count / 2)
    hit_bullet_count_base = (bullet_set_count / 2).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if (diff >= 1) && (diff < 10)
      hit_bullet_count_base = 1 # 技能值９以下的最低限度保障處理
    end

    return hit_bullet_count_base
  end

  def isLastBulletTurn(bullet_count, bullet_set_count)
    ((bullet_count - bullet_set_count) < 0)
  end

  def getLastHitBulletCount(bullet_count)
    # 在剩餘彈藥為１的最低限度保障處理
    if bullet_count == 1
      return 1
    end

    count = (bullet_count / 2.to_f).floor
    return count
  end

  def getFumbleable(more_difficlty)
    # 成功判定時因只擲出４９以下數值，而大失敗率上昇
    return (more_difficlty >= 1)
  end
end
