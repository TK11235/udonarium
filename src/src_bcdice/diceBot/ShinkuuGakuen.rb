# -*- coding: utf-8 -*-
# frozen_string_literal: true

class ShinkuuGakuen < DiceBot
  # ゲームシステムの識別子
  ID = 'ShinkuuGakuen'

  # ゲームシステム名
  NAME = '真空学園'

  # ゲームシステム名の読みがな
  SORT_KEY = 'しんくうかくえん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・判定
RLx：技能ベースｘで技能チェックのダイスロール
RLx>=y：この書式なら目標値 ｙ で判定結果出力
　例）RL10　　RL22>=50

・武器攻撃
（武器記号）（技能ベース値）
　例）SW10　BX30
武器を技能ベースでダイスロール。技発動までチェック。
武器記号は以下の通り
　SW：剣、LS：大剣、SS：小剣、SP：槍、
　AX：斧、CL：棍棒、BW：弓、MA：体術、
　BX：ボクシング、PR：プロレス、ST：幽波紋

・カウンター攻撃
カウンター技は武器記号の頭に「C」をつけるとロール可能。
　例）CSW10　CBX76
MESSAGETEXT

  setPrefixes([
    'CRL.*', 'CSW.*', 'CLS.*', 'CSS.*', 'CSP.*', 'CAX.*', 'CCL.*', 'CMA.*', 'CBX.*', 'CPR.*', 'CST.*',
    'RL.*', 'SW.*', 'LS.*', 'SS.*', 'SP.*', 'AX.*', 'CL.*', 'BW.*', 'MA.*', 'BX.*', 'PR.*', 'ST.*'
  ])

  def rollDiceCommand(command)
    prefixesRegText = prefixes.collect { |i| i.sub(/\.\*/, '') }.join('|')
    unless /(^|\s)(S)?(#{prefixesRegText})([\d\+\-]*)(>=(\d+))?/i === command
      debug("NOT match")
      return nil
    end

    debug("matched.")

    weaponCommand = Regexp.last_match(3)
    base = Regexp.last_match(4).to_i
    diff = Regexp.last_match(6)

    weaponInfo = getWeaponTable(weaponCommand)
    output_msg = rollJudge(base, diff, weaponInfo)

    return output_msg
  end

  def rollJudge(base, diff, weaponInfo)
    debug("rollJudge base", base)
    debug("rollJudge diff", diff)

    weaponName = weaponInfo[:name]
    weaponTable = weaponInfo[:table]

    diceList = getJudgeDiceList
    total = diceList.inject() { |value, i| value += i }
    allTotal = total + base

    diffText = diff.nil? ? "" : ">=#{diff}"
    result = "(#{weaponName}：#{base}#{diffText}) ＞ 1D100+#{base} ＞ #{total}"
    result += "[#{diceList.join(',')}]" if diceList.length >= 2
    result += "+#{base}"
    result += " ＞ #{allTotal}"
    result += getSuccessText(allTotal, diff, diceList, weaponTable)
    result += getWeaponSkillText(weaponTable, diceList.max)

    debug("check_1D100 result", result)

    return result
  end

  def getJudgeDiceList
    diceList = []
    loop do
      value, = roll(1, 100)
      diceList << value

      rank01 = value % 10
      debug("rank01", rank01)

      break unless rank01 == 0
    end

    return diceList
  end

  def getSuccessText(allTotal, diff, diceList, isWeapon)
    first = diceList.first
    return '' if first.nil?

    return " ＞ ファンブル" if first <= 9

    if diff.nil? && (first != 10)
      return ''
    end

    result = ''
    skillText = getSkillText(first, diff, isWeapon)
    result += skillText

    unless diff.nil?
      result += ' ＞ ' if  skillText.empty?

      success = (allTotal >= diff.to_i ? "成功" : "失敗")
      result += success.to_s
    end

    return result
  end

  def getSkillText(first, diff, isWeapon)
    result = ''
    return result if isWeapon

    result = ' ＞ '
    return result unless first == 10

    result += "技能なし：ファンブル"

    return result if diff.nil?

    result += "／技能あり："

    return result\
  end

  def getWeaponTable(weaponCommand)
    debug('getWeaponTable weaponCommand', weaponCommand)

    case weaponCommand.upcase
    when 'SW'
      return getWeaponTableSword
    when 'CSW'
      return getWeaponTableSwordCounter
    when 'LS'
      return getWeaponTableLongSword
    when 'CLS'
      return getWeaponTableLongSwordCounter
    when 'SS'
      return getWeaponTableShortSword
    when 'CSS'
      return getWeaponTableShortSwordCounter
    when 'SP'
      return getWeaponTableSpear
    when 'CSP'
      return getWeaponTableSpearCounter
    when 'AX'
      return getWeaponTableAx
    when 'CAX'
      return getWeaponTableAxCounter
    when 'CL'
      return getWeaponTableClub
    when 'CCL'
      return getWeaponTableClubCounter
    when 'BW'
      return getWeaponTableBow
    when 'MA'
      return getWeaponTableMartialArt
    when 'CMA'
      return getWeaponTableMartialArtCounter
    when 'BX'
      return getWeaponTableBoxing
    when 'CBX'
      return getWeaponTableBoxingCounter
    when 'PR'
      return getWeaponTableProWrestling
    when 'CPR'
      return getWeaponTableProWrestlingCounter
    when 'ST'
      return getWeaponTableStand
    when 'CST'
      return getWeaponTableStandCounter
    end

    return {:name => '判定', :table => nil}
  end

  def getWeaponTableSword
    {:name => '剣',
     :table =>
      [[11, '失礼剣', '成功度＋５'],
       [22, '隼斬り', '回避不可'],
       [33, 'みじん斬り', '攻撃量２倍'],
       [44, '天地二段', '２連続攻撃'],
       [55, '波動剣', 'カウンター不可、Ｂ・Ｄ'],
       [66, '疾風剣', '攻撃量３倍､盾受けー１００'],
       [77, '残像剣', '全体攻撃、Ｂ・Ｄ'],
       [88, '五月雨斬り」', '回避不可．ダメージ３倍'],
       [99, 'ライジングノヴア」', '２連続攻撃・２撃目敵無防備、Ｂ・Ｄ'],
       [ 0, '光速剣', '攻撃量3倍､盾受け不可､カウンター不可、Ｂ・Ｄ'],]}
  end

  def getWeaponTableSwordCounter
    {:name => '剣カウンター',
     :table =>
      [[33, 'パリィ', '攻撃の無効化'],
       [44, nil, nil],
       [55, nil, nil],
       [66, 'かすみ青眼', 'カウンター'],
       [77, nil, nil],
       [88, nil, nil],
       [99, nil, nil],
       [ 0, '不動剣', 'クロスカウンター、Ｂ・Ｄ、ダメージ２倍'],]}
  end

  def getWeaponTableLongSword
    {:name => '大剣',
     :table =>
      [[11, 'スマッシュ', '敵防御半分'],
       [22, '峰打ち', '麻痺硬化「根性」０'],
       [33, '水鳥剣', '敵防御判定ー５０'],
       [44, 'ブルクラッシュ', '敵防御力無視'],
       [55, '逆風の太刀', 'カウンター不可、ダメージ２倍'],
       [66, '濁流剣', '回避不可、カウンター不可、Ｂ・Ｄ'],
       [77, '清流剣', '回避不可、カウンター不可、Ｂ・Ｄ'],
       [88, '燕返し', '２連続攻撃・２撃目カウンター不可、Ｂ・Ｄ'],
       [99, '地ずり残月', '盾受け不可、ダメージ３倍、Ｂ・Ｄ'],
       [ 0, '乱れ雪月花', '３連続攻撃・三撃目敵無防備、ダメージ３倍、防御力無視、Ｂ・Ｄ'],]}
  end

  def getWeaponTableLongSwordCounter
    {:name => '大剣カウンター',
     :table =>
      [[22, '無形の位', '攻撃の無効化'],
       [33, nil, nil],
       [44, nil, nil],
       [55, '双破', 'クロスカウンター、Ｂ・Ｄ'],
       [66, nil, nil],
       [77, nil, nil],
       [88, '喪心無想', 'カウンター、攻撃量６倍'],
       [99, nil, nil],
       [ 0, nil, nil],]}
  end

  def getWeaponTableShortSword
    {:name => '小剣',
     :table =>
      [[11, '乱れ突き', '２連続攻撃'],
       [22, 'フェイクタング', 'スタン効果「注意力」５'],
       [33, 'マインドステア', '麻痺効果「注意力」０'],
       [44, 'サイドワインダー', '成功度＋３、盾受け不可'],
       [55, 'スクリュードライバー', '防御力無視、ダメージ２倍'],
       [66, 'ニードルロンド', '３連続攻撃'],
       [77, 'プラズマブラスト', '麻痺効果「根性」０、Ｂ・Ｄ'],
       [88, 'サザンクロス', '麻痺効果「根性」５、攻撃量２倍'],
       [99, 'ファイナルレター', '気絶効果「根性」０、回避不可、カウンター不可、Ｂ・Ｄ'],
       [ 0, '百花繚乱', '回避不可、盾受け不可、攻撃量３倍、Ｂ・Ｄ'],]}
  end

  def getWeaponTableShortSwordCounter
    {:name => '小剣カウンター',
     :table =>
      [[11, 'リポスト', 'カウンター'],
       [22, nil, nil],
       [33, nil, nil],
       [44, nil, nil],
       [55, nil, nil],
       [66, nil, nil],
       [77, nil, nil],
       [88, 'マタドール', 'カウンター、麻痺効果「注意力」５'],
       [99, nil, nil],
       [ 0, 'マリオネット', '攻撃の相手を変える'],]}
  end

  def getWeaponTableSpear
    {:name => '槍',
     :table =>
      [[11, 'チャージ', 'ダメージ１．５倍、盾受けー３０'],
       [22, '稲妻突き', '回避不可'],
       [33, '脳削り', '麻痺効果「根性」０'],
       [44, '大車輪', '全体攻撃'],
       [55, '狂乱撃', '二回攻撃'],
       [66, 'スパイラルチャージ', '盾受け不可、ダメージ２倍、Ｂ・Ｄ'],
       [77, '双龍波', 'スタン効果「注意力」５、盾受け不可、Ｂ・Ｄ'],
       [88, '流星衝', 'カウンター不可、ダメージ３倍、次行動まで攻撃対象にならない'],
       [99, 'ランドスライサー', '全体攻撃、回避不可、カウンター不可、Ｂ・Ｄ'],
       [ 0, '無双三段', '三段攻撃、二段目Ｂ・Ｄ、三段目ダメージ２倍、Ｂ・Ｄ'],]}
  end

  def getWeaponTableSpearCounter
    {:name => '槍カウンター',
     :table =>
      [[55, '風車', 'カウンター、ダメージ２倍'],
       [66, nil, nil],
       [77, nil, nil],
       [88, nil, nil],
       [99, nil, nil],
       [ 0, nil, nil],]}
  end

  def getWeaponTableAx
    {:name => '斧',
     :table =>
      [[11, '一人時間差', '防御行動ー１００'],
       [22, 'トマホーク', 'カウンター不可'],
       [33, '大木断', 'ダメージ２倍'],
       [44, 'ブレードロール', '全体攻撃'],
       [55, 'マキ割りスペシャル', '盾受け不可、Ｂ・Ｄ'],
       [66, 'ヨーヨー', 'カウンター不可、２連続攻撃'],
       [77, 'メガホーク', 'カウンター不可、全体攻撃、攻撃量２倍'],
       [88, 'デッドリースピン', '回避不可、攻撃量５倍'],
       [99, 'マキ割りダイナミック', '盾受け不可、ダメージ２倍、Ｂ・Ｄ、ターンの最後に命中'],
       [ 0, '高速ナブラ', '回避不可、カウンター不可、攻撃量３倍、Ｂ・Ｄ'],]}
  end

  def getWeaponTableAxCounter
    {:name => '斧カウンター',
     :table =>
      [[44, '真っ向唐竹割り', 'クロスカウンター、Ｂ・Ｄ'],
       [55, nil, nil],
       [66, nil, nil],
       [77, nil, nil],
       [88, nil, nil],
       [99, nil, nil],
       [ 0, nil, nil],]}
  end

  def getWeaponTableClub
    {:name => '棍棒',
     :table =>
      [[11, 'ハードヒット', '防御力無視'],
       [22, 'ダブルヒット', '２連続攻撃'],
       [33, '回転撃', '防御判定ー１００'],
       [44, '飛翔脳天撃', '麻痺効果「根性」５'],
       [55, '削岩撃', '盾受け不可、攻撃量３倍'],
       [66, '地裂撃', '防御力無視、カウンター不可、盾受け不可、スタン効果「注意力」０'],
       [77, 'トリプルヒット', '３連続攻撃'],
       [88, '亀甲羅割り', '防御力半分、盾受け不可、Ｂ・Ｄ'],
       [99, '叩きつぶす', '防御力無視、防御行動、カウンター不可、Ｂ・Ｄ'],
       [ 0, 'グランドクロス', '防御無視、盾、カウンター不可、ダメージ２倍、Ｂ・Ｄ、全体攻撃'],]}
  end

  def getWeaponTableClubCounter
    {:name => '棍棒カウンター',
     :table =>
      [[11, 'ブロッキング', '攻撃の無効化'],
       [22, nil, nil],
       [33, nil, nil],
       [44, nil, nil],
       [55, nil, nil],
       [66, 'ジャストミート', '飛び道具のみカウンター'],
       [77, nil, nil],
       [88, nil, nil],
       [99, 'ホームラン', 'すべての攻撃に対するカウンター'],
       [ 0, nil, nil],]}
  end

  def getWeaponTableBow
    {:name => '弓',
     :table =>
      [[11, '影縫い', '麻痺効果「注意力」０'],
       [22, 'アローレイン', '全体攻撃・回避ー５０'],
       [33, '速射', '２連続攻撃'],
       [44, '瞬速の矢', '防御不可'],
       [55, 'バラージシュート', '全体攻撃・盾受け不可・攻撃量２倍'],
       [66, '貫きの矢', '防御力無視、Ｂ・Ｄ'],
       [77, '落鳳波', '回避不可、Ｂ・Ｄ'],
       [88, '皆死ね矢', '全体攻撃、気絶効果「根性」５'],
       [99, 'ミリオンダラー', '三連続攻撃'],
       [ 0, '夢想弓', 'Ｂ・Ｄ、ダメージ３倍'],]}
  end

  def getWeaponTableMartialArt
    {:name => '体術',
     :table =>
      [[11, '集気法', '通常ダメージ分自分のＨＰ回復'],
       [22, 'コンビネーション', '２連続攻撃'],
       [33, '逆一本', '盾受け不可、防御力半分、スタン効果「根性」０'],
       [44, 'コークスクリューブロー', '防御力無視、ダメージ３倍'],
       [55, '練気拳', '全体攻撃・回避不可'],
       [66, 'バベルクランプル', '盾受け不可、Ｂ・Ｄ'],
       [77, 'マシンガンジャブ', '３連続攻撃'],
       [88, 'ナイアガラフォール', '盾受け不可、Ｂ・Ｄ、ダメージ２倍'],
       [99, '羅刹掌', '防御力無視、防御不可、Ｂ・Ｄ、ダメージ３倍'],
       [ 0, '千手観音', '５連続攻撃、すべてカウンター不可'],]}
  end

  def getWeaponTableMartialArtCounter
    {:name => '体術カウンター',
     :table =>
      [[11, 'スウェイバック', '攻撃の無効化'],
       [22, nil, nil],
       [33, '当て身投げ', 'カウンター'],
       [44, nil, nil],
       [55, nil, nil],
       [66, 'ジョルトカウンター', 'クロスカウンター、Ｂ・Ｄ'],
       [77, nil, nil],
       [88, nil, nil],
       [99, 'ガードキャンセル', 'Ｄ１０で振った必殺技によるカウンター' + getRandMartialArtCounter],
       [ 0, nil, nil],]}
  end

  def getRandMartialArtCounter
    value, = roll(1, 10)
    dice = value * 10 + value
    dice = 100 if  value == 110

    tableInfo = getWeaponTableMartialArt
    weaponTable = tableInfo[:table]

    result = " ＞ (#{value})"
    result += getWeaponSkillText(weaponTable, dice)

    return result
  end

  def getWeaponTableBoxing
    {:name => 'ボクシング',
     :table =>
      [[11, 'ワン・ツー', '２連続攻撃・２攻撃目盾受け、回避不可'],
       [22, 'リバーブロー', '麻痺効果「根性」５'],
       [33, 'フリッカー', '２連続攻撃・全て盾受け、カウンター不可'],
       [44, 'コークスクリューブロー', '防御力無視、ダメージ３倍'],
       [55, 'レイ・ガン', '全体攻撃、Ｂ・Ｄ、陽属性魔法攻撃'],
       [66, 'ショットガンブロー', '攻撃量１０倍'],
       [77, 'ハートブレイクショット', '２連続攻撃・１攻撃目防御力無視、ダメージ３倍・２撃目敵無防備'],
       [88, 'デンプシーロール', '３連続攻撃・全てＢ・Ｄ'],
       [99, 'フラッシュピストンマッハパンチ', '全体攻撃、Ｂ・Ｄ、気絶効果「根性」５'],
       [ 0, '右', '防御力無視、ダメージ１０倍'],]}
  end

  def getWeaponTableBoxingCounter
    {:name => 'ボクシングカウンター',
     :table =>
      [[11, 'ダッキングブロー', 'カウンター'],
       [22, 'ジョルトカウンター', 'クロスカウンター、Ｂ・Ｄ'],
       [33, nil, nil],
       [44, nil, nil],
       [55, nil, nil],
       [66, nil, nil],
       [77, nil, nil],
       [88, nil, nil],
       [99, nil, nil],
       [ 0, 'ノーガード戦法', '攻撃の無効化、次ターン以降は自分の盾受け、回避不可、全ての攻撃にＢ・Ｄ'],]}
  end

  def getWeaponTableProWrestling
    {:name => 'プロレス',
     :table =>
      [[11, 'ボディスラム', '盾受け不可'],
       [22, 'ドロップキック', 'Ｂ・Ｄ'],
       [33, '水車落とし', '盾受け不可、成功度＋５'],
       [44, 'ナックルアロー', 'Ｂ・Ｄ、麻痺効果「根性」５'],
       [55, 'ワン・ツー・エルボー', '２連続攻撃'],
       [66, 'バックドロップ', '盾受け不可、ダメージ２倍'],
       [77, '投げっ放しジャーマン', '盾受け不可、防御力無視、成功度＋５'],
       [88, 'パワーボム', '盾受け不可、ダメージ２倍、Ｂ・Ｄ'],
       [99, 'デスバレーボム', '盾受け不可、防御力無視、ダメージ２倍、気絶効果「根性」５'],
       [ 0, 'ジャックハマー', '盾受け不可、防御力無視、ダメージ３倍、成功度＋１０'],]}
  end

  def getWeaponTableProWrestlingCounter
    {:name => 'プロレスカウンター',
     :table =>
      [[22, 'パワースラム', 'カウンター'],
       [55, 'アックスボンバー', 'カウンター、Ｂ・Ｄ'],
       [66, nil, nil],
       [77, nil, nil],
       [88, nil, nil],
       [99, nil, nil],
       [ 0, nil, nil],]}
  end

  def getWeaponTableStand
    {:name => '幽波紋',
     :table =>
      [[11, 'SILER CHARIOT', '攻撃量５倍、刺しタイプ攻撃'],
       [22, 'TOWER OF GRAY', '防御力無視'],
       [33, 'DARK BLUE MOON', '全体攻撃、攻撃量２倍、水属性斬りタイプ攻撃'],
       [44, 'EMPEROR', '回避不可、盾受け不可、カウンター不可、飛び道具攻撃'],
       [55, 'MAGICIAN\'s RED', 'ダメージ２倍、Ｂ・Ｄ、火属性魔法攻撃'],
       [66, 'DEATH 13', 'ダメージ０、全体攻撃、気絶効果「根性」５'],
       [77, 'HIEROPHANT GREEN', '全体攻撃、Ｂ・Ｄ、水属性攻撃'],
       [88, 'VANILLA ICE CREAM', '盾受け不可、カウンター不可、防御力無視、ダメージ３倍、Ｂ・Ｄ'],
       [99, 'THE WORLD', '５連続攻撃、全て敵無防備'],
       [ 0, 'STAR PLATINUM', '攻撃量１５倍、Ｂ・Ｄ'],]}
  end

  def getWeaponTableStandCounter
    {:name => '幽波紋カウンター',
     :table =>
      [[11, 'ANUBIS', '技のみカウンター、ダメージ（カウンターした回数の２乗）倍、斬りタイプ攻撃'],
       [22, nil, nil],
       [33, nil, nil],
       [44, nil, nil],
       [55, nil, nil],
       [66, 'YELLOW TEMPERANE', '魔法・飛び道具含めて全ての攻撃を無効化'],
       [77, nil, nil],
       [88, nil, nil],
       [99, nil, nil],
       [ 0, nil, nil],]}
  end

  def getWeaponSkillText(weaponTable, dice)
    debug('getWeaponSkillText', dice)

    return '' if weaponTable.nil?

    preName = ''
    preEffect = ''

    weaponTable.each do |index, name, effect|
      name ||= preName
      preName = name

      effect ||= preEffect
      preEffect = effect

      next unless index == (dice % 100)

      return " ＞ 「#{name}」#{effect}"
    end

    return ''
  end
end
