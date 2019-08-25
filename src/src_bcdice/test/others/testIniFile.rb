# -*- coding: utf-8 -*-

$:.push(File.dirname(__FILE__) + "/..")

require 'test/unit'
require 'log'
require 'IniFile.rb'

class TestIniFile < Test::Unit::TestCase
  def setup
    $isDebug = false
    @testIniFileName = 'test.ini'

    deleteIniFile
  end

  def teardown
    deleteIniFile
  end

  def deleteIniFile
    if File.exist?(@testIniFileName)
      File.delete(@testIniFileName)
    end
  end

  def trace
    $isDebug = true
  end

  def test_readWrite
    ini = IniFile.new(@testIniFileName)

    value = ini.read('section', 'key', 'value')
    assert_equal(value, 'value')

    ini.write('section', 'key', 'mokeke')

    value = ini.read('section', 'key', 'ffffff')
    assert_equal(value, 'mokeke')
  end

  def test_readWriteJapanease
    ini = IniFile.new(@testIniFileName)

    value = ini.readAndWrite('サーバーもけけ村', 'server', 'irc.trpg.net')
    assert_equal('irc.trpg.net', value)

    value = ini.read('サーバーもけけ村', 'server', 'mokeke')
    assert_equal('irc.trpg.net', value)
  end
end
