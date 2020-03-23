# -*- coding: utf-8 -*-

class Arianrhod < DiceBot
  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @d66Type = 1
  end

  def gameName
    'アリアンロッド'
  end

  def gameType
    "Arianrhod"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・クリティカル、ファンブルの自動判定を行います。(クリティカル時の追加ダメージも表示されます)
・D66ダイスあり
INFO_MESSAGE_TEXT
  end

  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max) # ゲーム別成功度判定(2D6)
    check_nD6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
  end

  def check_nD6(total_n, _dice_n, signOfInequality, diff, dice_cnt, _dice_max, n1, n_max) # ゲーム別成功度判定(nD6)
    debug("check_nD6 begin")

    # 全部１の目ならファンブル
    return " ＞ ファンブル" if n1 >= dice_cnt

    # ２個以上６の目があったらクリティカル
    return " ＞ クリティカル(+#{n_max}D6)" if n_max >= 2

    result = ''

    return result unless signOfInequality == ">="
    return result if diff == "?"

    if total_n >= diff
      return " ＞ 成功"
    end

    return " ＞ 失敗"
  end
end
