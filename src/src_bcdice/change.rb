# -*- coding: utf-8 -*-

require 'Kconv'


before = ARGV[0]
after = ARGV[1]

p before, after

#files = Dir.glob("diceBot/*.rb")
files = Dir.glob("**/*.rb")

files.delete_if{|i| i == "change.rb"}

files.each do |fileName|
  text = File.readlines(fileName).join
  
  beforeText = text.clone
  
  text = text.gsub(before, after) #TKfix !
  
  next if( text == beforeText )
  
  p fileName
  File.open(fileName, "w+") {|f| f.write(text)}
end
