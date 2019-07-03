#!/perl/bin/ruby -Ku
# -*- coding: utf-8 -*-

require 'kconv'
require 'fileutils'
require 'configBcDice.rb'

# extratables ディレクトリに置かれたテーブル定義ファイルを読み込む。
# 詳細はREADME.txtの「７．オリジナルの表追加」を参照。
# 
# 定義ファイルの内容を @tableData として保持する。
# この @tableData は
# 
# @tableData : {
#   コマンド : {
#          "fileName" : (表ファイル名),
#          "title" : (表タイトル),
#          "command" : (コマンド文字),
#          "gameType" : (ゲーム種別),
#          "dice" : (ダイス文字),
#          "table" : {
#            (数値) : (テキスト),
#            (数値) : (テキスト),
#            (数値) : (テキスト),
#          }
#   }
# }
# 
# というデータフォーマットとなる。


class TableFileData
  
  @@virtualTableData = Hash.new

  def initialize(isLoadCommonTable = true)
    @dirs = []
    @tableData = Hash.new
    
    return unless( isLoadCommonTable )
    
    #TKfix
    #@dir = FileTest.directory?('./extratables') ? './extratables' : '../extratables'
    @dir = './'
    @tableData = searchTableFileDefine(@dir)
    @tableData = @@virtualTableData;
  end

  def self.setVirtualTableData(hash, gameType, command, lines)
    @@virtualTableData[hash] = {
      "fileName" => "#{hash}.txt",
      "gameType" => gameType,
      "command" => command,
      "lines" => lines,
    }
  end
  
  def setDir(dir, prefix = '')
    return if( @dirs.include?(dir) )
    @dirs << dir
    
    tableData = searchTableFileDefine(dir, prefix)
    @tableData.merge!( tableData )
  end
  
  def searchTableFileDefine(dir, prefix = '')
    tableData = Hash.new
    
    return tableData if( dir.nil? )
    return tableData if( not File.exist?(dir) )
    return tableData if( not File.directory?(dir) )
    
    fileNames = Dir.glob("#{dir}/#{prefix}*.txt")
    
    fileNames.each do |fileName|
      fileName = fileName.untaint
      
      info = readGameCommandInfo(fileName, prefix)
      gameType = info["gameType"]
      gameType ||= ""
      command = info["command"]
      next if(command.empty?)
      
      tableData["#{gameType}_#{command}"] = info
    end
    
    return tableData
  end
  
  
  def readGameCommandInfo(fileName, prefix)
    info = {
      "fileName" => fileName,
      "gameType" => '',
      "command" => '',
    }
    
    baseName = File.basename(fileName, '.txt')
    
    case baseName
    when /^#{prefix}(.+)_(.+)_(.+)$/
      info["command"] = $3
      info["gameType"] = $1 + ":" + $2
    when /^#{prefix}(.+)_(.+)$/
      info["command"] = $2
      info["gameType"] = $1
    when /^#{prefix}(.+)$/
      info["command"] = $1
      info["gameType"] = ''
    end
    
    return info
  end
  
  
  def getAllTableInfo
    result = []
    
    @tableData.each do |key, oneTableData|
      tableData = readOneTableData(oneTableData)
      result << tableData
    end
    
    return result
  end
  
  def getGameCommandInfos
    commandInfos = []
    
    @tableData.each do |command, info|
      commandInfo = {
        "gameType" => info["gameType"],
        "command" => info["command"],
      }
      
      commandInfos << commandInfo
    end
    
    return commandInfos
  end
  
  
  def getTableDataFromFile(fileName)
     table = []
    #lines = File.read(fileName).toutf8.lines.map(&:chomp) #TK

    # TKFix File.readの代替処理実装↓
    lines = []
    if (/(.+)\.txt$/ =~ fileName)
      data = @tableData[$1]
      unless(data.nil?)
        lines = data["lines"].split("\n")
      end
    end
    # TKFix File.readの代替処理実装↑

    defineLine = lines.shift
    dice, title = getDiceAndTitle(defineLine)
    
    lines.each do |line|
      key, value = getLineKeyValue(line)
      next if( key.empty? )
      
      key = key.to_i
      table << [key, value]
    end
    
    return dice, title, table
  end
  
  def getLineKeyValue(line)
    self.class.getLineKeyValue(line)
  end
  
  def self.getLineKeyValue(line)
    #line = line.toutf8.chomp #TK
    
    unless(/^[\s　]*([^:：]+)[\s　]*[:：][\s　]*(.+)/ === line)
      return '', ''
    end
    
    key = $1
    value = $2
    
    return key, value
  end
      
  
  def getDiceAndTitle(line)
    dice, title = getLineKeyValue(line)
    
    return dice, title
  end
  
  
  def getTableData(arg, targetGameType)
    oneTableData = Hash.new
    isSecret = false
    
    @tableData.keys.each do |fileName|
      next unless(/.*_(.+)/ === fileName)
      key = $1
     
      #Tkfix 正規表現オプション
      #next unless(/^(s|S)?#{key}(\s|$)/i === arg)
      pattern = "^(s|S)?#{key}(\\s|$)"
      next unless(Regexp.new(pattern, Regexp::IGNORECASE) === arg)
      
      #TKfix メソッドをまたぐと$xの中身がnilになっている
      reg1 = $1

      data = @tableData[fileName]
      gameType = data["gameType"]
      
      next unless( isTargetGameType(gameType, targetGameType) )
      
      oneTableData = data
      isSecret = (not reg1.nil?) #isSecret = (not $1.nil?)
      break
    end
    
    readOneTableData(oneTableData)
    
    dice  = oneTableData["dice"]
    title = oneTableData["title"]
    table = oneTableData["table"]
    
    table = changeEnterCode(table)
    
    return dice, title, table, isSecret
  end
  
  def changeEnterCode(table)
    newTable = {}
    if( table.nil? )
        return newTable
    end
    table.each do |key, value|
      value = value.gsub(/\\n/, "\n")
      value = value.gsub(/\\\n/, "\\n")
      newTable[key] = value
    end
    
    return newTable
  end
  
  
  def isTargetGameType(gameType, targetGameType)
    return true if( gameType.empty? )
    return ( gameType == targetGameType )
  end
  
  
  def readOneTableData(oneTableData)
    return if( oneTableData.nil? )
    return unless( oneTableData["table"].nil? )
    
    command = oneTableData["command"]
    gameType = oneTableData["gameType"]
    fileName = oneTableData["fileName"]
    
    return if( command.nil? )
    
    # return if( not File.exist?(fileName) ) #TK Fileは無効
    
    dice, title, table  = getTableDataFromFile(fileName)
    
    oneTableData["dice"] = dice
    oneTableData["title"] = title
    oneTableData["table"] = table
    
    return oneTableData
  end
  
