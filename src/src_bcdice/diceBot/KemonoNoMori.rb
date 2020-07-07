# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/table.rb'
require 'utils/range_table'

class KemonoNoMori < DiceBot
  # ゲームシステムの識別子
  ID = 'KemonoNoMori'

  # ゲームシステム名
  NAME = '獸ノ森'

  # ゲームシステム名の読みがな
  SORT_KEY = 'けもののもり'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・行為判定(成功度自動算出): KAx[±y]
・継続判定(成功度+1固定): KCx[±y]
   x=目標値
   y=目標値への修正(任意) x+y-z のように複数指定可能
     例1）KA7+3 → 目標値7にプラス3の修正を加えた行為判定
     例2）KC6 → 目標値6の継続判定
・罠動作判定: CTR
   罠ごとに1D12を振る。12が出た場合は罠が動作し、獲物がその効果を受ける
・各種表
  ・大失敗表: FT
  ・能力値ランダム決定表: RST
  ・ランダム所要時間表: RTT
  ・ランダム消耗表: RET
  ・ランダム天気表: RWT
  ・ランダム天気持続表: RWDT
  ・ランダム遮蔽物表（屋外）: ROMT
  ・ランダム遮蔽物表（屋内）: RIMT
  ・逃走体験表: EET
  ・食材採集表: GFT
  ・水採集表: GWT
  ・白の魔石効果表: WST
