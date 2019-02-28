# -*- coding: utf-8 -*-

class BeastBindTrinity < DiceBot
  setPrefixes(['\d+BB', 'EMO'])

#●前ver(1.43.01)からの変更・修正
#・「達成値の下限が０になっていない」ルール上の見落としを修正。
#・機能に%w、$zの追加。
#・結果表示の式の形を変形し、C値・F値を常に表示するように変更。
#・機能追加に伴い説明文が長くなったので、邂逅表以外の各種表を削除。

  def initialize
    super
    @sendMode = 2
    @sortType = 0
    @d66Type = 2
  end
  def gameName
    'ビーストバインド トリニティ'
  end

  def gameType
    "BeastBindTrinity"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・判定　(nBB+m%w@x#y$z)
　n個のD6を振り、出目の大きい2個から達成値を算出。修正mも可能。
　＞%wは「現在の人間性が w」であることを表し、省略可能。
　　これを入力すると、人間性からクリティカル値を自動計算します。
　＞@xは「クリティカル値が x」であることを表し、省略可能。
　　%wと@xを両方とも指定した場合、@xのクリティカル値指定が優先されます。
　＞#yは「ファンブル値が y」であることを表し、省略可能。
　＞$zは、ダイスの出目をその数値に固定して判定を行う。複数指定可、省略可能。
　　例）2BB$1→ダイスを2個振る判定で、ダイス1個の出目を1で固定
　　例）2BB$16→ダイスを2個振る判定で、ダイス2個の出目を1と6で固定
　＞クリティカル値（または%wの指定）を省略した場合は「12」として、
　　ファンブル値を省略した場合は「2」として達成値を計算します。

※%wの機能は、イニシアティブ表に「人間性」の項目を用意しておき、
　「nBB+m%{人間性}」のチャットパレットを作成して使う事を想定しています。

・邂逅表　EMO
・D66ダイスあり
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/(\d+)BB6/i) {"#{$1}R6"}
    string = string.gsub(/(\d+)BB/i)  {"#{$1}R6"}
    string = string.gsub(/\%([\-\d]+)/i)  {"[H:#{$1}]"}
    string = string.gsub(/\@(\d+)/i)  {"[C#{$1}]"}
    string = string.gsub(/\#(\d+)/i)  {"[F#{$1}]"}
    string = string.gsub(/\$(\d+)/i)  {"[S#{$1}]"}
    return string
  end

  def dice_command_xRn(string, nick_e)
    @nick = nick_e
    return bbt_check(string)
  end

  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)  # ゲーム別成功度判定(2D6)
    return '' unless(signOfInequality == ">=")

    if(total_n >= diff)
      return " ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end

  ####################           ビーストバインド トリニティ         ########################

  def bbt_check(string)
    output = "1"

    debug("bbt string", string)
    unless(/(^|\s)S?((\d+)[rR]6([\+\-\d]*)(\[H:([\-\d]+)\])?(\[C(\d+)\])?(\[F(\d+)\])?(\[S(\d+)\])?(([>=]+)(\d+))?)(\s|$)/i =~ string)
      debug("not mutch")
      return output
    end

    #TKfix メソッドをまたぐと$xの中身がnilになっている
    reg1 = $1
    reg2 = $2
    reg3 = $3
    reg4 = $4
    reg5 = $5
    reg6 = $6
    reg7 = $7
    reg8 = $8
    reg9 = $9
    reg10 = $10
    reg11 = $11
    reg12 = $12
    reg13 = $13
    reg14 = $14
    reg15 = $15

    string = reg2#$2
    dice_c = reg3.to_i#$3.to_i
    bonus = 0
    signOfInequality = ""
    diff = 0

    bonusText = reg4#$4
    bonus = parren_killer("(0" + bonusText + ")").to_i unless( bonusText.nil? )

    cri = 12					# クリティカル値の基本値は12。C値以上の出目が出た場合、達成値+20（クリティカル）。
    fum =  2					# ファンブル値の基本値は2。F値以下の出目が出た場合、達成値が0で固定される（ファンブル）。
    humanity = 99				# 指定されていない時のために人間性を仮代入。データ上、60を超える事はない

    # 指定された人間性からクリティカル値を自動算出する
    #if($5)
    if(reg5)
      humanity = reg6.to_i if(reg6) #$6.to_i if($6)
      if humanity <= 0			# 変異第三段階（人間性 0以下）：クリティカル値 9
        cri =  9
      elsif humanity <= 20		# 変異第二段階（人間性20以下）：クリティカル値10
        cri = 10
      elsif humanity <= 40		# 変異第一段階（人間性40以下）：クリティカル値11
        cri = 11
      else						# 変異なし：クリティカル値12
        cri = 12
      end
    end

    # クリティカル値の指定		# 人間性からのC値自動計算より優先される
    #if($7)
    if(reg7)
      cri = reg8.to_i if(reg8)#$8.to_i if($8)
    end

    # ファンブル値の指定		# F値は、アーツやアイテムの効果によってのみ変化するため、手動で入力させる
    #if($9)
    if(reg9)
      fum = reg10.to_i if(reg10)#$10.to_i if($10)
    end

    # 出目差し換えの指定		# 《運命歪曲》等の「ダイスを１個選んで振り直す」アーツや、
    rer = 0						# 《勝利の旗印》等の「ダイスを１個選んで出目を書き換える」アーツの達成値再計算に使用する機能
    #if($11)
    if(reg11)
      rer = reg12.to_i if(reg12)#$12.to_i if($12)
    end

    signOfInequality = reg14 if(reg14)#$14 if($14)
    diff = reg15 if(reg15)#$15.to_i if($15)
    dice_now = 0
    dice_str = ""
    total_n = 0

    cri_flg   = false
    cri_bonus = 0
    fum_flg   = false
    rer_num  = []

    # 出目差し換えが入力されている場合の処理
    # 1～6以外の数字や、差し替えるダイス数が振るダイス数をオーバーしている場合は無視する
    if(rer > 0)
      rer_ary = rer.to_s.split(//).collect{|i|i.to_i}
      for i in rer_ary do rer_num.push(i) if([1,2,3,4,5,6].include?(i) && rer_num.size < dice_c) end
    end

    dice_tc = dice_c - rer_num.size

    if(dice_tc > 0)
      _, dice_str, = roll(dice_tc, 6, (sortType & 1))			# ダイス数修正、並べ替えせずに出力
      dice_num = (dice_str.split(/,/) + rer_num).collect{|n|n.to_i} # 差し換え指定のダイスを挿入
    elsif(rer_num.size == 0)
      return "ERROR:振るダイスの数が0個です"
    else
      dice_num = rer_num											# 差し換えのみの場合は差し換え指定のみ（ダイスを振らない）
    end

    dice_num.sort!													# 並べ替え
    dice_str = dice_num.join(",")									# dice_strの取得
    dice_now = dice_num[dice_c - 2] + dice_num[dice_c - 1]			# 判定の出目を確定

    if(dice_now >= cri)												# クリティカル成立の判定
      cri_flg = true
      cri_bonus = 20
    end

    total_n = [dice_now + bonus + cri_bonus, 0].max				# 達成値の最小値は0

    if(fum >= dice_now)												# ファンブル成立の判定
      fum_flg = true
      total_n = 0
    end

    dice_str = "[#{dice_str}]"

    if(fum_flg == true)												# 結果出力文の作成
      output = "#{dice_now}#{dice_str}【ファンブル】"
    else
      output = "#{dice_now}#{dice_str}"
      if(bonus > 0)
        output += "+#{bonus}"
      elsif(bonus < 0)
        output += "#{bonus}"
      end
      if(cri_flg == true)
        output += "+#{cri_bonus}【クリティカル】"
      end
    end

    showstring = "#{dice_c}R6"										# 結果出力文におけるダイスロール式の作成
    if(bonus > 0)													# （結果出力の時に必ずC値・F値を表示するようにする）
      showstring += "+#{bonus}"
    elsif(bonus < 0)
      showstring += "#{bonus}"
    end
    showstring += "[C#{cri},F#{fum}]"
    if(signOfInequality != "")
      showstring += "#{signOfInequality}#{diff}"
    end

    if(sendMode > 0)												# 出力文の完成
      if(/[^\d\[\]]+/ =~ output)
        output = "#{@nick_e}: (#{showstring}) ＞ #{output} ＞ #{total_n}"
      else
        output = "#{@nick_e}: (#{showstring}) ＞ #{total_n}"
      end
    else
      output = "#{@nick_e}: (#{showstring}) ＞ #{total_n}"
    end

    if(signOfInequality != "")  # 成功度判定処理
      output += check_suc(total_n, dice_now, signOfInequality, diff, 2, 6, 0, 0)
    end

    return output
  end

  ####################           ビーストバインド トリニティ          ########################
  def rollDiceCommand(command)
    output = '1'
    type = ""
    total_n = 0

    case command

    # 邂逅表(d66)
    when /EMO/i
      type = '邂逅表'
      output, total_n = bbt_emotion_table
    end

    if(output != '1')
      output = "#{type}(#{total_n}) ＞ #{output}"
    end

    return output
  end

  #**邂逅表(d66)
  def bbt_emotion_table
    table = [
      '家族',      '家族',      '信頼',      '信頼',      '忘却',      '忘却',
      '慈愛',      '慈愛',      '憧憬',      '憧憬',      '感銘',      '感銘',
      '同志',      '同志',      '幼子',      '幼子',      '興味',      '興味',
      'ビジネス',  'ビジネス',  '師事',      '師事',      '好敵手',    '好敵手',
      '友情',      '友情',      '忠誠',      '忠誠',      '恐怖',      '恐怖',
      '執着',      '執着',      '軽蔑',      '軽蔑',      '憎悪',      '憎悪',
    ]

    return get_table_by_d66(table)
  end
end
