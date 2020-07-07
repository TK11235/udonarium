# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/SRS'

# アルシャードのダイスボット
class Alshard < SRS
  # ゲームシステム名
  NAME = 'アルシャード'

  # ゲームシステム名の読みがな
  SORT_KEY = 'あるしやあと'

  # ゲームシステムの識別子
  ID = 'Alshard'

  # 固有のコマンドの接頭辞を設定する
  setPrefixes(['2D6.*', 'AL.*'])

  # 成功判定のエイリアスコマンドを設定する
  set_aliases_for_srs_roll('AL')
end
