# -*- coding: utf-8 -*-
# frozen_string_literal: true

class RoleMaster < DiceBot
  # ゲームシステムの識別子
  ID = 'RoleMaster'

  # ゲームシステム名
  NAME = 'ロールマスター'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ろおるますたあ'

  # ダイスボットの使い方
  HELP_MESSAGE = "上方無限ロール(xUn)の境界値を96にセットします。\n"

  def initialize
    super
    @upperRollThreshold = 96
    @unlimitedRollDiceType = 100
  end
end
