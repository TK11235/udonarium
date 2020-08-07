# -*- coding: utf-8 -*-
# frozen_string_literal: true

class AlterRaise < DiceBot
  # ゲームシステムの識別子
  ID = 'AlterRaise'

  # ゲームシステム名
  NAME = 'アルトレイズ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'あるとれいす'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
◆解放判定：EMA[x]

[x]で達成値を指定してください。省略時はダイスロールします。


【各種表】
◆性格傾向表：PER[n]　　　　　　 ◆場所表：LOC[ab]
◆平穏・経験表：QUI[ab]　　　　　◆喜び・経験表：DEL[ab]
◆心の傷・経験表：TRA[ab]　　　　◆シーン演出表：SCE[n]
◆スタンス表：STA[n]　　　　　　 ◆感情表：EMO[ab]

[]内のコマンドを省略でダイスロール、指定でROC結果を表示します。
[n]は「1D6」、[ab]は「D66」の出目を指定してください。

【書式例】
PER3：性格傾向表の「3」をROC
LOC52：場所表の「52」をROC
QUI：平穏・経験表をダイスロール
MESSAGETEXT

  setPrefixes([
    'EMA(\d+)?', 'PER(\d+)?', 'LOC(\d+)?', 'QUI(\d+)?', 'DEL(\d+)?',
    'TRA(\d+)?', 'SCE(\d+)?', 'STA(\d+)?', 'EMO(\d+)?'
  ])

  def rollDiceCommand(command)
    output =
      case command.upcase

      when /EMA(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_emancipation_table(roc)

      when /PER(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_personality_table(roc)

      when /LOC(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_location_table(roc)

      when /QUI(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_quiet_table(roc)

      when /DEL(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_delight_table(roc)

      when /TRA(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_trauma_table(roc)

      when /SCE(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_scene_production_table(roc)

      when /STA(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_stance_table(roc)

      when /EMO(\d+)?$/i
        roc = (Regexp.last_match(1) || 0).to_i
        get_emotion_table(roc)

      end

    return output
  end

  def get_emancipation_table(roc)
    name = "解放判定表"
    table = [
      [2, '激闘。今回の端末は想定をはるかに上回る脅威だった。幾本もの太刀筋と永遠のような時間の果てに、君たちは勝利した。深手を負ったが、ギリギリ致命傷ではない。'],
      [4, '辛勝。今回の端末は想定以上の大物だった。刃と牙のせめぎ合いの果て、君たちは辛くも勝利した。'],
      [6, '勝利。今回の端末は、おおむね想定される程度の個体であった。多少の傷は負ったが、君たちは問題なく勝利できた。'],
      [8, '快勝。今回の端末には、危うげも無く勝利できた。君とペアのコンビネーションの賜物だろう。かすり傷を負ったが、勲章のようなものだ。'],
      [10, '圧勝。今回の端末は、君たちの敵ではなかった。君とペアの剣撃は瞬く間に端末を寸断し、粒子の光に還元した。'],
      [12, '刹那。端末をその切っ先に捉えた刹那、君たちの前で粒子の光が舞う。それ以上何も起こることはなく、世界は色を取り戻した。'],
    ]

    if roc > 1
      dice = roc
      dice = 12 if dice > 12
      diceText = ''
    else
      dice, diceText = roll(2, 6)
      diceText = "(#{diceText})"
    end

    tableText = get_table_by_number(dice, table)
    # ''だと\nは文字列扱いに。
    tableText += "\n【達成値7以上】GM：攻撃ルーチン1つを開示（番号はペアPLが指定）　PL：戦闘開始時のアクセルレベル+1" if dice >= 7
    return "#{name} ＞ #{dice}#{diceText}：#{tableText}"
  end

  def get_personality_table(roc)
    name = "性格傾向表"
    table = [
      [1, '挑戦'],
      [2, '調和'],
      [3, '感性'],
      [4, '信念'],
      [5, '論理'],
      [6, '思慮']
    ]
    return get_AlterRaise_1d6_table_result(name, table, roc)
  end

  def get_location_table(roc)
    name = "場所表"
    table = [
      [13, '教室'],
      [16, '部室'],
      [23, '商店街'],
      [26, '田舎'],
      [33, '都会'],
      [36, '駅'],
      [43, 'バイト'],
      [46, 'ステージ'],
      [53, '図書館'],
      [56, '病院'],
      [63, '自然'],
      [66, '家']
    ]
    return get_AlterRaise_d66_table_result(name, table, roc)
  end

  def get_quiet_table(roc)
    name = "平穏・経験表"
    table = [
      [13, '友達'],
      [16, '幼馴染み'],
      [23, '両親'],
      [26, '兄弟'],
      [33, '親戚'],
      [36, '理解者'],
      [43, '友人'],
      [46, '仲間'],
      [53, '趣味'],
      [56, '練習'],
      [63, '一人'],
      [66, 'お気に入り']
    ]
    return get_AlterRaise_d66_table_result(name, table, roc)
  end

  def get_delight_table(roc)
    name = "喜び・経験表"
    table = [
      [13, '勝利'],
      [16, '優勝'],
      [23, '出会い'],
      [26, '理解'],
      [33, '幸運'],
      [36, 'プレゼント'],
      [43, '成就'],
      [46, '成長'],
      [53, '創造'],
      [56, '好転'],
      [63, '証明'],
      [66, '生還']
    ]
    return get_AlterRaise_d66_table_result(name, table, roc)
  end

  def get_trauma_table(roc)
    name = "心の傷・経験表"
    table = [
      [13, '敗北'],
      [16, '仲違い'],
      [23, '失恋'],
      [26, '無理解'],
      [33, '無力'],
      [36, '孤独'],
      [43, '別離'],
      [46, '死別'],
      [53, '損壊'],
      [56, '喪失'],
      [63, '病'],
      [66, '事故']
    ]
    return get_AlterRaise_d66_table_result(name, table, roc)
  end

  def get_scene_production_table(roc)
    name = "シーン演出表"
    table = [
      [1, '相談。君は相手に相談したいことがあった。'],
      [2, '遊び。君は相手と遊びたかった。'],
      [3, '案内。君は自身のアリウス・パーソナルを案内したかった。'],
      [4, '勝負。君は相手と何らかの勝負をしたかった。'],
      [5, 'お願い。君は相手にお願いしたいことがあった。'],
      [6, '扉を開く前に。アクセルダイブ・ゲートをくぐる前に、君は相手に話したいことがあった。（＊ダイブした後のシーンも演出すること）']
    ]
    return get_AlterRaise_1d6_table_result(name, table, roc)
  end

  def get_stance_table(roc)
    name = "スタンス表"
    table = [
      [1, '友人'],
      [2, '恋愛'],
      [3, '師事'],
      [4, 'ライバル'],
      [5, '家族'],
      [6, '守護']
    ]
    return get_AlterRaise_1d6_table_result(name, table, roc)
  end

  def get_emotion_table(roc)
    name = "感情表"
    table = [
      [13, '勇気'],
      [16, '怒り'],
      [23, '悲しみ'],
      [26, '喜び'],
      [33, '驚き'],
      [36, '恐れ'],
      [43, '安らぎ'],
      [46, '誠意'],
      [53, '庇護'],
      [56, '謝意'],
      [63, '信頼'],
      [66, '好意']
    ]
    return get_AlterRaise_d66_table_result(name, table, roc)
  end

  def get_AlterRaise_1d6_table_result(name, table, roc)
    if roc > 0
      dice = roc
      dice = 6 if dice > 6
    else
      dice, = roll(1, 6)
    end
    tableText = get_table_by_number(dice, table)
    return "#{name} ＞ #{dice}：#{tableText}"
  end

  def get_AlterRaise_d66_table_result(name, table, roc)
    if roc > 10
      diceText = roc.to_s
      dice1 = diceText[0, 1].to_i
      dice1 = 6 if dice1 > 6
      dice2 = diceText[1, 1].to_i
      dice2 = 1 if dice2 < 1
      dice2 = 6 if dice2 > 6
    elsif roc > 0
      dice1 = roc
      dice1 = 6 if dice1 > 6
      dice2, = roll(1, 6)
    else
      dice1, = roll(1, 6)
      dice2, = roll(1, 6)
    end
    dice = dice1 * 10 + dice2
    diceText = "#{dice1},#{dice2}"
    tableText = get_table_by_number(dice, table)
    return "#{name} ＞ #{diceText}：#{tableText}"
  end
end
