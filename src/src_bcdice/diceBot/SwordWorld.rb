# -*- coding: utf-8 -*-

class SwordWorld < DiceBot
  setPrefixes(['K\d+.*'])

  def initialize
    rating_table = 0
    super()
    @rating_table = rating_table
  end

  def gameName
    'ソードワールド'
  end

  def gameType
    "SwordWorld"
  end

  def getHelpMessage
    '・SW　レーティング表　　　　　(Kx[c]+m$f) (x:キー, c:クリティカル値, m:ボーナス, f:出目修正)'
  end

  def changeText(string)
    return string unless /(^|\s)[sS]?(K[\d]+)/i =~ string

    debug('parren_killer_add before string', string)
    string = string.gsub(/\[(\d+)\]/i) { "c[#{Regexp.last_match(1)}]" }
    string = string.gsub(/\@(\d+)/i) { "c[#{Regexp.last_match(1)}]" }
    string = string.gsub(/\$([\+\-]?[\d]+)/i) { "m[#{Regexp.last_match(1)}]" }
    string = string.gsub(/r([\+\-]?[\d]+)/i) { "r[#{Regexp.last_match(1)}]" }
    debug('parren_killer_add after string', string)

    return string
  end

  def getRatingCommandStrings
    "cmCM"
  end

  def check_2D6(totalValue, dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(2D6)
    if dice_n >= 12
      return " ＞ 自動的成功"
    end

    if dice_n <= 2
      return " ＞ 自動的失敗"
    end

    return '' if signOfInequality != ">="
    return '' if diff == "?"

    if totalValue >= diff
      return " ＞ 成功"
    end

    return " ＞ 失敗"
  end

  def rollDiceCommand(command)
    rating(command)
  end

  ####################        SWレーティング表       ########################
  def rating(string) # レーティング表
    debug("rating string", string)

    commands = getRatingCommandStrings

    unless /(^|\s)[sS]?(((k|K)[\d\+\-]+)([#{commands}]\[([\d\+\-]+)\])*([\d\+\-]*)([cmrCMR]\[([\d\+\-]+)\]|gf|GF)*)($|\s)/ =~ string
      debug("not matched")
      return '1'
    end

    string = Regexp.last_match(2)

    rateUp, string = getRateUpFromString(string)
    crit, string = getCriticalFromString(string)
    firstDiceChanteTo, firstDiceChangeModify, string = getDiceChangesFromString(string)

    key, addValue = getKeyAndAddValueFromString(string)

    return '1' unless key =~ /([\d]+)/

    key = Regexp.last_match(1).to_i

    # 2.0対応
    rate_sw2_0 = getSW2_0_RatingTable

    keyMax = rate_sw2_0.length - 1
    debug("keyMax", keyMax)
    if key > keyMax
      return "キーナンバーは#{keyMax}までです"
    end

    newRates = getNewRates(rate_sw2_0)

    output = "KeyNo.#{key}"

    output += "c[#{crit}]" if crit < 13
    output += "m[#{firstDiceChangeModify}]" if firstDiceChangeModify != 0
    output += "m[#{firstDiceChanteTo}]" if  firstDiceChanteTo != 0
    output += "r[#{rateUp}]" if rateUp != 0

    output, values = getAdditionalString(string, output)

    debug('output', output)

    if addValue != 0
      output += "+#{addValue}" if addValue > 0
      output += addValue.to_s if addValue < 0
    end

    output += " ＞ "

    diceResultTotals = []
    diceResults = []
    rateResults = []
    dice = 0
    diceOnlyTotal = 0
    totalValue = 0
    round = 0

    loop do
      dice_raw, diceText = rollDice(values)
      dice = dice_raw

      if  firstDiceChanteTo != 0
        dice = dice_raw = firstDiceChanteTo
        firstDiceChanteTo = 0
      elsif  firstDiceChangeModify != 0
        dice += firstDiceChangeModify.to_i
        firstDiceChangeModify = 0
      end

      # 出目がピンゾロの時にはそこで終了
      if dice_raw <= 2
        diceResultTotals << dice_raw.to_s
        diceResults << diceText.to_s
        rateResults << "**"

        round += 1
        break
      end

      dice += getAdditionalDiceValue(dice, values)

      dice = 2 if dice < 2
      dice = 12 if dice > 12

      currentKey = [key + round * rateUp, keyMax].min
      debug("currentKey", currentKey)
      rateValue = newRates[dice][currentKey]
      debug("rateValue", rateValue)

      totalValue += rateValue
      diceOnlyTotal += dice

      diceResultTotals << dice.to_s
      diceResults << diceText.to_s
      rateResults << (dice > 2 ? rateValue : "**")

      round += 1

      break unless dice >= crit
    end

    limitLength = $SEND_STR_MAX - output.length
    output += getResultText(totalValue, addValue, diceResults, diceResultTotals,
                            rateResults, diceOnlyTotal, round, crit, limitLength)

    return output
  end

  def getAdditionalString(_string, output)
    values = {}
    return output, values
  end

  def getAdditionalDiceValue(_dice, _values)
    0
  end

  def getCriticalFromString(string)
    crit = 10

    regexp = /c\[(\d+)\]/i

    if regexp =~ string
      crit = Regexp.last_match(1).to_i
      crit = 3 if crit < 3 # エラートラップ(クリティカル値が3未満なら3とする)
      string = string.gsub(regexp, '')
    end

    return crit, string
  end

  def getDiceChangesFromString(string)
    firstDiceChanteTo = 0
    firstDiceChangeModify = 0

    regexp = /m\[([\d\+\-]+)\]/i

    if  regexp =~ string
      firstDiceChangeModify = Regexp.last_match(1)

      unless /[\+\-]/ =~ firstDiceChangeModify
        firstDiceChanteTo = firstDiceChangeModify.to_i
        firstDiceChangeModify = 0
      end

      string = string.gsub(regexp, '')
    end

    return firstDiceChanteTo, firstDiceChangeModify, string
  end

  def getRateUpFromString(string)
    rateUp = 0
    return rateUp, string
  end

  def getKeyAndAddValueFromString(string)
    key = nil
    addValue = 0

    if /K(\d+)([\d\+\-]*)/i =~ string # ボーナスの抽出
      key = Regexp.last_match(1)
      if Regexp.last_match(2)
        addValue = parren_killer("(" + Regexp.last_match(2) + ")").to_i
      end
    else
      key = string
    end

    return key, addValue
  end

  def getSW2_0_RatingTable
    rate_sw2_0 = [
      # 0
      '*,0,0,0,1,2,2,3,3,4,4',
      '*,0,0,0,1,2,3,3,3,4,4',
      '*,0,0,0,1,2,3,4,4,4,4',
      '*,0,0,1,1,2,3,4,4,4,5',
      '*,0,0,1,2,2,3,4,4,5,5',
      '*,0,1,1,2,2,3,4,5,5,5',
      '*,0,1,1,2,3,3,4,5,5,5',
      '*,0,1,1,2,3,4,4,5,5,6',
      '*,0,1,2,2,3,4,4,5,6,6',
      '*,0,1,2,3,3,4,4,5,6,7',
      '*,1,1,2,3,3,4,5,5,6,7',
      # 11
      '*,1,2,2,3,3,4,5,6,6,7',
      '*,1,2,2,3,4,4,5,6,6,7',
      '*,1,2,3,3,4,4,5,6,7,7',
      '*,1,2,3,4,4,4,5,6,7,8',
      '*,1,2,3,4,4,5,5,6,7,8',
      '*,1,2,3,4,4,5,6,7,7,8',
      '*,1,2,3,4,5,5,6,7,7,8',
      '*,1,2,3,4,5,6,6,7,7,8',
      '*,1,2,3,4,5,6,7,7,8,9',
      '*,1,2,3,4,5,6,7,8,9,10',
      # 21
      '*,1,2,3,4,6,6,7,8,9,10',
      '*,1,2,3,5,6,6,7,8,9,10',
      '*,2,2,3,5,6,7,7,8,9,10',
      '*,2,3,4,5,6,7,7,8,9,10',
      '*,2,3,4,5,6,7,8,8,9,10',
      '*,2,3,4,5,6,8,8,9,9,10',
      '*,2,3,4,6,6,8,8,9,9,10',
      '*,2,3,4,6,6,8,9,9,10,10',
      '*,2,3,4,6,7,8,9,9,10,10',
      '*,2,4,4,6,7,8,9,10,10,10',
      # 31
      '*,2,4,5,6,7,8,9,10,10,11',
      '*,3,4,5,6,7,8,10,10,10,11',
      '*,3,4,5,6,8,8,10,10,10,11',
      '*,3,4,5,6,8,9,10,10,11,11',
      '*,3,4,5,7,8,9,10,10,11,12',
      '*,3,5,5,7,8,9,10,11,11,12',
      '*,3,5,6,7,8,9,10,11,12,12',
      '*,3,5,6,7,8,10,10,11,12,13',
      '*,4,5,6,7,8,10,11,11,12,13',
      '*,4,5,6,7,9,10,11,11,12,13',
      # 41
      '*,4,6,6,7,9,10,11,12,12,13',
      '*,4,6,7,7,9,10,11,12,13,13',
      '*,4,6,7,8,9,10,11,12,13,14',
      '*,4,6,7,8,10,10,11,12,13,14',
      '*,4,6,7,9,10,10,11,12,13,14',
      '*,4,6,7,9,10,10,12,13,13,14',
      '*,4,6,7,9,10,11,12,13,13,15',
      '*,4,6,7,9,10,12,12,13,13,15',
      '*,4,6,7,10,10,12,12,13,14,15',
      '*,4,6,8,10,10,12,12,13,15,15',
      # 51
      '*,5,7,8,10,10,12,12,13,15,15',
      '*,5,7,8,10,11,12,12,13,15,15',
      '*,5,7,9,10,11,12,12,14,15,15',
      '*,5,7,9,10,11,12,13,14,15,16',
      '*,5,7,10,10,11,12,13,14,16,16',
      '*,5,8,10,10,11,12,13,15,16,16',
      '*,5,8,10,11,11,12,13,15,16,17',
      '*,5,8,10,11,12,12,13,15,16,17',
      '*,5,9,10,11,12,12,14,15,16,17',
      '*,5,9,10,11,12,13,14,15,16,18',
      # 61
      '*,5,9,10,11,12,13,14,16,17,18',
      '*,5,9,10,11,13,13,14,16,17,18',
      '*,5,9,10,11,13,13,15,17,17,18',
      '*,5,9,10,11,13,14,15,17,17,18',
      '*,5,9,10,12,13,14,15,17,18,18',
      '*,5,9,10,12,13,15,15,17,18,19',
      '*,5,9,10,12,13,15,16,17,19,19',
      '*,5,9,10,12,14,15,16,17,19,19',
      '*,5,9,10,12,14,16,16,17,19,19',
      '*,5,9,10,12,14,16,17,18,19,19',
      # 71
      '*,5,9,10,13,14,16,17,18,19,20',
      '*,5,9,10,13,15,16,17,18,19,20',
      '*,5,9,10,13,15,16,17,19,20,21',
      '*,6,9,10,13,15,16,18,19,20,21',
      '*,6,9,10,13,16,16,18,19,20,21',
      '*,6,9,10,13,16,17,18,19,20,21',
      '*,6,9,10,13,16,17,18,20,21,22',
      '*,6,9,10,13,16,17,19,20,22,23',
      '*,6,9,10,13,16,18,19,20,22,23',
      '*,6,9,10,13,16,18,20,21,22,23',
      # 81
      '*,6,9,10,13,17,18,20,21,22,23',
      '*,6,9,10,14,17,18,20,21,22,24',
      '*,6,9,11,14,17,18,20,21,23,24',
      '*,6,9,11,14,17,19,20,21,23,24',
      '*,6,9,11,14,17,19,21,22,23,24',
      '*,7,10,11,14,17,19,21,22,23,25',
      '*,7,10,12,14,17,19,21,22,24,25',
      '*,7,10,12,14,18,19,21,22,24,25',
      '*,7,10,12,15,18,19,21,22,24,26',
      '*,7,10,12,15,18,19,21,23,25,26',
      # 91
      '*,7,11,13,15,18,19,21,23,25,26',
      '*,7,11,13,15,18,20,21,23,25,27',
      '*,8,11,13,15,18,20,22,23,25,27',
      '*,8,11,13,16,18,20,22,23,25,28',
      '*,8,11,14,16,18,20,22,23,26,28',
      '*,8,11,14,16,19,20,22,23,26,28',
      '*,8,12,14,16,19,20,22,24,26,28',
      '*,8,12,15,16,19,20,22,24,27,28',
      '*,8,12,15,17,19,20,22,24,27,29',
      '*,8,12,15,18,19,20,22,24,27,30',
    ]

    return rate_sw2_0
  end

  def getNewRates(rate_sw2_0)
    rate_3 = []
    rate_4 = []
    rate_5 = []
    rate_6 = []
    rate_7 = []
    rate_8 = []
    rate_9 = []
    rate_10 = []
    rate_11 = []
    rate_12 = []
    zeroArray = []

    rate_sw2_0.each do |rateText|
      rate_arr = rateText.split(/,/)
      zeroArray.push(0)
      rate_3.push(rate_arr[1].to_i)
      rate_4.push(rate_arr[2].to_i)
      rate_5.push(rate_arr[3].to_i)
      rate_6.push(rate_arr[4].to_i)
      rate_7.push(rate_arr[5].to_i)
      rate_8.push(rate_arr[6].to_i)
      rate_9.push(rate_arr[7].to_i)
      rate_10.push(rate_arr[8].to_i)
      rate_11.push(rate_arr[9].to_i)
      rate_12.push(rate_arr[10].to_i)
    end

    if @rating_table == 1
      # 完全版準拠に差し替え
      rate_12[31] = rate_12[32] = rate_12[33] = 10
    end

    newRates = [zeroArray, zeroArray, zeroArray, rate_3, rate_4, rate_5, rate_6, rate_7, rate_8, rate_9, rate_10, rate_11, rate_12]

    return newRates
  end

  def rollDice(_values)
    dice, diceText = roll(2, 6)
    return dice, diceText
  end

  def getResultText(totalValue, addValue, diceResults, diceResultTotals,
                    rateResults, diceOnlyTotal, round, _crit, limitLength)
    output = ""

    totalText = (totalValue + addValue).to_s

    if sendMode > 1 # 表示モード２以上
      output += "2D:[#{diceResults.join(' ')}]=#{diceResultTotals.join(',')}"
      rateResultsText = rateResults.join(',')
      output += " ＞ #{rateResultsText}" unless rateResultsText == totalText
    elsif sendMode > 0 # 表示モード１以上
      output += "2D:#{diceResultTotals.join(',')}"
    else # 表示モード０
      output += totalValue.to_s
    end

    if diceOnlyTotal <= 2
      return "#{output} ＞ 自動的失敗"
    end

    addText = getAddText(addValue)
    output += "#{addText} ＞ "

    roundText = ""
    if round > 1
      roundText += "#{round - 1}回転 ＞ "
    end

    output += "#{roundText}#{totalText}"

    if output.length > limitLength # 回りすぎて文字列オーバーしたときの救済
      output = "... ＞ #{roundText}#{totalText}"
    end

    return output
  end

  def getAddText(addValue)
    addText = ""

    return addText if addValue == 0

    operator = (addValue > 0 ? "+" : "")
    addText += "#{operator}#{addValue}"

    return addText
  end

  def setRatingTable(tnick)
    mode_str = ""
    pre_mode = @rating_table

    if /(\d+)/ =~ tnick
      @rating_table = Regexp.last_match(1).to_i
      if @rating_table > 1
        mode_str = "2.0-mode"
        @rating_table = 2
      elsif @rating_table > 0
        mode_str = "new-mode"
        @rating_table = 1
      else
        mode_str = "old-mode"
        @rating_table = 0
      end
    else
      case tnick
      when /old/i
        @rating_table = 0
        mode_str = "old-mode"
      when /new/i
        @rating_table = 1
        mode_str = "new-mode"
      when /2\.0/i
        @rating_table = 2
        mode_str = "2.0-mode"
      end
    end

    return '1' if @rating_table == pre_mode

    return "RatingTableを#{mode_str}に変更しました"
  end
end
