# -*- coding: utf-8 -*-

class AddDice
  class Randomizer
    attr_reader :dicebot, :cmp_op, :dice_list, :sides

    def initialize(bcdice, dicebot, cmp_op)
      @bcdice = bcdice
      @dicebot = dicebot
      @cmp_op = cmp_op
      @sides = 0
      @dice_list = []
    end

    # ダイスを振る
    # @param [Integer] times ダイス数
    # @param [Integer] sides 面数
    # @param [Integer, nil] critical クリティカルヒットの閾値
    # @return [Array<Array<Integer>>] 出目のグループの配列
    def roll(times, sides, critical)
      # 振り足し分も含めた出目グループの配列
      dice_groups = []

      loop_count = 0
      queue = [times]
      while !queue.empty?
        times = queue.shift

        dice_list = roll_once(times, sides)
        @dice_list.concat(dice_list)

        # 出目の小計
        # TODO: Ruby 2.4以降では dice_list.sum とできる
        sum = dice_list.reduce(0, &:+)

        dice_groups.push(dice_list)

        enqueue_reroll(dice_list, queue, times)
        @dicebot.check2dCritical(critical, sum, queue, loop_count)
        loop_count += 1
      end

      return dice_groups
    end

    # ダイスを振る（振り足しなしの1回分）
    # @param [Integer] times ダイス数
    # @param [Integer] sides 面数
    # @return [Array<Integer>] 出目の配列
    def roll_once(times, sides)
      @sides = sides if @sides < sides

      if sides == 66
        return Array.new(times) { @bcdice.getD66Value() }
      end

      _, dice_str, = @bcdice.roll(times, sides, @dicebot.sortType & 1)

      # 現在は出目が文字列で返ってきてしまうので、整数の配列に変換する
      return dice_str.split(',').map(&:to_i)
    end

    private

    def double_check?
      if @dicebot.sameDiceRerollCount != 0 # 振り足しありのゲームでダイスが二個以上
        if @dicebot.sameDiceRerollType <= 0 # 判定のみ振り足し
          return true if @cmp_op
        elsif  @dicebot.sameDiceRerollType <= 1 # ダメージのみ振り足し
          debug('ダメージのみ振り足し')
          return true unless @cmp_op
        else # 両方振り足し
          return true
        end
      end

      return false
    end

    def enqueue_reroll(dice_list, dice_queue, roll_times)
      unless double_check? && (roll_times >= 2)
        return
      end

      count_bucket = {}

      dice_list.each do |val|
        count_bucket[val] ||= 0
        count_bucket[val] += 1
      end

      reroll_threshold = @dicebot.sameDiceRerollCount == 1 ? roll_times : @dicebot.sameDiceRerollCount
      count_bucket.each do |_, num|
        if num >= reroll_threshold
          dice_queue.push(num)
        end
      end
    end
  end
end
