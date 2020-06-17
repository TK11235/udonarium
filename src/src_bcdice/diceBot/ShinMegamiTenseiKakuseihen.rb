# -*- coding: utf-8 -*-
# frozen_string_literal: true

class ShinMegamiTenseiKakuseihen < DiceBot
  # ゲームシステムの識別子
  ID = 'SMTKakuseihen'

  # ゲームシステム名
  NAME = '真・女神転生TRPG　覚醒篇'

  # ゲームシステム名の読みがな
  SORT_KEY = 'しんめかみてんせいTRPGかくせいへん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定
1D100<=(目標値) でスワップ・通常・逆スワップ判定を判定。
威力ダイスは nU6[6] (nはダイス個数)でロール可能です。
INFO_MESSAGE_TEXT

  # ゲーム別成功度判定(1d100)
  def check_1D100(total, dice_total, cmp_op, target)
    return '' unless cmp_op == :<=

    dice1, dice2 = split_tens(dice_total)

    total1 = dice1 * 10 + dice2
    total2 = dice2 * 10 + dice1

    # ゾロ目
    isRepdigit = (dice1 == dice2)

    result = " ＞ スワップ"
    result += getCheckResultText(target, [total1, total2].min, isRepdigit)
    result += "／通常"
    result += getCheckResultText(target, total % 100, isRepdigit)
    result += "／逆スワップ"
    result += getCheckResultText(target, [total1, total2].max, isRepdigit)

    return result
  end

  def split_tens(value)
    value %= 100

    ones = (value / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    tens = value % 10

    return [ones, tens]
  end

  def getCheckResultText(diff, total, isRepdigit)
    checkResult = getCheckResult(diff, total, isRepdigit)
    text = format("(%02d)", total) + checkResult
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
