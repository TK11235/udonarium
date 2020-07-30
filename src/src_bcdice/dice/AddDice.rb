# -*- coding: utf-8 -*-

require "utils/normalize"
require "dice/add_dice/parser"
require "dice/add_dice/randomizer"

class AddDice
  def initialize(bcdice, diceBot)
    @bcdice = bcdice
    @diceBot = diceBot
    @nick_e = @bcdice.nick_e

    @dice_list = []
  end

  ####################             加算ダイス        ########################

  def rollDice(string)
    parser = Parser.new(string)

    command = parser.parse()
    if parser.error?
      return '1'
    end

    randomizer = Randomizer.new(@bcdice, @diceBot, command.cmp_op)
    total = command.lhs.eval(randomizer)

    output =
      if randomizer.dice_list.size <= 1 && command.lhs.is_a?(Node::DiceRoll)
        "#{@nick_e}: (#{command}) ＞ #{total}"
      else
        "#{@nick_e}: (#{command}) ＞ #{command.lhs.output} ＞ #{total}"
      end

    dice_list = randomizer.dice_list
    num_one = dice_list.count(1)
    num_max = dice_list.count(randomizer.sides)

    suffix, revision = @diceBot.getDiceRevision(num_max, randomizer.sides, total)
    output += suffix
    total += revision

    if command.cmp_op
      dice_total = dice_list.inject(&:+)
      output += @diceBot.check_result(total, dice_total, dice_list, randomizer.sides, command.cmp_op, command.rhs)
    end

    output += @diceBot.getDiceRolledAdditionalText(num_one, num_max, randomizer.sides)

    return output
  end
end
