#!/bin/ruby -Ku
# -*- coding: utf-8 -*-

require 'log'
require 'configBcDice.rb'
require 'CountHolder.rb'
require 'kconv'
require 'utils/ArithmeticEvaluator.rb'

#============================== 起動法 ==============================
# 上記設定をしてダブルクリック、
# もしくはコマンドラインで
#
# ruby bcdice.rb
#
# とタイプして起動します。
#
# このとき起動オプションを指定することで、ソースを書き換えずに設定を変更出来ます。
#
# -s サーバ設定      「-s(サーバ):(ポート番号)」     (ex. -sirc.trpg.net:6667)
# -c チャンネル設定  「-c(チャンネル名)」            (ex. -c#CoCtest)
# -n Nick設定        「-n(Nick)」                    (ex. -nDicebot)
# -g ゲーム設定      「-g(ゲーム指定文字列)」        (ex. -gCthulhu)
# -m メッセージ設定  「-m(Notice_flgの番号)」        (ex. -m0)
# -e エクストラカード「-e(カードセットのファイル名)」(ex. -eTORG_SET.txt)
# -i IRC文字コード   「-i(文字コード名称)」          (ex. -iISO-2022-JP)
#
# ex. ruby bcdice.rb -sirc.trpg.net:6667 -c#CoCtest -gCthulhu
#
# プレイ環境ごとにバッチファイルを作っておくと便利です。
#
# 終了時はボットにTalkで「お疲れ様」と発言します。($quitCommandで変更出来ます。)
#====================================================================

def decode(code, str)
  return str.kconv(code)
end

def encode(code, str)
  return Kconv.kconv(str, code)
end

# WindowsでかつRuby 1.9未満の環境であるかどうかを示す
# 端末にShift_JISで出力する必要性の判定に用いる
$RUBY18_WIN = RUBY_VERSION < '1.9' &&
  /mswin(?!ce)|mingw|cygwin|bccwin/i === RUBY_PLATFORM

$secretRollMembersHolder = {}
$secretDiceResultHolder = {}
$plotPrintChannels = {}
$point_counter = {}

require 'CardTrader'
require 'TableFileData' # TKfix extratables互換性
require 'diceBot/DiceBot'
require 'diceBot/DiceBotLoader'
require 'diceBot/DiceBotLoaderList'
require 'dice/AddDice'
require 'dice/UpperDice'
require 'dice/RerollDice'

class BCDiceMaker
  def initialize
    @diceBot = DiceBot.new
    @cardTrader = CardTrader.new
    @cardTrader.initValues

    @counterInfos = {}
    @tableFileData = TableFileData.new # TKfix extratables互換性

    @master = ""
    @quitFunction = nil
  end

  attr_accessor :master
  attr_accessor :quitFunction
  attr_accessor :diceBot
  attr_accessor :diceBotPath

  def newBcDice
    # bcdice = BCDice.new(self, @cardTrader, @diceBot, @counterInfos, nil)
    bcdice = BCDice.new(self, @cardTrader, @diceBot, @counterInfos, @tableFileData) # TKfix extratables互換性
    return bcdice
  end
end

