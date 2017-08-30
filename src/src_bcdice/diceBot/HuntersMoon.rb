# -*- coding: utf-8 -*-

class HuntersMoon < DiceBot
  
  def initialize
    super
    @sendMode = 2;
    @sortType = 1;
    @d66Type = 2;
    @fractionType = "roundUp";     # 端数切り上げに設定
  end
  
  def gameName
    'ハンターズムーン'
  end
  
  def gameType
    "HuntersMoon"
  end
  
  def prefixs
     ['(ET|CLT|SLT|HLT|FLT|DLT|MAT|SAT|SA2T|TST|THT|TAT|TBT|TLT|TET)\d*']
  end
  
  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定
　判定時にクリティカルとファンブルを自動判定します。
・各種表
　・遭遇表　(ET)
　・都市ロケーション表　(CLT)
　・閉所ロケーション表　(SLT)
　・炎熱ロケーション表　(HLT)
　・冷暗ロケーション表　(FLT)
　・部位ダメージ決定表　(DLT)
　・モノビースト行動表　(MAT)
　・異形アビリティー表　(SATx) (xは個数)
　・異形アビリティー表2　(SA2Tx) (xは個数)
　　→表１と表２の振り分けも判定
　・指定特技(社会)表　　(TST)
　・指定特技(頭部)表　　(THT)
　・指定特技(腕部)表　　(TAT)
　・指定特技(胴部)表　　(TBT)
　・指定特技(脚部)表　　(TLT)
　・指定特技(環境)表　　(TET)
　・異形化表　　　　　　(MST)
　・代償表　　　　　　　(ERT)
　・ディフェンス遭遇表1/2/3 (DS1ET/DS2ET/DS3ET)
　・エスケープ遭遇表1/2/3 (EE1ET/EE2ET/EE3ET)
　・エスコート遭遇表1/2/3 (ET1ET/ET2ET/ET3ET)
　・トラッキング遭遇表1/2/3 (TK1ET/TK2ET/TK3ET)
・D66ダイスあり
INFO_MESSAGE_TEXT
  end
  
  
  # ゲーム別成功度判定(2D6)
  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return '' unless(signOfInequality == ">=")
    
    if(dice_n <= 2)
      return " ＞ ファンブル(モノビースト追加行動+1)";
    elsif(dice_n >= 12)
      return " ＞ スペシャル(変調1つ回復orダメージ+1D6)";
    elsif(total_n >= diff)
      return " ＞ 成功";
    else
      return " ＞ 失敗";
    end
  end
  
  
  
  def rollDiceCommand(command)
    string = command.upcase
    output = '1';
    type = "";
    total_n = "";
    
    case string
      
    when /CLT/i
      type = '都市ロケーション';
      output, total_n = hm_city_location_table
    when /SLT/i
      type = '閉所ロケーション';
      output, total_n = hm_small_location_table
    when /HLT/i
      type = '炎熱ロケーション';
      output, total_n = hm_hot_location_table
    when /FLT/i
      type = '冷暗ロケーション';
      output, total_n = hm_freezing_location_table
    when /DLT/i
      type = '部位ダメージ決定';
      output, total_n = hm_hit_location_table
      
    when /MAT/i
      type = 'モノビースト行動';
      output, total_n = hm_monobeast_action_table
      
    when /SA(2)?T(\d*)/i
      isType2 = (not $1.nil?)
      count = $2.to_i
      count = 1 if(count == 0)
      
      type = '異形アビリティー';
      output, total_n = get_strange_ability_table_result(count, isType2)
      
    when /TST/i
      type = '指定特技(社会)';
      output, total_n = hm_social_skill_table
    when /THT/i
      type = '指定特技(頭部)';
      output, total_n = hm_head_skill_table
    when /TAT/i
      type = '指定特技(腕部)';
      output, total_n = hm_arm_skill_table
    when /TBT/i
      type = '指定特技(胴部)';
      output, total_n = hm_trunk_skill_table
    when /TLT/i
      type = '指定特技(脚部)';
      output, total_n = hm_leg_skill_table
    when /TET/i
      type = '指定特技(環境)';
      output, total_n = hm_environmental_skill_table
      
    when /ET/i
      type = '遭遇';
      output, total_n = hm_encount_table
    end
    
    return output if(output == '1')
    
    output = "#{type}表(#{total_n}) ＞ #{output}";
    return output;
  end
  
  
