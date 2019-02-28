#!ruby -Ks
# -*- coding: utf-8 -*-

#require 'rubygems'
require 'net/irc.rb'
require 'net/irc/client.rb'
require 'net/irc/message.rb'
require 'net/irc/message/serverconfig.rb'
require 'net/irc/message/modeparser.rb'
require 'socket.so'
require 'encode.rb'

class Net::IRC::Client
  
  # Connect to server and start loop.
  def start
    @log.debug "start begin";
    # reset config
    @server_config = Message::ServerConfig.new
    @socket = TCPSocket.open(@host, @port)
    @log.debug "on_connected calling..";
    begin
      @log.debug "call...";
      on_connected
    rescue Exception => e
      @log.debug "error!!";
      @log.debug e.to_s
      @log.debug $!.inspect
      #@log.debug $@.join("\n") 
      @log.debug ($@ || []).join("\n") # TKfix $@ is ni
    end
    @log.debug "on_connected passed";

    @log.debug "post PASS";
    post PASS, @opts.pass if @opts.pass
    @log.debug "post NICK";
    post NICK, @opts.nick
    @log.debug "post USER";
    post USER, @opts.user, "0", "*", @opts.real
    
    @log.debug "while loop begin";
    l = nil
    while true
      begin
        while l = @socket.gets
          @log.debug "RECEIVE: #{l.chomp}"
          m = Message.parse(l)
          next if on_message(m) === true
          name = "on_#{(COMMANDS[m.command.upcase] || m.command).downcase}"
          @log.debug "calling... on_xxx : #{name}";
          send(name, m) if respond_to?(name)
        end
      rescue Message::InvalidMessage
        @log.error "MessageParse Exception: " + l.inspect
      rescue Exception => e
        @log.error "Exception: " + e.inspect
        warn e
        warn e.backtrace.join("\r\t")
        raise
      end
    end
    
  rescue IOError
  ensure
    finish
  end
  
end



