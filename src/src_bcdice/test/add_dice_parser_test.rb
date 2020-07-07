# -*- coding: utf-8 -*-
# frozen_string_literal: true

bcdice_root = File.expand_path('..', File.dirname(__FILE__))
$:.unshift(bcdice_root) unless $:.include?(bcdice_root)

require 'test/unit'
require 'bcdiceCore'
require 'dice/add_dice/parser'

class AddDiceParserTest < Test::Unit::TestCase
  def setup
    @bcdice = BCDiceMaker.new.newBcDice
  end

  # ダイスロールのみ
  def test_parse_dice_roll
    test_parse('2D6', '(Command (DiceRoll 2 6))')
  end

  # ダイスロール + 修正値
  def test_parse_modifier
    test_parse('2D6+1', '(Command (+ (DiceRoll 2 6) 1))')
  end

  # 定数畳み込みはしない
  def test_parse_long_modifier
    test_parse('2D6+1-1-2-3-4', '(Command (- (- (- (- (+ (DiceRoll 2 6) 1) 1) 2) 3) 4))')
  end

  # 複数のダイスロール
  def test_parse_multiple_dice_rolls
    test_parse(
      '2D6*3-1D6+1',
      '(Command (+ (- (* (DiceRoll 2 6) 3) (DiceRoll 1 6)) 1))'
    )
  end

  # 除法
  def test_parse_division
    test_parse('5D6/10', '(Command (/ (DiceRoll 5 6) 10))')
  end

  # 除法（切り上げ）
  def test_parse_division_with_rounding_up
    test_parse('3D6/2U', '(Command (/U (DiceRoll 3 6) 2))')
  end

  # 除法（四捨五入）
  def test_parse_division_with_rounding_off
    test_parse('1D100/10R', '(Command (/R (DiceRoll 1 100) 10))')
  end

  # 符号反転（負の整数で割る）
  def test_parse_negation_1
    test_parse('1D6/-3', '(Command (/ (DiceRoll 1 6) -3))')
  end

  # 符号反転（ダイスロールの符号反転）
  def test_parse_negation_2
    test_parse('-1D6+1', '(Command (+ (- (DiceRoll 1 6)) 1))')
  end

  # 二重符号反転（--1）
  def test_parse_double_negation_1
    test_parse('2D6--1', '(Command (+ (DiceRoll 2 6) 1))')
  end

  # 二重符号反転（---1）
  def test_parse_double_negation_2
    test_parse('2D6---1', '(Command (- (DiceRoll 2 6) 1))')
  end

  # 目標値あり（=）
  def test_parse_target_value_eq_1
    test_parse('2D6=7', '(Command (== (DiceRoll 2 6) 7))')
  end

  # 目標値あり（===）
  def test_parse_target_value_eq_2
    test_parse('2D6===7', '(Command (== (DiceRoll 2 6) 7))')
  end

  # 目標値あり（<>）
  def test_parse_target_value_not_eq
    test_parse('2D6<>7', '(Command (!= (DiceRoll 2 6) 7))')
  end

  # 目標値あり（>=）
  def test_parse_target_value_geq_1
    test_parse('2D6>=7', '(Command (>= (DiceRoll 2 6) 7))')
  end

  # 目標値あり（=>）
  def test_parse_target_value_geq_2
    test_parse('2D6=>7', '(Command (>= (DiceRoll 2 6) 7))')
  end

  # 目標値あり、目標値の定数畳み込み
  def test_parse_target_value_constant_fonding
    test_parse(
      '1D6+1-2>=1+2',
      '(Command (>= (- (+ (DiceRoll 1 6) 1) 2) 3))'
    )
  end

  # 大きな出目から複数個取る
  def test_parse_keep_high
    test_parse(
      '5D10KH3',
      '(Command (DiceRollWithFilter 5 10 :KH 3))'
    )
  end

  # 小さな出目から複数個取る
  def test_parse_keep_low
    test_parse(
      '5D10KL3',
      '(Command (DiceRollWithFilter 5 10 :KL 3))'
    )
  end

  # 大きな出目から複数個除く
  def test_parse_drop_high
    test_parse(
      '5D10DH3',
      '(Command (DiceRollWithFilter 5 10 :DH 3))'
    )
  end

  # 小さな出目から複数個除く
  def test_parse_drop_low
    test_parse(
      '5D10DL3',
      '(Command (DiceRollWithFilter 5 10 :DL 3))'
    )
  end

  # 大きな値キープ機能、修正値付き
  def test_parse_keep_high_with_modifier
    test_parse(
      '5D10KH3+1',
      '(Command (+ (DiceRollWithFilter 5 10 :KH 3) 1))'
    )
  end

  # 小さな値キープ機能、修正値付き
  def test_parse_keep_low_with_modifier
    test_parse(
      '5D10KL3+1',
      '(Command (+ (DiceRollWithFilter 5 10 :KL 3) 1))'
    )
  end

  # 大きな値ドロップ機能、修正値付き
  def test_parse_drop_high_with_modifier
    test_parse(
      '5D10DH3+1',
      '(Command (+ (DiceRollWithFilter 5 10 :DH 3) 1))'
    )
  end

  # 小さな値ドロップ機能、修正値付き
  def test_parse_drop_low_with_modifier
    test_parse(
      '5D10DL3+1',
      '(Command (+ (DiceRollWithFilter 5 10 :DL 3) 1))'
    )
  end

  private

  # 構文解析をテストする
  # @param [String] command テストするコマンド
  # @param [String] expected_s_exp 期待されるS式
  # @return [void]
  def test_parse(command, expected_s_exp)
    parser = AddDice::Parser.new(command)
    node = parser.parse

    assert(!parser.error?, '構文解析に成功する')
    assert_equal(expected_s_exp, node.s_exp, '結果の抽象構文木が正しい')
  end
end
