if RUBY_VERSION > '1.8.x'
  require 'simplecov'

  if ENV['CI'] == 'true' && ENV['CHECK_COVERAGE'] == 'true'
    require 'codecov'
    SimpleCov.formatter = SimpleCov::Formatter::Codecov
  else
    SimpleCov.formatter = SimpleCov::Formatter::SimpleFormatter
  end

  SimpleCov.use_merging true

  SimpleCov.at_exit do
    SimpleCov.command_name "fork-#{$$}"
    SimpleCov.result.format!
  end

  SimpleCov.start
end
