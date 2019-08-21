#!ruby -Ku
# -*- coding: utf-8 -*-

class ArgsAnalizer
  def initialize(args)
    @args = args
    @isStartIrc = true
  end

  attr :isStartIrc

  def analize
    isAnalized = false

    @args.each do |arg|
      result = analizeArg(arg)
      checkArg(arg)

      if result
        isAnalized = true
      end
    end

    return isAnalized
  end

  def checkArg(arg)
    if isCreateExeMode(arg)
      @isStartIrc = false
    end
  end

  def isCreateExeMode(arg)
    if arg == "createExe"
      if File.exist?("__createExe__.txt")
        return true
      end
    end

    return false
  end

  def analizeArg(arg)
    return false unless /^-([scngmeir])(.+)$/i =~ arg

    command = $1.downcase
    @param = $2

    case command
    when "s"
      setServer
    when "c"
      setChannel
    when "n"
      setNick
    when "g"
      setGame
    when "m"
      setMessageSendType
    when "e"
      readExtraCard
    when "i"
      setIrcServerCharacterCode
    else
      return false
    end

    return true
  end

  def setServer
    # サーバ設定(Server:Port)
    data = @param.split(/:/)
    $server = data[0]
    $port = data[1] if data[1]
  end

  def setChannel
    $defaultLoginChannelsText = decode($ircCode, @param)
  end

  def setNick
    $nick = @param
  end

  def setGame
    $defaultGameType = @param
  end

  def readExtraCard
    $extraCardFileName = @param
  end

  def setIrcServerCharacterCode
    $ircCode = param
  end
end
