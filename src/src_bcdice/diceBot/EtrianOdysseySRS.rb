# -*- coding: utf-8 -*-

require 'diceBot/SRS'

class EtrianOdysseySRS < SRS
  setPrefixes(['2D6.*','EO.*','SQ.*'])

  def initialize
    super

    @sendMode = 2
    @d66Type = 1
    @sortType = 1
  end

  def gameName
    '世界樹の迷宮SRS'
  end

  def gameType
    "EtrianOdysseySRS"
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
　　例) SQ+2>=10        2d6+2>=10と同じ（SQが2D6のショートカットコマンド）

・D66ダイス(入れ替え無し)あり
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/^(S)?(EO|SQ)/i) {"#{$1}2D6"}
    return string
  end
end
