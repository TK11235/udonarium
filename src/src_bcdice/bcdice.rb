#!/bin/ruby -Ku
# -*- coding: utf-8 -*-

$:.push(File.dirname(__FILE__)) # require_relative対策

require 'configBcDice.rb'

class Cli
  def quit; end

  def sendMessage(_to, message)
    print message
  end

  def sendMessageToOnlySender(_nick_e, message)
    print message
  end

  def sendMessageToChannels(message)
    print message
  end
end

def mainBcDiceCli(args)
  message = args[0]
  gameType = "DiceBot"
  if args.length >= 2
    gameType = args[0]
    message = args[1]
  end

  print message
  print "\n"

  bcdiceMaker = BCDiceMaker.new
  bcdice = bcdiceMaker.newBcDice()
  bcdice.setIrcClient(Cli.new)
  bcdice.setGameByTitle(gameType)

  bcdice.setMessage(message)
  channel = ""
  bcdice.setChannel(channel)
  bcdice.recievePublicMessage(gameType)
end

if $0 === __FILE__

  if  ARGV.empty? || (ARGV[0] == "createExe")
    require 'bcdiceGui.rb'
    mainBcDiceGui
  else
    require 'bcdiceCore.rb'
    mainBcDiceCli(ARGV)
  end

end
