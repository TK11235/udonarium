# -*- coding: utf-8 -*-
# frozen_string_literal: true

require "utils/normalize"
require "utils/format"
require "utils/command_parser"

class NightWizard < DiceBot
  # ゲームシステムの識別子
  ID = 'NightWizard'

  # ゲームシステム名
  NAME = 'ナイトウィザード The 2nd Edition'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ないとういさあと2'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・判定用コマンド　(aNW+b@x#y$z+c)
　　a : 基本値
　　b : 常時に準じる特技による補正
　　c : 常時以外の特技、および支援効果による補正（ファンブル時には適用されない）
　　x : クリティカル値のカンマ区切り（省略時 10）
　　y : ファンブル値のカンマ区切り（省略時 5）
　　z : プラーナによる達成値補正のプラーナ消費数（ファンブル時には適用されない）
　クリティカル値、ファンブル値が無い場合は1や13などのあり得ない数値を入れてください。
　例）12NW-5@7#2$3 1NW 50nw+5@7,10#2,5 50nw-5+10@7,10#2,5+15+25
INFO_MESSAGE_TEXT

  setPrefixes(['([-+]?\d+)?NW.*', '2R6.*'])

  def initialize
    super
    @sendMode = 2
    @nw_command = "NW"
  end

  # @return [String, nil]
  def rollDiceCommand(string)
    cmd = parse_nw(string) || parse_2r6(string)
    unless cmd
      return nil
    end

    total, interim_expr, status = roll_nw(cmd)
    result =
      if cmd.cmp_op
        total.send(cmd.cmp_op, cmd.target_number) ? "成功" : "失敗"
      end

    sequence = [
      "(#{cmd})",
      interim_expr,
      status,
      total.to_s,
      result,
    ].compact
    return sequence.join(" ＞ ")
  end

  private

  class Parsed
    # @return [Array<Integer>] クリティカルになる出目の一覧
    attr_accessor :critical_numbers

    # @return [Array<Integer>] ファンブルになる出目の一覧
    attr_accessor :fumble_numbers

    # @return [Integer, nil] プラーナによる補正
    attr_accessor :prana

    # @return [Integer] ファンブルでない時に適用される修正値
    attr_accessor :active_modify_number

    # @return [Symbol, nil] 比較演算子
    attr_accessor :cmp_op

    # @return [Integer, nil] 目標値
    attr_accessor :target_number
  end

  class ParsedNW < Parsed
    # @return [Integer] 判定の基礎値
    attr_accessor :base

    # @return [Integer] 修正値
    attr_accessor :modify_number

    def initialize(command)
      @command = command
    end

    # 常に適用される修正値を返す
    #
    # @return [Integer]
    def passive_modify_number
      @base + @modify_number
    end

    # @return [String]
    def to_s
      base = @base.zero? ? nil : @base
      modify_number = Format.modifier(@modify_number)
      active_modify_number = Format.modifier(@active_modify_number)
      dollar = @prana && "$#{@prana}"

      return "#{base}#{@command}#{modify_number}@#{@critical_numbers.join(',')}##{@fumble_numbers.join(',')}#{dollar}#{active_modify_number}#{@cmp_op}#{@target_number}"
    end
  end

  class Parsed2R6 < Parsed
    # @return [Integer] 常に適用される修正値
    attr_accessor :passive_modify_number

    # @return [String]
    def to_s
      "2R6M[#{@passive_modify_number},#{@active_modify_number}]C[#{@critical_numbers.join(',')}]F[#{@fumble_numbers.join(',')}]#{@cmp_op}#{@target_number}"
    end
  end

  # @return [ParsedNW, nil]
  def parse_nw(string)
    m = /^([-+]?\d+)?#{@nw_command}((?:[-+]\d+)+)?(?:@(\d+(?:,\d+)*))?(?:#(\d+(?:,\d+)*))?(?:\$(\d+(?:,\d+)*))?((?:[-+]\d+)+)?(?:([>=]+)(\d+))?$/.match(string)
    unless m
      return nil
    end

    ae = ArithmeticEvaluator.new

    command = ParsedNW.new(@nw_command)
    command.base = m[1].to_i
    command.modify_number = m[2] ? ae.eval(m[2]) : 0
    command.critical_numbers = m[3] ? m[3].split(',').map(&:to_i) : [10]
    command.fumble_numbers = m[4] ? m[4].split(',').map(&:to_i) : [5]
    command.prana = m[5] && m[5].to_i
    command.active_modify_number = m[6] ? ae.eval(m[6]) : 0
    command.cmp_op = Normalize.comparison_operator(m[7])
    command.target_number = m[8] && m[8].to_i

    return command
  end

  # @return [Parsed2R6, nil]
  def parse_2r6(string)
    m = /^2R6m\[([-+]?\d+(?:[-+]\d+)*)(?:,([-+]?\d+(?:[-+]\d+)*))?\](?:c\[(\d+(?:,\d+)*)\])?(?:f\[(\d+(?:,\d+)*)\])?(?:([>=]+)(\d+))?/i.match(string)
    unless m
      return nil
    end

    ae = ArithmeticEvaluator.new

    command = Parsed2R6.new
    command.passive_modify_number = ae.eval(m[1])
    command.active_modify_number = m[2] ? ae.eval(m[2]) : 0
    command.critical_numbers = m[3] ? m[3].split(',').map(&:to_i) : [10]
    command.fumble_numbers = m[4] ? m[4].split(',').map(&:to_i) : [5]
    command.cmp_op = Normalize.comparison_operator(m[5])
    command.target_number = m[6] && m[6].to_i

    return command
  end

  def roll_nw(parsed)
    @critical_numbers = parsed.critical_numbers
    @fumble_numbers = parsed.fumble_numbers

    @total = 0
    @interim_expr = ""
    @status = nil

    status = roll_once_first()
    while status == :critical
      status = roll_once()
    end

    if status != :fumble && parsed.prana
      prana_bonus, prana_list = roll(parsed.prana, 6)
      @total += prana_bonus
      @interim_expr += "+#{prana_bonus}[#{prana_list}]"
    end

    base =
      if status == :fumble
        fumble_base_number(parsed)
      else
        parsed.passive_modify_number + parsed.active_modify_number
      end

    @total += base
    @interim_expr = base.to_s + @interim_expr

    return @total, @interim_expr, @status
  end

  # @return [Symbol, nil]
  def roll_once(fumbleable = false)
    dice_value, dice_str = roll(2, 6)

    if fumbleable && @fumble_numbers.include?(dice_value)
      @total -= 10
      @interim_expr += "-10[#{dice_str}]"
      @status = "ファンブル"
      return :fumble
    elsif @critical_numbers.include?(dice_value)
      @total += 10
      @interim_expr += "+10[#{dice_str}]"
      @status = "クリティカル"
      return :critical
    else
      @total += dice_value
      @interim_expr += "+#{dice_value}[#{dice_str}]"
      return nil
    end
  end

  # @return [Symbol, nil]
  def roll_once_first
    roll_once(true)
  end

  # @return [Integer]
  def fumble_base_number(parsed)
    parsed.passive_modify_number
  end
end
