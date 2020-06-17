# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/SRS'

# メタリックガーディアンのダイスボット
class MetallicGuadian < SRS
  # 固有のコマンドの接頭辞を設定する
  setPrefixes(['2D6.*', 'MG.*'])

  # 成功判定のエイリアスコマンドを設定する
  set_aliases_for_srs_roll('MG')

  # ゲームシステム名を返す
  # @return [String]
  # ゲームシステム名
  NAME = 'メタリックガーディアン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'めたりつくかあていあん'

  # ゲームシステム識別子を返す
  # @return [String]
  # ゲームシステムの識別子
  ID = 'MetallicGuadian'
end
