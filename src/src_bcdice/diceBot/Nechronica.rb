# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Nechronica < DiceBot
  # ゲームシステムの識別子
  ID = 'Nechronica'

  # ゲームシステム名
  NAME = 'ネクロニカ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ねくろにか'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定　(nNC+m)
　ダイス数n、修正値mで判定ロールを行います。
　ダイス数が2以上の時のパーツ破損数も表示します。
・攻撃判定　(nNA+m)
　ダイス数n、修正値mで攻撃判定ロールを行います。
　命中部位とダイス数が2以上の時のパーツ破損数も表示します。
INFO_MESSAGE_TEXT

  setPrefixes(['(\d+NC|\d+NA)'])

  def initialize
    super
    @sendMode = 2
    @sortType = 3
    @defaultSuccessTarget = "6" # 目標値が空欄の時の目標値
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

  def check_nD10(total, _dice_total, dice_list, cmp_op, target) # ゲーム別成功度判定(nD10)
    return '' unless cmp_op == :>=

    if total >= 11
      " ＞ 大成功"
    elsif total >= target
      " ＞ 成功"
    elsif dice_list.count { |i| i <= 1 } == 0
      " ＞ 失敗"
    elsif dice_list.size > 1
      " ＞ 大失敗 ＞ 使用パーツ全損"
    else
      " ＞ 大失敗"
    end
  end

  def nechronica_check(string)
    output = '1'

    debug("nechronica_check string", string)

    unless /(^|\s)S?((\d+)[rR]10([\+\-\d]+)?(\[(\d+)\])?)(\s|$)/i =~ string
      debug("nechronica_check unmuched")
      return output
    end

    string = Regexp.last_match(2)

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

    _, dice_str, _n1, _cnt_max, n_max = roll(dice_n, 10, 1)

    total_n = n_max + mod

    output = "#{@nick_e}: (#{string}) ＞ [#{dice_str}]"
    if mod < 0
      output += mod.to_s
    elsif mod > 0
      output += "+#{mod}"
    end

    dice = dice_str.split(',').map(&:to_i)
    dice.map! { |i| i + mod }

    dice_str = dice.join(",")
    output += "  ＞ #{total_n}[#{dice_str}]"

    output += check_nD10(total_n, dice_n, dice, :>=, diff)

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
