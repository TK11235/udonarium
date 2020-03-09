# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/SRS'

# アルシャードのダイスボット
class Alshard < SRS
  # 固有のコマンドの接頭辞を設定する
  setPrefixes(['2D6.*', 'AL.*'])

  # 成功判定のエイリアスコマンドを設定する
  set_aliases_for_srs_roll('AL')

  # ゲームシステム名を返す
  # @return [String]
  def gameName
    'アルシャード'
  end

  # ゲームシステム識別子を返す
  # @return [String]
  def gameType
    'Alshard'
  end
end
