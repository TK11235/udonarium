# -*- coding: utf-8 -*-

class Nechronica < DiceBot
  setPrefixes(['(\d+NC|\d+NA)'])

  def initialize
    super
    @sendMode = 2
    @sortType = 3
    @defaultSuccessTarget = "6" # 目標値が空欄の時の目標値
  end

  def gameName
    'ネクロニカ'
  end

  def gameType
    "Nechronica"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定　(nNC+m)
　ダイス数n、修正値mで判定ロールを行います。
　ダイス数が2以上の時のパーツ破損数も表示します。
・攻撃判定　(nNA+m)
　ダイス数n、修正値mで攻撃判定ロールを行います。
　命中部位とダイス数が2以上の時のパーツ破損数も表示します。
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/(\d+)NC(10)?([\+\-][\+\-\d]+)/i) { "#{Regexp.last_match(1)}R10#{Regexp.last_match(3)}[0]" }
    string = string.gsub(/(\d+)NC(10)?/i) { "#{Regexp.last_match(1)}R10[0]" }
    string = string.gsub(/(\d+)NA(10)?([\+\-][\+\-\d]+)/i) { "#{Regexp.last_match(1)}R10#{Regexp.last_match(3)}[1]" }
    string = string.gsub(/(\d+)NA(10)?/i) { "#{Regexp.last_match(1)}R10[1]" }

    return string
  end

  def dice_command_xRn(string, nick_e)
    @nick_e = nick_e
    return nechronica_check(string)
  end

  def check_nD10(total_n, _dice_n, signOfInequality, diff, dice_cnt, _dice_max, n1, _n_max) # ゲーム別成功度判定(nD10)
    return '' unless signOfInequality == ">="

    if total_n >= 11
      return " ＞ 大成功"
    end

    if total_n >= diff
      return " ＞ 成功"
    end

    # 失敗パターン

    if n1 <= 0
      return " ＞ 失敗"
    end

    result = " ＞ 大失敗"
    if dice_cnt > 1
      result += " ＞ 使用パーツ全損"
    end

    return result
  end

  def nechronica_check(string)
    output = '1'

    debug("nechronica_check string", string)

    unless /(^|\s)S?((\d+)[rR]10([\+\-\d]+)?(\[(\d+)\])?)(\s|$)/i =~ string
      debug("nechronica_check unmuched")
      return output
    end

    string = Regexp.last_match(2)
    signOfInequality = ">="

    dice_n = 1
    dice_n = Regexp.last_match(3).to_i if Regexp.last_match(3)

    battleMode = Regexp.last_match(6).to_i

    modText = Regexp.last_match(4)
    mod = parren_killer("(0#{modText})").to_i

    # 0=判定モード, 1=戦闘モード
    isBattleMode = (battleMode == 1)
    debug("nechronica_check string", string)
    debug("isBattleMode", isBattleMode)

    diff = 6
    total_n = 0

    _, dice_str, n1, cnt_max, n_max = roll(dice_n, 10, 1)

    total_n = n_max + mod

    output = "#{@nick_e}: (#{string}) ＞ [#{dice_str}]"
    if mod < 0
      output += mod.to_s
    elsif mod > 0
      output += "+#{mod}"
    end

    n1 = 0
    cnt_max = 0

    dice = dice_str.split(/,/).collect { |i| i.to_i }
    dice.length.times do |i|
      dice[i] += mod
      n1 += 1 if dice[i] <= 1
      cnt_max += 1 if dice[i] >= 10
    end

    dice_str = dice.join(",")
    output += "  ＞ #{total_n}[#{dice_str}]"

    diceMax = 10
    output += check_suc(total_n, n_max, signOfInequality, diff, dice_n, diceMax, n1, n_max)

    debug("dice_n, n1, total_n diff", dice_n, n1, total_n, diff)

    # β版の実装
    #    if( (dice_n > 1) and (n1 >= 1) and (total_n <= diff) )
    #      output += " ＞ 損傷#{n1}"
    #    end

    if isBattleMode
      hit_loc = getHitLocation(total_n)
      if hit_loc != '1'
        output += " ＞ #{hit_loc}"
      end
    end

    return output
  end

  def getHitLocation(dice)
    output = '1'

    debug("getHitLocation dice", dice)
    return output if dice <= 5

    output = ''
    table = [
      '防御側任意',
      '脚（なければ攻撃側任意）',
      '胴（なければ攻撃側任意）',
      '腕（なければ攻撃側任意）',
      '頭（なければ攻撃側任意）',
      '攻撃側任意',
    ]
    index = dice - 6

    addDamage = ""
    if dice > 10
      index = 5
      addDamage = "(追加ダメージ#{dice - 10})"
    end

    output = table[index] + addDamage

    return output
  end
end
