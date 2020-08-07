# -*- coding: utf-8 -*-
# frozen_string_literal: true

class TorgEternity < DiceBot
  # ゲームシステムの識別子
  ID = 'TorgEternity'
  # ゲームシステム名
  NAME = 'TORG Eternity'
  # ゲームシステム名の読みがな
  SORT_KEY = 'とおくえたあにてい'
  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定
　・TG
　　"TG[m]"で1d20をロールします。[]内は省略可能。
　　mは技能基本値を入れて下さい。Rコマンドに読替されます。
　　振り足しを自動で行い、20の出目が出たときには技能無し値も並記します。
　　(TORGダイスボットと同じ挙動をするコマンドです。ロールボーナスの読み替えのみ、Eternity版となります)
　・TE
　　"TE"で1d20をロールします。
　　振り足しを自動で行い、20の出目が出たときには技能無し値も並記します。
　　出目1の時には「Mishap!　自動失敗！」と出力されます。
　・UP
　　"UP"で高揚状態のロール(通常の1d20に加え、1d20を追加で振り足し)を行います。
　　各ロールでの振り足しを自動で行い、20の出目が出たときには技能無し値も並記します。
　　一投目で出目1の時には「Mishap!　自動失敗！」と出力され、二投目は行われません。
　・POS
　　"POSm"で、ポシビリティ使用による1d20のロールを行います。
　　mはポシビリティを使用する前のロール結果を入れて下さい。
　　出目が10未満の場合は、10への読み替えが行われます。
　　また、振り足しを自動で行い、20の出目が出たときには技能無し値も並記します。
・ボーナスダメージロール
　"xBD[+y]"でロールします。[]内は省略可能。
　xはダメージダイス数。yはダメージ基本値 or 式を入れて下さい。
　xは1以上が必要です。0だとエラーが出力されます。マイナス値はコマンドとして認識されません。
　振り足し処理は自動で行われます。(振り足し発生時の目は、「5∞」と出力されます)
・各種表
　"(表コマンド)(数値)"で振ります。
　・成功レベル表「RTx or RESULTx」
　・ダメージ結果表「DTx or DAMAGEx」
　・ロールボーナス表「BTx+y or BONUSx+y or TOTALx+y」 xは数値, yは技能基本値
INFO_MESSAGE_TEXT
  setPrefixes(['(TE.*|UP.*|POS.*|\d+BD.*|TG.*|RT.*|Result.*|DT.*|damage.*|BT.*|bonus.*|total.*)'])
  def initialize
    super
    @sendMode = 2
  end

  def rollDiceCommand(command)
    # get～DiceCommandResultという名前のメソッドを集めて実行、
    # 結果がnil以外の場合それを返して終了。
    return analyzeDiceCommandResultMethod(command)
  end

  ####################            TORG 1.x            ########################
  def changeText(string)
    string = string.gsub(/TG(\d+)/i) { "1R20+#{Regexp.last_match(1)}" }
    string = string.gsub(/TG/i, '1R20')
    return string
  end

  def dice_command_xRn(string, nick_e)
    return torg_check(string, nick_e)
  end

  def torg_check(string, nick_e)
    m = /(^|\s)S?(1R20(([+-]\d+)*))(\s|$)/i.match(string)
    unless m
      return nil
    end

    string = m[2]
    mod = m[3]

    debug(mod)
    mod = parren_killer("(0#{mod})").to_i if mod
    debug(mod)
    mod = mod.to_i
    skilled, unskilled, dice_str, = torg_eternity_dice(false, false)
    sk_bonus = get_torg_eternity_bonus(skilled)
    if mod
      if mod > 0
        output = "#{sk_bonus}[#{dice_str}]+#{mod}"
      else
        output = "#{sk_bonus}[#{dice_str}]#{mod}"
      end
    else
      output = "#{sk_bonus}[#{dice_str}]"
    end
    output += " ＞ " + (sk_bonus + mod).to_s
    if skilled != unskilled
      output += "(技能無" + (get_torg_eternity_bonus(unskilled) + mod).to_s + ")"
    end
    output = "#{nick_e}: (#{string}) ＞ #{output}"
    return output
  end

  ####################          TORG Eternity        ########################
  # ロールコマンド (通常ロール)
  def getRolld20DiceCommandResult(command)
    debug("Torg Eternity Dice Roll Command ? ", command)
    m = /(^|\s)(S)?(TE)/i.match(command)
    unless m
      return nil
    end

    secret = !m[2].nil?
    skilled, unskilled, dice_str, mishap = torg_eternity_dice(false, true)
    if mishap == 1
      output = "d20ロール（通常） ＞ 1d20[#{dice_str}] ＞ Mishap!　絶対失敗！"
    else
      value_skilled = format("%+d", get_torg_eternity_bonus(skilled))
      if skilled != unskilled
        value_unskilled = format("%+d", get_torg_eternity_bonus(unskilled))
        output = "d20ロール（通常） ＞ 1d20[#{dice_str}] ＞ #{value_skilled}[#{skilled}]（技能有） / #{value_unskilled}[#{unskilled}]（技能無）"
      else
        output = "d20ロール（通常） ＞ 1d20[#{dice_str}] ＞ #{value_skilled}[#{skilled}]"
      end
    end
    debug(output, secret)
    return output, secret
  end

  # ロールコマンド (高揚ロール)
  def getUpRollDiceCommandResult(command)
    debug("Torg Eternity Dice Roll ( UP ) Command ? ", command)
    m = /(^|\s)(S)?(UP)/i.match(command)
    unless m
      return nil
    end

    secret = !m[2].nil?
    skilled1, unskilled1, dice_str1, mishap = torg_eternity_dice(false, true)
    if mishap == 1
      output = "d20ロール（高揚） ＞ 1d20[#{dice_str1}] ＞ Mishap!　絶対失敗！"
    else
      skilled2, unskilled2, dice_str2, = torg_eternity_dice(false, false)
      subtotal_skilled = skilled1 + skilled2
      subtotal_unskilled = unskilled1 + unskilled2
      value_skilled = format("%+d", get_torg_eternity_bonus(subtotal_skilled))
      if subtotal_skilled != subtotal_unskilled
        value_unskilled = format("%+d", get_torg_eternity_bonus(subtotal_unskilled))
        output = "d20ロール（高揚） ＞ 1d20[#{dice_str1}] + 1d20[#{dice_str2}] ＞ #{value_skilled}[#{subtotal_skilled}]（技能有） / #{value_unskilled}[#{subtotal_unskilled}]（技能無）"
      else
        output = "d20ロール（高揚） ＞ 1d20[#{dice_str1}] + 1d20[#{dice_str2}] ＞ #{value_skilled}[#{subtotal_skilled}]"
      end
    end
    debug(output, secret)
    return output, secret
  end

  # ロールコマンド (ポシビリティロール)
  def getPossibilityRollDiceCommandResult(command)
    debug("Torg Eternity Possibility Roll Command ? ", command)
    m = /(^|\s)(S)?(POS)((\d+)(\+\d+)?)/i.match(command)
    unless m
      return nil
    end

    secret = !m[2].nil?
    output_modifier = parren_killer("(0#{m[4]})").to_i
    skilled, unskilled, dice_str, = torg_eternity_dice(true, false)
    subtotal_skilled = skilled + output_modifier
    subtotal_unskilled = unskilled + output_modifier
    value_skilled = format("%+d", get_torg_eternity_bonus(subtotal_skilled))
    if subtotal_skilled != subtotal_unskilled
      value_unskilled = format("%+d", get_torg_eternity_bonus(subtotal_unskilled))
      output = "d20ロール（ポシビリティ） ＞ #{output_modifier}+1d20[#{dice_str}] ＞ #{value_skilled}[#{subtotal_skilled}]（技能有） / #{value_unskilled}[#{subtotal_unskilled}]（技能無）"
    else
      output = "d20ロール（ポシビリティ） ＞ #{output_modifier}+1d20[#{dice_str}] ＞ #{value_skilled}[#{subtotal_skilled}]"
    end
    debug(output, secret)
    return output, secret
  end

  # ダメージボーナスコマンド
  def getBonusDamageDiceCommandResult(command)
    debug("TorgEternity Bonus Damage Roll Command ? ", command)
    m = /(\d+)(BD)(([\+\-]\d+)*)/i.match(command)
    unless m
      return nil
    end

    number_bonus_die = m[1].to_i
    value_modifier, output_modifier = get_torg_eternity_modifier(m[3])
    if number_bonus_die <= 0
      output = "エラーです。xBD (x≧1) として下さい"
    else
      value_roll, output_roll = get_torg_eternity_damage_bonus_dice(number_bonus_die)
      output_value = value_roll + value_modifier
      output = "ボーナスダメージロール(#{number_bonus_die}BD#{output_modifier}) ＞ #{value_roll}[#{output_roll}]#{output_modifier} ＞ #{output_value}ダメージ"
    end
    return output
  end

  # 成功レベル表コマンド
  def getSuccessLevelDiceCommandResult(command)
    debug("TorgEternity Success Level Table Command ? ", command)
    m = /(RT|Result)(\-*\d+([\+\-]\d+)*)/i.match(command)
    unless m
      return nil
    end

    value = parren_killer("(0#{m[2]})").to_i
    debug(value)
    if value < 0
      output = "Failure."
    else
      output = get_torg_eternity_success_level(value)
    end
    output = "成功レベル表[#{value}] ＞ #{output}"
    debug(output)
    return output
  end

  # ダメージ結果表コマンド
  def getDamageResultDiceCommandResult(command)
    debug("TorgEternity Damage Result Table Command ? ", command)
    m = /(DT|Damage)(\-*\d+([\+\-]\d+)*)/i.match(command)
    unless m
      return nil
    end

    value = parren_killer("(0#{m[2]})").to_i
    debug(value)
    output = get_torg_eternity_damage_result(value)
    output = "ダメージ結果表[#{value}] ＞ #{output}"
    debug(output)
    return output
  end

  # ロールボーナス表コマンド
  def getRollBonusDiceCommandResult(command)
    debug("TorgEternity Roll Bonus Table Command ? ", command)
    m = /(BT|Bonus)(\d+)(([\+\-]\d+)*)/i.match(command)
    unless m
      return nil
    end

    value_roll = m[2].to_i
    output_bonus = get_torg_eternity_bonus(value_roll)
    debug(output_bonus)
    value_modifier, output_modifier = get_torg_eternity_modifier(m[3])
    if value_roll <= 1
      output = "ロールボーナス表[#{value_roll}] ＞ Mishap!!"
    elsif output_modifier.empty?
      output = "ロールボーナス表[#{value_roll}] ＞ #{output_bonus}"
    else
      value_result = output_bonus.to_i + value_modifier
      debug(value_result)
      output = "ロールボーナス表[#{value_roll}]#{output_modifier} ＞ #{output_bonus}[#{value_roll}]#{output_modifier} ＞ #{value_result}"
    end
    debug(output)
    return output
  end

  def get_torg_eternity_table_result(value, table)
    output = nil
    table.each do |item|
      item_index = item[0]
      if item_index > value
        break
      end

      output = item[1]
    end
    return output
  end

  # 修正式計算サブルーチン
  def get_torg_eternity_modifier(string_modifier)
    debug("modifier check : #{string_modifier}")
    if string_modifier == ''
      value_modifier = 0
      output_modifier = ""
    else
      value_modifier = parren_killer("(0#{string_modifier})").to_i
      output_modifier = format("%+d", value_modifier)
    end
    debug(value_modifier)
    debug(output_modifier)
    return value_modifier, output_modifier
  end

  # d20ロールサブルーチン
  def torg_eternity_dice(check_pos, check_mishap)
    isSkilledCritical = true
    isCritical = true
    skilled = 0
    unskilled = 0
    mishap = 0
    dice_str = ""
    while isSkilledCritical
      dice_str += "," unless dice_str.empty?
      dummy = roll(1, 20, 0)
      dice_n = dummy.shift
      if check_pos
        if dice_n < 10
          dice_str_now = "#{dice_n}→10"
          dice_n = 10
          isSkilledCritical = false
        else
          dice_str_now = dice_n.to_s
        end
        dice_str += dice_str_now
      else
        dice_str += dice_n.to_s
      end
      skilled += dice_n
      unskilled += dice_n if isCritical
      if dice_n == 20
        isCritical = false
      elsif dice_n != 10
        isSkilledCritical = false
        isCritical = false
        if check_mishap & (dice_n == 1)
          mishap = 1
        end
      end
      check_pos = false
      check_mishap = false
    end
    return skilled, unskilled, dice_str, mishap
  end

  # ボーナスダイスロールサブルーチン
  def get_torg_eternity_damage_bonus_dice(number)
    debug("bonus dice roll : #{number}")
    value_roll = 0
    output_roll = ""
    if number > 0
      value_roll = 0
      output_roll = ""
      while number > 0
        output_roll = "#{output_roll}," unless output_roll.empty?
        dice_value, dice_text = roll(1, 6)
        if dice_value == 6
          dice_value = 5
          dice_text = "5∞"
          number += 1
        end
        value_roll += dice_value
        output_roll = "#{output_roll}#{dice_text}"
        debug(value_roll)
        debug(output_roll)
        number -= 1
      end
    else
      output_roll = "0"
    end
    debug(value_roll)
    debug(output_roll)
    return value_roll, output_roll
  end

  # 成功レベル表
  def get_torg_eternity_success_level(value)
    success_table = [
      [0, "Success - Standard."],
      [5, "Success - Good!"],
      [10, "Success - Outstanding!!"]
    ]
    return get_torg_eternity_table_result(value, success_table)
  end

  # ダメージチャート
  def get_torg_eternity_damage_result(value)
    damage_table = [
      [-50, "ノーダメージ"],
      [-5, "1ショック"],
      [0, "2ショック"],
      [5, "1レベル負傷 + 2ショック"],
      [10, "2レベル負傷 + 4ショック"],
      [15, "3レベル負傷 + 6ショック"],
      [20, "4レベル負傷 + 8ショック"],
      [25, "5レベル負傷 + 10ショック"],
      [30, "6レベル負傷 + 12ショック"],
      [35, "7レベル負傷 + 14ショック"],
      [40, "8レベル負傷 + 16ショック"],
      [45, "9レベル負傷 + 18ショック"],
      [50, "10レベル負傷 + 20ショック"]
    ]
    return get_torg_eternity_table_result(value, damage_table)
  end

  def get_torg_eternity_bonus(value)
    bonus_table = [
      [1, -10],
      [2, -8],
      [3, -6],
      [5, -4],
      [7, -2],
      [9, -1],
      [11, 0],
      [13, 1],
      [15, 2],
      [16, 3],
      [17, 4],
      [18, 5],
      [19, 6],
      [20, 7]
    ]
    bonus = get_torg_eternity_table_result(value, bonus_table)
    if value > 20
      over_value_bonus = ((value - 21) / 5).to_i + 1
      bonus += over_value_bonus
    end
    return bonus
  end
end
