#!/bin/ruby -Ku
# -*- coding: utf-8 -*-

require 'rubygems'
require 'wx'
require 'wx/classes/timer.rb'

require 'bcdiceCore.rb'
require 'ArgsAnalizer.rb'
require 'IniFile.rb'
require 'diceBot/DiceBotLoader'

$LOAD_PATH.push(File.dirname(__FILE__) + "/irc")
require 'ircLib.rb'
require 'ircBot.rb'

$isDebug = false

class BCDiceGuiApp < Wx::App
  private

  def on_init
    BCDiceDialog.new.show_modal
    return false
  end
end

$debugText = nil

# デバッグ文字列出力（末尾改行なし）
def debugPrint(text)
  if $debugText
    $debugText.append_text($RUBY18_WIN ? text.tosjis : text)
  end
end

# デバッグ文字列出力（末尾改行あり）
def debugPuts(text)
  if $debugText
    line = "#{text}\n"
    $debugText.append_text($RUBY18_WIN ? text.tosjis : text)
  end
end

class BCDiceDialog < Wx::Dialog
  def initialize
    super(nil, -1, 'B&C Dice')

    @iniFile = IniFile.new($iniFileName)

    analizeArgs

    @allBox = Wx::BoxSizer.new(Wx::VERTICAL)

    initServerSet

    @serverName = createAddedTextInput($server, "サーバ名")
    @portNo = createAddedTextInput($port.to_s, "ポート番号")
    @channel = createAddedTextInput($defaultLoginChannelsText, "ログインチャンネル")
    @nickName = createAddedTextInput($nick, "ニックネーム")
    initGameType
    initCharacterCode
    @extraCardFileText = createAddedTextInput($extraCardFileName, "拡張カードファイル名")

    @executeButton = createButton('接続')
    evt_button(@executeButton.get_id) { |event| on_execute }

    @stopButton = createButton('切断')
    @stopButton.enable(false)
    evt_button(@stopButton.get_id) { |event| on_stop }

    addCtrlOnLine(@executeButton, @stopButton)

    addTestTextBoxs
    # initDebugTextBox

    loadSaveData

    set_sizer(@allBox)
    @allBox.set_size_hints(self)

    argsAnalizer = ArgsAnalizer.new(ARGV)
    argsAnalizer.analize

    @ircBot = nil
    unless  argsAnalizer.isStartIrc
      @ircBot = getInitializedIrcBot()
      setAllGames(@ircBot)
      destroy
    end
  end

  def analizeArgs
    argsAnalizer = ArgsAnalizer.new(ARGV)
    @isAnalized = argsAnalizer.analize
  end

  def initServerSet
    @serverSetChoise = Wx::ComboBox.new(self, -1,
                                        :size => Wx::Size.new(250, 25))

    initServerSetChoiseList

    evt_combobox(@serverSetChoise.get_id) { |event| on_load }

    @saveButton = createButton('この設定で保存')
    evt_button(@saveButton.get_id) { |event| on_save }

    @deleteButton = createButton('この設定を削除')
    evt_button(@deleteButton.get_id) { |event| on_delete }

    addCtrl(@serverSetChoise, "設定", @saveButton, @deleteButton)
  end

  def initServerSetChoiseList
    @serverSetChoise.clear()

    list = loadServerSetNameList

    list.each_with_index do |name, index|
      @serverSetChoise.insert(name, index)
    end
  end

  def loadServerSetNameList
    sectionNames = @iniFile.getSectionNames
    serverSetNameList = []

    sectionNames.each do |name|
      if /#{@@serverSertPrefix}(.+)/ === name
        serverSetNameList << $1
      end
    end

    return serverSetNameList
  end

  def on_load
    serverSet = @serverSetChoise.get_value
    debug('on_load serverSet', serverSet)

    sectionName = getServerSetSectionName(serverSet)

    loadTextValueFromIniFile(sectionName, "serverName", @serverName)
    loadTextValueFromIniFile(sectionName, "portNo", @portNo)
    loadTextValueFromIniFile(sectionName, "channel", @channel)
    loadTextValueFromIniFile(sectionName, "nickName", @nickName)
    loadChoiseValueFromIniFile(sectionName, "gameType", @gameType)
    loadChoiseValueFromIniFile(sectionName, "characterCode", @characterCode)
    loadTextValueFromIniFile(sectionName, "extraCardFileText", @extraCardFileText)

    @iniFile.write("default", "serverSet", serverSet)
  end

  def loadTextValueFromIniFile(section, key, input)
    value = @iniFile.read(section, key)
    return if value.nil?

    input.set_value(value)
  end

  @@serverSertPrefix = "ServerSet_"

  def getServerSetSectionName(serverSet)
    return "#{@@serverSertPrefix}#{serverSet}"
  end

  def loadChoiseValueFromIniFile(section, key, choise)
    value = @iniFile.read(section, key)
    return if value.nil?

    setChoiseText(choise, value)
  end

  def on_save
    debug('on_save begin')
    serverSet = @serverSetChoise.get_value
    debug('on_save serverSet', serverSet)

    sectionName = getServerSetSectionName(serverSet)
    debug('sectionName', sectionName)

    saveTextValueToIniFile(sectionName, "serverName", @serverName.get_value)
    saveTextValueToIniFile(sectionName, "portNo", @portNo.get_value)
    saveTextValueToIniFile(sectionName, "channel", @channel.get_value)
    saveTextValueToIniFile(sectionName, "nickName", @nickName.get_value)
    saveTextValueToIniFile(sectionName, "gameType", @gameType.get_string_selection)
    saveTextValueToIniFile(sectionName, "characterCode", @characterCode.get_string_selection)
    saveTextValueToIniFile(sectionName, "extraCardFileText", @extraCardFileText.get_value)

    initServerSetChoiseList
  end

  def saveTextValueToIniFile(section, key, value)
    @iniFile.write(section, key, value)
  end

  def on_delete
    serverSet = @serverSetChoise.get_value
    sectionName = getServerSetSectionName(serverSet)

    @iniFile.deleteSection(sectionName)

    initServerSetChoiseList
  end

  def createButton(labelText)
    Wx::Button.new(self, -1, labelText)
  end

  def createTextInput(defaultText)
    Wx::TextCtrl.new(self, -1, defaultText)
  end

  def createAddedTextInput(defaultText, labelText, *addCtrls)
    textInput = createTextInput(defaultText)
    addCtrl(textInput, labelText, *addCtrls)
    return textInput
  end

  def createLabel(labelText)
    Wx::StaticText.new(self, -1, labelText)
  end

  def addCtrl(ctrl, labelText = nil, *addCtrls)
    if  labelText.nil?
      @allBox.add(ctrl, 0, Wx::ALL, 2)
      return ctrl
    end

    ctrls = []
    unless  labelText.nil?
      label = createLabel(labelText)
      ctrls << label
    end

    ctrls << ctrl
    ctrls += addCtrls

    line = getLineCtrl(ctrls)

    @allBox.add(line, 0, Wx::ALL, 2)

    return ctrl
  end

  def addCtrlOnLine(*ctrls)
    line = getLineCtrl(ctrls)
    @allBox.add(line, 0, Wx::ALL, 2)
    return line
  end

  def getLineCtrl(ctrls)
    line = Wx::BoxSizer.new(Wx::HORIZONTAL)

    ctrls.each do |ctrl|
      line.add(ctrl, 0, Wx::ALL, 2)
    end

    return line
  end

  def initGameType
    @gameType = Wx::Choice.new(self, -1)
    addCtrl(@gameType, "ゲームタイトル")

    gameTypes = getAllGameTypes.sort
    gameTypes.each_with_index do |type, index|
      @gameType.insert(type, index)
    end

    @gameType.insert("NonTitle", 0)

    setChoiseText(@gameType, $defaultGameType)

    evt_choice(@gameType.get_id) { |event| onChoiseGame }
  end

  def setChoiseText(choise, text)
    index = choise.find_string(text)

    if index == -1
      index = 0
    end

    return choise.set_selection(index)
  end

  def getAllGameTypes
    return $allGameTypes.collect { |i| i.gsub(/_/, ' ') }
  end

  def onChoiseGame
    return if @ircBot.nil?

    @ircBot.setGameByTitle(@gameType.get_string_selection)
  end

  @@characterCodeInfo = {
    'ISO-2022-JP' => Kconv::JIS,
    'EUC-JP'      => Kconv::EUC,
    'Shift_JIS'   => Kconv::SJIS,
    'バイナリ' => Kconv::BINARY,
    'ASCII'       => Kconv::ASCII,
    'UTF-8'       => Kconv::UTF8,
    'UTF-16'      => Kconv::UTF16,
  }

  def initCharacterCode
    @characterCode = Wx::Choice.new(self, -1)
    addCtrl(@characterCode, "IRC文字コード")

    list = @@characterCodeInfo.keys.sort

    list.each_with_index do |type, index|
      @characterCode.insert(type, index)
    end

    found = @@characterCodeInfo.find { |key, value| value == $ircCode }
    unless  found.nil?
      codeText = found.first
      setChoiseText(@characterCode, codeText)
    end

    evt_choice(@characterCode.get_id) { |event| onChoiseCharacterCode }
  end

  def onChoiseCharacterCode
    $ircCode = getSelectedCharacterCode
  end

  def getSelectedCharacterCode
    codeName = @characterCode.get_string_selection
    return @@characterCodeInfo[codeName]
  end

  def addTestTextBoxs
    label = createLabel('動作テスト欄')
    inputSize = Wx::Size.new(250, 25)
    @testInput = Wx::TextCtrl.new(self, -1, "2d6",
                                  :style => Wx::TE_PROCESS_ENTER,
                                  :size => inputSize)

    evt_text_enter(@testInput.get_id) { |event| expressTestInput }
    @testButton = createButton('テスト実施')
    evt_button(@testButton.get_id) { |event| expressTestInput }

    addCtrlOnLine(label, @testInput, @testButton)

    # addOutput
  end

  #
  # def addOutput
  #   size = Wx::Size.new(500, 150)
  #
  #   @outputText = Wx::TextCtrl.new(self, -1, "",
  #                                  :style => Wx::TE_MULTILINE,
  #                                  :size => size)
  #   addCtrl(@outputText)
  # end

  # 以前は結果出力欄の @outputText をここで追加していたが、
  # Ruby1.9 化してから何故か @outputText.append_text で処理が固まるようになったため
  # コンソール出力に変更。
  def printText(message)
    # @outputText.append_text( "#{message}\r\n" )
    print("#{message}\n")
  end

  def expressTestInput
    begin
      onEnterTestInputCatched
    rescue => e
      debug("onEnterTestInput error " + e.to_s)
    end
  end

  def onEnterTestInputCatched
    debug("onEnterTestInput")

    bcdiceMarker = BCDiceMaker.new
    bcdice = bcdiceMarker.newBcDice()
    bcdice.setIrcClient(self)
    bcdice.setGameByTitle(@gameType.get_string_selection)

    arg = @testInput.get_value
    channel = ""
    nick_e = ""
    tnick = ""
    bcdice.setMessage(arg)
    bcdice.setChannel(channel)
    # bcdice.recieveMessage(nick_e, tnick)
    bcdice.recievePublicMessage(nick_e)
  end

  def sendMessage(to, message)
    printText(message)
  end

  def sendMessageToOnlySender(nick_e, message)
    sendMessage(to, message)
  end

  def sendMessageToChannels(message)
    sendMessage(to, message)
  end

  def initDebugTextBox
    size = Wx::Size.new(600, 200)
    $debugText = Wx::TextCtrl.new(self, -1, "",
                                  :style => Wx::TE_MULTILINE,
                                  :size => size)
    addCtrl($debugText)
    $isDebug = true
  end

  def on_execute
    begin
      setConfig
      startIrcBot
      @executeButton.enable(false)
      @stopButton.enable(true)
    rescue => e
      Wx::message_box(e.to_s)
    end
  end

  def setConfig
    $server = @serverName.get_value
    $port = @portNo.get_value.to_i
    $defaultLoginChannelsText = @channel.get_value
    $nick = @nickName.get_value
    $defaultGameType = @gameType.get_string_selection
    $ircCode = getSelectedCharacterCode
    $extraCardFileName = @extraCardFileText.get_value
  end

  def startIrcBot
    @ircBot = getInitializedIrcBot()

    @ircBot.setQuitFuction(Proc.new { destroy })
    @ircBot.setPrintFuction(Proc.new { |message| printText(message) })

    startIrcBotOnThread
    startThreadTimer
  end

  def startIrcBotOnThread
    printText("connect to IRC server.")

    ircThread = Thread.new do
      begin
        p "start!"
        @ircBot.start
      rescue Exception => e
        p "error"
        p e.to_s
      ensure
        @ircBot = nil
      end
    end
  end

  # Rubyスレッドの処理が正常に実行されるように、
  # 定期的にGUI処理をSleepし、スレッド処理権限を譲渡する
  def startThreadTimer
    Wx::Timer.every(100) do
      sleep 0.05
    end
  end

  def close(force = false)
    on_stop
    super
  end

  def on_stop
    return if @ircBot.nil?

    @ircBot.quit

    @executeButton.enable(true)
    @stopButton.enable(false)

    printText("IRC disconnected.")
  end

  def setAllGames(ircBot)
    getAllGameTypes.each do |type|
      @ircBot.setGameByTitle(type)
    end
  end

  def loadSaveData
    serverName = @iniFile.read("default", "serverSet")
    if serverName.nil?
      @serverSetChoise.set_selection(0)
    else
      setChoiseText(@serverSetChoise, serverName)
    end
    on_load
  end
end

def mainBcDiceGui
  BCDiceGuiApp.new.main_loop
end
