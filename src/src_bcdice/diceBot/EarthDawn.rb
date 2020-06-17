# -*- coding: utf-8 -*-
# frozen_string_literal: true

class EarthDawn < DiceBot
  # ゲームシステムの識別子
  ID = 'EarthDawn'

  # ゲームシステム名
  NAME = 'アースドーン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ああすとおん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
ステップダイス　(xEn+k)
ステップx、目標値n(省略可能）、カルマダイスk(D2-D20)でステップダイスをロールします。
振り足しも自動。
例）9E　10E8　10E+D12
INFO_MESSAGE_TEXT

  setPrefixes(['\d+e.*'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
  end

  def rollDiceCommand(command)
    return ed_step(command)
  end

  # アースドーンステップ表
  def ed_step(str)
    output = getStepResult(str)

    return output
  end

  def getStepResult(str)
    return nil unless /(\d+)E(\d+)?(\+)?(\d+)?(d\d+)?/i =~ str

    stepTotal = 0
    @isFailed = true

    step = Regexp.last_match(1).to_i # ステップ
    targetNumber = 0 # 目標値
    hasKarmaDice = false # カルマダイスの有無
    karmaDiceCount = 0 # カルマダイスの個数又は修正
    karmaDiceType = 0 # カルマダイスの種類

    # 空値があった時の為のばんぺいくんRX
    if step > 40
      step = 40
    end

    if Regexp.last_match(2)
      targetNumber = Regexp.last_match(2).to_i
      targetNumber = 42 if targetNumber > 43
    end

    hasKarmaDice = Regexp.last_match(3).to_i if Regexp.last_match(3)
    karmaDiceCount = Regexp.last_match(4).to_i if Regexp.last_match(4)
    karmaDiceType = Regexp.last_match(5) if Regexp.last_match(5)

    return nil if targetNumber < 0

    stable = getStepTable()

    nmod = stable[0][step - 1]
    d20step  = stable[1][step - 1]
    d12step  = stable[2][step - 1]
    d10step  = stable[3][step - 1]
    d8step   = stable[4][step - 1]
    d6step   = stable[5][step - 1]
    d4step   = stable[6][step - 1]

    if hasKarmaDice
      case karmaDiceType
      when /d20/i
        d20step += karmaDiceCount
      when /d12/i
        d12step += karmaDiceCount
      when /d10/i
        d10step += karmaDiceCount
      when /d8/i
        d8step  += karmaDiceCount
      when /d6/i
        d6step  += karmaDiceCount
      when /d4/i
        d4step  += karmaDiceCount
      else
        nmod += karmaDiceCount
      end
    end

    @string = ""

    debug('d20step, d12step, d10step, d8step, d6step, d4step', d20step, d12step, d10step, d8step, d6step, d4step)

    stepTotal += rollStep(20, d20step)
    stepTotal += rollStep(12, d12step)
    stepTotal += rollStep(10, d10step)
    stepTotal += rollStep(8,  d8step)
    stepTotal += rollStep(6,  d6step)
    stepTotal += rollStep(4,  d4step)

    if nmod > 0 # 修正分の適用
      @string += "+"
    end

    if nmod != 0
      @string += nmod.to_s
      stepTotal += nmod
    end

    # ステップ判定終了
    @string += " ＞ #{stepTotal}"

    output = "ステップ#{step} ＞ #{@string}"
    return output if targetNumber == 0

    # 結果判定
    @string += ' ＞ '

    excelentSuccessNumber = stable[7][targetNumber - 1]
    superSuccessNumber = stable[8][targetNumber - 1]
    goodSuccessNumber = stable[9][targetNumber - 1]
    failedNumber = stable[11][targetNumber - 1]

    if @isFailed
      @string += '自動失敗'
    elsif stepTotal >= excelentSuccessNumber
      @string += '最良成功'
    elsif stepTotal >= superSuccessNumber
      @string += '優成功'
    elsif stepTotal >= goodSuccessNumber
      @string += '良成功'
    elsif stepTotal >= targetNumber
      @string += '成功'
    elsif stepTotal < failedNumber
      @string += '大失敗'
    else
      @string += '失敗'
    end

    output = "ステップ#{step}>=#{targetNumber} ＞ #{@string}"

    return output
  end

  def getStepTable
    # 表      1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 34x 3x 4x 5x 6x 7x 8x 9x10x11x12x13x

    mod = [-2, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]
    d20 = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]
    d12 = [ 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1,]
    d10 = [ 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 2, 3, 2, 1, 1, 1, 2, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 2, 1,]
    d8  = [ 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 2, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0,]
    d6  = [ 0, 0, 0, 1, 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 2, 1, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 2, 1, 1, 0, 0, 0,]
    d4  = [ 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]
    exsuc = [ 6, 8, 10, 12, 14, 17, 19, 20, 22, 24, 25, 27, 29, 32, 33, 35, 37, 38, 39, 41, 42, 44, 45, 47, 48, 49, 51, 52, 54, 55, 56, 58, 59, 60, 62, 64, 65, 67, 68, 70, 71, 72,]
    ssuc = [ 4, 6, 8, 10, 11, 13, 15, 16, 18, 19, 21, 22, 24, 26, 27, 29, 30, 32, 33, 34, 35, 37, 38, 40, 41, 42, 43, 45, 46, 47, 48, 49, 51, 52, 53, 55, 56, 58, 59, 60, 61, 62,]
    gsuc = [ 2, 4, 6, 7, 9, 10, 12, 13, 14, 15, 17, 18, 20, 21, 22, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 50, 51, 52, 53, 54,]
    nsuc = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,]
    fsuc = [ 0, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 11, 12, 13, 13, 14, 15, 16, 17, 18, 18, 18, 20, 21, 22, 23, 23, 24, 25, 26, 26, 27, 28, 29, 30,]

    stable = [mod, d20, d12, d10, d8, d6, d4, exsuc, ssuc, gsuc, nsuc, fsuc]

    return stable
  end

  # 41以上のステップの為の配列です。
  # 以下のようなルールでダイスを増やしています。より正しいステップ計算法をご存知の方は、
  # どうぞそちらに合せて調整して下さい。
  # 　基本：　2d20+d10+d8
  # 　これを仮にステップ34xとしています。
  # 　一般式としては、ステップxxのダイスは、

  # 　 ステップ34xのダイス
  # + [(xx-45)/11]d20
  # + ステップ[(xx-34)を11で割った余り+3]のダイス

  def rollStep(diceType, diceCount)
    debug('rollStep diceType, diceCount, @string', diceType, diceCount, @string)

    stepTotal = 0
    return stepTotal unless diceCount > 0

    # diceぶんのステップ判定

    @string += "+" unless @string.empty?
    @string += "#{diceCount}d#{diceType}["
    debug('rollStep @string', @string)

    diceCount.times do |i|
      dice_now, = roll(1, diceType)

      if dice_now != 1
        @isFailed = false
      end

      dice_in = dice_now

      while dice_now == diceType
        dice_now, = roll(1, diceType)

        dice_in += dice_now
      end

      stepTotal += dice_in

      @string += ',' if i != 0
      @string += dice_in.to_s
    end

    @string += "]"

    return stepTotal
  end
end
