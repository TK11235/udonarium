# -*- coding: utf-8 -*-

require 'diceBot/GardenOrder'

class AceKillerGene < GardenOrder
  setPrefixes([
    '(AK|AKG)\d+(\/\d+)?(@\d+)?',
    'DC(SL|BL|IM|BR|RF|EL).+'
  ])

  def gameName
    'エースキラージーン'
  end

  def gameType
    "AceKillerGene"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
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
  end

  def rollDiceCommand(command)
    case command
    when /(AK|AKG)(\d+)(\/(\d+))?(@(\d+))?/i
      success_rate = $2.to_i
      repeat_count = ($4 || 1).to_i
      critical_border_text = $6
      critical_border = get_critical_border(critical_border_text, success_rate)

      return check_roll_repeat_attack(success_rate, repeat_count, critical_border)

     when /^DC(SL|BL|IM|BR|RF|EL)(\d+)/i
      type = $1
      damage_value = $2.to_i
      return look_up_damage_chart(type, damage_value)
    end

    return nil
  end
end
