# -*- coding: utf-8 -*-

class Torg < DiceBot
  setPrefixes(['(TG.*|RT.*|Result.*|IT.*|Initimidate.*|TT.*|Taunt.*|Trick.*|CT.*|MT.*|Maneuver.*|ODT.*|ords.*|odamage.*|DT.*|damage.*|BT.*|bonus.*|total.*)'])

  def initialize
    super
    @sendMode = 2
  end

  def gameName
    'トーグ'
  end

  def gameType
    "TORG"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定　(TGm)
　TORG専用の判定コマンドです。
　"TG(技能基本値)"でロールします。Rコマンドに読替されます。
　振り足しを自動で行い、20の出目が出たときには技能無し値も並記します。
・各種表　"(表コマンド)(数値)"で振ります。
　・一般結果表 成功度出力「RTx or RESULTx」
　・威圧/威嚇 対人行為結果表「ITx or INTIMIDATEx or TESTx」
　・挑発/トリック 対人行為結果表「TTx or TAUNTx or TRICKx or CTx」
　・間合い 対人行為結果表「MTx or MANEUVERx」
　・オーズ（一般人）ダメージ　「ODTx or ORDSx or ODAMAGEx」
　・ポシビリティー能力者ダメージ「DTx or DAMAGEx」
　・ボーナス表「BTx+y or BONUSx+y or TOTALx+y」 xは数値, yは技能基本値
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/Result/i, 'RT')
    string = string.gsub(/(Intimidate|Test)/i, 'IT')
    string = string.gsub(/(Taunt|Trick|CT)/i, 'TT')
    string = string.gsub(/Maneuver/i, 'MT')
    string = string.gsub(/(ords|odamage)/i, 'ODT')
    string = string.gsub(/damage/i, 'DT')
    string = string.gsub(/(bonus|total)/i, 'BT')
    string = string.gsub(/TG(\d+)/i) {"1R20+#{$1}"}
    string = string.gsub(/TG/i, '1R20')

    return string
  end

  def dice_command_xRn(string, nick_e)
    return torg_check(string, nick_e)
  end

####################              TORG             ########################
  def torg_check(string, nick_e)
    output = '1'

    unless( /(^|\s)S?(1R20([+-]\d+)*)(\s|$)/i =~ string )
      return '1'
    end

    string = $2
    mod = $3

    debug(mod)
    mod = parren_killer("(0#{mod})").to_i if( mod )
    debug(mod)
    mod = mod.to_i

    skilled, unskilled, dice_str = torg_dice
    sk_bonus = get_torg_bonus(skilled)

    if( mod )
        if(mod > 0)
          output = "#{sk_bonus}[#{dice_str}]+#{mod}"
        else
          output = "#{sk_bonus}[#{dice_str}]#{mod}"
        end
    else
      output = "#{sk_bonus}[#{dice_str}]"
    end

    output += " ＞ " + (sk_bonus + mod).to_s

    if(skilled != unskilled)
      output += "(技能無" + (get_torg_bonus(unskilled) + mod).to_s + ")"
    end

    output = "#{nick_e}: (#{string}) ＞ #{output}"

    return output
  end

  def torg_dice
    isSkilledCritical = true
    isCritical = true
    skilled = 0
    unskilled = 0
    dice_str = ""

    while( isSkilledCritical )
      dummy = roll(1, 20, 0)
      dice_n = dummy.shift
      skilled += dice_n
      unskilled += dice_n if(isCritical)

      dice_str += "," unless(dice_str.empty?)
      dice_str += "#{dice_n}"

      if(dice_n == 20)
        isCritical = false
      elsif(dice_n != 10)
        isSkilledCritical = false
        isCritical = false
      end
    end

    return skilled, unskilled, dice_str
  end

  def rollDiceCommand(command)
    string = command.upcase

    output = '1'
    ttype = ""
    value = 0

    return '1' unless(/([RITMDB]T)(\d+([\+\-]\d+)*)/i =~ string)

    type = $1
    num = $2

    case type
    when 'RT'
      value = parren_killer("(0#{num})").to_i
      output = get_torg_success_level(value)
      ttype = '一般結果'
    when 'IT'
      value = parren_killer("(0#{num})").to_i
      output = get_torg_interaction_result_intimidate_test(value)
      ttype = '威圧/威嚇'
    when 'TT'
      value = parren_killer("(0#{num})").to_i
      output = get_torg_interaction_result_taunt_trick(value)
      ttype = '挑発/トリック'
    when 'MT'
      value = parren_killer("(0#{num})").to_i
      output = get_torg_interaction_result_maneuver(value)
      ttype= '間合い'
    when 'DT'
      value = parren_killer("(0#{num})").to_i
      if(string =~ /ODT/i)
        output = get_torg_damage_ords(value)
        ttype = 'オーズダメージ'
      else
        output = get_torg_damage_posibility(value)
        ttype = 'ポシビリティ能力者ダメージ'
      end
    when 'BT'
      output, value = get_torg_bonus_text(num)
      ttype = 'ボーナス'
    end

    if(ttype != '')
      output = "#{ttype}表[#{value}] ＞ #{output}"
    end

    return output
  end

