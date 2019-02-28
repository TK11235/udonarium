# -*- coding: utf-8 -*-

require 'diceBot/MetallicGuadian'

class FullMetalPanic < MetallicGuadian
  setPrefixes(['2D6.*','MG.*','FP.*'])

  def initialize
    super
  end

  def gameName
    'フルメタル・パニック！'
  end

  def gameType
    "FullMetalPanic"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定
　・通常判定　　　　　　2D6+m>=t[c,f]
　　修正値m,目標値t,クリティカル値c,ファンブル値fで判定ロールを行います。
　　クリティカル値、ファンブル値は省略可能です。([]ごと省略できます)
　　自動成功、自動失敗、成功、失敗を自動表示します。

　　例) 2d6+2>=10       修整+2、目標値10で判定
　　例) 2d6+2>=10[11]   ↑をクリティカル値11で判定
　　例) 2d6+2>=10[12,4] ↑をクリティカル値12、ファンブル値4で判定
　　例) FP+2>=10        2d6+2>=10と同じ（FPが2D6のショートカットコマンド）

・D66ダイス(入れ替え無し)あり
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/^(S)?(MG|FP)/i) {"#{$1}2D6"}
    return string
  end
end
