# -*- coding: utf-8 -*-
# frozen_string_literal: true

class ShadowRun < DiceBot
  # ゲームシステムの識別子
  ID = 'ShadowRun'

  # ゲームシステム名
  NAME = 'シャドウラン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'しやとうらん'

  # ダイスボットの使い方
  HELP_MESSAGE = "上方無限ロール(xUn)の境界値を6にセットします。\n"

  def initialize
    super
    @sortType = 3
    @upplerRollThreshold = 6
    @unlimitedRollDiceType = 6
  end
end
