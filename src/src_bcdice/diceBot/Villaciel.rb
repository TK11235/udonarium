# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Villaciel < DiceBot
  # ゲームシステムの識別子
  ID = 'Villaciel'

  # ゲームシステム名
  NAME = '蒼天のヴィラシエル'

  # ゲームシステム名の読みがな
  SORT_KEY = 'そうてんのういらしえる'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・判定　　　　　　　　nVBS[>=d]
　[]内省略時は達成数の計算のみ。トライアンフあり。
　n: ダイス数、d: 難易度
・フロンティア判定　　nVF
　n: ダイス数
　nVBSを行い、うでまえ表を参照した結果を表示します。
・採掘スキル判定　　　nVM
　n: ダイス数
　判定に成功した場合、自動的に獲得できるアイテム数も表示されます。
・宝石加工スキル判定　nVG
　n: ダイス数
・前職表　　　　　　　PJ[x]    x=V,A
　[]内は省略可能。
　PJ, PJV: 「蒼天のヴィラシエル」掲載の前職表　PJA: 「白雲のアルメサール」掲載の前職表
・ぷちクエスト表　　　PQ[x]    x=V,A
　[]内は省略可能。
　PQ, PQV: 「蒼天のヴィラシエル」掲載のぷちクエスト表　PQA: 「白雲のアルメサール」掲載のぷちクエスト表
・アクシデント表　　　AC
・もふもふ表　　　　　MMx      x=I,A,V,VV,VA,D
  MMI: 昆虫　MMA: 動物　MMV, MMVV: ヴィラシエル種（「蒼天のヴィラシエル」掲載）　MMVA: ヴィラシエル種（「白雲のアルメサール」掲載）　MMD: 鋼龍種
