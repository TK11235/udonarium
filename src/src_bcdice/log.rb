# -*- coding: utf-8 -*-

# デバッグ文字列出力（末尾改行なし）
def debugPrint(text)
  print($RUBY18_WIN ? text.tosjis : text)
end

# デバッグ文字列出力（末尾改行あり）
def debugPuts(text)
  line = "#{text}\n"
  puts($RUBY18_WIN ? line.tosjis : line)
end

# デバッグ出力を行う
# @param [Object] target 対象項目
# @param [Object] values 値
def debug(target, *values)
  return unless $isDebug

  targetStr = target.is_a?(String) ? target : target.inspect

  if values.empty?
    debugPuts(targetStr)
  else
    valueStrs = values.map do |value|
      value.is_a?(String) ? %("#{value}") : value.inspect
    end

    debugPuts("#{targetStr}: #{valueStrs.join(', ')}")
  end
end
