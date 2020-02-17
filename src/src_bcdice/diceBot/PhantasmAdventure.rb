# -*- coding: utf-8 -*-

class PhantasmAdventure < DiceBot
  def initialize
    super
    @sendMode = 2
  end

  def gameName
    'ファンタズムアドベンチャー'
  end

  def gameType
    "PhantasmAdventure"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
成功、失敗、決定的成功、決定的失敗の表示とクリティカル・ファンブル値計算の実装。
INFO_MESSAGE_TEXT
  end

  # ゲーム別成功度判定(1d20)
  def check_1D20(total_n, _dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max)
    return '' unless signOfInequality == "<="

    # 技能値の修正を計算する
    skill_mod = 0
    if diff < 1
      skill_mod = diff - 1
    elsif diff > 20
      skill_mod = diff - 20
    end

    fumble = 20 + skill_mod
    fumble = 20 if fumble > 20
    critical = 1 + skill_mod
    dice_now, = roll(1, 20)

    if (total_n >= fumble) || (total_n >= 20)
      fum_num = dice_now - skill_mod
      fum_num = 20 if fum_num > 20
      fum_num = 1 if fum_num < 1

      if sendMode <= 1
        return " ＞ 致命的失敗(#{fum_num})"
      end

      fum_str = dice_now.to_s
      if skill_mod < 0
        fum_str += "+#{skill_mod * -1}=#{fum_num}"
      else
        fum_str += "-#{skill_mod}=#{fum_num}"
      end
      return " ＞ 致命的失敗(#{fum_str})"

    elsif (total_n <= critical) || (total_n <= 1)
      crit_num = dice_now + skill_mod
      crit_num = 20 if crit_num > 20
      crit_num = 1 if crit_num < 1

      if skill_mod < 0
        return " ＞ 成功"
      end

      if sendMode > 1
        return " ＞ 決定的成功(#{dice_now}+#{skill_mod}=#{crit_num})"
      end

      return " ＞ 決定的成功(#{crit_num})"

    elsif total_n <= diff
      return " ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end
end
