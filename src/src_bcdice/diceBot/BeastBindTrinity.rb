# -*- coding: utf-8 -*-

class BeastBindTrinity < DiceBot
  setPrefixes(['\d+BB', 'EMO', 'EXPO_.', 'FACE_.'])

  # ●前ver(1.43.07)からの変更・修正
  # ・nBBで判定を行う際、「ダイスを１個しか振らない場合」の達成値計算が正しくなかった誤りを修正。
  # ・@x(クリティカル値指定)、を加減式で入力できるように仕様変更。クリティカル値は、加減式での入力なら%w(人間性からのクリティカル値計算)と併用可能に。
  # ・#y(ファンブル値指定)を加減式で入力できるように仕様変更。また、「ファンブルしても達成値が0にならない」モード#Ayを追加。
  # ・&v(出目v未満のダイスを出目vとして扱う)のモードを追加。2018年12月現在、ゲーマーズ・フィールド誌先行収録データでのみ使用するモードです。
  # ・「暴露表」および「正体判明チャート」をダイスボットに組み込み。
  # ・どどんとふ以外のボーンズ＆カーズを用いたオンラインセッション用ツールにあわせ、ヘルプメッセージ部分からイニシアティブ表についての言及を削除。

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
・判定　(nBB+m%w@x#y$z&v)
　n個のD6を振り、出目の大きい2個から達成値を算出。修正mも可能。
　
　%w、@x、#y、$z、&vはすべて省略可能。
＞%w：現在の人間性が w であるとして、クリティカル値(C値)を計算。
・省略した場合、C値=12として達成値を算出する。
＞@x：クリティカル値修正。（加減式でも入力可能）
・xに直接数字を書くと、C値をその数字に上書きする。
　「絶対にクリティカルしない」状態は、@13など xを13以上に指定すること。
・xの先頭が「+」か「-」なら、計算したC値にその値を加算。例）@-1、@+2
　この方法でC値をプラスする場合、上限は12となる。
＞#y、#Ay：ファンブル値修正。（加減式でも入力可能）
・yに直接数字を書くと、ファンブル値をその数字に設定。
・yの数字の先頭が「+」か「-」なら、ファンブル値=2にその数字を加算。例）#+2
・※#Ayとすると、ファンブルしても達成値を通常通り算出。　例）#A+1
＞$z：ダイスの出目をzに固定して判定する。複数指定可。
　　　《運命歪曲》など「ダイスの１個を振り直す」効果等に使用する。
　例）2BB$1 →ダイスを2個振る判定で、ダイス1個の出目を1で固定
　例）2BB$16→ダイスを2個振る判定で、ダイスの出目を1と6で固定
＞&v：出目がv未満のダイスがあれば、出目がvだったものとして達成値を計算する。
　例）2BB&3 →出目3未満（→出目1、2）を出目3だったものとして計算。

・D66ダイスあり
・邂逅表：EMO
・暴露表：EXPO_A　　・魔獣化暴露表：EXPO_B
・アイドル専用暴露表：EXPO_I
・アイドル専用魔獣化暴露表：EXPO_J
・正体判明チャートA～C：FACE_A、FACE_B、FACE_C
INFO_MESSAGE_TEXT
  end

  def changeText(string)
    string = string.gsub(/(\d+)BB6/i) { "#{$1}R6" }
    string = string.gsub(/(\d+)BB/i)  { "#{$1}R6" }
    string = string.gsub(/(\d+)BF6/i) { "#{$1}Q6" }
    string = string.gsub(/(\d+)BF/i)  { "#{$1}Q6" }
    string = string.gsub(/\%([\-\d]+)/i) { "[H:#{$1}]" }
    string = string.gsub(/\@([\+\-\d]+)/i) { "[C#{$1}]" }
    string = string.gsub(/\#([A]?[\+\-\d]+)/i) { "[F#{$1}]" }
    string = string.gsub(/\$([1-6]+)/i) { "[S#{$1}]" }
    string = string.gsub(/\&(\d)/i) { "[U#{$1}]" }
    return string
  end

  def dice_command_xRn(string, nick_e)
    @nick = nick_e
    return bbt_check(string)
  end

  def check_2D6(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max) # ゲーム別成功度判定(2D6)
    return '' unless signOfInequality == ">="

    if total_n >= diff
      return " ＞ 成功"
    else
      return " ＞ 失敗"
    end
  end

  ####################           ビーストバインド トリニティ         ########################

  def bbt_check(string)
    output = "1"

    debug("bbt string", string)
    unless (m = /(^|\s)S?((\d+)R6([\+\-\d]*)(\[H:([\-\d]+)\])?(\[C([\+\-\d]+)\])?(\[F(A)?([\+\-\d]+)\])?(\[S([1-6]+)\])?(\[U([1-6])\])?(([>=]+)(\d+))?)(\s|$)/i.match(string))
      debug("not mutch")
      return output
    end

    # 各種値の初期設定
    humanity = 99          # 人間性（ゲームプレイ中の上限は60）
    critical = 12          # クリティカル値（基本値=12）
    fumble   =  2          # ファンブル値（基本値=2）
    dicesubs = []          # 出目を固定して振る場合の出目予約
    nofumble = false        # ファンブルしても達成値が0にならないモードかどうかの判別
    dicepull = false        # 「出目●未満のダイス」を出目●として扱うモードが有効かどうかの判別
    pul_flg  = false        # 出目引き上げ機能が適用されたかどうかの確認

    # 各種文字列の取得
    string    = m[2] # ダイスボットで読み込んだ判定文全体
    dice_c    = m[3].to_i # 振るダイス数の取得
    bonus     = 0 # 修正値の取得
    signOfInequality = ""	# 判定結果のための不等号
    diff      = 0 # 難易度
    bonusText = m[4] # 修正値の取得
    bonus     = parren_killer("(0" + bonusText + ")").to_i unless bonusText.nil?

    if m[5]
      humanity = m[6].to_i if m[6] # 人間性からクリティカル値を取得
      debug("▼現在人間性 取得 #{humanity}")
      if humanity <= 0
        critical = 9
        debug("▼現在人間性からC値取得 #{critical}")
      elsif humanity <= 20
        critical = 10
        debug("▼現在人間性からC値取得 #{critical}")
      elsif humanity <= 40
        critical = 11
        debug("▼現在人間性からC値取得 #{critical}")
      end
    end

    if m[7]
      str_critical = m[8] if m[8] # クリティカル値の文字列を取得
      debug("▼C値文字列 取得 #{str_critical}")
    end

    if m[9]
      nofumble = true if m[10] # ファンブル耐性指定
      debug("▼F値耐性 #{nofumble}")
      str_fumble = m[11] if m[11]    # ファンブル値の文字列を取得
      debug("▼F値文字列 取得 #{str_fumble}")
    end

    if m[12]
      str_dicesubs = m[13] if m[13]  # ダイス差し替え用の文字列を取得
      debug("▼出目予約用の文字列 取得 #{str_dicesubs}")
    end

    if m[14]
      dicepull = m[15].to_i if m[15] # ダイス引き上げ用の文字列を取得
      debug("▼出目引き上げモード 取得 #{dicepull}")
    end

    signOfInequality = m[17] if m[17]
    diff = m[18].to_i if m[18]

    # 数値・数式からクリティカル値を決定
    if str_critical
      n_cri = 0
      str_critical.scan(/[\+\-]?\d+/).each do |num|
        n_cri += num.to_i
      end
      debug("▼C値指定符 算出 #{n_cri}")
      critical = str_critical.match(/^[\+\-][\+\-\d]+/) ? [critical + n_cri, 12].min : n_cri
      debug("▼クリティカル値 #{critical}")
    end

    # 数値・数式からファンブル値を決定
    if str_fumble
      n_fum = 0
      str_fumble.scan(/[\+\-]?\d+/).each do |num|
        n_fum += num.to_i
      end
      debug("▼F値指定符 算出 #{n_fum}")
      fumble = str_fumble.match(/^[\+\-][\+\-\d]+/) ? fumble + n_fum : n_fum
      debug("▼ファンブル値 #{fumble}")
    end

    # 出目予約の有無を確認
    if str_dicesubs
      for i in str_dicesubs.split(//) do dicesubs.push(i.to_i) if dicesubs.size < dice_c end
      debug("▼ダイス出目予約 #{dicesubs}")
    end

    dice_now = 0
    dice_str = ""
    n_max = 0
    total_n = 0

    cri_flg   = false
    cri_bonus = 0
    fum_flg   = false
    rer_num = []

    dice_tc = dice_c - dicesubs.size

    if dice_tc > 0
      _, dice_str, = roll(dice_tc, 6, (sortType & 1)) # ダイス数修正、並べ替えせずに出力
      dice_num = (dice_str.split(/,/) + dicesubs).collect { |n| n.to_i }	# 差し換え指定のダイスを挿入
    elsif dicesubs.size == 0
      return "ERROR:振るダイスの数が0個です"
    else
      dice_num = dicesubs # 差し換えのみの場合は差し換え指定のみ（ダイスを振らない）
    end

    dice_num.sort! # 並べ替え

    if dicepull # 出目引き上げ機能
      debug("▼出目引き上げ #{dicepull}")
      dice_num_old = dice_num.dup
      for i in 0...dice_num.size do dice_num[i] = [dice_num[i], dicepull].max end
      pul_flg = dice_num == dice_num_old ? false : true
      debug("▼出目引き上げの有無について #{pul_flg}")

      dice_num.sort! # 置換後、再度並べ替え
      dold_str = dice_num_old.join(",")	# 置換前のダイス一覧を作成
    end

    dice_str = dice_num.join(",")	# dice_strの取得
    if dice_c == 1
      dice_now = dice_num[dice_c - 1] # ダイス数が1の場合、通常の処理だと配列の引数が「0」と「-1」となって二重に計算されるので処理を変更
    else
      dice_now = dice_num[dice_c - 2] + dice_num[dice_c - 1] # 判定の出目を確定
    end

    if dice_now >= critical # クリティカル成立の判定
      cri_flg = true
      cri_bonus = 20
    end

    total_n = [dice_now + bonus + cri_bonus, 0].max # 達成値の最小値は0

    if fumble >= dice_now # ファンブル成立の判定
      fum_flg = true
      total_n = 0 unless nofumble
    end

    dice_str = "[#{dice_str}]"

    # 表示文章の作成
    output = ""

    if pul_flg
      output += "[#{dold_str}] ＞ "
    end

    output += "#{dice_now}#{dice_str}"

    if fum_flg == true && nofumble == false
      output += "【ファンブル】"
    else
      output += "【ファンブル】" if fum_flg
      if bonus > 0
        output += "+#{bonus}"
      elsif bonus < 0
        output += bonus.to_s
      end
      output += "+#{cri_bonus}【クリティカル】" if cri_flg
    end

    showstring = "#{dice_c}R6"	# 結果出力文におけるダイスロール式の作成
    if bonus > 0 # （結果出力の時に必ずC値・F値を表示するようにする）
      showstring += "+#{bonus}"
    elsif bonus < 0
      showstring += bonus.to_s
    end
    showstring += "[C#{critical},F#{fumble}]"
    if signOfInequality != ""
      showstring += "#{signOfInequality}#{diff}"
    end

    if sendMode > 0 # 出力文の完成
      if /[^\d\[\]]+/ =~ output
        output = "#{@nick_e}: (#{showstring}) ＞ #{output} ＞ #{total_n}"
      else
        output = "#{@nick_e}: (#{showstring}) ＞ #{total_n}"
      end
    else
      output = "#{@nick_e}: (#{showstring}) ＞ #{total_n}"
    end

    if signOfInequality != "" # 成功度判定処理
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
    when /^EMO/i
      type = '邂逅表'
      output, total_n = bbt_emotion_table

    # 暴露表
    when /^EXPO_([ABIJ])/
      case $1
      when /A/
        type = '暴露表'
        tabletype = 1
      when /B/
        type = '魔獣化暴露表'
        tabletype = 2
      when /I/
        type = 'アイドル専用暴露表'
        tabletype = 3
      when /J/
        type = 'アイドル専用魔獣化暴露表'
        tabletype = 4
      end
      output, total_n = bbt_exposure_table(tabletype)

    # 正体判明チャート
    when /^FACE_([ABC])/
      case $1
      when /A/
        type = '正体判明チャートA'
        tabletype = 1
      when /B/
        type = '正体判明チャートB'
        tabletype = 2
      when /C/
        type = '正体判明チャートC'
        tabletype = 3
      end
      output, total_n = bbt_face_table(tabletype)

    end

    if output != '1'
      output = "#{type}(#{total_n}) ＞ #{output}"
    end

    return output
  end

  # **邂逅表(d66)
  def bbt_emotion_table
    table = [
      '家族',      '家族',      '信頼',      '信頼',      '忘却',      '忘却',
      '慈愛',      '慈愛',      '憧憬',      '憧憬',      '感銘',      '感銘',
      '同志',      '同志',      '幼子',      '幼子',      '興味',      '興味',
      'ビジネス', 'ビジネス', '師事', '師事', '好敵手', '好敵手',
      '友情',      '友情',      '忠誠',      '忠誠',      '恐怖',      '恐怖',
      '執着',      '執着',      '軽蔑',      '軽蔑',      '憎悪',      '憎悪',
    ]

    return get_table_by_d66(table)
  end

  # **暴露表（暴露表、魔獣化暴露表、アイドル専用暴露表、アイドル専用魔獣化暴露表）
  def bbt_exposure_table(type)
    case type
      # 暴露表
    when 1
      table = [
        '噂になるがすぐ忘れられる',
        '都市伝説として処理される',
        'ワイドショーをにぎわす',
        'シナリオ中［迫害状態］になる',
        '絆の対象ひとりに正体が知られる',
        '魔獣化暴露表へ'
      ]
      # 魔獣化暴露表
    when 2
      table = [
        'トンデモ業界の伝説になる',
        'シナリオ中［迫害状態］になる',
        'シナリオ中［迫害状態］になる',
        '絆の対象ひとりに正体が知られる',
        '絆の対象ひとりに正体が知られる',
        '自衛隊退魔部隊×2D6体の襲撃'
      ]
      # アイドル専用暴露表
    when 3
      table = [
        '愉快な伝説として人気になる',
        'ワイドショーをにぎわす',
        '炎上。シナリオ中［迫害状態］',
        '所属事務所に2D6時間説教される',
        '絆の対象ひとりに正体が知られる',
        'アイドル専用魔獣化暴露表へ'
      ]
      # アイドル専用魔獣化暴露表
    when 4
      table = [
        'シナリオ中［迫害状態］になる',
        'シナリオ中［迫害状態］になる',
        '絆の対象ひとりに正体が知られる',
        '事務所から契約を解除される',
        '絆の対象ひとりに正体が知られる',
        '1D6本のレギュラー番組を失う'
      ]
    end
    return get_table_by_1d6(table)
  end

  # **正体判明チャート（正体判明チャートA～C）
  def bbt_face_table(type)
    case type
      # 正体判明チャートA
    when 1
      table = [
        'あなたを受け入れてくれる',
        'あなたを受け入れてくれる',
        '絆が（拒絶）に書き換わる',
        '絆がエゴに書き換わる',
        '気絶しその事実を忘れる',
        '精神崩壊する'
      ]
      # 正体判明チャートB
    when 2
      table = [
        'あなたを受け入れてくれる',
        '狂乱し攻撃してくる',
        '退場。その場から逃亡。暴露表へ',
        '絆がエゴに書き換わる',
        '精神崩壊する',
        '精神崩壊する'
      ]
      # 正体判明チャートC
    when 3
      table = [
        'あなたを受け入れてくれる',
        '退場。その場から逃亡。暴露表へ',
        '退場。その場から逃亡。暴露表へ',
        '絆がエゴに書き換わる',
        '精神崩壊する',
        '精神崩壊する'
      ]
    end
    return get_table_by_1d6(table)
  end
end