#** ロケーション表
  def hm_city_location_table
    table = [
        '住宅街/閑静な住宅街。不意打ちに適しているため、ハンターの攻撃判定に+1の修正をつけてもよい。',
        '学校/夜の学校。遮蔽物が多く入り組んだ構造のため、ハンターはブロック判定によって肩代わりしたダメージを1減少してもよい。',
        '駅/人のいない駅。全てのキャラクターがファンブル時に砂利に突っ込んだり伝染に接触しかけることで1D6のダメージを受ける。',
        '高速道路/高速道路の路上。全てのキャラクターが、ファンブル時には走ってきた車に跳ねられて1D6のダメージを受ける。',
        'ビル屋上/高いビルの屋上。ハンターはファンブル時に屋上から落下して強制的に撤退する。命に別状はない',
        '繁華街/にぎやかな繁華街の裏路地。大量の人の気配が近くにあるため、モノビーストが撤退するラウンドが1ラウンド早くなる。決戦フェイズでは特に効果なし。',
            ]
    return get_table_by_1d6(table)
  end
  
  def hm_small_location_table
    table = [
             '地下倉庫/広々とした倉庫。探してみれば色々なものが転がっている。ハンターは戦闘開始時に好きなアイテムを一つ入手してもよい。',
             '地下鉄/地下鉄の線路上。全てのキャラクターが、ファンブル時にはなぜか走ってくる列車に撥ねられて1D6ダメージを受ける。',
             '地下道/暗いトンネル。車道や照明の落ちた地下街。ハンターは、ファンブル時にアイテムを一つランダムに失くしてしまう。',
             '廃病院/危険な廃物がたくさん落ちているため、誰もここで戦うのは好きではない。キャラクター全員の【モラル】を3点減少してから戦闘を開始する。',
             '下水道/人が２人並べるくらいの幅の下水道。メンテナンス用の明かりしかなく、非常に視界が悪いため、ハンターの攻撃判定に-1の修正がつく。',
        '都市の底/都市の全てのゴミが流れ着く場所。広い空洞にゴミが敷き詰められている。この敵対的な環境では、ハンターの攻撃判定に-1の修正がつく。さらにハンターは攻撃失敗時に2ダメージを受ける。',
            ]
    return get_table_by_1d6(table)
  end
  
  def hm_hot_location_table
    table = [
             '温室/植物が栽培されている熱く湿った場所。生命に満ち溢れた様子は、戦闘開始時にハンターの【モラル】を1点増加する。',
             '調理場/調理器具があちこちに放置された、アクションには多大なリスクをともなう場所。全てのキャラクターは、ファンブル時に良くない場所に手をついたり刃物のラックをひっくり返して1D6ダメージを受ける。',
             'ボイラー室/モノビーストは蒸気機関の周囲を好む傾向があるが、ここはうるさくて気が散るうえに暑い。全てのキャラクターは、感情属性が「怒り」の場合、全てのアビリティの反動が1増加する。',
             '機関室/何らかの工場。入り組みすぎて周りを見通せないうえ、配置がわからず出たとこ勝負を強いられる。キャラクター全員が戦闘開始時に「妨害」の変調を発動する。',
             '火事場/事故現場なのかモノビーストの仕業か、あたりは激しく燃え盛っている。ハンターはファンブル時に「炎上」の変調を発動する。',
             '製鉄所/無人ながら稼働中の製鉄所。安全対策が不十分で、溶けた金属の周囲まで近づくことが可能だ。ハンターは毎ラウンド終了時に《耐熱》で行為判定をし、これに失敗すると「炎上」の変調を発動する。',
             ]
    return get_table_by_1d6(table)
  end

  def hm_freezing_location_table
    table = [
             '冷凍保管室/食品が氷漬けにされている場所。ここではモノビーストは氷に覆われてしまう。モノビーストは戦闘開始時に「捕縛」の変調を発動する。',
             '墓地/死んだ人々が眠る場所。ここで激しいアクションを行うことは冒涜的だ。全てのキャラクターは感情属性が恐怖の場合、全てのアビリティの反動が１増加する。',
             '魚市場/発泡スチロールの箱に鮮魚と氷が詰まり、コンクリートの床は濡れていて滑りやすい。ハンターはファンブル時に転んで1D6ダメージを受ける。',
             '博物館/すっかり静まり返った博物館で、モノビーストは動物の剥製の間に潜んでいる。紛らわしい展示物だらけであるため、ハンターは攻撃判定に-1の修正を受ける。',
             '空き地/寒風吹きすさぶ空き地。長くいると凍えてしまいそうだ。ハンターはファンブル時に身体がかじかみ、「重傷」の変調を発動する。',
             '氷室/氷で満たされた洞窟。こんな場所が都市にあったとは信じがたいが、とにかくひどく寒い。ハンターは毎ラウンド終了時に《耐寒》で判定し、失敗すると「重傷」の変調を発動する。',
             ]
    return get_table_by_1d6(table)
  end

