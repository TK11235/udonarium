# -*- coding: utf-8 -*-

class StellarKnights < DiceBot
  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes(['TT', 'STA', 'STB', 'STB2', 'STC', 'ALLS'])

  def initialize
    super

    @d66Type = 1
  end

  def gameName
    '銀剣のステラナイツ'
  end

  def gameType
    "StellarKnights"
  end

  def getHelpMessage
    return <<MESSAGETEXT
TT：お題表
STA ：シチュエーション表A：時間
STB ：シチュエーション表B：場所
STB2：シチュエーション表B その2：学園編
STC ：シチュエーション表C：話題
ALLS ：シチュエーション表全てを一括で（学園編除く）
MESSAGETEXT
  end

  def rollDiceCommand(command)
    command = command.upcase

    return analyzeDiceCommandResultMethod(command)
  end

  def getThemeTableDiceCommandResult(command)
    return unless command == "TT"

    tableName = "お題表"
    table = %w{
未来 占い 遠雷 恋心 歯磨き 鏡
過去 キス ささやき声 黒い感情 だっこ 青空
童話 決意 風の音 愛情 寝顔 鎖
ふたりの秘密 アクシデント！ 小鳥の鳴き声 笑顔 食事 宝石
思い出 うとうと 鼓動 嫉妬 ベッド 泥
恋の話 デート ため息 内緒話 お風呂 小さな傷
}

    text, index = get_table_by_d66(table)

    result = "#{tableName}(#{index}) ＞ #{text}"
    return result
  end

  def getSituationTableDiceCommandResult(command)
    return unless command == "STA"

    tableName = "シチュエーション表A：時間"
    table = %w{
朝、誰もいない
騒がしい昼間の
寂しい夕暮れの横たわる
星の瞬く夜、
静謐の夜更けに包まれた
夜明け前の
}
    text, index = get_table_by_1d6(table)

    result = "#{tableName}(#{index}) ＞ #{text}"
    return result
  end

  def getPlageTableDiceCommandResult(command)
    return unless command == "STB"

    tableName = "シチュエーション表B：場所"

    table_1_2 = [
"教室 　小道具：窓、机、筆記用具、チョークと黒板、窓の外から聞こえる部活動の声",
"カフェテラス　小道具：珈琲、紅茶、お砂糖とミルク、こちらに手を振っている学友",
"学園の中庭　小道具：花壇、鳥籠めいたエクステリア、微かに聴こえる鳥の囁き",
"音楽室　小道具：楽器、楽譜、足踏みオルガン、壁に掛けられた音楽家の肖像画",
"図書館　小道具：高い天井、天井に迫る程の本棚、無数に収められた本",
"渡り廊下　小道具：空に届きそうな高さ、遠くに別の学園が見える、隣を飛び過ぎて行く鳥",
                ]

    table_3_4 = [
"花の咲き誇る温室　小道具：むせ返るような花の香り、咲き誇る花々、ガラス越しの陽光",
"アンティークショップ　小道具：アクセサリーから置物まで、見慣れない古い機械は地球時代のもの？",
"ショッピングモール　小道具：西欧の街並みを思わせるショッピングモール、衣類に食事、お茶屋さんも",
"モノレール　小道具：車窓から覗くアーセルトレイの街並み、乗客はあなたたちだけ",
"遊歩道　小道具：等間隔に並ぶ街路樹、レンガ造りの街並み、微かに小鳥のさえずり",
"おしゃれなレストラン　小道具：おいしいごはん、おしゃれな雰囲気、ゆったりと流れる時間",
                ]
    table_5_6 = [
"何処ともしれない暗がり　小道具：薄暗がりの中、微かに見えるのは互いの表情くらい",
"寂れた喫茶店　小道具：姿を見せないマスター、その孫娘が持ってくる珈琲、静かなひととき",
"階段の下、秘密のお茶会　小道具：知る人ぞ知る階段下スペースのお茶会、今日はあなたたちだけ",
"学生寮の廊下　小道具：滅多に人とすれ違わない学生寮の廊下、窓の外には中庭が見える",
"ふたりの部屋　小道具：パートナーと共に暮らすあなたの部屋、内装や小物はお気に召すまま",
"願いの決闘場　小道具：決闘の場、ステラナイトたちの花章が咲き誇る場所",
                ]

    table = [table_1_2, table_1_2,
             table_3_4, table_3_4,
             table_5_6, table_5_6,].flatten

    text, index = get_table_by_d66(table)

    result = "#{tableName}(#{index}) ＞ #{text}"
    return result
  end

  def getSchoolTableDiceCommandResult(command)
    return unless command == "STB2"

    tables =
      [
       {:tableName => "アーセルトレイ公立大学",
         :table => %w{
地下のだだっぴろい学食
パンの種類が豊富な購買の前
本当は進入禁止の屋上
キャンプ部が手入れしている中庭
共用の広いグラウンド
使い古された教室
}},

       {:tableName => "イデアグロリア芸術総合大学",
         :table => %w{
（美術ｏｒ音楽）準備室
美しく整備された中庭
音楽室
格調高いカフェテラス
誰もいない大型劇場
完璧な調和を感じる温室
}},

       {:tableName => "シトラ女学院",
       :table => %w{
中庭の神殿めいた温室
質素だが美しい会食室
天井まで届く本棚の並ぶ図書館
誰もいない学習室
寮生たちの秘密のお茶会室
寮の廊下
}},

       {:tableName => "フィロソフィア大学",
         :table => %w{
遠く聞こえる爆発音
学生のアンケート調査を受ける
空から降ってくるドローン
膨大な蔵書を備えた閉架書庫
鳴らすと留年するという小さな鐘の前
木漏れ日のあたたかな森
}},

       {:tableName => "聖アージェティア学園",
       :table => %w{
おしゃれなカフェテラス
小さなプラネタリウム
ローマの神殿めいた屋内プール
誰もいない講堂
謎のおしゃれな空き部屋
花々の咲き乱れる温室
}},

     {:tableName => "スポーン・オブ・アーセルトレイ",
       :table => %w{
人気のない教室
歴代の寄せ書きの刻まれた校門前
珍しく人気のない学食
鍵の外れっぱなしの屋上
校舎裏
 外周環状道路へ繋がる橋
}},
             ]

    result = ''

    tables.each_with_index do |table, i|
      tableName = table[:tableName]
      table = table[:table]

      text, index = get_table_by_1d6(table)

      result += "\n" unless i == 0
      result += "#{tableName}(#{index}) ＞ #{text}"
    end

    return result
  end

  def getTpicTableDiceCommandResult(command)
    return unless command == "STC"

    tableName = "シチュエーション表C：話題"

    table_1_3 = [
"未来の話：決闘を勝ち抜いたら、あるいは負けてしまったら……未来のふたりはどうなるのだろう。",
"衣服の話：冴えない服を着たりしていないか？　あるいはハイセンス過ぎたりしないだろうか。よぉし、私が選んであげよう!!",
"ステラバトルの話：世界の未来は私たちにかかっている。頭では分かっていても、まだ感情が追いつかないな……。",
"おいしいごはんの話：おいしいごはんは正義。１００年前も６４０５年前も異世界だろうと、きっと変わらない真理なのだ。おかわり！",
"家族の話：生徒たちは寮生活が多い。離れて暮らす家族は、どんな人たちなのか。いつかご挨拶に行きたいと言い出したりしても良いだろう。",
"次の週末の話：週末、何をしますか？　願いをかけた決闘の合間、日常のひとときも、きっと大切な時間に違いない。",
                ]

    table_4_6 = [
"好きな人の話：……好きな人、いるんですか？　これはきっと真剣な話。他の何よりも重要な話だ。",
"子供の頃の話：ちいさな頃、パートナーはどんな子供だったのだろうか。どんな遊びをしたのだろうか。",
"好きなタイプの話：パートナーはどんな人が好みなのでしょうか……。気になります、えぇ。",
"思い出話：ふたりの思い出、あるいは出会う前の思い出の話。",
"願いの話：叶えたい願いがあるからこそ、ふたりは出会った。この戦いに勝利したら、どんな形で願いを叶えるのだろうか。",
"ねぇ、あの子誰？：この前見かけたパートナーと一緒にいた子。あの子誰？だーれー!?　むー!!"
                ]

    table = [table_1_3, table_1_3, table_1_3,
             table_4_6, table_4_6, table_4_6, ].flatten

    text, index = get_table_by_d66(table)

    result = "#{tableName}(#{index}) ＞ #{text}"
    return result
  end

  def getAllSituationTableDiceCommandResult(command)
    return unless command == "ALLS"

    commands = ['STA', 'STB', 'STC']

    result = ""

    commands.each_with_index do |command, i|
      result += "\n" unless i == 0
      result += analyzeDiceCommandResultMethod(command)
    end

    return result
  end
end
