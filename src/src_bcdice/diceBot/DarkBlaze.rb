# -*- coding: utf-8 -*-

class DarkBlaze < DiceBot
  setPrefixes(['DB.*', 'BT.*'])

  def initialize
    super
    @sendMode = 2
  end

  def gameName
    'ダークブレイズ'
  end

  def gameType
    "DarkBlaze"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・行為判定　(DBxy#n)
　行為判定専用のコマンドです。
　"DB(能力)(技能)#(修正)"でロールします。Rコマンド(3R6+n[x,y]>=m mは難易度)に読替をします。
　クリティカルとファンブルも自動で処理されます。
　DB@x@y#m と DBx,y#m にも対応しました。
　例）DB33　　　DB32#-1　　　DB@3@1#1　　　DB3,2　　　DB23#1>=4　　　3R6+1[3,3]>=4

・掘り出し袋表　(BTx)
　"BT(ダイス数)"で掘り出し袋表を自動で振り、結果を表示します。
　例）BT1　　　BT2　　　BT[1...3]
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    return string unless string =~ /DB/i

    string = string.gsub(/DB(\d),(\d)/) { "DB#{Regexp.last_match(1)}#{Regexp.last_match(2)}" }
    string = string.gsub(/DB\@(\d)\@(\d)/) { "DB#{Regexp.last_match(1)}#{Regexp.last_match(2)}" }
    string = string.gsub(/DB(\d)(\d)(#([\d][\+\-\d]*))/) { "3R6+#{Regexp.last_match(4)}[#{Regexp.last_match(1)},#{Regexp.last_match(2)}]" }
    string = string.gsub(/DB(\d)(\d)(#([\+\-\d]*))/) { "3R6#{Regexp.last_match(4)}[#{Regexp.last_match(1)},#{Regexp.last_match(2)}]" }
    string = string.gsub(/DB(\d)(\d)/) { "3R6[#{Regexp.last_match(1)},#{Regexp.last_match(2)}]" }

    return string
  end

  def dice_command_xRn(string, nick_e)
    return check_roll(string, nick_e)
  end

  # ゲーム別成功度判定(nD6)
  def check_nD6(total_n, _dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max)
    return '' unless signOfInequality == ">="

    return '' if diff == "?"

    if total_n >= diff
      return " ＞ 成功"
    end

    return " ＞ 失敗"
  end

  def check_roll(string, nick_e)
    output = "1"

    return '1' unless (m = /(^|\s)S?(3[rR]6([\+\-\d]+)?(\[(\d+),(\d+)\])(([>=]+)(\d+))?)(\s|$)/i.match(string))

    string = m[2]
    mod = 0
    abl = 1
    skl = 1
    signOfInequality = ""
    diff = 0

    mod = parren_killer("(0#{m[3]})").to_i if m[3]

    if m[4]
      abl = m[5].to_i
      skl = m[6].to_i
    end

    if m[7]
      signOfInequality = marshalSignOfInequality(m[8])
      diff = m[9].to_i
    end

    total, out_str = get_dice(mod, abl, skl)
    output = "#{nick_e}: (#{string}) ＞ #{out_str}"

    if signOfInequality != "" # 成功度判定処理
      output += check_suc(total, 0, signOfInequality, diff, 3, 6, 0, 0)
    end

    return output
  end

  def get_dice(mod, abl, skl)
    total = 0
    crit = 0
    fumble = 0
    dice_c = 3 + mod.abs

    dummy = roll(dice_c, 6, 1)

    dummy.shift
    dice_str = dummy.shift

    dice_arr = dice_str.split(/,/).collect { |i| i.to_i }

    3.times do |i|
      ch = dice_arr[i]

      if mod < 0
        ch = dice_arr[dice_c - i - 1]
      end

      total += 1 if ch <= abl
      total += 1 if ch <= skl
      crit += 1 if ch <= 2
      fumble += 1 if ch >= 5
    end

    resultText = ""

    if crit >= 3
      resultText = " ＞ クリティカル"
      total = 6 + skl
    end

    if fumble >= 3
      resultText = " ＞ ファンブル"
      total = 0
    end

    output = "#{total}[#{dice_str}]#{resultText}"

    return total, output
  end

  def rollDiceCommand(command)
    case command
    when /BT(\d+)?/i
      dice = Regexp.last_match(1)
      dice ||= 1
      return get_horidasibukuro_table(dice)
    end

    return nil
  end

  # ** 掘り出し袋表
  def get_horidasibukuro_table(dice)
    output = '1'

    material_kind = [ # 2D6
      "蟲甲",     # 5
      "金属",     # 6
      "金貨",     # 7
      "植物",     # 8
      "獣皮",     # 9
      "竜鱗",     # 10
      "レアモノ", # 11
      "レアモノ", # 12
    ]

    magic_stone = [ # 1D3
      "火炎石",
      "雷撃石",
      "氷結石",
    ]

    num1, = roll(2, 6)
    num2, = roll(dice, 6)

    debug('dice', dice)
    debug('num1', num1)
    debug('num2', num2)

    if num1 <= 4
      num2, = roll(1, 6)
      magic_stone_result = (magic_stone[(num2 / 2).to_i - 1])
      output = "《#{magic_stone_result}》を#{dice}個獲得"
    elsif num1 == 7
      output = "《金貨》を#{num2}枚獲得"
    else
      type = material_kind[num1 - 5]

      if num2 <= 3
        output = "《#{type} I》を1個獲得"
      elsif num2 <= 5
        output = "《#{type} I》を2個獲得"
      elsif num2 <= 7
        output = "《#{type} I》を3個獲得"
      elsif num2 <= 9
        output = "《#{type} II》を1個獲得"
      elsif num2 <= 11
        output = "《#{type} I》を2個《#{type} II》を1個獲得"
      elsif num2 <= 13
        output = "《#{type} I》を2個《#{type} II》を2個獲得"
      elsif num2 <= 15
        output = "《#{type} III》を1個獲得"
      elsif num2 <= 17
        output = "《#{type} II》を2個《#{type} III》を1個獲得"
      else
        output = "《#{type} II》を2個《#{type} III》を2個獲得"
      end
    end

    if output != '1'
      output = "掘り出し袋表[#{num1},#{num2}] ＞ #{output}"
    end

    return output
  end
end
