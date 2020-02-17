# -*- coding: utf-8 -*-

class IniFile
  def initialize(fileName)
    @fileName = fileName
    getInfos
  end

  def getInfos
    @infos = {}

    lines = []

    if File.exist?(@fileName)
      lines = File.readlines(@fileName)
    end

    section = nil
    lines.each do |line|
      case line
      when /^;/
        next
      when /^\[(.+)\]/
        section = Regexp.last_match(1)
      when /^([^=]*)=(.*)/
        next if section.nil?

        key = Regexp.last_match(1)
        value = Regexp.last_match(2)
        @infos[section] ||= {}
        @infos[section][key] = value
      end
    end
  end

  def getSectionNames
    @infos.keys.sort
  end

  def readAndWrite(section, key, defaultValue)
    value = read(section, key)
    return value unless value.nil?

    write(section, key, defaultValue)

    value = read(section, key)
    return value
  end

  def read(section, key, defaultValue = nil)
    info = @infos[section]
    if info.nil?
      return defaultValue
    end

    value = info[key]
    if value.nil?
      return defaultValue
    end

    return value
  end

  def write(section, key, value)
    @infos[section] ||= {}
    @infos[section][key] = value

    writeToFile
    getInfos
  end

  def writeToFile
    text = getWriteInfoText
    File.open(@fileName, "w+") do |file|
      file.write(text)
    end
  end

  def getWriteInfoText
    text = ''

    text << "#--*-coding:utf-8-*--\n\n"

    @infos.keys.sort.each do |section|
      text << "[#{section}]\n"

      info = @infos[section]
      info.keys.sort.each do |key|
        value = info[key]

        text << "#{key}=#{value}\n"
      end

      text << "\n"
    end

    return text
  end

  def deleteSection(section)
    @infos.delete(section)

    writeToFile
    getInfos
  end
end
