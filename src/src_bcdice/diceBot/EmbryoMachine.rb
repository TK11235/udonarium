# -*- coding: utf-8 -*-

class EmbryoMachine < DiceBot
  setPrefixes(['(EM\t+|HLT|MFT|SFT)'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
  end

  def gameName
    'エムブリオマシン'
  end

  def gameType
    "EmbryoMachine"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定ロール(EMt+m@c#f)
　目標値t、修正値m、クリティカル値c(省略時は20)、ファンブル値f(省略時は2)で攻撃判定を行います。
　命中した場合は命中レベルと命中部位も自動出力します。
　Rコマンドに読み替えされます。
・各種表
　・命中部位表　HLT
　・白兵攻撃ファンブル表　MFT
　・射撃攻撃ファンブル表　SFT
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/EM(\d+)([\+\-][\+\-\d]+)(@(\d+))(\#(\d+))/i) { "2R10#{Regexp.last_match(2)}>=#{Regexp.last_match(1)}[#{Regexp.last_match(4)},#{Regexp.last_match(6)}]" }
    string = string.gsub(/EM(\d+)([\+\-][\+\-\d]+)(\#(\d+))/i) { "2R10#{Regexp.last_match(2)}>=#{Regexp.last_match(1)}[20,#{Regexp.last_match(4)}]" }
    string = string.gsub(/EM(\d+)([\+\-][\+\-\d]+)(@(\d+))/i) { "2R10#{Regexp.last_match(2)}>=#{Regexp.last_match(1)}[#{Regexp.last_match(4)},2]" }
    string = string.gsub(/EM(\d+)([\+\-][\+\-\d]+)/i) { "2R10#{Regexp.last_match(2)}>=#{Regexp.last_match(1)}[20,2]" }
    string = string.gsub(/EM(\d+)(@(\d+))(\#(\d+))/i) { "2R10>=#{Regexp.last_match(1)}[#{Regexp.last_match(3)},#{Regexp.last_match(5)}]" }
    string = string.gsub(/EM(\d+)(\#(\d+))/i) { "2R10>=#{Regexp.last_match(1)}[20,#{Regexp.last_match(3)}]" }
    string = string.gsub(/EM(\d+)(@(\d+))/i) { "2R10>=#{Regexp.last_match(1)}[#{Regexp.last_match(3)},2]" }
    string = string.gsub(/EM(\d+)/i) { "2R10>=#{Regexp.last_match(1)}[20,2]" }
  end

  def dice_command_xRn(string, nick_e)
    return checkRoll(string, nick_e)
  end

  # ゲーム別成功度判定(nD10)
  def check_nD10(total_n, dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max)
    debug("EmbryoMachine check_nD10 begin")
    return '' unless signOfInequality == ">="

    if dice_n <= 2
      return " ＞ ファンブル"
    elsif dice_n >= 20
      return " ＞ クリティカル"
    elsif total_n >= diff
      return " ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end

  def checkRoll(string, nick_e)
    output = '1'

    return output unless /(^|\s)S?(2[rR]10([\+\-\d]+)?([>=]+(\d+))(\[(\d+),(\d+)\]))(\s|$)/i =~ string

    string = Regexp.last_match(2)
    diff = 0
    crit = 20
    fumble = 2
    mod = 0
    total_n = 0
    modText = Regexp.last_match(3)

    diff = Regexp.last_match(5).to_i if Regexp.last_match(5)
    crit = Regexp.last_match(7).to_i if Regexp.last_match(7)
    fumble = Regexp.last_match(8).to_i if Regexp.last_match(8)
    mod = parren_killer("(0#{modText})").to_i if modText

    dice_now, dice_str, = roll(2, 10, (sortType & 1))
    dice_loc, = roll(2, 10)
    dice_arr = dice_str.split(/,/).collect { |i| i.to_i }
    big_dice = dice_arr[1]
    output = "#{dice_now}[#{dice_str}]"
    total_n = dice_now + mod
    if mod > 0
      output += "+#{mod}"
    elsif mod < 0
      output += mod.to_s
    end
    if output =~ /[^\d\[\]]+/
      output = "#{nick_e}: (#{string}) ＞ #{output} ＞ #{total_n}"
    else
      output = "#{nick_e}: (#{string}) ＞ #{output}"
    end
    # 成功度判定
    if dice_now <= fumble
      output += " ＞ ファンブル"
    elsif dice_now >= crit
      output += " ＞ クリティカル ＞ " + get_hit_level_table(big_dice) + "(ダメージ+10) ＞ [#{dice_loc}]#{get_hit_location_table(dice_loc)}"
    elsif total_n >= diff
      output += " ＞ 成功 ＞ " + get_hit_level_table(big_dice) + " ＞ [#{dice_loc}]#{get_hit_location_table(dice_loc)}"
    else
      output += " ＞ 失敗"
    end

    return output
  end

  def rollDiceCommand(command)
    debug("rollDiceCommand command", command)

    output = '1'
    type = ""
    number = 0

    case command
    when /HLT/i
      type = '命中部位'
      number, = roll(2, 10)
      output = get_hit_location_table(number)
    when /SFT/i
      type = '射撃ファンブル'
      number, = roll(2, 10)
      output = get_shoot_fumble_table(number)
    when /MFT/i
      type = '白兵ファンブル'
      number, = roll(2, 10)
      output = get_melee_fumble_table(number)
    end

    if output != '1'
      output = "#{type}表(#{number}) ＞ #{output}"
    end
    return output
  end

  # ** 命中部位表
  def get_hit_location_table(num)
    table = [
      [ 4, '頭'],
      [ 7, '左脚'],
      [ 9, '左腕'],
      [12, '胴'],
      [14, '右腕'],
      [17, '右脚'],
      [20, '頭'],
    ]

    return get_table_by_number(num, table)
  end

  # ** ファンブル表
  def get_shoot_fumble_table(num) # 射撃攻撃ファンブル表
    output = '1'
    table = [
      '暴発した。使用した射撃武器が搭載されている部位に命中レベルAで命中する。',
      'あまりに無様な誤射をした。パイロットの精神的負傷が2段階上昇する。',
      '誤射をした。自機に最も近い味方機体に命中レベルAで命中する。',
      '誤射をした。対象に最も近い味方機体に命中レベルAで命中する。',
      '武装が暴発した。使用した射撃武器が破損する。ダメージは発生しない。',
      '転倒した。次のセグメントのアクションが待機に変更される。',
      '弾詰まりを起こした。使用した射撃武器は戦闘終了まで使用できなくなる。',
      '砲身が大きく歪んだ。使用した射撃武器による射撃攻撃の命中値が戦闘終了まで-3される。',
      '熱量が激しく増大した。使用した射撃武器の消費弾薬が戦闘終了まで+3される。',
      '暴発した。使用した射撃武器が搭載されている部位に命中レベルBで命中する。',
      '弾薬が劣化した。使用した射撃武器の全てのダメージが戦闘終了まで-2される。',
      '無様な誤射をした。パイロットの精神的負傷が1段階上昇する。',
      '誤射をした。対象に最も近い味方機体に命中レベルBで命中する。',
      '誤射をした。自機に最も近い味方機体に命中レベルBで命中する。',
      '砲身が歪んだ。使用した射撃武器による射撃攻撃の命中値が戦闘終了まで-2される。',
      '熱量が増大した。使用した射撃武器の消費弾薬が戦闘終了まで+2される。',
      '砲身がわずかに歪んだ。使用した射撃武器による射撃攻撃の命中値が戦闘終了まで-1される。',
      '熱量がやや増大した。使用した射撃武器の消費弾薬が戦闘終了まで+1される。',
      '何も起きなかった。',
    ]
    dc = 2
    output = table[num - dc] if table[num - dc]
    return output
  end

  def get_melee_fumble_table(num) # 白兵攻撃ファンブル表
    output = '1'
    table = [
      '大振りしすぎた。使用した白兵武器が搭載されている部位の反対の部位(右腕に搭載されているなら左側)に命中レベルAで命中する。',
      '激しく頭を打った。パイロットの肉体的負傷が2段階上昇する。',
      '過負荷で部位が爆発した。使用した白兵武器が搭載されている部位が全壊する。ダメージは発生せず、搭載されている武装も破損しない。',
      '大振りしすぎた。使用した白兵武器が搭載されている部位の反対の部位(右腕に搭載されているなら左側)に命中レベルBで命中する。',
      '武装が爆発した。使用した白兵武器が破損する。ダメージは発生しない。',
      '部分的に機能停止した。使用した白兵武器は戦闘終了まで使用できなくなる。',
      '転倒した。次のセグメントのアクションが待機に変更される。',
      '激しい刃こぼれを起こした。使用した白兵武器の全てのダメージが戦闘終了まで-3される。',
      '地面の凹凸にはまった。次の2セグメントは移動を行うことができない。',
      '刃こぼれを起こした。使用した白兵武器の全てのダメージが戦闘終了まで-2される。',
      '大振りしすぎた。使用した白兵武器が搭載されている部位の反対の部位(右腕に搭載されているなら左側)に命中レベルCで命中する。',
      '頭を打った。パイロットの肉体的負傷が1段階上昇する。',
      '駆動系が損傷した。移動力が戦闘終了まで-2される(最低1)。',
      '間合いを取り損ねた。隣接している機体(複数の場合は1機をランダムに決定)に激突する。',
      '機体ごと突っ込んだ。機体が向いている方角へ移動力をすべて消費するまで移動する。',
      '制御系が損傷した。回避値が戦闘終了まで-1される(最低1)。',
      '踏み誤った。機体が向いている方角へ移動力の半分を消費するまで移動する。',
      'たたらを踏んだ。機体が向いている方角へ1の移動力で移動する。',
      '何も起きなかった。',
    ]
    dc = 2
    output = table[num - dc] if table[num - dc]
    return output
  end

  def get_hit_level_table(num)
    table = [
      [ 6, '命中レベルC'],
      [ 9, '命中レベルB'],
      [10, '命中レベルA'],
    ]

    return get_table_by_number(num, table)
  end
end
