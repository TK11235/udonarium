# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/range_table'

class DeadlineHeroes < DiceBot
  # ゲームシステムの識別子
  ID = 'DeadlineHeroes'

  # ゲームシステム名
  NAME = 'デッドラインヒーローズRPG'

  # ゲームシステム名の読みがな
  SORT_KEY = 'てつとらいんひいろおすRPG'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・行為判定（DLHx）
　x：成功率
　例）DLH80
　クリティカル、ファンブルの自動的判定を行います。
　「DLH50+20-30」のように加減算記述も可能。
　成功率は上限100％、下限０％
・デスチャート(DCxY)
　x：チャートの種類。肉体：DCL、精神：DCS、環境：DCC
　Y=マイナス値
　例）DCL5：ライフが -5 の判定
　　　DCS3：サニティーが -3 の判定
　　　DCC0：クレジット 0 の判定
・ヒーローネームチャート（HNC）
・リアルネームチャート　日本（RNCJ）、海外（RNCO）
INFO_MESSAGE_TEXT

  setPrefixes([
    'DLH\\d+([\\+\\-]\\d+)*',
    'DC(L|S|C)\d+',
    'RNC[JO]',
    'HNC'
  ])

  def rollDiceCommand(command)
    case command
    when /^DLH/i
      resolute_action(command)
    when /^DC\w/i
      roll_death_chart(command)
    when 'HNC'
      roll_hero_name_chart()
    else
      roll_tables(command, TABLES)
    end
  end

  private

  def resolute_action(command)
    m = /^DLH(\d+([\+\-]\d+)*)$/.match(command)
    unless m
      return nil
    end

    success_rate = ArithmeticEvaluator.new().eval(m[1])

    roll_result, dice10, dice01 = roll_d100
    roll_result_text = format('%02d', roll_result)

    result = action_result(roll_result, dice10, dice01, success_rate)

    sequence = [
      "行為判定(成功率:#{success_rate}％)",
      "1D100[#{dice10},#{dice01}]=#{roll_result_text}",
      roll_result_text.to_s,
      result
    ]

    return sequence.join(" ＞ ")
  end

  SUCCESS_STR = "成功"
  FAILURE_STR = "失敗"
  CRITICAL_STR = (SUCCESS_STR + " ＞ クリティカル！ パワーの代償１／２").freeze
  FUMBLE_STR = (FAILURE_STR + " ＞ ファンブル！ パワーの代償２倍＆振り直し不可").freeze

  def action_result(total, tens, ones, success_rate)
    if total == 100 || success_rate <= 0
      FUMBLE_STR
    elsif total <= success_rate - 100
      CRITICAL_STR
    elsif tens == ones
      if total <= success_rate
        CRITICAL_STR
      else
        FUMBLE_STR
      end
    elsif total <= success_rate
      SUCCESS_STR
    else
      FAILURE_STR
    end
  end

  def roll_d100
    dice10, = roll(1, 10)
    dice10 = 0 if dice10 == 10
    dice01, = roll(1, 10)
    dice01 = 0 if dice01 == 10

    roll_result = dice10 * 10 + dice01
    roll_result = 100 if roll_result == 0

    return roll_result, dice10, dice01
  end

  class DeathChart
    def initialize(name, chart)
      @name = name
      @chart = chart.freeze

      if @chart.size != 11
        raise ArgumentError, "unexpected chart size #{name.inspect} (given #{@chart.size}, expected 11)"
      end
    end

    # @params bot [#roll]
    # @params minus_score [Integer]
    # @return [String]
    def roll(bot, minus_score)
      dice, = bot.roll(1, 10)
      key_number = dice + minus_score

      key_text, chosen = at(key_number)

      return "デスチャート（#{@name}）[マイナス値:#{minus_score} + 1D10(->#{dice}) = #{key_number}] ＞ #{key_text} ： #{chosen}"
    end

    private

    # key_numberの10から20がindexの0から10に対応する
    def at(key_number)
      if key_number < 10
        ["10以下", @chart.first]
      elsif key_number > 20
        ["20以上", @chart.last]
      else
        [key_number.to_s, @chart[key_number - 10]]
      end
    end
  end

  def roll_death_chart(command)
    m = /^DC([LSC])(\d+)$/i.match(command)
    unless m
      return m
    end

    chart = DEATH_CHARTS[m[1]]
    minus_score = m[2].to_i

    return chart.roll(self, minus_score)
  end

  DEATH_CHARTS = {
    'L' => DeathChart.new(
      '肉体',
      [
        "何も無し。キミは奇跡的に一命を取り留めた。闘いは続く。",
        "激痛が走る。以後、イベント終了時まで、全ての判定の成功率－10％。",
        "キミは［硬直］ポイント２点を得る。［硬直］ポイントを所持している間、キミは「属性：妨害」のパワーを使用することができない。各ラウンド終了時、キミは所持している［硬直］ポイントを１点減らしてもよい。",
        "渾身の一撃!!　キミは〈生存〉判定を行なう。失敗した場合、［死亡］する。",
        "キミは［気絶］ポイント２点を得る。［気絶］ポイントを所持している間、キミはあらゆるパワーを使用できず、自身のターンを得ることもできない。各ラウンド終了時、キミは所持している［気絶］ポイントを１点減らしてもよい。",
        "以後、イベント終了時まで、全ての判定の成功率－20％。",
        "記録的一撃!!　キミは〈生存〉－20％の判定を行なう。失敗した場合、［死亡］する。",
        "キミは［瀕死］ポイント２点を得る。［瀕死］ポイントを所持している間、キミはあらゆるパワーを使用できず、自身のターンを得ることもできない。各ラウンド終了時、キミは所持している［瀕死］ポイントを１点を失う。全ての［瀕死］ポイントを失う前に戦闘が終了しなかった場合、キミは［死亡］する。",
        "叙事詩的一撃!!　キミは〈生存〉－30％の判定を行なう。失敗した場合、［死亡］する。",
        "以後、イベント終了時まで、全ての判定の成功率－30％。",
        "神話的一撃!!　キミは宙を舞って三回転ほどした後、地面に叩きつけられる。見るも無惨な姿。肉体は原型を留めていない（キミは［死亡］した）。",
      ]
    ),
    'S' => DeathChart.new(
      '精神',
      [
        "何も無し。キミは歯を食いしばってストレスに耐えた。",
        "以後、イベント終了時まで、全ての判定の成功率－10％。",
        "キミは［恐怖］ポイント２点を得る。［恐怖］ポイントを所持している間、キミは「属性：攻撃」のパワーを使用できない。各ラウンド終了時、キミは所持している［恐怖］ポイントを１点減らしてもよい。",
        "とても傷ついた。キミは〈意志〉判定を行なう。失敗した場合、［絶望］してＮＰＣとなる。",
        "キミは［気絶］ポイント２点を得る。［気絶］ポイントを所持している間、キミはあらゆるパワーを使用できず、自身のターンを得ることもできない。各ラウンド終了時、キミは所持している［気絶］ポイントを１点減らしてもよい。",
        "以後、イベント終了時まで、全ての判定の成功率－20％。",
        "信じるものに裏切られたような痛み。キミは〈意志〉－20％の判定を行なう。失敗した場合、［絶望］してＮＰＣとなる。",
        "キミは［混乱］ポイント２点を得る。［混乱］ポイントを所持している間、キミは本来味方であったキャラクターに対して、可能な限り最大の被害を与える様、行動し続ける。各ラウンド終了時、キミは所持している［混乱］ポイントを１点減らしてもよい。",
        "あまりに残酷な現実。キミは〈意志〉－30％の判定を行なう。失敗した場合、［絶望］してＮＰＣとなる。",
        "以後、イベント終了時まで、全ての判定の成功率－30％。",
        "宇宙開闢の理に触れるも、それは人類の認識限界を超える何かであった。キミは［絶望］し、以後ＮＰＣとなる。",
      ]
    ),
    'C' => DeathChart.new(
      '環境',
      [
        "何も無し。キミは黒い噂を握りつぶした。",
        "以後、イベント終了時まで、全ての判定の成功率－10％。",
        "ピンチ！　以後、イベント終了時まで、キミは《支援》を使用できない。",
        "裏切り!!　キミは〈経済〉判定を行なう。失敗した場合、キミはヒーローとしての名声を失い、［汚名］を受ける。",
        "以後、シナリオ終了時まで、代償にクレジットを消費するパワーを使用できない。",
        "キミの悪評は大変なもののようだ。協力者からの支援が打ち切られる。以後、シナリオ終了時まで、全ての判定の成功率－20％。",
        "信頼の失墜!!　キミは〈経済〉－20％の判定を行なう。失敗した場合、キミはヒーローとしての名声を失い、［汚名］を受ける。",
        "以後、シナリオ終了時まで、【環境】系の技能のレベルがすべて０となる。",
        "捏造報道!!　身の覚えのない犯罪への荷担が、スクープとして報道される。キミは〈経済〉－30％の判定を行なう。失敗した場合、キミはヒーローとしての名声を失い、［汚名］を受ける。",
        "以後、イベント終了時まで、全ての判定の成功率－30％。",
        "キミの名は史上最悪の汚点として永遠に歴史に刻まれる。もはやキミを信じる仲間はなく、キミを助ける社会もない。キミは［汚名］を受けた。",
      ]
    )
  }.freeze

  class RealNameChart < RangeTable
    def initialize(name, columns, chart)
      items = chart.map { |l| mix_column(columns, l) }
      super(name, "1D100", items)
    end

    private

    def mix_column(columns, item)
      range, names = item
      if names.size == 1
        return range, names[0]
      end

      candidate = columns.zip(names).map { |l| "\n" + l.join(": ") }.join("")
      return range, candidate
    end
  end

  TABLES = {
    'RNCJ' => RealNameChart.new(
      'リアルネームチャート（日本）',
      ['姓', '名（男）', '名（女）'],
      [
        [ 1..6, ['アイカワ／相川、愛川', 'アキラ／晶、章', 'アン／杏']],
        [ 7..12, ['アマミヤ／雨宮', 'エイジ／映司、英治', 'イノリ／祈鈴、祈']],
        [13..18, ['イブキ／伊吹', 'カズキ／和希、一輝', 'エマ／英真、恵茉']],
        [19..24, ['オガミ／尾上', 'ギンガ／銀河', 'カノン／花音、観音']],
        [25..30, ['カイ／甲斐', 'ケンイチロウ／健一郎', 'サラ／沙羅']],
        [31..36, ['サカキ／榊、阪木', 'ゴウ／豪、剛', 'シズク／雫']],
        [37..42, ['シシド／宍戸', 'ジロー／次郎、治郎', 'チズル／千鶴、千尋']],
        [43..48, ['タチバナ／橘、立花', 'タケシ／猛、武', 'ナオミ／直美、尚美']],
        [49..54, ['ツブラヤ／円谷', 'ツバサ／翼', 'ハル／華、波留']],
        [55..60, ['ハヤカワ／早川', 'テツ／鉄、哲', 'ヒカル／光']],
        [61..66, ['ハラダ／原田', 'ヒデオ／英雄', 'ベニ／紅']],
        [67..72, ['フジカワ／藤川', 'マサムネ／正宗、政宗', 'マチ／真知、町']],
        [73..78, ['ホシ／星', 'ヤマト／大和', 'ミア／深空、美杏']],
        [79..84, ['ミゾグチ／溝口', 'リュウセイ／流星', 'ユリコ／由里子']],
        [85..90, ['ヤシダ／矢志田', 'レツ／烈、裂', 'ルイ／瑠衣、涙']],
        [91..96, ['ユウキ／結城', 'レン／連、錬', 'レナ／玲奈']],
        [97..100, ['名無し（何らかの理由で名前を持たない、もしくは失った）']],
      ]
    ),
    'RNCO' => RealNameChart.new(
      'リアルネームチャート（海外）',
      ['名（男）', '名（女）', '姓'],
      [
        [ 1..6, ['アルバス', 'アイリス', 'アレン']],
        [ 7..12, ['クリス', 'オリーブ', 'ウォーケン']],
        [13..18, ['サミュエル', 'カーラ', 'ウルフマン']],
        [19..24, ['シドニー', 'キルスティン', 'オルセン']],
        [25..30, ['スパイク', 'グウェン', 'カーター']],
        [31..36, ['ダミアン', 'サマンサ', 'キャラダイン']],
        [37..42, ['ディック', 'ジャスティナ', 'シーゲル']],
        [43..48, ['デンゼル', 'タバサ', 'ジョーンズ']],
        [49..54, ['ドン', 'ナディン', 'パーカー']],
        [55..60, ['ニコラス', 'ノエル', 'フリーマン']],
        [61..66, ['ネビル', 'ハーリーン', 'マーフィー']],
        [67..72, ['バリ', 'マルセラ', 'ミラー']],
        [73..78, ['ビリー', 'ラナ', 'ムーア']],
        [79..84, ['ブルース', 'リンジー', 'リーヴ']],
        [85..90, ['マーヴ', 'ロザリー', 'レイノルズ']],
        [91..96, ['ライアン', 'ワンダ', 'ワード']],
        [97..100, ['名無し（何らかの理由で名前を持たない、もしくは失った）']],
      ]
    )
  }.freeze

  def roll_hero_name_chart()
    dice, = roll(1, 10)
    template = HERO_NAME_TEMPLATES[dice - 1]

    template_result = "ヒーローネームチャート(#{dice}) ＞ #{template[:text]}"
    if template[:text] == "任意"
      return template_result
    end

    results = [template_result]
    elements = []
    template[:elements].each do |type|
      base_chart = HERO_NAME_BASE_CHARTS[type]
      unless base_chart
        elements.push(type)
        next
      end

      result, element = base_chart.roll(self)
      results.push(result)
      elements.push(element)
    end

    hero_name = elements.join("").gsub(/・{2,}/, "・").sub(/・$/, "")
    results.push("ヒーローネーム ＞ #{hero_name}")

    return results.join("\n")
  end

  HERO_NAME_TEMPLATES = [
    {:text => 'ベースＡ＋ベースＡ', :elements => ['ベースＡ', 'ベースＢ']},
    {:text => 'ベースＢ', :elements => ['ベースＢ']},
    {:text => 'ベースＢ×2回', :elements => ['ベースＢ', 'ベースＢ']},
    {:text => 'ベースＢ＋ベースＣ', :elements => ['ベースＢ', 'ベースＣ']},
    {:text => 'ベースＡ＋ベースＢ＋ベースＣ', :elements => ['ベースＡ', 'ベースＢ', 'ベースＣ']},
    {:text => 'ベースＡ＋ベースＢ×2回', :elements => ['ベースＡ', 'ベースＢ', 'ベースＢ']},
    {:text => 'ベースＢ×2回＋ベースＣ', :elements => ['ベースＢ', 'ベースＢ', 'ベースＣ']},
    {:text => '（ベースＢ）・オブ・（ベースＢ）', :elements => ['ベースＢ', '・オブ・', 'ベースＢ']},
    {:text => '（ベースＢ）・ザ・（ベースＢ）', :elements => ['ベースＢ', '・ザ・', 'ベースＢ']},
    {:text => '任意', :elements => ['任意']},
  ].freeze

  class HeroNameBaseChart
    def initialize(name, items)
      @name = name
      @items = items
    end

    # @param bot [#roll]
    # @return [Array<(String, String)>]
    def roll(bot)
      dice, = bot.roll(1, 10)
      chosen = @items[dice - 1]

      result = "#{@name}(#{dice}) ＞ #{chosen}"
      if (m = chosen.match(/^［(.+)］$/))
        element_type = m[1]
        element_chart = HERO_NAME_ELEMENT_CHARTS[element_type]

        element_result, chosen = element_chart.roll(bot)
        result = [result, element_result].join(" ＞ ")
      end

      return result, chosen
    end
  end

  class HeroNameElementChart
    def initialize(name, items)
      @name = name
      @items = items
    end

    # @param bot [#roll]
    # @return [Array<(String, String)>]
    def roll(bot)
      dice, = bot.roll(1, 10)
      chosen = @items[dice - 1]

      result = "#{@name}(#{dice}) ＞ #{chosen[:element]} （意味：#{chosen[:mean]}）"
      return result, chosen[:element]
    end
  end

  HERO_NAME_BASE_CHARTS = {
    "ベースＡ" => HeroNameBaseChart.new(
      "ベースＡ",
      [
        "ザ・",
        "キャプテン・",
        "ミスター／ミス／ミセス・",
        "ドクター／プロフェッサー・",
        "ロード／バロン／ジェネラル・",
        "マン・オブ・",
        "［強さ］",
        "［色］",
        "マダム／ミドル・",
        "数字（1～10）・",
      ]
    ),
    "ベースＢ" => HeroNameBaseChart.new(
      "ベースＢ",
      [
        "［神話／夢］",
        "［武器］",
        "［動物］",
        "［鳥］",
        "［虫／爬虫類］",
        "［部位］",
        "［光］",
        "［攻撃］",
        "［その他］",
        "数字（1～10）・",
      ]
    ),
    "ベースＣ" => HeroNameBaseChart.new(
      "ベースＣ",
      [
        "マン／ウーマン",
        "ボーイ／ガール",
        "マスク／フード",
        "ライダー",
        "マスター",
        "ファイター／ソルジャー",
        "キング／クイーン",
        "［色］",
        "ヒーロー／スペシャル",
        "ヒーロー／スペシャル",
      ]
    ),
  }.freeze

  HERO_NAME_ELEMENT_CHARTS = {
    "部位" => HeroNameElementChart.new(
      "部位",
      [
        {:element => "ハート", :mean => "心臓"},
        {:element => "フェイス", :mean => "顔"},
        {:element => "アーム", :mean => "腕"},
        {:element => "ショルダー", :mean => "肩"},
        {:element => "ヘッド", :mean => "頭"},
        {:element => "アイ", :mean => "眼"},
        {:element => "フィスト", :mean => "拳"},
        {:element => "ハンド", :mean => "手"},
        {:element => "クロウ", :mean => "爪"},
        {:element => "ボーン", :mean => "骨"},
      ]
    ),
    "武器" => HeroNameElementChart.new(
      "武器",
      [
        {:element => "ナイヴス", :mean => "短剣"},
        {:element => "ソード", :mean => "剣"},
        {:element => "ハンマー", :mean => "鎚"},
        {:element => "ガン", :mean => "銃"},
        {:element => "スティール", :mean => "刃"},
        {:element => "タスク", :mean => "牙"},
        {:element => "ニューク", :mean => "核"},
        {:element => "アロー", :mean => "矢"},
        {:element => "ソウ", :mean => "ノコギリ"},
        {:element => "レイザー", :mean => "剃刀"},
      ]
    ),
    "色" => HeroNameElementChart.new(
      "色",
      [
        {:element => "ブラック", :mean => "黒"},
        {:element => "グリーン", :mean => "緑"},
        {:element => "ブルー", :mean => "青"},
        {:element => "イエロー", :mean => "黃"},
        {:element => "レッド", :mean => "赤"},
        {:element => "バイオレット", :mean => "紫"},
        {:element => "シルバー", :mean => "銀"},
        {:element => "ゴールド", :mean => "金"},
        {:element => "ホワイト", :mean => "白"},
        {:element => "クリア", :mean => "透明"},
      ]
    ),
    "動物" => HeroNameElementChart.new(
      "動物",
      [
        {:element => "バニー", :mean => "ウサギ"},
        {:element => "タイガー", :mean => "虎"},
        {:element => "シャーク", :mean => "鮫"},
        {:element => "キャット", :mean => "猫"},
        {:element => "コング", :mean => "ゴリラ"},
        {:element => "ドッグ", :mean => "犬"},
        {:element => "フォックス", :mean => "狐"},
        {:element => "パンサー", :mean => "豹"},
        {:element => "アス", :mean => "ロバ"},
        {:element => "バット", :mean => "蝙蝠"},
      ]
    ),
    "神話／夢" => HeroNameElementChart.new(
      "神話／夢",
      [
        {:element => "アポカリプス", :mean => "黙示録"},
        {:element => "ウォー", :mean => "戦争"},
        {:element => "エターナル", :mean => "永遠"},
        {:element => "エンジェル", :mean => "天使"},
        {:element => "デビル", :mean => "悪魔"},
        {:element => "イモータル", :mean => "死なない"},
        {:element => "デス", :mean => "死神"},
        {:element => "ドリーム", :mean => "夢"},
        {:element => "ゴースト", :mean => "幽霊"},
        {:element => "デッド", :mean => "死んでいる"},
      ]
    ),
    "攻撃" => HeroNameElementChart.new(
      "攻撃",
      [
        {:element => "ストローク", :mean => "一撃"},
        {:element => "クラッシュ", :mean => "壊す"},
        {:element => "ブロウ", :mean => "吹き飛ばす"},
        {:element => "ヒット", :mean => "打つ"},
        {:element => "パンチ", :mean => "殴る"},
        {:element => "キック", :mean => "蹴る"},
        {:element => "スラッシュ", :mean => "斬る"},
        {:element => "ペネトレイト", :mean => "貫く"},
        {:element => "ショット", :mean => "撃つ"},
        {:element => "キル", :mean => "殺す"},
      ]
    ),
    "その他" => HeroNameElementChart.new(
      "その他",
      [
        {:element => "ヒューマン", :mean => "人間"},
        {:element => "エージェント", :mean => "代理人"},
        {:element => "ブースター", :mean => "泥棒"},
        {:element => "アイアン", :mean => "鉄"},
        {:element => "サンダー", :mean => "雷"},
        {:element => "ウォッチャー", :mean => "監視者"},
        {:element => "プール", :mean => "水たまり"},
        {:element => "マシーン", :mean => "機械"},
        {:element => "コールド", :mean => "冷たい"},
        {:element => "サイド", :mean => "側面"},
      ]
    ),
    "鳥" => HeroNameElementChart.new(
      "鳥",
      [
        {:element => "ホーク", :mean => "鷹"},
        {:element => "ファルコン", :mean => "隼"},
        {:element => "キャナリー", :mean => "カナリア"},
        {:element => "ロビン", :mean => "コマツグミ"},
        {:element => "イーグル", :mean => "鷲"},
        {:element => "オウル", :mean => "フクロウ"},
        {:element => "レイブン", :mean => "ワタリガラス"},
        {:element => "ダック", :mean => "アヒル"},
        {:element => "ペンギン", :mean => "ペンギン"},
        {:element => "フェニックス", :mean => "不死鳥"},
      ]
    ),
    "光" => HeroNameElementChart.new(
      "光",
      [
        {:element => "ライト", :mean => "光"},
        {:element => "シャドウ", :mean => "影"},
        {:element => "ファイアー", :mean => "炎"},
        {:element => "ダーク", :mean => "暗い"},
        {:element => "ナイト", :mean => "夜"},
        {:element => "ファントム", :mean => "幻影"},
        {:element => "トーチ", :mean => "灯火"},
        {:element => "フラッシュ", :mean => "閃光"},
        {:element => "ランタン", :mean => "手さげランプ"},
        {:element => "サン", :mean => "太陽"},
      ]
    ),
    "虫／爬虫類" => HeroNameElementChart.new(
      "虫／爬虫類",
      [
        {:element => "ビートル", :mean => "甲虫"},
        {:element => "バタフライ／モス", :mean => "蝶／蛾"},
        {:element => "スネーク／コブラ", :mean => "蛇"},
        {:element => "アリゲーター", :mean => "ワニ"},
        {:element => "ローカスト", :mean => "バッタ"},
        {:element => "リザード", :mean => "トカゲ"},
        {:element => "タートル", :mean => "亀"},
        {:element => "スパイダー", :mean => "蜘蛛"},
        {:element => "アント", :mean => "アリ"},
        {:element => "マンティス", :mean => "カマキリ"},
      ]
    ),
    "強さ" => HeroNameElementChart.new(
      "強さ",
      [
        {:element => "スーパー／ウルトラ", :mean => "超"},
        {:element => "ワンダー", :mean => "驚異的"},
        {:element => "アルティメット", :mean => "究極の"},
        {:element => "ファンタスティック", :mean => "途方もない"},
        {:element => "マイティ", :mean => "強い"},
        {:element => "インクレディブル", :mean => "凄い"},
        {:element => "アメージング", :mean => "素晴らしい"},
        {:element => "ワイルド", :mean => "狂乱の"},
        {:element => "グレイテスト", :mean => "至高の"},
        {:element => "マーベラス", :mean => "驚くべき"},
      ]
    ),
  }.freeze
end
