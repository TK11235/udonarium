# -*- coding: utf-8 -*-

class TokumeiTenkousei < DiceBot
  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @sameDiceRerollCount = 1 # ゾロ目で振り足し(0=無し, 1=全部同じ目, 2=ダイスのうち2個以上同じ目)
    @sameDiceRerollType = 2 # ゾロ目で振り足しのロール種別(0=判定のみ, 1=ダメージのみ, 2=両方)
  end

  def gameName
    '特命転攻生'
  end

  def gameType
    "TokumeiTenkousei"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
「1の出目でEPP獲得」、判定時の「成功」「失敗」「ゾロ目で自動振り足し」を判定。
INFO_MESSAGE_TEXT
  end

  def check_nD6(total_n, _dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(nD6)
    return '' unless signOfInequality == ">="

    return '' if diff == "?"

    if total_n >= diff
      return " ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end

  # 特命転校生用エキストラパワーポイント獲得
  def getDiceRolledAdditionalText(n1, _n_max, dice_max)
    debug('getExtraPowerPointTextForTokumeiTenkousei n1, dice_max', n1, dice_max)

    if (n1 != 0) && (dice_max == 6)
      point = n1 * 5
      return " ＞ #{point}EPP獲得"
    end

    return ''
  end
end
