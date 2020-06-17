# -*- coding: utf-8 -*-
# frozen_string_literal: true

class PhantasmAdventure < DiceBot
  # ゲームシステムの識別子
  ID = 'PhantasmAdventure'

  # ゲームシステム名
  NAME = 'ファンタズムアドベンチャー'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ふあんたすむあとへんちやあ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
成功、失敗、決定的成功、決定的失敗の表示とクリティカル・ファンブル値計算の実装。
INFO_MESSAGE_TEXT

  def initialize
    super
    @sendMode = 2
  end

  # ゲーム別成功度判定(1d20)
  def check_1D20(total, _dice_total, cmp_op, diff)
    return '' unless cmp_op == :<=

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

    if (total >= fumble) || (total >= 20)
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

    elsif (total <= critical) || (total <= 1)
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

    elsif total <= diff
      return " ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end
end
