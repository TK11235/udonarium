# -*- coding: utf-8 -*-
# frozen_string_literal: true

# 新しいtest/unitが対応しているRubyバージョンのみでテストケースを定義する
if RUBY_VERSION >= '2.0'
  bcdice_root = File.expand_path('..', File.dirname(__FILE__))
  $:.unshift(bcdice_root) unless $:.include?(bcdice_root)

  require 'test/unit'
  require 'diceBot/DiceBot'
  require 'diceBot/DiceBotLoader'

  class TestDiceBotInfoIsDefined < Test::Unit::TestCase
    # 一般的なダイスボット
    DEFAULT_DICEBOT = DiceBot.new

    # ダイスボットの配列
    dicebots = DiceBotLoader.collectDiceBots

    # テストデータを宣言する
    define_data = lambda { |bot| data(bot.id, [bot, bot.class.superclass]) }

    dicebots.each(&define_data)
    # ゲームシステムの識別子が定義されているか確認する
    # @param [DiceBot] bot 確認するダイスボット
    def test_dicebot_id_is_defined(data)
      bot, super_class = data
      assert_not_equal(super_class.new.id, bot.id,
                       "#{bot.class}: ゲームシステムの識別子が定義されている")
    end

    dicebots.each(&define_data)
    # ゲームシステム名が定義されているか確認する
    # @param [DiceBot] bot 確認するダイスボット
    def test_dicebot_name_is_defined(data)
      bot, super_class = data
      assert_not_equal(super_class.new.name, bot.name,
                       "#{bot.class}: ゲームシステム名が定義されている")
    end

    dicebots.each(&define_data)
    # ゲームシステム名の読みがなが定義されているか確認する
    # @param [DiceBot] bot 確認するダイスボット
    def test_dicebot_sort_key_is_defined(data)
      bot, super_class = data
      assert_not_equal(super_class.new.sort_key, bot.sort_key,
                       "#{bot.class}: ゲームシステム名の読みがなが定義されている")
    end

    dicebots.each(&define_data)
    # ダイスボットの使い方の説明文が定義されているか確認する
    # @param [DiceBot] bot 確認するダイスボット
    def test_dicebot_help_message_is_defined(data)
      bot, = data

      # ダイスボットの使い方の説明文については、基底クラスのものと同じでもよい
      assert_not_equal(DEFAULT_DICEBOT.help_message, bot.help_message,
                       "#{bot.class}: ダイスボットの使い方の説明文が定義されている")
    end
  end
end
