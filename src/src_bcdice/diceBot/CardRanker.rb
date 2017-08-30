# -*- coding: utf-8 -*-

class CardRanker < DiceBot
  def initialize
    super
    @sendMode = 2;
    @sortType = 1;
    @d66Type = 2;
  end
  def gameName
    'カードランカー'
  end
  
  def gameType
    "CardRanker"
  end
  
  def prefixs
     ['RM', 'CM.*']
  end
  
  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
ランダムでモンスターカードを選ぶ (RM)
特定のモンスターカードを選ぶ (CMxy　x：色、y：番号）
　白：W、青：U、緑：V、金：G、赤：R、黒：B
　例）CMW1→白の2：白竜　CMG12→金の12：土精霊
場所表 (ST)
街中場所表 (CST)
郊外場所表 (OST)
学園場所表 (SST)
運命表 (DT)
大会運命表 (TDT)
学園運命表 (GDT)
崩壊運命表 (CDT)
INFO_MESSAGE_TEXT
  end
  
  
  # ゲーム別成功度判定(2D6)
  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return '' unless( signOfInequality == ">=")
    
    if(dice_n <= 2)
      return " ＞ ファンブル";
    elsif(dice_n >= 12)
      return " ＞ スペシャル ＞ " + getRandumMonster();
    elsif(total_n >= diff)
      return " ＞ 成功";
    else
      return " ＞ 失敗";
    end
  end
  
  
  def rollDiceCommand(command)
    command = command.upcase
    
    case command
    when /^RM$/i
      return getRandumMonster
    when /^CM(\w)(\d+)$/i
      color = $1.upcase
      index = $2.to_i
      return getMonster(color, index)
    end
    
    return nil
  end
  
  
  def getRandumMonster
    type = "ランダムモンスター選択";
    colorTable = getColorTable
    color, colorIndex = get_table_by_1d6(colorTable)
    
    monsters = getMonsterTables(colorIndex - 1)
    monsterName, monsterIndex = get_table_by_2d6(monsters)
    
    output = "#{type}(#{colorIndex},#{monsterIndex}) ＞ #{color}の#{monsterIndex}：#{monsterName}"
    return output
  end
  
  def getColorTable
    ['白', '青', '緑', '金', '赤', '黒']
  end
  
  def getMonsterTables(colorIndex)
    tables = [
     %w{白竜 僧侶 格闘家 斧使い 剣士 槍士 歩兵 弓兵 砲兵 天使 軍神},
     %w{水竜 魚 魚人 イカ 蟹 探偵 海賊 魔術師 使い魔 雲 水精霊},
     %w{緑竜 ワーム 鳥人 鳥 獣 獣人 エルフ 妖精 昆虫 植物 森精霊},
     %w{金竜 宝石 岩石 鋼 錬金術師 魔法生物 ドワーフ 機械 運命 女神 土精霊},
     %w{火竜 竜人 恐竜 戦車 蛮族 小鬼 大鬼 巨人 雷 炎 火精霊},
     %w{黒竜 闇騎士 怪物 忍者 妖怪 蝙蝠 吸血鬼 不死者 幽霊 悪魔 邪神},
     ]
    
    return tables[colorIndex]
  end
  
  def getMonster(color, monsterIndex)
    
    return nil if( monsterIndex < 2 )
    
    type = "モンスター選択";
    
    colorWords = ['W', 'U', 'V', 'G', 'R', 'B']
    colorIndex = colorWords.index(color)
    debug("colorIndex")
    
    return nil if( colorIndex.nil? )
    
    colorTable = getColorTable
    color = colorTable[colorIndex]
    
    monsters = getMonsterTables(colorIndex)
    debug("monsters", monsters)
    debug("monsterIndex", monsterIndex)
    monsterName = monsters[monsterIndex - 2]
    
    return nil if( monsterName.nil? )
    
    output = "#{type} ＞ #{color}の#{monsterIndex}：#{monsterName}"
    return output
  end
  
end
