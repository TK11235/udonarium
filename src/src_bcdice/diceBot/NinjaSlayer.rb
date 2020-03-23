# -*- coding: utf-8 -*-

require 'diceBot/DiceBot'

class NinjaSlayer < DiceBot
  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes([
    'NJ\d+.*',
    'EV\d+.*',
    'AT\d+.*',
    'EL\d+.*',
    'SB'
  ])

  def initialize
    super

    @defaultSuccessTarget = ">=4"
  end

  def gameName
    'ニンジャスレイヤーTRPG'
  end

  def gameType
    "NinjaSlayer"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・通常判定　NJ
　NJx[y] or NJx@y or NJx
　x=判定ダイス y=難易度 省略時はNORMAL(4)
　例:NJ4@H 難易度HARD、判定ダイス4で判定
・回避判定　EV
　EVx[y]/z or EVx@y/z or EVx/z or EVx[y] or EVx@y or EVx
　x=判定ダイス y=難易度 z=攻撃側の成功数(省略可) 難易度を省略時はNORMAL(4)
　攻撃側の成功数を指定した場合、カウンターカラテ発生時には表示
　例:EV5/3 難易度NORMAL(省略時)、判定ダイス5、攻撃側の成功数3で判定
・近接攻撃　AT
　ATx[y] or ATx@y or ATx
　x=判定ダイス y=難易度 省略時はNORMAL(4) サツバツ！発生時には表示
　例:AT6[H] 難易度HARD,判定ダイス5で近接攻撃の判定
・サツバツ判定　SB
・電子戦　EL
　ELx[y] or ELx@y or ELx
　x=判定ダイス y=難易度 省略時はNORMAL(4)
　例:EL6[H] 難易度HARD,判定ダイス5で電子戦の判定

