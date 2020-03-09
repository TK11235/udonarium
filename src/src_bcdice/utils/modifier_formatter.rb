# -*- coding: utf-8 -*-
# frozen_string_literal: true

# 修正値を整形する機能を提供するモジュール
module ModifierFormatter
  # 修正値を整形する
  # @param [Numeric] modifier 修正値
  # @return [String] 整形された修正値の文字列
  #
  # 引数modifierの符号によって返り値が以下のように変わる。
  #
  # * modifierが0の場合：空文字列
  # * modifierが正の場合：符号 "+" を数値の前に付ける（例：1 -> "+1"）
  # * modifierが負の場合：数値をそのまま文字列化して返す（例：-1 -> "-1"）
  def format_modifier(modifier)
    if modifier == 0
      ''
    elsif modifier > 0
      "+#{modifier}"
    else
      modifier.to_s
    end
  end
end
