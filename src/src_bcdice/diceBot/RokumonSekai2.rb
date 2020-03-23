# -*- coding: utf-8 -*-

class RokumonSekai2 < DiceBot
  setPrefixes(['\d+RS'])

  def initialize
    super

    @sendMode = 2
    @sortType = 1
  end

  def gameName
    '六門世界2nd'
  end

  def gameType
    "RokumonSekai2"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定
aRSm<=t
能力値a,修正値m,目標値tで判定ロールを行います。
Rコマンド(3R6m<=t[a])に読み替えます。
成功度、評価、ボーナスダイスを自動表示します。
　例) 3RS+1<=9　3R6+1<=9[3]
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    debug('parren_killer_add begin stirng', string)

    string = string.gsub(/(\d+)RS([\+\-][\+\-\d]+)<=(\d+)/i) { "3R6#{Regexp.last_match(2)}<=#{Regexp.last_match(3)}[#{Regexp.last_match(1)}]" }
    string = string.gsub(/(\d+)RS<=(\d+)/i) { "3R6<=#{Regexp.last_match(2)}[#{Regexp.last_match(1)}]" }

    debug('parren_killer_add end stirng', string)

    return string
  end

  def dice_command_xRn(string, nick_e)
    checkRoll(string, nick_e)
  end

  def checkRoll(string, nick_e)
    output = '1'

    unless /3R6([\+\-\d]*)<=(\d+)\[(\d+)\]/i =~ string
      return output
    end

    modText = Regexp.last_match(1)
    target = Regexp.last_match(2).to_i
    abl = Regexp.last_match(3).to_i

    mod = 0
    if modText
      mod = parren_killer("(0#{modText})").to_i
    end

    dstr, suc, sum = rokumon2_roll(mod, target, abl)
    output = "#{sum}[#{dstr}] ＞ #{suc} ＞ 評価#{rokumon2_suc_rank(suc)}"

    if suc != 0
      output += "(+#{suc}d6)"
    end

    output = "#{nick_e}: (#{string}) ＞ #{output}"

    return output
  end

  def rokumon2_roll(mod, target, abl)
    suc = 0

    _, dicestr, = roll(3 + mod.abs, 6, 1)

    dice = dicestr.split(/,/).collect { |i| i.to_i }

    mod.abs.times do |_i|
      if mod < 0
        dice.shift
      else
        dice.pop
      end
    end

    cnt5 = 0
    cnt2 = 0
    sum = 0

    dice.each do |die1|
      cnt5 += 1 if die1 >= 5
      cnt2 += 1 if die1 <= 2
      suc += 1  if die1 <= abl
      sum += die1
    end

    if sum < target
      suc += 2
    elsif sum == target
      suc += 1
    end

    suc = 0 if cnt5 >= 3
    suc = 5 if cnt2 >= 3

    return dicestr, suc, sum
  end

  def rokumon2_suc_rank(suc)
    suc_rank = ['E', 'D', 'C', 'B', 'A', 'S']
    return suc_rank[suc]
  end
end
