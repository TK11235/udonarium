# -*- coding: utf-8 -*-

require 'diceBot/NightWizard'

class SevenFortressMobius < DiceBot
  setPrefixes(['\d*SFM'])

  def initialize
    super
    @nightWizardDiceBot = NightWizard.new
  end

  def gameName
    'セブン＝フォートレス メビウス'
  end

  def gameType
    "SevenFortressMobius"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定用コマンド　(nSFM+m@x#y)
　"(基本値)SFM(常時および常時に準じる特技等及び状態異常（省略可）)@(クリティカル値)#(ファンブル値)（常時以外の特技等及び味方の支援効果等の影響（省略可））"でロールします。
　Rコマンド(2R6m[n,m]c[x]f[y]>=t tは目標値)に読替されます。
　クリティカル値、ファンブル値が無い場合は1や13などのあり得ない数値を入れてください。
　例）12SFM-5@7#2　　1SFM　　50SFM+5@7,10#2,5　50SFM-5+10@7,10#2,5+15+25
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.sub(/(\d*)SFM/i){"#{$1}NW"}

    string = @nightWizardDiceBot.changeText(string)
  end

  def dice_command_xRn(string, nick_e)
    return @nightWizardDiceBot.checkRoll(string, nick_e)
  end
end
