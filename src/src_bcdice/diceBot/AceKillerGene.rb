# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/GardenOrder'

class AceKillerGene < GardenOrder
  # ゲームシステムの識別子
  ID = 'AceKillerGene'

  # ゲームシステム名
  NAME = 'エースキラージーン'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ええすきらあしいん'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・基本判定
　AKx/y@z　x：成功率、y：連続攻撃回数（省略可）、z：クリティカル値（省略可）
　（連続攻撃では1回の判定のみが実施されます）
　例）AK55　AK100/2　AK70@10　AK155/3@44
・負傷表
　DCxxy
　xx：属性（切断：SL，銃弾：BL，衝撃：IM，灼熱：BR，冷却：RF，電撃：EL）
　y：ダメージ
　例）DCSL7　DCEL22
INFO_MESSAGE_TEXT

  setPrefixes([
    '(AK|AKG)(\-?\d+)(\/\d+)?(@\d+)?',
    'DC(SL|BL|IM|BR|RF|EL).+'
  ])

  def rollDiceCommand(command)
    case command
    when %r{(AK|AKG)(\-?\d+)(/(\d+))?(@(\d+))?}i
      success_rate = Regexp.last_match(2).to_i
      repeat_count = (Regexp.last_match(4) || 1).to_i
      critical_border_text = Regexp.last_match(6)
      critical_border = get_critical_border(critical_border_text, success_rate)

      return check_roll_repeat_attack(success_rate, repeat_count, critical_border)

    when /^DC(SL|BL|IM|BR|RF|EL)(\d+)/i
      type = Regexp.last_match(1)
      damage_value = Regexp.last_match(2).to_i
      return look_up_damage_chart(type, damage_value)
    end

    return nil
  end
end
