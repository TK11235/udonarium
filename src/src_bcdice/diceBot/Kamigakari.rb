# -*- coding: utf-8 -*-

class Kamigakari < DiceBot
  setPrefixes(['RT', 'MT(\d*)'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @d66Type = 1
  end
  
  def gameName
    '神我狩'
  end
  
  def gameType
    "Kamigakari"
  end
  
  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・各種表
 ・感情表(ET)
 ・霊紋消費の代償表(RT)
 ・伝奇名字・名前決定表(NT)
 ・魔境臨界表(KT)
 ・獲得素材チャート(MTx xは［法則障害］の［強度］。省略時は１)
　　例） MT　MT3　MT9
・D66ダイスあり
INFO_MESSAGE_TEXT
  end
  
  
  def rollDiceCommand(command)
    tableName = ""
    result = ""
    
    debug("rollDiceCommand command", command)
    
	case command
      
    when "RT"
      tableName, result, number = getReimonCompensationTableResult
      
    when /^MT(\d*)$/
      rank = $1
      rank ||= 1
      rank = rank.to_i
      tableName, result, number = getGetMaterialTableResult(rank)
      
    else
      debug("rollDiceCommand commandNOT matched -> command:", command)
      return ""
	end
    
    if( result.empty? )
      return ""
    end
	
	text = "#{tableName}(#{number})：#{result}"
	return text
  end
  
  
  def getReimonCompensationTableResult
    tableName = "霊紋消費の代償表"
    
    table = [
             '邪神化：物理法則を超過しすぎた代償として、霊魂そのものが歪み、PCは即座にアラミタマへと変貌する。アラミタマ化したPCは、いずこかへと消え去る。',
             '存在消滅：アラミタマ化を最後の力で抑え込む。だがその結果、PCの霊魂は燃え尽きてしまい、この世界から消滅する。そのPCは[状態変化：死亡]となり死体も残らない。',
             '死亡：霊魂の歪みをかろうじて食い止めるが、霊魂が崩壊する。PCは[状態変化：死亡]となるが遺体は残る。',
             '霊魂半壊：霊魂の歪みを食い止めるものの、霊魂そのものに致命的な負傷を受け、全身に障害が残る。それに伴って霊紋も消滅し、一般人へと戻る。',
             '記憶消滅：奇跡的に霊魂の摩耗による身体的な悪影響を免れる。時間を置くことで霊紋も回復するが、精神的に影響を受け、すべての記憶を失ってしまう。',
             '影響なし：奇跡的に、霊魂の摩耗による悪影響を完全に退け、さらに霊紋の回復も早期を見込める。肉体や精神にも、特に影響はない。',
            ]
    result, number = get_table_by_1d6(table)
    
    return tableName, result, number
  end
  
  def getGetMaterialTableResult(rank)
    tableName = "獲得素材チャート"
    table = [
             '真紅の',
             'ざらつく',
             '紺碧の',
             '鋭い',
             '黄金の',
             '柔らかな',
             '銀色の',
             '尖った',
             '純白の',
             '硬い',
             '漆黒の',
             '輝く',
             'なめらかな',
             '濁った',
             'ふさふさの',
             '邪悪な',
             '粘つく',
             '聖なる',
             '灼熱の',
             '炎の',
             '氷結の',
             '氷の',
             '熱い',
             '風の',
             '冷たい',
             '雷の',
             '土の',
             '幻の',
             '骨状の',
             '刻印の',
             '牙状の',
             '鱗状の',
             '石状の',
             '宝石状の',
             '毛皮状の',
             '羽根状の',
            ]
    
    result, number = get_table_by_d66(table)
    result += "断片"
    
    effect, number2 = getMaterialEffect(rank)
    number = "#{number},#{number2}"
    
    price = getPrice(effect)
    
    result = "#{result}。#{effect}"
    result += "：#{price}" unless( price.nil? )
    
    return tableName, result, number
  end
  
  
  def getMaterialEffect(rank)
    number, = roll(1, 6)
    
    result = ""
    type = ""
    if( number < 6)
      result, number2 = getMaterialEffectNomal(rank)
      type = "よく見つかる素材"
    else
      result, number2 = getMaterialEffectRare()
      type = "珍しい素材"
    end
    
    result = "#{type}：#{result}"
    number = "#{number},#{number2}"
    
    return result, number
  end
  
  
  def getMaterialEffectNomal(rank)
    table = [
             [13, '体力+n'], 
             [16, '敏捷+n'], 
             [23, '知性+n'], 
             [26, '精神+n'], 
             [33, '幸運+n'], 
             [35, '物D+n'], 
             [41, '魔D+n'], 
             [43, '行動+n'], 
             [46, '生命+n×3'], 
             [53, '装甲+n'], 
             [56, '結界+n'], 
             [63, '移動+nマス'], 
             [66, '※PCの任意'],
            ]
    
    isSwap = false
    number = bcdice.getD66(isSwap)
    
    result = get_table_by_number(number, table)
    debug("getMaterialEffectNomal result", result)
    
    if( /\+n/ === result )
      power, number2 = getMaterialEffectPower(rank)
      
      result = result.sub(/\+n/, "+#{power}") #TKfix !
      number = "#{number},#{number2}"
    end
    
    return result, number
  end
  
  def getMaterialEffectPower(rank)
    table = [
             [  4, [1, 1, 1, 2, 2, 3]],
             [  8, [1, 1, 2, 2, 3, 3]],
             [  9, [1, 2, 3, 3, 4, 5]],
            ]
    
    rank = 9 if( rank > 9 )
    rankTable = get_table_by_number(rank, table)
    power, number = get_table_by_1d6(rankTable)
    
    return power, number
  end
  
  def getMaterialEffectRare()
    table = [[3, '**付与'],
             [5, '**半減'],
             [6, '※GMの任意'],
            ]
    
    number, = roll(1, 6)
    result = get_table_by_number(number, table)
    debug('getMaterialEffectRare result', result)
    
    if( /\*\*/ === result )
      attribute, number2 = getAttribute()
      result = result.sub(/\*\*/, "#{attribute}") #TKfix !
      number = "#{number},#{number2}"
    end
      
    return result, number
  end
  
  def getAttribute()
    table = [
             [21, '［火炎］'],
             [33, '［冷気］'],
             [43, '［電撃］'],
             [53, '［風圧］'],
             [56, '［幻覚］'],
             [62, '［魔毒］'],
             [64, '［磁力］'],
             [66, '［閃光］'],
            ]
    
    isSwap = false
    number = bcdice.getD66(isSwap)
    
    result = get_table_by_number(number, table)
    
    return result, number
  end
  
  
  def getPrice(effect)
    
    power = 0
    
    case effect
    when /\+(\d+)/
      power = $1.to_i
    when /付与/
      power = 3
    when /半減/
      power = 4
    else
      power = 0
    end
    
    table = [nil,
             '500G(効果値:1)', 
             '1000G(効果値:2)', 
             '1500G(効果値:3)', 
             '2000G(効果値:4)', 
             '3000G(効果値:5)', 
            ]
    price = table[power]
    
    return price
  end
  
end
