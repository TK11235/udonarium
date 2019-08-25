# -*- coding: utf-8 -*-

require 'diceBot/EarthDawn'

class EarthDawn3 < EarthDawn
  setPrefixes(['\d+e.*'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
  end

  def gameName
    'アースドーン3版'
  end

  def gameType
    "EarthDawn3"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
ステップダイス　(xEn+k)
ステップx、目標値n(省略可能）、カルマダイスk(D2～D20)でステップダイスをロールします。
振り足しも自動。
例）ステップ10：10E
　　ステップ10、目標値8：10E8
　　ステップ12、目標値8、カルマダイスD12：10E8+1D6
INFO_MESSAGE_TEXT
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
    return nil unless /^(\d+)E(\d+)?(\+(\d*)D(\d+))?(\+\d)?/i =~ str

    stepTotal = 0
    @isFailed = true

    step = Regexp.last_match(1).to_i # ステップ
    targetNumber = [Regexp.last_match(2).to_i, 20].min # 目標値
    hasKarmaDice = !Regexp.last_match(3).nil? # カルマダイスの有無
    karmaDiceCount = [1, Regexp.last_match(4).to_i].max # カルマダイスの個数
    karmaDiceType = Regexp.last_match(5).to_i # カルマダイスの種類
    diceModify = Regexp.last_match(6).to_i

    karmaDiceInfo = Hash.new(0)
    if hasKarmaDice
      karmaDiceInfo[karmaDiceType] = karmaDiceCount
    end

    return nil if targetNumber < 0

    stepInfo = getStepInfo(step)
    debug('stepInfo', stepInfo)

    @string = ""

    diceTypes = [20, 12, 10, 8, 6, 4]
    diceTypes.each do |type|
      stepTotal += rollStep(type, stepInfo.shift)
    end
    modify = stepInfo.shift

    karmaDiceInfo.each do |diceType, diceCount|
      stepTotal += rollStep(diceType, diceCount)
    end

    @string += (getModifyText(modify) + getModifyText(diceModify))
    stepTotal += (modify + diceModify)

    # ステップ判定終了
    @string += " ＞ #{stepTotal}"

    output = "ステップ#{step} ＞ #{@string}"
    return output if targetNumber == 0

    # 結果判定
    @string += ' ＞ ' + getSuccess(targetNumber, stepTotal)

    output = "ステップ#{step}>=#{targetNumber} ＞ #{@string}"

    return output
  end

  def getModifyText(modify)
    @string = ""
    return @string if  modify == 0

    @string += "+" if  modify > 0
    @string += modify.to_s
    return @string
  end

  def getBaseStepTable
    stepTable =
      [
        #      dice
        #      D20  D12  D10  D8  D6  D4  mod
        [ 1, [ 0, 0, 0, 0, 1, 0, -3] ],
        [ 2,  [  0,   0,   0,  0,  1,  0,  -2] ],
        [ 3,  [  0,   0,   0,  0,  1,  0,  -1] ],
        [ 4,  [  0,   0,   0,  0,  1,  0,   0] ],
        [ 5,  [  0,   0,   0,  1,  0,  0,   0] ],
        [ 6,  [  0,   0,   1,  0,  0,  0,   0] ],
        [ 7,  [  0,   1,   0,  0,  0,  0,   0] ],
      ]

    return stepTable
  end

  def getStepInfo(step)
    baseStepTable = getBaseStepTable
    baseMaxStep = baseStepTable.last.first

    if step <= baseMaxStep
      return get_table_by_number(step, baseStepTable)
    end

    baseStepInfo = [  0, 1, 0, 0, 0, 0, 0]
    overStep = step - baseMaxStep - 1

    stepRythm =
      [
        # dice
        # D20  D12  D10  D8  D6  D4  mod
        [ 0, 0, 0, 0, 2, 0, 0],
        [  0,   0,   0,  1,  1,  0,   0],
        [  0,   0,   0,  2,  0,  0,   0],
        [  0,   0,   1,  1,  0,  0,   0],
        [  0,   0,   2,  0,  0,  0,   0],
        [  0,   1,   1,  0,  0,  0,   0],
        [  0,   2,   0,  0,  0,  0,   0],
      ]

    result = [  0, 0, 0, 0, 0, 0, 0]

    # loopCount = (overStep / stepRythm.size)
    loopCount = (overStep / stepRythm.size).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    loopCount.times do
      addStepToResult(result, baseStepInfo)
    end

    index = (overStep % stepRythm.size)
    restStepInfo = stepRythm[index]

    addStepToResult(result, restStepInfo)

    return result
  end

  def addStepToResult(result, step)
    result.size.times do |i|
      result[i] += step[i]
    end

    return result
  end

  def getSuccess(targetNumber, stepTotal)
    return '自動失敗' if @isFailed

    successTable = getSuccessTable
    successInfo = get_table_by_number(targetNumber, successTable)

    pathetic, poor, average, good, excelent, extraordinary = successInfo

    return 'Extraordinary(極上)' if stepTotal >= extraordinary
    return 'Excelent(最高)' if stepTotal >= excelent
    return 'Good(上出来)' if stepTotal >= good
    return 'Average(そこそこ)' if stepTotal >= average
    return 'Poor(お粗末)' if stepTotal >= poor
    return 'Pathetic(惨め)' if stepTotal >= pathetic
  end

  def getSuccessTable
    successTable =
      [
        #       Pathetic Poor Average Good Excellent Extraordinary
        [ 2, [ 0, 1, 2, 5, 7, 9 ] ],
        [ 3,  [     0,     1,     3,     6, 8, 10 ] ],
        [ 4,  [     0,     1,     4,     7,    10,    12  ] ],
        [ 5,  [     1,     2,     5,     8,    11,    14  ] ],
        [ 6,  [     1,     2,     6,     9,    13,    17  ] ],
        [ 7,  [     1,     3,     7,    11,    15,    19  ] ],
        [ 8,  [     1,     4,     8,    13,    16,    20  ] ],
        [ 9,  [     1,     5,     9,    15,    18,    22  ] ],
        [10,  [     1,     6,    10,    16,    20,    24  ] ],
        [11,  [     1,     6,    11,    17,    21,    25  ] ],
        [12,  [     1,     7,    12,    18,    23,    27  ] ],
        [13,  [     1,     7,    13,    20,    25,    29  ] ],
        [14,  [     1,     8,    14,    21,    26,    31  ] ],
        [15,  [     1,     9,    15,    23,    27,    31  ] ],
        [16,  [     1,    10,    16,    24,    28,    33  ] ],
        [17,  [     1,    11,    17,    25,    30,    34  ] ],
        [18,  [     1,    12,    18,    26,    31,    36  ] ],
        [19,  [     1,    12,    19,    28,    33,    37  ] ],
        [20,  [     1,    13,    20,    29,    34,    39  ] ],
        [21,  [     1,    14,    21,    30,    36,    41  ] ],
        [22,  [     1,    15,    22,    31,    37,    42  ] ],
        [23,  [     1,    16,    23,    33,    38,    43  ] ],
        [24,  [     1,    16,    24,    34,    39,    44  ] ],
        [25,  [     1,    17,    25,    35,    41,    46  ] ],
        [26,  [     1,    18,    26,    36,    42,    47  ] ],
        [27,  [     1,    19,    27,    37,    43,    49  ] ],
        [28,  [     1,    19,    28,    39,    45,    50  ] ],
        [29,  [     1,    21,    29,    40,    46,    51  ] ],
        [30,  [     1,    21,    30,    41,    47,    53  ] ],
        [31,  [     1,    22,    31,    42,    48,    54  ] ],
        [32,  [     1,    23,    32,    43,    49,    55  ] ],
        [33,  [     1,    24,    33,    45,    51,    57  ] ],
        [34,  [     1,    24,    34,    46,    52,    58  ] ],
        [35,  [     1,    25,    35,    47,    53,    60  ] ],
        [36,  [     1,    26,    36,    48,    54,    60  ] ],
        [37,  [     1,    27,    37,    49,    56,    62  ] ],
        [38,  [     1,    28,    38,    51,    57,    63  ] ],
        [39,  [     1,    29,    39,    52,    58,    64  ] ],
        [40,  [     1,    30,    40,    53,    59,    66  ] ],
      ]

    return successTable
  end

  def rollStep(diceType, diceCount)
    debug('rollStep diceType, diceCount, @string', diceType, diceCount, @string)

    stepTotal = 0
    return stepTotal unless diceCount > 0

    # diceぶんのステップ判定

    @string += "+" unless @string.empty?
    @string += "#{diceCount}d#{diceType}["
    debug('rollStep @string', @string)

    diceCount.times do |i|
      dice_now, dummy = roll(1, diceType)

      if dice_now != 1
        @isFailed = false
      end

      dice_in = dice_now

      while dice_now == diceType
        dice_now, dummy = roll(1, diceType)

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
