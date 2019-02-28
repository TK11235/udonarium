# -*- coding: utf-8 -*-

class MetalHeadExtream < DiceBot
  setPrefixes([
    '[AS]R\d+.*',
    '(HU|BK|WA|SC|BG|IN|PT|HT|TA|AC|HE|TR|VT|BO|CS|TH|AM|GD|HC|BI|BT|AI)HIT\d*',
    'SUV[A-Z]\d+', '[HTALMEBPD]DMG[LMHO]',
    'CRT\d*', '[GSME]AC\d*', '[ASL]MA\d*(\+\d+)?',
    'SEC', 'NAC', 'LDC', '[W]ENC\d*'
  ])

  def initialize
    super
  end

  def gameName
    'メタルヘッドエクストリーム'
  end

  def gameType
    "MetalHeadExtream"
  end

  def getHelpMessage
    return <<MESSAGETEXT
◆判定：ARn or SRn[*/a][@b][Ac][Ld][!M]　　[]内省略可。
「n」で判定値、「*/a」でロール修正を指定。複数回指定可。
「@b」でアクシデント値、省略時は「96」。
「Ac」で高度なロール。「2、4、8」のみ指定可能。
「Ld」でラックポイント、「!M」でパンドラ《ミューズ》。

【書式例】
AR84/2@99!M → 判定値84のAR1/2。アクシデント値99、パンドラ《ミューズ》。
SR40*2A2L1@99 → 判定値80のSR、高度なロール2倍、ラック1点。

◆命中部位表：(命中部位)HIT[n]　　以降、ROC時は[n]を指定。
HU：人間　　BK：バイク　　WA：ワゴン　　SC：シェルキャリア　　BG：バギー
IN：インセクター　　PT：ポケットタンク　　HT：ホバータンク　　TA：戦車
AC：装甲車　　HE：ヘリ　　TR：トレーラー　　VT：VTOL　　BO：ボート
CS：通常、格闘型コンバットシェル　　TH：可変、重コンバットシェル
AM：オートモビル　　GD：ガンドック　　HC：ホバークラフト
BI：自転車　　BT：バトルトレーラー　　AI：エアクラフト
◆戦闘結果表：SUV(A～Z)n　　【書式例】SUVM100
◆損傷効果表：(命中部位)DMG(損傷種別)　　【書式例】TDMGH
H：頭部　　T：胴部　　A：腕部　　L：脚部　　M：心理　　E：電子
B：メカニック本体　　P：パワープラント　　D：ドライブ
(損傷種別)　L：LW　　M：MW　　H：HW　　O：MO
◆クリティカル表：CRT[n]
◆アクシデント表：(種別)AC[n]
G：格闘　　S：射撃、投擲　　M：心理　　E：電子
◆メカニック事故表：(場所)MA[n][+m]　　「+m」で修正を指定。
A：空中　　S：水上、水中　　L：地上

【マスコンバット】
ストラテジーイベントチャート：SEC
NPC攻撃処理チャート：NAC　　敗者運命チャート：LDC