・難易度
　KIDS=K,EASY=E,NORMAL=N,HARD=H,ULTRA HARD=UH 数字にも対応
MESSAGETEXT
  end

  # 難易度の値の正規表現
  DIFFICULTY_VALUE_RE = /UH|[2-6KENH]/i.freeze
  # 難易度の正規表現
  DIFFICULTY_RE = /\[(#{DIFFICULTY_VALUE_RE})\]|@(#{DIFFICULTY_VALUE_RE})/io.freeze

  # 通常判定の正規表現
  # NJ_RE = /\ANJ(\d+)#{DIFFICULTY_RE}?\z/io.freeze
  NJ_RE = /\ANJ(\d+)(?:\[(UH|[2-6KENH])\]|@(UH|[2-6KENH]))?\z/io.freeze # TKfix 式展開
  # 回避判定の正規表現
  # EV_RE = %r{\AEV(\d+)#{DIFFICULTY_RE}?(?:/(\d+))?\z}io.freeze
  EV_RE = %r{\AEV(\d+)(?:\[(UH|[2-6KENH])\]|@(UH|[2-6KENH]))?(?:/(\d+))?\z}io.freeze # TKfix 式展開
  # 近接攻撃の正規表現
  # AT_RE = /\AAT(\d+)#{DIFFICULTY_RE}?\z/io.freeze
  AT_RE = /\AAT(\d+)(?:\[(UH|[2-6KENH])\]|@(UH|[2-6KENH]))?\z/io.freeze # TKfix 式展開
  # 電子戦の正規表現
  # EL_RE = /\AEL(\d+)#{DIFFICULTY_RE}?\z/io.freeze
  EL_RE = /\AEL(\d+)(?:\[(UH|[2-6KENH])\]|@(UH|[2-6KENH]))?\z/io.freeze # TKfix 式展開

  # バラバラロール結果の "(" の前までの先頭部分
  B_ROLL_RESULT_HEAD_RE = /\A[^(]+/.freeze

  # 回避判定のノード
  EV = Struct.new(:num, :difficulty, :targetValue)
  # 近接攻撃のノード
  AT = Struct.new(:num, :difficulty)
  # 電子戦のノード
  EL = Struct.new(:num, :difficulty)

  # 難易度の文字表現から整数値への対応
  DIFFICULTY_SYMBOL_TO_INTEGER = {
    'K' => 2,
    'E' => 3,
    'N' => 4,
    'H' => 5,
    'UH' => 6
  }.freeze

  def changeText(str)
    m = NJ_RE.match(str)
    return str unless m

    return bRollCommand(m[1], integerValueOfDifficulty(m[2] || m[3]))
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand begin string', command)

    case node = parse(command)
    when EV
      return executeEV(node)
    when AT
      return executeAT(node)
    when EL
      return executeEL(node)
    when :SB
      return executeSB
    else
      return nil
    end
  end

  private

  # 構文解析する
  # @param [String] command コマンド文字列
  # @return [EV, AT, EL, nil]
  def parse(command)
    case command
    when EV_RE
      return parseEV(Regexp.last_match)
    when AT_RE
      return parseAT(Regexp.last_match)
    when EL_RE
      return parseEL(Regexp.last_match)
    when 'SB'
      return :SB
    else
      return nil
    end
  end

  # 正規表現のマッチ情報から回避判定ノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [EV]
  def parseEV(m)
    num = m[1].to_i
    difficulty = integerValueOfDifficulty(m[2] || m[3])
    targetValue = m[4] && m[4].to_i

    return EV.new(num, difficulty, targetValue)
  end

  # 正規表現のマッチ情報から近接攻撃ノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [AT]
  def parseAT(m)
    num = m[1].to_i
    difficulty = integerValueOfDifficulty(m[2] || m[3])

    return AT.new(num, difficulty)
  end

  # 正規表現のマッチ情報から電子戦ノードを作る
  # @param [MatchData] m 正規表現のマッチ情報
  # @return [EL]
  def parseEL(m)
    num = m[1].to_i
    difficulty = integerValueOfDifficulty(m[2] || m[3])

    return EL.new(num, difficulty)
  end

  # 回避判定を行う
  # @param [EV] ev 回避判定ノード
  # @return [String] 回避判定結果
  def executeEV(ev)
    command = bRollCommand(ev.num, ev.difficulty)

    rollResult = bcdice.bdice(command).sub(B_ROLL_RESULT_HEAD_RE, '')
    return rollResult unless ev.targetValue

    m = /成功数(\d+)/.match(rollResult)
    raise '成功数が見つかりません' unless m

    numOfSuccesses = m[1].to_i
    if numOfSuccesses > ev.targetValue
      return "#{rollResult} ＞ カウンターカラテ!!"
    end

    return rollResult
  end

  # 近接攻撃を行う
  # @param [AT] at 近接攻撃ノード
  # @return [String] 近接攻撃結果
  def executeAT(at)
    command = bRollCommand(at.num, at.difficulty)
    rollResult = bcdice.bdice(command).sub(B_ROLL_RESULT_HEAD_RE, '')

    # バラバラロールの出目を取得する
    # TODO: バラバラロールの結果として、出目を配列で取得できるようにする
    m = /＞ (\d+(?:,\d+)*)/.match(rollResult)
    values = m[1].split(',').map(&:to_i)

    numOfMaxValues = values.select { |v| v == 6 }.length

    return numOfMaxValues >= 2 ? "#{rollResult} ＞ サツバツ!!" : rollResult
  end

  # 電子戦を行う
  # @param [EL] el 電子戦ノード
  # @return [String] 電子戦結果
  def executeEL(el)
    command = bRollCommand(el.num, el.difficulty)
    rollResult = bcdice.bdice(command).sub(B_ROLL_RESULT_HEAD_RE, '')

    # バラバラロールの出目を取得する
    # TODO: バラバラロールの結果として、出目を配列で取得できるようにする
    m = /＞ (\d+(?:,\d+)*)/.match(rollResult)
    values = m[1].split(',').map(&:to_i)

    numOfMaxValues = values.select { |v| v == 6 }.length

    sumOfTrueValues = values.select { |v| v >= el.difficulty }.length

    return numOfMaxValues >= 1 ? "#{rollResult} + #{numOfMaxValues} ＞ #{sumOfTrueValues + numOfMaxValues}" : rollResult
  end

  # サツバツ判定を行う
  def executeSB
    table_name = "サツバツ表"
    table = [
      '「死ねーッ！」腹部に強烈な一撃！　敵はくの字に折れ曲がり、ワイヤーアクションめいて吹っ飛んだ！：本来のダメージ＋１ダメージを与える。敵は後方の壁または障害物に向かって、何マスでもまっすぐ弾き飛ばされる（他のキャラのいるマスは通過する）。壁または障害物に接触した時点で、敵はさらに１ダメージを受ける。敵はこの激突ダメージに対して改めて『回避判定』を行っても良い。',
      '「イヤーッ！」頭部への痛烈なカラテ！　眼球破壊もしくは激しい脳震盪が敵を襲う！：本来のダメージを与える。さらに敵の【ニューロン】と【ワザマエ】がそれぞれ１ずつ減少する（これによる最低値は１）。残虐ボーナスにより【万札】がD３発生。この攻撃を【カルマ：善】のキャラに対して行ってしまった場合、【DKK】がD３上昇する。',
      '「苦しみ抜いて死ぬがいい」急所を情け容赦なく破壊！：本来のダメージ＋１ダメージを与える。耐え難い苦痛により、敵は【精神力】が–２され、【ニューロン】が１減少する（これによる最低値は１）。残虐ボーナスにより【万札】がD３発生。この攻撃を【カルマ：善】のキャラに対して行ってしまった場合、【DKK】がD３上昇する。',
      '「逃げられるものなら逃げてみよ」敵の脚を粉砕！：本来のダメージを与える。さらに敵の【脚力】がD３減少する（最低値は１）。残虐ボーナスにより【万札】がD３発生。この攻撃を【カルマ：善】のキャラに対して行ってしまった場合、【DKK】がD３上昇する。',
      '「これで手も足も出まい！」敵の両腕を切り飛ばした！　鮮血がスプリンクラーめいて噴き出す！：本来のダメージ＋１ダメージを与える。さらに敵の【ワザマエ】と【カラテ】がそれぞれ２減少する（最低値は１）。残虐ボーナスにより【万札】がD３発生。この攻撃を【カルマ：善】のキャラに対して行ってしまった場合、【DKK】がD３上昇する。',
      '「イイイヤアアアアーーーーッ！」ヤリめいたチョップが敵の胸を貫通！　さらに心臓を掴み取り、握りつぶした！　ナムアミダブツ！：敵は残り【体力】に関係なく即死する。残虐ボーナスにより【万札】がD６発生。この攻撃を【カルマ：善】のキャラに対して行ってしまった場合、【DKK】がD６上昇する。'
    ]

    info, number = get_table_by_1d6(table)
    text = "#{table_name}(#{number}) ＞ #{info}"

    return text
  end

  # 難易度の整数値を返す
  # @param [String, nil] s 難易度表記
  # @return [Integer] 難易度の整数値
  # @raise [KeyError, IndexError] 無効な難易度表記が渡された場合。
  #
  # sは2から6までの数字あるいは'K', 'E', 'N', 'H', 'UH'。
  # sがnilの場合は 4 を返す。
  def integerValueOfDifficulty(s)
    return 4 unless s

    return s.to_i if /\A[2-6]\z/.match(s)

    return DIFFICULTY_SYMBOL_TO_INTEGER.fetch(s.upcase)
  end

  # バラバラロールのコマンドを返す
  # @param [#to_s] num ダイス数
  # @param [#to_s] difficulty 難易度
  # @return [String]
  def bRollCommand(num, difficulty)
    "#{num}B6>=#{difficulty}"
  end
end
