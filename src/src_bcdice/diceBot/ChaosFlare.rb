# -*- coding: utf-8 -*-
# frozen_string_literal: true

class ChaosFlare < DiceBot
  # ゲームシステムの識別子
  ID = 'Chaos Flare'
  # ゲームシステム名
  NAME = 'カオスフレア'

  # ゲームシステム名の読みがな
  SORT_KEY = 'かおすふれあ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
失敗、成功の判定。差分値の計算も行います。
ファンブル時は達成値を-20します。
INFO_MESSAGE_TEXT

  # ダイスボット設定後に行う処理
  # @return [void]
  def postSet
    if bcdice
      bcdice.cardTrader.set2Decks2Jokers
      # 手札の他のカード置き場
      bcdice.cardTrader.card_place = 0
      # 場札のタップ処理の必要があるか？
      bcdice.cardTrader.canTapCard = false
    end
  end

  # ゲーム別成功度判定(2D6)
  def check_2D6(total, dice_total, _dice_list, cmp_op, target)
    output = ''

    if dice_total <= 2
      total -= 20
      output = " ＞ ファンブル(-20)"
    end

    unless cmp_op == :>=
      return output
    end

    if total >= target
      output += " ＞ 成功"
      if total > target
        output += " ＞ 差分値#{total - target}"
      end
    else
      output += " ＞ 失敗 ＞ 差分値#{total - target}"
    end

    return output
  end
end
