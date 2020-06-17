# -*- coding: utf-8 -*-
# frozen_string_literal: true

require "utils/normalize"

class ArsMagica < DiceBot
  # ゲームシステムの識別子
  ID = 'ArsMagica'

  # ゲームシステム名
  NAME = 'アルスマギカ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'あるすまきか'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・ストレスダイス　(ArSx+y)
　"ArS(ボッチダイス)+(修正)"です。判定にも使えます。Rコマンド(1R10+y[m])に読替をします。
　ボッチダイスと修正は省略可能です。(ボッチダイスを省略すると1として扱います)
　botchダイスの0の数が2以上の時は、数えて表示します。
　（注意！） botchの判断が発生したときには、そのダイスを含めてロールした全てのダイスを[]の中に並べて表示します。
　例) (1R10[5]) ＞ 0[0,1,8,0,8,1] ＞ Botch!
　　最初の0が判断基準で、その右側5つがボッチダイスです。1*2,8*2,0*1なので1botchという訳です。
INFO_MESSAGE_TEXT

  setPrefixes(['ArS'])

  def initialize
    super
    @sendMode = 2
  end

  def changeText(string)
    return string unless /ArS/i =~ string

    string = string.gsub(/ArS(\d+)([^\d\s][\+\-\d]+)/i) { "1R10#{Regexp.last_match(2)}[#{Regexp.last_match(1)}]" }
    string = string.gsub(/ArS([^\d\s][\+\-\d]+)/i) { "1R10#{Regexp.last_match(1)}" }
    string = string.gsub(/ArS(\d+)/i) { "1R10[#{Regexp.last_match(1)}]" }
    string = string.gsub(/ArS/i) { "1R10" }

    return string
  end

  def dice_command_xRn(string, nick_e)
    arsmagica_stress(string, nick_e)
  end

  def arsmagica_stress(string, _nick_e)
    return "1" unless (m = /(^|\s)S?(1[rR]10([\+\-\d]*)(\[(\d+)\])?(([>=]+)(\d+))?)(\s|$)/i.match(string))

    diff = 0
    botch = 1
    bonus = 0
    crit_mul = 1
    total = 0
    cmp_op = nil
    bonusText = m[3]
    botch = m[5].to_i if m[4]

    if m[6]
      cmp_op = Normalize.comparison_operator(m[7])
      diff = m[8].to_i
    end

    bonus = parren_killer("(0#{bonusText})").to_i unless bonusText.empty?

    die = rand(10)
    output = "(#{m[2]}) ＞ "

    if die == 0 # botch?
      count0 = 0
      dice_n = []

      botch.times do |_i|
        botch_die = rand(10)
        count0 += 1 if botch_die == 0
        dice_n.push(botch_die)
      end

      dice_n = dice_n.sort if sortType != 0

      output += "0[#{die},#{dice_n.join(',')}]"

      if count0 != 0
        bonus = 0

        if count0 > 1
          output += " ＞ #{count0}Botch!"
        else
          output += " ＞ Botch!"
        end

        # Botchの時には目標値を使った判定はしない
        cmp_op = nil
      else
        if bonus > 0
          output += "+#{bonus} ＞ #{bonus}"
        elsif bonus < 0
          output += "#{bonus} ＞ #{bonus}"
        else
          output += " ＞ 0"
        end
        total = bonus
      end
    elsif die == 1 # Crit
      crit_dice = ""
      while die == 1
        crit_mul *= 2
        die = rand(10) + 1
        crit_dice += "#{die},"
      end
      total = die * crit_mul
      crit_dice = crit_dice.sub(/,$/, '')
      output += total.to_s
      if sendMode != 0
        output += "[1,#{crit_dice}]"
      end
      total += bonus
      if bonus > 0
        output += "+#{bonus} ＞ #{total}"
      elsif bonus < 0
        output += "#{bonus} ＞ #{total}"
      end
    else
      total = die + bonus
      if bonus > 0
        output += "#{die}+#{bonus} ＞ #{total}"
      elsif bonus < 0
        output += "#{die}#{bonus} ＞ #{total}"
      else
        output += total.to_s
      end
    end

    if cmp_op == :>=
      output += (total >= diff ? " ＞ 成功" : " ＞ 失敗")
    end

    return ": #{output}"
  end
end