MESSAGETEXT

  def rollDiceCommand(command)
    case command
    when /KA\d[-+\d]*/
      return check_1D12(command, true)
    when /KC\d[-+\d]*/
      return check_1D12(command, false)
    when 'CTR'
      return getTrapResult()
    when 'EET'
      return getEscapeExperienceTableResult(command)
    else
      return roll_tables(command, TABLES)
    end
  end

  def check_1D12(command, is_action_judge)
    debug('獸ノ森の1d12判定')
    m = /K[AC](\d[-+\d]*)/.match(command)
    unless m
      return ''
    end

    # 修正込みの目標値を計算
    target_total = parren_killer("(#{m[1]})").to_i
    debug('target_total', target_total)

    # 行為判定の成功度は [目標値の10の位の数+1]
    # 継続判定の成功度は固定で+1
    success_degree = is_action_judge ? (target_total / 10).floor + 1 : 1 # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    dice_total, = roll(1, 12)
    debug('dice_total, target_total, success_degree = ', dice_total, target_total, success_degree)

    if dice_total == 12
      return "(1D12<=#{target_total}) ＞ #{dice_total} ＞ 大失敗"
    elsif dice_total == 11
      return "(1D12<=#{target_total}) ＞ #{dice_total} ＞ 大成功（成功度+#{success_degree}, 次の継続判定の目標値を10に変更）"
    elsif dice_total <= target_total
      return "(1D12<=#{target_total}) ＞ #{dice_total} ＞ 成功（成功度+#{success_degree}）"
    else
      return "(1D12<=#{target_total}) ＞ #{dice_total} ＞ 失敗"
    end
  end

  def getTrapResult()
    trapCheckNumber, = roll(1, 12)

    # 12が出た場合のみ罠が動作する
    if trapCheckNumber == 12
      chaseNumber, = roll(1, 12)
      chase = nil
      case chaseNumber
      when 1, 2, 3, 4
        chase = '小型動物'
      when 5, 6, 7, 8
        chase = '大型動物'
      when 9, 10, 11, 12
        chase = '人間の放浪者'
      end
      return "罠動作チェック(1D12) ＞ #{trapCheckNumber} ＞ 罠が動作していた！ ＞ 獲物表(#{chaseNumber}) ＞ #{chase}が罠にかかっていた"
    end

    return "罠動作チェック(1D12) ＞ #{trapCheckNumber} ＞ 罠は動作していなかった"
  end

  def getEscapeExperienceTableResult(command)
    escapeExperience = roll_tables(command, TABLES)
    escapeDuration, = roll(1, 12)
    return "#{escapeExperience} (再登場: #{escapeDuration}時間後)"
  end

  TABLES = {
    'FT' => RangeTable.new(
      '大失敗表',
      '1D12',
      [
        [1..3, '【余裕】が3点減少する（最低0まで）'],
        [4..5, 'ランダムな荷物1個が落ちて行方不明になる（大失敗したエリアのアイテム調査で見つけることが可能）'],
        [6..7, 'ランダムな荷物1個が破壊される'],
        [8..9, 'ランダム天気表を使用し、結果をターンの終了まで適用する'],
        [10,   'ランダムな準備している小道具1個が破壊される'],
        [11,   '着想している防具が破壊される'],
        [12,   '準備している武器が破壊される'],
      ]
    ),
    'RST' => RangeTable.new(
      '能力値ランダム決定表',
      '1D12',
      [
        [1..2,   '【移動】'],
        [3..4,   '【格闘】'],
        [5..6,   '【射撃】'],
        [7..8,   '【製作】'],
        [9..10,  '【察知】'],
        [11..12, '【自制】'],
      ]
    ),
    'RTT' => RangeTable.new(
      'ランダム所要時間表',
      '1D12',
      [
        [1..3,   '2'],
        [4..6,   '3'],
        [7..9,   '4'],
        [10..12, '5'],
      ]
    ),
    'RET' => RangeTable.new(
      'ランダム消耗表',
      '1D12',
      [
        [1..3,   '0'],
        [4..6,   '1'],
        [7..9,   '2'],
        [10..12, '4'],
      ]
    ),
    'RWT' => RangeTable.new(
      'ランダム天気表',
      '1D12',
      [
        [1..2,   '濃霧'],
        [3..4,   '大雨'],
        [5..6,   '雷雨'],
        [7..8,   '強風'],
        [9..10,  '酷暑'],
        [11..12, '極寒'],
      ]
    ),
    'RWDT' => RangeTable.new(
      'ランダム天気持続表',
      '1D12',
      [
        [1..2,   '1ターン'],
        [3..4,   '3ターン'],
        [5..6,   '6ターン'],
        [7..8,   '24ターン'],
        [9..10,  '72ターン'],
        [11..12, '156ターン'],
      ]
    ),
    'ROMT' => RangeTable.new(
      'ランダム遮蔽物表(屋外)',
      '1D12',
      [
        [1..2,   '【藪】耐久度3,軽減値1,特殊効果:コンタクト内のキャラクターに対する射撃攻撃判定に-1の修正を付加'],
        [3..5,   '【木】耐久度5,軽減値2,特殊効果:コンタクト内のキャラクターに対する射撃攻撃判定に-1の修正を付加'],
        [6..8,   '【大木】耐久度7,軽減値3,特殊効果:コンタクト内のキャラクターに対する射撃攻撃判定に-2の修正を付加'],
        [9..10,  '【岩】耐久度6,軽減値4,特殊効果:コンタクト内のキャラクターに対する射撃攻撃判定に-1の修正を付加/コンタクト内で行われる格闘攻撃のダメージ+1'],
        [11..12, '【岩壁】耐久度8,軽減値4,特殊効果:コンタクト内のキャラクターに対する射撃攻撃判定に-2の修正を付加/コンタクト内で行われる格闘攻撃のダメージ+2'],
      ]
    ),
    'RIMT' => RangeTable.new(
      'ランダム遮蔽物表(屋内)',
      '1D12',
      [
        [1..4,  '【木材の壁】耐久度4,軽減値2,特殊効果:コンタクト内のキャラクターに対する射撃攻撃判定に-1の修正を付加'],
        [5..8,  '【木材の扉】耐久度4,軽減値2,特殊効果:コンタクト内のキャラクターに対する射撃攻撃判定に-1、接触判定と突撃判定に-2の修正を付加'],
        [9..12, '【木製家具】耐久度3,軽減値2,特殊効果:コンタクト内で行われる格闘攻撃のダメージ+1'],
      ]
    ),
    'EET' => RangeTable.new(
      '逃走体験表',
      '1D12',
      [
        [1..3,   '【余裕】が0になる'],
        [4..6,   '任意の【絆】を合計2点減少する'],
        [7..9,   '全ての荷物を失う（逃走したエリアに配置され、調査で発見可能）'],
        [10..12, '全ての武器と防具と小道具と荷物を失う（逃走したエリアに配置され、調査で発見可能）'],
      ]
    ),
    'GFT' => RangeTable.new(
      '食材採集表',
      '1D12',
      [
        [1..2,  '食べられる根（栄養価:2）'],
        [3..5,  '食べられる草（栄養価:3）'],
        [6..8,  '食べられる実（栄養価:5）'],
        [9..10, '小型動物（栄養価:10）'],
        [11,    '大型動物（栄養価:40）'],
        [12,    '気持ち悪い虫（栄養価:1）'],
      ]
    ),
    'GWT' => RangeTable.new(
      '水採集表',
      '1D12',
      [
        [1..6,  '汚水'],
        [7..11, '飲料水'],
        [12,    '毒水'],
      ]
    ),
    'WST' => Table.new(
      '白の魔石効果表',
      '1D12',
      [
        '役に立たないものの色を変える',
        '役に立たないものを大きくする',
        '役に立たないものを小さくする',
        '役に立たないものを保存する',
        '役に立たないものを復元する',
        '役に立たないものを召喚する',
        '役に立たないものを動かす',
        '役に立たないものを増やす',
        '役に立たないものを貼り付ける',
        '役に立たないものを作り出す',
        '小型動物を召喚する',
        '大型動物を召喚する',
      ]
    ),
  }.freeze

  setPrefixes(['K[AC]\d[-+\d]*', 'CTR'] + TABLES.keys)
end