#** 遭遇表
  def hm_encount_table
    table = [
             '獲物/恐怖/あなたはモノビーストの獲物として追い回される。満月の夜でないと傷を負わせることができない怪物相手に、あなたは逃げ回るしかない。',
             '暗闇/恐怖/あの獣は暗闇の中から現れ、暗闇の中へ消えていった。どんなに振り払おうとしても、あの恐ろしい姿の記憶から逃れられない。',
             '依頼/怒り/あなたはモノビーストの被害者の関係者、あるいはハンターや魔術師の組織から、モノビーストを倒す依頼を受けた。',
             '気配/恐怖/街の気配がどこかおかしい。視線を感じたり、物音が聞こえたり・・・だが、獣の姿を捉えることはできない。漠然とした恐怖があなたの心をむしばむ。',
             '現場/怒り/あなたはモノビーストが獲物を捕食した現場を発見した。派手な血の跡が目に焼きつく。こんなことをする奴を生かしてはおけない。',
             '賭博/怒り/あなたの今回の獲物は、最近ハンターの間で話題になっているモノビーストだ。次の満月の夜にあいつを倒せるか、あなたは他のハンターと賭けをした。',
            ]
    return get_table_by_1d6(table)
  end
  
  #** 
  def hm_monobeast_action_table
    table = [
             '社会/モノビーストは時間をかけて逃げ続けることで、ダメージを回復しようとしているようだ。部位ダメージを自由に一つ回復する。部位ダメージを受けていない場合、【モラル】が1D6回復する。',
             '頭部/モノビーストはハンターを撒こうとしている。次の戦闘が日暮れ、もしくは真夜中である場合、モノビーストは１ラウンド少ないラウンドで撤退する。次の戦闘が夜明けである場合、【モラル】が2D6増加する。',
             '腕部/モノビーストは若い犠牲者を選んで捕食しようとしている。どうやら力を増そうとしているらしい。セッション終了までモノビーストの攻撃によるダメージは+1の修正がつく。',
             '胴部/モノビーストは別のハンターと遭遇し、それを食べて新しいアビリティを手に入れる！　ランダムに異形アビリティを一つ決定し、修得する。',
             '脚部/モノビーストはハンターを特定の場所に誘導しているようだ。ロケーション表を振り、次の戦闘のロケーションを変更する。そのロケーションで次の戦闘が始まった場合、モノビーストは最初のラウンドに追加行動を１回得る。',
             '環境/モノビーストは移動中に人間の団体と遭遇し、食い散らかす。たらふく食ったモノビーストは【モラル】を3D6点増加させる',
            ]
    return get_table_by_1d6(table)
  end
  
  #** 部位ダメージ決定表
  def hm_hit_location_table
    table = [
             '脳',
             '利き腕',
             '利き脚',
             '消化器',
             '感覚器',
             '攻撃したキャラクターの任意の部分',
             '口',
             '呼吸器',
             '逆脚',
             '逆腕',
             '心臓',
            ]
    return get_table_by_2d6(table)
  end
  
  
  def getStrangeAbilityTable1()
  end
  
  
  #** 異形アビリティー表
  def get_strange_ability_table_result(count, isType2)
    output = ''
    dice = ''
    
    table1 = get_strange_ability_table_1
    table2 = get_strange_ability_table_2
    
    count.times do |i|
      
      if( i != 0 )
        output += "/"
        dice += ","
      end
      
      table = table1
      
      if( isType2 )
        number, = roll(1, 6)
        index = ((number % 2) == 1 ? 0 : 1)
        
        table = [table1, table2][index]
        dice += "#{number}-"
        output += "[表#{index + 1}]"
      end
      
      ability, indexText = get_table_by_d66(table)
      next if( ability == '1' )
      
      output += "#{ability}"
      dice += indexText
    end
    
    return '1', dice if(output.empty?)
    
    return output, dice
  end

  
  def get_strange_ability_table_1
    table = %w{
大牙
大鎌
針山
大鋏
吸血根
巨大化
瘴気
火炎放射
鑢
ドリル
絶叫
粘液噴射
潤滑液
皮膚装甲
器官生成
翼
四肢複製
分解
異言
閃光
冷気
悪臭
化膿歯
気嚢
触手
肉瘤
暗視
邪視
超振動
酸分泌
結晶化
裏腹
融合
嘔吐
腐敗
変色
}
    return table
  end

  def get_strange_ability_table_2
    table = %w{
電撃
障壁
追加肢
破裂球
死病
ソナー
未来視
寄生体
再構築
分身
大角
鉄塊
硬質化
生命力吸収
鬼火
金縛り
排出口
金属化
鋼鱗
神経接合
光翼
環境適応
消化剤
プロペラ
血栓
骨槍
回転
怒髪
煙幕
脂肪層
逆棘
偽頭
赤化
発条
凶運
巨砲
}
    return table
  end

  