class BCDice
  # 設定コマンドのパターン
  SET_COMMAND_PATTERN = /\Aset\s+(.+)/i

  VERSION = "2.03.02"

  attr_reader :cardTrader

  def initialize(parent, cardTrader, diceBot, counterInfos, tableFileData)
    @parent = parent

    setDiceBot(diceBot)

    @cardTrader = cardTrader
    @cardTrader.setBcDice(self)
    @counterInfos = counterInfos
    @tableFileData = tableFileData

    @nick_e = ""
    @tnick = ""
    @isMessagePrinted = false
    @rands = nil
    @isKeepSecretDice = true
    @randResults = nil
    @isIrcMode = true
  end

  # Unused method
  def setDir(dir, prefix) # TKfix extratables互換性
    @tableFileData.setDir(dir, prefix)
  end

  def isKeepSecretDice(b)
    @isKeepSecretDice = b
  end

  def getGameType
    @diceBot.gameType
  end

  def setDiceBot(diceBot)
    return if  diceBot.nil?

    @diceBot = diceBot
    @diceBot.bcdice = self
    @parent.diceBot = @diceBot
  end

  attr_reader :nick_e

  def readExtraCard(cardFileName)
    @cardTrader.readExtraCard(cardFileName)
  end

  def setIrcClient(client)
    @ircClient = client
  end

  def setMessage(message)
    # 設定で変化し得るためopen系はここで正規表現を作る
    openPattern = /\A\s*(?:#{$OPEN_DICE}|#{$OPEN_PLOT})\s*\z/i

    messageToSet =
      case message
      when openPattern, SET_COMMAND_PATTERN
        message
      else
        # 空白が含まれる場合、最初の部分だけを取り出す
        message.split(/\s/, 2).first
      end
    debug("setMessage messageToSet", messageToSet)

    @messageOriginal = parren_killer(messageToSet)
    @message = @messageOriginal.upcase
    debug("@message", @message)
  end

  def getOriginalMessage
    @messageOriginal
  end

  # 直接TALKでは大文字小文字を考慮したいのでここでオリジナルの文字列に変更
  def changeMessageOriginal
    @message = @messageOriginal
  end

  def recieveMessage(nick_e, tnick)
    begin
      recieveMessageCatched(nick_e, tnick)
    rescue => e
      printErrorMessage(e)
    end
  end

  def printErrorMessage(e)
    #sendMessageToOnlySender("error " + e.to_s + $@.join("\n"))
    sendMessageToOnlySender("error " + e.to_s + ($@ || []).join("\n") + $!) # TKfix $@ is nil
  end

  def recieveMessageCatched(nick_e, tnick)
    debug('recieveMessage nick_e, tnick', nick_e, tnick)

    @nick_e = nick_e
    @cardTrader.setTnick(@nick_e)

    @tnick = tnick
    @cardTrader.setTnick(@tnick)

    debug("@nick_e, @tnick", @nick_e, @tnick)

    # ===== 設定関係 ========
    setMatches = @message.match(SET_COMMAND_PATTERN)
    if setMatches
      setCommand(setMatches[1])
      return
    end

    # ポイントカウンター関係
    executePointCounter

    # プロット入力処理
    addPlot(@messageOriginal.clone)

    # ボット終了命令
    case @message
    when $quitCommand
      quit

    when /^mode$/i
      # モード確認
      checkMode()

    when /^help$/i
      # 簡易オンラインヘルプ
      printHelp()

    when /^c-help$/i
      @cardTrader.printCardHelp()

    end
  end

  def quit
    @ircClient.quit

    if @parent.quitFunction.nil?
      sleepForIrc(3)
      exit(0)
    else
      @parent.quitFunction.call()
    end
  end

  def setQuitFuction(func)
    @parent.quitFunction = func
  end

  def setCommand(arg)
    debug('setCommand arg', arg)

    case arg.downcase
    when 'master'
      # マスター登録
      setMaster()

    when 'game'
      # ゲーム設定
      setGame()

    when /\Av(?:iew\s*)?mode\z/
      # 表示モード設定
      setDisplayMode()

    when 'upper'
      # 上方無限ロール閾値設定 0=Clear
      setUpplerRollThreshold()

    when 'reroll'
      # 個数振り足しロール回数制限設定 0=無限
      setRerollLimit()

    when /\Ar(?:ating\s*)?t(?:able)?\z/
      # レーティング表設定
      setRatingTable()

    when 'sort'
      # ソートモード設定
      setSortMode()

    when 'cardplace', 'cp'
      # カードモード設定
      setCardMode()

    when 'shortspell', 'ss'
      # 呪文モード設定
      setSpellMode()

    when 'tap'
      # タップモード設定
      setTapMode()

    when 'cardset', 'cs'
      # カード読み込み
      readCardSet()
    end
  end

  def setMaster()
    if @parent.master != ""
      setMasterWhenMasterAlreadySet()
    else
      setMasterWhenMasterYetSet()
    end
  end

  def setMasterWhenMasterAlreadySet()
    if @nick_e == @parent.master
      setMasterByCurrentMasterOwnself()
    else
      sendMessageToOnlySender("Masterは#{@parent.master}さんになっています")
    end
  end

  def setMasterByCurrentMasterOwnself()
    if @tnick != ""
      @parent.master = @tnick
      sendMessageToChannels("#{@parent.master}さんをMasterに設定しました")
    else
      @parent.master = ""
      sendMessageToChannels("Master設定を解除しました")
    end
  end

  def setMasterWhenMasterYetSet()
    if @tnick != ""
      @parent.master = @tnick
    else
      @parent.master = @nick_e
    end
    sendMessageToChannels("#{@parent.master}さんをMasterに設定しました")
  end

  def setGame()
    messages = setGameByTitle(@tnick)
    sendMessageToChannels(messages)
  end

  def isMaster()
    return ((@nick_e == @parent.master) || (@parent.master == ""))
  end

  def setDisplayMode()
    return unless  isMaster()

    return unless  /(\d+)/ =~ @tnick

    mode = $1.to_i
    @diceBot.setSendMode(mode)

    sendMessageToChannels("ViewMode#{@diceBot.sendMode}に変更しました")
  end

  def setUpplerRollThreshold()
    return unless  isMaster()

    return unless  /(\d+)/ =~ @tnick

    @diceBot.upplerRollThreshold = $1.to_i

    if @diceBot.upplerRollThreshold > 0
      sendMessageToChannels("上方無限ロールを#{@diceBot.upplerRollThreshold}以上に設定しました")
    else
      sendMessageToChannels("上方無限ロールの閾値設定を解除しました")
    end
  end

  def setRerollLimit()
    return unless  isMaster()

    return unless  /(\d+)/ =~ @tnick

    @diceBot.rerollLimitCount = $1.to_i

    if @diceBot.rerollLimitCount > 0
      sendMessageToChannels("個数振り足しロール回数を#{@diceBot.rerollLimitCount}以下に設定しました")
    else
      sendMessageToChannels("個数振り足しロールの回数を無限に設定しました")
    end
  end

  def setRatingTable()
    return unless isMaster()

    output = @diceBot.setRatingTable(@tnick)
    return if output == '1'

    sendMessageToChannels(output)
  end

  def setSortMode()
    return unless  isMaster()

    return unless  /(\d+)/ =~ @tnick

    sortType = $1.to_i
    @diceBot.setSortType(sortType)

    if @diceBot.sortType != 0
      sendMessageToChannels("ソート有りに変更しました")
    else
      sendMessageToChannels("ソート無しに変更しました")
    end
  end

  def setCardMode()
    return unless isMaster()

    @cardTrader.setCardMode()
  end

  def setSpellMode()
    return unless  isMaster()

    return unless  /(\d+)/ =~ @tnick

    @isShortSpell = ($1.to_i != 0)

    if @isShortSpell
      sendMessageToChannels("短い呪文モードに変更しました")
    else
      sendMessageToChannels("通常呪文モードに変更しました")
    end
  end

  def setTapMode()
    return unless  isMaster()

    return unless  /(\d+)/ =~ @tnick

    @canTapCard = ($1.to_i != 0)

    if @canTapCard
      sendMessageToChannels("タップ可能モードに変更しました")
    else
      sendMessageToChannels("タップ不可モードに変更しました")
    end
  end

  def readCardSet()
    return unless isMaster()

    @cardTrader.readCardSet()
  end

  def executePointCounter
    arg = @messages
    debug("executePointCounter arg", arg)

    unless arg =~ /^#/
      debug("executePointCounter is NOT matched")
      return
    end

    channel = getPrintPlotChannel(@nick_e)
    debug("getPrintPlotChannel get channel", channel)

    if channel == "1"
      sendMessageToOnlySender("表示チャンネルが登録されていません")
      return
    end

    arg += "->#{@tnick}" unless @tnick.empty?

    pointerMode = :sameNick
    output, pointerMode = countHolder.executeCommand(arg, @nick_e, channel, pointerMode)
    debug("point_counter_command called, line", __LINE__)
    debug("output", output)
    debug("pointerMode", pointerMode)

    if output == "1"
      debug("executePointCounter point_counter_command output is \"1\"")
      return
    end

    case pointerMode
    when :sameNick
      debug("executePointCounter:Talkで返事")
      sendMessageToOnlySender(output)
    when :sameChannel
      debug("executePointCounter:publicで返事")
      sendMessage(channel, output)
    end

    debug("executePointCounter end")
  end

  def addPlot(arg)
    debug("addPlot begin arg", arg)

    unless /#{$ADD_PLOT}[:：](.+)/i =~ arg
      debug("addPlot exit")
      return
    end
    plot = $1

    channel = getPrintPlotChannel(@nick_e)

    debug('addPlot channel', channel)

    if channel.nil?
      debug('channel.nil?')
      sendMessageToOnlySender("プロット出力先が登録されていません")
    else
      debug('addToSecretDiceResult calling...')
      addToSecretDiceResult(plot, channel, 1)
      sendMessage(channel, "#{@nick_e} さんがプロットしました")
    end
  end

  def getPrintPlotChannel(nick)
    nick = getNick(nick)
    return $plotPrintChannels[nick]
  end

  def checkMode()
    return unless isMaster()

    output = "GameType = " + @diceBot.gameType + ", ViewMode = " + @diceBot.sendMode + ", Sort = " + @diceBot.sortType
    sendMessageToOnlySender(output)
  end

  # 簡易オンラインヘルプを表示する
  def printHelp
    send_to_sender = lambda { |message| sendMessageToOnlySender message }

    [
      "・加算ロール　　　　　　　　(xDn) (n面体ダイスをx個)",
      "・バラバラロール　　　　　　(xBn)",
      "・個数振り足しロール　　　　(xRn[振り足し値])",
      "・上方無限ロール　　　　　　(xUn[境界値])",
      "・シークレットロール　　　　(Sダイスコマンド)",
      "・シークレットをオープンする(#{$OPEN_DICE})",
      "・四則計算(端数切捨て)　　　(C(式))"
    ].each(&send_to_sender)

    sleepForIrc 2

    @diceBot.getHelpMessage.lines.each_slice(5) do |lines|
      lines.each(&send_to_sender)
      sleepForIrc 1
    end

    sendMessageToOnlySender "  ---"

    sleepForIrc 1

    [
      "・プロット表示　　　　　　　　(#{$OPEN_PLOT})",
      "・プロット記録　　　　　　　　(Talkで #{$ADD_PLOT}:プロット)",
      "  ---"
    ].each(&send_to_sender)

    sleepForIrc 2

    [
      "・ポイントカウンタ値登録　　　(#[名前:]タグn[/m]) (識別名、最大値省略可,Talk可)",
      "・カウンタ値操作　　　　　　　(#[名前:]タグ+n) (もちろん-nもOK,Talk可)",
      "・識別名変更　　　　　　　　　(#RENAME!名前1->名前2) (Talk可)"
    ].each(&send_to_sender)

    sleepForIrc 1

    [
      "・同一タグのカウンタ値一覧　　(#OPEN!タグ)",
      "・自キャラのカウンタ値一覧　　(Talkで#OPEN![タグ]) (全カウンタ表示時、タグ省略)",
      "・自キャラのカウンタ削除　　　(#[名前:]DIED!) (デフォルト時、識別名省略)",
      "・全自キャラのカウンタ削除　　(#ALL!:DIED!)",
      "・カウンタ表示チャンネル登録　(#{$READY_CMD})",
      "  ---"
    ].each(&send_to_sender)

    sleepForIrc 2

    sendMessageToOnlySender "・カード機能ヘルプ　　　　　　(c-help)"

    sendMessageToOnlySender "  -- END ---"
  end

  def setChannel(channel)
    debug("setChannel called channel", channel)
    @channel = channel
  end

  def recievePublicMessage(nick_e)
    begin
      recievePublicMessageCatched(nick_e)
    rescue => e
      printErrorMessage(e)
    end
  end

  def recievePublicMessageCatched(nick_e)
    debug("recievePublicMessageCatched begin nick_e", nick_e)
    debug("recievePublicMessageCatched @channel", @channel)
    debug("recievePublicMessageCatched @message", @message)

    @nick_e = nick_e

    mynick = ''# self.nick
    secret = false

    # プロットやシークレットダイス用に今のチャンネル名を記憶
    setChannelForPlotOrSecretDice

    # プロットの表示
    if /(^|\s+)#{$OPEN_PLOT}(\s+|$)/i =~ @message
      debug('print plot', @message)
      printPlot()
    end

    # シークレットロールの表示
    if /(^|\s+)#{$OPEN_DICE}(\s+|$)/i =~ @message
      debug('print secret roll', @message)
      printSecretRoll()
    end

    # ポイントカウンター関係
    executePointCounterPublic

    # ダイスロールの処理
    executeDiceRoll

    # 四則計算代行
    if /(^|\s)C([-\d]+)\s*$/i =~ @message
      output = $2
      if output != ""
        sendMessage(@channel, "#{@nick_e}: 計算結果 ＞ #{output}")
      end
    end

    # ここから大文字・小文字を考慮するようにメッセージを変更
    changeMessageOriginal

    # カード処理
    executeCard

    unless @isMessagePrinted # ダイスロール以外の発言では捨てダイス処理を
      # rand 100 if($isRollVoidDiceAtAnyRecive)
    end

    debug("\non_public end")
  end

  def printPlot
    debug("printPlot begin")
    messageList = openSecretRoll(@channel, 1)
    debug("messageList", messageList)

    messageList.each do |message|
      if message.empty?
        debug("message is empty")
        setPrintPlotChannel
      else
        debug("message", message)
        sendMessage(@channel, message)
        sleepForIrc 1
      end
    end
  end

  def setChannelForPlotOrSecretDice
    debug("setChannelForPlotOrSecretDice Begin")

    return if isTalkChannel

    channel = getPrintPlotChannel(@nick_e)
    if channel.nil?
      setPrintPlotChannel
    end
  end

  def isTalkChannel
    !(/^#/ === @channel)
  end

  def printSecretRoll
    outputs = openSecretRoll(@channel, 0)

    outputs.each do |diceResult|
      next if diceResult.empty?

      sendMessage(@channel, diceResult)
      sleepForIrc 1
    end
  end

  def executePointCounterPublic
    debug("executePointCounterPublic begin")

    if /^#{$READY_CMD}(\s+|$)/i =~ @message
      setPrintPlotChannel
      sendMessageToOnlySender("表示チャンネルを設定しました")
      return
    end

    unless /^#/ =~ @message
      debug("executePointCounterPublic NOT match")
      return
    end

    pointerMode = :sameChannel
    countHolder = CountHolder.new(self, @counterInfos)
    output, secret = countHolder.executeCommand(@message, @nick_e, @channel, pointerMode)
    debug("executePointCounterPublic output, secret", output, secret)

    if secret
      debug("is secret")
      sendMessageToOnlySender(output) if output != "1"
    else
      debug("is NOT secret")
      sendMessage(@channel, output) if output != "1"
    end
  end

  def executeDiceRoll
    debug("executeDiceRoll begin")
    debug("channel", @channel)

    output, secret = dice_command

    unless  secret
      debug("executeDiceRoll @channel", @channel)
      sendMessage(@channel,  output) if output != "1"
      return
    end

    # 隠しロール
    return if output == "1"

    if @isTest
      output += "###secret dice###"
    end

    broadmsg(output, @nick_e)

    if @isKeepSecretDice
      addToSecretDiceResult(output, @channel, 0)
    end
  end

  def setTest(isTest)
    @isTest = isTest
  end

  def executeCard
    debug('executeCard begin')
    @cardTrader.setNick(@nick_e)
    @cardTrader.setTnick(@tnick)
    @cardTrader.executeCard(@message, @channel)
    debug('executeCard end')
  end

  ###########################################################################
  # **                         各種コマンド処理
  ###########################################################################

  #=========================================================================
  # **                           コマンド分岐
  #=========================================================================
  def dice_command # ダイスコマンドの分岐処理
    arg = @message.upcase

    debug('dice_command arg', arg)

    output, secret = @diceBot.dice_command(@message, @nick_e)
    return output, secret if output != '1'

    output, secret = rollD66(arg)
    return output, secret unless output.nil?

    output, secret = checkAddRoll(arg)
    return output, secret unless output.nil?

    output, secret = checkBDice(arg)
    return output, secret unless output.nil?

    output, secret = checkRnDice(arg)
    return output, secret unless output.nil?

    output, secret = checkUpperRoll(arg)
    return output, secret unless output.nil?

    output, secret = checkChoiceCommand(arg)
    return output, secret unless output.nil?

    output, secret = getTableDataResult(arg)
    return output, secret unless output.nil?

    output = '1'
    secret = false
    return output, secret
  end

  def checkAddRoll(arg)
    debug("check add roll")

    dice = AddDice.new(self, @diceBot)
    output = dice.rollDice(arg)
    return nil if output == '1'

    secret = (/S[-\d]+D[\d+-]+/ === arg)

    return output, secret
  end

  def checkBDice(arg)
    debug("check barabara roll")

    output = bdice(arg)
    return nil if output == '1'

    secret = (/S[\d]+B[\d]+/i === arg)

    return output, secret
  end

  def checkRnDice(arg)
    debug('check xRn roll arg', arg)

    return nil unless /(S)?[\d]+R[\d]+/i === arg

    secret = !$1.nil?

    output = @diceBot.dice_command_xRn(arg, @nick_e)
    return nil if  output.nil? || (output == '1')

    if output.empty?
      dice = RerollDice.new(self, @diceBot)
      output = dice.rollDice(arg)
    end

    return nil if output.nil? || (output == '1')

    debug('xRn output', output)

    return output, secret
  end

  def checkUpperRoll(arg)
    debug("check upper roll")

    return nil unless /(S)?[\d]+U[\d]+/i === arg

    secret = !$1.nil?

    dice = UpperDice.new(self, @diceBot)
    output = dice.rollDice(arg)
    return nil if output == '1'

    return output, secret
  end

  def checkChoiceCommand(arg)
    debug("check choice command")

    return nil unless /((^|\s)(S)?choice\[[^,]+(,[^,]+)+\]($|\s))/i === arg

    secret = !$3.nil?
    output = choice_random($1)

    return output, secret
  end

  # Unused method.
  def getTableDataResult(arg) # TKfix extratables互換性
    debug("getTableDataResult Begin")

    dice, title, table, secret = @tableFileData.getTableData(arg, @diceBot.gameType)
    debug("dice", dice)

    if table.nil?
      debug("table is null")
      return nil
    end

    value, diceText = getTableIndexDiceValueAndDiceText(dice)
    return nil if value.nil?

    debug("value", value)

    key, message = table.find { |i| i.first === value }
    return nil if message.nil?

    message = rollTableMessageDiceText(message)

    output = "#{nick_e}:#{title}(#{value}[#{diceText}]) ＞ #{message}"

    return output, secret
  end

  def getTableIndexDiceValueAndDiceText(dice)
    if /(\d+)D(\d+)/i === dice
      diceCount = $1
      diceType = $2
      value, diceText = roll(diceCount, diceType)
      return value, diceText
    end

    string, secret, count, swapMarker = getD66Infos(dice)
    unless  string.nil?
      value = getD66ValueByMarker(swapMarker)
      #diceText = (value / 10).to_s  + "," + (value % 10).to_s
      diceText = (value / 10).floor.to_s  + "," + (value % 10).to_s # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
      return value, diceText
    end

    return nil
  end

  def rollTableMessageDiceText(text)
    message = text.gsub(/(\d+)D(\d+)/) do
      m = $~
      diceCount = m[1]
      diceMax = m[2]
      value, = roll(diceCount, diceMax)
      "#{diceCount}D#{diceMax}(=>#{value})"
    end

    return message
  end

  #=========================================================================
  # **                           ランダマイザ
  #=========================================================================
  # ダイスロール
  def roll(dice_cnt, dice_max, dice_sort = 0, dice_add = 0, dice_ul = '', dice_diff = 0, dice_re = nil)
    dice_cnt = dice_cnt.to_i
    dice_max = dice_max.to_i
    dice_re = dice_re.to_i

    total = 0
    dice_str = ""
    numberSpot1 = 0
    cnt_max = 0
    n_max = 0
    cnt_suc = 0
    d9_on = false
    rerollCount = 0
    dice_result = []

    # dice_add = 0 if( ! dice_add )

    if (@diceBot.d66Type != 0) && (dice_max == 66)
      dice_sort = 0
      dice_cnt = 2
      dice_max = 6
    end

    if @diceBot.isD9 && (dice_max == 9)
      d9_on = true
      dice_max += 1
    end

    unless (dice_cnt <= $DICE_MAXCNT) && (dice_max <= $DICE_MAXNUM)
      return total, dice_str, numberSpot1, cnt_max, n_max, cnt_suc, rerollCount
    end

    dice_cnt.times do |i|
      i += 1
      dice_now = 0
      dice_n = 0
      dice_st_n = ""
      round = 0

      loop do
        if round >= 1
          # 振り足し時のダイス読み替え処理用（ダブルクロスはクリティカルでダイス10に読み替える)
          dice_now += @diceBot.getJackUpValueOnAddRoll(dice_n)
        end

        dice_n = rand(dice_max).to_i + 1
        dice_n -= 1 if d9_on

        dice_now += dice_n

        debug('@diceBot.sendMode', @diceBot.sendMode)
        if @diceBot.sendMode >= 2
          dice_st_n += "," unless dice_st_n.empty?
          dice_st_n += dice_n.to_s
        end
        round += 1

        break unless (dice_add > 1) && (dice_n >= dice_add)
      end

      total += dice_now

      if dice_ul != ''
        suc = check_hit(dice_now, dice_ul, dice_diff)
        cnt_suc += suc
      end

      if dice_re
        rerollCount += 1 if dice_now >= dice_re
      end

      if (@diceBot.sendMode >= 2) && (round >= 2)
        dice_result.push("#{dice_now}[#{dice_st_n}]")
      else
        dice_result.push(dice_now)
      end

      numberSpot1 += 1 if dice_now == 1
      cnt_max += 1 if  dice_now == dice_max
      n_max = dice_now if dice_now > n_max
    end

    if dice_sort != 0
      dice_str = dice_result.sort_by { |a| dice_num(a) }.join(",")
    else
      dice_str = dice_result.join(",")
    end

    return total, dice_str, numberSpot1, cnt_max, n_max, cnt_suc, rerollCount
  end

  def setRandomValues(rands)
    @rands = rands
  end

  def rand(max)
    debug('rand called @rands', @rands)

    value = 0
    if @rands.nil?
      value = randNomal(max)
    else
      value = randFromRands(max)
    end

    unless @randResults.nil?
      @randResults << [(value + 1), max]
    end

    return value
  end

  def setCollectRandResult(b)
    if b
      @randResults = []
    else
      @randResults = nil
    end
  end

  def getRandResults
    @randResults
  end

  def randNomal(max)
    Kernel.rand(max)
  end

  def randFromRands(targetMax)
    nextRand = @rands.shift

    if nextRand.nil?
      # return randNomal(targetMax)
      raise "nextRand is nil, so @rands is empty!! @rands:#{@rands.inspect}"
    end

    value, max = nextRand
    value = value.to_i
    max = max.to_i

    if  max != targetMax
      # return randNomal(targetMax)
      raise "invalid max value! [ #{value} / #{max} ] but NEED [ #{targetMax} ] dice"
    end

    return (value - 1)
  end

  def dice_num(dice_str)
    dice_str = dice_str.to_s
    return dice_str.sub(/\[[\d,]+\]/, '').to_i
  end

  #==========================================================================
  # **                            ダイスコマンド処理
  #==========================================================================

  ####################         バラバラダイス       ########################
  def bdice(string) # 個数判定型ダイスロール
    total_n = 0
    suc = 0
    signOfInequality = ""
    diff = 0
    output = ""

    string = string.gsub(/-[\d]+B[\d]+/, '') # バラバラダイスを引き算しようとしているのを除去

    unless /(^|\s)S?(([\d]+B[\d]+(\+[\d]+B[\d]+)*)(([<>=]+)([\d]+))?)($|\s)/ =~ string
      output = '1'
      return output
    end

    string = $2
    if $5
      diff = $7.to_i
      string = $3
      signOfInequality = marshalSignOfInequality($6)
    elsif  /([<>=]+)(\d+)/ =~ @diceBot.defaultSuccessTarget
      diff = $2.to_i
      signOfInequality = marshalSignOfInequality($1)
    end

    dice_a = string.split(/\+/)
    dice_cnt_total = 0
    numberSpot1 = 0

    dice_a.each do |dice_o|
      dice_cnt, dice_max, = dice_o.split(/[bB]/)
      dice_cnt = dice_cnt.to_i
      dice_max = dice_max.to_i

      dice_dat = roll(dice_cnt, dice_max, (@diceBot.sortType & 2), 0, signOfInequality, diff)
      suc += dice_dat[5]
      output += "," if output != ""
      output += dice_dat[1]
      numberSpot1 += dice_dat[2]
      dice_cnt_total += dice_cnt
    end

    if signOfInequality != ""
      string += "#{signOfInequality}#{diff}"
      output = "#{output} ＞ 成功数#{suc}"
      output += @diceBot.getGrichText(numberSpot1, dice_cnt_total, suc)
    end
    output = "#{@nick_e}: (#{string}) ＞ #{output}"

    return output
  end

  def isReRollAgain(dice_cnt, round)
    debug("isReRollAgain dice_cnt, round", dice_cnt, round)
    ((dice_cnt > 0) && ((round < @diceBot.rerollLimitCount) || (@diceBot.rerollLimitCount == 0)))
  end

  ####################             D66ダイス        ########################
  def rollD66(string)
    return nil unless /^S?D66/i === string
    return nil if @diceBot.d66Type == 0

    debug("match D66 roll")
    output, secret = d66dice(string)

    return output, secret
  end

  def d66dice(string)
    string = string.upcase
    secret = false
    output = '1'

    string, secret, count, swapMarker = getD66Infos(string)
    return output, secret if string.nil?

    debug('d66dice count', count)

    d66List = []
    count.times do |i|
      d66List << getD66ValueByMarker(swapMarker)
    end
    d66Text = d66List.join(',')
    debug('d66Text', d66Text)

    output = "#{@nick_e}: (#{string}) ＞ #{d66Text}"

    return output, secret
  end

  def getD66Infos(string)
    debug("getD66Infos, string", string)

    return nil unless /(^|\s)(S)?((\d+)?D66(N|S)?)(\s|$)/i === string

    secret = !$2.nil?
    string = $3
    count = ($4 || 1).to_i
    swapMarker = ($5 || "").upcase

    return string, secret, count, swapMarker
  end

  def getD66ValueByMarker(swapMarker)
    case swapMarker
    when "S"
      isSwap = true
      getD66(isSwap)
    when "N"
      isSwap = false
      getD66(isSwap)
    else
      getD66Value()
    end
  end

  def getD66Value(mode = nil)
    mode ||= @diceBot.d66Type

    isSwap = (mode > 1)
    getD66(isSwap)
  end

  def getD66(isSwap)
    output = 0

    dice_a = rand(6) + 1
    dice_b = rand(6) + 1
    debug("dice_a", dice_a)
    debug("dice_b", dice_b)

    if isSwap && (dice_a > dice_b)
      # 大小でスワップするタイプ
      output = dice_a + dice_b * 10
    else
      # 出目そのまま
      output = dice_a * 10 + dice_b
    end

    debug("output", output)

    return output
  end

  ####################        その他ダイス関係      ########################
  def openSecretRoll(channel, mode)
    debug("openSecretRoll begin")
    channel = channel.upcase

    messages = []

    memberKey = getSecretRollMembersHolderKey(channel, mode)
    members = $secretRollMembersHolder[memberKey]

    if members.nil?
      debug("openSecretRoll members is nil. messages", messages)
      return messages
    end

    members.each do |member|
      diceResultKey = getSecretDiceResultHolderKey(channel, mode, member)
      debug("openSecretRoll diceResulyKey", diceResultKey)

      diceResult = $secretDiceResultHolder[diceResultKey]
      debug("openSecretRoll diceResult", diceResult)

      if diceResult
        messages.push(diceResult)
        $secretDiceResultHolder.delete(diceResultKey)
      end
    end

    if mode <= 0 # 記録しておいたデータを削除
      debug("delete recorde data")
      $secretRollMembersHolder.delete(channel)
    end

    debug("openSecretRoll result messages", messages)

    return messages
  end

  def getNick(nick = nil)
    nick ||= @nick_e
    nick = nick.upcase

    /[_\d]*(.+)[_\d]*/ =~ nick
    nick = $1 # Nick端の数字はカウンター変わりに使われることが多いので除去

    return nick
  end

  def addToSecretDiceResult(diceResult, channel, mode)
    nick = getNick()
    channel = channel.upcase

    # まずはチャンネルごとの管理リストに追加
    addToSecretRollMembersHolder(channel, mode)

    # 次にダイスの出力結果を保存
    saveSecretDiceResult(diceResult, channel, mode)

    @isMessagePrinted = true
  end

  def addToSecretRollMembersHolder(channel, mode)
    key = getSecretRollMembersHolderKey(channel, mode)

    $secretRollMembersHolder[key] ||= []
    members = $secretRollMembersHolder[key]

    nick = getNick()

    unless members.include?(nick)
      members.push(nick)
    end
  end

  def getSecretRollMembersHolderKey(channel, mode)
    "#{mode},#{channel}"
  end

  def saveSecretDiceResult(diceResult, channel, mode)
    nick = getNick()

    if mode != 0
      diceResult = "#{nick}: #{diceResult}" # プロットにNickを追加
    end

    key = getSecretDiceResultHolderKey(channel, mode, nick)
    $secretDiceResultHolder[key] = diceResult # 複数チャンネルも一応想定

    debug("key", key)
    debug("secretDiceResultHolder", $secretDiceResultHolder)
  end

  def getSecretDiceResultHolderKey(channel, mode, nick)
    key = "#{mode},#{channel},#{nick}"
    return key
  end

  def setPrintPlotChannel
    nick = getNick()
    $plotPrintChannels[nick] = @channel
  end

  #==========================================================================
  # **                            その他の機能
  #==========================================================================
  def choice_random(string)
    output = "1"

    unless /(^|\s)((S)?choice\[([^,]+(,[^,]+)+)\])($|\s)/i =~ string
      return output
    end

    string = $2
    targetList = $4

    unless targetList
      return output
    end

    targets = targetList.split(/,/)
    index = rand(targets.length)
    target = targets[ index ]
    output = "#{@nick_e}: (#{string}) ＞ #{target}"

    return output
  end

  #==========================================================================
  # **                            結果判定関連
  #==========================================================================
  def getMarshaledSignOfInequality(text)
    return "" if text.nil?

    return marshalSignOfInequality(text)
  end

  def marshalSignOfInequality(signOfInequality) # 不等号の整列
    case signOfInequality
    when /(<=|=<)/
      return "<="
    when /(>=|=>)/
      return ">="
    when /(<>)/
      return "<>"
    when /[<]+/
      return "<"
    when /[>]+/
      return ">"
    when /[=]+/
      return "="
    end

    return signOfInequality
  end

  def check_hit(dice_now, signOfInequality, diff) # 成功数判定用
    suc = 0

    if  diff.is_a?(String)
      unless /\d/ =~ diff
        return suc
      end

      diff = diff.to_i
    end

    case signOfInequality
    when /(<=|=<)/
      if dice_now <= diff
        suc += 1
      end
    when /(>=|=>)/
      if dice_now >= diff
        suc += 1
      end
    when /(<>)/
      if dice_now != diff
        suc += 1
      end
    when /[<]+/
      if dice_now < diff
        suc += 1
      end
    when /[>]+/
      if dice_now > diff
        suc += 1
      end
    when /[=]+/
      if dice_now == diff
        suc += 1
      end
    end

    return suc
  end

  ####################       ゲーム別成功度判定      ########################
  def check_suc(*check_param)
    total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max = *check_param

    debug('check params : total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max',
          total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)

    return "" unless /((\+|\-)?[\d]+)[)]?$/ =~ total_n.to_s

    total_n = $1.to_i
    diff = diff.to_i

    check_paramNew = [total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max]

    text = getSuccessText(*check_paramNew)
    text ||= ""

    if text.empty?
      if signOfInequality != ""
        debug('どれでもないけど判定するとき')
        return check_nDx(*check_param)
      end
    end

    return text
  end

  def getSuccessText(*check_param)
    debug('getSuccessText begin')

    total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max = *check_param

    debug("dice_max, dice_cnt", dice_max, dice_cnt)

    if (dice_max == 100) && (dice_cnt == 1)
      debug('1D100判定')
      return @diceBot.check_1D100(*check_param)
    end

    if (dice_max == 20) && (dice_cnt == 1)
      debug('1d20判定')
      return @diceBot.check_1D20(*check_param)
    end

    if dice_max == 10
      debug('d10ベース判定')
      return @diceBot.check_nD10(*check_param)
    end

    if dice_max == 6
      if dice_cnt == 2
        debug('2d6判定')
        result = @diceBot.check_2D6(*check_param)
        return result unless result.empty?
      end

      debug('xD6判定')
      return @diceBot.check_nD6(*check_param)
    end

    return ""
  end

  def check_nDx(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max) # ゲーム別成功度判定(ダイスごちゃ混ぜ系)
    debug('check_nDx begin diff', diff)
    success = check_hit(total_n, signOfInequality, diff)
    debug('check_nDx success', success)

    if success >= 1
      return " ＞ 成功"
    end

    return " ＞ 失敗"
  end

  ###########################################################################
  # **                              出力関連
  ###########################################################################

  def broadmsg(output, nick)
    debug("broadmsg output, nick", output, nick)
    debug("@nick_e", @nick_e)

    if output == "1"
      return
    end

    if  nick == @nick_e
      sendMessageToOnlySender(output) # encode($ircCode, output))
    else
      sendMessage(nick, output)
    end
  end

  def sendMessage(to, message)
    debug("sendMessage to, message", to, message)
    @ircClient.sendMessage(to, message)
    @isMessagePrinted = true
  end

  def sendMessageToOnlySender(message)
    debug("sendMessageToOnlySender message", message)
    debug("@nick_e", @nick_e)
    @ircClient.sendMessageToOnlySender(@nick_e, message)
    @isMessagePrinted = true
  end

  def sendMessageToChannels(message)
    @ircClient.sendMessageToChannels(message)
    @isMessagePrinted = true
  end

  ####################         テキスト前処理        ########################
  def parren_killer(string)
    debug("parren_killer input", string)

    while /^(.*?)\[(\d+[Dd]\d+)\](.*)/ =~ string
      str_before = ""
      str_after = ""
      dice_cmd = $2
      str_before = $1 if $1
      str_after = $3 if $3
      rolled, dmy = rollDiceAddingUp(dice_cmd)
      string = "#{str_before}#{rolled}#{str_after}"
    end

    string = changeRangeTextToNumberText(string)

    round_type = @diceBot.fractionType.to_sym
    string = string.gsub(/\([\d\/\+\*\-\(\)]+\)/) do |expr|
      ArithmeticEvaluator.new.eval(expr, round_type)
    end

    debug("diceBot.changeText(string) begin", string)
    string = @diceBot.changeText(string)
    debug("diceBot.changeText(string) end", string)

    string = string.gsub(/([\d]+[dD])([^\d\w]|$)/) { "#{$1}6#{$2}" }

    debug("parren_killer output", string)

    return string
  end

  def rollDiceAddingUp(*arg)
    dice = AddDice.new(self, @diceBot)
    dice.rollDiceAddingUp(*arg)
  end

  # [1...4]D[2...7] -> 2D7 のように[n...m]をランダムな数値へ変換
  def changeRangeTextToNumberText(string)
    debug('[st...ed] before string', string)

    while /^(.*?)\[(\d+)[.]{3}(\d+)\](.*)/ =~ string
      beforeText = $1
      beforeText ||= ""

      rangeBegin = $2.to_i
      rangeEnd = $3.to_i

      afterText = $4
      afterText ||= ""

      if rangeBegin < rangeEnd
        range = (rangeEnd - rangeBegin + 1)
        debug('range', range)

        rolledNumber, = roll(1, range)
        resultNumber = rangeBegin - 1 + rolledNumber
        string = "#{beforeText}#{resultNumber}#{afterText}"
      end
    end

    debug('[st...ed] after string', string)

    return string
  end

  # 指定したタイトルのゲームを設定する
  # @param [String] gameTitle ゲームタイトル
  # @return [String] ゲームを設定したことを示すメッセージ
  def setGameByTitle(gameTitle)
    debug('setGameByTitle gameTitle', gameTitle)

    @cardTrader.initValues

    loader = DiceBotLoaderList.find(gameTitle)
    diceBot =
      if loader
        loader.loadDiceBot
      else
        DiceBotLoader.loadUnknownGame(gameTitle) || DiceBot.new
      end

    setDiceBot(diceBot)
    diceBot.postSet

    message = "Game設定を#{diceBot.gameName}に設定しました"
    debug('setGameByTitle message', message)

    return message
  end

  def setIrcMode(mode)
    @isIrcMode = mode
  end

  def sleepForIrc(second)
    if @isIrcMode
      sleep(second)
    end
  end
end
