module Format
  module_function

  # 比較演算子を文字列表記にする
  #
  # @param op [Symbol]
  # @return [String, nil]
  def comparison_operator(op)
    case op
    when :==
      '='
    when :'!='
      '<>'
    when Symbol
      op.to_s
    end
  end
end
