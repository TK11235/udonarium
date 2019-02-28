# -*- coding: utf-8 -*-

require 'diceBot/Torg'

class Torg1_5 < Torg
  setPrefixes(Torg.prefixes)
  
  def gameName
    'トーグ1.5版'
  end
  
  def gameType
    "TORG1.5"
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
        [0, "萎縮"],
        [5, "技能なし"],
        [10, "逆転負け"],
        [15, "モラル崩壊"],
        [17, "プレイヤーズコール" ]]
    
    return get_torg_table_result( value, interaction_results_table )
  end
  
  
  # 挑発／トリック(Taunt/Trick)
  def get_torg_interaction_result_taunt_trick(value)
    interaction_results_table = [
        [0, "萎縮"],
        [5, "技能なし"],
        [10, "逆転負け"],
        [15, "高揚／逆転負け"],
        [17, "プレイヤーズコール" ]]
    
    return get_torg_table_result( value, interaction_results_table )
  end
  
  
  # 間合い(maneuver)
  def get_torg_interaction_result_maneuver(value)
    interaction_results_table = [
        [0, "疲労"],
        [5, "萎縮"],
        [10, "技能なし"],
        [15, "逆転負け／疲労"],
        [17, "プレイヤーズコール" ]]
    
    return get_torg_table_result( value, interaction_results_table )
  end
  
  
  # オーズダメージチャート
  def get_torg_damage_ords(value)
    damage_table_ords = [
        [0, "1"],
        [1, "O1"],
        [2, "K1"],
        [3, "O2"],
        [4, "K2"],
        [5, "転倒 O3"],
        [6, "転倒 K3"],
        [7, "転倒 K／O4"],
        [8, "1レベル負傷  KO4"],
        [9, "1レベル負傷  K／O5"],
        [10, "1レベル負傷  KO5"],
        [11, "2レベル負傷  K／O6"],
        [12, "2レベル負傷  KO6"],
        [13, "3レベル負傷  K／O7"],
        [14, "3レベル負傷  KO7"],
        [15, "4レベル負傷  KO8"]]

    return get_torg_damage(value, 4, 8, damage_table_ords)
  end
  
  
  # ポシビリティー能力者ダメージチャート
  def get_torg_damage_posibility(value)
    damage_table_posibility = [
        [0, "1"],
        [1, "1"],
        [2, "O1"],
        [3, "K1"],
        [4, "2"],
        [5, "O2"],
        [6, "転倒 K2"],
        [7, "転倒 O3"],
        [8, "転倒 K3"],
        [9, "転倒 K／O3"],
        [10, "1レベル負傷  K／O4"],
        [11, "1レベル負傷  K／O4"],
        [12, "1レベル負傷  KO4"],
        [13, "2レベル負傷  K／O5"],
        [14, "2レベル負傷  KO5"],
        [15, "3レベル負傷  KO5"]]
        
    return get_torg_damage(value, 3, 5, damage_table_posibility)
  end
  
  
  def get_torg_damage(value, max_damage, max_shock, damage_table)
    
    if( value < 0 )
      return '1'
    end
    
    table_max_value = damage_table.length - 1
    
    if( value <= table_max_value )
      return get_torg_table_result( value, damage_table )
    end
    
    over_kill_value = ((value - table_max_value) / 2).to_i
    over_kill_damage = max_damage + over_kill_value * 1
    over_kill_shock = max_shock + over_kill_value * 1
    
    return "#{over_kill_damage}レベル負傷  KO#{over_kill_shock}"
  end
end
