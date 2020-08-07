# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'diceBot/NightWizard'

class NightWizard3rd < NightWizard
  # ゲームシステム名
  NAME = 'ナイトウィザード The 3rd Edition'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ないとういさあと3'

  # ゲームシステムの識別子
  ID = 'NightWizard3rd'

  def getFumbleTextAndTotal(base, modify, dice_str)
    total = base + modify
    total += -10
    text = "#{base + modify}-10[#{dice_str}]"
    return text, total
  end
end
