# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/NightWizard'

class SevenFortressMobius < NightWizard
  # ゲームシステムの識別子
  ID = 'SevenFortressMobius'

  # ゲームシステム名
  NAME = 'セブン＝フォートレス メビウス'

  # ゲームシステム名の読みがな
  SORT_KEY = 'せふんふおおとれすめひうす'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定用コマンド　(nSFM+m@x#y)
　"(基本値)SFM(常時および常時に準じる特技等及び状態異常（省略可）)@(クリティカル値)#(ファンブル値)（常時以外の特技等及び味方の支援効果等の影響（省略可））"でロールします。
　Rコマンド(2R6m[n,m]c[x]f[y]>=t tは目標値)に読替されます。
　クリティカル値、ファンブル値が無い場合は1や13などのあり得ない数値を入れてください。
　例）12SFM-5@7#2　　1SFM　　50SFM+5@7,10#2,5　50SFM-5+10@7,10#2,5+15+25
INFO_MESSAGE_TEXT

  setPrefixes(['([-+]?\d+)?SFM.*', '2R6.*'])

  def initialize
    super
    @nw_command = "SFM"
  end
end
