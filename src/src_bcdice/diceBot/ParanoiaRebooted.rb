# -*- coding: utf-8 -*-
# frozen_string_literal: true

class ParanoiaRebooted < DiceBot
  # ゲームシステムの識別子
  ID = 'ParanoiaRebooted'

  # ゲームシステム名
  NAME = 'パラノイア リブーテッド'

  # ゲームシステム名の読みがな
  SORT_KEY = 'はらのいありふうてつと'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
※コマンドは入力内容の前方一致で検出しています。
・通常の判定　NDx
　x：ノードダイスの数.マイナスも可.
　ノードダイスの絶対値 + 1個(コンピュータダイス)のダイスがロールされる.
例）ND2　ND-3

・ミュータントパワー判定　MPx
  x：ノードダイスの数.
　ノードダイスの値 + 1個(コンピュータダイス)のダイスがロールされる.
例）MP2
INFO_MESSAGE_TEXT

  setPrefixes(['ND.*', 'MP.*'])

  def rollDiceCommand(command)
    case command
    when /^ND/i
      return get_node_dice_roll(command)
    when /^MP/i
      return get_mutant_power_roll(command)
    else
      return nil
    end
  end

  private

  def generate_roll_results(dices)
    computer_dice_message = ''
    results = dices.dup
    if results[-1].to_i == 6
      results[-1] = 'C'
      computer_dice_message = '(Computer)'
    end

    return results, computer_dice_message
  end

  def get_node_dice_roll(command)
    debug("rollDiceCommand Begin")

    m = /^ND((-)?\d+)/i.match(command)
    unless m
      return ''
    end

    debug("command", command)

    parameter_num = m[1].to_i
    dice_count = parameter_num.abs + 1

    total, dice_text, = roll(dice_count, 6)

    dices = dice_text.split(',')
    success_rate = dices.count { |dice| dice.to_i >= 5 }
    success_rate -= dices.count { |dice| dice.to_i < 5 } if parameter_num < 0
    debug(dices)

    results, computer_dice_message = generate_roll_results(dices)

    debug("rollDiceCommand result")

    return "(#{command}) ＞ [#{results.join(', ')}] ＞ 成功度#{success_rate}#{computer_dice_message}"
  end

  def get_mutant_power_roll(command)
    debug("rollDiceCommand Begin")

    m = /^MP(\d+)/i.match(command)
    unless m
      return ''
    end

    debug("command", command)

    parameter_num = m[1].to_i
    dice_count = parameter_num.abs + 1

    total, dice_text, = roll(dice_count, 6)
    dices = dice_text.split(',')
    failure_rate = dices.count { |dice| dice.to_i == 1 }
    message = failure_rate == 0 ? '成功' : "失敗(#{failure_rate})"

    results, computer_dice_message = generate_roll_results(dices)

    debug(dices)

    debug("rollDiceCommand result")

    return "(#{command}) ＞ [#{results.join(', ')}] ＞ #{message}#{computer_dice_message}"
  end
end
