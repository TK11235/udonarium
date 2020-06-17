# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/GardenOrder'

class ScreamHighSchool < GardenOrder
  # ゲームシステムの識別子
  ID = 'ScreamHighSchool'

  # ゲームシステム名
  NAME = 'スクリームハイスクール'

  # ゲームシステム名の読みがな
  SORT_KEY = 'すくりいむはいすくうる'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
・基本判定
　SHx/y@z　x：成功率、y：連続攻撃回数（省略可）、z：クリティカル値（省略可）
　（連続攻撃では1回の判定のみが実施されます）
　例）SH55　SH(40-20) SH100/2　SH70@10　SH155/3@44
・感情判定
　EMx@z　x：成功率、z：クリティカル値（省略可）
　例）EM50　EM50@15
・性格傾向判定
　TRx@z　x：成功率、z：クリティカル値（省略可）
　例）TR60　TR60@15
・恐怖判定
　FEx@z　x：成功率、z：クリティカル値（省略可）
　例）FE70　FE70@15
・負傷表
　DCxxy
　xx：属性（切断：SL，銃弾：BL，衝撃：IM，灼熱：BR，冷却：RF，電撃：EL）
　y：ダメージ
　例）DCSL7　DCEL22
INFO_MESSAGE_TEXT

  setPrefixes([
    '(SH|SHS)(\-?\d+)(\/\d+)?(@\d+)?',
    '(EM|TR|FE)(\-?\d+)(@\d+)?',
    'DC(SL|BL|IM|BR|RF|EL).+'
  ])

  def rollDiceCommand(command)
    case command
    when /(EM|TR|FE)(\-?\d+)(@(\d+))?/i
      command_type = Regexp.last_match(1).upcase
      success_rate = Regexp.last_match(2).to_i
      critical_border_text = Regexp.last_match(4)
      critical_border = get_critical_border(critical_border_text, success_rate)

      return check_roll_sh(success_rate, critical_border, command_type)
    when %r{(SH|SHS)(\-?\d+)(/(\d+))?(@(\d+))?}i
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

  def check_roll_sh(success_rate, critical_border, command_type)
    success_rate = 0 if success_rate < 0
    fumble_border = (success_rate < 100 ? 96 : 99)

    dice_value, = roll(1, 100)
    result = get_check_result(dice_value, success_rate, critical_border, fumble_border)
    title, supplementary = get_supplementary(command_type, result)
    unless supplementary.empty?
      supplementary = "（#{supplementary}）"
    end

    text = "#{title}判定 D100<=#{success_rate}@#{critical_border} ＞ #{dice_value} ＞ #{result}#{supplementary}"
    return text
  end

  def get_supplementary(command_type, result)
    title = ''
    supplementary = ''
    case command_type
    when 'EM'
      title = '感情'
      case result
      when 'クリティカル'
        supplementary = '次に行う判定の成功率に+50%'
      when  '成功'
        supplementary = '次に行う判定の成功率に+30%'
      when  '失敗'
        supplementary = '次に行う判定の成功率に-20%、呪縛+1点'
      when  'ファンブル'
        supplementary = '次に行う判定の成功率に-50%、呪縛+1D5点'
      end
    when 'TR'
      title = '性格傾向'
      case result
      when  '失敗'
        supplementary = '反対側の性格傾向で再判定する。あるいは、もしこれがその再判定の結果であればプレイヤーが性格傾向を選択する'
      when  'ファンブル'
        supplementary = '反対側の性格傾向に従い、呪縛+1D5点する。あるいは、もしこれが失敗後の再判定の結果だった場合、PCは混乱し行動を放棄するか逃げ出す。呪縛+2点'
      else
        supplementary = '判定した性格傾向に従う'
      end
    when 'FE'
      title = '恐怖'
      case result
      when  '成功'
        supplementary = 'ショックを受け流した。恐怖判定効果表の成功側の値分、呪縛が上昇する'
      when  '失敗'
        supplementary = 'ショックを受けた。恐怖判定効果表の失敗側の値分、呪縛が上昇する'
      when  'ファンブル'
        supplementary = '深いショックを受けた。恐怖判定効果表の失敗側の値分に加え、さらに1D5点分、呪縛が上昇する'
      else
        supplementary = '何もショックを受けなかった'
      end
    end
    return title, supplementary
  end
end
