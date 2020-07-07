# -*- coding: utf-8 -*-
# frozen_string_literal: true

class TokyoGhostResearch < DiceBot
  # ゲームシステムの識別子
  ID = 'TokyoGhostResearch'

  # ゲームシステム名
  NAME = '東京ゴーストリサーチ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'とうきようこおすとりさあち'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
判定
・タスク処理は目標値以上の値で成功となります。
  1d10>={目標値}
  例：目標値「5」の場合、5～0で成功
各種表
  ・導入表  OP
  ・一般トラブル表  TB
MESSAGETEXT

  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes([
    'OP', 'TB', 'TK?\(\d+\)'
  ])

  def rollDiceCommand(command)
    output =
      case command.upcase

      when /TK/i
        return getCheckResult(command)

      when 'OP'
        tgr_opening_table
      when 'TB'
        tgr_common_trouble_table
      end

    return output
  end

  def getCheckResult(command)
    output = ""
    diff = 0

    if /TK?<=(\d+)/i =~ command
      diff = Regexp.last_match(2).to_i
    end

    if diff > 0
      output += "(1D10<=#{diff})"

      total_n, = roll(1, 10)
      output += ' ＞ ' + total_n.to_s
      output += ' ＞ ' + getCheckResultText(total_n, diff)
    end
    return output
  end

  def getCheckResultText(total_n, diff)
    if total_n >= diff
      result = "成功"
    else
      result = "失敗"
    end

    return result
  end

  # 導入表(1d10)[OP]
  def tgr_opening_table
    name = "導入表"
    table = [
      [1, "【病休中断】体調不良または怪我で療養中だったが強制召喚された。"],
      [2, "【忙殺中】別の業務で忙殺中であった。"],
      [3, "【出張帰り】遠方での仕事から戻ったばかり。"],
      [4, "【休暇取り消し】休暇中だったが呼び戻された。"],
      [5, "【平常運転】いつもどおりの仕事中だった。"],
      [6, "【休暇明け】十分に休養をとったあとで、心身ともに充実している。"],
      [7, "【人生の岐路】人生の岐路にまさに差し掛かったところであった。"],
      [8, "【同窓会】かつての同級生に会い、差を実感したばかりだった。"],
      [9, "【転職活動中】転職を考えて求人サイトを見ているところだった。"],
      [10, "【サボリ中】仕事をサボっているところに呼び出しがあった。"],
    ]
    return get_1d10_table_result(name, table)
  end

  # 一般トラブル表(1d10)[TB]
  def tgr_common_trouble_table
    name = "一般トラブル表"
    table = [
      [1, "トラブルが生じたが、間一髪、危機を脱した。【ダメージなし】"],
      [2, "どうにかタスクを処理したが、非常に疲労してしまった。【肉体ダメージ1点】"],
      [3, "タスク処理の過程で負傷してしまった。【肉体ダメージ1点】"],
      [4, "恐怖や混乱、ストレスなどで精神の均衡を崩してしまった。【精神ダメージ1点】"],
      [5, "過去のトラウマなどを思い出し、気分が沈んでしまった。【精神ダメージ1点】"],
      [6, "自身の信用をキズつけたり、汚名を背負ってしまった。【環境ダメージ1点】"],
      [7, "会社や上司の不興を買ってしまった。【環境ダメージ1点】"],
      [8, "疲労困憊で動くこともままならない。【肉体ダメージ1点＋精神ダメージ1点】"],
      [9, "負傷したうえ、会社に損害を与えてしまった。【肉体ダメージ1点＋環境ダメージ1点】"],
      [10, "上司から厳しく叱責され、まずい立場になった。【精神ダメージ1点＋環境ダメージ1点】"],
    ]
    return get_1d10_table_result(name, table)
  end

  def get_1d10_table_result(name, table)
    dice, = roll(1, 10)
    output = get_table_by_number(dice, table)
    return get_table_result(name, dice, output)
  end

  def get_table_result(name, dice, output)
    return "#{name}(#{dice}) ＞ #{output}"
  end
end