【各種表】
荒野ランダムエンカウント表：WENC[n]
MESSAGETEXT
  end

  def rollDiceCommand(command)

    text =
      case command.upcase

      when /([AS])R(\d+)(([\*\/]\d+)*)?(((@|A|L)\d+)*)(\!M)?$/i
        #TKfix メソッドをまたぐと$xの中身がnilになっている
        reg1 = $1
        reg2 = $2
        reg3 = $3
        reg4 = $4
        reg5 = $5
        reg6 = $6
        reg7 = $7
        reg8 = $8

        type = reg1 #$1
        target = reg2.to_i #$2.to_i
        modify = get_value(1, reg3) #get_value(1, $3)
        paramText = (reg5 || '') #($5 || '')
        isMuse = (not reg8.nil?) #(not $8.nil?)  # パンドラ《ミューズ》

        accidentValue = 96
        advancedRoll = 1
        luckPoint = 0

        params = paramText.scan(/(.)(\d+)/)
        params.each do |marker, value|
          accidentValue, advancedRoll, luckPoint = get_roll_parameter(accidentValue, advancedRoll, luckPoint, marker, value)
        end

        checkRoll(type, target, modify, accidentValue, advancedRoll, luckPoint, isMuse)

      when /(HU|BK|WA|SC|BG|IN|PT|HT|TA|AC|HE|TR|VT|BO|CS|TH|AM|GD|HC|BI|BT|AI)HIT(\d+)?/i
        hitPart = $1
        roc = ($2 || 0).to_i
        get_hit_table(hitPart, roc)

      when /SUV([A-Z])(\d+)/i
        armorGrade = $1
        damage = $2.to_i
        get_SUV_table(armorGrade, damage)

      when /([HTALMEBPD])DMG([LMHO])/i
        hitPart = $1
        damageStage = $2
        get_damageEffect_table(hitPart, damageStage)

      when /CRT(\d+)?/i
        roc = ($1 || 0).to_i
        get_critical_table(roc)

      when /([GSME])AC(\d+)?/i
        damageType = $1
        roc = ($2 || 0).to_i
        get_accident_table(damageType, roc)

      when /([ASL])MA(\d+)?(\+(\d+))?/i
        locationType = $1
        roc = ($2 || 0).to_i
        correction = ($4 || 0).to_i
        get_mechanicAccident_table(locationType, roc, correction)

      when 'SEC'
        get_strategyEvent_chart

      when 'NAC'
        get_NPCAttack_chart

      when 'LDC'
        get_loserDestiny_chart

      when /([W])ENC(\d+)?/i
        locationType = $1
        roc = ($2 || 0).to_i
        get_randomEncounter_table(locationType, roc)

      else
        nil
      end

    return text
  end

  def checkRoll(rollText, target, modify, accidentValue, advancedRoll, luckPoint, isMuse)
    rollTarget = (target * modify / advancedRoll * (2 ** luckPoint)).to_i

    dice, = roll(1, 100)
    resultText, successValue = getRollResultTextAndSuccesValue(dice, advancedRoll, rollTarget, accidentValue, isMuse)

    resultText += " 達成値：#{successValue}"

    complementText = "ACC:#{accidentValue}"
    complementText += ", ADV:\*#{advancedRoll}" if(advancedRoll > 1)
    complementText += ", LUC:#{luckPoint}" if(luckPoint > 0)

    if(modify >= 1)
      modifyText = "#{modify.to_i}"
    else
      modifyText = "1\/#{(1 / modify).to_i}"
    end

    formulaText = getFormulaText(target, modify, advancedRoll, luckPoint)

    result = "#{rollText}R#{modifyText}(#{complementText})：1D100<=#{rollTarget}#{formulaText} ＞ [#{dice}] #{resultText}"
    result += " 《ミューズ》" if(isMuse)

    return result
  end

  def get_roll_parameter(accident, advanced, luck, marker, value)
    value = value.to_i

    case marker
    when '@'
      accident = value
    when 'A'
      advanced = value if [2, 4, 8].include?(value)
    when 'L'
      luck = value
    end

    return accident, advanced, luck
  end

  def getRollResultTextAndSuccesValue(dice, advancedRoll, rollTarget, accidentValue, isMuse)
    successValue = 0

    if(dice >= accidentValue)
      resultText = "失敗（アクシデント）"
      return resultText, successValue
    end

    if(dice > rollTarget)
      resultText = "失敗"
      return resultText, successValue
    end

    dig1 = dice - ((dice / 10).to_i * 10)

    if(isMuse)
      isCritical = (dig1 <= 1)
    else
      isCritical = (dig1 == 1)
    end

    resultText = "成功"
    resultText += "（クリティカル）" if(isCritical)

    successValue = dice * advancedRoll

    return resultText, successValue
  end

  def getFormulaText(target, modify, advancedRoll, luckPoint)

    formulaText = target.to_s
    formulaText += "\*#{modify.to_i}" if(modify > 1)
    formulaText += "\/#{(1 / modify).to_i}" if(modify < 1)
    formulaText += "\/#{advancedRoll}" if(advancedRoll > 1)
    formulaText += "\*#{2 ** luckPoint}" if(luckPoint > 0)

    return "" if formulaText == target.to_s

    return "[#{formulaText}]"
  end

  def get_hit_table(hitPart, roc)
    case hitPart
    when 'HU'
      name = '命中部位表：人間'
      table = [
                [1, '胴部（クリティカル）'],
                [2, '頭部'],
                [3, '左腕部'],
                [4, '右腕部'],
                [5, '胴部'],
                [6, '胴部'],
                [7, '胴部'],
                [8, '胴部'],
                [9, '脚部'],
                [10, '脚部']
              ]
    when 'BK'
      name = '命中部位表：バイク'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, 'パワープラント'],
                [6, 'ドライブ'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '乗員'],
                [10, '乗員']
              ]
    when 'WA'
      name = '命中部位表：ワゴン'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, '本体'],
                [7, 'パワープラント'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'SC'
      name = '命中部位表：シェルキャリア'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, '本体'],
                [7, 'パワープラント'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'BG'
      name = '命中部位表：バギー'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'IN'
      name = '命中部位表：インセクター'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, 'ドライブ'],
                [9, 'ドライブ'],
                [10, '乗員']
              ]
    when 'PT'
      name = '命中部位表：ポケットタンク'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'パワープラント'],
                [8, 'ドライブ'],
                [9, 'ドライブ'],
                [10, '兵装・貨物']
              ]
    when 'HT'
      name = '命中部位表：ホバータンク'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, '本体'],
                [7, 'パワープラント'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '兵装・貨物']
              ]
    when 'TA'
      name = '命中部位表：戦車'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '兵装・貨物']
              ]
    when 'AC'
      name = '命中部位表：装甲車'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '兵装・貨物']
              ]
    when 'HE'
      name = '命中部位表：ヘリ'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, 'パワープラント'],
                [6, 'ドライブ'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'TR'
      name = '命中部位表：トレーラー'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, 'パワープラント'],
                [6, 'ドライブ'],
                [7, '兵装・カーゴ'],
                [8, '兵装・カーゴ'],
                [9, '兵装・カーゴ'],
                [10, '乗員']
              ]
    when 'VT'
      name = '命中部位表：VTOL'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'BO'
      name = '命中部位表：ボート'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, '本体'],
                [7, '本体'],
                [8, 'パワープラント'],
                [9, 'ドライブ'],
                [10, '兵装・貨物']
              ]
    when 'CS'
      name = '命中部位表：通常・格闘型コンバットシェル'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, '本体'],
                [7, 'ザック'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '兵装・貨物']
              ]
    when 'TH'
      name = '命中部位表：可変・重コンバットシェル'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, '本体'],
                [7, 'ドライブ'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '兵装・貨物']
              ]
    when 'AM'
      name = '命中部位表：オートモビル'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'GD'
      name = '命中部位表：ガンドック'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, 'ドライブ'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'HC'
      name = '命中部位表：ホバークラフト'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, 'パワープラント'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '乗員'],
                [10, '乗員']
              ]
    when 'BI'
      name = '命中部位表：自転車'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'BT'
      name = '命中部位表：バトルトレーラー'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    when 'AI'
      name = '命中部位表：エアクラフト'
      table = [
                [1, '本体（クリティカル）'],
                [2, '本体'],
                [3, '本体'],
                [4, '本体'],
                [5, '本体'],
                [6, 'パワープラント'],
                [7, 'ドライブ'],
                [8, '兵装・貨物'],
                [9, '兵装・貨物'],
                [10, '乗員']
              ]
    else
      return nil
    end

    return get_MetalHeadExtream_1d10_table_result(name, table, roc)
  end

  def get_SUV_table(armorGrade, damage)
    name = '戦闘結果表'
    table = [
             [0, 1, 6, 16, 26, 36],
             [0, 1, 6, 26, 36, 46],
             [0, 1, 16, 26, 46, 56],
             [1, 6, 26, 36, 56, 76],
             [1, 16, 36, 46, 66, 76],
             [1, 26, 36, 56, 76, 86],
             [1, 36, 56, 66, 76, 96],
             [1, 56, 76, 86, 96, 106],
             [1, 66, 86, 96, 106, 116],
             [1, 66, 86, 96, 116, 136],
             [1, 76, 96, 106, 126, 156],
             [1, 76, 96, 116, 146, 166],
             [1, 86, 106, 126, 166, 176],
             [1, 106, 126, 136, 176, 196],
             [1, 106, 126, 146, 186, 206],
             [1, 116, 136, 156, 196, 206],
             [1, 126, 146, 166, 206, 226],
             [1, 126, 146, 176, 226, 246],
             [1, 136, 156, 186, 246, 266],
             [1, 156, 176, 206, 246, 286],
             [1, 156, 176, 206, 266, 306],
             [1, 166, 186, 206, 286, 346],
             [1, 176, 196, 246, 326, 366],
             [1, 196, 226, 266, 346, 386],
             [1, 206, 226, 286, 366, 406],
             [1, 226, 246, 306, 386, 406]
            ]

    armorIndex = ('A'..'Z').to_a.index(armorGrade)
    damageInfo = table[armorIndex]

    woundRanks = ['無傷', 'LW(軽傷)', 'MW(中傷)', 'HW(重傷)','MO(致命傷)', 'KL(死亡)']

    woundText = ""

    damageInfo.each_with_index do |rate, index|
      break if rate > damage
      woundText = woundRanks[index]
    end

    return "#{name}(#{armorGrade})：#{damage} ＞ #{woundText}"
  end

  def get_damageEffect_table(hitPart, damageStage)

    damageInfos = [['L', '(LW)'],
                   ['M', '(MW)'],
                   ['H', '(HW)'],
                   ['O', '(MO)']]

    #index = damageInfos.index{|type, text| type == damageStage} # TKfix
    index = damageInfos.index{|type| type.first == damageStage} # TKfix
    return nil if index == -1

    damageIndex = index + 1
    damageText = damageInfos[index][1]

    case hitPart
    when 'H'
      name = '対人損傷効果表：頭部'
      table = [
                [1, 'ダメージ修正+10。'],
                [2, 'ダメージ修正+10。【PER】のAR、【PER】がベースアビリティのスキルのSRにSR1/2のロール修正。'],
                [3, 'ダメージ修正+20。【PER】のAR、【PER】がベースアビリティのスキルのSRにSR1/4のロール修正。'],
                [4, 'ダメージ修正+30。［死亡］。頭部がサイバーの場合は［戦闘不能］。']
              ]
    when 'T'
      name = '対人損傷効果表：胴部'
      table = [
                [1, 'ダメージ修正+10。'],
                [2, 'ダメージ修正+10。【DEX】のAR、【DEX】がベースアビリティのスキルのSRにSR1/2のロール修正。'],
                [3, 'ダメージ修正+20。【DEX】のAR、【DEX】がベースアビリティのスキルのSRにSR1/4のロール修正。'],
                [4, 'ダメージ修正+30。［戦闘不能］。']
              ]
    when 'A'
      name = '対人損傷効果表：腕部'
      table = [
                [1, 'ダメージ修正+10。'],
                [2, 'ダメージ修正+10。損傷した腕を使用する、また両腕を使用する行動にSR1/2のロール修正。'],
                [3, 'ダメージ修正+20。損傷した腕を使用する、また両腕を使用する行動にSR1/4のロール修正。'],
                [4, 'ダメージ修正+30。損傷した腕を使用する、また両腕を使用する行動不可。']
              ]
    when 'L'
      name = '対人損傷効果表：脚部'
      table = [
                [1, 'ダメージ修正+10。'],
                [2, 'ダメージ修正+10。【REF】のAR、【REF】がベースアビリティのスキルのSRにSR1/2のロール修正。'],
                [3, 'ダメージ修正+20。【REF】のAR、【REF】がベースアビリティのスキルのSRにSR1/4のロール修正。【MV】が1/2。'],
                [4, 'ダメージ修正+30。［戦闘不能］。']
              ]
    when 'M'
      name = '心理損傷効果表'
      table = [
                [1, 'ダメージ修正+10。焦り。効果は特になし。シーン終了で自然回復。'],
                [2, 'ダメージ修正+20。混乱。1シーン、すべてのロールがSR1/2となる。シーン終了で自然回復。'],
                [3, 'ダメージ修正+30。恐怖。1シーン、すべてのロールがSR1/4となる。シーン終了で自然回復。'],
                [4, 'ダメージ修正+50。喪失。［戦闘不能］。シーン終了で自然回復。']
              ]
    when 'E'
      name = '電子損傷効果表'
      table = [
                [1, 'ダメージ修正+10。処理落ち。効果は特になし。'],
                [2, 'ダメージ修正+20。ノイズ。1シーン、キャラクターならすべてのロールが、アイテムならそれを使用したロールが1/2となる。'],
                [3, 'ダメージ修正+30。恐怖。1シーン、キャラクターならすべてのロールが、アイテムならそれを使用したロールが1/4となる。'],
                [4, 'ダメージ修正+50。クラッシュ。キャラクターなら［戦闘不能］。アイテムなら1シナリオ中、使用不可。']
              ]
    when 'B'
      name = 'メカニック損傷効果表：本体'
      table = [
                [1, 'ダメージ修正+10。'],
                [2, 'ダメージ修正シフト1。修理費がフレーム価格の1/4かかる。'],
                [3, 'ダメージ修正シフト2。修理費がフレーム価格の1/2かかる。'],
                [4, 'ダメージ修正シフト3。移動不能。修理費がフレーム価格と同じだけかかる。走行中なら事故表を振ること。']
              ]
    when 'P'
      name = 'メカニック損傷効果表：パワープラント'
      table = [
                [1, 'ダメージ修正+10。'],
                [2, 'ダメージ修正+10。メカニックの【MV】が1/2になる。修理費がパワープラント価格の1/4かかる。'],
                [3, 'ダメージ修正+20。メカニックの【MV】が1/4になる。修理費がパワープラント価格の1/2かかる。'],
                [4, 'ダメージ修正+30。移動不能。修理費がパワープラント価格と同じだけかかる。走行中なら事故表を振ること。']
              ]
    when 'D'
      name = 'メカニック損傷効果表：ドライブ'
      table = [
                [1, 'ダメージ修正+10。'],
                [2, 'ダメージ修正+10。メカニックの【REF】が1/2になる。［メカニック］スキルにSR1/2の修正。修理費がドライブ価格の1/4かかる。'],
                [3, 'ダメージ修正+20。メカニックの【REF】が1/2になる。［メカニック］スキルにSR1/4の修正。修理費がドライブ価格の1/2かかる。'],
                [4, 'ダメージ修正+30。移動不能。修理費がドライブ価格と同じだけかかる。走行中なら事故表を振ること。']
              ]
    else
      return nil
    end

    text = get_table_by_number(damageIndex, table)
    return "#{name}#{damageText} ＞ #{text}"
  end

  def get_critical_table(roc)
    name = 'クリティカル表'
    table = [
              [1, '特に追加被害は発生しない。'],
              [2, '対象はバランスを崩す。クリンナッププロセスまで、対象は命中ロールにSR1/2のロール修正を受ける。'],
              [3, '対象に隙を作る。クリンナッププロセスまで、対象はリアクションにSR1/2のロール修正を受ける。'],
              [4, '激しい一撃。最終火力に+20してダメージを算出すること。'],
              [5, '多大なダメージ。最終火力に+20してダメージを算出すること。'],
              [6, '弱点に直撃。対象の装甲値を無視してダメージを算出すること。'],
              [7, '効果的な一撃。対象の受ける損傷段階をシフト1する。'],
              [8, '致命的な一撃。対象の受ける損傷段階をシフト2する。'],
              [9, '中枢に直撃。対象の【SUV】を3ランク低いものとしてダメージを算出する。'],
              [10, '中枢を破壊。対象の装甲値を無視し、【SUV】を3ランク低いものとしてダメージを算出する。']
            ]
    return get_MetalHeadExtream_1d10_table_result(name, table, roc)
  end

  def get_accident_table(damageType, roc)
    case damageType
    when 'G'
      name = '格闘アクシデント表'
      table = [
                [1, '体勢を崩す。その攻撃は失敗する。'],
                [2, '体勢を崩す。その攻撃は失敗する。'],
                [3, '体勢を崩す。その攻撃は失敗する。'],
                [4, '転倒。格闘回避と機動回避にSR1/4、【MV】が半分に。'],
                [5, '転倒。格闘回避と機動回避にSR1/4、【MV】が半分に。'],
                [6, '転倒。格闘回避と機動回避にSR1/4、【MV】が半分に。'],
                [7, '武器が足下（0m離れたところ）に落ちる。素手のときは何もなし。'],
                [8, '武器が足下（0m離れたところ）に落ちる。素手のときは何もなし。'],
                [9, '武器が5m離れたところに落ちる。素手のときは関係ない。'],
                [10, '使用武器が壊れ、1シーン使用不可。']
              ]
    when 'S'
      name = '射撃／投擲アクシデント表'
      table = [
                [1, 'ささいなミス。その攻撃は失敗する。'],
                [2, 'ささいなミス。その攻撃は失敗する。'],
                [3, 'ささいなミス。その攻撃は失敗する。'],
                [4, '射撃武器はジャム。投擲武器ならば武器が取り出せないなど、マイナーアクションを消費しなければその武器を使用できない。'],
                [5, '射撃武器はジャム。投擲武器ならば武器が取り出せないなど、マイナーアクションを消費しなければその武器を使用できない。'],
                [6, '射撃武器はジャム。投擲武器ならば武器が取り出せないなど、マイナーアクションを消費しなければその武器を使用できない。'],
                [7, '故障。メジャーアクションで【DEX】のSR1のロールに成功しなければ、その武器を使用できない。'],
                [8, '故障。メジャーアクションで【DEX】のSR1のロールに成功しなければ、その武器を使用できない。'],
                [9, '破壊。以後、その武器は使用できない。'],
                [10, '武器の暴発。固定火力100のダメージを、装甲値無視で武器を持っていた腕（両手なら両手）、または兵装・貨物に受ける。']
              ]
    when 'M'
      name = '心理攻撃アクシデント表'
      table = [
                [1, '集中失敗。攻撃は失敗する。'],
                [2, '集中失敗。攻撃は失敗する。'],
                [3, '集中失敗。攻撃は失敗する。'],
                [4, '思考ノイズ。クリンナップまですべてのリアクションにSR1/2。'],
                [5, '思考ノイズ。クリンナップまですべてのリアクションにSR1/2。'],
                [6, '思考ノイズ。クリンナップまですべてのリアクションにSR1/2。'],
                [7, 'EXの暴走。頭部に装甲値無視、固定火力60のダメージを受ける。'],
                [8, 'EXの暴走。頭部に装甲値無視、固定火力60のダメージを受ける。'],
                [9, '感情暴走。攻撃に使用したマニューバが1シーン使用不可。'],
                [10, 'トラウマの再現。装甲値無視、固定火力100の心理ダメージを受ける。']
              ]
    when 'E'
      name = '電子攻撃アクシデント表'
      table = [
                [1, 'ショック。攻撃は失敗する。'],
                [2, 'ショック。攻撃は失敗する。'],
                [3, 'ショック。攻撃は失敗する。'],
                [4, 'ノイズ発生。クリンナップまで電子攻撃のリアクションにSR1/2。'],
                [5, 'ノイズ発生。クリンナップまで電子攻撃のリアクションにSR1/2。'],
                [6, 'ノイズ発生。クリンナップまで電子攻撃のリアクションにSR1/2。'],
                [7, 'ソフトウェア障害。攻撃に使用したソフトが1シーン使用不可。'],
                [8, 'ソフトウェア障害。攻撃に使用したソフトが1シーン使用不可。'],
                [9, 'ハードウェア障害。装甲値無視、固定火力80の電子ダメージを受ける。'],
                [10, '信号逆流。装甲値無視、固定火力100の心理ダメージを受ける。']
              ]
    else
      return nil
    end

    return get_MetalHeadExtream_1d10_table_result(name, table, roc)
  end

  def get_mechanicAccident_table(locationType, roc, correction)
    case locationType
    when 'A'
      name = '空中メカニック事故表'
      table = [
                [3, '兵装／貨物。メカニックが装備している一番ENCの大きい武器ひとつが戦闘終了時まで使用不能になる。武器がない場合はメカニックオプションが使用不能になり、それもない場合は一番ENCの重い貨物（乗客をのぞく）が失われる。'],
                [6, '操作不能。メカニック本体にMWダメージ。操縦者は適切な［メカニック］スキルでSR1/4のロールを行い、成功したら体勢を立て直せる。失敗した場合、次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。'],
                [8, '不時着。メカニック本体にHWダメージ。次のクリンナッププロセスまで、回復をふくめた一切の行動を取ることができない。'],
                [9, '墜落。メカニック本体にMOダメージ。すべての乗員は、墜落のショックによってランダムな部位に〈物〉155の固定ダメージを受ける。このダメージは機動回避可能である。'],
                [10, '爆発。メカニックが爆発し、完全に破壊される。すべての乗員は、爆発と落下によって胴体に〈熱〉205の固定ダメージを受ける。このダメージは機動回避可能だが、SRに1/4の修正がある。']
              ]
    when 'S'
      name = '水上／水中メカニック事故表'
      table = [
                [3, '横揺れ。次のクリンナッププロセスまで、このメカニックに乗っているキャラクターの行うすべての［メカニック］ロールに1/2の修正が与えられる。'],
                [6, '兵装／貨物。メカニックが装備している一番ENCの大きい武器ひとつが戦闘終了時まで使用不能になる。武器がない場合はメカニックオプションが使用不能になり、それもない場合は一番ENCの重い貨物（乗客をのぞく）が失われる。'],
                [8, '横転。メカニック本体にMWダメージ。操縦者は適切な［メカニック］スキルでSR1/4のロールを行い、成功したら体勢を立て直せる。失敗した場合、次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。'],
                [9, '激突。メカニック本体に〈物〉255の固定ダメージ。'],
                [10, '爆発。メカニックが爆発し、完全に破壊される。すべての乗員は、爆発によって胴体に〈熱〉155の固定ダメージを受ける。このダメージは機動回避可能だが、SRに1/4の修正がある。']
              ]
    when 'L'
      name = '地上メカニック事故表'
      table = [
                [3, '接触。メカニック本体にLWダメージ。'],
                [6, '兵装／貨物。メカニックが装備している一番ENCの大きい武器ひとつが戦闘終了時まで使用不能になる。武器がない場合はメカニックオプションが使用不能になり、それもない場合は一番ENCの重い貨物（乗客をのぞく）が失われる。'],
                [8, 'スピン。メカニック本体にMWダメージ。操縦者は適切な［メカニック］スキルでSR1/4のロールを行い、成功したら体勢を立て直せる。失敗した場合、次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。'],
                [9, '激突。メカニック本体に〈物〉255の固定ダメージ。次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。'],
                [10, '爆発。メカニックが爆発し、完全に破壊される。すべての乗員は、爆発によって胴体に〈熱〉155の固定ダメージを受ける。このダメージは機動回避可能だが、SRに1/4の修正がある。']
              ]
    else
      return nil
    end

    dice = get_roc_dice(roc, 10)
    diceText = dice.to_s

    dice += correction
    dice = 10 if(dice > 10)
    diceText = "#{dice}[#{diceText}+#{correction}]" if(correction > 0)

    tableText = get_table_by_number(dice, table)
    text = "#{name}(#{diceText}) ＞ #{tableText}"
    return text
  end

  def get_strategyEvent_chart
    name = 'ストラテジーイベントチャート'
    table = [
              [50, '特に何事もなかった。'],
              [53, 'スコール。種別：レーザーを装備している部隊の戦力はこのターン半減する。この効果は重複しない。'],
              [55, 'ただよう不安。味方ユニットはWILのAR1を行い、失敗すると士気の10%を失う。'],
              [57, '狙撃！　司令官キャラクターは胴体に〈物〉155点の固定ダメージを受ける。機動回避は可能。'],
              [60, '敵の猛烈な反撃！　味方ユニットはREFのAR1を行い、失敗するとこのターン、移動力がマイナス1。'],
              [63, '敵弾幕の隙を見いだす。このターン、味方ユニットは突破判定がSR2に。'],
              [65, '突破のチャンス。このターン、味方ユニットは移動力が1点上昇する。'],
              [67, '士気高揚。味方ユニットの士気がそれぞれ現在値の10%だけ回復する。'],
              [70, '敵陣崩壊。敵ユニットの中で士気がもっとも低いユニットが戦場から撤退する。複数いた場合、すべて撤退。PC、ゲストには効果なし。'],
              [73, '大声援。戦闘がどこかのハッカーによって衛星中継され、喝采を浴びる。'],
              [75, '雨／雪。種別；レーザーを部隊の戦力はこのターン半減する。この効果は重複しない。'],
              [77, '磁気嵐。このターン、種別：ミサイルは戦力に数えず、突撃に使用することもできない。'],
              [80, '膠着した戦況。このターン、味方ユニットは突破判定がSR1/2に。'],
              [83, 'メタルホッパー！　金属イナゴの襲来で視界をふさがれ、このラウンドは全てのMC射程が0となる。'],
              [85, '大竜巻！　飛行しているユニットの移動力は0となり、飛行ユニットはこのターン自分から突撃を行えない。'],
              [87, '通信の混乱。味方ユニットはINTのAR1を行い、失敗するとこのターン、移動力がマイナス1。'],
              [90, '幸運が微笑む。味方ユニットのラックポイントが1点ずつ回復。NPCには無効。'],
              [93, '致命的な狙撃！　司令官キャラクターは胴体に〈物〉205点の固定ダメージを受ける。機動回避は可能。'],
              [95, '敵の罠に落ちた。このターン、敵軍ユニットは移動力が1点上昇する。'],
              [97, '勝利の予感。味方ユニットの士気がそれぞれの現在値の20%だけ回復する。'],
              [99, '天変地異が襲いかかる！　このターン、すべてのユニットは移動できない。'],
              [100, '大混乱。後2回振る。']
            ]
    return get_MetalHeadExtream_1d100_table_result(name, table, 0)
  end

  def get_NPCAttack_chart
    name = 'NPC攻撃処理チャート'
    table = [
              [5, '戦力の低い側だけが一方的に除去される。'],
              [8, '双方、一番戦力の少ないユニットひとつを除去する。'],
              [10, '戦力の高い側が最大戦力のユニットひとつを除去する。']
            ]
    return get_MetalHeadExtream_1d10_table_result(name, table, 0)
  end

  def get_loserDestiny_chart
    name = '敗者運命チャート'
    table = [
              [1, '奇跡的に無傷で生き延びた。いずれ復讐の機会もあるだろう。'],
              [2, 'ランダムな部位にLWを負う。'],
              [3, '戦力決定に使っていた武器が破壊される。'],
              [4, 'ランダムな部位にMWを負う。'],
              [5, '外見に影響するような傷を負う。治療するなら$3000。'],
              [6, 'ランダムな部位にHWを負う。'],
              [7, '着用している防具すべてが破壊される。衣服は壊れない。'],
              [8, 'ランダムな部位にMOを負う。'],
              [9, 'ランダムに決定した能力値ひとつを、永久に1点失う。'],
              [10, '残念ながら、君は死んでしまった。']
            ]
    return get_MetalHeadExtream_1d10_table_result(name, table, 0)
  end

  def get_randomEncounter_table(locationType, roc)
    case locationType
    when 'W'
      name = '荒野ランダムエンカウント表'
      table = [
                [80, '特に遭遇は発生しなかった'],
                [85, '1d10名のバンデッド'],
                [87, 'ヴェーダ・バウンサー1名に率いられた1d10+2（最低1）のヴェーダ・ソルジャー'],
                [89, '1d10+2体のウェーブコヨーテ'],
                [91, '1d10÷2体（最低1）のレーザーアント'],
                [93, '1d10-5体（最低1）のライトニングホーク'],
                [96, '1d10体のメタルホッパー'],
                [98, '1体のブラスビースト'],
                [100, '1d10÷3体（最低1）のサンドワーム']
              ]
    else
      return nil
    end

    return get_MetalHeadExtream_1d100_table_result(name, table, roc)
  end

  def get_MetalHeadExtream_1d10_table_result(name, table, roc)
    get_MetalHeadExtream_1dX_table_result(name, table, roc, 10)
  end

  def get_MetalHeadExtream_1d100_table_result(name, table, roc)
    get_MetalHeadExtream_1dX_table_result(name, table, roc, 100)
  end

  def get_MetalHeadExtream_1dX_table_result(name, table, roc, diceMax)
    dice = get_roc_dice(roc, diceMax)
    text = get_table_by_number(dice, table)

    return "#{name}(#{dice}) ＞ #{text}"
  end

  def get_roc_dice(roc, diceMax)
    dice = roc
    dice = diceMax if(dice > diceMax)

    if(dice == 0)
      dice, = roll(1, diceMax)
    end

    return dice
  end

  # 端数が使いたいので、parren_killer未使用
  def get_value(originalValue, calculateText)
    result = originalValue.to_f
    #calculateArray = calculateText.scan(/[\*\/]\d*/)  # 修正値を分割して配列へ
    calculateArray = (calculateText || '').scan(/[\*\/]\d*/)  # TKfix undefined method `scan' for nil
    calculateArray.each do |i|                        # 配列内ループで補正率を計算
      i =~ /([\*\/])(\d*)/i
      result *= $2.to_i if($1 == '*')
      result /= $2.to_i if($1 == '/')
    end
    return result
  end
end
