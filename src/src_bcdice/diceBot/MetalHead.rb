# -*- coding: utf-8 -*-

class MetalHead < DiceBot
  setPrefixes(['AR', 'SR', 'HR<=.+', 'CC', 'ACT', 'ACL', 'ACS', 'CRC[A-Z]\d+'])

  def initialize
    super
  end

  def gameName
    'メタルヘッド'
  end

  def gameType
    "MetalHead"
  end

  def getHelpMessage
    return <<MESSAGETEXT
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
  end

  def rollDiceCommand(command)
    debug("rollDiceCommand", command)

    tableName   = ""
    tableNumber = ""
    tableResult = ""

    case command.upcase
    when /^CC/
      tableName, tableResult, tableNumber = mh_cc_table
    when /^ACL/
      tableName, tableResult, tableNumber = mh_acl_table
    when /^ACS/
      tableName, tableResult, tableNumber = mh_acs_table
    when /^CRC(\w)(\d+)/
      tableName, tableResult, tableNumber = mh_crc_table($1, $2)
    when /^HR<=(.+)$/
      target = parren_killer("(" + $1 + ")").to_i
      return rollHit(target)
    end

    if ! tableName.empty?
      return "#{tableName} ＞ #{tableNumber} ＞ #{tableResult}"
    end
  end

  def changeText(string)
    string = string.gsub(/^(S)?AR/i) { "#{$1}2D6" }
    string = string.gsub(/^(S)?SR/i) { "#{$1}1D100" }
    return string
  end

  def check_2D6(totalValue, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return '' if signOfInequality != ">="
    return '' if diff == "?"

    return " ＞ 絶対成功" if dice_n >= 12
    return " ＞ 絶対失敗" if dice_n <= 2

    return " ＞ 成功" if totalValue >= diff

    return " ＞ 失敗"
  end

  def rollHit(target)
    total, = roll(1, 100)
    resultText = getHitResult(total, total, target)

    text = "(1D100<=#{target}) ＞ #{total}#{resultText}"

    return text
  end

  def check_1D100(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    return '' unless signOfInequality == '<='

    return getResult(total_n, dice_n, diff)
  end

  def getHitResult(total_n, dice_n, diff)
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

  def mh_cc_table
    name = "クリティカルチャート"
    table = [
      "相手は知覚系に多大なダメージを受けた。PERを1にして頭部にHWのダメージ、および心理チェック。",
      "相手の運動神経を断ち切った。DEXを1にして腕部にHWのダメージ、および心理チェック。さらに腕に持っていた武器などは落としてしまう。",
      "相手の移動手段は完全に奪われた。REFを1にして脚部にHWダメージと心理チェック。また、次回からのこちらの攻撃は必ず命中する。",
      "相手の急所に命中。激痛のため気絶した上、胴にHWダメージ。",
      "相手の急所に命中。激痛のため気絶した上、胴にHWダメージ。",
      "効果的な一撃。胴にHWダメージ。心理チェック。",
      "効果的な一撃。胴にMOダメージ。心理チェック。",
      "君の一撃は相手の中枢を完全に破壊した。即死である。",
      "君の一撃は相手の中枢を完全に破壊した。即死である。",
      "君の一撃は相手の中枢を完全に破壊した。即死である。",
    ]
    result, num = get_table_by_nDx(table, 1, 10)
    return name, result, num
  end

  def mh_acl_table
    name = "アクシデントチャート（射撃・投擲）"
    table = [
      "ささいなミス。特にペナルティーはない。",
      "ささいなミス。特にペナルティーはない。",
      "ささいなミス。特にペナルティーはない。",
      "ささいなミス。特にペナルティーはない。",
      "ささいなミス。特にペナルティーはない。",
      "ささいなミス。特にペナルティーはない。",
      "ささいなミス。特にペナルティーはない。",
      "不発、またはジャム。弾を取り出さねばならない物は次のターンは射撃できない。",
      "ささいな故障。可能なら次のターンから個別武器のスキルロールで修理を行える。",
      "武器の暴発、または爆発。頭部HWの心理効果ロール。さらに、その武器は破壊されPERとDEXのどちらか、または両方に計2ポイントのマイナスを与える。（遠隔操作の場合、射手への被害は無し）",
    ]
    result, num = get_table_by_nDx(table, 1, 10)
    return name, result, num
  end

  def mh_acs_table
    name = "アクシデントチャート（格闘）"
    table = [
      "足を滑らせて転倒し、起き上がるまで相手に+20の命中修正を与える。",
      "足を滑らせて転倒し、起き上がるまで相手に+20の命中修正を与える。",
      "足を滑らせて転倒し、起き上がるまで相手に+20の命中修正を与える。",
      "手を滑らせて、武器を落とす。素手の時は関係ない。",
      "手を滑らせて、武器を落とす。素手の時は関係ない。",
      "手を滑らせて、武器を落とす。素手の時は関係ない。",
      "使用武器の破壊。素手戦闘のときはMWのダメージを受ける。",
      "使用武器の破壊。素手戦闘のときはMWのダメージを受ける。",
      "使用武器の破壊。素手戦闘のときはMWのダメージを受ける。",
      "手を滑らせ、不幸にも武器は飛んでいき、5m以内に人がいれば誰かに刺さるか、または打撃を与えるかもしれない。ランダムに決定し、普通どおり判定を続ける。素手のときは関係ない。",
    ]
    result, num = get_table_by_nDx(table, 1, 10)
    return name, result, num
  end

  def mh_crc_table(suv, num)
    name = "戦闘結果チャート"

    suv = suv.to_s.upcase
    numbuf = num.to_i
    if numbuf < 1
      return name, '数値が不正です', num
    end

    num_d1 = numbuf % 10
    debug("num_d1[#{num_d1}]")
    if num_d1 == 1
      numbuf = numbuf + 1
    end
    if num_d1 == 0
      numbuf = numbuf - 1
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
      return name, "耐久レベル(SUV)[#{suv}] ＞ 耐久レベル(SUV)の値が不正です", num
    end

    damage_level = ''
    table_damage[suv].each { |v|
      v.each { |d, n|
        debug("suv[#{suv}] #{v} #{d} #{n}")
        if n <= numbuf
          damage_level = d
        end
      }
    }

    result = ""

    if numbuf != num.to_i
      result = "#{numbuf} ＞ "
    end

    if suv == 'M'
      result += "耐物 ＞ HP[#{damage_level}]"
    else
      result += "耐久レベル(SUV)[#{suv}] ＞ 部位[#{table_point[num_d1]}] ： 損傷種別[#{damage_level}]"
    end

    return name, result, num
  end
end