end



class TableFileCreator
  def initialize(dir, prefix, params)
    @dir = dir
    @prefix = prefix
    @params = params
    #TKfix
    #@logger = DodontoF::Logger.instance
  end
  
  def execute
    fileName = getTableFileName()
    checkFile(fileName)
    
    text = getTableText()
    
    createFile(fileName, text)
  end
  
  def checkFile(fileName)
    checkFileNotExist(fileName)
  end
  
  def checkFileNotExist(fileName)
    raise "commandNameAlreadyExist" if( File.exist?(fileName) )
  end
  
  def checkFileExist(fileName)
    raise "commandNameIsNotExist" unless( File.exist?(fileName) )
  end
  
  
  def getTableFileName(command = nil, gameType = nil)
    
    gameType = @params['gameType'] if( gameType.nil? )
    gameType ||= ''
    gameType = gameType.gsub(':', '_')
    
    if( command.nil? )
      initCommand
      command = @command
    end
    
    checkCommand(command)
    
    
    prefix2 = ""
    unless( gameType.empty? )
      prefix2 = "#{gameType}_"
    end
    
    fileName =  "#{@dir}/#{@prefix}#{prefix2}#{command}.txt"
    fileName.untaint
    
    return fileName
  end

  def initCommand
    @command = @params['command']
    @command ||= ''
    #TKfix !
    @command = @command.gsub(/\./, '_')
    @command.untaint
  end
  
  def checkCommand(command)
    raise "commandNameIsEmpty" if( command.empty? )
    
    unless( /^[a-zA-Z\d]+$/ === command )
      raise "commandNameCanUseOnlyAlphabetAndNumber"
    end
  end
  
  def getTableText()
    dice = @params['dice']
    title = @params['title']
    table = @params['table']
    
    text = ""
    #TKfix <<
    text = text + "#{dice}:#{title}\n"
    if( ! table.kind_of?(String) )
      table = getFormatedTableText(table)
    end
    #TKfix <<
    text = text + table
  end
  
  def getFormatedTableText(table)
    result = ""
    
    table.each_with_index do |line, index|
      key, value = TableFileData.getLineKeyValue(line)
      
      key.tr!('　', '')
      key.tr!(' ', '')
      key.tr!('０-９', '0-9')
      key = checkTableKey(key, index)
      #TKfix <<
      result = result + "#{key}:#{value}\n".toutf8
    end
    
    return result
  end
  
  def checkTableKey(key, index)
    return if( key == "0" )
    
    keyValue = key.to_i
    
    if( keyValue == 0 )
      raise "tableFormatIsInvalid\t#{index + 1}\t#{key}"
    end
    
    return keyValue
  end
  
  def createFile(fileName, text)
    open(fileName, "w+") do |file|
      file.write(text)
    end
  end
  
end



class TableFileEditer < TableFileCreator
  
  def checkFile(fileName)
    @originalCommand = @params['originalCommand']
    
    @gameType = @params['gameType']
    @originalGameType = @params['originalGameType']
    
    if( (@originalCommand == @command) and (@originalGameType == @gameType) )
      checkFileWhenFileNameNotChanged(fileName)
    else
      checkFileWhenFileNameChanged(fileName)
    end
  end
  
  
  def checkFileWhenFileNameNotChanged(fileName)
    checkFileExist(fileName)
  end
  
  
  def checkFileWhenFileNameChanged(fileName)
    
    originalCommand = @originalCommand
    originalCommand ||= @command
    originalGameType = @originalGameType
    originalGameType ||= @gameType
    
    originalFileName = getTableFileName(originalCommand, originalGameType)
    
    checkFileExist(originalFileName)
    checkFileNotExist(fileName)
    
    begin
      FileUtils.mv(originalFileName, fileName)
    rescue => e
      raise "changeCommandNameFaild"
    end
  end
  
  
end

