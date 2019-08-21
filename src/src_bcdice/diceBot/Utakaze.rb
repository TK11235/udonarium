# -*- coding: utf-8 -*-

class Utakaze < DiceBot
  setPrefixes(['\d*UK[@\d]*.*'])

  def initialize
    super
    @arrayDragonDiceName = ['', '風', '雨', '雲', '影', '月', '歌']
  end

  def gameName
    'ウタカゼ'
  end

  def gameType
    "Utakaze"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・行為判定ロール（nUK）
  n個のサイコロで行為判定ロール。ゾロ目の最大個数を成功レベルとして表示。nを省略すると2UK扱い。
  例）3UK ：サイコロ3個で行為判定
  例）UK  ：サイコロ2個で行為判定
  不等号用いた成否判定は現時点では実装してません。
・クリティカルコール付き行為判定ロール（nUK@c or nUKc）
　cに「龍のダイス目」を指定した行為判定ロール。
  ゾロ目ではなく、cと同じ値の出目数x2が成功レベルとなります。
  例）3UK@5 ：龍のダイス「月」でクリティカルコール宣言したサイコロ3個の行為判定
MESSAGETEXT
  end

  def isGetOriginalMessage
    true
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand command', command)

    result = ''

    case command
    when /(\d+)?UK(\@?(\d))?(>=(\d+))?/i
      base = ($1 || 2).to_i
      crit = $3.to_i
      diff = $5.to_i
      result = checkRoll(base, crit, diff)
    end

    return nil if result.empty?

    return "#{command} ＞ #{result}"
  end

  def checkRoll(base, crit, diff = 0)
    result = ""

    base = getValue(base)
    crit = getValue(crit)

    return result if base < 1

    crit = 6 if crit > 6

    result += "(#{base}d6)"

    _, diceText = roll(base, 6)

    diceList = diceText.split(/,/).collect { |i| i.to_i }.sort

    result += " ＞ [#{diceList.join(',')}] ＞ "
    result += getRollResultString(diceList, crit, diff)

    return result
  end

  def getRollResultString(diceList, crit, diff)
    success, maxnum, setCount = getSuccessInfo(diceList, crit, diff)

    result = ""

    if isDragonDice(crit)
      result += "龍のダイス「#{@arrayDragonDiceName[crit]}」(#{crit.to_s})を使用 ＞ "
    end

    if  success
      result += "成功レベル:#{maxnum} (#{setCount}セット)"
      if diff != 0
        diffSuccess = (maxnum >= diff)
        if diffSuccess
          result += " ＞ 成功"
        else
          result += " ＞ 失敗"
        end
      end

    else
      result += "失敗"
    end

    return result
  end

  def getSuccessInfo(diceList, crit, diff)
    debug("checkSuccess diceList, crit", diceList, crit)

    diceCountHash = getDiceCountHash(diceList, crit)
    debug("diceCountHash", diceCountHash)

    maxnum = 0
    successDiceList = []
    countThreshold = (isDragonDice(crit) ? 1 : 2)

    diceCountHash.each do |dice, count|
      maxnum = count if  count > maxnum
      successDiceList << dice if count >= countThreshold
    end

    debug("successDiceList", successDiceList)

    if successDiceList.size <= 0
      # 失敗：ゾロ目無し(全部違う)
      return false, 0, 0
    end

    # 竜のダイスの場合
    maxnum *= 2 if isDragonDice(crit)

    # 成功：ゾロ目あり
    return true, maxnum, successDiceList.size
  end

  def getDiceCountHash(diceList, crit)
    diceCountHash = diceList.inject(Hash.new(0)) do |hash, dice|
      if isNomalDice(crit) || (dice == crit)
        hash[dice] += 1
      end
      hash
    end

    return diceCountHash
  end

  def isNomalDice(crit)
    !isDragonDice(crit)
  end

  def isDragonDice(crit)
    (crit != 0)
  end

  def getValue(number)
    return 0 if number > 100

    return number
  end
end
