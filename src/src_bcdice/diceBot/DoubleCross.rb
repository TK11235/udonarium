# -*- coding: utf-8 -*-

class DoubleCross < DiceBot
  setPrefixes(['(\d+dx|ET)'])

  def initialize
    super
    @sendMode = 2
    @sortType = 2
    @isPrintMaxDice = true      #最大値表示
    @upplerRollThreshold = 10     #上方無限
    @unlimitedRollDiceType = 10   #無限ロールのダイス
    @rerollNumber = 10     #振り足しする条件
  end

  def gameName
    'ダブルクロス2nd,3rd'
  end

  def gameType
    "DoubleCross"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定コマンド　(xDX+y@c or xDXc+y)
　"(個数)DX(修正)@(クリティカル値)"もしくは"(個数)DX(クリティカル値)(修正)"で指定します。
　加算減算のみ修正値も付けられます。
　内部で読み替えています。
　例）10dx　　　10dx+5@8(OD tool式)　　　5DX7+7-3(疾風怒濤式)

・各種表
　・感情表(ET)
　　ポジティブとネガティブの両方を振って、表になっている側に○を付けて表示します。もちろん任意で選ぶ部分は変更して構いません。

・D66ダイスあり
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    return string unless(/(\d+)DX/i =~ string)

    debug("DoubleCross parren_killer_add string", string)

    string = string.gsub(/(\d+)DX(\d*)([^\d\s][\+\-\d]+)/i) {"#{$1}R10#{$3}[#{$2}]"}
    string = string.gsub(/(\d+)DX(\d+)/i) {"#{$1}R10[#{$2}]"}
    string = string.gsub(/(\d+)DX([^\d\s][\+\-\d]+)/i) {"#{$1}R10#{$2}"}
    string = string.gsub(/(\d+)DX/i) {"#{$1}R10"}
    if(/\@(\d+)/ =~ string)
      crit = $1
      string = string.gsub(/\[\]/) {"\[#{crit}\]"}
      string = string.gsub(/\@(\d+)/, "")
    end
    string = string.gsub(/\[\]/, "")

    debug("DoubleCross parren_killer_add changed string", string)

    return string
  end

  def dice_command_xRn(string, nick_e)
    output_msg = check_dice(string)
    return nil if( output_msg.nil? )

    return "#{nick_e}: #{output_msg}"
  end

  def check_nD10(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)# ゲーム別成功度判定(nD10)
    return '' unless( signOfInequality == ">=" )

    if(n1 >= dice_cnt)
      return " ＞ ファンブル"
    elsif(total_n >= diff)
      return" ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end

  # 振り足し時のダイス読み替え処理用（ダブルクロスはクリティカルでダイス10に読み替える)
  def getJackUpValueOnAddRoll(dice_n, round)
    return (10 - dice_n)
  end

  # 個数振り足しダイスロール
  def check_dice(string)

    debug("dxdice begin string", string)

    dice_cnt = 0
    dice_max = 0
    round = 0
    total_n = 0
    signOfInequality = ""
    diff = 0
    output = ""
    output2 = ""
    next_roll = 0

    string = string.gsub(/-[\d]+[rR][\d]+/, '')    # 振り足しロールの引き算している部分をカット

    unless(/(^|\s)[sS]?([\d]+[rR][\d\+\-rR]+)(\[(\d+)\])?(([<>=]+)(\d+))?($|\s)/ =~ string)
      debug("invaid string", string)
      return nil
    end

    string = $2

    critical = $4
    critical ||= rerollNumber
    critical = critical.to_i

    debug("critical", critical)

    if( critical <= 1 )
      return "クリティカル値が低すぎます。2以上を指定してください。"
    end

    #TKfix メソッドをまたぐと$xの中身がnilになっている
    if( not $5.nil? )
      diff = $7.to_i
      signOfInequality = marshalSignOfInequality($6)
      #diff = $7.to_i
    elsif( defaultSuccessTarget != "" )
      if( /([<>=]+)(\d+)/ =~ defaultSuccessTarget )
        diff = $2.to_i
        signOfInequality = marshalSignOfInequality($1)
        #diff = $2.to_i
      end
    end

    dice_cmd = []
    dice_bns = []

    dice_a = string.split(/\+/)
    dice_a.each do |dice_o|
      if(/[Rr]/ =~ dice_o)
        if(/-/ =~ dice_o )
          dice_wk = dice_o.split(/-/)
          dice_cmd.push(dice_wk.shift )
          dice_bns.push( "0-" + dice_wk.join("-") )
        else
          dice_cmd.push( dice_o )
        end
      else
        dice_bns.push( dice_o )
      end
    end

    bonus_str = dice_bns.join("+")
    bonus_ttl = 0
    bonus_ttl = parren_killer( "(#{bonus_str})").to_i if(bonus_str != "")

    numberSpot1 = 0
    dice_cnt_total =0

    dice_cmd.each do |dice_o|
      subtotal = 0
      dice_cnt, dice_max = dice_o.split(/[rR]/).collect{|s|s.to_i}
      dice_dat = roll(dice_cnt, dice_max, (sortType & 2), 0, "", 0, critical)
      output += "," if(output != "")
      next_roll += dice_dat[6]
      numberSpot1 += dice_dat[2]
      dice_cnt_total += dice_cnt
      if(dice_dat[6] > 0)   # リロール時の特殊処理
        if(dice_max == 10)
          subtotal = 10
        else             # 特殊処理無し(最大値)
          subtotal = dice_dat[4]
        end
      else
        subtotal = dice_dat[4]
      end
      output += "#{subtotal}[#{dice_dat[1]}]"
      total_n += subtotal
    end

    round = 0

    if(next_roll > 0)
      dice_cnt = next_roll
      loop do
        subtotal = 0
        output2 += "#{output}+"
        output = ""
        dice_dat = roll(dice_cnt, dice_max, (sortType & 2), 0, "", 0, critical)
        round += 1
        #               numberSpot1 += dice_dat[2]
        dice_cnt_total += dice_cnt
        dice_cnt = dice_dat[6]
        if(dice_dat[6] > 0)   # リロール時の特殊処理
          if(dice_max == 10)
            subtotal = 10
          else             # 特殊処理無し(最大値)
            subtotal = dice_dat[4]
          end
        else
          subtotal = dice_dat[4]
        end
        output += "#{subtotal}[#{dice_dat[1]}]"
        total_n += subtotal

        #break unless ( @@bcdice.isReRollAgain(dice_cnt, round) ) # TKfix @@bcdice が参照できない (Opal 0.11.4)
        break unless ( bcdice.isReRollAgain(dice_cnt, round) ) # TKfix @@bcdice が参照できない (Opal 0.11.4)
      end
    end

    total_n += bonus_ttl
    if(bonus_ttl > 0)
      output = "#{output2}#{output}+#{bonus_ttl} ＞ #{total_n}"
    elsif(bonus_ttl < 0)
      output = "#{output2}#{output}#{bonus_ttl} ＞ #{total_n}"
    else
      output = "#{output2}#{output} ＞ #{total_n}"
    end

    string += "[#{critical}]"
    string += "#{signOfInequality}#{diff}" if(signOfInequality != "")
    output = "(#{string}) ＞ #{output}"
    if(output.length > $SEND_STR_MAX)    # 長すぎたときの救済
      output = "(#{string}) ＞ ... ＞ 回転数#{round} ＞ #{total_n}"
    end

    if(signOfInequality != "")   # 成功度判定処理
      output += check_suc(total_n, 0, signOfInequality, diff, dice_cnt_total, dice_max, numberSpot1, 0)
    else     # 目標値無し判定
      if(round <= 0)
        if(dice_max == 10)
          if(numberSpot1 >= dice_cnt_total)
            output += " ＞ ファンブル"
          end
        end
      end
    end

    return output
  end

  def rollDiceCommand(command)
    get_emotion_table()
  end

  #** 感情表
  def get_emotion_table()
    output = nil

    pos_dice, pos_table = dx_feel_positive_table
    neg_dice, neg_table = dx_feel_negative_table
    dice_now, = roll(1, 2)

    if(pos_table != '1' and neg_table != '1')
      if(dice_now < 2)
        pos_table = "○" + pos_table
      else
        neg_table = "○" + neg_table
      end
      output = "感情表(#{pos_dice}-#{neg_dice}) ＞ #{pos_table} - #{neg_table}"
    end

    return output
  end

  #** 感情表（ポジティブ）
  def dx_feel_positive_table
    table = [
      [0, '傾倒(けいとう)'],
      [5, '好奇心(こうきしん)'],
      [10, '憧憬(どうけい)'],
      [15, '尊敬(そんけい)'],
      [20, '連帯感(れんたいかん)'],
      [25, '慈愛(じあい)'],
      [30, '感服(かんぷく)'],
      [35, '純愛(じゅんあい)'],
      [40, '友情(ゆうじょう)'],
      [45, '慕情(ぼじょう)'],
      [50, '同情(どうじょう)'],
      [55, '遺志(いし)'],
      [60, '庇護(ひご)'],
      [65, '幸福感(こうふくかん)'],
      [70, '信頼(しんらい)'],
      [75, '執着(しゅうちゃく)'],
      [80, '親近感(しんきんかん)'],
      [85, '誠意(せいい)'],
      [90, '好意(こうい)'],
      [95, '有為(ゆうい)'],
      [100, '尽力(じんりょく)'],
      [101, '懐旧(かいきゅう)'],
      [102, '任意(にんい)'],
    ]

    return dx_feel_table( table )
  end

  #** 感情表（ネガティブ）
  def dx_feel_negative_table
    table = [
      [0, '侮蔑(ぶべつ)'],
      [5, '食傷(しょくしょう)'],
      [10, '脅威(きょうい)'],
      [15, '嫉妬(しっと)'],
      [20, '悔悟(かいご)'],
      [25, '恐怖(きょうふ)'],
      [30, '不安(ふあん)'],
      [35, '劣等感(れっとうかん)'],
      [40, '疎外感(そがいかん)'],
      [45, '恥辱(ちじょく)'],
      [50, '憐憫(れんびん)'],
      [55, '偏愛(へんあい)'],
      [60, '憎悪(ぞうお)'],
      [65, '隔意(かくい)'],
      [70, '嫌悪(けんお)'],
      [75, '猜疑心(さいぎしん)'],
      [80, '厭気(いやけ)'],
      [85, '不信感(ふしんかん)'],
      [90, '不快感(ふかいかん)'],
      [95, '憤懣(ふんまん)'],
      [100, '敵愾心(てきがいしん)'],
      [101, '無関心(むかんしん)'],
      [102, '任意(にんい)'],
    ]

    return dx_feel_table( table )
  end

  def dx_feel_table(table)
    dice_now, = roll(1, 100)
    output = get_table_by_number(dice_now, table)

    return dice_now, output
  end
end
