#!/bin/ruby -Ku
# -*- coding: utf-8 -*-

require 'log'
require 'configBcDice.rb'

class CountHolder
  def initialize(bcdice, countInfos)
    @bcdice = bcdice
    @countInfos = countInfos
    #=> @countInfos は
    # {:channelName => {:characterName => (カウンター情報) }
    # という形式でデータを保持します。
  end

  def executeCommand(command, nick, channel, pointerMode)
    debug("point_counter_command begin(command, nick, channel, pointerMode)", command, nick, channel, pointerMode)

    @command = command
    @nick = @bcdice.getNick(nick)
    @channel = channel
    @pointerMode = pointerMode

    output = "1"
    isSecret = (pointerMode == :sameNick)

    case @command
    when /^#OPEN!/i
      output = get_point_list()
    when /^#(.*)DIED!/i
      output = delete_point_list()
      unless output.nil?
        output = "#{nick}: #{output} のカウンタが削除されました"
        isSecret = true # 出力は常にTalk側
      end
    when /^#RENAME!/i
      output = rename_point_counter()
      if output != "1"
        output = "#{nick}: #{output}"
        isSecret = false # 出力は常にPublic側
      end

    else
      if /^#/ =~ @command
        output = executeSetCommand()
        if output != "1"
          output = "#{nick}: #{output}"
        end
      end
    end

    debug("point_counter_command END output, isSecret", output, isSecret)

    return output, isSecret
  end

  #=========================================================================
  # **                       汎用ポイントカウンタ
  #=========================================================================

  ####################          カウンタ操作         ########################
  def executeSetCommand
    debug("setCountHolder nick, channel, pointerMode", @nick, @channel, @pointerMode)

    @characterName = @nick

    @tagName = nil
    @currentValue = nil
    @maxValue = nil
    @modifyText = nil

    debug("$point_counter", $point_counter)

    debug("@command", @command)

    case @command
    when %r{^#([^:：]+)(:|：)(\w+?)\s*(\d+)(/(\d+))?}
      debug(" #(識別名):(タグ)(現在値)/(最大値) で指定します。最大値がないものは省略できます。")
      # #Zako1:HP9/9　　　#orc1:HP10/10　　#商人:HP8/8
      @characterName = Regexp.last_match(1)
      @tagName = Regexp.last_match(3)
      @currentValue = Regexp.last_match(4).to_i
      @maxValue = Regexp.last_match(6)
    when /^#([^:：]+)(:|：)(\w+?)\s*([\+\-]\d+)/
      debug(" #(識別名):(タグ)(変更量)")
      # #Zako1:HP-1
      @characterName = Regexp.last_match(1)
      @tagName = Regexp.last_match(3)
      @modifyText = Regexp.last_match(4)
    when %r{^#(\w+?)\s*(\d+)/(\d+)}
      debug(" #(タグ)(現在値)/(最大値) 現在値/最大値指定は半角のみ。")
      # #HP12/12　　　#衝動0/10
      @tagName = Regexp.last_match(1)
      @currentValue = Regexp.last_match(2).to_i
      @maxValue = Regexp.last_match(3)
    when /^#(\w+?)\s*([\+\-]\d+)/
      debug(" #(タグ)(変更量)")
      # #HP-1
      # #DEX-1
      @tagName = Regexp.last_match(1)
      @modifyText = Regexp.last_match(2)
    when /^#(\w+?)\s*(\d+)/
      debug(" #(タグ)(現在値) で指定します。現在値は半角です。")
      # #DEX12　　　#浸食率0
      @tagName = Regexp.last_match(1)
      @currentValue = Regexp.last_match(2).to_i
    else
      debug("not match command", @command)
      return ''
    end

    unless @maxValue.nil?
      @maxValue = @maxValue.to_i
    end

    debug("characterName", @characterName)
    debug("tagName", @tagName)
    debug("@currentValue", @currentValue)
    debug("@maxValue", @maxValue)
    debug("@modifyText", @modifyText)

    return setCountHolderByParams
  end

  def setCountHolderByParams
    debug("@modifyText", @modifyText)
    if @modifyText.nil?
      return setCount
    else
      return changeCount
    end
  end

  def setCount
    @countInfos[@channel] ||= {}
    characterInfoList = getCharacterInfoList
    characterInfoList[@characterName] ||= {}
    characterInfo = characterInfoList[@characterName]

    characterInfo[@tagName] = {
      :currentValue => @currentValue,
      :maxValue => @maxValue,
    }

    debug('setCount @nick, @characterName', @nick, @characterName)

    output = ""
    output += @characterName.downcase.to_s if @nick != @characterName
    output += "(#{@tagName}) #{@currentValue}"

    debug("setCount @maxValue", @maxValue)
    unless @maxValue.nil?
      output += "/#{@maxValue}"
    end

    return output
  end

  def changeCount
    debug("changeCount begin")

    modifyValue = @bcdice.parren_killer("(0#{@modifyText})").to_i
    characterInfo = getCharacterInfo(@channel, @characterName)

    info = characterInfo[@tagName]
    debug("characterInfo", characterInfo)
    debug("info", info)
    return "" if  info.nil?

    currentValue = info[:currentValue]
    maxValue = info[:maxValue]

    preText = getValueText(currentValue, maxValue)

    debug("currentValue", currentValue)
    debug("modifyValue", modifyValue)
    currentValue += modifyValue
    info[:currentValue] = currentValue

    nowText = getValueText(currentValue, maxValue)

    output = ""
    output += @characterName.downcase.to_s if @nick != @characterName
    output += "(#{@tagName}) #{preText} -> #{nowText}"

    debug("changeCount end output", output)

    return output
  end

  def getValueText(currentValue, maxValue)
    text = currentValue.to_s
    text += "/#{maxValue}" unless maxValue.nil?

    return text
  end

  def getCharacterInfoList(channel = nil)
    channel ||= @channel

    @countInfos[channel] ||= {}
    characterInfoList = @countInfos[channel]

    return characterInfoList
  end

  def getCharacterInfo(channel, characterName)
    characterName ||= @characterName

    characterInfoList = getCharacterInfoList(channel)

    characterInfoList[characterName] ||= {}
    characterInfo = characterInfoList[characterName]

    return characterInfo
  end

  ####################          カウンタ一覧         ########################
  def get_point_list
    debug("get_point_list(command, nick, channel, pointerMode)", @command, @nick, @channel, @pointerMode)

    output = "1"

    return output unless /^#OPEN![\s]*(\w*)(\s|$)/ =~ @command

    tag = Regexp.last_match(1)
    case @pointerMode
    when :sameNick
      debug("same nick")
      pc_out = getPointListAtSameNick(tag)
      output = pc_out unless pc_out.empty?
    when :sameChannel
      if tag
        debug("same Channel")
        pc_out = getPointListAtSameChannel(tag)
        output = pc_out unless pc_out.empty?
      end
    end

    return output
  end

  def getPointListAtSameNick(command, nick, channel, pointerMode, tag)
    debug("getPointListAtSameNick(command, nick, channel, pointerMode, tag)", command, nick, channel, pointerMode, tag)
    debug("同一Nick, 自キャラの一覧表示(パラメータ指定不要)")

    pc_list = $point_counter[nick]
    pc_out = ""
    if pc_list
      sort_pc = {}
      pc_list.each do |pc_o|
        next unless $point_counter["#{nick},#{pc_o}"]

        tag_out = ""
        if tag
          check_name = "#{nick},#{pc_o}"
          if $point_counter["#{check_name},#{tag},0"]
            sort_pc[check_name] = $point_counter["#{check_name},#{tag},0"]
          end
          if $point_counter["#{check_name},#{tag},1"]
            sort_pc[check_name] = $point_counter["#{check_name},#{tag},1"]
          end
        else
          tag_arr = $point_counter["#{nick},#{pc_o}"]
          tag_arr.each do |tag_o|
            check_name = "#{nick},#{pc_o},#{tag_o}"
            if $point_counter["#{check_name},0"]
              tag_out += "$tag_o(" + $point_counter["#{check_name},0"] + ") "
            end
            if $point_counter["#{check_name},1"]
              tag_out += "#{tag_o}[" + $point_counter["#{check_name},1"] + "] "
            end
          end
        end
        next unless tag_out

        debug("中身があるなら")
        pc_out += ", " if pc_out
        pc_out += "#{pc_o.downcase}:#{tag_out}"
      end

      if tag
        out_pc = ""
        pc_sorted = sort_point_hash(sort_pc)
        pc_sorted.each do |pc_o|
          pc_name = pc_o.split(/,/)
          out_pc += ", " if out_pc
          if $pc_name[1]
            if $point_counter["#{pc_o},#{tag},0"]
              out_pc += "#{pc_name[1].upcase}(" + $point_counter["#{pc_o},#{tag},0"] + ")"
            end
            if $point_counter["#{pc_o},#{tag},1"]
              out_pc += "#{pc_name[1].upcase}[" + $point_counter["#{pc_o},#{tag},1"] + "]"
            end
          else
            if $point_counter["#{pc_o},#{tag},0"]
              out_pc += "#{pc_name[0].upcase}(" + $point_counter["#{pc_o},#{tag},0"] + ")"
            end
            if $point_counter["#{pc_o},#{tag},1"]
              out_pc += "#{pc_name[0].upcase}[" + $point_counter["#{pc_o},#{tag},1"] + "]"
            end
          end
        end
        pc_out = "#{tag}: #{out_pc}" if out_pc
      end
    else
      if $point_counter["$nick,"]
        tag_arr = $point_counter["$nick,"]
        tag_out = ""
        tag_arr.each do |tag_o|
          check_name = "#{nick},,#{tag_o}"
          if $point_counter["#{check_name},0"]
            tag_out += "#{tag_o}(" + $point_counter["#{check_name},0"] + ") "
          end
          if $point_counter["#{check_name},1"]
            tag_out += "#{tag_o}[" + $point_counter["#{check_name},1"] + "] "
          end
        end
        if tag_out
          debug("中身があるなら")
          pc_out += ", " if pc_out
          pc_out += tag_out.to_s
        end
      end
    end

    return pc_out
  end

  def getPointListAtSameChannel(tagName)
    debug("getPointListAtSameChannel(command, nick, channel, pointerMode, tagName)", @command, @nick, @channel, @pointerMode, tagName)
    debug("同一チャンネル特定タグ(ポイント)の表示")

    output = ""

    output += "#{tagName}:" unless tagName.empty?

    debug("getPointListAtSameChannel @countInfos", @countInfos)
    characterInfoList = getCharacterInfoList

    characterInfoList.keys.sort.each do |characterName|
      characterInfo = characterInfoList[characterName]

      tagText = ''
      characterInfo.keys.sort.each do |currentTag|
        unless tagName.empty?
          next unless  tagName == currentTag
        end

        info = characterInfo[currentTag]
        currentValue = info[:currentValue]
        maxValue = info[:maxValue]

        tagText += currentValue.to_s
        tagText += "/#{maxValue}" unless maxValue.nil?
      end

      unless tagText.empty?
        output += " " unless output.empty?
        output += "#{characterName}(#{tagText})"
      end
    end

    return output
  end

  ####################          識別名の交換         ########################
  def rename_point_counter
    debug("rename_point_counter @command, @nick", @command, @nick)

    output = "1"

    return output unless /^#RENAME!\s*(.+?)\s*\-\>\s*(.+?)(\s|$)/ =~ @command

    oldName = Regexp.last_match(1)
    newName = Regexp.last_match(2)
    debug("oldName, newName", oldName, newName)

    # {:channelName => {:characterName => (カウンター情報) }
    characterInfoList = getCharacterInfoList(@channel)

    counterInfo = characterInfoList.delete(oldName)
    return output if counterInfo.nil?

    characterInfoList[newName] = counterInfo

    output = "#{oldName}->#{newName}"; # 変更メッセージ
    return output
  end

  ####################          その他の処理         ########################

  def setPointCounters(nick, pc, target)
    key = "#{nick},#{pc}"
    setPointCounter(key, pc)

    key = "#{nick},#{pc},#{target}"
    setPointCounter(key, target)
  end

  def setPointCounter(key, data)
    debug("setPointCounter begin key, data", key, data)

    unless $point_counter.include?(key)
      debug("$point_counterにkeyが存在しないので新規作成")
      $point_counter[key] = data
      return
    end

    debug("$point_counterにkeyが存在する場合")

    cnt_list = $point_counter[key]
    unless cnt_list.include?(data)
      cnt_list << data
    end
  end

  # unused?
  def sort_point_hash(base_hash)
    keys = base_hash.keys

    pc_sorted = keys.sort_by do |a, b|
      a_current, a_max = getPointHashCurrentAndMax(a)
      b_current, b_max = getPointHashCurrentAndMax(b)

      # 現在値が小さい方が後ろ、同じ時はダメージが大きい方が後ろ(後方が危険)

      compare = (b_crr <=> a_crr)
      if compare == 0
        compare = (a_max <=> b_max)
        if compare == 0
          compare = (a <=> b)
        end
      end

      compare
    end

    return pc_sorted
  end

  def getPointHashCurrentAndMax(key)
    if %r{(\d+)[/](\d+)} =~ key
      current = Regexp.last_match(1)
      max = Regexp.last_match(2)
      return current, max
    end
    return 0, 0
  end
end
