require "utils/ArithmeticEvaluator"
require "utils/normalize"
require "utils/modifier_formatter"

class CommandParser < ArithmeticEvaluator
  def initialize(*literals)
    @literals = literals
    @round_type = :omit
  end

  # @!attribute [rw] command
  #   @return [String]
  # @!attribute [rw] critical
  #   @return [Integer, nil]
  # @!attribute [rw] fumble
  #   @return [Integer, nil]
  # @!attribute [rw] dollar
  #   @return [Integer, nil]
  # @!attribute [rw] modify_number
  #   @return [Integer]
  # @!attribute [rw] cmp_op
  #   @return [Symbol, nil]
  # @!attribute [rw] target_number
  #   @return [Integer, nil]
  class Parsed
    attr_accessor :command, :critical, :fumble, :dollar, :modify_number, :cmp_op, :target_number

    include ModifierFormatter

    def initialize
      @critical = nil
      @fumble = nil
      @dollar = nil
    end

    def to_s(suffix_position = :after_command)
      c = @critical ? "@#{@critical}" : nil
      f = @fumble ? "##{@fumble}" : nil
      d = @dollar ? "$#{@dollar}" : nil
      m = format_modifier(@modify_number)

      case suffix_position
      when :after_command
        [@command, c, f, d, m, @cmp_op, @target_number].join()
      when :after_modify_number
        [@command, m, c, f, d, @cmp_op, @target_number].join()
      when :after_target_number
        [@command, m, @cmp_op, @target_number, c, f, d].join()
      end
    end
  end

  # @param expr [String]
  # @param rount_type [Symbol]
  # @return [CommandParser::Parsed]
  # @return [nil]
  def parse(expr, round_type = :omit)
    @tokens = tokenize(expr)
    @idx = 0
    @error = false
    @round_type = round_type

    @parsed = Parsed.new()

    lhs()
    if @error
      return nil
    end

    @parsed.cmp_op = take_cmp_op()
    @parsed.target_number = @parsed.cmp_op ? expr() : nil

    if @idx < @tokens.size || @error
      return nil
    end

    return @parsed
  end

  private

  # @return [Array<String>]
  def tokenize(expr)
    expr.gsub(%r{[\(\)\+\-*/@#\$]|[<>!=]+}) { |e| " #{e} " }.split(' ')
  end

  def lhs
    command = take()
    unless literal?(command)
      @error = true
      return
    end

    command_suffix()

    ret = 0
    loop do
      if consume("+")
        ret += mul()
      elsif consume("-")
        ret -= mul()
      else
        break
      end
    end

    command_suffix()

    @parsed.command = command
    @parsed.modify_number = ret
  end

  def command_suffix
    loop do
      if consume("@")
        if @parsed.critical
          @error = true
        end
        @parsed.critical = unary()
      elsif consume("#")
        if @parsed.fumble
          @error = true
        end
        @parsed.fumble = unary()
      elsif consume("$")
        if @parsed.dollar
          @error = true
        end
        @parsed.dollar = unary()
      else
        break
      end
    end
  end

  def literal?(command)
    @literals.each do |lit|
      case lit
      when String
        return true if command == lit
      when Regexp
        return true if command =~ lit
      end
    end

    return false
  end

  def take
    ret = @tokens[@idx]
    @idx += 1

    return ret
  end

  def take_cmp_op
    Normalize.comparison_operator(take())
  end
end
