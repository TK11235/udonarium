# -*- coding: utf-8 -*-
# frozen_string_literal: true

class NightmareHunterDeep < DiceBot
  # ゲームシステムの識別子
  ID = 'NightmareHunterDeep'

  # ゲームシステム名
  NAME = 'ナイトメアハンター=ディープ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ないとめあはんたあていいふ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
加算ロール時に６の個数をカウントして、その４倍を自動的に加算します。
(出目はそのまま表示で合計値が6-10の読み替えになります)
INFO_MESSAGE_TEXT

  def initialize
    super
    @sendMode = 2
    @sortType = 1
  end

  def changeText(string)
    debug("parren_killer_add before string", string)
    string = string.sub(/^(.+?)Lv(\d+)(.*)/i) { "#{Regexp.last_match(1)}#{(Regexp.last_match(2).to_i * 5 - 1)}#{Regexp.last_match(3)}" }
    string = string.sub(/^(.+?)NL(\d+)(.*)/i) { "#{Regexp.last_match(1)}#{(Regexp.last_match(2).to_i * 5 + 5)}#{Regexp.last_match(3)}" }
    debug("parren_killer_add after string", string)

    return string
  end

  def check_nD6(total, _dice_total, _dice_list, cmp_op, target)
    return '' unless cmp_op == :>=

    if target != "?"
      if total >= target
        return " ＞ 成功"
      else
        return " ＞ 失敗"
      end
    end

    sucLv = 1
    sucNL = 0

    while total >= sucLv * 5 - 1
      sucLv += 1
    end

    while total >= (sucNL * 5 + 5)
      sucNL += 1
    end

    sucLv -= 1
    sucNL -= 1

    if sucLv <= 0
      " ＞ 失敗"
    else
      " ＞ Lv#{sucLv}/NL#{sucNL}成功"
    end
  end

  # ナイトメアハンターディープ用宿命表示
  def getDiceRolledAdditionalText(n1, n_max, dice_max)
    debug('getDiceRolledAdditionalText begin: n1, n_max, dice_max', n1, n_max, dice_max)

    if (n1 != 0) && (dice_max == 6)
      return " ＞ 宿命獲得"
    end

    return ''
  end

  # ダイス目による補正処理（現状ナイトメアハンターディープ専用）
  def getDiceRevision(n_max, dice_max, total_n)
    addText = ''
    revision = 0

    if (n_max > 0) && (dice_max == 6)
      revision = (n_max * 4)
      addText = "+#{n_max}*4 ＞ #{total_n + revision}"
    end

    return addText, revision
  end
end
