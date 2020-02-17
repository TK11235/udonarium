if RUBY_VERSION > '1.8.x'
  require 'simplecov'

  if ENV['CI'] == 'true'
    require 'codecov'
    SimpleCov.formatter = SimpleCov::Formatter::Codecov
  elsif /--enable-frozen-string-literal/.match(ENV['RUBYOPT'])
    SimpleCov.formatter = SimpleCov::Formatter::SimpleFormatter
  end

  SimpleCov.use_merging true

  SimpleCov.at_exit do
    SimpleCov.command_name "fork-#{$$}"
    SimpleCov.result.format!
  end

  SimpleCov.start
end
