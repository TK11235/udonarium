# -*- coding: utf-8 -*-
# frozen_string_literal: true

class TokumeiTenkousei < DiceBot
  # ゲームシステムの識別子
  ID = 'TokumeiTenkousei'

  # ゲームシステム名
  NAME = '特命転攻生'

  # ゲームシステム名の読みがな
  SORT_KEY = 'とくめいてんこうせい'

  # ダイスボットの使い方
  HELP_MESSAGE = "「1の出目でEPP獲得」、判定時の「成功」「失敗」「ゾロ目で自動振り足し」を判定。\n"

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @sameDiceRerollCount = 1 # ゾロ目で振り足し(0=無し, 1=全部同じ目, 2=ダイスのうち2個以上同じ目)
    @sameDiceRerollType = 2 # ゾロ目で振り足しのロール種別(0=判定のみ, 1=ダメージのみ, 2=両方)
  end

  def check_nD6(total, _dice_total, _dice_list, cmp_op, target)
    if cmp_op != :>= && target == "?"
      return ''
    end

    if total >= target
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
