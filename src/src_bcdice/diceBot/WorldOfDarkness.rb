# -*- coding: utf-8 -*-

class WorldOfDarkness < DiceBot
  setPrefixes(['\d+st.*'])

  def initialize
    super
    @successDice = 0
    @botchDice = 0
    @rerollDice = 0
  end

  def gameName
    'ワールドオブダークネス'
  end

  def gameType
    "WorldOfDarkness"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定コマンド(xSTn+y or xSTSn+y)
　(ダイス個数)ST(難易度)+(自動成功)
　(ダイス個数)STS(難易度)+(自動成功)　※出目10で振り足し

　難易度=省略時6
　自動成功=省略時0

　例）3ST7　5ST+1　4ST5+2
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    result = rollWorldOfDarkness(command)
    return result unless result.empty?
  end

  def rollWorldOfDarkness(string)
    diceCount = 1
    difficulty = 6
    automaticSuccess = 0

    output = ''
    rerollNumber = 11

    if /STS/ =~ string
      string = string.gsub(/(\d+)STS(\d*)([^\d\s][\+\-\d]+)/i) { "#{$1}STS#{$2}[#{$3}]" }
      string = string.gsub(/(\d+)STS(\d*)/i) { "#{$1}STS#{$2}" } unless $3
      rerollNumber = 10
      else
        string = string.gsub(/(\d+)ST(\d*)([^\d\s][\+\-\d]+)/i) { "#{$1}ST#{$2}[#{$3}]" }
        string = string.gsub(/(\d+)ST(\d*)/i) { "#{$1}ST#{$2}" } unless $3
    end

    diceCount = $1.to_i if $1
    difficulty = $2.to_i if $2
    difficulty = 6 if difficulty < 2
    automaticSuccess = $3.to_i if $3

    output = 'DicePool=' + diceCount.to_s + ', Difficulty=' + difficulty.to_s + ', AutomaticSuccess=' + automaticSuccess.to_s

    @successDice = 0
    @botchDice = 0
    @rerollDice = 0

    output += rollDiceWorldOfDarknessSpecial(diceCount, difficulty, rerollNumber)
    while @rerollDice > 0 do
      diceCount = @rerollDice
      @rerollDice = 0
      output += rollDiceWorldOfDarknessSpecial(diceCount, difficulty, rerollNumber)
    end

    @successDice += automaticSuccess
    if @successDice > 0
      output += " ＞ 成功数" + @successDice.to_s
    else
      if @botchDice > 0
        output += " ＞ 大失敗"
      else
        output += " ＞ 失敗"
      end
    end

    return output
  end

  def rollDiceWorldOfDarknessSpecial(diceCount, difficulty, rerollNumber)
    diceType = 10
    diceResults = Array.new(diceCount)

    diceCount.times do |i|
      dice_now, = roll(1, diceType)

      case dice_now
      when rerollNumber..12 then
        @successDice += 1
        @rerollDice += 1
      when difficulty..11 then
        @successDice += 1
      when 1 then
        @successDice -= 1
        @botchDice += 1
      end

      diceResults[i] = dice_now
    end

    diceResults.sort!

    result = " ＞ "
    diceResults.each do |diceResult|
      result += diceResult.to_s + ','
    end

    result = result.chop

    return result
  end
end
