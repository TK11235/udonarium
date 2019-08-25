# -*- coding: utf-8 -*-

dodontof_root = File.expand_path('..', File.dirname(__FILE__))
unless $:.include?(dodontof_root)
  $:.unshift(dodontof_root)
end

require 'test/unit'
require 'diceBot/DiceBot'

class TestDiceBotPrefixesCompatibility < Test::Unit::TestCase
  def test_prefixesCompatibility
    kariDiceClass = Class.new(DiceBot) do |_|
      def gameName
        '仮ダイス'
      end

      def gameType
        'KariDice'
      end

      # 従来の方法で接頭辞を設定する
      def prefixs
        ['KD\d+>=\d+']
      end
    end

    # 一回インスタンスを生成し、従来の方法で接頭辞が設定されているか
    # 判定されるようにする
    _ = kariDiceClass.new

    assert_equal(['KD\d+>=\d+'], kariDiceClass.prefixes,
                 'クラス側に接頭辞が設定されている')
    assert_not_equal(DiceBot::EMPTY_PREFIXES_PATTERN,
                     kariDiceClass.prefixesPattern,
                     'クラス側に接頭辞の正規表現が設定されている')
  end
end
