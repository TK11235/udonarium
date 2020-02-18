# -*- coding: utf-8 -*-

class TrinitySeven < DiceBot
  setPrefixes(['(\d+)DM\d+(\+|\-)?\d*', '(\d+)DM(\+|\-)?\d*', 'TR(\d+)<=(\d+)(\+|\-)?\d*', 'TR<=(\d+)(\+|\-)?\d*', 'TR(\+|\-)?(\d+)<=(\d+)(\+|\-)?\d*', 'TRNAME'])

  def initialize
    super
  end

  def gameName
    'トリニティセブンRPG'
  end

  def gameType
    "TrinitySeven"
  end

  def getHelpMessage
    return <<MESSAGETEXT
クリティカルが変動した命中及び、7の出目がある場合のダメージ計算が行なえます。
なお、通常の判定としても利用できます。

・発動/命中　［TR(±c*)<=(x）±（y*）又は TR<=(x）など］*は必須ではない項目です。
"TR(クリティカルの修正値*)＜＝(発動/命中)±(発動/命中の修正値*)"
加算減算のみ修正値も付けられます。 ［修正値］は必須ではありません。
例）TR<=50	TR＜＝60＋20	TR7＜＝40	TR-7＜＝80	TR＋10＜＝80＋20

・ダメージ計算　［（x)DM(c*)±(y*）又は（x)DM(c*)又は（x)DM±(y*）］*は必須ではない項目です。
"(ダイス数)DM(7の出目の数*)＋(修正*)"
加算減算のみ修正値も付けられます。 ［7の出目の数］および［修正値］は必須ではありません。
例）6DM2+1	5DM2	4DM		3DM+3
後から7の出目に変更する場合はC(7*6＋5)のように入力して計算してください。

・名前表　[TRNAME]
名字と名前を出します。PCや突然現れたNPCの名付けにどうぞ。

MESSAGETEXT
  end

  def rollDiceCommand(command) # スパゲッティなコードだけど許して！！！ → 絶対に許さない。全力でリファクタリングした。
    debug("rollDiceCommand command", command)

    string = command.upcase
    if /TRNAME/ =~ command
      firstName, total_n = get_NAME_table
      secondName, total_o =  get_NAMEtwo_table
      return "#{firstName} , #{secondName}"
    end

    if /^TR([\+\-\d]*)<=([\d]*)([\+\-\d]*)/ =~ command
      critical = Regexp.last_match(1).to_i + 7
      target = Regexp.last_match(2).to_i
      modify = Regexp.last_match(3).to_i
      return rollHit(command, critical, target, modify)
    end

    critical = 0

    if /([\d]*)DM([\d]*)([\+\-\d]*)/ =~ command
      diceCount = Regexp.last_match(1).to_i
      critical = Regexp.last_match(2).to_i
      modify = Regexp.last_match(3).to_i
      return rollDamage(command, diceCount, critical, modify)
    end

    return ''
  end

  def rollHit(command, critical, target, modify)
    target += modify

    total, diceText, = roll(1, 100)
    result = getHitRollResult(total, target, critical)

    text = "(#{command}) ＞ #{total}[#{diceText}] ＞ #{result}"
    debug("rollDiceCommand result text", text)

    return text
  end

  def getHitRollResult(total, target, critical)
    return "ファンブル" if total >= 96
    return "クリティカル" if total <= critical

    return "成功" if total <= target

    return "失敗"
  end

  def rollDamage(command, diceCount, critical, modify)
    return "" if diceCount < critical

    total, diceText, = roll(diceCount, 6)

    additionalListText = ""
    total, additionalList = getRollDamageCritialText(diceCount, critical, total, diceText, modify)

    additionalListText = "→[#{additionalList.join(',')}]" unless additionalList.empty?

    modifyText = ""
    modifyText = "+#{modify}" if modify > 0
    modifyText = modify.to_s if modify < 0

    text = "(#{command}) [#{diceText}]#{additionalListText}#{modifyText} ＞ #{total}"

    return text
  end

  def getRollDamageCritialText(diceCount, critical, total, diceText, modify)
    diceList = []

    if critical == 0
      total += modify
      return total, diceList
    end

    diceList = diceText.split(/,/).collect { |i| i.to_i }

    diceList.sort!
    restDice = diceList.clone

    critical = diceCount if critical > diceCount

    critical.times do
      restDice.shift
      diceList.shift
      diceList.push(7)
    end

    max = restDice.pop
    max = 1 if max.nil?

    total = max * (7**critical) + modify
    restDice.each { |i| total += i }

    return total, diceList
  end

  def check_1D100(_total_n, dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)
    return " ＞ ファンブル" if dice_n >= 96
    return " ＞ クリティカル" if dice_n <= 7
  end

  # 名前表
  def get_NAME_table
    table = [
      [1, '春日'],
      [2, '浅見'],
      [3, '風間'],
      [4, '神無月'],
      [5, '倉田'],
      [6, '不動'],
      [7, '山奈'],
      [8, 'シャルロック'],
      [9, '霧隠'],
      [10, '果心'],
      [11, '今井'],
      [12, '長瀬'],
      [13, '明智'],
      [14, '風祭'],
      [15, '志貫'],
      [16, '一文字'],
      [17, '月夜野'],
      [18, '桜田門'],
      [19, '果瀬'],
      [20, '九十九'],
      [21, '速水'],
      [22, '片桐'],
      [23, '葉月'],
      [24, 'ウィンザー'],
      [25, '時雨里'],
      [26, '神城'],
      [27, '水際'],
      [28, '一ノ江'],
      [29, '仁藤'],
      [30, '北千住'],
      [31, '西村'],
      [32, '諏訪'],
      [33, '藤宮'],
      [34, '御代'],
      [35, '橘'],
      [36, '霧生'],
      [37, '白石'],
      [38, '椎名'],
      [39, '綾小路'],
      [40, '二条'],
      [41, '光明寺'],
      [42, '春秋'],
      [43, '雪見'],
      [44, '刀条院'],
      [45, 'ランカスター'],
      [46, 'ハクア'],
      [47, 'エルタニア'],
      [48, 'ハーネス'],
      [49, 'アウグストゥス'],
      [50, '椎名町'],
      [51, '鍵守'],
      [52, '茜ヶ崎'],
      [53, '鎮宮'],
      [54, '美柳'],
      [55, '鎖々塚'],
      [56, '櫻ノ杜'],
      [57, '鏡ヶ守'],
      [58, '輝井'],
      [59, '南陽'],
      [60, '雪乃城'],
      [61, '六角屋'],
      [62, '鈴々'],
      [63, '東三条'],
      [64, '朱雀院'],
      [65, '青龍院'],
      [66, '白虎院'],
      [67, '玄武院'],
      [68, '麒麟院'],
      [69, 'リーシュタット'],
      [70, 'サンクチュアリ'],
      [71, '六実'],
      [72, '須藤'],
      [73, 'ミレニアム'],
      [74, '七里'],
      [75, '三枝'],
      [76, '八殿'],
      [77, '藤里'],
      [78, '久宝'],
      [79, '東'],
      [80, '赤西'],
      [81, '神ヶ崎'],
      [82, 'グランシア'],
      [83, 'ダークブーレード'],
      [84, '天光寺'],
      [85, '月見里'],
      [86, '璃宮'],
      [87, '藤見澤'],
      [88, '赤聖'],
      [89, '姫宮'],
      [90, '華ノ宮'],
      [91, '天才'],
      [92, '達人'],
      [93, '賢者'],
      [94, '疾風'],
      [95, '海の'],
      [96, '最強'],
      [97, '凶器'],
      [98, '灼熱'],
      [99, '人間兵器'],
      [100, '魔王'],
    ]

    dice_now, = roll(1, 100)
    output = get_table_by_number(dice_now, table)

    return get_table_by_number(dice_now, table)
  end

  def get_NAMEtwo_table
    table = [
      [1, 'アラタ/聖'],
      [2, 'アビィス/リリス'],
      [3, 'ルーグ/レヴィ'],
      [4, 'ラスト/アリン'],
      [5, 'ソラ/ユイ'],
      [6, 'イーリアス/アキオ'],
      [7, 'アカーシャ/ミラ'],
      [8, 'アリエス/リーゼロッテ'],
      [9, 'ムラサメ/シャルム'],
      [10, '龍貴/竜姫'],
      [11, '英樹/春菜'],
      [12, '準一/湊'],
      [13, '急司郎/光理'],
      [14, '夕也/愛奈'],
      [15, '晴彦/アキ'],
      [16, '疾風/ヤシロ'],
      [17, 'カガリ/灯花'],
      [18, '次郎/優都'],
      [19, '春太郎/静理'],
      [20, 'ジン/時雨'],
      [21, 'イオリ/伊織'],
      [22, 'ユウヒ/優姫'],
      [23, 'サツキ/翠名'],
      [24, 'シュライ/サクラ'],
      [25, 'ミナヅキ/姫乃'],
      [26, 'カエデ/優樹菜'],
      [27, 'ハル/フユ'],
      [28, 'オｄール/瑞江'],
      [29, 'ニトゥレスト/キリカ'],
      [30, 'スカー/綾瀬'],
      [31, '真夏/小夏'],
      [32, '光一/ののか'],
      [33, '彩/翠'],
      [34, 'トウカ/柊花'],
      [35, '命/ミコト'],
      [36, '司/つかさ'],
      [37, 'ゆとり/なごみ'],
      [38, '冬彦/観月'],
      [39, 'カレン/華恋'],
      [40, '清次郎/亜矢'],
      [41, 'サード/夢子'],
      [42, 'ボックス/詩子'],
      [43, 'ヘリオス/カエデ'],
      [44, 'ゲート/京香'],
      [45, 'オンリー/パトリシア'],
      [46, 'ザッハーク/アーリ'],
      [47, 'ラスタバン/ラスティ'],
      [48, '桜花/燁澄'],
      [49, '計都/リヴィア'],
      [50, 'カルヴァリオ/香夜'],
      [51, '悠人/夜々子'],
      [52, '太子/羽菜'],
      [53, '夕立/夕凪'],
      [54, 'アルフ/愛美'],
      [55, 'ファロス/灯利'],
      [56, 'スプートニク/詩姫'],
      [57, 'アーネスト/累'],
      [58, 'ナイン/カグヤ'],
      [59, 'クリア/ヒマワリ'],
      [60, 'ウォーカー/オリビア'],
      [61, 'ダーク/クオン'],
      [62, 'ウェイヴ/凛'],
      [63, 'ルーン/マリエ'],
      [64, 'エンギ/セイギ'],
      [65, 'シラヌイ/ミライ'],
      [66, 'ブライン/キズナ'],
      [67, 'クロウ/カナタ'],
      [68, 'スレイヤー/ヒカル'],
      [69, 'レス/ミリアリア'],
      [70, 'ミフユ/サリエル'],
      [71, '鳴央/音央'],
      [72, 'モンジ/理亜'],
      [73, 'パルデモントゥム/スナオ'],
      [74, 'ミシェル/詩穂'],
      [75, 'フレンズ/サン'],
      [76, 'サトリ/識'],
      [77, 'ロード/唯花'],
      [78, 'クロノス/久宝'],
      [79, 'フィラデルフィア/冬海'],
      [80, 'ティンダロス/美星'],
      [81, '勇弥/ユーリス'],
      [82, 'エイト/アンジェラ'],
      [83, 'サタン/ルシエル'],
      [84, 'エース/小波'],
      [85, 'セージ/胡蝶'],
      [86, '忍/千之'],
      [87, '重吾/キリコ'],
      [88, 'マイケル/ミホシ'],
      [89, 'カズマ/鶴香'],
      [90, 'ヤマト/エリシエル'],
      [91, '歴史上の人物の名前（信長、ジャンヌなど）'],
      [92, 'スポーツ選手の名前（ベッカム、沙保里など）'],
      [93, '学者の名前（ソクラテス、エレナなど）'],
      [94, 'アイドルの名前（タクヤ、聖子など）'],
      [95, '土地、国、町の名前（イングランド、ワシントンなど）'],
      [96, 'モンスターの名前（ドラゴン、ラミアなど）'],
      [97, '武器防具の名前（ソード、メイルなど）'],
      [98, '自然現象の名前（カザンハリケーンなど）'],
      [99, '機械の名前（洗濯機、テレビなど）'],
      [100, '目についた物の名前（シャーペン、メガネなど）'],
    ]

    dice_now, = roll(1, 100)
    output = get_table_by_number(dice_now, table)

    return get_table_by_number(dice_now, table)
  end
end
