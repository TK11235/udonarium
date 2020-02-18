#
# 四則演算を評価するクラス
#
class ArithmeticEvaluator
  # 四則演算を評価する
  # @param [String] expr 評価する式
  # @param [Symbol] round_type 端数処理の設定 :omit 切り捨て, :roundUp 切り上げ, :roundOff 四捨五入
  # @return [Integer]
  def eval(expr, round_type = :omit)
    @tokens = tokenize(expr)
    @idx = 0
    @error = false
    @round_type = round_type

    ret = expr()
    if @error
      return 0
    else
      return ret
    end
  end

  private

  def tokenize(expr)
    expr.gsub(%r{[\(\)\+\-\*/]}) { |e| " #{e} " }.split(' ')
  end

  def add
    ret = mul()

    loop do
      if consume("+")
        ret += mul()
      elsif consume("-")
        ret -= mul()
      else
        break
      end
    end

    return ret
  end
  alias expr add

  def mul
    ret = unary()

    loop do
      if consume("*")
        ret *= unary()
      elsif consume("/")
        ret = div(ret, unary())
      else
        break
      end
    end

    return ret
  end

  def div(left, right)
    if right.zero?
      @error = true
      return 0
    end

    case @round_type
    when :roundUp
      return (left.to_f / right).ceil
    when :roundOff
      return (left.to_f / right).round
    else
      return (left / right).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    end
  end

  def unary
    if consume("+")
      unary()
    elsif consume("-")
      -unary()
    else
      term()
    end
  end

  def term
    if consume("(")
      ret = expr()
      expect(")")
      return ret
    else
      return expect_number()
    end
  end

  def consume(str)
    if @tokens[@idx] != str
      return false
    end

    @idx += 1
    return true
  end

  def expect(str)
    if @tokens[@idx] != str
      @error = true
    end

    @idx += 1
  end

  def expect_number()
    unless integer?(@tokens[@idx])
      @error = true
      @idx += 1
      return 0
    end

    ret = @tokens[@idx].to_i
    @idx += 1
    return ret
  end

  def integer?(str)
    # Ruby 1.9 以降では Kernel.#Integer を使うべき
    # Ruby 1.8 にもあるが、基数を指定できない問題がある
    !/^\d+$/.match(str).nil?
  end
end
