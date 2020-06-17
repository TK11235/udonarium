# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/table'
require 'utils/range_table'

class BattleTech < DiceBot
  # ゲームシステムの識別子
  ID = 'BattleTech'

  # ゲームシステム名
  NAME = 'バトルテック'

  # ゲームシステム名の読みがな
  SORT_KEY = 'はとるてつく'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・判定方法
　(回数)BT(ダメージ)(部位)+(基本値)>=(目標値)
　回数は省略時 1固定。
　部位はC（正面）R（右）、L（左）。省略時はC（正面）固定
　U（上半身）、L（下半身）を組み合わせ CU/RU/LU/CL/RL/LLも指定可能
　例）BT3+2>=4
　　正面からダメージ3の攻撃を技能ベース2目標値4で1回判定
　例）2BT3RL+5>=8
　　右下半身にダメージ3の攻撃を技能ベース5目標値8で2回判定
　ミサイルによるダメージは BT(ダメージ)の変わりに SRM2/4/6, LRM5/10/15/20を指定
　例）3SRM6LU+5>=8
　　左上半身にSRM6連を技能ベース5目標値8で3回判定
・CT：致命的命中表
・DW：転倒後の向き表
・CDx：メック戦士意識維持表。ダメージ値xで判定　例）CD3
MESSAGETEXT

  setPrefixes(['\d*SRM\d+.+', '\d*LRM\d+.+', '\d*BT.+', 'CT', 'DW', 'CD\d+'])

  # 致命的命中が発生しない上限値
  NO_CRITICAL_HIT_LIMIT = 7

  def changeText(string)
    string.sub(/PPC/, 'BT10')
  end

  def rollDiceCommand(command)
    result = roll_tables(command, TABLES)
    return result if result

    count = 1
    if /^(\d+)(.+)/ === command
      count = Regexp.last_match(1).to_i
      command = Regexp.last_match(2)
    end

    debug('executeCommandCatched count', count)
    debug('executeCommandCatched command', command)

    case command
    when /^CD(\d+)$/
      damage = Regexp.last_match(1).to_i
      return getCheckDieResult(damage)
    when /^((S|L)RM\d+)(.+)/
      tail = Regexp.last_match(3)
      type = Regexp.last_match(1)
      damageFunc = lambda { getXrmDamage(type) }
      return getHitResult(count, damageFunc, tail)
    when /^BT(\d+)(.+)/
      debug('BT pattern')
      tail = Regexp.last_match(2)
      damageValue = Regexp.last_match(1).to_i
      damageFunc = lambda { damageValue }
      return getHitResult(count, damageFunc, tail)
    end

    return nil
  end

  def getXrmDamage(type)
    raise "unknown XRM type:#{type}" unless XRM_DAMAGE_TABLES.key?(type)

    table = XRM_DAMAGE_TABLES[type]
    roll_result = table.roll(bcdice)

    lrm = type.start_with?('L')
    damage = roll_result.content
    modified_damage = lrm ? damage : (2 * damage)

    return modified_damage, roll_result.sum, lrm
  end

  LRM_LIMIT = 5

  def getHitResult(count, damageFunc, tail)
    m = /([LCR][LU]?)?(\+\d+)?>=(\d+)/.match(tail)
    return nil unless m

    side = m[1] || 'C'
    baseString = m[2]
    target = m[3].to_i
    base = getBaseValue(baseString)
    debug("side, base, target", side, base, target)

    partTable = HitPart::TABLES[side]

    resultTexts = []
    damages = {}
    hitCount = 0

    count.times do
      isHit, hitResult = getHitText(base, target)
      if isHit
        hitCount += 1

        damages, damageText = getDamages(damageFunc, partTable, damages)
        hitResult += damageText
      end
      resultTexts << hitResult
    end

    totalResultText = resultTexts.join("\n")

    if  totalResultText.length >= $SEND_STR_MAX
      totalResultText = "..."
    end

    totalResultText += "\n ＞ #{hitCount}回命中"
    totalResultText += " 命中箇所：" + getTotalDamage(damages) if hitCount > 0

    return totalResultText
  end

  def getBaseValue(baseString)
    base = 0
    return base if baseString.nil?

    base = parren_killer("(" + baseString + ")").to_i
    return base
  end

  def getHitText(base, target)
    dice1, = roll(1, 6)
    dice2, = roll(1, 6)
    total = dice1 + dice2 + base
    isHit = (total >= target)
    baseString = (base > 0 ? "+#{base}" : "")

    result = "#{total}[#{dice1},#{dice2}#{baseString}]>=#{target} ＞ "

    if isHit
      result += "命中 ＞ "
    else
      result += "外れ"
    end

    return isHit, result
  end

  # @param [Proc] damageFunc ダメージを返す手続き
  # @param [RangeTable] partTable 命中部位表
  # @param [Hash] damages 蓄積したダメージの情報
  def getDamages(damageFunc, partTable, damages)
    resultText = ''
    damage, dice, isLrm = damageFunc.call()

    damagePartCount = 1
    if isLrm
      damagePartCount = (1.0 * damage / LRM_LIMIT).ceil
      resultText += "[#{dice}] #{damage}点"
    end

    damagePartCount.times do |damageIndex|
      currentDamage, damageText = getDamageInfo(dice, damage, isLrm, damageIndex)

      text, part, criticalText = getHitResultOne(damageText, partTable)
      resultText += " " if isLrm
      resultText += text

      if damages[part].nil?
        damages[part] = {
          :partDamages => [],
          :criticals => [],
        }
      end

      damages[part][:partDamages] << currentDamage
      damages[part][:criticals] << criticalText unless criticalText.empty?
    end

    return damages, resultText
  end

  def getDamageInfo(dice, damage, isLrm, index)
    return damage, damage.to_s if dice.nil?
    return damage, "[#{dice}] #{damage}" unless isLrm

    currentDamage = damage - (LRM_LIMIT * index)
    if currentDamage > LRM_LIMIT
      currentDamage = LRM_LIMIT
    end

    return currentDamage, currentDamage.to_s
  end

  def getTotalDamage(damages)
    parts = ['頭',
             '胴中央',
             '右胴',
             '左胴',
             '右脚',
             '左脚',
             '右腕',
             '左腕',]

    allDamage = 0
    damageTexts = []
    parts.each do |part|
      damageInfo = damages.delete(part)
      next if  damageInfo.nil?

      damage = damageInfo[:partDamages].inject(0) { |sum, i| sum + i }
      allDamage += damage
      damageCount = damageInfo[:partDamages].size
      criticals = damageInfo[:criticals]

      text = ""
      text += "#{part}(#{damageCount}回) #{damage}点"
      text += " #{criticals.join(' ')}" unless criticals.empty?

      damageTexts << text
    end

    unless damages.empty?
      raise "damages rest!! #{damages.inspect()}"
    end

    result = damageTexts.join(" ／ ")
    result += " ＞ 合計ダメージ #{allDamage}点"

    return result
  end

  # 攻撃を1回行い、その結果を返す
  # @param [String] damage_text ダメージを表す文字列
  # @param [RangeTable] hit_part_table 命中部位表
  def getHitResultOne(damage_text, hit_part_table)
    hit_part_roll_result = hit_part_table.roll(bcdice)
    hit_part = hit_part_roll_result.content

    critical_hit_may_occur_str =
      hit_part.critical_hit_may_occur ? '（致命的命中）' : ''

    result_parts = [
      [
        "[#{hit_part_roll_result.sum}]",
        "#{hit_part.name}#{critical_hit_may_occur_str}",
        "#{damage_text}点",
      ].join(' ')
    ]

    critical_hit_occurred = false
    criticalText = ''
    if hit_part.critical_hit_may_occur
      ct_roll_result = TABLES['CT'].roll(bcdice)

      # 致命的命中が発生したか
      critical_hit_occurred = ct_roll_result.sum > NO_CRITICAL_HIT_LIMIT
      if critical_hit_occurred
        criticalText = ct_roll_result.content
      end

      result_parts.push("[#{ct_roll_result.sum}] #{ct_roll_result.content}")
    end

    # TODO: 構造体で表現する
    return result_parts.join(' ＞ '), hit_part.name, criticalText
  end

  def getCheckDieResult(damage)
    if damage >= 6
      return "死亡"
    end

    table = [[1,  3],
             [2,  5],
             [3,  7],
             [4,  10],
             [5,  11]]

    target = get_table_by_number(damage, table, nil)

    dice1, = roll(1, 6)
    dice2, = roll(1, 6)
    total = dice1 + dice2
    result = total >= target ? "成功" : "失敗"
    text = "#{total}[#{dice1},#{dice2}]>=#{target} ＞ #{result}"

    return text
  end

  # 表の集合
  TABLES = {
    'CT' => RangeTable.new(
      '致命的命中表',
      '2D6',
      [
        [2..NO_CRITICAL_HIT_LIMIT, '致命的命中はなかった'],
        [8..9,                     '1箇所の致命的命中'],
        [10..11,                   '2箇所の致命的命中'],
        [12,                       'その部位が吹き飛ぶ（腕、脚、頭）または3箇所の致命的命中（胴）'],
      ]
    ),
    'DW' => Table.new(
      '転倒後の向き表',
      '1D6',
      [
        '同じ（前面から転倒） 正面／背面',
        '1ヘクスサイド右（側面から転倒） 右側面',
        '2ヘクスサイド右（側面から転倒） 右側面',
        '180度逆（背面から転倒） 正面／背面',
        '2ヘクスサイド左（側面から転倒） 左側面',
        '1ヘクスサイド左（側面から転倒） 左側面',
      ]
    )
  }.freeze

  # 命中部位を表す構造体
  # @!attribute [rw] name
  #   @return [String] 部位名
  # @!attribute [rw] critical_hit_may_occur
  #   @return [Boolean]  致命的命中が発生し得るか
  HitPart = Struct.new(:name, :critical_hit_may_occur)

  class HitPart
    LEFT_TORSO = '左胴'
    CENTER_TORSO = '胴中央'
    RIGHT_TORSO = '右胴'

    LEFT_ARM = '左腕'
    RIGHT_ARM = '右腕'

    LEFT_LEG = '左脚'
    RIGHT_LEG = '右脚'

    HEAD = '頭'

    # 命中部位表
    TABLES = {
      'L' => RangeTable.new(
        '命中部位表（左）',
        '2D6',
        [
          [2,    new(LEFT_TORSO, true)],
          [3,    new(LEFT_LEG, false)],
          [4..5, new(LEFT_ARM, false)],
          [6,    new(LEFT_LEG, false)],
          [7,    new(LEFT_TORSO, false)],
          [8,    new(CENTER_TORSO, false)],
          [9,    new(RIGHT_TORSO, false)],
          [10,   new(RIGHT_ARM, false)],
          [11,   new(RIGHT_LEG, false)],
          [12,   new(HEAD, false)],
        ]
      ),
      'C' => RangeTable.new(
        '命中部位表（正面）',
        '2D6',
        [
          [2,      new(CENTER_TORSO, true)],
          [3..4,   new(RIGHT_ARM, false)],
          [5,      new(RIGHT_LEG, false)],
          [6,      new(RIGHT_TORSO, false)],
          [7,      new(CENTER_TORSO, false)],
          [8,      new(LEFT_TORSO, false)],
          [9,      new(LEFT_LEG, false)],
          [10..11, new(LEFT_ARM, false)],
          [12,     new(HEAD, false)],
        ]
      ),
      'R' => RangeTable.new(
        '命中部位表（右）',
        '2D6',
        [
          [2,    new(RIGHT_TORSO, true)],
          [3,    new(RIGHT_LEG, false)],
          [4..5, new(RIGHT_ARM, false)],
          [6,    new(RIGHT_LEG, false)],
          [7,    new(RIGHT_TORSO, false)],
          [8,    new(CENTER_TORSO, false)],
          [9,    new(LEFT_TORSO, false)],
          [10,   new(LEFT_ARM, false)],
          [11,   new(LEFT_LEG, false)],
          [12,   new(HEAD, false)],
        ]
      ),

      'LU' => RangeTable.new(
        '命中部位表（左上半身）',
        '1D6',
        [
          [1..2, new(LEFT_TORSO, false)],
          [3,    new(CENTER_TORSO, false)],
          [4..5, new(LEFT_ARM, false)],
          [6,    new(HEAD, false)],
        ]
      ),
      # TODO: 普通のTableで書く
      'CU' => RangeTable.new(
        '命中部位表（正面上半身）',
        '1D6',
        [
          [1, new(LEFT_ARM, false)],
          [2, new(LEFT_TORSO, false)],
          [3, new(CENTER_TORSO, false)],
          [4, new(RIGHT_TORSO, false)],
          [5, new(RIGHT_ARM, false)],
          [6, new(HEAD, false)],
        ]
      ),
      'RU' => RangeTable.new(
        '命中部位表（右上半身）',
        '1D6',
        [
          [1..2, new(RIGHT_TORSO, false)],
          [3,    new(CENTER_TORSO, false)],
          [4..5, new(RIGHT_ARM, false)],
          [6,    new(HEAD, false)],
        ]
      ),

      'LL' => RangeTable.new(
        '命中部位表（左下半身）',
        '1D6',
        [
          [1..6, new(LEFT_LEG, false)],
        ]
      ),
      'CL' => RangeTable.new(
        '命中部位表（右下半身）',
        '1D6',
        [
          [1..3, new(RIGHT_LEG, false)],
          [4..6, new(LEFT_LEG, false)],
        ]
      ),
      'RL' => RangeTable.new(
        '命中部位表（右下半身）',
        '1D6',
        [
          [1..6, new(RIGHT_LEG, false)],
        ]
      ),
    }.freeze
  end

  # ミサイルダメージ表
  XRM_DAMAGE_TABLES = {
    'SRM2' => RangeTable.new(
      'SRM2ダメージ表',
      '2D6',
      [
        [2..7,  1],
        [8..12, 2],
      ]
    ),
    'SRM4' => RangeTable.new(
      'SRM4ダメージ表',
      '2D6',
      [
        [2,      1],
        [3..6,   2],
        [7..10,  3],
        [11..12, 4],
      ]
    ),
    'SRM6' => RangeTable.new(
      'SRM6ダメージ表',
      '2D6',
      [
        [2..3,   2],
        [4..5,   3],
        [6..8,   4],
        [9..10,  5],
        [11..12, 6],
      ]
    ),
    'LRM5' => RangeTable.new(
      'LRM5ダメージ表',
      '2D6',
      [
        [2,      1],
        [3..4,   2],
        [5..8,   3],
        [9..10,  4],
        [11..12, 5],
      ]
    ),
    'LRM10' => RangeTable.new(
      'LRM10ダメージ表',
      '2D6',
      [
        [2..3,    3],
        [4,       4],
        [5..8,    6],
        [9..10,   8],
        [11..12, 10],
      ]
    ),
    'LRM15' => RangeTable.new(
      'LRM15ダメージ表',
      '2D6',
      [
        [2..3,    5],
        [4,       6],
        [5..8,    9],
        [9..10,  12],
        [11..12, 15],
      ]
    ),
    'LRM20' => RangeTable.new(
      'LRM20ダメージ表',
      '2D6',
      [
        [2..3,    6],
        [4,       9],
        [5..8,   12],
        [9..10,  16],
        [11..12, 20],
      ]
    )
  }.freeze
end
