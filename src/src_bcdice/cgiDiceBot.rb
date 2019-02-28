# -*- coding: utf-8 -*-

bcDiceRoot = File.expand_path(File.dirname(__FILE__))
unless $LOAD_PATH.include?(bcDiceRoot)
  $LOAD_PATH.unshift(bcDiceRoot)
end

require 'bcdiceCore.rb'

class CgiDiceBot
  
  def initialize
    @rollResult = ""
    @isSecret = false
    @rands = nil #テスト以外ではnilで良い。ダイス目操作パラメータ
    @isTest = false
    @bcdice = nil
    
    $SEND_STR_MAX = 99999 # 最大送信文字数(本来は500byte上限)
  end
  
  attr :isSecret
  
  def rollFromCgi()
    cgi = CGI.new
    @cgiParams = @cgi.params
    
    rollFromCgiParams(cgiParams)
  end
  
  def rollFromCgiParamsDummy()
    @cgiParams = {
      'message' => 'STG20',
      # 'message' => 'S2d6',
      'gameType' => 'TORG',
      'channel' => '1',
      'state' => 'state',
      'sendto' => 'sendto',
      'color' => '999999',
    }
    
    rollFromCgiParams
  end
  
  def rollFromCgiParams
    message = @cgiParams['message']
    gameType = @cgiParams['gameType']
    gameType ||= 'diceBot';
    # $rand_seed = @cgiParams['randomSeed']
    
    result = ""
    
    result += "##>customBot BEGIN<##"
    result += getDiceBotParamText('channel')
    result += getDiceBotParamText('name')
    result += getDiceBotParamText('state')
    result += getDiceBotParamText('sendto')
    result += getDiceBotParamText('color')
    result += message
    rollResult, randResults = roll(message, gameType)
    result += rollResult
    result += "##>customBot END<##"
    
    return result
  end
  
  def getDiceBotParamText(paramName)
    param = @cgiParams[paramName]
    param ||= ''
    
    "#{param}\t"
  end
  
  def roll(message, gameType, dir = nil, prefix = '', isNeedResult = false)
    rollResult, randResults, gameType = executeDiceBot(message, gameType, dir, prefix, isNeedResult)
    
    result = ""
    
    unless( @isTest )
      # result += "##>isSecretDice<##" if( @isSecret )
    end
    
    # 多言語対応のダイスボットは「GameType:Language」という書式なので、
    # ここで言語名を削って表示する。（内部的には必要だが、表示では不要のため）
    gameType = gameType.gsub(/:.+$/, '')
    
    unless( rollResult.empty? )
      result += "\n#{gameType} #{rollResult}"
    end
    
    return result, randResults
  end
  
  def setTest()
    @isTest = true
  end
  
  def setRandomValues(rands)
    @rands = rands
  end
  
  def executeDiceBot(message, gameType, dir = nil, prefix = '', isNeedResult = false)
    bcdice = newBcDice
    
    bcdice.setIrcClient(self)
    bcdice.setRandomValues(@rands)
    bcdice.isKeepSecretDice(@isTest)
    bcdice.setTest(@isTest)
    bcdice.setCollectRandResult(isNeedResult)
    bcdice.setDir(dir, prefix)
    bcdice.setIrcMode(false)
    
    if( bcdice.getGameType != gameType )
      bcdice.setGameByTitle( gameType )
      gameType = bcdice.getGameType
    end
    
    bcdice.setMessage(message)
    
    channel = ""
    nick_e = ""
    bcdice.setChannel(channel)
    bcdice.recievePublicMessage(nick_e)
    
    rollResult = @rollResult
    @rollResult = ""
    
    randResults = bcdice.getRandResults
    
    return rollResult, randResults, gameType
  end
  
  def newBcDice
    if( @bcdice.nil? )
      bcdiceMaker = BCDiceMaker.new
      @bcdice = bcdiceMaker.newBcDice()
    end
    
    return @bcdice
  end
  
  def getGameCommandInfos(dir, prefix)
    require 'TableFileData'
    
    tableFileData = TableFileData.new
    tableFileData.setDir(dir, prefix)
    infos = tableFileData.getGameCommandInfos
    return infos
  end
  
  def sendMessage(to, message)
    @rollResult += message
  end
  
  def sendMessageToOnlySender(nick_e, message)
    @isSecret = true
    @rollResult += message
  end
  
  def sendMessageToChannels(message)
    @rollResult += message
  end
  
end


if( $0 === __FILE__ )
  bot = CgiDiceBot.new
  
  result = ''
  if( ARGV.length > 0 )
    result, randResults = bot.roll(ARGV[0], ARGV[1])
  else
    result = bot.rollFromCgiParamsDummy
  end
  
  print( result + "\n" )
end
