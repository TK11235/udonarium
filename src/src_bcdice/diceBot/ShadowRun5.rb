# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/ShadowRun4'

class ShadowRun5 < ShadowRun4
  # ゲームシステムの識別子
  ID = 'ShadowRun5'

  # ゲームシステム名
  NAME = 'シャドウラン第5版'

  # ゲームシステム名の読みがな
  SORT_KEY = 'しやとうらん5'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
個数振り足しロール(xRn)の境界値を6にセット、バラバラロール(xBn)の目標値を5以上にセットします。
バラバラロール(xBn)のみ、リミットをセットできます。リミットの指定は(xBn@l)のように指定します。(省略可)
BコマンドとRコマンド時に、グリッチの表示を行います。
INFO_MESSAGE_TEXT

  setPrefixes(['(\d+)B6@(\d+)'])

  def initialize
    super
    @sortType = 3
    @rerollNumber = 6 # 振り足しする出目
    @defaultSuccessTarget = ">=5" # 目標値が空欄の時の目標値
  end

  # シャドウラン5版　リミット時のテスト
  def rollDiceCommand(command)
    debug('chatch limit prefix')

    m = /(\d+B6)@(\d+)/.match(command)
    b_dice = m[1]
    limit = m[2].to_i
    output_before_limited = bcdice.bdice(b_dice)

    m = /成功数(\d+)/.match(output_before_limited)
    output_after_limited = output_before_limited
    before_suc_cnt = m[1].to_i
    after_suc_cnt = m[1].to_i
    over_suc_cnt = 0
    if before_suc_cnt > limit
      after_suc_cnt = limit
      over_suc_cnt = before_suc_cnt - limit
      output_after_limited = output_before_limited.gsub(/成功数(\d+)/, "成功数#{after_suc_cnt}")
      output_after_limited += "(リミット超過#{over_suc_cnt})"
    end

    output = output_after_limited
    output = output.slice(2..-1)
    output = output.gsub('B', 'B6')
    output = output.gsub('6>=5', "[6]Limit[#{limit}]>=5")
    debug(output)
    return output
  end

  # シャドウラン5版用グリッチ判定
  def getGrichText(numberSpot1, dice_cnt_total, successCount)
    debug("getGrichText numberSpot1", numberSpot1)
    debug("dice_cnt_total", dice_cnt_total)
    debug("successCount", successCount)

    dice_cnt_total_half = dice_cnt_total.to_f / 2
    debug("dice_cnt_total_half", dice_cnt_total_half)

    unless numberSpot1 > dice_cnt_total_half
      return ''
    end

    # グリッチ！
    if successCount == 0
      return ' ＞ クリティカルグリッチ'
    end

    return ' ＞ グリッチ'
  end
end
