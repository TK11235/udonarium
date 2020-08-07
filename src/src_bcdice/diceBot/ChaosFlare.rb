# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/command_parser'

class ChaosFlare < DiceBot
  # ゲームシステムの識別子
  ID = 'ChaosFlare'
  # ゲームシステム名
  NAME = 'カオスフレア'

  # ゲームシステム名の読みがな
  SORT_KEY = 'かおすふれあ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
判定
CF
  書式: [ダイスの数]CF[修正値][@クリティカル値][#ファンブル値][>=目標値]
    CF以外は全て省略可能
  例:
  - CF 2D6,クリティカル値12,ファンブル値2で判定
  - CF+10@10 修正値+10,クリティカル値10で判定
  - CF+10#3 修正値+10,ファンブル値3で判定
  - CF+10>=10 目標値を指定した場合、差分値も出力する
  - 3CF+10@10#3>=10 3D6での判定
  - CF@9#3+8>=10

2D6
  ファンブル値2で判定する。クリティカルの判定は行われない。
  目標値が設定された場合、差分値を出力する。
  - 2D6+4>=10

各種表
  FT: 因縁表
  FTx: 数値を指定すると因果表の値を出力する
  - FT -> 11から66の間でランダム決定
  - FT23 -> 23の項目を出力
  - FT0
  - FT7
INFO_MESSAGE_TEXT

  setPrefixes(['\d*CF.*', 'FT\d*'])

  # ダイスボット設定後に行う処理
  # @return [void]
  def postSet
    if bcdice
      bcdice.cardTrader.set2Decks2Jokers
      # 手札の他のカード置き場
      bcdice.cardTrader.card_place = 0
      # 場札のタップ処理の必要があるか？
      bcdice.cardTrader.canTapCard = false
    end
  end

  # ゲーム別成功度判定(2D6)。以前の処理をそのまま残しています。
  def check_2D6(total, dice_total, _dice_list, cmp_op, target)
    return '' if target == '?'

    output = ''

    if dice_total <= 2
      total -= 20
      output = " ＞ ファンブル(-20)"
    end

    unless cmp_op == :>=
      return output
    end

    if total >= target
      output += " ＞ 成功"
      if total > target
        output += " ＞ 差分値#{total - target}"
      end
    else
      output += " ＞ 失敗 ＞ 差分値#{total - target}"
    end

    return output
  end

  def rollDiceCommand(command)
    if command.start_with? "FT"
      roll_fate_table(command)
    else
      cf_roll(command)
    end
  end

  private

  # 因縁表
  def roll_fate_table(command)
    m = /^FT(\d+)?/.match(command)
    if m[1]
      num = m[1].to_i
      if [0, 7].include?(num)
        return "因果表(#{num}) ＞ #{FATE_TABLE[num][0]}"
      end

      dice1 = (num / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
      dice2 = num % 10
      if !(1..6).include?(dice1) || !(1..6).include?(dice2)
        return nil
      end
    else
      dice1, = roll(1, 6)
      dice2, = roll(1, 6)
    end

    index1 = dice1
    index2 = (dice2 / 2).floor - 1 # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    return "因果表(#{dice1}#{dice2}) ＞ #{FATE_TABLE[index1][index2]}"
  end

  # カオスフレア専用コマンド
  # @param command [String]
  # @return [String, nil]
  def cf_roll(command)
    parser = CommandParser.new(/\d*CF/)

    @cmd = parser.parse(command)
    unless @cmd
      return nil
    end

    times = @cmd.command == "CF" ? 2 : @cmd.command.to_i
    critical = @cmd.critical || 12
    fumble = @cmd.fumble || 2
    @cmd.dollar = nil

    if times < 0 || ![:>=, nil].include?(@cmd.cmp_op)
      return nil
    end

    dice_total, dice_list_text = roll(times, 6)

    is_critical = dice_total >= critical
    is_fumble = dice_total <= fumble

    total =
      if is_critical
        30
      elsif is_fumble
        -20
      else
        dice_total
      end

    total += @cmd.modify_number

    sequence = [
      "(#{@cmd.to_s(:after_modify_number)})",
      "#{dice_total}[#{dice_list_text}]",
      total.to_s,
      ("0" if total < 0),
      ("クリティカル" if is_critical),
      ("ファンブル" if is_fumble),
      ("差分値 #{difference(total)}" if @cmd.target_number),
    ].compact

    return sequence.join(" ＞ ")
  end

  # @param total [Integer] 合計値
  # @return [Integer] 差分値
  def difference(total)
    if total < 0
      -@cmd.target_number
    else
      total - @cmd.target_number
    end
  end

  # 表を振るのに使う定数的なやつ。
  FATE_TABLE = [
    ["腐れ縁"],
    ["純愛", "親近感", "庇護"],
    ["信頼", "感服", "共感"],
    ["友情", "尊敬", "慕情"],
    ["好敵手", "期待", "借り"],
    ["興味", "憎悪", "悲しみ"],
    ["恐怖", "執着", "利用"],
    ["任意"]
  ].freeze
end
