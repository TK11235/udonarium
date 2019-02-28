# -*- coding: utf-8 -*-

require 'diceBot/EarthDawn'

class EarthDawn4 < EarthDawn
  setPrefixes(['\d+e.*'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @calcText = ''
  end

  def gameName
    'アースドーン4版'
  end

  def gameType
    "EarthDawn4"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
ステップダイス　(xEnK)
ステップx、目標値n(省略可能）でステップダイスをロール。
カルマダイス使用時は末尾にKを追加（省略可能）
例）ステップ10：10E
　　ステップ10、目標値8：10E8
　　ステップ10、目標値8、カルマダイス：10E8K
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    return  ed_step(command)
  end

  #アースドーンステップ表
  def ed_step(str)
    output = getStepResult(str)

    return output
  end

  def getStepResult(str)
    stepText, calcText, stepTotal, targetNumber = getStepResultInfos(str)

    return nil if stepText.nil?

    if(targetNumber == 0)
      output = "#{stepText} ＞ #{calcText} ＞ #{stepTotal}"
      return output
    end

    #結果判定
    successText = getSuccess(targetNumber, stepTotal)

    output = "#{stepText}>=#{targetNumber} ＞ #{calcText} ＞ #{stepTotal} ＞ #{successText}"

    return output
  end

  def getStepResultInfos(str)
    steps = []
    calcs = []
    totals = []
    target = 0

    while  (not str.nil?) and (not str.empty?)

      debug("=====>!! str", str)

      step, calc, total, value, nextText = getStepResultInfo(str)
      debug("=====> step",step)

      return nil if step.nil?

      steps << step
      calcs << calc
      totals << total
      target = value unless value == 0

      debug("=====> nextText", nextText)
      break if nextText == str

      str = nextText
    end

    stepText = steps.join("+")
    calcText = calcs.join(")+(")
    stepTotal = totals.inject{|sum,i| sum + i}

    calcText = "(" + calcText + ")" if calcs.size > 1
    calcText += " ＞ (#{totals.join('+')})" if totals.size > 1

    return stepText, calcText, stepTotal, target
  end

  def getStepResultInfo(str)

    return nil unless( /^(\d+)E(\d+)?(K)?(\+\d+$)?(\+(.*))?/i =~ str)

    stepTotal = 0
    @isFailed = true

    step  = $1.to_i      #ステップ
    targetNumber = $2.to_i #目標値
    return nil if(targetNumber < 0)

    hasKarmaDice = (not $3.nil?)  #カルマダイスの有無
    diceModify = $4.to_i
    nextText = $6

    stepInfo = getStepInfo(step)
    debug('stepInfo', stepInfo)

    @calcText = ""

    diceTypes = [20, 12, 10, 8, 6, 4]
    diceTypes.each do |type|
      stepTotal += rollStep(type, stepInfo.shift)
    end
    modify = stepInfo.shift

    stepTotal += rollStep(6, 1) if( hasKarmaDice )

    @calcText += (getModifyText(modify) + getModifyText(diceModify))
    stepTotal += (modify + diceModify)

    stepText = "ステップ#{step}"

    return stepText, @calcText, stepTotal, targetNumber, nextText
  end

  def getModifyText(modify)
    string = ""
    return string if( modify == 0 )

    string += "+" if( modify > 0 )
    string += "#{modify}"
    return string
  end

  def getBaseStepTable

    stepTable =
      [
       #      dice
       #      D20  D12  D10  D8  D6  D4  mod
       [ 1,  [  0,   0,   0,  0,  0,  1,  -2] ],
       [ 2,  [  0,   0,   0,  0,  0,  1,  -1] ],
       [ 3,  [  0,   0,   0,  0,  0,  1,   0] ],
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

    if( step <= baseMaxStep )
      return get_table_by_number(step, baseStepTable)
    end

    #              dice
    #                D20  D12  D10  D8  D6  D4  mod
    overBounusStep = [  1,   0,   0,  0,  0,  0,   0]
    overStep = step - baseMaxStep - 1

    stepRythm =
      [
       # dice
       # D20  D12  D10  D8  D6  D4  mod
       [  0,   0,   0,  0,  2,  0,   0],
       [  0,   0,   0,  1,  1,  0,   0],
       [  0,   0,   0,  2,  0,  0,   0],
       [  0,   0,   1,  1,  0,  0,   0],
       [  0,   0,   2,  0,  0,  0,   0],
       [  0,   1,   1,  0,  0,  0,   0],
       [  0,   2,   0,  0,  0,  0,   0],
       [  0,   1,   0,  0,  2,  0,   0],
       [  0,   1,   0,  1,  1,  0,   0],
       [  0,   1,   0,  2,  0,  0,   0],
       [  0,   1,   1,  1,  0,  0,   0],
      ]

    # [  1,   0,   0,  0,  2,  0,   0],

    result = [  0,   0,   0,  0,  0,  0,   0]

    #loopCount = (overStep / stepRythm.size)
    loopCount = (overStep / stepRythm.size).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    loopCount.times do
      addStepToResult(result, overBounusStep)
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

    return '自動失敗' if( @isFailed )

    diff = stepTotal - targetNumber
    debug("diff", diff)

    if( diff < 0 )
      return "失敗"
    end

    #level = (diff / 5) + 1
    level = (diff / 5).floor + 1 # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    return "成功 レベル：#{level}"
  end

  def rollStep(diceType, diceCount)
    debug('rollStep diceType, diceCount, @calcText', diceType, diceCount, @calcText)

    stepTotal = 0
    return stepTotal unless(diceCount > 0)

    #diceぶんのステップ判定

    @calcText += "+" unless(@calcText.empty?)
    @calcText += "#{diceCount}d#{diceType}["
    debug('rollStep string', @calcText)

    diceCount.times do |i|
      dice_now, dummy = roll(1, diceType)

      if(dice_now != 1)
        @isFailed = false
      end

      dice_in =  dice_now

      while( dice_now == diceType )
        dice_now, dummy = roll(1, diceType)

        dice_in += dice_now
      end

      stepTotal += dice_in

      @calcText += ',' if( i != 0 )
      @calcText += "#{dice_in}"
    end

    @calcText += "]"

    return stepTotal
  end
end