・釣り表　　　　　　　Fx       x=L,R,W,G,B,C,S
　FL: 湖　FR: 河　FW: 白雲　FG: 灰雲　FB: 黒雲　FC: 共通　FS: 塩湖
・不食植物表　　　　　IP[x]    x=V,A
　IP, IPV: 「蒼天のヴィラシエル」掲載の不食植物表　IPA: 「白雲のアルメサール」掲載の不食植物表
・可食植物表　　　　　EP[x][n] x=V,A
　[]内は省略可能。
　n: 可食植物表番号
　EP[n], EPV[n]: 「蒼天のヴィラシエル」掲載の可食植物表。[]内省略時はnを1D6で決定し、EPVnを実行。ただし、1D6の出目が6ならば、「好きな表を選んでおっけー！」と表示。
　EPA[n]: 「白雲のアルメサール」掲載の可食植物表。[]内省略時は1D6を振り、出目が偶数ならばEPA1、奇数ならばEPA2を実行。
・変異植物表　　　　　MP
・改良種表　　　　　　IS
MESSAGETEXT

  setPrefixes(%w(\d+VBS(>=\d+)? \d+VF \d+VM \d+VG PJ[VA]? PQ[VA]? AC MM([IAD]|V[VA]?) F[LRWGBCS] IP[VA]? EP[VA]?\d? MP IS))

  def initialize
    super

    @sortType = 0 # 足し算ダイス、バラバラロール、どちらもソートしない
    @d66Type = 1 # D66あり。ただし、現行ルールにある6x6の表については別のコマンドを用意
    @fractionType = 'roundUp' # 端数は切り上げ
  end

  def rollDiceCommand(command)
    case command
    when /\d+VBS/
      resolute_action(command)
    when /\d+VF/
      resolute_frontier_action(command)
    when /\d+VM/
      resolute_mining_action(command)
    when /\d+VG/
      resolute_cutting_gem_action(command)
    when /PJ[VA]?/
      use_previous_job_chart(command)
    when /PQ[VA]?/
      use_petit_quest_chart(command)
    when 'AC'
      use_accident_chart(command)
    when /MM([IAD]|V[VA]?)/
      use_mohumohu_chart(command)
    when /F[LRWGBCS]/
      use_fishing_chart(command)
    when /IP[VA]?/
      use_inedible_plant_chart(command)
    when /EP[VA]?\d?/
      use_edible_plant_chart(command)
    when 'MP'
      use_mutant_plant_chart(command)
    when 'IS'
      use_improved_species_chart(command)
    end
  end

  private

  D6 = 6
  LEAST_SUCCESS_ROLL = 4
  SUCCESS_STR = ' ＞ 成功'
  FAILURE_STR = ' ＞ 失敗'

  def derive_achievement(num_dices, command)
    # rollメソッドの引数は、順に「ダイス数」「ダイス1個の出目最大値」「結果のソート」「出目振り足しの基準値（0や1にしておけば処理は行われない）」「成功数を数えるときの比較条件」「成功数の基準値」「振り直しをする出目の基準値」
    # 戻り値は、順に「合計した出目」「ロール結果出力用文字列」「出目が1だったダイスの数」「出目が最大値だったダイスの数」「出目の最大値」「成功数」「振り直しすべきダイスの数」
    # 達成数計算の際にはトライアンフ「出目が6だったダイスは達成数2としてカウントする」を考慮する必要があるが、要は「達成数=成功数+出目が最大値だったダイスの数」になる
    roll_results = roll(num_dices, D6, @sortType, 0, '>=', LEAST_SUCCESS_ROLL)
    dice_str = roll_results[1]
    num_triumph_dices = roll_results[3]
    num_successes = roll_results[5]
    achievement = num_successes + num_triumph_dices

    output = "(#{command}) ＞ [#{dice_str}] ＞ 達成数: #{achievement}"
    return achievement, output
  end

  def resolute_action(command)
    match_data = command.match(/(\d+)VBS(>=(\d+))?/)

    num_dices = match_data[1].to_i
    achievement, output = derive_achievement(num_dices, command)
    return output unless match_data[2]

    difficulty = match_data[3].to_i
    output += achievement >= difficulty ? SUCCESS_STR : FAILURE_STR
  end

  SKILL_CHART = %w(左に3マス、上に3マス動かす
                   左に2マス、上に2マス動かす
                   右か下に1マス動かしてもよい
                   右に1マス、下に1マス動かす
                   好きな方向に最大で3マス動かしてもよい（1マスでも良い）
                   好きな方向に最大で5マス動かしてもよい（1〜3マスでもよい）).freeze

  def resolute_frontier_action(command)
    num_dices = command.match(/(\d+)VF/)[1].to_i
    achievement, output = derive_achievement(num_dices, command)

    output += ' ＞ '
    output += case achievement
              when 0 then SKILL_CHART[0]
              when 1 then SKILL_CHART[1]
              when 2 then SKILL_CHART[2]
              when 3, 4 then SKILL_CHART[3]
              when 5..8 then SKILL_CHART[4]
              else SKILL_CHART[5]
              end
  end

  def resolute_difficult_action(num_dices, least_success_roll, command)
    # 1個でもleast_success_roll以上の出目が出たら成功となる判定

    # rollメソッドの引数は、順に「ダイス数」「ダイス1個の出目最大値」「結果のソート」「出目振り足しの基準値（0や1にしておけば処理は行われない）」「成功数を数えるときの比較条件」「成功数の基準値」「振り直しをする出目の基準値」
    # 戻り値は、順に「合計した出目」「ロール結果出力用文字列」「出目が1だったダイスの数」「出目が最大値だったダイスの数」「出目の最大値」「成功数」「振り直しすべきダイスの数」
    # 出目の最大値がnならば「1個でもn以上の出目が出た」ことになる
    roll_results = roll(num_dices, D6, @sortType)
    dice_str = roll_results[1]
    largest_roll = roll_results[4]
    is_successful = largest_roll >= least_success_roll

    output = "(#{command}) ＞ [#{dice_str}]"
    output += is_successful ? SUCCESS_STR : FAILURE_STR

    return output, is_successful
  end

  LEAST_MINING_SUCCESS_ROLL = 5
  LEAST_GEM_SUCCESS_ROLL = 6

  def resolute_mining_action(command)
    num_dices = command.match(/(\d+)VM/)[1].to_i
    output, is_successful = resolute_difficult_action(num_dices, LEAST_MINING_SUCCESS_ROLL, command)
    return output unless is_successful

    roll_result, = roll(1, D6)
    output += " ＞ (1D6) ＞ [#{roll_result}] ＞ アイテムを#{roll_result}個獲得"
  end

  def resolute_cutting_gem_action(command)
    num_dices = command.match(/(\d+)VG/)[1].to_i
    resolute_difficult_action(num_dices, LEAST_GEM_SUCCESS_ROLL, command)[0]
  end

  VILLACIEL_PREVIOUS_JOB_CHART = [['農家: 知力+1 器用さ+1 開拓／1Lv',
                                   '漁師: 知力+1 ひらめき+1 釣り／1Lv',
                                   '狩人: 武力+1 ひらめき+1 穴掘り／1Lv',
                                   '鍛冶職人: 武力+1 器用さ+1 採掘／1Lv',
                                   '牧場主: 仲良し+2 開拓／1Lv',
                                   '採掘師: 器用さ+1 ひらめき+1 採掘／1Lv'].freeze,
                                  ['家事手伝い: 器用さ+1 仲良し+1 調理／1Lv',
                                   '調理師: 知力+1 ひらめき+1 調理／1Lv',
                                   '細工師: 器用さ+2 採掘／1Lv',
                                   '大工: 武力+1 器用さ+1 木こり／1Lv',
                                   '荒くれ者: 武力+2 穴掘り／1Lv',
                                   '王国騎士: 武力+1 知力+1 木こり／1Lv'].freeze].freeze
  ARMESEAR_PREVIOUS_JOB_CHART = [['農家: 知力+1 器用さ+1 開拓／1Lv',
                                  '漁師: 知力+1 ひらめき+1 釣り／1Lv',
                                  '狩人: 武力+1 ひらめき+1 穴掘り／1Lv',
                                  '鍛冶職人: 武力+1 器用さ+1 採掘／1Lv',
                                  '牧場主: 仲良し+2 開拓／1Lv',
                                  '採掘師: 器用さ+1 ひらめき+1 採掘／1Lv'].freeze,
                                 ['羊飼い: 仲良し+2 もふもふ／1Lv',
                                  '芽拾い: 知力+1 武力+1 採集／1Lv',
                                  '服屋見習い: 器用さ+2 裁縫／1Lv',
                                  '革細工見習い: 知力+2 裁縫／1Lv',
                                  '商人: 知力+1 仲良し+1 基礎になるスキル／1Lv',
                                  '旅人: 武力+1 知力+1 基礎になるスキル／1Lv'].freeze,
                                 ['家事手伝い: 器用さ+1 仲良し+1 調理／1Lv',
                                  '調理師: 知力+1 ひらめき+1 調理／1Lv',
                                  '細工師: 器用さ+2 採掘／1Lv or 調合・細工／1Lv',
                                  '大工: 武力+1 器用さ+1 木こり／1Lv',
                                  '荒くれ者: 武力+2 穴掘り／1Lv',
                                  '王国騎士: 武力+1 知力+1 木こり／1Lv'].freeze].freeze

  def use_previous_job_chart(command)
    match_data = command.match(/PJ([VA]?)/)
    chart_symbol = match_data[1] == '' ? 'V' : match_data[1]

    roll_result1, = roll(1, D6)
    chart_text, roll_result2 = case chart_symbol
                               when 'V' then get_table_by_1d6(VILLACIEL_PREVIOUS_JOB_CHART[(roll_result1 - 1) / 3])
                               when 'A' then get_table_by_1d6(ARMESEAR_PREVIOUS_JOB_CHART[(roll_result1 - 1) / 2])
                               end

    chart_title = case chart_symbol
                  when 'V' then '前職表（ヴィラシエル）'
                  when 'A' then '前職表（アルメサール）'
                  end
    "#{chart_title} ＞ [#{roll_result1},#{roll_result2}] ＞ #{chart_text}"
  end

  VILLACIEL_PETIT_QUEST_CHART = [['家の補強のために: 【目的：木を1個納品】【報酬：各自2プサイ】見えを張っていい木材で家を作ったら木材が枯渇しちまった。頼む、原木を分けてくれないか？',
                                  '孫のために: 【目的：花を1個納品】【報酬：各自2プサイ】綺麗な花があればいい色に染められるだろうと思うてな。孫のために必要なの。',
                                  '人間界の草: 【目的：草を2個納品】【報酬：各自3プサイ】魔界にはない草が生えていると噂で聞いたことがある。その草がほしい。',
                                  '種の生存のために: 【目的：可食植物（改良種を除く）を1個納品】【報酬：各自1プサイ】育ちが悪い同種の植物と掛け合わせてみたいのでサンプルがほしい。',
                                  'にんげんのたべもの！: 【目的：可食植物（改良種を除く）を1個納品】【報酬：各自2プサイ】ひゅーいあはなにをたべるの！ たべたい！',
                                  'まかいのたべものって？: 【目的：可食植物の改良種を2個納品】【報酬：各自3プサイ】まぞくさんはなにたべるですか！ おしえてください。'].freeze,
                                 ['おうちなおしたいの！: 【目的：石材を1個納品】【報酬：各自1プサイ】おうちがぼろぼろだから、ママのかわりになおしたいの。',
                                  '娘の結婚式に必要なんだ！: 【目的：宝石を2個納品】【報酬：各自3プサイ】ちょっとさきなんですが、娘が結婚するので結婚式用の宝石を集めています。',
                                  '金属がたりない！: 【目的：金属を1個納品】【報酬：各自2プサイ】いい武器にはいい金属を。今回必要なのは……。',
                                  '村の聖堂を直したいんだ！: 【目的：石材を1個納品】【報酬：各自2プサイ】聖堂を直していたが石材がたりない！',
                                  '弟の甲冑に使うんだ！: 【目的：金属を2個納品】【報酬：各自3プサイ】最近、近くの鉱山から「ある金属」が姿を消した。',
                                  'おねえちゃんのたんじょうびに: 【目的：宝石を1個納品】【報酬：各自2プサイ】たんじょうびぷれぜんとにほうせきあげたらおねえちゃんよろこぶかな？'].freeze,
                                 ['パパのために: 【目的：木材の家具を1個納品】【報酬：各自2プサイ】はたらいてばっかりのパパにプレゼントしたいの。おねがいします！',
                                  '癒やされたい……: 【目的：石材の家具を1個納品】【報酬：各自2プサイ】仕事時間は短いとはいえ、激務。めちゃつらい。癒しになる家具がほしい。',
                                  'いい家具に囲まれてみたい: 【目的：金属の家具を1個納品】【報酬：各自2プサイ】開拓も最高だけど、他の島の人とも交流したい。人を呼べるような家を作るためには最高の家具が必要！',
                                  '家具の在庫不足: 【目的：木材の装飾品を1個納品】【報酬：各自3プサイ】困ったことに職人に逃げられた！ このままじゃ、お店開けない！！',
                                  'と、ともだちにあげるの！: 【目的：石材の装飾品を1個納品】【報酬：各自3プサイ】えっと、お、おきにいりのともだちがいるんだ。そ、そのこのたんじょうびだから、プレゼントしたくって。',
                                  '親の木に飾りを: 【目的：金属の装飾品を1個納品】【報酬：各自3プサイ】元気のない親の木を心配してペッコ達が大騒ぎしているんだ。君はいつまでも美しいよと伝えたくてね。一つ助力をお願いするよ。'].freeze,
                                 ['そちらの河魚を食してみたい: 【目的：河魚を2個納品】【報酬：各自3プサイ】おいしい河魚がいるときいたことがあるのです。さぁ、はやく、釣ってきてくださいまし。',
                                  '研究に使用したい: 【目的：湖魚を1個納品】【報酬：各自1プサイ】そちらの世界にある同名の魚が本当にこちらの世界にいるものと一緒か確かめたいのです。',
                                  'しろいくもにすむおさかながみたい！: 【目的：白雲の雲魚を1個納品】【報酬：各自2プサイ】こっちにはしろいくもってなかなかないの！ しろいくものおさかな、たべてみたいな。',
                                  '釣り師がいないのでお魚がほしい: 【目的：灰雲の雲魚を2個納品】【報酬：各自3プサイ】野菜や肉もいいが魚も食べたい……。頼む、魚を釣ってきてくれないか？',
                                  'まっくろなくもにすむおさかな！: 【目的：黒雲の雲魚を1個納品】【報酬：各自2プサイ】まっくろなくもにはどんなさかながすんでるの？ みせて、みせて！',
                                  '人間界では見られない魚が見たい！: 【目的：共通の雲魚を1個納品】【報酬：各自2プサイ】他の魚の雲を利用して泳ぎ回る魚がいると聞いたよ。ぜひ見せてほしいな。'].freeze].freeze
  ARMESEAR_PETIT_QUEST_CHART = [['お祭り用の布が足りないの！: 【目的：布を2個納品】【報酬：各自4プサイ】お祭り前なのに、布職人が腰を痛めちゃったの！',
                                 'お洋服がぼろぼろになっちゃったの: 【目的：布を1個納品】【報酬：各自2プサイ】おばあちゃんに作ってもらった服がボロボロになっちゃったから、なおしたいの。',
                                 'ぎっくり腰からのヘルプ: 【目的：薪を3個納品】【報酬：各自3プサイ】仕事してたらぎっくり腰になっちゃったのだ。頼むのだ。',
                                 '不調には栄養たっぷりのミルクを: 【目的：ミルクを1個納品】【報酬：各自3プサイ】体調を崩しちゃったの。栄養満点のミルクを頂戴。',
                                 '材料がたりない！: 【目的：？？？の粗皮を1個納品】【報酬：各自3プサイ】革細工師を目指してるんだけど、皮が足りないんだ。種類は問わないから、早めに頼むよ。',
                                 '愛しのガードナーのために: 【目的：？？？の肉を1個納品】【報酬：各自3プサイ】ガードナーの調子が悪いから、栄養をつけさせたいんだ。肉はなんだっていい、とびっきりのを頼むよ。'].freeze,
                                ['灯火をひとつ: 【目的：キャンドルを1個納品】【報酬：各自3プサイ】家の裏に知らない建物があるんだ。まっくらだから明かりが必要で……。',
                                 '布の色を頂戴: 【目的：染料を1個納品】【報酬：各自2プサイ】んー、コンテストのために布を織ったのだけど、色が決められないんだ。お願いするよ。',
                                 'きれいなのお花を: 【目的：花を1個納品】【報酬：各自2プサイ】パパの誕生日プレゼントを妹と作りたいんだ。お願いできる？',
                                 '旅立ちのために: 【目的：衣類を1個納品】【報酬：各自15プサイ】旅立つ弟に服をプレゼントしたいんだ。',
                                 '納品物が足りない！: 【目的：革を1個納品】【報酬：各自4プサイ】どうしても納品する皮がたりない……頼む、なんとか用意できないか？',
                                 '求）照明: 【目的：照明を1個納品】【報酬：各自10プサイ】引っ越しする最中に照明を壊してしまった！ 明日から明かりがないのはつらい……。作ってくれないか？'].freeze,
                                ['装備の修復のため: 【目的：革を2個納品】【報酬：各自5プサイ】大事な装備が壊れちゃったんだ！ 直すのに必要なんだけど、革を持っているかい？',
                                 '主に祝いの品を: 【目的：敷物を1個納品】【報酬：各自15プサイ】誕生日を迎える主にささやかなながらわたしからも祝いの品を送りたいのです。',
                                 '手料理を求めて: 【目的：出来栄え5の料理を1個納品】【報酬：各自5プサイ】たまには誰かの料理が食べたいんだ。',
                                 '釣り竿が折れちゃって……: 【目的：塩魚を2個納品】【報酬：各自3プサイ】釣り竿が折れちゃったから釣りができないんだ。一匹頼める？',
                                 '蝋がほしいの: 【目的：蝋を1個納品】【報酬：各自2プサイ】お兄ちゃんとパパの誕生日プレゼントを作るの。見つからないからお願いできる？',
                                 '美しさを求めて: 【目的：アルメサール産の花を1個納品】【報酬：各自3プサイ】美しいお花を摘んで来てくださらない？ 美のために必要でしてよ。'].freeze].freeze

  def use_petit_quest_chart(command)
    match_data = command.match(/PQ([VA]?)/)
    chart_symbol = match_data[1] == '' ? 'V' : match_data[1]

    roll_result1, = roll(1, D6)
    chart_text, roll_result2 = case chart_symbol
                               when 'V'
                                 chart_index = case roll_result1
                                               when 1, 2 then 0
                                               when 3, 4 then 1
                                               when 5 then 2
                                               when 6 then 3
                                               end
                                 get_table_by_1d6(VILLACIEL_PETIT_QUEST_CHART[chart_index])
                               when 'A' then get_table_by_1d6(ARMESEAR_PETIT_QUEST_CHART[(roll_result1 - 1) / 2])
                               end

    chart_title = case chart_symbol
                  when 'V' then 'ぷちクエスト表（ヴィラシエル）'
                  when 'A' then 'ぷちクエスト表（アルメサール）'
                  end
    "#{chart_title} ＞ [#{roll_result1},#{roll_result2}] ＞ #{chart_text}"
  end

  ACCIDENT_CHART = ['飛び猪襲来！: 空飛ぶ猪が浮遊島めがけて突撃してきた！ 建物が粉砕される前に迎撃だ！（「蒼天のヴィラシエル」P.46）',
                    '嵐がくるぞ！: 嵐が来るらしいぞ！ どれだけ対策できるかが鍵だ！（「蒼天のヴィラシエル」P.47）',
                    '雨が降らないぞ！: おかしいなぁ、雨が降らないぞぉ……？ こうなったら雨乞いの踊りだ！（「蒼天のヴィラシエル」P.48）',
                    'トビウオ流星群: きらきら光る流れ星……いや待て！ あれはトビウオの群れだー！？（「蒼天のヴィラシエル」P.49）',
                    'すごい雷雨: すごい。ごろごろばりばり聞こえてくる。これは早々に対策しないと直撃するぞ！（「蒼天のヴィラシエル」P.50）',
                    '野菜泥棒出現！: 畑の野菜が盗まれているぞ……？ これは犯人を捕まえないと！（「蒼天のヴィラシエル」P.51）'].freeze

  def use_accident_chart(_command)
    chart_text, roll_result = get_table_by_1d6(ACCIDENT_CHART)
    "アクシデント表 ＞ [#{roll_result}] ＞ #{chart_text}"
  end

  def use_6x6_chart(chart, chart_name)
    # 6x6の表からランダムに参照する
    # chartは文字列の配列の配列であることを仮定
    # D66ロールによる表参照と近いが、D66の方は13, 42などの数値に対応した表なのに対し、こちらは「下3マス、右2マス」という風にセルを参照する
    y_roll, = roll(1, D6)
    cell_text, x_roll = get_table_by_1d6(chart[y_roll - 1])
    "#{chart_name} ＞ [#{y_roll},#{x_roll}] ＞ 下#{y_roll}マス、右#{x_roll}マス ＞ #{cell_text}"
  end

  MOHUMOHU_INSECT_CHART = [['小さな虫', '小さな虫', 'カマキリ', 'カマキリ', 'バッタ', 'クワガタ'].freeze,
                           ['小さな虫', 'カラスアゲハ', 'カマキリ', 'バッタ', 'オオスカシバ', 'カイコ'].freeze,
                           ['ハンミョウ', 'カラスアゲハ', 'カマキリ', 'バッタ', 'カイコ', 'トンボ'].freeze,
                           ['ハンミョウ', 'カラスアゲハ', 'カラスアゲハ', 'チッチハチ', 'トンボ', 'トンボ'].freeze,
                           ['クワガタ', 'カラスアゲハ', 'チッチハチ', 'チッチハチ', 'アリ', 'アリ'].freeze,
                           ['クワガタ', 'チッチハチ', 'チッチハチ', 'チッチハチ', 'アリ', 'アリ'].freeze].freeze

  MOHUMOHU_ANIMAL_CHART = [['トリサン', 'トリサン', 'ブタ', 'ヒツジ', 'タヌキ', 'タヌキ'].freeze,
                           ['トリサン', 'ブタ', 'ヒツジ', 'ウッシ', 'キツネ', 'タヌキ'].freeze,
                           ['ブタ', 'オグマ', 'ヒツジ', 'キツネ', 'キツネ', 'アタウサギ'].freeze,
                           ['ブタ', 'ヒツジ', 'ヒツジ', 'リス', 'シシ', 'ヴィラシエル種(MMV)'].freeze,
                           ['ウッシ', 'ウサギ', 'ウサギ', 'シシ', 'アタウサギ', 'オオカミ'].freeze,
                           ['ウッシ', 'オグマ', 'クーマ', 'シシ', 'オオカミ', 'ヴィラシエル種(MMV)'].freeze].freeze

  MOHUMOHU_VILLACIEL_CHART = [['ウドン', 'ウドン', 'オボン', 'オボン', 'オボン', 'オワン'].freeze,
                              ['ウドン', 'ウドン', 'オボン', 'オワン', 'オワン', 'オワン'].freeze].freeze

  MOHUMOHU_VILLACIEL2_CHART = [['すねーくあし', 'すねーくあし', 'すねーくあし', 'ウタヒ', 'オオトリサン', 'オオトリサン'].freeze,
                               ['すねーくあし', 'すねーくあし', 'ホネホネ', 'オオトリサン', 'アマアマガニ', 'ホワホワ'].freeze,
                               ['すねーくあし', 'ホネホネ', 'オオトリサン', 'ウタヒ', 'アマアマガニ', 'ペロリ'].freeze,
                               ['オオトリサン', 'オオトリサン', 'ホネホネ', 'ホネホネ', 'ホワホワ', 'アマアマガニ'].freeze,
                               ['ホネホネ', 'ウタヒ', 'アマアマガニ', 'ペロリ', 'ペロリ', 'ペロリ'].freeze,
                               ['オオトリサン', 'ホワホワ', 'ホワホワ', 'アマアマガニ', 'ペロリ', 'ペロリ'].freeze].freeze

  MOHUMOHU_DRAGON_CHART = [['モドモドリス', 'テロメ', 'モドモドリス', 'オジサン', 'オジサン', 'グロッチ'].freeze,
                           ['テロメ', 'モドモドリス', 'オジサン', 'テロメ', 'ニホンツノ', 'グロッチ'].freeze,
                           ['テロメ', 'グロッチ', 'グロッチ', 'グロッチ', 'オジサン', 'コディ'].freeze,
                           ['モドモドリス', 'グロッチ', 'ニホンツノ', 'テロメ', 'テーリー', 'ケラプス'].freeze,
                           ['オジサン', 'テロメ', 'テロメ', 'コディ', 'コディ', 'ケラプス'].freeze,
                           ['コディ', 'テーリー', 'テーリー', 'コディ', 'ケラプス', 'アサール・ゴッツ'].freeze].freeze

  def use_mohumohu_chart(command)
    case command
    when 'MMI' then use_6x6_chart(MOHUMOHU_INSECT_CHART, 'もふもふ表・昆虫')
    when 'MMA' then use_6x6_chart(MOHUMOHU_ANIMAL_CHART, 'もふもふ表・動物')
    when /MMV[VA]?/
      match_data = command.match(/MMV([VA]?)/)
      chart_symbol = match_data[1] == '' ? 'V' : match_data[1]

      case chart_symbol
      when 'V'
        y_roll, = roll(1, D6)
        cell_text, x_roll = get_table_by_1d6(MOHUMOHU_VILLACIEL_CHART[1 - y_roll % 2])
        "もふもふ表・ヴィラシエル種（ヴィラシエル） ＞ [#{y_roll},#{x_roll}] ＞ 下#{y_roll.even? ? '偶数' : '奇数'}、右#{x_roll}マス ＞ #{cell_text}"
      when 'A' then use_6x6_chart(MOHUMOHU_VILLACIEL2_CHART, 'もふもふ表・ヴィラシエル種（アルメサール）')
      end
    when 'MMD' then use_6x6_chart(MOHUMOHU_DRAGON_CHART, 'もふもふ表・鋼龍種')
    end
  end

  FISHING_LAKE_CHART = [['ヤマアイズリ', 'ヤマアイズリ', 'ヤマアイズリ', 'シコウチャ', 'シコウチャ', 'ハナロクショウ'].freeze,
                        ['ヤマアイズリ', 'ヤマアイズリ', 'ヤマアイズリ', 'シコウチャ', 'ハナロクショウ', 'ハナロクショウ'].freeze,
                        ['ヤマアイズリ', 'ヤマアイズリ', 'シコウチャ', 'シコウチャ', 'ハナモエギ', 'トノチャ'].freeze,
                        ['ヤマアイズリ', 'カラスアゲハ', 'シコウチャ', 'ハナロクショウ', 'トノチャ', 'ハナモエギ'].freeze,
                        ['シコウチャ', 'シコウチャ', 'ハナロクショウ', 'ハナロクショウ', 'トノチャ', 'ハナモエギ'].freeze,
                        ['シコウチャ', 'ハナロクショウ', 'トノチャ', 'トノチャ', 'ハナモエギ', 'シンペキ'].freeze].freeze

  FISHING_RIVER_CHART = [['ケイカンセキ', 'ケイカンセキ', 'ケイカンセキ', 'ケイカンセキ', 'カナリア', 'イワヌ'].freeze,
                         ['ケイカンセキ', 'ケイカンセキ', 'カナリア', 'カナリア', 'カナリア', 'イワヌ'].freeze,
                         ['ケイカンセキ', 'ケイカンセキ', 'カナリア', 'イワヌ', 'イワヌ', 'ヤマブキ'].freeze,
                         ['ケイカンセキ', 'カナリア', 'イワヌ', 'アメイロ', 'アメイロ', 'ヤマブキ'].freeze,
                         ['カナリア', 'カナリア', 'イワヌ', 'アメイロ', 'ヤマブキ', 'ヤマブキ'].freeze,
                         ['カナリア', 'イワヌ', 'アメイロ', 'アメイロ', 'ヤマブキ', 'コハク'].freeze].freeze

  FISHING_WHITE_CHART = [['ウメガサネ', 'ウメガサネ', 'ウメガサネ', 'ウメガサネ', 'ハネズ', 'ユルシ'].freeze,
                         ['ウメガサネ', 'ウメガサネ', 'ウメガサネ', 'ハネズ', 'ソホ', 'シンク'].freeze,
                         ['ウメガサネ', 'ウメガサネ', 'ハネズ', 'ソホ', 'ユルシ', 'ユルシ'].freeze,
                         ['ウメガサネ', 'ハネズ', 'ソホ', 'ユルシ', 'シンク', 'シンク'].freeze,
                         ['ハネズ', 'ソホ', 'ソホ', 'ユルシ', 'シンク', '共通(FC)'].freeze,
                         ['ハネズ', 'ソホ', 'ユルシ', 'シンク', '共通(FC)', 'シュアン'].freeze].freeze

  FISHING_GRAY_CHART = [['ウメガサネ', 'ウメガサネ', 'セイラン', 'セイラン', 'ミハナダ', 'ミハナダ'].freeze,
                        ['ウメガサネ', 'セイラン', 'セイラン', 'ミハナダ', 'ミハナダ', 'ミハナダ'].freeze,
                        ['ウメガサネ', 'ユルシ', 'ミハナダ', 'ミハナダ', 'ミハナダ', 'リンドウ'].freeze,
                        ['ユルシ', 'ユルシ', 'セイラン', 'リンドウ', 'リンドウ', 'スミレ'].freeze,
                        ['ユルシ', 'ユルシ', 'リンドウ', 'スミレ', 'スミレ', '共通(FC)'].freeze,
                        ['ユルシ', 'リンドウ', 'スミレ', 'スミレ', '共通(FC)', 'シゴク'].freeze].freeze

  FISHING_BLACK_CHART = [['セイラン', 'セイラン', 'テツコン', 'テツコン', 'ウスハナ', 'ウスハナ'].freeze,
                         ['セイラン', 'セイラン', 'テツコン', 'ウスハナ', 'ウスハナ', 'フカガワネズミ'].freeze,
                         ['セイラン', 'テツコン', 'ウスハナ', 'ウスハナ', 'ミハナダ', 'フカガワネズミ'].freeze,
                         ['セイラン', 'テツコン', 'ミハナダ', 'ウスハナ', 'フカガワネズミ', 'フカガワネズミ'].freeze,
                         ['セイラン', 'ウスハナ', 'ミハナダ', 'ミハナダ', 'ミハナダ', '共通(FC)'].freeze,
                         ['テツコン', 'ウスハナ', 'ミハナダ', 'フカガワネズミ', '共通(FC)', 'ルリ'].freeze].freeze

  FISHING_COMMON_CHART = [['トビウオ', 'トビウオ', 'トビウオ', 'オオガメ', 'ロブスター', 'オオサンショウウオ'].freeze,
                          ['トビウオ', 'トビウオ', 'エイ', 'オオガメ', 'クジラ', 'ロブスター'].freeze,
                          ['トビウオ', 'エイ', 'マグロ', 'マグロ', 'カジキ', 'イタチザメ'].freeze,
                          ['トビウオ', 'ミズダコ', 'クラゲ', 'マグロ', 'オオクラゲ', 'ハンマーヘッド・シャーク'].freeze,
                          ['トビウオ', 'エイ', 'オオガメ', 'オオガメ', 'イタチザメ', 'ミズダコ'].freeze,
                          ['トビウオ', 'クラゲ', 'ロブスター', 'ハンマーヘッド・シャーク', 'ミズダコ', 'ダイオウイカ'].freeze].freeze

  FISHING_SALT_LAKE_CHART = [['シラユリ', 'シラユリ', 'シラユリ', 'ゲッパク', 'ゲッパク', 'ゲッパク'].freeze,
                             ['シラユリ', 'シラユリ', 'シラユリ', 'ゲッパク', 'スズ', 'ナマリ'].freeze,
                             ['シラユリ', 'ゲッパク', 'ゲッパク', 'スズ', 'ナマリ', 'ナマリ'].freeze,
                             ['シラユリ', 'シラユリ', 'ナマリ', 'ナマリ', 'ナマリ', 'ナマリ'].freeze,
                             ['ゲッパク', 'ゲッパク', 'スズ', 'スズ', 'ロイロ', 'ロイロ'].freeze,
                             ['ナマリ', 'スズ', 'スズ', 'スズ', 'ロイロ', 'クロツルバミ'].freeze].freeze

  def use_fishing_chart(command)
    case command
    when 'FL' then use_6x6_chart(FISHING_LAKE_CHART, '釣り・湖表')
    when 'FR' then use_6x6_chart(FISHING_RIVER_CHART, '釣り・河表')
    when 'FW' then use_6x6_chart(FISHING_WHITE_CHART, '釣り・白雲表')
    when 'FG' then use_6x6_chart(FISHING_GRAY_CHART, '釣り・灰雲表')
    when 'FB' then use_6x6_chart(FISHING_BLACK_CHART, '釣り・黒雲表')
    when 'FC' then use_6x6_chart(FISHING_COMMON_CHART, '釣り・共通表')
    when 'FS' then use_6x6_chart(FISHING_SALT_LAKE_CHART, '釣り・塩湖表')
    end
  end

  INEDIBLE_PLANT_CHART = [['シュイの花', 'ダデオの花', 'ロキの花', 'シェラの花', 'トトイト', 'ポロネイマ'].freeze,
                          ['シュイの花', 'ロキの花', 'アウディの花', 'イディウの花', 'トトイト', 'ポロネイマ'].freeze,
                          ['ダデオの花', 'アウディの花', 'イディウの花', 'マトイト', 'ポポトマ', 'ルタタ'].freeze,
                          ['シュイの花', 'ミカギの花', 'ロトイト', 'ロトイト', 'ツルイド', 'ルタタ'].freeze,
                          ['ミカギの花', 'ロトイト', 'ロトイト', 'ツルイド', 'ルタタ', '変異植物(MP)'].freeze,
                          ['トトイト', 'マトイト', 'ポポトマ', 'ツルイド', '変異植物(MP)', 'サボサボ'].freeze].freeze

  INEDIBLE_PLANT2_CHART = [['マトラの花', 'マトラの花', '蜜蝋', 'ポルラの花', 'ウェスドの花', 'ポルラの花'].freeze,
                           ['マトラの花', 'ホイの花', 'マトラの花', 'ウェスドの花', '蜜蝋', 'ロロの花'].freeze,
                           ['ホイの花', 'ポルラの花', 'ウェスドの花', 'ホイの花', 'ポルラの花', 'ポルラの花'].freeze,
                           ['ポルラの花', 'ホイの花', 'ロロの花', 'ウェスドの花', 'ポルラの花', 'ドダの実'].freeze,
                           ['ポルラの花', 'ウェスドの花', 'ロロの花', 'ロロの花', 'ロロの花', 'ロロの花'].freeze,
                           ['ウェスドの花', 'ロロの花', 'ポルラの花', 'ロロの花', 'ドダの実', 'ロロの花'].freeze].freeze

  def use_inedible_plant_chart(command)
    match_data = command.match(/IP([VA]?)/)
    chart_symbol = match_data[1] == '' ? 'V' : match_data[1]

    case chart_symbol
    when 'V' then use_6x6_chart(INEDIBLE_PLANT_CHART, '不食植物表（ヴィラシエル）')
    when 'A' then use_6x6_chart(INEDIBLE_PLANT2_CHART, '不食植物表（アルメサール）')
    end
  end

  EDIBLE_PLANT_CHARTS = [[['小麦', '小麦', 'さつまいも', 'ねぎ', '白菜', 'きゅうり'].freeze,
                          ['小麦', 'さつまいも', 'さといも', '白菜', '白菜', 'とうもろこし'].freeze,
                          ['さといも', 'さといも', 'ねぎ', '白菜', 'とうもろこし', '枝豆'].freeze,
                          ['シソ', 'ひらたけ', 'エリンギ', '枝豆', '枝豆', 'ラズベリー'].freeze,
                          ['シソ', 'ひらたけ', 'ひらたけ', 'エリンギ', 'ラズベリー', 'さといも'].freeze,
                          ['ナシ', 'ナシ', 'ナシ', 'ラズベリー', 'ラズベリー', 'さといも'].freeze].freeze,
                         [['米', '米', 'にんじん', 'じゃがいも', 'ふき', 'まいたけ'].freeze,
                          ['米', 'じゃがいも', 'じゃがいも', 'にら', 'ふき', 'きくらげ'].freeze,
                          ['冬瓜', 'しょうが', '冬瓜', 'ふき', 'ふき', 'きくらげ'].freeze,
                          ['しょうが', '冬瓜', 'ビワ', 'にら', 'まいたけ', 'まいたけ'].freeze,
                          ['ビワ', 'ビワ', 'もも', 'かぼちゃ', 'グリーンピース', 'まいたけ'].freeze,
                          ['ビワ', 'もも', 'もも', 'かぼちゃ', 'かぼちゃ', 'かぼちゃ'].freeze].freeze,
                         [['もち米', 'トマト', 'オクラ', 'とうがらし', '大根', 'グミ'].freeze,
                          ['もち米', 'オクラ', 'オクラ', '大根', '大根', 'とうがらし'].freeze,
                          ['しいたけ', 'マッシュルーム', 'オクラ', 'グミ', '玉ねぎ', '小松菜'].freeze,
                          ['ブロッコリー', 'しいたけ', 'トマト', '玉ねぎ', 'さやえんどう', '玉ねぎ'].freeze,
                          ['しいたけ', 'マッシュルーム', 'ブロッコリー', '小松菜', 'さやえんどう', '改良種(IS)'].freeze,
                          ['マッシュルーム', 'ブロッコリー', 'マッシュルーム', '小松菜', '改良種(IS)', 'グミ'].freeze].freeze,
                         [['大豆', '大豆', 'にんにく', 'そらまめ', 'しめじ', 'みかん'].freeze,
                          ['かぶ', '大豆', 'かぶ', 'キャベツ', 'そらまめ', 'みかん'].freeze,
                          ['にんにく', 'かぶ', 'にんにく', 'しめじ', 'クランベリー', 'ピーマン'].freeze,
                          ['キャベツ', 'キャベツ', 'ほうれん草', 'しめじ', 'レタス', 'ピーマン'].freeze,
                          ['ほうれん草', 'ほうれん草', 'クランベリー', 'レタス', 'ピーマン', '改良種(IS)'].freeze,
                          ['松茸', 'ほうれん草', '松茸', 'レタス', 'クランベリー', '改良種(IS)'].freeze].freeze,
                         [['小豆', 'れんこん', 'みつば', 'やまのいも', 'デコポン', 'イチゴ'].freeze,
                          ['れんこん', 'れんこん', '小豆', 'なめこ', 'かいわれ大根', 'なめこ'].freeze,
                          ['やまのいも', 'アスパラガス', 'なす', 'なめこ', 'やまのいも', 'デコポン'].freeze,
                          ['なす', 'やまのいも', 'みつば', 'えのきたけ', 'かいわれ大根', 'デコポン'].freeze,
                          ['アスパラガス', 'アスパラガス', 'やまのいも', 'みつば', 'なめこ', '改良種(IS)'].freeze,
                          ['なす', 'もやし', 'えのきたけ', 'えのきたけ', '改良種(IS)', 'イチゴ'].freeze].freeze].freeze

  EDIBLE_PLANT2_CHARTS = [[['テンサイ', 'バノ', 'テンサイ', 'サトウモロ', 'サトウモロ', 'パンノミ'].freeze,
                           ['テンサイ', 'バノ', 'サトウモロ', 'バノ', 'ミソレグア', 'パンノミ'].freeze,
                           ['テンサイ', 'サトウモロ', 'バノ', 'ニクニク', 'パンノミ', 'メーズム'].freeze,
                           ['バノ', 'バノ', 'バノ', 'パンノミ', 'ミソレグア', 'メーズム'].freeze,
                           ['テンサイ', 'パンノミ', 'ニクニク', 'ニクニク', 'メーズム', 'ミソレグア'].freeze,
                           ['サトウモロ', 'ニクニク', 'メーズム', 'ミソレグア', 'メーズム', 'メーズム'].freeze].freeze,
                          [['アロアベリー', 'パンノミ', 'ミソレグア', 'サイングア', 'パンノミ', 'アロアベリー'].freeze,
                           ['パンノミ', 'サイングア', 'パンノミ', 'ミソレグア', 'アロアベリー', 'ミソレグア'].freeze,
                           ['パンノミ', 'アロアベリー', 'サイングア', 'パンノミ', 'パンノミ', 'トロアベリア'].freeze,
                           ['パンノミ', 'アロアベリー', 'パンノミ', 'ミソレグア', 'ミソレグア', 'トロアベリア'].freeze,
                           ['サイングア', 'パンノミ', 'トロアベリア', 'ミソレグア', 'アロアベリー', 'サイングア'].freeze,
                           ['ミソレグア', 'トロアベリア', 'サイングア', 'アロアベリー', 'トロアベリア', 'トロアベリア'].freeze].freeze].freeze

  def use_villaciel_edible_plant_chart(chart_id, output)
    output += use_6x6_chart(EDIBLE_PLANT_CHARTS[chart_id - 1], "可食植物表#{chart_id}（ヴィラシエル）")
  end

  def use_armesear_edible_plant_chart(chart_id, output)
    output += use_6x6_chart(EDIBLE_PLANT2_CHARTS[chart_id - 1], "可食植物表#{chart_id}（アルメサール）")
  end

  def use_edible_plant_chart(command)
    match_data = command.match(/EP([VA]?)(\d?)/)
    chart_symbol = match_data[1] == '' ? 'V' : match_data[1]

    case chart_symbol
    when 'V'
      case match_data[2]
      when ''
        roll_result, = roll(1, D6)
        return '(1D6) ＞ [6] ＞ 好きな表を選んでおっけー！' if roll_result == D6

        use_villaciel_edible_plant_chart(roll_result, "(1D6) ＞ [#{roll_result}] ＞ ")
      else
        chart_id = match_data[2].to_i
        return '' unless chart_id >= 1 && chart_id <= 5

        use_villaciel_edible_plant_chart(chart_id, '')
      end
    when 'A'
      case match_data[2]
      when ''
        roll_result, = roll(1, D6)
        use_armesear_edible_plant_chart(roll_result.even? ? 1 : 2, "(1D6) ＞ [#{roll_result}] ＞ ")
      else
        chart_id = match_data[2].to_i
        return '' unless [1, 2].include?(chart_id)

        use_armesear_edible_plant_chart(chart_id, '')
      end
    end
  end

  MUTANT_PLANT_CHART = [['ガドゴン', 'ガドゴン', 'レディダン', 'ボディア', 'ブタマル', 'ブタマル'].freeze,
                        ['レディダン', 'レディダン', 'ボディア', 'トロコッコ', 'ブタマル', 'ツァイド'].freeze,
                        ['ボディア', 'ボディア', 'マメノキ', 'ナッキュ', 'ツァイド', 'ボディア'].freeze,
                        ['ナッキュ', 'マメノキ', 'ナッキュ', 'ガドゴン', 'レディダン', 'レディダン'].freeze,
                        ['ポメラマ', 'ポメラマ', 'ナッキュ', 'ツァイド', 'ガドゴン', 'ボディア'].freeze,
                        ['ナッキュ', 'ツァイド', 'ツァイド', 'ツァイド', 'ボディア', 'グラディエゴ'].freeze].freeze

  def use_mutant_plant_chart(_command)
    use_6x6_chart(MUTANT_PLANT_CHART, '変異植物表')
  end

  IMPROVED_SPECIES_CHART = [['ワワ', 'ワワ', 'ブラックカロット', 'ビーズ', 'レモン', 'ブラッドオレンジ'].freeze,
                            ['ポポ', 'ポポ', 'グランツェ', 'オオカサゲ', 'ブラッドオレンジ', 'レモン'].freeze,
                            ['ヒットト', 'グランツェ', 'ブラックベリー', 'ピマット', 'ブラッドオレンジ', 'レモン'].freeze,
                            ['ブルーベリー', 'ヒットト', 'グランツェ', 'ブラッドオレンジ', 'ユズ', 'ブラックベリー'].freeze,
                            ['ビーズ', 'ピマット', 'オオカサゲ', 'ライム', 'ブルーベリー', 'ユズ'].freeze,
                            ['ビーズ', 'レッドキャベツ', 'ライム', 'オオカサゲ', 'ライム', 'リンゴ'].freeze].freeze

  def use_improved_species_chart(_command)
    use_6x6_chart(IMPROVED_SPECIES_CHART, '改良種表')
  end
end
