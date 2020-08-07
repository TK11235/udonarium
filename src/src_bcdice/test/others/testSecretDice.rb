# -*- coding: utf-8 -*-

$:.push(File.dirname(__FILE__) + "/..")
require 'test/unit'
require 'log'
require 'BCDice_forTest'

$isDebug = false

class TestSecretDice < Test::Unit::TestCase
  def setup
    $isDebug = false

    @nick = "test_nick"
    @channel = "test_channel"

    maker = BCDiceMaker_forTest.new
    @bcdice = maker.newBcDice()
  end

  def execute(text, channel = nil, nick = nil)
    @bcdice.setMessage(text)

    channel ||= @channel
    @bcdice.setChannel(channel)

    nick ||= @nick
    @bcdice.recievePublicMessage(nick)
  end

  def test_rollSecretAndOpen
    @bcdice.setRandomValues([[1, 6], [1, 6], [1, 6]])
    execute("S3d6")
    assert_equal("sendMessage\nto:test_nick\ntest_nick: (3D6) ＞ 3[1,1,1] ＞ 3\n", @bcdice.getResult())

    execute("Open Dice!")
    assert_equal("sendMessage\nto:test_channel\ntest_nick: (3D6) ＞ 3[1,1,1] ＞ 3\n", @bcdice.getResult())
  end

  def test_rollSecretAndOpen_at2Channel
    @bcdice.setRandomValues([[1, 6], [1, 6], [1, 6]])
    execute("S3d6")
    assert_equal("sendMessage\nto:test_nick\ntest_nick: (3D6) ＞ 3[1,1,1] ＞ 3\n", @bcdice.getResult())

    @bcdice.setRandomValues([[1, 6]])
    execute("S1d6", "anotherChannel")
    assert_equal("sendMessage\nto:test_nick\ntest_nick: (1D6) ＞ 1\n", @bcdice.getResult())

    execute("Open Dice!", "anotherChannel")
    assert_equal("sendMessage\nto:anotherChannel\ntest_nick: (1D6) ＞ 1\n", @bcdice.getResult())

    execute("Open Dice!")
    assert_equal("sendMessage\nto:test_channel\ntest_nick: (3D6) ＞ 3[1,1,1] ＞ 3\n", @bcdice.getResult())
  end

  def test_2rollSecretAnd2Open
    @bcdice.setRandomValues([[1, 6], [1, 6], [1, 6]])
    execute("S3d6")
    assert_equal("sendMessage\nto:test_nick\ntest_nick: (3D6) ＞ 3[1,1,1] ＞ 3\n", @bcdice.getResult())

    @bcdice.setRandomValues([[6, 6], [6, 6], [6, 6]])
    execute("S3d6")
    assert_equal("sendMessage\nto:test_nick\ntest_nick: (3D6) ＞ 18[6,6,6] ＞ 18\n", @bcdice.getResult())

    execute("Open Dice!")
    assert_equal("sendMessage\nto:test_channel\ntest_nick: (3D6) ＞ 18[6,6,6] ＞ 18\n", @bcdice.getResult())

    # 履歴は1件しか残らないので何も表示されない
    execute("Open Dice!")
    assert_equal("", @bcdice.getResult())
  end

  def _test_XXXXXXXX
    execute(text)
    assert_equal("", @bcdice.getResult())
  end

  def trace
    $isDebug = true
  end
end
