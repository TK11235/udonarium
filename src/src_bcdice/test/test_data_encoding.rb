# -*- coding: utf-8 -*-

require 'test/unit'
require 'nkf'

class TestDataEncoding < Test::Unit::TestCase
  data do
    data_set = {}
    pattern = File.join(File.dirname(__FILE__), 'data/*.txt')
    files = Dir.glob(pattern)

    files.each do |f|
      data_set[File.basename(f)] = f
    end

    data_set
  end
  def test_encoding(path)
    str = File.read(path)
    assert_equal(NKF::UTF8, NKF.guess(str), "文字コードはUTF-8にしてください")
    assert_false(str.include?("\r"), "改行コードはLFにしてください")
  end
end
