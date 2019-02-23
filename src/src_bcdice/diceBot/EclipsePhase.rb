# -*- coding: utf-8 -*-

class EclipsePhase < DiceBot
  
  def initialize
    super
  end
  def gameName
    'エクリプス・フェイズ'
  end
  
  def gameType
    "EclipsePhase"
  end
  
  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
1D100<=m 方式の判定で成否、クリティカル・ファンブルを自動判定
INFO_MESSAGE_TEXT
  end
  
  
  def check_1D100(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)\
    
    return '' unless signOfInequality == '<='
    
    diceValue = total_n % 100 # 出目00は100ではなく00とする
    #dice_ten_place = diceValue / 10
    dice_ten_place = (diceValue / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    dice_one_place = diceValue % 10
    
    debug("total_n", total_n)
    debug("dice_ten_place, dice_one_place", dice_ten_place, dice_one_place)
    
    if dice_ten_place == dice_one_place
      return ' ＞ 決定的失敗' if diceValue == 99
      return ' ＞ 00 ＞ 決定的成功' if diceValue == 0
      return ' ＞ 決定的成功' if total_n <= diff
      return ' ＞ 決定的失敗'
    end
    
    
    diff_threshold = 30
    
    if (total_n <= diff)
      return ' ＞ エクセレント' if total_n >= diff_threshold
      return ' ＞ 成功'
    else
      return ' ＞ シビア' if (total_n - diff) >= diff_threshold
      return ' ＞ 失敗'
    end
    
  end
  
  
end

