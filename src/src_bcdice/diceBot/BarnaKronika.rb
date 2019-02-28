# -*- coding: utf-8 -*-

class BarnaKronika < DiceBot
  setPrefixes(['\d+BK', '\d+BA', '\d+BKC\d+', '\d+BAC\d+'])

  def initialize
    super
    @sendMode = 2
    @sortType = 3
  end

  # ダイスボット設定後に行う処理
  # @return [void]
  def postSet
    #if @@bcdice # TKfix @@bcdice が参照できない (Opal 0.11.4)
    #  @@bcdice.cardTrader.set1Deck2Jokers
    #  # 手札の他のカード置き場
    #  @@bcdice.cardTrader.card_place = 0
    #  # 場札のタップ処理の必要があるか？
    #  @@bcdice.cardTrader.canTapCard = false
    if bcdice
      bcdice.cardTrader.set1Deck2Jokers
      # 手札の他のカード置き場
      bcdice.cardTrader.card_place = 0
      # 場札のタップ処理の必要があるか？
      bcdice.cardTrader.canTapCard = false
    end
  end

  def gameName
    'バルナ・クロニカ'
  end

  def gameType
    "BarnaKronika"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・通常判定　nBK
　ダイス数nで判定ロールを行います。
　セット数が1以上の時はセット数も表示します。
・攻撃判定　nBA
　ダイス数nで判定ロールを行い、攻撃値と命中部位も表示します。
・クリティカルコール　nBKCt　nBACt
　判定コマンドの後ろに「Ct」を付けるとクリティカルコールです。
　ダイス数n,コール数tで判定ロールを行います。
　ダイス数nで判定ロールを行います。
　セット数が1以上の時はセット数も表示し、攻撃判定の場合は命中部位も表示します。
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    debug('parren_killer_add begin string', string)

    string = string.gsub(/(\d+)BKC(\d)/) {"#{$1}R6[0,#{$2}]"}
    string = string.gsub(/(\d+)BAC(\d)/) {"#{$1}R6[1,#{$2}]"}
    string = string.gsub(/(\d+)BK/) {"#{$1}R6[0,0]"}
    string = string.gsub(/(\d+)BA/) {"#{$1}R6[1,0]"}

    debug('parren_killer_add end string', string)
    return string
  end

  def dice_command_xRn(string, nick_e)
    @nick_e = nick_e
    return check_barna_kronika(string)
  end

  def check_barna_kronika(string)
    output = '1'

    return output unless(/(^|\s)S?((\d+)[rR]6(\[([,\d]+)\])?)(\s|$)/i =~ string)

    string = $2
    option = $5
    dice_n = $3
    dice_n ||= 1

    @isBattleMode = false       # 0=判定モード, 1=戦闘モード
    criticalCallDice = 0         # 0=通常, 1〜6=クリティカルコール

    if( option )
      battleModeText, criticalCallDice = option.split(",").collect{|i|i.to_i}
      @isBattleMode = (battleModeText == 1)
    end

    debug("@isBattleMode", @isBattleMode)

    dice_str, suc, set, at_str = roll_barna_kronika(dice_n, criticalCallDice)

    output = "#{@nick_e}: (#{string}) ＞ [#{dice_str}] ＞ "

    if( @isBattleMode )
      output += at_str
    else
      debug("suc", suc)
      if(suc > 1)
        output += "成功数#{suc}"
      else
        output += "失敗"
      end

      debug("set", set)
      output += ",セット#{set}" if(set > 0)
    end

    return output
  end

  def roll_barna_kronika(dice_n, criticalCallDice)
    dice_n = dice_n.to_i

    output = ''
    suc = 0
    set = 0
    at_str = ''
    diceCountList = [0, 0, 0, 0, 0, 0]

    dice_n.times do |i|
      index = rand(6)
      diceCountList[index] += 1
      if(diceCountList[index] > suc)
        suc = diceCountList[index]
      end
    end

    6.times do |i|
      diceCount = diceCountList[i]

      next if(diceCount == 0)

      diceCount.times do |j|
        output += "#{i + 1},"
      end

      if( isCriticalCall(i, criticalCallDice) )
        debug("isCriticalCall")
        at_str += getAttackStringWhenCriticalCall(i, diceCount)
      elsif( isNomalAtack(criticalCallDice, diceCount) )
        debug("isNomalAtack")
        at_str += getAttackStringWhenNomal(i, diceCount)
      end

      set += 1 if( diceCount > 1 )
    end

    if( criticalCallDice != 0)
      c_cnt = diceCountList[criticalCallDice - 1]
      suc = c_cnt * 2

      if( c_cnt != 0)
        set = 1
      else
        set = 0
      end
    end

    if( @isBattleMode and suc < 2)
      at_str = "失敗"
    end

    output = output.sub(/,$/, '')
    at_str = at_str.sub(/,$/, '')

    return output, suc, set, at_str
  end

  def isCriticalCall(index, criticalCallDice)
    return false unless( @isBattleMode )
    return false if(criticalCallDice == 0)
    return (criticalCallDice == (index + 1))
  end

  def isNomalAtack(criticalCallDice, diceCount)
    return false unless( @isBattleMode )
    return false if(criticalCallDice != 0)
    return (diceCount > 1)
  end

  def getAttackStringWhenCriticalCall(index, diceCount)
    hitLocation = getAtackHitLocation(index + 1)
    atackValue = (diceCount * 2)
    result = hitLocation + ":攻撃値#{atackValue},"
    return result
  end

  def getAttackStringWhenNomal(index, diceCount)
    hitLocation = getAtackHitLocation(index + 1)
    atackValue = diceCount
    result = hitLocation + ":攻撃値#{atackValue},"
    return result
  end

  # 命中部位表
  def getAtackHitLocation(num)
    table = [
             [1, '頭部' ],
             [2, '右腕' ],
             [3, '左腕' ],
             [4, '右脚' ],
             [5, '左脚' ],
             [6, '胴体' ],
    ]

    return get_table_by_number(num, table)
  end
end