#** 指定特技ランダム決定(社会)
  def hm_social_skill_table
    table = [
             '怯える',
             '考えない',
             '話す',
             '黙る',
             '売る',
             '伝える',
             '作る',
             '憶える',
             '脅す',
             '騙す',
             '怒る',
            ]
    return get_table_by_2d6(table)
  end
  
#** 指定特技ランダム決定(頭部)
  def hm_head_skill_table
    table = [
             '聴く',
             '感覚器',
             '見つける',
             '反応',
             '閃く',
             '脳',
             '考える',
             '予感',
             '叫ぶ',
             '口',
             '噛む',
            ]
    return get_table_by_2d6(table)
  end
  
#** 指定特技ランダム決定(腕部)
  def hm_arm_skill_table
    table = [
             '操作',
             '殴る',
             '斬る',
             '利き腕',
             '撃つ',
             '掴む',
             '投げる',
             '逆腕',
             '刺す',
             '振る',
             '締める',
            ]
    return get_table_by_2d6(table)
  end
  
#** 指定特技ランダム決定(胴部)
  def hm_trunk_skill_table
    table = [
             '塞ぐ',
             '呼吸器',
             '止める',
             '動かない',
             '受ける',
             '心臓',
             '逸らす',
             'かわす',
             '落ちる',
             '消化器',
             '耐える',
            ]
    return get_table_by_2d6(table)
  end
  
#** 指定特技ランダム決定(脚部)
  def hm_leg_skill_table
    table = [
             '迫る',
             '走る',
             '蹴る',
             '利き脚',
             '跳ぶ',
             '仕掛ける',
             'しゃがむ',
             '逆脚',
             '滑る',
             '踏む',
             '歩く',
            ]
    return get_table_by_2d6(table)
  end
  
#** 指定特技ランダム決定(環境)
  def hm_environmental_skill_table
    table = [
             '耐熱',
             '休む',
             '待つ',
             '捕らえる',
             '隠れる',
             '追う',
             'バランス',
             '現れる',
             '追い込む',
             '休まない',
             '耐寒',
            ]
    return get_table_by_2d6(table)
  end
  
end
