# -*- coding: utf-8 -*-
# frozen_string_literal: true

class BlindMythos < DiceBot
  # ゲームシステムの識別子
  ID = 'BlindMythos'

  # ゲームシステム名
  NAME = 'ブラインド・ミトスRPG'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ふらいんとみとすRPG'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・判定：BMx@y>=z、BMSx@y>=z
  　x:スキルレベル
　　y:目標難易度（省略可。デフォルト4）
　　z:必要成功度
　BMコマンドはダイスの振り足しを常に行い、
　BMSは振り足しを自動では行いません。
 例）BM>=1　BM@3>=1　BMS2>=1

・判定振り足し：ReRollx,x,x...@y>=1
  　x:振るダイスの個数
　　y:目標難易度（省略可。デフォルト4）
　　z:必要成功度
　振り足しを自動で行わない場合（BMSコマンド）に使用します。

・LE：失う感情表
・感情後遺症表 ESx
　ESH：喜、ESA：怒、ESS：哀、ESP：楽、ESL：愛、ESE：感
・DT：汚染チャート
・RPxyz：守護星表チェック
 xyz:守護星ナンバーを指定
 例）RP123　RP258
MESSAGETEXT

  def rollDiceCommand(command)
    debug("rollDiceCommand Begin")

    text = judgeRoll(command)
    return text unless text.nil?

    isStop = true
    text, = reRoll(command, isStop)
    return text unless text.nil?

    text = getRulingPlanetDiceCommandResult(command)
    return text unless text.nil?

    text = getDurtyTableCommandReuslt(command)
    return text unless text.nil?

    text = getTableCommandResult(command, TABLES)
    return text
  end

  def judgeRoll(command)
    return nil unless /^BM(S)?(\d*)(@(\d+))?>=(\d+)$/i =~ command

    isStop = !Regexp.last_match(1).nil?
    skillRank = Regexp.last_match(2).to_i
    judgeNumberText = Regexp.last_match(3)
    judgeNumber = (Regexp.last_match(4) || 4).to_i
    targetNumber = (Regexp.last_match(5) || 1).to_i

    message = ""
    diceCount = skillRank + 2
    isReRoll = false
    text, bitList, successList, countOneList, canReRoll =
      getRollResult([diceCount], judgeNumberText, judgeNumber, targetNumber, isReRoll, isStop)

    message += text
    message += getTotalResultMessageText(bitList, successList, countOneList, targetNumber, isStop, canReRoll)

    return message
  end

  def reRoll(command, isStop)
    debug("ReRoll Begin", command)

    return nil unless /^ReRoll([\d,]+)(@(\d+))?>=(\d+)$/i =~ command

    debug("ReRoll pass")

    rerollCountsText = Regexp.last_match(1)
    judgeNumberText = Regexp.last_match(2)
    judgeNumber = (Regexp.last_match(3) || 4).to_i
    targetNumber = Regexp.last_match(4).to_i

    rerollCounts = rerollCountsText.split(/,/).collect { |i| i.to_i }

    commandText = ""
    rerollCounts.each do |diceCount|
      commandText += "," unless commandText.empty?
      commandText += "ReRoll#{diceCount}#{judgeNumberText}>=#{targetNumber}"
    end

    debug("commandText", commandText)

    message = ""
    if rerollCounts.size > 1
      message += "(#{commandText})" if isStop
    end
    message += "\n"
    isReRoll = true
    text, _bitList, successList, countOneList, =
      getRollResult(rerollCounts, judgeNumberText, judgeNumber, targetNumber, isReRoll, isStop)

    message += text

    return message, successList, countOneList, targetNumber
  end

  def getRollResult(rerollCounts, judgeNumberText, judgeNumber, targetNumber, isReRoll, isStop)
    bitList = []
    successList = []
    countOneList = []
    rerollTargetList = []

    message = ""
    rerollCounts.each_with_index do |diceCount, index|
      message += "\n" unless index == 0

      commandName = "ReRoll#{diceCount}"
      unless isReRoll
        if isStop
          commandName = "BMS#{diceCount - 2}"
        else
          commandName = "BM#{diceCount - 2}"
        end
      end
      commandText = "#{commandName}#{judgeNumberText}>=#{targetNumber}"

      isSort = 1
      _, diceText, = roll(diceCount, 6, isSort)

      diceList = diceText.split(/,/).collect { |i| i.to_i }

      message += " ＞ " if isReRoll
      message += "(#{commandText}) ＞ #{diceCount}D6[#{diceText}] ＞ "

      success, countOne, resultText = getSuccessResultText(diceList, judgeNumber)
      bitList += diceList.find_all { |i| i >= 4 } unless isReRoll
      successList << success
      countOneList << countOne
      message += resultText

      sameDiceList = getSameDieList(diceList)
      next if sameDiceList.empty?

      rerollText = ""
      sameDiceList.each do |list|
        rerollText += "," unless rerollText.empty?
        rerollText += list.join('')
      end

      rerollTargetList << sameDiceList.collect { |i| i.count }.join(",")

      message += "、リロール[#{rerollText}]"
    end

    rerollCommand = ""
    unless rerollTargetList.empty?
      rerollCommand = "ReRoll#{rerollTargetList.join(',')}#{judgeNumberText}>=#{targetNumber}"
      message += "\n ＞ コマンド：#{rerollCommand}" if isStop
    end

    canReRoll = !rerollCommand.empty?

    if canReRoll
      unless isStop
        text, successListTmp, countOneListTmp, = reRoll(rerollCommand, isStop)
        message += text
        successList += successListTmp
        countOneList += countOneListTmp
      end
    end

    return message, bitList, successList, countOneList, canReRoll
  end

  def getTotalResultMessageText(bitList, successList, countOneList, targetNumber, isStop, canReRoll)
    success = successList.inject { |sum, i| sum + i }
    countOne = countOneList.inject { |sum, i| sum + i }

    result = ""

    if successList.size > 1
      result += "\n ＞ 最終成功数:#{success}"
    end

    if canReRoll && isStop
      result += "\n"

      if success >= targetNumber
        result += " ＞ 現状で成功。コマンド実行で追加リロールも可能"
      else
        result += " ＞ 現状のままでは失敗"
        result += "。汚染ポイント+#{countOne}" if countOne >= 1
      end

      return result
    end

    if success >= targetNumber
      result += " ＞ 成功"

      if bitList.size >= 1
        result += "、禁書ビット発生[#{bitList.join(',')}]"
      end

    else
      result += " ＞ 失敗"
      result += "。汚染ポイント+#{countOne}" if countOne >= 1
    end

    return result
  end

  def getSameDieList(diceList)
    sameDiceList = []

    diceList.uniq.each do |i|
      next if i == 1

      list = diceList.find_all { |dice| dice == i }
      next if list.length <= 1

      sameDiceList << list
    end

    return sameDiceList
  end

  def getSuccessResultText(diceList, judgeNumber)
    success = 0
    countOne = 0

    diceList.each do |i|
      countOne += 1 if i == 1

      next unless i >= judgeNumber

      success += 1
    end

    result = "成功数:#{success}"

    return success, countOne, result
  end

  def getRulingPlanetDiceCommandResult(command)
    return nil unless /^RP(\d+)/i === command

    targetNumbers = Regexp.last_match(1).split(//).collect { |i| i.to_i }
    diceList = getRulingPlanetDice

    matchResult = "失敗"
    targetNumbers.each do |i|
      if diceList.include?(i)
        matchResult = "発動"
        break
      end
    end

    text = "守護星表チェック(#{targetNumbers.join(',')}) ＞ #{diceList.count}D10[#{diceList.join(',')}] ＞ #{matchResult}"

    return text
  end

  def getRulingPlanetDice
    dice1, = roll(1, 10)
    dice2 = dice1

    while dice1 == dice2
      dice2, = roll(1, 10)
    end

    dice1 = changeRulingPlanetDice(dice1)
    dice2 = changeRulingPlanetDice(dice2)

    return dice1, dice2
  end

  def changeRulingPlanetDice(dice)
    return 0 if dice == 10

    return dice
  end

  def getDurtyTableCommandReuslt(command)
    return nil unless /^DT$/i =~ command

    table = <<__TABLE_END__
汚染チャートを２回振り、その効果を適用する（1・2-2,5・6-12 なら振り直す）
ＰＣ全員の「トラウマ」「喪失」すべてに２ダメージ
ＰＣ全員の「喪失」２つに４ダメージ
ＰＣ全員の「トラウマ」すべてに２ダメージ。その後さらに汚染が２増える
ＰＣ全員、１つの【記憶】の両方の値が０になる。このときアクロバットダイス獲得不可
ＰＣ全員の「喪失」１つに４ダメージ。このときアクロバットダイス獲得不可
ＰＣ全員の「トラウマ」すべてに１ダメージ。その後さらに汚染が３増える
ＰＣ全員の「トラウマ」すべてに１ダメージ。その後アクロバットダイスをＰＣ人数分失う
ＰＣ全員の「喪失」すべてに２ダメージ。禁書ビットをすべて失う
ＰＣ全員の「トラウマ」２つに３ダメージ。その後さらに汚染が１増える
ＰＣ全員の「トラウマ」「喪失」すべてに１ダメージ
ＰＣ全員の「喪失」１つに４ダメージ。禁書ビットをすべて失う
ＰＣ全員の「トラウマ」すべてに２ダメージ
ＰＣ全員の１つの【記憶】の「トラウマ」「喪失」それぞれに３ダメージ
ＰＣ全員の「喪失」すべてに１ダメージ
ＰＣ全員の「トラウマ」３つに２ダメージ
ＰＣ全員の「トラウマ」と「喪失」それぞれ１つに３ダメージ
ＰＣ全員の「喪失」３つに２ダメージ
ＰＣ全員のすべての「トラウマ」に1 ダメージ
ＰＣ全員のひとつの【記憶】の「トラウマ」「喪失」それぞれに３ダメージ
ＰＣ全員の「喪失」すべてに２ダメージ
ＰＣ全員の「トラウマ」ひとつに４ダメージ。禁書ビットをすべて失う
ＰＣ全員の「トラウマ」「喪失」すべてに１ダメージ
ＰＣ全員の「喪失」２つに３ダメージ。その後さらに汚染が１増える
ＰＣ全員の「トラウマ」すべてに２ダメージ。禁書ビットをすべて失う
ＰＣ全員の「喪失」すべてに１ダメージ。その後アクロバットダイスをＰＣ人数分失う
ＰＣ全員の「喪失」すべてに１ダメージ。その後さらに汚染が３増える
ＰＣ全員の「トラウマ」１つに４ダメージ。このときアクロバットダイス獲得不可
ＰＣ全員、１つの【記憶】の両方の値が０になる。このときアクロバットダイス獲得不可
ＰＣ全員の「喪失」すべてに２ダメージ。その後さらに汚染が２増える
ＰＣ全員の「トラウマ」２つに４ダメージ
ＰＣ全員の「トラウマ」「喪失」すべてに２ダメージ
汚染チャートを２回振り、その効果を適用する（1・2-2,5・6-12 なら振り直す）
__TABLE_END__

    table = table.split("\n")

    dice1, = roll(1, 6)
    dice2, = roll(2, 6)

    index = (dice2 - 2) * 3 + (dice1 / 2.0).ceil - 1

    return "汚染チャート(#{dice1},#{dice2}) ＞ #{table[index]}"
  end

  TABLES =
    {
      'LE' => {
        :name => "失う感情表",
        :type => '1D6',
        :table => %w{
          喜：喜びは消えた。嬉しい気持ちとは、なんだっただろう。
          怒：激情は失われ、憎しみもどこかへと消える。
          哀：どんなに辛くても、悲しさを感じない。どうやら涙も涸れたらしい。
          楽：もはや楽しいことなどない。希望を抱くだけ無駄なのだ。
          愛：愛など幻想……無力で儚い、役に立たない世迷い言だ。
          感：なにを見ても、感動はない。心は凍てついている。
        },
      },

      'ESH' => {
        :name => "「喜」の感情後遺症表",
        :type => '2D6',
        :table => %w{
          日々喜びを求めてしまう。
          日々喜びを求めてしまう。
          嬉しい時間が長続きしない。
          素直に喜びを共有できないことがある。
          小さなことで大きく喜びを感じる。
          小さなことで大きく喜びを感じる。
          影響なし。
          影響なし。
          「喜」の後遺症をひとつ消してもよい。
          「喜」の後遺症をひとつ消してもよい。
          「喜」の後遺症をひとつ消してもよい。
        },
      },

      'ESA' => {
        :name => "「怒」の感情後遺症表",
        :type => '2D6',
        :table => %w{
          始終不機嫌になる。
          始終不機嫌になる。
          一度怒ると、なかなか収まらない。
          怒りっぽくなる
          怒りかたが激しくなる。
          怒りかたが激しくなる。
          影響なし。
          影響なし。
          「怒」の後遺症をひとつ消してもよい。
          「怒」の後遺症をひとつ消してもよい。
          「怒」の後遺症をひとつ消してもよい。
        },
      },

      'ESS' => {
        :name => "「哀」の感情後遺症表",
        :type => '2D6',
        :table => %w{
          一度涙が出るとなかなか止まらない。
          一度涙が出るとなかなか止まらない。
          夜、哀しいことを思い出して目が覚める。
          不意に哀しい気持ちになる。
          涙もろくなる。
          涙もろくなる。
          影響なし。
          影響なし。
          「哀」の後遺症をひとつ消してもよい。
          「哀」の後遺症をひとつ消してもよい。
          「哀」の後遺症をひとつ消してもよい。
        },
      },

      'ESP' => {
        :name => "「楽」の感情後遺症表",
        :type => '2D6',
        :table => %w{
          突然陽気になったり、不意に笑い出してしまう。
          突然陽気になったり、不意に笑い出してしまう。
          周りが楽しくなさそうだと不安になる。
          楽しいことがないと落ち着かない。
          些細なことでも笑ってしまう。
          些細なことでも笑ってしまう。
          影響なし。
          影響なし。
          「楽」の後遺症をひとつ消してもよい。
          「楽」の後遺症をひとつ消してもよい。
          「楽」の後遺症をひとつ消してもよい。
        },
      },

      'ESL' => {
        :name => "「愛」の感情後遺症表",
        :type => '2D6',
        :table => %w{
          少しでも気になる相手に愛を求めてしまう。
          少しでも気になる相手に愛を求めてしまう。
          愛する相手（恋人・家族・ペット・空想）から離れたくない。
          誰彼構わず優しくしてしまう。
          ひとりでいると不安を感じる。
          ひとりでいると不安を感じる。
          影響なし。
          影響なし。
          「愛」の後遺症をひとつ消してもよい。
          「愛」の後遺症をひとつ消してもよい。
          「愛」の後遺症をひとつ消してもよい。
        },
      },

      'ESE' => {
        :name => "「感」の感情後遺症表",
        :type => '2D6',
        :table => %w{
          感動を共有できない相手を不信に思ってしまう。
          感動を共有できない相手を不信に思ってしまう。
          嬉しくても哀しくてもすぐに涙が出る。
          リアクションがオーバーになる。
          ちょっとしたことで感動する。
          ちょっとしたことで感動する。
          影響なし。
          影響なし。
          「感」の後遺症をひとつ消してもよい。
          「感」の後遺症をひとつ消してもよい。
          「感」の後遺症をひとつ消してもよい。
        },
      },

    }.freeze

  setPrefixes(['BM.*', 'ReRoll\d+.*', 'RP\d+', 'DT'] + TABLES.keys)
end
