# -*- coding: utf-8 -*-

class DetatokoSaga < DiceBot
  setPrefixes([
    '\d+DS.*', '\d+JD.*',
    'SST', 'StrengthStigmaTable',
    'WST', 'WillStigmaTable',
    'SBET', 'StrengthBadEndTable',
    'WBET', 'WillBadEndTable'
  ])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @d66Type = 2
  end

  def gameName
    'でたとこサーガ'
  end

  def gameType
    "DetatokoSaga"
  end

  def getHelpMessage
    info = <<INFO_MESSAGE_TEXT
・通常判定　xDS or xDSy or xDS>=z or xDSy>=z
　(x＝スキルレベル、y＝現在フラグ値(省略時0)、z＝目標値(省略時８))
　例）3DS　2DS5　0DS　3DS>=10　3DS7>=12
・判定値　xJD or xJDy or xJDy+z or xJDy-z or xJDy/z
　(x＝スキルレベル、y＝現在フラグ値(省略時0)、z＝修正値(省略時０))
　例）3JD　2JD5　3JD7+1　4JD/3
・体力烙印表　SST (StrengthStigmaTable)
・気力烙印表　WST (WillStigmaTable)
・体力バッドエンド表　SBET (StrengthBadEndTable)
・気力バッドエンド表　WBET (WillBadEndTable)
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    debug("rollDiceCommand begin string", command)

    result = ''

    result = checkRoll(command)
    return result unless result.empty?

    result = checkJudgeValue(command)
    return result unless result.empty?

    debug("各種表として処理")
    return rollTableCommand(command)
  end

  # 通常判定　xDS or xDSy or xDS>=z or xDSy>=z
  def checkRoll(string)
    debug("checkRoll begin string", string)

    return '' unless /^(\d+)DS(\d+)?((>=)(\d+))?$/i =~ string

    target = 8

    skill = Regexp.last_match(1).to_i
    flag = Regexp.last_match(2).to_i
    target = Regexp.last_match(5).to_i unless Regexp.last_match(5).nil?

    result = "判定！　スキルレベル：#{skill}　フラグ：#{flag}　目標値：#{target}"

    total, rollText = getRollResult(skill)
    result += " ＞ #{total}[#{rollText}] ＞ 判定値：#{total}"

    success = getSuccess(total, target)
    result += " ＞ #{success}"

    result += getCheckFlagResult(total, flag)

    return result
  end

  def getRollResult(skill)
    diceCount = skill + 1
    diceCount = 3 if  skill == 0

    dice = []
    diceCount.times do |i|
      dice[i], = roll(1, 6)
    end

    diceText = dice.join(',')

    dice = dice.sort
    dice = dice.reverse if skill != 0

    total = dice[0] + dice[1]

    return total, diceText
  end

  def getSuccess(check, target)
    if check >= target
      return "目標値以上！【成功】"
    end

    return "目標値未満…【失敗】"
  end

  def getCheckFlagResult(total, flag)
    if total > flag
      return ""
    end

    willText = getDownWill(flag)
    result = "、フラグ以下！【気力#{willText}点減少】"
    result += "【判定値変更不可】"

    return result
  end

  def getDownWill(flag)
    if flag >= 10
      return "6"
    end

    dice, = roll(1, 6)
    return "1D6->#{dice}"
  end

  # スキル判定値　xJD or xJDy or xJDy+z or xJDy-z or xJDy/z
  def checkJudgeValue(string)
    debug("checkJudgeValue begin string", string)

    return '' unless %r{^(\d+)JD(\d+)?(([+]|[-]|[/])(\d+))?$}i =~ string

    skill = Regexp.last_match(1).to_i
    flag = Regexp.last_match(2).to_i
    operator = Regexp.last_match(4)
    value = Regexp.last_match(5).to_i

    result = "判定！　スキルレベル：#{skill}　フラグ：#{flag}"

    modifyText = getModifyText(operator, value)
    result += "　修正値：#{modifyText}" unless modifyText.empty?

    total, rollText = getRollResult(skill)
    result += " ＞ #{total}[#{rollText}]#{modifyText}"

    totalResult = getTotalResultValue(total, value, operator)
    result += " ＞ #{totalResult}"

    result += getCheckFlagResult(total, flag)

    return result
  end

  def getModifyText(operator, value)
    return "" if( value == 0) # TKfix
    operatorText =
      case operator
      when "+"
        "＋"
      when "-"
        "－"
      when "/"
        "÷"
      else
        return ""
      end

    return "#{operatorText}#{value}"
  end

  def getTotalResultValue(total, value, operator)
    case operator
    when "+"
      return "#{total}+#{value} ＞ 判定値：#{total + value}"
    when "-"
      return "#{total}-#{value} ＞ 判定値：#{total - value}"
    when "/"
      return getTotalResultValueWhenSlash(total, value)
    else
      return "判定値：#{total}"
    end
  end

  def getTotalResultValueWhenSlash(total, value)
    return "0では割れません" if value == 0

    quotient = ((1.0 * total) / value).ceil

    result = "#{total}÷#{value} ＞ 判定値：#{quotient}"
    return result
  end

  ####################
  # 各種表

  def rollTableCommand(command)
    command = command.upcase
    result = []

    debug("rollDiceCommand command", command)

    name = ''
    text = ''
    total = 0

    case command.upcase
    when "SST", "StrengthStigmaTable".upcase
      name, text, total = choiceStrengthStigmaTable()
    when "WST", "WillStigmaTable".upcase
      name, text, total = choiceWillStigmaTable()
    when "SBET", "StrengthBadEndTable".upcase
      name, text, total = choiceStrengthBadEndTable()
    when "WBET", "WillBadEndTable".upcase
      name, text, total = choiceWillBadEndTable()
    else
      return
    end

    result = "#{name}(#{total}) ＞ #{text}"

    return result
  end

  # ##表一覧

  def choiceStrengthStigmaTable()
    name = "体力烙印表"
    table = %w{
      あなたは【烙印】を２つ受ける。この表をさらに２回振って受ける【烙印】を決める（その結果、再びこの出目が出ても【烙印】は増えない）。
      【痛手】手負い傷を負った。何とか戦えているが……。
      【流血】血があふれ出し、目がかすむ……。
      【衰弱】体が弱り、その心さえも萎えてしまいそうだ……。
      【苦悶】痛みと苦しみ、情けなさ。目に涙がにじむ。
      【衝撃】吹き飛ばされ、壁や樹木にめりこむ。早く起き上がらねば。
      【疲労】あなたの顔に疲労の色が強まる……この戦いがつらくなってきた。
      【怒号】うっとうしい攻撃に怒りの叫びを放つ。怒りが戦いを迷わせるか？
      【負傷】手傷を負わされた……。
      【軽症】あなたの肌に傷が残った。これだけなら何ということもない。
      奇跡的にあなたは【烙印】を受けなかった。
    }

    text, total = get_table_by_2d6(table)
    return name, text, total
  end

  def choiceWillStigmaTable()
    name = "気力烙印表"

    table = %w{
      あなたは【烙印】を２つ受ける。この表をさらに２回振って受ける【烙印】を決める（その結果、再びこの出目が出ても【烙印】は増えない）。
      【絶望】どうしようもない状況。希望は失われ……膝を付くことしかできない。
      【号泣】あまりの理不尽に、子供のように泣き叫ぶことしかできない。
      【後悔】こんなはずじゃなかったのに。しかし現実は非情だった。
      【恐怖】恐怖に囚われてしまった！敵が、己の手が、恐ろしくてならない！
      【葛藤】本当にこれでいいのか？何度も自身への問いかけが起こる……。
      【憎悪】怒りと憎しみに囚われたあなたは、本来の力を発揮できるだろうか？
      【呆然】これは現実なのか？ぼんやりとしながらあなたは考える。
      【迷い】迷いを抱いてしまった。それは戦う意志を鈍らせるだろうか？
      【悪夢】これから時折、あなたはこの時を悪夢に見ることだろう。
      奇跡的にあなたは【烙印】を受けなかった。
    }

    text, total = get_table_by_2d6(table)
    return name, text, total
  end

  def choiceStrengthBadEndTable()
    name = "体力バッドエンド表"

    table = %w{
      【死亡】あなたは死んだ。次のセッションに参加するには、クラス１つを『モンスター』か『暗黒』にクラスチェンジしなくてはいけない。
      【命乞】あなたは恐怖に駆られ、命乞いをしてしまった！次のセッション開始時に、クラス１つが『ザコ』に変更される！
      【忘却】あなたは記憶を失い、ぼんやりと立ち尽くす。次のセッションに参加するには、クラス１つを変更しなくてはならない。
      【悲劇】あなたの攻撃は敵ではなく味方を撃った！全てが終わるまであなたは立ち尽くしていた。任意の味方の【体力】を１Ｄ６点減少させる。
      【暴走】あなたは正気を失い、衝動のまま暴走する！同じシーンにいる全員の【体力】を１Ｄ６点減少させる。
      【転落】あなたは断崖絶壁から転落した。
      【虜囚】あなたは敵に囚われた。
      【逃走】あなたは恐れをなし、仲間を見捨てて逃げ出した。
      【重症】あなたはどうしようもない痛手を負い、倒れた。
      【気絶】あなたは気を失った。そして目覚めれば全てが終わっていた。
      それでもまだ立ち上がる！あなたはバッドエンドを迎えなかった。体力の【烙印】を１つ打ち消してよい。
    }

    text, total = get_table_by_2d6(table)
    return name, text, total
  end

  def choiceWillBadEndTable()
    name = "気力バッドエンド表"

    table = %w{
      【自害】あなたは自ら死を選んだ。次のセッションに参加するには、クラス１つを『暗黒』にクラスチェンジしなくてはいけない。
      【堕落】あなたは心の中の闇に飲まれた。次のセッション開始時に、クラス１つが『暗黒』か『モンスター』に変更される！
      【隷属】あなたは敵の言うことに逆らえない。次のセッションであなたのスタンスは『従属』になる。
      【裏切】裏切りの衝動。任意の味方の【体力】を１Ｄ６点減少させ、その場から逃げ出す。
      【暴走】あなたは正気を失い、衝動のまま暴走する！同じシーンにいる全員の【体力】を１Ｄ６点減少させる。
      【呪い】心の闇が顕在化したのか。敵の怨嗟か。呪いに蝕まれたあなたは、のたうちまわることしかできない。
      【虜囚】あなたは敵に囚われ、その場から連れ去られる。
      【逃走】あなたは恐れをなし、仲間を見捨てて逃げ出した。
      【放心】あなたはただぼんやりと立ち尽くすしかなかった。我に返った時、全ては終わっていた。
      【気絶】あなたは気を失った。そして目覚めれば全てが終わっていた。
      それでもまだ諦めない！あなたはバッドエンドを迎えなかった。あなたは気力の【烙印】を１つ打ち消してよい。
    }

    text, total = get_table_by_2d6(table)
    return name, text, total
  end
end
