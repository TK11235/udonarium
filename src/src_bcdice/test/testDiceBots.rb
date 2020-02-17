if RUBY_VERSION < '1.9'
  $KCODE = 'u'
end

require 'DiceBotTest'
result = DiceBotTest.new(nil, nil).execute
abort unless result
