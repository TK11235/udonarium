# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/SRS'

# 世界樹の迷宮SRSのダイスボット
class EtrianOdysseySRS < SRS
  # ゲームシステムの識別子
  ID = 'EtrianOdysseySRS'

  # ゲームシステム名
  NAME = '世界樹の迷宮SRS'

  # ゲームシステム名の読みがな
  SORT_KEY = 'せかいしゆのめいきゆうSRS'

  # 固有のコマンドの接頭辞を設定する
  setPrefixes(['2D6.*', 'EO.*', 'SQ.*'])

  # 成功判定のエイリアスコマンドを設定する
  set_aliases_for_srs_roll('EO', 'SQ')
end
