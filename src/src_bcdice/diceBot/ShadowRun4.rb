# -*- coding: utf-8 -*-

class ShadowRun4 < DiceBot
  def initialize
    super
    @sortType = 3
    @rerollNumber = 6 # 振り足しする出目
    @defaultSuccessTarget = ">=5" # 目標値が空欄の時の目標値
  end

  def gameName
    'シャドウラン第４版'
  end

  def gameType
    "ShadowRun4"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
個数振り足しロール(xRn)の境界値を6にセット、バラバラロール(xBn)の目標値を5以上にセットします。
BコマンドとRコマンド時に、グリッチの表示を行います。
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    if string =~ /(\d+)S6/i
      string = string.gsub(/(\d+)S6/i) { "#{$1}B6" }
    end

    return string
  end

  # シャドウラン4版用グリッチ判定
  def getGrichText(numberSpot1, dice_cnt_total, successCount)
    debug("getGrichText numberSpot1", numberSpot1)
    debug("dice_cnt_total", dice_cnt_total)
    debug("successCount", successCount)

    dice_cnt_total_half = (1.0 * dice_cnt_total / 2)
    debug("dice_cnt_total_half", dice_cnt_total_half)

    unless numberSpot1 >= dice_cnt_total_half
      return ''
    end

    # グリッチ！
    if successCount == 0
      return ' ＞ クリティカルグリッチ'
    end

    return ' ＞ グリッチ'
  end
end
