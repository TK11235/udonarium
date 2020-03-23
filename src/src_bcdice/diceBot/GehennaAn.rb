# -*- coding: utf-8 -*-

class GehennaAn < DiceBot
  setPrefixes(['(\d+G\d+|\d+GA\d+)'])

  def initialize
    super
    @sendMode = 3
    @sortType = 3
  end

  def gameName
    'ゲヘナ・アナスタシス'
  end

  def gameType
    "GehennaAn"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
戦闘判定と通常判定に対応。幸運の助け、連撃増加値(戦闘判定)、闘技チット(戦闘判定)を自動表示します。
・戦闘判定　(nGAt+m)
　ダイス数n、目標値t、修正値mで戦闘判定を行います。
　幸運の助け、連撃増加値、闘技チットを自動処理します。
・通常判定　(nGt+m)
　ダイス数n、目標値t、修正値mで通常判定を行います。
　幸運の助けを自動処理します。(連撃増加値、闘技チットを表示抑制します)
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/(\d+)GA(\d+)([\+\-][\+\-\d]+)/) { "#{Regexp.last_match(1)}R6#{Regexp.last_match(3)}>=#{Regexp.last_match(2)}[1]" }
    string = string.gsub(/(\d+)GA(\d+)/) { "#{Regexp.last_match(1)}R6>=#{Regexp.last_match(2)}[1]" }
    string = string.gsub(/(\d+)G(\d+)([\+\-][\+\-\d]+)/) { "#{Regexp.last_match(1)}R6#{Regexp.last_match(3)}>=#{Regexp.last_match(2)}[0]" }
    string = string.gsub(/(\d+)G(\d+)/) { "#{Regexp.last_match(1)}R6>=#{Regexp.last_match(2)}[0]" }
  end

  def dice_command_xRn(string, nick_e)
    return checkGehenaAn(string, nick_e)
  end

  def checkGehenaAn(string, nick_e)
    output = '1'

    return output unless /(^|\s)S?((\d+)[rR]6([\+\-\d]+)?([>=]+(\d+))(\[(\d)\]))(\s|$)/i =~ string

    string = Regexp.last_match(2)
    diceCount = Regexp.last_match(3).to_i
    modText = Regexp.last_match(4)
    diff = Regexp.last_match(6).to_i
    mode = Regexp.last_match(8).to_i

    mod = parren_killer("(0#{modText})").to_i

    diceValue, diceText, = roll(diceCount, 6, (sortType & 1))

    diceArray = diceText.split(/,/).collect { |i| i.to_i }

    dice_1st = ""
    isLuck = true
    diceValue = 0

    # 幸運の助けチェック
    diceArray.each do |i|
      if dice_1st != ""
        if (dice_1st != i) || (i < diff)
          isLuck = false
        end
      else
        dice_1st = i
      end

      diceValue += 1 if i >= diff
    end

    diceValue *= 2 if isLuck && (diceCount > 1)

    output = "#{diceValue}[#{diceText}]"
    success = diceValue + mod
    success = 0 if success < 0

    failed = diceCount - diceValue
    failed = 0 if failed < 0

    if mod > 0
      output += "+#{mod}"
    elsif mod < 0
      output += mod.to_s
    end

    if /[^\d\[\]]+/ =~ output
      output = "#{nick_e}: (#{string}) ＞ #{output} ＞ 成功#{success}、失敗#{failed}"
    else
      output = "#{nick_e}: (#{string}) ＞ #{output}"
    end

    # 連撃増加値と闘技チット
    output += getAnastasisBonusText(mode, success)

    return output
  end

  def getAnastasisBonusText(mode, success)
    return '' if mode == 0

    ma_bonus = ((success - 1) / 2).to_i
    ma_bonus = 7 if ma_bonus > 7

    bonus_str = ''
    bonus_str += "連撃[+#{ma_bonus}]/" if ma_bonus > 0
    bonus_str += "闘技[#{getTougiBonus(success)}]"
    return " ＞ #{bonus_str}"
  end

  def getTougiBonus(success)
    table = [
      [ 6, '1'],
      [13, '2'],
      [18, '3'],
      [22, '4'],
      [99, '5'],
    ]

    return get_table_by_number(success, table)
  end
end
