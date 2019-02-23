# -*- coding: utf-8 -*-

class IthaWenUa < DiceBot
  
  def initialize
    super
  end
  
  def gameName
    'イサー・ウェン＝アー'
  end
  
  def gameType
    "IthaWenUa"
  end
  
  def getHelpMessage
    return <<MESSAGETEXT
1D100<=m 方式の判定で成否、クリティカル(01)・ファンブル(00)を自動判定します。
MESSAGETEXT
  end
  
  def check_1D100(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)    # ゲーム別成功度判定(1d100)
    return '' unless( signOfInequality == '<=' )
    
    diceValue = total_n % 100
    #dice0 = diceValue / 10 #10の位を代入
    dice0 = (diceValue / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    dice1 = diceValue % 10 # 1の位を代入
    
    debug("total_n", total_n)
    debug("dice0, dice1", dice0, dice1)
    
    if( (dice0 == 0) and (dice1 == 1) )

      return ' ＞ 01 ＞ クリティカル'

    elsif( (dice0 == 0) and (dice1 == 0) )

      return ' ＞ 00 ＞ ファンブル'

    else

      if(total_n <= diff)
        return ' ＞ 成功'
      else
        return ' ＞ 失敗'
      end

    end

  end

end

