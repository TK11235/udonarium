module Normalize
  module_function

  # 比較演算子をシンボルに正規化する
  #
  # @param op [String]
  # @return [Symbol, nil]
  def comparison_operator(op)
    case op
    when /<=|=</
      :<=
    when />=|=>/
      :>=
    when /<>|!=|=!/
      :'!='
    when /</
      :<
    when />/
      :>
    when /\=/
      :==
    end
  end

  # 目標値を正規化する
  #
  # @param val [String]
  # @return [Integer, String] 整数か'?'
  def target_number(val)
    if val == '?'
      val
    else
      val.to_i
    end
  end
end
