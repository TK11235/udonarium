# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/SRS'

# フルメタル・パニック！のダイスボット
class FullMetalPanic < SRS
  # ゲームシステムの識別子
  ID = 'FullMetalPanic'

  # ゲームシステム名
  NAME = 'フルメタル・パニック！RPG'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ふるめたるはにつくRPG'

  # 固有のコマンドの接頭辞を設定する
  setPrefixes(['2D6.*', 'MG.*', 'FP.*'])

  # 成功判定のエイリアスコマンドを設定する
  set_aliases_for_srs_roll('MG', 'FP')
end
