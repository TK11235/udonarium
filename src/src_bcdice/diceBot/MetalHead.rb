# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/ArithmeticEvaluator'
require 'utils/range_table'

class MetalHead < DiceBot
  # ゲームシステムの識別子
  ID = 'MetalHead'

  # ゲームシステム名
  NAME = 'メタルヘッド'

  # ゲームシステム名の読みがな
  SORT_KEY = 'めたるへつと'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・アビリティロール  AR>=目標値
・スキルロール      SR<=目標値(%)
・命中判定ロール    HR<=目標値(%)

  例）AR>=5
  例）SR<=(40+25)
  例）HR<=(50-10)

  これらのロールで成否、絶対成功/絶対失敗、クリティカル/アクシデントを自動判定します。

・クリティカルチャート  CC
・アクシデントチャート  射撃・投擲用:ACL  格闘用:ACS
・戦闘結果チャート      CRCsn   s=耐久レベル(SUV) n=数値

  例）CRCA61 SUV=Aを対象とした数値61(62に変換される)の戦闘結果を参照する。
  例）CRCM98 対物で数値98の戦闘結果を参照する。
MESSAGETEXT

  setPrefixes(['AR', 'SR', 'HR<=.+', 'CC', 'ACT', 'ACL', 'ACS', 'CRC[A-Z]\d+'])

  def rollDiceCommand(command)
    result = roll_tables(command, TABLES)
    return result if result

    case command
    when /\ACRC(\w)(\d+)\z/
      suv = Regexp.last_match(1)
      num = Regexp.last_match(2)
      return mh_crc_table(suv, num)
    when /\AHR<=(.+)/
      target = ArithmeticEvaluator.new.eval(
        Regexp.last_match(1), @fractionType.to_sym
      )
      return rollHit(target)
    end

    return nil
  end

  def changeText(string)
    string = string.gsub(/^(S)?AR/i) { "#{Regexp.last_match(1)}2D6" }
    string = string.gsub(/^(S)?SR/i) { "#{Regexp.last_match(1)}1D100" }
    return string
  end

  def check_2D6(total, dice_total, _dice_list, cmp_op, target)
    return '' if cmp_op != :>= || target == "?"

    if dice_total >= 12
      " ＞ 絶対成功"
    elsif dice_total <= 2
      " ＞ 絶対失敗"
    elsif total >= target
      " ＞ 成功"
    else
      " ＞ 失敗"
    end
  end

  def rollHit(target)
    total, = roll(1, 100)
    resultText = getHitResult(total, total, target)

    text = "(1D100<=#{target}) ＞ #{total}#{resultText}"

    return text
  end

  def check_1D100(total, dice_total, cmp_op, target)
    return '' if target == '?'
    return '' unless cmp_op == :<=

    return getResult(total, dice_total, target)
  end

  def getHitResult(total_n, _dice_n, diff)
    diceValue = total_n % 100
    dice1 = diceValue % 10 # 1の位を代入

    debug("total_n", total_n)

    return ' ＞ 失敗' if total_n > diff

    return ' ＞ 成功（クリティカル）' if  dice1 == 1
    return ' ＞ 失敗（アクシデント）' if  dice1 == 0

    return ' ＞ 成功'
  end

  def getResult(total_n, dice_n, diff)
    return ' ＞ 絶対成功' if  dice_n <= 5
    return ' ＞ 絶対失敗' if  dice_n >= 96

    return ' ＞ 成功' if total_n <= diff

    return ' ＞ 失敗'
  end

  # 戦闘結果チャートを振る
  # @param [String] suv 耐久レベル
  # @param [String] num 数値
  # @return [String] 振った結果
  def mh_crc_table(suv, num)
    header_parts = ['戦闘結果チャート', num]
    separator = ' ＞ '

    suv = suv.to_s.upcase
    numbuf = num.to_i
    if numbuf < 1
      return (header_parts + ['数値が不正です']).join(separator)
    end

    num_d1 = numbuf % 10
    debug("num_d1[#{num_d1}]")
    if num_d1 == 1
      numbuf += 1
    end
    if num_d1 == 0
      numbuf -= 1
    end
    num_d1 = numbuf % 10
    debug("num_d1[#{num_d1}]")

    table_point = [
      nil, # 0
      nil, # 1
      "腕部", # 2
      "腕部", # 3
      "脚部", # 4
      "脚部", # 5
      "胴部", # 6
      "胴部", # 7
      "胴部", # 8
      "頭部", # 9
    ]

    table_damage = {
      'S' => [ {'N' => 2}, {'LW' => 16}, {'MD' => 46}, {'MW' => 56}, {'HD' => 76}, {'HW' => 96}, {'MO' => 106}, {'K' => 116} ],
      'A' => [ {'LW' => 2}, {'MW' => 46}, {'HW' => 76}, {'MO' => 96}, {'K' => 116} ],
      'B' => [ {'LW' => 2}, {'MW' => 36}, {'HW' => 66}, {'MO' => 96}, {'K' => 106} ],
      'C' => [ {'LW' => 2}, {'MW' => 26}, {'HW' => 66}, {'MO' => 86}, {'K' => 106} ],
      'D' => [ {'LW' => 2}, {'MW' => 26}, {'HW' => 46}, {'MO' => 76}, {'K' => 96} ],
      'E' => [ {'LW' => 2}, {'MW' => 26}, {'HW' => 39}, {'MO' => 54}, {'K' => 76} ],
      'F' => [ {'LW' => 2}, {'MW' => 16}, {'HW' => 39}, {'MO' => 54}, {'K' => 66} ],
      'G' => [ {'LW' => 2}, {'MW' =>  6}, {'HW' => 16}, {'MO' => 26}, {'K' => 39} ],
      'M' => [ {'0'  => 2}, {'1' => 22}, {'2' => 42}, {'3' => 62}, {'4' => 82}, {'5' => 92}, {'6' => 102}, {'8' => 112} ],
    }

    if table_damage[suv].nil?
      return (header_parts + [
        "耐久レベル(SUV)[#{suv}]",
        "耐久レベル(SUV)の値が不正です",
      ]).join(separator)
    end

    damage_level = ''
    table_damage[suv].each do |v|
      v.each do |d, n|
        debug("suv[#{suv}] #{v} #{d} #{n}")
        if n <= numbuf
          damage_level = d
        end
      end
    end

    result_parts = []

    if numbuf != num.to_i
      result_parts.push(numbuf.to_s)
    end

    if suv == 'M'
      result_parts.push('耐物', "HP[#{damage_level}]")
    else
      result_parts.push(
        "耐久レベル(SUV)[#{suv}]",
        "部位[#{table_point[num_d1]}] ： 損傷種別[#{damage_level}]"
      )
    end

    return (header_parts + result_parts).join(separator)
  end

  # 表を振った結果の整形処理
  TABLE_ROLL_RESULT_FORMATTER = lambda do |table, result|
    [table.name, result.sum, result.content].join(' ＞ ')
  end

  # 表の集合
  TABLES = {
    'CC' => RangeTable.new(
      'クリティカルチャート',
      '1D10',
      [
        [1,     '相手は知覚系に多大なダメージを受けた。PERを1にして頭部にHWのダメージ、および心理チェック。'],
        [2,     '相手の運動神経を断ち切った。DEXを1にして腕部にHWのダメージ、および心理チェック。さらに腕に持っていた武器などは落としてしまう。'],
        [3,     '相手の移動手段は完全に奪われた。REFを1にして脚部にHWダメージと心理チェック。また、次回からのこちらの攻撃は必ず命中する。'],
        [4..5,  '相手の急所に命中。激痛のため気絶した上、胴にHWダメージ。'],
        [6,     '効果的な一撃。胴にHWダメージ。心理チェック。'],
        [7,     '効果的な一撃。胴にMOダメージ。心理チェック。'],
        [8..10, '君の一撃は相手の中枢を完全に破壊した。即死である。'],
      ],
      &TABLE_ROLL_RESULT_FORMATTER
    ),
    'ACL' => RangeTable.new(
      'アクシデントチャート（射撃・投擲）',
      '1D10',
      [
        [1..7, 'ささいなミス。特にペナルティーはない。'],
        [8,    '不発、またはジャム。弾を取り出さねばならない物は次のターンは射撃できない。'],
        [9,    'ささいな故障。可能なら次のターンから個別武器のスキルロールで修理を行える。'],
        [10,   '武器の暴発、または爆発。頭部HWの心理効果ロール。さらに、その武器は破壊されPERとDEXのどちらか、または両方に計2ポイントのマイナスを与える。（遠隔操作の場合、射手への被害は無し）'],
      ],
      &TABLE_ROLL_RESULT_FORMATTER
    ),
    'ACS' => RangeTable.new(
      'アクシデントチャート（格闘）',
      '1D10',
      [
        [1..3, '足を滑らせて転倒し、起き上がるまで相手に+20の命中修正を与える。'],
        [4..6, '手を滑らせて、武器を落とす。素手の時は関係ない。'],
        [7..9, '使用武器の破壊。素手戦闘のときはMWのダメージを受ける。'],
        [10,   '手を滑らせ、不幸にも武器は飛んでいき、5m以内に人がいれば誰かに刺さるか、または打撃を与えるかもしれない。ランダムに決定し、普通どおり判定を続ける。素手のときは関係ない。'],
      ],
      &TABLE_ROLL_RESULT_FORMATTER
    ),
  }.freeze
end
