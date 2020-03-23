# -*- coding: utf-8 -*-

require 'diceBot/SwordWorld2_0'

class SwordWorld2_5 < SwordWorld2_0
  setPrefixes(['K\d+.*', 'Gr(\d+)?', 'FT', 'TT'])

  def initialize
    super
  end

  def gameName
    'ソードワールド2.5'
  end

  def gameType
    return "SwordWorld2.5"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
自動的成功、成功、失敗、自動的失敗の自動判定を行います。

・レーティング表　(Kx)
　"Kキーナンバー+ボーナス"の形で記入します。
　ボーナスの部分に「K20+K30」のようにレーティングを取ることは出来ません。
　また、ボーナスは複数取ることが出来ます。
　レーティング表もダイスロールと同様に、他のプレイヤーに隠れてロールすることも可能です。
　例）K20　　　K10+5　　　k30　　　k10+10　　　Sk10-1　　　k10+5+2

・クリティカル値の設定
　クリティカル値は"[クリティカル値]"で指定します。
　指定しない場合はクリティカル値10とします。
　クリティカル処理が必要ないときは13などとしてください。(防御時などの対応)
　またタイプの軽減化のために末尾に「@クリティカル値」でも処理するようにしました。
　例）K20[10]　　　K10+5[9]　　　k30[10]　　　k10[9]+10　　　k10-5@9

・ダイス目の修正（運命変転やクリティカルレイ用）
　末尾に「$修正値」でダイス目に修正がかかります。
　$＋１と修正表記ならダイス目に＋修正、＄９のように固定値ならダイス目をその出目に差し替え。
　クリティカルした場合でも固定値や修正値の適用は最初の一回だけです。
　例）K20$+1　　　K10+5$9　　　k10-5@9$+2　　　k10[9]+10$9

・ダイス目の修正（必殺攻撃用）
　「＃修正値」でダイス目に修正がかかります。
　クリティカルした場合でも修正値の適用は継続されます。
　例）K20#1　　　k10-5@9#2

・首切り刀用レーティング上昇 r10
　例）K20r10　K30+24@8R10　K40+24@8$12r10

・グレイテストフォーチュンは末尾に gf
　例）K20gf　K30+24@8GF　K40+24@8$12r10gf

・超越判定用に2d6ロールに 2D6@10 書式でクリティカル値付与が可能に。
　例）2D6@10　2D6@10+11>=30

・成長　(Gr)
　末尾に数字を付加することで、複数回の成長をまとめて行えます。
　例）Gr3

・防御ファンブル表　(FT)
　防御ファンブル表を出すことができます。

・絡み効果表　(TT)
　絡み効果表を出すことができます。
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    return string unless /(^|\s)[sS]?(K[\d]+)/i =~ string

    string = super(string)

    debug('parren_killer_add before string', string)

    string = string.gsub(/#([\+\-]?[\d]+)/i) do
      value = Regexp.last_match(1).to_i
      if value >= 0
        "a[+#{value}]"
      else
        "a[#{value}]"
      end
    end

    debug('parren_killer_add after string', string)

    return string
  end

  def getRatingCommandStrings
    super + "aA"
  end

  def getAdditionalString(string, output)
    output, values = super(string, output)

    keptDiceChangeModify, string = getKeptDiceChangesFromString(string)

    values['keptDiceChangeModify'] = keptDiceChangeModify
    output += "a[#{keptDiceChangeModify}]" if keptDiceChangeModify != 0

    return output, values
  end

  def getAdditionalDiceValue(dice, values)
    keptDiceChangeModify = values['keptDiceChangeModify'].to_i

    value = 0
    value += keptDiceChangeModify.to_i if (keptDiceChangeModify != 0) && (dice != 2)

    return value
  end

  def getKeptDiceChangesFromString(string)
    keptDiceChangeModify = 0
    regexp = /a\[([\+\-]\d+)\]/i
    if regexp =~ string
      keptDiceChangeModify = Regexp.last_match(1)
      string = string.gsub(regexp, '')
    end
    return keptDiceChangeModify, string
  end
end
