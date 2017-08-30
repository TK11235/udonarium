# -*- coding: utf-8 -*-

$LOAD_PATH << File.dirname(__FILE__) + "/.."
require 'test/unit'
require 'CardTrader'
require 'Kconv'
require 'log'
require 'BCDice_forTest'

$isDebug = false

class TestCardTrader < Test::Unit::TestCase
  
  def setup
    $isDebug = false
    
    maker = BCDiceMaker_forTest.new
    @bcdice = maker.newBcDice()
    @cardTrader = @bcdice.cardTrader
    
    setDefaultNick
  end
  
  def setDefaultNick
    @cardTrader.setNick("test_nick")
  end
  
  def _test_printCardHelp()
    @cardTrader.printCardHelp()
    assert(@bcdice.getResult().length > 100)
  end
  
  def test_invalidCommand()
    @cardTrader.executeCard("aaaa", "channel")
    assert_equal("", @bcdice.getResult())
  end
  
  def test_invalidCommand2()
    @cardTrader.executeCard("c-invalidCommand", "channel")
    assert_equal("", @bcdice.getResult())
  end
  
  def test_shuffleCards()
    @cardTrader.executeCard("c-shuffle", "channel")
    assert_equal("sendMessage\nto:channel\nシャッフルしました\n", @bcdice.getResult())
  end
  
  def test_shuffleCards_min()
    @cardTrader.executeCard("c-sh", "channel")
    assert_equal("sendMessage\nto:channel\nシャッフルしました\n", @bcdice.getResult())
  end
  
  def test_draw
    @bcdice.setRandomValues([[53, 53]])
    @cardTrader.executeCard("c-draw", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nJ1\nsendMessage\nto:channel\ntest_nick: 1枚引きました\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[52, 52]])
    @cardTrader.executeCard("c-draw", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nC13\nsendMessage\nto:channel\ntest_nick: 1枚引きました\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[1, 51]])
    @cardTrader.executeCard("c-draw", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nS1\nsendMessage\nto:channel\ntest_nick: 1枚引きました\n", @bcdice.getResult())
  end
  
  def test_draw_3
    @bcdice.setRandomValues([[1, 53], [1, 52], [51, 51]])
    @cardTrader.executeCard("c-draw[3]", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nJ1,S1,S2\nsendMessage\nto:channel\ntest_nick: 3枚引きました\n", @bcdice.getResult())
  end
  
  def test_draw_full
    rands = []
    cardCount = 53
    cardCount.times do |i|
      max = cardCount - i
      rands << [1, max]
    end
    
    @bcdice.setRandomValues(rands)
    @cardTrader.executeCard("c-draw[53]", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nC1,C10,C11,C12,C13,C2,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,J1,S1,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9\nsendMessage\nto:channel\ntest_nick: 53枚引きました\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[1, 0]])
    @cardTrader.executeCard("c-draw[1]", "channel")
    assert_equal( "sendMessage\nto:channel\nカードが残っていません\n", @bcdice.getResult())
  end
  
  def test_odraw_3
    @bcdice.setRandomValues([[1, 53], [1, 52], [51, 51]])
    @cardTrader.executeCard("c-odraw[3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: J1,S1,S2を引きました\n", @bcdice.getResult())
  end
  
  def test_odraw_full
    drawCards(53, 53)
    
    @bcdice.setRandomValues([[1, 0]])
    @cardTrader.executeCard("c-odraw[1]", "channel")
    assert_equal( "sendMessage\nto:channel\nカードが残っていません\n", @bcdice.getResult())
  end
  
  def test_hand
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nカードを持っていません 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[1, 53], [1, 52], [51, 51]])
    @cardTrader.executeCard("c-odraw[3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: J1,S1,S2を引きました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S1,S2 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end
  
  def test_vhand
    @bcdice.setRandomValues([[1, 53], [1, 52], [51, 51]])
    @cardTrader.executeCard("c-odraw[3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: J1,S1,S2を引きました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-vhand test_nick", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\ntest_nick の手札は[ J1,S1,S2 ] 場札:[  ] タップした場札:[  ]です\n", @bcdice.getResult())
  end
  
  def test_play
    @bcdice.setRandomValues([[1, 53], [1, 52], [51, 51]])
    @cardTrader.executeCard("c-odraw[3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: J1,S1,S2を引きました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚出しました\nsendMessageToOnlySender\nto:\n[ J1,S2 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play[J1,S2]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 2枚出しました\nsendMessageToOnlySender\nto:\n[  ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play[C1]", "channel")
    assert_equal( "sendMessage\nto:channel\n[C1]は持っていません\nsendMessageToOnlySender\nto:\n[  ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end

  def test_play_toPlace
    @bcdice.setRandomValues([[1, 53], [1, 52], [51, 51]])
    @cardTrader.executeCard("c-draw[3]", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nJ1,S1,S2\nsendMessage\nto:channel\ntest_nick: 3枚引きました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play1[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚出しました\nsendMessageToOnlySender\nto:\n[ J1,S2 ] 場札:[ S1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play1[J1,S2]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 2枚出しました\nsendMessageToOnlySender\nto:\n[  ] 場札:[ J1,S1,S2 ] タップした場札:[  ]\n", @bcdice.getResult())
    
  end

  def test_rshuffle
    @bcdice.setRandomValues([[1, 53], [1, 52], [51, 51]])
    @cardTrader.executeCard("c-odraw[3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: J1,S1,S2を引きました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play[S1,J1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 2枚出しました\nsendMessageToOnlySender\nto:\n[ S2 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-rshuffle", "channel")
    assert_equal( "sendMessage\nto:channel\n捨て札を山に戻しました\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[52, 52]])
    @cardTrader.executeCard("c-odraw[1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: J1を引きました\n", @bcdice.getResult())
  end

  def test_clean
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    @cardTrader.executeCard("c-odraw[4]", "channel")
    @cardTrader.executeCard("c-play[S1]", "channel")
    @cardTrader.executeCard("c-play1[S2,S3]", "channel")
    debug( @bcdice.getResult() )
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1 ] 場札:[ S2,S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-clean", "channel")
    assert_equal( "sendMessage\nto:channel\n場のカードを捨てました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[49, 49]])
    @cardTrader.executeCard("c-draw", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nC13\nsendMessage\nto:channel\ntest_nick: 1枚引きました\n", @bcdice.getResult())
  end
  
  
  def test_review
    @cardTrader.executeCard("c-review", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nS1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11,S12,S13,H1,H2,H3,H4,H5,H6,H7,H8,H9,H10,H11,H12,H13,D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12,D13,C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12,C13,J1\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    @cardTrader.executeCard("c-odraw[4]", "channel")
    debug( @bcdice.getResult() )
    
    @cardTrader.executeCard("c-review", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nS4,S5,S6,S7,S8,S9,S10,S11,S12,S13,H1,H2,H3,H4,H5,H6,H7,H8,H9,H10,H11,H12,H13,D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12,D13,C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12,C13\n", @bcdice.getResult())
  end

  
  def test_pass
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    @cardTrader.executeCard("c-odraw[4]", "channel")
    @cardTrader.executeCard("c-play1[S3]", "channel")
    debug( @bcdice.getResult() )
    
    @cardTrader.setNick('john')
    @bcdice.setRandomValues([[49, 49]])
    @cardTrader.executeCard("c-odraw[1]", "channel")
    assert_equal( "sendMessage\nto:channel\njohn: C13を引きました\n", @bcdice.getResult())
    setDefaultNick
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S1,S2 ] 場札:[ S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    
    @cardTrader.executeCard("c-pass[S1]john", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚渡しました\nsendMessage\nto:john\n[ C13,S1 ] 場札:[  ] タップした場札:[  ]\nsendMessageToOnlySender\nto:\n[ J1,S2 ] 場札:[ S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-pass1[S3]john", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚渡しました\nsendMessage\nto:john\n[ C13,S1,S3 ] 場札:[  ] タップした場札:[  ]\nsendMessageToOnlySender\nto:\n[ J1,S2 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())

    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S2 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @bcdice.setRandomValues([[2, 2]])
    @cardTrader.executeCard("c-pass john", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚渡しました\nsendMessage\nto:john\n[ C13,J1,S1,S3 ] 場札:[  ] タップした場札:[  ]\nsendMessageToOnlySender\nto:\n[ S2 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ S2 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end


  def test_pick
    @cardTrader.executeCard("c-pick[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚選んで引きました\nsendMessageToOnlySender\nto:\n[ S1 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    drawCards(49, 52)
    
    @cardTrader.executeCard("c-review", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nC12,C13,J1\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-pick[J1,C13,C12]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 3枚選んで引きました\nsendMessageToOnlySender\nto:\n[ C1,C10,C11,C12,C13,C2,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,J1,S1,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-pick[J1]", "channel")
    assert_equal( "sendMessage\nto:channel\n[山札]がありません\nsendMessageToOnlySender\nto:\n[ C1,C10,C11,C12,C13,C2,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,J1,S1,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end
  
  
  def drawCards(count, total)
    rands = []
    cardCount = count
    cardCount.times do |i|
      max = total - i
      rands << [1, max]
    end
    
    debug('drawCards srands', rands)
    
    @bcdice.setRandomValues(rands)
    @cardTrader.executeCard("c-draw[#{count}]", "channel")
    @bcdice.getResult()
    #debug('drawCards, getResult@bcdice.getResult()', @bcdice.getResult())
  end
  
  
  
  def test_back
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [1, 50], [49, 49]])
    @cardTrader.executeCard("c-odraw[5]", "channel")
    @cardTrader.executeCard("c-play1[J1]", "channel")
    @cardTrader.executeCard("c-play[S1,S2,S3,S4]", "channel")
    debug( @bcdice.getResult() )
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[  ] 場札:[ J1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-back[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚戻しました\nsendMessageToOnlySender\nto:\n[ S1 ] 場札:[ J1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-back[S2,S3,S4]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 3枚戻しました\nsendMessageToOnlySender\nto:\n[ S1,S2,S3,S4 ] 場札:[ J1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-back[J1]", "channel")
    assert_equal( "sendMessage\nto:channel\n[捨て札]がありません\n", @bcdice.getResult())
  end

  
  def test_deal
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    
    @cardTrader.executeCard("c-deal[4] john", "channel")
    assert_equal( "sendMessage\nto:john\nJ1,S1,S2,S3\nsendMessage\nto:channel\ntest_nick: johnに[4]枚配りました\n", @bcdice.getResult())
    
    @cardTrader.setNick('john')
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S1,S2,S3 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end

  
  
  def test_vdeal
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    @cardTrader.executeCard("c-vdeal[4] john", "channel")
    assert_equal( "sendMessage\nto:john\nJ1,S1,S2,S3\nsendMessage\nto:test_nick\njohn に J1,S1,S2,S3 を配りました\nsendMessage\nto:channel\ntest_nick: johnに[4]枚配りました\n", @bcdice.getResult())
    
    @cardTrader.setNick('john')
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S1,S2,S3 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end

  
  def test_discard
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    @cardTrader.executeCard("c-odraw[4]", "channel")
    @cardTrader.executeCard("c-play1[S1,S2,S3]", "channel")
    debug( @bcdice.getResult() )
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1 ] 場札:[ S1,S2,S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-discard[J1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚捨てました\nsendMessageToOnlySender\nto:\n[  ] 場札:[ S1,S2,S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-discard1[S1,S2,S3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 3枚捨てました\nsendMessageToOnlySender\nto:\n[  ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end

  def test_place
    @cardTrader.setNick('john')
    @bcdice.setRandomValues([[1, 53]])
    @cardTrader.executeCard("c-odraw[1]", "channel")
    assert_equal( "sendMessage\nto:channel\njohn: S1を引きました\n", @bcdice.getResult())
    setDefaultNick
    
    @bcdice.setRandomValues([[1, 52], [1, 51], [1, 50], [49, 49]])
    @cardTrader.executeCard("c-odraw[4]", "channel")
    @cardTrader.executeCard("c-play1[S2]", "channel")
    debug( @bcdice.getResult() )
    
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S3,S4 ] 場札:[ S2 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-place[S3]john", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S4 ] 場札:[ S2 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.setNick('john')
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ S1 ] 場札:[ S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    setDefaultNick
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S4 ] 場札:[ S2 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-place1[S2]john", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S4 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ J1,S4 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.setNick('john')
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ S1 ] 場札:[ S2,S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    setDefaultNick
    
    @cardTrader.executeCard("c-place[J1,S4]john", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[  ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
  end

  
  def test_tap_untap
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    @cardTrader.executeCard("c-odraw[4] john", "channel")
    @cardTrader.executeCard("c-play1[J1,S1,S2,S3]", "channel")
    debug( @bcdice.getResult() )
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[  ] 場札:[ J1,S1,S2,S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-tap1[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚タップしました\nsendMessageToOnlySender\nto:\n[  ] 場札:[ J1,S2,S3 ] タップした場札:[ S1 ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-tap1[J1,S2,S3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 3枚タップしました\nsendMessageToOnlySender\nto:\n[  ] 場札:[  ] タップした場札:[ J1,S1,S2,S3 ]\n", @bcdice.getResult())
    
    
    @cardTrader.executeCard("c-untap1[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚アンタップしました\nsendMessageToOnlySender\nto:\n[  ] 場札:[ S1 ] タップした場札:[ J1,S2,S3 ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-untap1[J1,S2,S3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 3枚アンタップしました\nsendMessageToOnlySender\nto:\n[  ] 場札:[ J1,S1,S2,S3 ] タップした場札:[  ]\n", @bcdice.getResult())
  end

  
  def test_milstone
    @bcdice.setRandomValues([[1, 53], [1, 52], [1, 51], [50, 50]])
    @cardTrader.executeCard("c-milstone", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: S1が出ました\n", @bcdice.getResult())
  end
  
  
  def test_getSpell
    cardCount = 53
    rands = getRandsForDrawFullCard(cardCount)
    
    @bcdice.setRandomValues(rands)
    @cardTrader.executeCard("c-draw[52]", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nC1,C10,C11,C12,C13,C2,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,S1,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9\nsendMessage\nto:channel\ntest_nick: 52枚引きました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play1[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚出しました\nsendMessageToOnlySender\nto:\n[ C1,C10,C11,C12,C13,C2,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9 ] 場札:[ S1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-play[C2]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚出しました\nsendMessageToOnlySender\nto:\n[ C1,C10,C11,C12,C13,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9 ] 場札:[ S1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ C1,C10,C11,C12,C13,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9 ] 場札:[ S1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-spell", "channel")
    assert_equal( "sendMessage\nto:channel\n復活の呪文 ＞ [1TEST_NICK,TEST_NICK,card_played,BC39DC11A]\n", @bcdice.getResult() )
  end

  def getRandsForDrawFullCard(cardCount)
    rands = []
    
    cardCount.times do |i|
      break if(i == cardCount)
      max = cardCount - i
      rands << [1, max]
    end
    
    return rands
  end
  
  def test_castSpell
    @cardTrader.executeCard("c-spell[1TEST_NICK,TEST_NICK,card_played,BC39DC11A]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: カード配置を復活しました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ C1,C10,C11,C12,C13,C3,C4,C5,C6,C7,C8,C9,D1,D10,D11,D12,D13,D2,D3,D4,D5,D6,D7,D8,D9,H1,H10,H11,H12,H13,H2,H3,H4,H5,H6,H7,H8,H9,S10,S11,S12,S13,S2,S3,S4,S5,S6,S7,S8,S9 ] 場札:[ S1 ] タップした場札:[  ]\n", @bcdice.getResult())
    
  end

  def test_getSpellLong
    
    @cardTrader.set2Deck2Jorker
    
    cardCount = 108
    rands = getRandsForDrawFullCard(cardCount)
    
    @bcdice.setRandomValues(rands)
    
    @cardTrader.executeCard("c-draw[5]", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nS1,S2,S3,S4,S5\nsendMessage\nto:channel\ntest_nick: 5枚引きました\n", @bcdice.getResult())
    @cardTrader.executeCard("c-play[S1]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚出しました\nsendMessageToOnlySender\nto:\n[ S2,S3,S4,S5 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    @cardTrader.executeCard("c-play1[S2,S3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 2枚出しました\nsendMessageToOnlySender\nto:\n[ S4,S5 ] 場札:[ S2,S3 ] タップした場札:[  ]\n", @bcdice.getResult())
    @cardTrader.executeCard("c-tap1[S3]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: 1枚タップしました\nsendMessageToOnlySender\nto:\n[ S4,S5 ] 場札:[ S2 ] タップした場札:[ S3 ]\n", @bcdice.getResult())
    
    
    @cardTrader.setNick('john')
    @cardTrader.executeCard("c-draw[5]", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\nS10,S6,S7,S8,S9\nsendMessage\nto:channel\njohn: 5枚引きました\n", @bcdice.getResult())
    @cardTrader.executeCard("c-play[S10]", "channel")
    assert_equal( "sendMessage\nto:channel\njohn: 1枚出しました\nsendMessageToOnlySender\nto:\n[ S6,S7,S8,S9 ] 場札:[  ] タップした場札:[  ]\n", @bcdice.getResult())
    @cardTrader.executeCard("c-play1[S7,S8]", "channel")
    assert_equal( "sendMessage\nto:channel\njohn: 2枚出しました\nsendMessageToOnlySender\nto:\n[ S6,S9 ] 場札:[ S7,S8 ] タップした場札:[  ]\n", @bcdice.getResult())
    @cardTrader.executeCard("c-tap1[S8]", "channel")
    assert_equal( "sendMessage\nto:channel\njohn: 1枚タップしました\nsendMessageToOnlySender\nto:\n[ S6,S9 ] 場札:[ S7 ] タップした場札:[ S8 ]\n", @bcdice.getResult())
    setDefaultNick
    
    @cardTrader.executeCard("c-spell", "channel")
    assert_equal( "sendMessage\nto:channel\n復活の呪文 ＞ [1JOHN,1TEST_NICK,2JOHN,2TEST_NICK,JOHN,TEST_NICK,card_played,HCEG2FBDFHA98]\n", @bcdice.getResult() )
  end
  
  def test_castSpellLong
    @cardTrader.executeCard("c-spell[1JOHN,1TEST_NICK,2JOHN,2TEST_NICK,JOHN,TEST_NICK,card_played,HCEG2FBDFHA98]", "channel")
    assert_equal( "sendMessage\nto:channel\ntest_nick: カード配置を復活しました\n", @bcdice.getResult())
    
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ S4,S5 ] 場札:[ S2 ] タップした場札:[ S3 ]\n", @bcdice.getResult())
    
    @cardTrader.setNick('john')
    @cardTrader.executeCard("c-hand", "channel")
    assert_equal( "sendMessageToOnlySender\nto:\n[ S6,S9 ] 場札:[ S7 ] タップした場札:[ S8 ]\n", @bcdice.getResult())
    setDefaultNick
    
  end

  def _test_
    @cardTrader.executeCard("c-", "channel")
    assert_equal( "", @bcdice.getResult())
  end

  
  def trace
    $isDebug = true
  end
end


