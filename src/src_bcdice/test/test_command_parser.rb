# -*- coding: utf-8 -*-

require 'test/unit'
require 'bcdiceCore'
require 'utils/command_parser'

class TestCommandParser < Test::Unit::TestCase
  def setup
    @parser = CommandParser.new("LL", "SA")
  end

  def test_parse_full
    parsed = @parser.parse("LL@1#2$9+4<=5")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(1, parsed.critical)
    assert_equal(2, parsed.fumble)
    assert_equal(9, parsed.dollar)
    assert_equal(4, parsed.modify_number)
    assert_equal(:<=, parsed.cmp_op)
    assert_equal(5, parsed.target_number)
  end

  def test_command_only
    parsed = @parser.parse("LL")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(nil, parsed.critical)
    assert_equal(nil, parsed.fumble)
    assert_equal(nil, parsed.dollar)
    assert_equal(0, parsed.modify_number)
    assert_equal(nil, parsed.cmp_op)
    assert_equal(nil, parsed.target_number)
  end

  def test_not_match
    parsed = @parser.parse("RR@1#2+4<=5")

    assert_equal(nil, parsed)
  end

  def test_negative_suffix
    parsed = @parser.parse("LL@-1#-2$-5")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(-1, parsed.critical)
    assert_equal(-2, parsed.fumble)
    assert_equal(-5, parsed.dollar)
  end

  def test_suffix_after_modify_number
    parsed = @parser.parse("LL+4@1#2$9<=5")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(1, parsed.critical)
    assert_equal(2, parsed.fumble)
    assert_equal(9, parsed.dollar)
    assert_equal(4, parsed.modify_number)
    assert_equal(:<=, parsed.cmp_op)
    assert_equal(5, parsed.target_number)
  end

  def test_expr
    parsed = @parser.parse("LL@1#2-4*3+6/2<=-10/5+2*6")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(1, parsed.critical)
    assert_equal(2, parsed.fumble)
    assert_equal(-9, parsed.modify_number)
    assert_equal(:<=, parsed.cmp_op)
    assert_equal(10, parsed.target_number)
  end

  def test_reverse_critical
    parsed = @parser.parse("LL#1@2+4<=5")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(2, parsed.critical)
    assert_equal(1, parsed.fumble)
    assert_equal(4, parsed.modify_number)
    assert_equal(:<=, parsed.cmp_op)
    assert_equal(5, parsed.target_number)
  end

  def test_critical_only
    parsed = @parser.parse("LL@23")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(23, parsed.critical)
    assert_equal(nil, parsed.fumble)
    assert_equal(nil, parsed.dollar)
  end

  def test_fumble_only
    parsed = @parser.parse("LL#23")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(nil, parsed.critical)
    assert_equal(23, parsed.fumble)
    assert_equal(nil, parsed.dollar)
  end

  def test_dollar_only
    parsed = @parser.parse("LL$23")

    assert_not_nil(parsed)
    assert_equal("LL", parsed.command)
    assert_equal(nil, parsed.critical)
    assert_equal(nil, parsed.fumble)
    assert_equal(23, parsed.dollar)
  end

  def test_duplicate_critical
    parsed = @parser.parse("LL@2@5")

    assert_equal(nil, parsed)
  end

  def test_duplicate_fumble
    parsed = @parser.parse("LL#2#5")

    assert_equal(nil, parsed)
  end

  def test_duplicate_dollar
    parsed = @parser.parse("LL$2$5")

    assert_equal(nil, parsed)
  end

  def test_no_suffix
    parsed = @parser.parse("LL+10>30")

    assert_equal("LL", parsed.command)
    assert_equal(nil, parsed.critical)
    assert_equal(nil, parsed.fumble)
    assert_equal(nil, parsed.dollar)
    assert_equal(10, parsed.modify_number)
    assert_equal(:>, parsed.cmp_op)
    assert_equal(30, parsed.target_number)
  end
end
