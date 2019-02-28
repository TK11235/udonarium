# -*- coding: utf-8 -*-

class Cthulhu7th < DiceBot
  setPrefixes(['CC\(\d+\)', 'CC.*', 'CBR\(\d+,\d+\)', 'FAR\(\d+\)' , 'FAR.*'])

  def initialize
    #$isDebug = true
    super

    @bonus_dice_range = (-2 .. 2)
  end

  def gameName
    'クトゥルフ第7版'
  end

  def gameType
    "Cthulhu7th"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
※私家翻訳のため、用語・ルールの詳細については原本を参照願います。

・判定　CC(x)<=（目標値）
　x：ボーナス・ペナルティダイス：Bonus/Penalty Dice (2～－2)。省略可。
　致命的失敗：Fumble／失敗：Failure／通常成功：Regular success／
　困難な成功：Hard success／極限の成功：Extreme success／
　決定的成功：Critical success　を自動判定。
例）CC<=30　CC(2)<=50　CC(-1)<=75

・組み合わせ判定　(CBR(x,y))
　目標値 x と y で％ロールを行い、成否を判定。
　例）CBR(50,20)

・連射（Full Auto）判定　FAR(w,x,y,z)
　w：弾数(1～100）、x：技能値（1～100）、y：故障ナンバー、
　z：ボーナス・ペナルティダイス(-2～2)。省略可。
　命中数と貫通数、残弾数のみ算出。ダメージ算出はありません。
例）FAR(25,70,98)　FAR(50,80,98,-1)
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

    nil unless (/^CC([-\d]+)?<=(\d+)/i =~ command)
    bonus_dice_count = $1.to_i #ボーナス・ペナルティダイスの個数
    diff = $2.to_i

    return "エラー。目標値は1以上です。" if(diff <= 0)

    unless ( @bonus_dice_range.include?(bonus_dice_count) )
      return "エラー。ボーナス・ペナルティダイスの値は#{@bonus_dice_range.min}～#{@bonus_dice_range.max}です。"
    end

    output = ""
    output += "(1D100<=#{diff})"
    output += " ボーナス・ペナルティダイス[#{bonus_dice_count}]"

    units_digit = rollPercentD10
    total_list = getTotalLists(bonus_dice_count, units_digit)

    total = getTotal(total_list, bonus_dice_count)
    result_text = getCheckResultText(total, diff)

    output += " ＞ #{total_list.join(", ")} ＞ #{total} ＞ #{result_text}"

    return output
  end

  def rollPercentD10
    dice, = roll(1, 10)
    dice = 0 if(dice == 10)

    return dice
  end

  def getTotalLists(bonus_dice_count, units_digit)
    total_list = []

    tens_digit_count = 1 + bonus_dice_count.abs
    tens_digit_count.times do

      bonus = rollPercentD10
      total = (bonus * 10) + units_digit
      total = 100 if (total == 0)

      total_list.push(total)
    end

    return total_list
  end

  def getTotal(total_list, bonus_dice_count)
    return total_list.min if( bonus_dice_count >= 0 )
    return total_list.max
  end

  def getCheckResultText(total, diff, fumbleable = false)

    if(total <= diff)
      return "決定的成功" if(total == 1)
      return "極限の成功" if(total <= (diff / 5))
      return "困難な成功" if(total <= (diff / 2))
      return "通常成功"
    end

    fumble_text = "致命的失敗"

    return fumble_text if (total == 100)

    if (total >= 96)
      if (diff < 50)
        return fumble_text
      else
        return fumble_text if fumbleable
      end
    end

    return "失敗"
  end

  def getCombineRoll(command)

    return nil unless(/CBR\((\d+),(\d+)\)/i =~ command)

    diff_1 = $1.to_i
    diff_2 = $2.to_i

    total, = roll(1, 100)

    result_1 = getCheckResultText(total, diff_1)
    result_2 = getCheckResultText(total, diff_2)

    successList = ["決定的成功", "極限の成功", "困難な成功", "通常成功"]

    succesCount = 0
    succesCount += 1 if successList.include?( result_1 )
    succesCount += 1 if successList.include?( result_2 )
    debug("succesCount", succesCount)

    rank =
      if( succesCount >= 2 )
        "成功"
      elsif( succesCount == 1 )
        "部分的成功"
      else
        "失敗"
      end

    return "(1d100<=#{diff_1},#{diff_2}) ＞ #{total}[#{result_1},#{result_2}] ＞ #{rank}"
  end

  def getFullAutoResult(command)

    return nil unless (/^FAR\((-?\d+)(,(-?\d+))(,(-?\d+))(,(-?\d+))?\)/i =~ command)

    bullet_count = $1.to_i
    diff = $3.to_i
    broken_number = $5.to_i
    bonus_dice_count = ($7 || 0).to_i

    output = ""

    #最大で（8回*（PC技能値最大値/10））＝72発しか撃てないはずなので上限
    bullet_count_limit = 100
    if (bullet_count > bullet_count_limit)
      output += "\n弾薬が多すぎます。装填された弾薬を#{bullet_count_limit}発に変更します。\n"
      bullet_count = bullet_count_limit
    end

    return "弾薬は正の数です。" if (bullet_count <= 0)
    return "目標値は正の数です。" if (diff <= 0)

    if (broken_number < 0)
      output += "\n故障ナンバーは正の数です。マイナス記号を外します。\n"
      broken_number = broken_number.abs
    end

    unless ( @bonus_dice_range.include?(bonus_dice_count) )
      return "\nエラー。ボーナス・ペナルティダイスの値は#{@bonus_dice_range.min}～#{@bonus_dice_range.max}です。"
    end

    output += "ボーナス・ペナルティダイス[#{bonus_dice_count}]"
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

    # 難易度変更用ループ
    (0 .. 3).each do |more_difficlty|

      output += getNextDifficltyMessage(more_difficlty)

      # ペナルティダイスを減らしながらロール用ループ
      while (dice_num >= @bonus_dice_range.min)

        loopCount += 1
        hit_result, total, total_list = getHitResultInfos(dice_num, diff, more_difficlty)
        output += "\n#{loopCount}回目: ＞ #{total_list.join(", ")} ＞ #{hit_result}"

        if (total >= broken_number)
          output += "ジャム"
          return getHitResultText(output, counts)
        end

        hit_type = getHitType(more_difficlty, hit_result)
        hit_bullet, impale_bullet, lost_bullet = getBulletResults(counts[:bullet], hit_type, diff)

        counts[:hit_bullet] += hit_bullet
        counts[:impale_bullet] += impale_bullet
        counts[:bullet] -= lost_bullet

        return getHitResultText(output, counts) if (counts[:bullet] <= 0)

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

    return hit_result , total, total_list
  end

  def getHitResultText(output, counts)
    return "#{output}\n＞ #{counts[:hit_bullet]}発が命中、#{counts[:impale_bullet]}発が貫通、残弾#{counts[:bullet]}発"
  end

  def getHitType(more_difficlty, hit_result)
    successList, impaleBulletList = getSuccessListImpaleBulletList(more_difficlty)

    return :hit if successList.include?( hit_result )
    return :impale if impaleBulletList.include?( hit_result )

    return ""
  end

  def getBulletResults(bullet_count, hit_type, diff)

    bullet_set_count = getSetOfBullet(diff)
    hit_bullet_count_base = getHitBulletCountBase(diff, bullet_set_count)
    impale_bullet_count_base = (bullet_set_count / 2.to_f)

    lost_bullet_count = 0
    hit_bullet_count = 0
    impale_bullet_count = 0

    if ( not isLastBulletTurn(bullet_count, bullet_set_count) )

      case hit_type
      when :hit
        hit_bullet_count = hit_bullet_count_base #通常命中した弾数の計算

      when :impale
        hit_bullet_count = impale_bullet_count_base.floor
        impale_bullet_count = impale_bullet_count_base.ceil  #貫通した弾数の計算
      end

      lost_bullet_count = bullet_set_count

    else

      case hit_type
      when :hit
        hit_bullet_count = getLastHitBulletCount( bullet_count )

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
      successList = ["困難な成功", "通常成功"]
      impaleBulletList = ["決定的成功", "極限の成功"]
    when 1
      successList = ["困難な成功"]
      impaleBulletList = ["決定的成功", "極限の成功"]
    when 2
      successList = []
      impaleBulletList = ["決定的成功", "極限の成功"]
    when 3
      successList = ["決定的成功"]
      impaleBulletList = []
    end

    return successList, impaleBulletList
  end

  def getNextDifficltyMessage(more_difficlty)
    case more_difficlty
    when 1
      return "\n    難易度が困難な成功に変更"
    when 2
      return "\n    難易度が極限の成功に変更"
    when 3
      return "\n    難易度が決定的成功に変更"
    end

    return ""
  end

  def getSetOfBullet(diff)
    #bullet_set_count = diff / 10
    bullet_set_count = (diff / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if ((diff >= 1) and (diff < 10))
      bullet_set_count = 1  #技能値が9以下での最低値保障処理
    end

    return bullet_set_count
  end

  def getHitBulletCountBase(diff, bullet_set_count)
    #hit_bullet_count_base = (bullet_set_count / 2)
    hit_bullet_count_base = (bullet_set_count / 2).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if ((diff >= 1) and (diff < 10))
      hit_bullet_count_base = 1  #技能値9以下での最低値保障
    end

    return hit_bullet_count_base
  end

  def isLastBulletTurn(bullet_count,bullet_set_count)
    ((bullet_count - bullet_set_count) < 0)
  end

  def getLastHitBulletCount(bullet_count)

    #残弾1での最低値保障処理
    if (bullet_count == 1)
      return 1
    end

    count = (bullet_count / 2.to_f).floor
    return count
  end

  def getFumbleable(more_difficlty)
    #成功が49以下の出目のみとなるため、ファンブル値は上昇
    return ( more_difficlty >= 1 )
  end
end
