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
  def gameName
    'メタリックガーディアン'
  end

  # ゲームシステム識別子を返す
  # @return [String]
  def gameType
    "MetallicGuadian"
  end
end
