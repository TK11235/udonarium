# -*- coding: utf-8 -*-
# frozen_string_literal: true

class TunnelsAndTrolls < DiceBot
  # ゲームシステムの識別子
  ID = 'TunnelsAndTrolls'

  # ゲームシステム名
  NAME = 'トンネルズ＆トロールズ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'とんねるすあんととろおるす'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・行為判定　(nD6+x>=nLV)
失敗、成功、自動失敗の自動判定とゾロ目の振り足し経験値の自動計算を行います。
SAVEの難易度を「レベル」で表記することが出来ます。
例えば「2Lv」と書くと「25」に置換されます。
判定時以外は悪意ダメージを表示します。
バーサークとハイパーバーサーク用に専用コマンドが使えます。
例）2D6+1>=1Lv
　 (2D6+1>=20) ＞ 7[2,5]+1 ＞ 8 ＞ 失敗
　判定時にはゾロ目を自動で振り足します。

・バーサークとハイパーバーサーク　(nBS+x or nHBS+x)
　"(ダイス数)BS(修正値)"でバーサーク、"(ダイス数)HBS(修正値)"でハイパーバーサークでロールできます。
　最初のダイスの読替は、個別の出目はそのままで表示。
　下から２番目の出目をずらした分だけ合計にマイナス修正を追加して表示します。
INFO_MESSAGE_TEXT

  setPrefixes(['(\d+H?BS)'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @sameDiceRerollCount = 1
  end

  def changeText(string)
    debug('TunnelsAndTrolls parren_killer begin string', string)

    if /(\d+)LV/i =~ string
      level_diff = Regexp.last_match(1).to_i * 5 + 15
      string = string.sub(/(\d+)LV/i) { level_diff.to_s }
    end

    if /BS/i =~ string
      string = string.gsub(/(\d+)HBS([^\d\s][\+\-\d]+)/i) { "#{Regexp.last_match(1)}R6#{Regexp.last_match(2)}[H]" }
      string = string.gsub(/(\d+)HBS/i) { "#{Regexp.last_match(1)}R6[H]" }
      string = string.gsub(/(\d+)BS([^\d\s][\+\-\d]+)/i) { "#{Regexp.last_match(1)}R6#{Regexp.last_match(2)}" }
      string = string.gsub(/(\d+)BS/i) { "#{Regexp.last_match(1)}R6" }
    end

    return string
  end

  def dice_command_xRn(string, nick_e)
    return tandt_berserk(string, nick_e)
  end

  def check_2D6(total, dice_total, _dice_list, cmp_op, target)
    return '' unless cmp_op == :>=

    if dice_total == 3
      return " ＞ 自動失敗"
    elsif target == "?"
      return getMaxSuccessLevel(total, dice_total)
    elsif total >= target
      experiencePoint = getExperiencePoint(target, dice_total)
      return " ＞ 成功 ＞ 経験値#{experiencePoint}"
    else
      return " ＞ 失敗"
    end
  end

  def getMaxSuccessLevel(total_n, dice_n)
    sucLv = 1

    while total_n >= (sucLv * 5 + 15)
      sucLv += 1
    end

    sucLv -= 1

    if sucLv <= 0
      return " ＞ 失敗 ＞ 経験値#{dice_n}"
    end

    return " ＞ #{sucLv}Lv成功 ＞ 経験値#{dice_n}"
  end

  def getDiceRolledAdditionalText(n1, n_max, dice_max)
    debug("getDiceRolledAdditionalText n1, n_max, dice_max", n1, n_max, dice_max)
    if (n_max > 0) && (dice_max == 6)
      return " ＞ 悪意#{n_max}"
    end

    return ''
  end

  def getExperiencePoint(diff, dice_n)
    debug("diff", diff)
    debug("dice_n", dice_n)

    experiencePoint = (1.0 * (diff - 15) / 5 * dice_n)

    if int?(experiencePoint)
      experiencePoint = experiencePoint.to_i
    else
      experiencePoint = format("%.1f", experiencePoint)
    end

    debug("experiencePoint", experiencePoint)

    return experiencePoint
  end

  def int?(v)
    return (v == v.to_i)
  end

  ####################   Tunnels and Trolls Berserk  ########################
  def tandt_berserk(string, nick_e)
    debug('tandt_berserk string', string)

    output = "1"

    return output unless (m = /(^|\s)S?((\d+)[rR]6([\+\-\d]*)(\[(\w+)\])?)(\s|$)/i.match(string))

    debug('tandt_berserk matched')

    string = m[2]
    dice_c = m[3].to_i
    bonus = 0
    bonus = parren_killer("(0#{m[4]})").to_i if m[4]
    isHyperBerserk = false
    isHyperBerserk = true if m[5] && (m[6] =~ /[Hh]/)
    dice_arr = []
    dice_now = 0
    dice_str = ""
    isFirstLoop = true
    n_max = 0
    total_n = 0
    bonus2 = 0

    debug('isHyperBerserk', isHyperBerserk)

    # ２回目以降
    dice_arr.push(dice_c)

    loop do
      debug('loop dice_arr', dice_arr)
      dice_wk = dice_arr.shift

      debug('roll dice_wk d6', dice_wk)
      rollTotal, rollDiceResultText, roll_cnt1, rollDiceMaxCount, roll_n_max, roll_cnt_suc, roll_cnt_re = roll(dice_wk, 6, (sortType & 1))

      debug('rollTotal, rollDiceResultText, roll_cnt1, rollDiceMaxCount, roll_n_max, roll_cnt_suc, roll_cnt_re',
            rollTotal, rollDiceResultText, roll_cnt1, rollDiceMaxCount, roll_n_max, roll_cnt_suc, roll_cnt_re)

      if dice_wk >= 2 # ダイスが二個以上

        dice_num = rollDiceResultText.split(/,/).collect { |i| i.to_i }
        debug('dice_num', dice_num)

        diceType = 6

        dice_face = []
        diceType.times do |_i|
          dice_face.push(0)
        end

        dice_num.each do |dice_o|
          dice_face[dice_o - 1] += 1
        end

        dice_face.each do |dice_o|
          if dice_o >= 2
            dice_o += 1 if isHyperBerserk
            dice_arr.push(dice_o)
          end
        end

        if isFirstLoop && dice_arr.empty?
          min1 = 0
          min2 = 0

          diceType.times do |i|
            index = diceType - i - 1
            debug('diceType index', index)
            if dice_face[index] > 0
              min2 = min1
              min1 = index
            end
          end

          debug("min1, min2", min1, min2)
          bonus2 = -(min2 - min1)
          rollDiceMaxCount -= 1 if min2 == 5

          if isHyperBerserk
            dice_arr.push(3)
          else
            dice_arr.push(2)
          end
        end
      end

      dice_now += rollTotal
      dice_str += "][" if dice_str != ""
      dice_str += rollDiceResultText
      n_max += rollDiceMaxCount
      isFirstLoop = false

      debug('loop last chek dice_arr', dice_arr)

      break if dice_arr.empty?
    end

    debug('loop breaked')

    debug('dice_now, bonus, bonus2', dice_now, bonus, bonus2)
    total_n = dice_now + bonus + bonus2

    dice_str = "[#{dice_str}]"
    output = "#{dice_now}#{dice_str}"

    if bonus2 < 0
      debug('bonus2', bonus2)
      output += bonus2.to_s
    end

    debug('bonus', bonus)
    if bonus > 0
      output += "+#{bonus}"
    elsif bonus < 0
      output += bonus.to_s
    end

    if sendMode > 0
      if output =~ /[^\d\[\]]+/
        output = "#{nick_e}: (#{string}) ＞ #{output} ＞ #{total_n}"
      else
        output = "#{nick_e}: (#{string}) ＞ #{total_n}"
      end
    else
      output = "#{nick_e}: (#{string}) ＞ #{total_n}"
    end

    output += " ＞ 悪意#{n_max}" if n_max > 0

    return output
  end
end
