# -*- coding: utf-8 -*-

$:.push(File.dirname(__FILE__) + "/..")
require 'test/unit'
require 'log'
require 'BCDice_forTest'

$isDebug = false

class TestPointer < Test::Unit::TestCase
  def setup
    $isDebug = false

    @nick = "test_nick"
    @channel = "test_channel"

    maker = BCDiceMaker_forTest.new
    @bcdice = maker.newBcDice()
  end

  def trace
    $isDebug = true
  end

  def execute(text, channel = nil, nick = nil)
    @bcdice.setMessage(text)

    channel ||= @channel
    @bcdice.setChannel(channel)

    nick ||= @nick
    @bcdice.recievePublicMessage(nick)
  end

  def test_setPoinChangePoinAndOpen
    execute("#HP12")
    assert_equal("sendMessage\nto:test_channel\ntest_nick: (HP) 12\n", @bcdice.getResult())

    execute("#OPEN!HP")
    assert_equal("sendMessage\nto:test_channel\nHP: TEST_NICK(12)\n", @bcdice.getResult())

    execute("#HP9", nil, "nick2")
    assert_equal("sendMessage\nto:test_channel\nnick2: (HP) 9\n", @bcdice.getResult())

    execute("#OPEN!HP")
    assert_equal("sendMessage\nto:test_channel\nHP: NICK2(9) TEST_NICK(12)\n", @bcdice.getResult())

    execute("#OPEN!HP")
    assert_equal("sendMessage\nto:test_channel\nHP: NICK2(9) TEST_NICK(12)\n", @bcdice.getResult())

    execute("#HP-5")
    assert_equal("sendMessage\nto:test_channel\ntest_nick: (HP) 12 -> 7\n", @bcdice.getResult())

    execute("#OPEN!HP")
    assert_equal("sendMessage\nto:test_channel\nHP: NICK2(9) TEST_NICK(7)\n", @bcdice.getResult())
  end

  def test_any
    execute("#テスト：test1 まずは最大値なし")
    assert_equal("test_nick: テスト(TEST) 1", getResultCutHeaderSendMessageToTestChannel)

    execute("#テスト：test1/1 続けて最大値つき")
    assert_equal("test_nick: テスト(TEST) 1/1", getResultCutHeaderSendMessageToTestChannel)

    execute("#OPEN!test この状態でのタグ情報")
    assert_equal("TEST: テスト(1/1)", getResultCutHeaderSendMessageToTestChannel)

    execute("#testx1 現在値のみを別のタグで登録した場合（最大値なし）")
    assert_equal("test_nick: (TESTX) 1", getResultCutHeaderSendMessageToTestChannel)

    execute("#OPEN!testx")
    assert_equal("TESTX: TEST_NICK(1)", getResultCutHeaderSendMessageToTestChannel)

    execute("#testx1/1 現在値のみを別のタグで登録した場合（最大値つき）")
    assert_equal("test_nick: (TESTX) 1/1", getResultCutHeaderSendMessageToTestChannel)

    execute("#OPEN!testx")
    assert_equal("TESTX: TEST_NICK(1/1)", getResultCutHeaderSendMessageToTestChannel)

    execute("#テスト：test-1 ポイントの変化")
    assert_equal("test_nick: テスト(TEST) 1/1 -> 0/1", getResultCutHeaderSendMessageToTestChannel)

    execute("#OPEN!test")
    assert_equal("TEST: テスト(0/1)", getResultCutHeaderSendMessageToTestChannel)

    execute("#テスト：test+1 ポイントの変化")
    assert_equal("test_nick: テスト(TEST) 0/1 -> 1/1", getResultCutHeaderSendMessageToTestChannel)

    execute("#OPEN!test")
    assert_equal("TEST: テスト(1/1)", getResultCutHeaderSendMessageToTestChannel)

    execute("#testx-1")
    assert_equal("test_nick: (TESTX) 1/1 -> 0/1", getResultCutHeaderSendMessageToTestChannel)

    execute("#OPEN!testx")
    assert_equal("TESTX: TEST_NICK(0/1)", getResultCutHeaderSendMessageToTestChannel)

    execute("#testx+1")
    assert_equal("test_nick: (TESTX) 0/1 -> 1/1", getResultCutHeaderSendMessageToTestChannel)

    # タグ全体を開くOPEN!コマンドは受け付けるけど
    # 発言者が管理しているキャラクターのタグを表示するOPEN!コマンドは受け付けない？
    execute("#OPEN!")
    assert_equal("TEST_NICK(1/1) テスト(1/1)", getResultCutHeaderSendMessageToTestChannel)

    execute("#RENAME!テスト->テストb")
    assert_equal("test_nick: テスト->テストB", getResultCutHeaderSendMessageToTestChannel)

    execute("#OPEN!test")
    assert_equal("TEST: テストB(1/1)", getResultCutHeaderSendMessageToTestChannel)
  end

  def getResultCutHeaderSendMessageToTestChannel
    text = @bcdice.getResult()
    text = text.toutf8
    text = text.sub(/^sendMessage\nto:test_channel\n/, '')
    text = text.sub(/\n\Z/, '')
    return text
  end

  def _test_XXXXXXXX
    execute(text)
    assert_equal("", @bcdice.getResult())
  end
end
