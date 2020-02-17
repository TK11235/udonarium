# -*- coding: utf-8 -*-

$:.push(File.dirname(__FILE__) + "/..")

require 'test/unit'
require 'log'
require 'bcdiceCore.rb'
require 'ArgsAnalizer.rb'

class TestArgs < Test::Unit::TestCase
  def setup
    $isDebug = false
  end

  def trace
    $isDebug = true
  end

  def test_args
    argv = ['-sirc.trpg.net:6667', '-c#OnlineTRPG', '-gCthulhu', '-nfDICE_CoC']
    argsAnalizer = ArgsAnalizer.new(argv)
    argsAnalizer.analize
    assert_equal($server, 'irc.trpg.net')
    assert_equal($port, '6667')
    assert_equal($defaultLoginChannelsText, '#OnlineTRPG')
    assert_equal($defaultGameType, 'Cthulhu')
    assert_equal($nick, 'fDICE_CoC')
  end
end
