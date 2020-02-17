# -*- coding: utf-8 -*-

class ShinMegamiTenseiKakuseihen < DiceBot
  def initialize
    super
  end

  def gameName
    '真・女神転生TRPG　覚醒編'
  end

  def gameType
    "SMTKakuseihen"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定
1D100<=(目標値) でスワップ・通常・逆スワップ判定を判定。
威力ダイスは nU6[6] (nはダイス個数)でロール可能です。
INFO_MESSAGE_TEXT
  end

  # ゲーム別成功度判定(1d100)
  def check_1D100(total_n, _dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max)
    return '' unless signOfInequality == "<="

    total_n = total_n % 100

    dice1, dice2 = getTwoDice

    total1 = dice1 * 10 + dice2
    total2 = dice2 * 10 + dice1

    # ゾロ目
    isRepdigit = (dice1 == dice2)

    result = " ＞ スワップ"
    result += getCheckResultText(diff, [total1, total2].min, isRepdigit)
    result += "／通常"
    result += getCheckResultText(diff, total_n, isRepdigit)
    result += "／逆スワップ"
    result += getCheckResultText(diff, [total1, total2].max, isRepdigit)

    return result
  end

  def getTwoDice
    value = getDiceList.first
    value ||= 0

    value %= 100

    #dice1 = value / 10
    dice1 = (value / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    dice2 = value % 10

    return [dice1, dice2]
  end

  def getCheckResultText(diff, total, isRepdigit)
    checkResult = getCheckResult(diff, total, isRepdigit)
    text = format("(%02d)%s", total, checkResult)
    return text
  end

  def getCheckResult(diff, total, isRepdigit)
    if diff >= total
      return getSuccessResult(isRepdigit)
    end

    return getFailResult(isRepdigit)
  end

  def getSuccessResult(isRepdigit)
    if isRepdigit
      return "絶対成功"
    end

    return "成功"
  end

  def getFailResult(isRepdigit)
    if isRepdigit
      return "絶対失敗"
    end

    return "失敗"
  end
end
