# -*- coding: utf-8 -*-
# frozen_string_literal: true

class LostRecord < DiceBot
  # ゲームシステムの識別子
  ID = 'LostRecord'

  # ゲームシステム名
  NAME = 'ロストレコード'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ろすとれこおと'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
※このダイスボットは部屋のシステム名表示用となります。
D66を振った時、小さい目が十の位になります。
MESSAGETEXT

  def initialize
    super()

    # D66は昇順に
    @d66Type = 2
  end
end
