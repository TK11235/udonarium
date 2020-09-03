# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/table'

class Nechronica < DiceBot
  # ゲームシステムの識別子
  ID = 'Nechronica'

  # ゲームシステム名
  NAME = 'ネクロニカ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ねくろにか'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定　(nNC+m)
　ダイス数n、修正値mで判定ロールを行います。
　ダイス数が2以上の時のパーツ破損数も表示します。
・攻撃判定　(nNA+m)
　ダイス数n、修正値mで攻撃判定ロールを行います。
　命中部位とダイス数が2以上の時のパーツ破損数も表示します。

表
・姉妹への未練表 nm
・中立者への未練表 nmn
・敵への未練表 nme
INFO_MESSAGE_TEXT

  def initialize
    super
    @sendMode = 2
    @sortType = 3
    @defaultSuccessTarget = "6" # 目標値が空欄の時の目標値
  end

  def changeText(string)
    string = string.gsub(/(\d+)NC(10)?([\+\-][\+\-\d]+)/i) { "#{Regexp.last_match(1)}R10#{Regexp.last_match(3)}[0]" }
    string = string.gsub(/(\d+)NC(10)?/i) { "#{Regexp.last_match(1)}R10[0]" }
    string = string.gsub(/(\d+)NA(10)?([\+\-][\+\-\d]+)/i) { "#{Regexp.last_match(1)}R10#{Regexp.last_match(3)}[1]" }
    string = string.gsub(/(\d+)NA(10)?/i) { "#{Regexp.last_match(1)}R10[1]" }

    return string
  end

  def rollDiceCommand(command)
    return roll_tables(command, TABLES)
  end

  def dice_command_xRn(string, nick_e)
    @nick_e = nick_e
    return nechronica_check(string)
  end

  def check_nD10(total, _dice_total, dice_list, cmp_op, target) # ゲーム別成功度判定(nD10)
    return '' if target == '?'
    return '' unless cmp_op == :>=

    if total >= 11
      " ＞ 大成功"
    elsif total >= target
      " ＞ 成功"
    elsif dice_list.count { |i| i <= 1 } == 0
      " ＞ 失敗"
    elsif dice_list.size > 1
      " ＞ 大失敗 ＞ 使用パーツ全損"
    else
      " ＞ 大失敗"
    end
  end

  def nechronica_check(string)
    output = '1'

    debug("nechronica_check string", string)

    unless /(^|\s)S?((\d+)[rR]10([\+\-\d]+)?(\[(\d+)\])?)(\s|$)/i =~ string
      debug("nechronica_check unmuched")
      return output
    end

    string = Regexp.last_match(2)

    dice_n = 1
    dice_n = Regexp.last_match(3).to_i if Regexp.last_match(3)

    battleMode = Regexp.last_match(6).to_i

    modText = Regexp.last_match(4)
    mod = parren_killer("(0#{modText})").to_i

    # 0=判定モード, 1=戦闘モード
    isBattleMode = (battleMode == 1)
    debug("nechronica_check string", string)
    debug("isBattleMode", isBattleMode)

    diff = 6
    total_n = 0

    _, dice_str, _n1, _cnt_max, n_max = roll(dice_n, 10, 1)

    total_n = n_max + mod

    output = "#{@nick_e}: (#{string}) ＞ [#{dice_str}]"
    if mod < 0
      output += mod.to_s
    elsif mod > 0
      output += "+#{mod}"
    end

    dice = dice_str.split(',').map(&:to_i)
    dice.map! { |i| i + mod }

    dice_str = dice.join(",")
    output += "  ＞ #{total_n}[#{dice_str}]"

    output += check_nD10(total_n, dice_n, dice, :>=, diff)

    if isBattleMode
      hit_loc = getHitLocation(total_n)
      if hit_loc != '1'
        output += " ＞ #{hit_loc}"
      end
    end

    return output
  end

  def getHitLocation(dice)
    output = '1'

    debug("getHitLocation dice", dice)
    return output if dice <= 5

    output = ''
    table = [
      '防御側任意',
      '脚（なければ攻撃側任意）',
      '胴（なければ攻撃側任意）',
      '腕（なければ攻撃側任意）',
      '頭（なければ攻撃側任意）',
      '攻撃側任意',
    ]
    index = dice - 6

    addDamage = ""
    if dice > 10
      index = 5
      addDamage = "(追加ダメージ#{dice - 10})"
    end

    output = table[index] + addDamage

    return output
  end

  TABLES = {
    'NM' => Table.new(
      '姉妹への未練表',
      '1D10',
      [
        '【嫌悪】[発狂:敵対認識]敵に命中しなかった攻撃は全て、射程内にいるなら嫌悪の対象に命中する。(防御側任意)',
        '【独占】[発狂:独占衝動]戦闘開始時と終了時に１つずつ、対象はパーツを選んで損傷する。',
        '【依存】[発狂:幼児退行]最大行動値が減少する(-2)',
        '【執着】[発狂:追尾監視]戦闘開始時と終了時に1つずつ、対象はあなたへの未練に狂気点を得る。',
        '【恋心】[発狂:自傷行動]戦闘開始時と終了時に1つずつ、あなたはパーツを選んで損傷する。',
        '【対抗】[発狂:過剰競争]戦闘開始時と終了時に1つずつ、あなたは任意の未練に狂気点を追加で得る。',
        '【友情】[発狂:共鳴依存]セッション終了時、対象にあなたよりも多く損傷したパーツがある際、あなたは損傷パーツ数が対象と同じになるまで、パーツを損傷させる。',
        '【保護】[発狂:常時密着]あなたが対象と別エリアにいるなら「移動以外の効果を持つマニューバ」を宣言できない。「自身と対象」以外を移動マニューバの対象にできない。',
        '【憧憬】[発狂:贋作妄想]あなたが対象と同エリアにいるなら「移動以外の効果を持つマニューバ」を宣言できない。「自身と対象」以外を移動マニューバの対象にできない。',
        '【信頼】[発狂:疑心暗鬼]あなた以外の全ての姉妹の最大行動値が減少する(-1)',
      ]
    ),
    'NMN' => Table.new(
      '中立者への未練表',
      '1D10',
      [
        '【忌避】[発狂:隔絶意識]あなたは未練の対象ないしサヴァントと同じエリアにいる間、「移動以外の効果を持つマニューバ」を宣言できない。また、「自身と未練の対象ないしサヴァント」以外を移動マニューバの対象にできない。',
        '【嫉妬】[発狂:不協和音]全ての姉妹は行動判定に修正-1を受ける。',
        '【依存】[発狂:幼児退行]最大行動値が減少する(-2)',
        '【憐憫】[発狂:過情移入]あなたは「サヴァント」に対する攻撃判定の出目に修正-1を受ける。',
        '【感謝】[発狂:病的返礼]発狂した際、あなたは任意の基本パーツ2つ（なければ最もレベルの低い強化パーツ1つ）を損傷する。',
        '【悔恨】[発狂:自業自棄]あなたが失敗した攻撃判定は全て、あなた自身の任意の箇所にダメージを与える。',
        '【期待】[発狂:希望転結]あなたは狂気点を追加して振り直しを行う際、出目に修正-1を受ける。（この効果は累積する）',
        '【保護】[発狂:生前回帰]あなたは「レギオン」をマニューバの対象に選べない。',
        '【尊敬】[発狂:神化崇拝]あなたは「他の姉妹」をマニューバの対象に選べない。',
        '【信頼】[発狂:疑心暗鬼]あなた以外の全ての姉妹の最大行動値が減少する(-1)',
      ]
    ),
    'NME' => Table.new(
      '敵への未練表',
      '1D10',
      [
        '【恐怖】[発狂:認識拒否]あなたは、行動判定・狂気判定の出目に修正-1を受ける。',
        '【隷属】[発狂:造反有理]あなたが失敗した攻撃判定は全て、大失敗として扱う。',
        '【不安】[発狂:挙動不審]最大行動値が減少する(-2)',
        '【憐憫】[発狂:感情移入]あなたは「サヴァント」に対する攻撃判定の出目に修正-1を受ける。',
        '【愛憎】[発狂:凶愛心中]あなたは狂気判定・攻撃判定で大成功するごとに[判定値-10]個の自身のパーツを選び、損傷させる。',
        '【悔恨】[発狂:自業自棄]あなたが失敗した攻撃判定は全て、あなた自身の任意の箇所にダメージを与える。',
        '【軽蔑】[発狂:眼中不在]同エリアの手駒があなたに対して行う攻撃判定の出目は修正+1を受ける。',
        '【憤怒】[発狂:激情暴走]あなたは、攻撃判定・狂気判定の出目に修正-1を受ける。',
        '【怨念】[発狂:不倶戴天]あなたは逃走判定ができない。あなたが「自身と未練の対象」以外を対象にしたマニューバを使用する際、行動値1点を追加で減らさなくてはいけない。',
        '【憎悪】[発狂:痕跡破壊]この未練を発狂した際、あなた以外の姉妹から1人選ぶ。その姉妹は任意のパーツを2つ損傷する。',
      ]
    )
  }.freeze

  setPrefixes(['\d+NC', '\d+NA'] + TABLES.keys)
end