# 一般結果表 成功度
  def get_torg_success_level(value)
    success_table = [
        [0, "ぎりぎり"],
        [1, "ふつう"],
        [3, "まあよい"],
        [7, "かなりよい"],
        [12, "すごい" ]]

    return get_torg_table_result( value, success_table )
  end

# 対人行為結果表
# 威圧／威嚇(intimidate/Test)
  def get_torg_interaction_result_intimidate_test(value)

    interaction_results_table = [
        [0, "技能なし"],
        [5, "萎縮"],
        [10, "逆転負け"],
        [15, "モラル崩壊"],
        [17, "プレイヤーズコール" ]]

    return get_torg_table_result( value, interaction_results_table )
  end

# 挑発／トリック(Taunt/Trick)
  def get_torg_interaction_result_taunt_trick(value)
    interaction_results_table = [
        [0, "技能なし"],
        [5, "萎縮"],
        [10, "逆転負け"],
        [15, "高揚／逆転負け"],
        [17, "プレイヤーズコール" ]]

    return get_torg_table_result( value, interaction_results_table )
  end

# 間合い(maneuver)
  def get_torg_interaction_result_maneuver(value)
    interaction_results_table = [
        [0, "技能なし"],
        [5, "疲労"],
        [10, "萎縮／疲労"],
        [15, "逆転負け／疲労"],
        [17, "プレイヤーズコール" ]]

    return get_torg_table_result( value, interaction_results_table )
  end

  def get_torg_table_result(value, table)
    output = '1'

    table.each do |item|
      item_index = item[0]

      if( item_index > value )
        break
      end

      output = item[1]
    end

    return output
  end

# オーズダメージチャート
  def get_torg_damage_ords(value)
    damage_table_ords = [
        [0, "1"],
        [1, "O1"],
        [2, "K1"],
        [3, "O2"],
        [4, "O3"],
        [5, "K3"],
        [6, "転倒 K／O4"],
        [7, "転倒 K／O5"],
        [8, "1レベル負傷  K／O7"],
        [9, "1レベル負傷  K／O9"],
        [10, "1レベル負傷  K／O10"],
        [11, "2レベル負傷  K／O11"],
        [12, "2レベル負傷  KO12"],
        [13, "3レベル負傷  KO13"],
        [14, "3レベル負傷  KO14"],
        [15, "4レベル負傷  KO15"]]

    return get_torg_damage(value,
                           4,
                           "レベル負傷  KO15",
                           damage_table_ords)
  end

  # ポシビリティー能力者ダメージチャート
  def get_torg_damage_posibility(value)
    damage_table_posibility = [
        [0, "1"],
        [1, "1"],
        [2, "O1"],
        [3, "K2"],
        [4, "2"],
        [5, "O2"],
        [6, "転倒 O2"],
        [7, "転倒 K2"],
        [8, "転倒 K2"],
        [9, "1レベル負傷  K3"],
        [10, "1レベル負傷  K4"],
        [11, "1レベル負傷  O4"],
        [12, "1レベル負傷  K5"],
        [13, "2レベル負傷  O4"],
        [14, "2レベル負傷  KO5"],
        [15, "3レベル負傷  KO5"]]

    return get_torg_damage(value,
                           3,
                           "レベル負傷  KO5",
                           damage_table_posibility)
  end

  def get_torg_damage(value, maxDamage, maxDamageString, damage_table)
    if( value < 0 )
        return '1'
    end

    table_max_value = damage_table.length - 1

    if( value <= table_max_value )
        return get_torg_table_result( value, damage_table )
    end

    over_kill_damage = ((value - table_max_value) / 2).to_i
    return "" + (over_kill_damage + maxDamage).to_s + maxDamageString
  end

  def get_torg_bonus_text(num)
    val_arr = num.split(/\+/)
    value = val_arr.shift.to_i

    mod = parren_killer("(0#{ val_arr.join('+') })").to_i
    resultValue = get_torg_bonus(value)

    debug('TORG BT resultValue', resultValue)
    debug('TORG BT mod', mod)

    if(mod == 0)
      output = "#{resultValue}"
    else
      output = getTorgBonusOutputTextWhenModDefined(value, resultValue, mod)
      value = "#{value}+#{mod}"
    end

    return output, value
  end

  def getTorgBonusOutputTextWhenModDefined(value, resultValue, mod)
    debug('getTorgBonusOutputTextWhenModDefined value, mod', value, mod)
    if(mod > 0)
      output = "#{resultValue}[#{value}]+#{mod} ＞ #{resultValue + mod}"
    else
      debug('resultValue', resultValue)
      debug('mod', mod)
      output = "#{resultValue}[#{value}]#{mod} ＞ #{resultValue + mod}"
    end
  end

  def get_torg_bonus(value)
    bonus_table = [
                   [1, -12],
                   [2, -10],
                   [3, -8],
                   [5, -5],
                   [7, -2],
                   [9, -1],
                   [11, 0],
                   [13, 1],
                   [15, 2],
                   [16, 3],
                   [17, 4],
                   [18, 5],
                   [19, 6],
                   [20, 7]]

    bonus = get_torg_table_result( value, bonus_table )

    if( value > 20 )
      over_value_bonus = ((value - 21) / 5).to_i + 1
      bonus += over_value_bonus
    end

    return bonus
  end
end
