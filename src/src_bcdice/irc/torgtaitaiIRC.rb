# -*- coding: utf-8 -*-

class TorgtaitaiIRC
  def initialize()
    @isSecretMarkerPrinted = false

    maker = BCDiceMaker.new
    @bcdice = maker.newBcDice
    @bcdice.setIrcClient(self)

    @isTest = false
    @buffer = ''
  end

  def privmsg(to, message)
    # シークレットダイスの場合はここでマーカーを出力し、どどんとふにその旨を通達。
    # マーカーは1回だけ出力すれば十分なので2回目以降は抑止
    unless  @isSecretMarkerPrinted
      print("##>isSecretDice<##") unless @isTest
      @isSecretMarkerPrinted = true
    end

    notice(to, message)
  end

  def notice(_to, message)
    # print( "\n#{@game_type} " );
    # print( message.tosjis + "\n");

    # output = "#{to.inspect}:#{message.tosjis}\n"
    # output = "#{message.tosjis}\n"
    output = "\n#{@gameType} #{message.tosjis}\n"
    print(output) unless @isTest

    if @isTest
      @buffer += output
    end
  end

  def setTest
    @isTest = true
  end

  def getBuffer
    @buffer
  end

  def clearBuffer
    @buffer = ''
  end

  def setRandomValues(rands)
    @bcdice.setRandomValues(rands)
  end

  def newconn
    self
  end

  def add_handler(name, function)
    if  name == "public"
      function.call(self)
    end
  end

  def add_global_handler; end

  def start; end

  def quitCommand(arg); end

  def sendMessage(to, message)
    notice(to, message)
  end

  def sendMessageToOnlySender(nick_e, message)
    notice(nick_e, message)
  end

  def sendMessageToChannels(message)
    notice('allChannels', message)
  end

  def setGameByTitle(gameType)
    @gameType = gameType
    @bcdice.setGameByTitle(gameType)
  end

  def recieveMessage
    # @bcdice.recieveMessage('nick_e', 'tnick', message)
    @bcdice.setChannel('channel')
    @bcdice.recieveMessage('', '')
  end

  def recievePublicMessage
    # @bcdice.recievePublicMessage('nick_e', message)
    @bcdice.setChannel('channel')
    @bcdice.recievePublicMessage('')
  end

  def setMessage(message)
    @bcdice.setMessage(message)
  end
end
