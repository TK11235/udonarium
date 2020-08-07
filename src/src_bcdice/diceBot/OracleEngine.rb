# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/command_parser'
require 'utils/format'
require 'utils/modifier_formatter'

class OracleEngine < DiceBot
  include ModifierFormatter

  # ゲームシステムの識別子
  ID = 'OracleEngine'

  # ゲームシステム名
  NAME = 'オラクルエンジン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'おらくるえんしん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
  ・クラッチロール （xCL+y>=z)
  ダイスをx個振り、1個以上目標シフトzに到達したか判定します。修正yは全てのダイスにかかります。
  成功した時は目標シフトを、失敗した時はダイスの最大値-1シフトを返します
  zが指定されないときは、ダイスをx個を振り、それに修正yしたものを返します。
  通常、最低シフトは1、最大シフトは6です。目標シフトもそろえられます。
  また、CLの後に7を入れ、(xCL7+y>=z)と入力すると最大シフトが7になります。
 ・判定 (xR6+y@c#f$b>=z)
  ダイスをx個振り、大きいもの2つだけを見て達成値を算出し、成否を判定します。修正yは達成値にかかります。
  ダイスブレイクとしてbを、クリティカル値としてcを、ファンブル値としてfを指定できます。
  それぞれ指定されない時、0,12,2になります。
  クリティカル値の上限はなし、下限は2。ファンブル値の上限は12、下限は0。
  zが指定されないとき、達成値の算出のみ行います。
 ・ダメージロールのダイスブレイク (xD6+y$b)
  ダイスをx個振り、合計値を出します。修正yは合計値にかかります。
  ダイスブレイクとしてbを指定します。合計値は0未満になりません。
MESSAGETEXT

  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes(['\d+CL.*', '\d+R6.*', '\d+D6.*\$[\+\-]?\d+.*'])

  def initialize
    super
    @sortType = 3
  end

  def rollDiceCommand(command)
    case command
    when /\d+CL.*/i
      clutch_roll(command)
    when /\d+D6.*\$[\+\-]?\d.*/
      damage_roll(command)
    when /\d+R6/
      r_roll(command)
    end
  end

  # クラッチロール
  def clutch_roll(string)
    debug("clutch_roll begin", string)

    parser = CommandParser.new(/\d+CL[67]?/i)
    @cmd = parser.parse(string)

    unless @cmd
      return nil
    end

    unless [:>=, nil].include?(@cmd.cmp_op)
      return nil
    end

    @times, @max_shift = @cmd.command.split("CL").map(&:to_i)
    @max_shift ||= 6
    @cmd.target_number = clamp(@cmd.target_number, 1, @max_shift) if @cmd.cmp_op

    if @times == 0
      return nil
    end

    dice_list = roll_(@times, 6).map { |x| clamp(x + @cmd.modify_number, 1, @max_shift) }.sort

    sequence = [
      expr_clutch(),
      "[#{dice_list.join(', ')}]", # Ruby 1.8はArray#to_sの挙動が違う
      result_clutch(dice_list.last)
    ]

    return sequence.join(' ＞ ')
  end

  def expr_clutch()
    max_shift = @max_shift == 7 ? 7 : nil
    cmp_op = Format.comparison_operator(@cmd.cmp_op)
    modify_number = format_modifier(@cmd.modify_number)

    "(#{@times}CL#{max_shift}#{modify_number}#{cmp_op}#{@cmd.target_number})"
  end

  def result_clutch(after_shift)
    if @cmd.cmp_op != :>=
      "シフト#{after_shift}"
    elsif after_shift >= @cmd.target_number
      "成功 シフト#{@cmd.target_number}"
    else
      after_shift -= 1
      after_shift = 1 if after_shift < 1
      "失敗 シフト#{after_shift}"
    end
  end

  def clamp(i, min, max)
    if i < min
      min
    elsif i > max
      max
    else
      i
    end
  end

  def roll_(times, sides)
    _, dice_list = roll(times, sides)
    return dice_list.split(',').map(&:to_i)
  end

  # 判定
  def r_roll(string)
    parser = CommandParser.new(/\d+R6/i)
    @cmd = parser.parse(string)
    unless @cmd
      return nil
    end

    unless [:>=, nil].include?(@cmd.cmp_op)
      return nil
    end

    @times = @cmd.command.to_i

    if @times == 0
      return nil
    end

    @critical = normalize_critical(@cmd.critical || 12, string)
    @fumble = normalize_fumble(@cmd.fumble || 2, string)
    @break = (@cmd.dollar || 0).abs

    dice_list = roll_(@times, 6).sort
    dice_broken = dice_list.pop(@break)

    # ブレイク後のダイスから最大値２つの合計がダイスの値
    dice_total = dice_list.dup.pop(2).inject(0, :+)
    total = dice_total + @cmd.modify_number

    sequence = [
      expr_r(),
      dice_result_r(dice_total, dice_list, dice_broken),
      result_r(dice_total, total)
    ]

    return sequence.join(' ＞ ')
  end

  def expr_r()
    modify_number = format_modifier(@cmd.modify_number)
    critical = @critical == 12 ? "" : "c[#{@critical}]"
    fumble = @fumble == 2 ? "" : "f[#{@fumble}]"
    brak = @break == 0 ? "" : "b[#{@break}]"
    cmp_op = Format.comparison_operator(@cmd.cmp_op)

    "(#{@times}R6#{modify_number}#{critical}#{fumble}#{brak}#{cmp_op}#{@cmd.target_number})"
  end

  def dice_result_r(dice_total, dice_list, break_list)
    modify_number_text = format_modifier(@cmd.modify_number)

    # Ruby 1.8はArray#to_sの挙動が違う
    if break_list.empty?
      "#{dice_total}[#{dice_list.join(', ')}]#{modify_number_text}"
    else
      "#{dice_total}[#{dice_list.join(', ')}]×[#{break_list.join(', ')}]#{modify_number_text}"
    end
  end

  def result_r(dice_total, total)
    if dice_total <= @fumble
      "ファンブル!"
    elsif dice_total >= @critical
      "クリティカル!"
    elsif @cmd.cmp_op == :>=
      if total >= @cmd.target_number
        "#{total} 成功"
      else
        "#{total} 失敗"
      end
    else
      total.to_s
    end
  end

  def normalize_critical(critical, string)
    if /@[+-]/.match(string)
      critical = 12 + critical
    end

    if critical < 2
      critical = 2
    end

    return critical
  end

  def normalize_fumble(fumble, string)
    if /#[+-]/.match(string)
      fumble = 2 + fumble
    end

    return clamp(fumble, 0, 12)
  end

  # ダメージロール
  def damage_roll(string)
    parser = CommandParser.new(/\d+D6/i)
    @cmd = parser.parse(string)

    if @cmd.nil? || !@cmd.cmp_op.nil?
      return nil
    end

    @times = @cmd.command.to_i
    @break = (@cmd.dollar || 0).abs

    if @times == 0
      return nil
    end

    dice_list = roll_(@times, 6).sort
    dice_broken = dice_list.pop(@break)

    total_n = dice_list.inject(0, :+) + @cmd.modify_number
    total_n = 0 if total_n < 0

    sequence = [
      expr_damage(),
      result_damage(dice_list, dice_broken),
      total_n
    ]

    return sequence.join(' ＞ ')
  end

  def expr_damage()
    modify_number = format_modifier(@cmd.modify_number)
    brak = @break == 0 ? "" : "b[#{@break}]"

    "(#{@times}D6#{modify_number}#{brak})"
  end

  def result_damage(dice_list, break_list)
    dice_total = dice_list.inject(0, :+)
    modify_number_text = format_modifier(@cmd.modify_number)

    if break_list.empty?
      "#{dice_total}[#{dice_list.join(', ')}]#{modify_number_text}"
    else
      "#{dice_total}[#{dice_list.join(', ')}]×[#{break_list.join(', ')}]#{modify_number_text}"
    end
  end
end
