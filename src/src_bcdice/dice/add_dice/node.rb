# -*- coding: utf-8 -*-
# frozen_string_literal: true

class AddDice
  # 加算ロールの構文解析木のノードを格納するモジュール
  module Node
    # 加算ロールコマンドのノード。
    #
    # 目標値が設定されていない場合は +lhs+ のみを使用する。
    # 目標値が設定されている場合は、+lhs+、+cmp_op+、+rhs+ を使用する。
    class Command
      # 左辺のノード
      # @return [Object]
      attr_reader :lhs
      # 比較演算子
      # @return [Symbol]
      attr_reader :cmp_op
      # 右辺のノード
      # @return [Integer, String]
      attr_reader :rhs

      # ノードを初期化する
      # @param [Object] lhs 左辺のノード
      # @param [Symbol] cmp_op 比較演算子
      # @param [Integer, String] rhs 右辺のノード
      def initialize(lhs, cmp_op, rhs)
        @lhs = lhs
        @cmp_op = cmp_op
        @rhs = rhs
      end

      # 文字列に変換する
      # @return [String]
      def to_s
        @lhs.to_s + cmp_op_text + @rhs.to_s
      end

      # ノードのS式を返す
      # @return [String]
      def s_exp
        if @cmp_op
          "(Command (#{@cmp_op} #{@lhs.s_exp} #{@rhs}))"
        else
          "(Command #{@lhs.s_exp})"
        end
      end

      private

      # メッセージ中で比較演算子をどのように表示するかを返す
      # @return [String]
      def cmp_op_text
        case @cmp_op
        when :'!='
          '<>'
        when :==
          '='
        else
          @cmp_op.to_s
        end
      end
    end

    # 二項演算子のノード
    class BinaryOp
      # ノードを初期化する
      # @param [Object] lhs 左のオペランドのノード
      # @param [Symbol] op 演算子
      # @param [Object] rhs 右のオペランドのノード
      def initialize(lhs, op, rhs)
        @lhs = lhs
        @op = op
        @rhs = rhs
      end

      # ノードを評価する
      #
      # 左右のオペランドをそれぞれ再帰的に評価した後で、演算を行う。
      #
      # @param [Randomizer] randomizer ランダマイザ
      # @return [Integer] 評価結果
      def eval(randomizer)
        lhs = @lhs.eval(randomizer)
        rhs = @rhs.eval(randomizer)

        return calc(lhs, rhs)
      end

      # 文字列に変換する
      # @return [String]
      def to_s
        "#{@lhs}#{@op}#{@rhs}"
      end

      # メッセージへの出力を返す
      # @return [String]
      def output
        "#{@lhs.output}#{@op}#{@rhs.output}"
      end

      # ノードのS式を返す
      # @return [String]
      def s_exp
        "(#{op_for_s_exp} #{@lhs.s_exp} #{@rhs.s_exp})"
      end

      private

      # 演算を行う
      # @param [Integer] lhs 左のオペランド
      # @param [Integer] rhs 右のオペランド
      # @return [Integer] 演算の結果
      def calc(lhs, rhs)
        lhs.send(@op, rhs)
      end

      # S式で使う演算子の表現を返す
      # @return [String]
      def op_for_s_exp
        @op
      end
    end

    # 除算ノードの基底クラス
    #
    # 定数 +ROUNDING_METHOD+ で端数処理方法を示す記号
    # ( +'U'+, +'R'+, +''+ ) を定義すること。
    # また、除算および端数処理を行う +divide_and_round+ メソッドを実装すること。
    class DivideBase < BinaryOp
      # ノードを初期化する
      # @param [Object] lhs 左のオペランドのノード
      # @param [Object] rhs 右のオペランドのノード
      def initialize(lhs, rhs)
        super(lhs, :/, rhs)
      end

      # 文字列に変換する
      #
      # 通常の結果の末尾に、端数処理方法を示す記号を付加する。
      #
      # @return [String]
      def to_s
        "#{super}#{rounding_method}"
      end

      # メッセージへの出力を返す
      #
      # 通常の結果の末尾に、端数処理方法を示す記号を付加する。
      #
      # @return [String]
      def output
        "#{super}#{rounding_method}"
      end

      private

      # 端数処理方法を示す記号を返す
      # @return [String]
      def rounding_method
        self.class::ROUNDING_METHOD
      end

      # S式で使う演算子の表現を返す
      # @return [String]
      def op_for_s_exp
        "#{@op}#{rounding_method}"
      end

      # 演算を行う
      # @param [Integer] lhs 左のオペランド
      # @param [Integer] rhs 右のオペランド
      # @return [Integer] 演算の結果
      def calc(lhs, rhs)
        if rhs.zero?
          return 1
        end

        return divide_and_round(lhs, rhs)
      end

      # 除算および端数処理を行う
      # @param [Integer] _dividend 被除数
      # @param [Integer] _divisor 除数（0以外）
      # @return [Integer]
      def divide_and_round(_dividend, _divisor)
        raise NotImplementedError
      end
    end

    # 除算（切り上げ）のノード
    class DivideWithRoundingUp < DivideBase
      # 端数処理方法を示す記号
      ROUNDING_METHOD = 'U'

      private

      # 除算および端数処理を行う
      # @param [Integer] dividend 被除数
      # @param [Integer] divisor 除数（0以外）
      # @return [Integer]
      def divide_and_round(dividend, divisor)
        (dividend.to_f / divisor).ceil
      end
    end

    # 除算（四捨五入）のノード
    class DivideWithRoundingOff < DivideBase
      # 端数処理方法を示す記号
      ROUNDING_METHOD = 'R'

      private

      # 除算および端数処理を行う
      # @param [Integer] dividend 被除数
      # @param [Integer] divisor 除数（0以外）
      # @return [Integer]
      def divide_and_round(dividend, divisor)
        (dividend.to_f / divisor).round
      end
    end

    # 除算（切り捨て）のノード
    class DivideWithRoundingDown < DivideBase
      # 端数処理方法を示す記号
      ROUNDING_METHOD = ''

      private

      # 除算および端数処理を行う
      # @param [Integer] dividend 被除数
      # @param [Integer] divisor 除数（0以外）
      # @return [Integer]
      def divide_and_round(dividend, divisor)
        (dividend / divisor).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
      end
    end

    # 符号反転のノード
    class Negate
      # 符号反転の対象
      # @return [Object]
      attr_reader :body

      # ノードを初期化する
      # @param [Object] body 符号反転の対象
      def initialize(body)
        @body = body
      end

      # ノードを評価する
      #
      # 対象オペランドを再帰的に評価した後、評価結果の符号を反転する。
      #
      # @param [Randomizer] randomizer ランダマイザ
      # @return [Integer] 評価結果
      def eval(randomizer)
        -@body.eval(randomizer)
      end

      # 文字列に変換する
      # @return [String]
      def to_s
        "-#{@body}"
      end

      # メッセージへの出力を返す
      # @return [String]
      def output
        "-#{@body.output}"
      end

      # ノードのS式を返す
      # @return [String]
      def s_exp
        "(- #{@body.s_exp})"
      end
    end

    # ダイスロールのノード
    class DiceRoll
      # ノードを初期化する
      # @param [Number] times ダイスを振る回数のノード
      # @param [Number] sides ダイスの面数のノード
      # @param [Number, nil] critical クリティカル値のノード
      def initialize(times, sides, critical)
        @times = times.literal
        @sides = sides.literal
        @critical = critical.nil? ? nil : critical.literal

        # ダイスを振った結果の出力
        @text = nil
      end

      # ノードを評価する（ダイスを振る）
      #
      # 評価結果は出目の合計値になる。
      # 出目はランダマイザに記録される。
      #
      # @param [Randomizer] randomizer ランダマイザ
      # @return [Integer] 評価結果（出目の合計値）
      def eval(randomizer)
        dice_groups = randomizer.roll(@times, @sides, @critical)

        # TODO: Ruby 2.4以降では Array#sum が使える
        total = dice_groups.flatten.reduce(0, &:+)

        dice_str = dice_groups.
                   map { |dice_list| "[#{dice_list.join(',')}]" }.
                   join
        @text = "#{total}#{dice_str}"

        return total
      end

      # 文字列に変換する
      # @return [String]
      def to_s
        if @critical
          "#{@times}D#{@sides}@#{@critical}"
        else
          "#{@times}D#{@sides}"
        end
      end

      # メッセージへの出力を返す
      # @return [String]
      def output
        @text
      end

      # ノードのS式を返す
      # @return [String]
      def s_exp
        parts = [@times, @sides, @critical].compact

        "(DiceRoll #{parts.join(' ')})"
      end
    end

    # フィルタ処理付きダイスロールのノード。
    #
    # ダイスロール後、条件に従って出目を選択し、和を求める。
    class DiceRollWithFilter
      # フィルタの構造体
      #
      # 各フィルタには、あらかじめソートされた出目の配列が渡される。
      #
      # @!attribute abbr
      #   @return [Symbol] フィルタの略称
      # @!attribute apply
      #   @return [Proc] フィルタ処理の内容
      Filter = Struct.new(:abbr, :apply)

      # 大きな出目から複数個取る
      KEEP_HIGHEST = Filter.new(
        :KH,
        lambda { |sorted_values, n| sorted_values.reverse.take(n) }
      ).freeze

      # 小さな出目から複数個取る
      KEEP_LOWEST = Filter.new(
        :KL,
        lambda { |sorted_values, n| sorted_values.take(n) }
      ).freeze

      # 大きな出目から複数個除く
      DROP_HIGHEST = Filter.new(
        :DH,
        lambda { |sorted_values, n| sorted_values.reverse.drop(n) }
      ).freeze

      # 小さな出目から複数個除く
      DROP_LOWEST = Filter.new(
        :DL,
        lambda { |sorted_values, n| sorted_values.drop(n) }
      ).freeze

      # ノードを初期化する
      # @param [Number] times ダイスを振る回数のノード
      # @param [Number] sides ダイスの面数のノード
      # @param [Number] n_filtering ダイスを残す/減らす個数のノード
      # @param [Filter] filter フィルタ
      def initialize(times, sides, n_filtering, filter)
        @times = times.literal
        @sides = sides.literal
        @n_filtering = n_filtering.literal
        @filter = filter

        # ダイスを振った結果の出力
        @text = nil
      end

      # ノードを評価する（ダイスを振り、出目を選択して和を求める）
      #
      # 評価結果は出目の合計値になる。
      # 出目はランダマイザに記録される。
      #
      # @param [Randomizer] randomizer ランダマイザ
      # @return [Integer] 評価結果（出目の合計値）
      def eval(randomizer)
        sorted_values = randomizer.roll_once(@times, @sides).sort
        total = @filter.
                apply[sorted_values, @n_filtering].
                reduce(0, &:+)

        @text = "#{total}[#{sorted_values.join(',')}]"

        return total
      end

      # 文字列に変換する
      # @return [String]
      def to_s
        "#{@times}D#{@sides}#{@filter.abbr}#{@n_filtering}"
      end

      # メッセージへの出力を返す
      # @return [String]
      def output
        @text
      end

      # ノードのS式を返す
      # @return [String]
      def s_exp
        "(DiceRollWithFilter #{@times} #{@sides} #{@filter.abbr.inspect} #{@n_filtering})"
      end
    end

    # 数値のノード
    class Number
      # 値
      # @return [Integer]
      attr_reader :literal

      # ノードを初期化する
      # @param [Integer] literal 値
      def initialize(literal)
        @literal = literal
      end

      # 符号を反転した結果の数値ノードを返す
      # @return [Number]
      def negate
        Number.new(-@literal)
      end

      # ノードを評価する
      # @return [Integer] 格納している値
      def eval(_randomizer)
        @literal
      end

      # 文字列に変換する
      # @return [String]
      def to_s
        @literal.to_s
      end

      alias output to_s
      alias s_exp to_s
    end
  end
end
