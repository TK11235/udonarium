# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Cthulhu7th < DiceBot
  # ゲームシステムの識別子
  ID = 'Cthulhu7th'

  # ゲームシステム名
  NAME = '新クトゥルフ神話TRPG'

  # ゲームシステム名の読みがな
  SORT_KEY = 'しんくとうるふしんわTRPG'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
※コマンドは入力内容の前方一致で検出しています。
・判定　CC(x)<=（目標値）
　x：ボーナス・ペナルティダイス (2～－2)。省略可。
　目標値が無くても1D100は表示される。
　ファンブル／失敗／　レギュラー成功／ハード成功／
　イクストリーム成功／クリティカル を自動判定。
例）CC<=30　CC(2)<=50 CC(+2)<=50 CC(-1)<=75 CC-1<=50 CC1<=65 CC+1<=65 CC

・組み合わせ判定　(CBR(x,y))
　目標値 x と y で％ロールを行い、成否を判定。
　例）CBR(50,20)

・自動火器の射撃判定　FAR(w,x,y,z,d,v)
　w：弾丸の数(1～100）、x：技能値（1～100）、y：故障ナンバー、
　z：ボーナス・ペナルティダイス(-2～2)。省略可。
　d：指定難易度で連射を終える（レギュラー：r,ハード：h,イクストリーム：e）。省略可。
　v：ボレーの弾丸の数を変更する。省略可。
　命中数と貫通数、残弾数のみ算出。ダメージ算出はありません。
例）FAR(25,70,98)　FAR(50,80,98,-1)　far(30,70,99,1,R)
　　far(25,88,96,2,h,5)　FaR(40,77,100,,e,4)　fAr(20,47,100,,,3)

・各種表
　【狂気関連】
　・狂気の発作（リアルタイム）（Bouts of Madness Real Time）　BMR
　・狂気の発作（サマリー）（Bouts of Madness Summary）　BMS
　・恐怖症（Sample Phobias）表　PH／マニア（Sample Manias）表　MA
　【魔術関連】
　・プッシュ時のキャスティング・ロール（Casting Roll）の失敗表
　　強力でない呪文の場合　FCL／強力な呪文の場合　FCM
INFO_MESSAGE_TEXT

  setPrefixes(['CC\(\d+\)', 'CC.*', 'CBR\(\d+,\d+\)', 'FAR.*', 'BMR', 'BMS', 'FCL', 'FCM', 'PH', 'MA'])

  def initialize
    # $isDebug = true
    super

    @bonus_dice_range = (-2..2)
  end

  def rollDiceCommand(command)
    case command
    when /^CC/i
      return getCheckResult(command)
    when /^CBR/i
      return getCombineRoll(command)
    when /^FAR/i
      return getFullAutoResult(command)
    when /^BMR/i # 狂気の発作（リアルタイム）
      return roll_bmr_table()
    when /^BMS/i # 狂気の発作（サマリー）
      return roll_bms_table()
    when /^FCL/i # キャスティング・ロールのプッシュに失敗した場合（小）
      return roll_1d8_table("キャスティング・ロール失敗(小)表", FAILED_CASTING_L_TABLE)
    when /^FCM/i # キャスティング・ロールのプッシュに失敗した場合（大）
      return roll_1d8_table("キャスティング・ロール失敗(大)表", FAILED_CASTING_M_TABLE)
    when /^PH/i # 恐怖症表
      return roll_1d100_table("恐怖症表", PHOBIAS_TABLE)
    when /^MA/i # マニア表
      return roll_1d100_table("マニア表", MANIAS_TABLE)
    else
      return nil
    end
  end

  private

  def roll_1d8_table(table_name, table)
    total_n, = roll(1, 8)
    index = total_n - 1

    text = table[index]

    return "#{table_name}(#{total_n}) ＞ #{text}"
  end

  def roll_1d100_table(table_name, table)
    total_n, = roll(1, 100)
    index = total_n - 1

    text = table[index]

    return "#{table_name}(#{total_n}) ＞ #{text}"
  end

  def getCheckResult(command)
    m = /^CC([-+]?\d+)?(<=(\d+))?/i.match(command)
    unless m
      return nil
    end

    bonus_dice_count = m[1].to_i # ボーナス・ペナルティダイスの個数
    diff = m[3].to_i
    without_compare = m[2].nil? || diff <= 0

    if bonus_dice_count == 0 && diff <= 0
      dice, = roll(1, 100)
      return  "1D100 ＞ #{dice}"
    end

    unless @bonus_dice_range.include?(bonus_dice_count)
      return "エラー。ボーナス・ペナルティダイスの値は#{@bonus_dice_range.min}～#{@bonus_dice_range.max}です。"
    end

    total, total_list = roll_with_bonus(bonus_dice_count)

    if without_compare
      output = "(1D100) ボーナス・ペナルティダイス[#{bonus_dice_count}]"
      output += " ＞ #{total_list.join(', ')} ＞ #{total}"
    else
      result_text = getCheckResultText(total, diff)
      output = "(1D100<=#{diff}) ボーナス・ペナルティダイス[#{bonus_dice_count}]"
      output += " ＞ #{total_list.join(', ')} ＞ #{total} ＞ #{result_text}"
    end

    return output
  end

  # 1D100の一の位用のダイスロール
  # 0から9までの値を返す
  #
  # @return [Integer]
  def roll_ones_d10
    dice, = roll(1, 10)
    return 0 if dice == 10

    return dice
  end

  # @param bonus [Integer] ボーナス・ペナルティダイスの数。負の数ならペナルティダイス。
  # @return [Array<(Integer, Array<Integer>)>]
  def roll_with_bonus(bonus)
    tens_list = Array.new(bonus.abs + 1) { bcdice.roll_tens_d10 }
    ones = roll_ones_d10()

    dice_list = tens_list.map do |tens|
      dice = tens + ones
      dice == 0 ? 100 : dice
    end

    dice =
      if bonus >= 0
        dice_list.min
      else
        dice_list.max
      end

    return dice, dice_list
  end

  def getCheckResultText(total, diff, fumbleable = false)
    if total <= diff
      return "クリティカル" if total == 1
      return "イクストリーム成功" if total <= (diff / 5)
      return "ハード成功" if total <= (diff / 2)

      return "レギュラー成功"
    end

    fumble_text = "ファンブル"

    return fumble_text if total == 100

    if total >= 96
      if diff < 50
        return fumble_text
      else
        return fumble_text if fumbleable
      end
    end

    return "失敗"
  end

  def getCombineRoll(command)
    return nil unless /CBR\((\d+),(\d+)\)/i =~ command

    diff_1 = Regexp.last_match(1).to_i
    diff_2 = Regexp.last_match(2).to_i

    total, = roll(1, 100)

    result_1 = getCheckResultText(total, diff_1)
    result_2 = getCheckResultText(total, diff_2)

    successList = ["クリティカル", "イクストリーム成功", "ハード成功", "レギュラー成功"]

    succesCount = 0
    succesCount += 1 if successList.include?(result_1)
    succesCount += 1 if successList.include?(result_2)
    debug("succesCount", succesCount)

    rank =
      if succesCount >= 2
        "成功"
      elsif succesCount == 1
        "部分的成功"
      else
        "失敗"
      end

    return "(1d100<=#{diff_1},#{diff_2}) ＞ #{total}[#{result_1},#{result_2}] ＞ #{rank}"
  end

  def getFullAutoResult(command)
    return nil unless /^FAR\((-?\d+),(-?\d+),(-?\d+)(?:,(-?\d+)?)?(?:,(-?\w+)?)?(?:,(-?\d+)?)?\)/i =~ command

    bullet_count = Regexp.last_match(1).to_i
    diff = Regexp.last_match(2).to_i
    broken_number = Regexp.last_match(3).to_i
    bonus_dice_count = (Regexp.last_match(4) || 0).to_i
    stop_count = (Regexp.last_match(5) || "").to_s.downcase
    bullet_set_count_cap = (Regexp.last_match(6) || (diff / 10).floor).to_i # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    output = ""

    # 最大で（8回*（PC技能値最大値/10））＝72発しか撃てないはずなので上限
    bullet_count_limit = 100
    if bullet_count > bullet_count_limit
      output += "弾薬が多すぎます。装填された弾薬を#{bullet_count_limit}発に変更します。\n"
      bullet_count = bullet_count_limit
    end

    # ボレーの上限の設定がおかしい場合の注意表示
    if (bullet_set_count_cap > (diff / 10).floor) && (diff > 39) && !Regexp.last_match(6).nil? # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
      bullet_set_count_cap = (diff / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
      output += "ボレーの弾丸の数の上限は\[技能値÷10（切り捨て）\]発なので、それより高い数を指定できません。ボレーの弾丸の数を#{bullet_set_count_cap}発に変更します。\n"
    elsif (diff <= 39) && (bullet_set_count_cap > 3) && !Regexp.last_match(6).nil?
      bullet_set_count_cap = 3
      output += "技能値が39以下ではボレーの弾丸の数の上限および下限は3発です。ボレーの弾丸の数を#{bullet_set_count_cap}発に変更します。\n"
    end

    # ボレーの下限の設定がおかしい場合の注意表示およびエラー表示
    return "ボレーの弾丸の数は正の数です。" if (bullet_set_count_cap <= 0) && !Regexp.last_match(6).nil?

    if (bullet_set_count_cap < 3) && !Regexp.last_match(6).nil?
      bullet_set_count_cap = 3
      output += "ボレーの弾丸の数の下限は3発です。ボレーの弾丸の数を3発に変更します。\n"
    end

    return "弾薬は正の数です。" if bullet_count <= 0
    return "目標値は正の数です。" if diff <= 0

    if broken_number < 0
      output += "故障ナンバーは正の数です。マイナス記号を外します。\n"
      broken_number = broken_number.abs
    end

    unless @bonus_dice_range.include?(bonus_dice_count)
      return "エラー。ボーナス・ペナルティダイスの値は#{@bonus_dice_range.min}～#{@bonus_dice_range.max}です。"
    end

    output += "ボーナス・ペナルティダイス[#{bonus_dice_count}]"
    output += rollFullAuto(bullet_count, diff, broken_number, bonus_dice_count, stop_count, bullet_set_count_cap)

    return output
  end

  def rollFullAuto(bullet_count, diff, broken_number, dice_num, stop_count, bullet_set_count_cap)
    output = ""
    loopCount = 0

    counts = {
      :hit_bullet => 0,
      :impale_bullet => 0,
      :bullet => bullet_count,
    }

    # 難易度変更用ループ
    (0..3).each do |more_difficulty|
      output += getNextDifficultyMessage(more_difficulty)

      # ペナルティダイスを減らしながらロール用ループ
      while dice_num >= @bonus_dice_range.min

        loopCount += 1
        hit_result, total, total_list = getHitResultInfos(dice_num, diff, more_difficulty)
        output += "\n#{loopCount}回目: ＞ #{total_list.join(', ')} ＞ #{hit_result}"

        if total >= broken_number
          output += "　ジャム"
          return getHitResultText(output, counts)
        end

        hit_type = getHitType(more_difficulty, hit_result)
        hit_bullet, impale_bullet, lost_bullet = getBulletResults(counts[:bullet], hit_type, diff, bullet_set_count_cap)

        output += "　（#{hit_bullet}発が命中、#{impale_bullet}発が貫通）"

        counts[:hit_bullet] += hit_bullet
        counts[:impale_bullet] += impale_bullet
        counts[:bullet] -= lost_bullet

        return getHitResultText(output, counts) if counts[:bullet] <= 0

        dice_num -= 1
      end

      # 指定された難易度となった場合、連射処理を途中で止める
      if shouldStopRollFullAuto?(stop_count, more_difficulty)
        output += "\n【指定の難易度となったので、処理を終了します。】"
        break
      end

      dice_num += 1
    end

    return getHitResultText(output, counts)
  end

  # 連射処理を止める条件（難易度の閾値）
  # @return [Hash<String, Integer>]
  #
  # 成功の種類の小文字表記 => 難易度の閾値
  ROLL_FULL_AUTO_DIFFICULTY_THRESHOLD = {
    # レギュラー
    'r' => 0,
    # ハード
    'h' => 1,
    # イクストリーム
    'e' => 2
  }.freeze

  # 連射処理を止めるべきかどうかを返す
  # @param [String] stop_count 成功の種類
  # @param [Integer] difficulty 難易度
  # @return [Boolean]
  def shouldStopRollFullAuto?(stop_count, difficulty)
    difficulty_threshold = ROLL_FULL_AUTO_DIFFICULTY_THRESHOLD[stop_count]
    return difficulty_threshold && difficulty >= difficulty_threshold
  end

  def getHitResultInfos(dice_num, diff, more_difficulty)
    total, total_list = roll_with_bonus(dice_num)

    fumbleable = getFumbleable(more_difficulty)
    hit_result = getCheckResultText(total, diff, fumbleable)

    return hit_result, total, total_list
  end

  def getHitResultText(output, counts)
    return "#{output}\n＞ #{counts[:hit_bullet]}発が通常命中、#{counts[:impale_bullet]}発が貫通、残弾#{counts[:bullet]}発"
  end

  def getHitType(more_difficulty, hit_result)
    successList, impaleBulletList = getSuccessListImpaleBulletList(more_difficulty)

    return :hit if successList.include?(hit_result)
    return :impale if impaleBulletList.include?(hit_result)

    return ""
  end

  def getBulletResults(bullet_count, hit_type, diff, bullet_set_count_cap)
    bullet_set_count = getSetOfBullet(diff, bullet_set_count_cap)
    hit_bullet_count_base = getHitBulletCountBase(diff, bullet_set_count)
    impale_bullet_count_base = (bullet_set_count / 2.to_f)

    lost_bullet_count = 0
    hit_bullet_count = 0
    impale_bullet_count = 0

    if !isLastBulletTurn(bullet_count, bullet_set_count)

      case hit_type
      when :hit
        hit_bullet_count = hit_bullet_count_base # 通常命中した弾数の計算

      when :impale
        impale_bullet_count = impale_bullet_count_base.floor # 貫通した弾数の計算
        hit_bullet_count = impale_bullet_count_base.ceil
      end

      lost_bullet_count = bullet_set_count

    else

      case hit_type
      when :hit
        hit_bullet_count = getLastHitBulletCount(bullet_count)

      when :impale
        impale_bullet_count = getLastHitBulletCount(bullet_count)
        hit_bullet_count = bullet_count - impale_bullet_count
      end

      lost_bullet_count = bullet_count
    end

    return hit_bullet_count, impale_bullet_count, lost_bullet_count
  end

  def getSuccessListImpaleBulletList(more_difficulty)
    successList = []
    impaleBulletList = []

    case more_difficulty
    when 0
      successList = ["ハード成功", "レギュラー成功"]
      impaleBulletList = ["クリティカル", "イクストリーム成功"]
    when 1
      successList = ["ハード成功"]
      impaleBulletList = ["クリティカル", "イクストリーム成功"]
    when 2
      successList = []
      impaleBulletList = ["クリティカル", "イクストリーム成功"]
    when 3
      successList = ["クリティカル"]
      impaleBulletList = []
    end

    return successList, impaleBulletList
  end

  def getNextDifficultyMessage(more_difficulty)
    case more_difficulty
    when 1
      return "\n【難易度がハードに変更】"
    when 2
      return "\n【難易度がイクストリームに変更】"
    when 3
      return "\n【難易度がクリティカルに変更】"
    end

    return ""
  end

  def getSetOfBullet(diff, bullet_set_count_cap)
    bullet_set_count = (diff / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if bullet_set_count_cap < bullet_set_count
      bullet_set_count = bullet_set_count_cap
    end

    if (diff >= 1) && (diff < 30)
      bullet_set_count = 3 # 技能値が29以下での最低値保障処理
    end

    return bullet_set_count
  end

  def getHitBulletCountBase(diff, bullet_set_count)
    #hit_bullet_count_base = (bullet_set_count / 2)
    hit_bullet_count_base = (bullet_set_count / 2).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある

    if (diff >= 1) && (diff < 30)
      hit_bullet_count_base = 1 # 技能値29以下での最低値保障
    end

    return hit_bullet_count_base
  end

  def isLastBulletTurn(bullet_count, bullet_set_count)
    ((bullet_count - bullet_set_count) < 0)
  end

  def getLastHitBulletCount(bullet_count)
    # 残弾1での最低値保障処理
    if bullet_count == 1
      return 1
    end

    count = (bullet_count / 2.to_f).floor
    return count
  end

  def getFumbleable(more_difficulty)
    # 成功が49以下の出目のみとなるため、ファンブル値は上昇
    return (more_difficulty >= 1)
  end

  # 表一式
  # 即時の恐怖症表
  def roll_bmr_table()
    total_n, = roll(1, 10)
    text = MADNESS_REAL_TIME_TABLE[total_n - 1]

    time_n, = roll(1, 10)

    return "狂気の発作（リアルタイム）(#{total_n}) ＞ #{text}(1D10＞#{time_n}ラウンド)"
  end

  MADNESS_REAL_TIME_TABLE = [
    '健忘症：探索者は、最後に安全な場所にいた時からあとに起こった出来事の記憶を持たない。例えば、朝食を食べていた次の瞬間には怪物と向かい合っている。これは1D10ラウンド続く。',
    '身体症状症：探索者は1D10ラウンドの間、狂気によって視覚や聴覚に異常が生じたり、四肢の1つまたは複数が動かなくなる。',
    '暴力衝動：赤い霧が探索者に降り、1D10ラウンドの間、抑えの利かない暴力と破壊を敵味方を問わず周囲に向かって爆発させる。',
    '偏執症：探索者は1D10ラウンドの間、重い偏執症に襲われる。誰もが探索者に襲い掛かろうとしている。信用できる者はいない。監視されている。裏切ったやつがいる。これはわなだ。',
    '重要な人々：探索者のバックストーリーの重要な人々を見直す。探索者はその場にいた人物を、自分にとっての重要な人々だと思い込む。人間関係の性質を考慮した上で、探索者はそれに従って行動する。1D10ラウンド続く。',
    '失神：探索者は失神する。1D10ラウンド後に回復する。',
    'パニックになって逃亡する：探索者は利用できるあらゆる手段を使って、可能なかぎり遠くへ逃げ出さずにはいられない。それが唯一の車両を奪って仲間を置き去りにすることであっても。探索者は1D10ラウンドの間、逃げ続ける。',
    '身体的ヒステリーもしくは感情爆発：探索者は1D10ラウンドの間、笑ったり、泣いたり、あるいは叫んだりし続け、行動できなくなる。',
    '恐怖症：探索者は新しい恐怖症に陥る。恐怖症表（PHコマンド）をロールするか、キーパーが恐怖症を1つ選ぶ。恐怖症の原因は存在しなくとも、その探索者は次の1D10ラウンドの間、それがそこにあると思い込む。',
    'マニア：探索者は新しいマニアに陥る。マニア表（MAコマンド）をロールするか、キーパーがマニアを1つ選ぶ。その探索者は次の1D10ラウンドの間、自分の新しいマニアに没頭しようとする。'
  ].freeze

  # 略式の恐怖表
  def roll_bms_table()
    total_n, = roll(1, 10)
    text = MADNESS_SUMMARY_TABLE[total_n - 1]

    time_n, = roll(1, 10)

    return "狂気の発作（サマリー）(#{total_n}) ＞ #{text}(1D10＞#{time_n}時間)"
  end

  MADNESS_SUMMARY_TABLE = [
    '健忘症：探索者が意識を取り戻すと、見知らぬ場所におり、自分が誰かもわからない。記憶は時間をかけてゆっくりと戻るだろう。',
    '盗難：探索者は1D10時間後に意識を取り戻すが、盗難の被害を受けている。傷つけられてはいない。探索者が秘蔵の品を身に着けていた場合（「探索者のバックストーリー」参照）、〈幸運〉ロールを行い、それが盗まれていないか判定する。値打ちのあるものはすべて自動的に失われる。',
    '暴行：探索者は1D10時間後に意識を取り戻し、自分が暴行を受け、傷ついていることに気づく。耐久力は狂気に陥る前の半分に減少している。ただし重症は生じていない。盗まれたものはない。どのようにダメージが加えられたかは、キーパーに委ねられる。',
    '暴力：探索者は暴力と破壊の噴流を爆発させる。探索者が意識を取り戻した時、その行動を認識し記憶していることもあればそうでないこともある。探索者が暴力を振るった物、もしくは人、そして相手を殺してしまったのか、あるいは単に傷つけただけなのかはキーパーに委ねられる。',
    'イデオロギー／信念：探索者のバックストーリーのイデオロギーと信念を参照する。探索者はこれらの1つの権化となり、急進的かつ狂気じみて、感情もあらわに主張するようになる。例えば、宗教に関係する者は、その後地下鉄で声高に福音を説教しているところを目撃されるかもしれない。',
    '重要な人々：探索者のバックストーリーの重要な人々を参照し、なぜその人物との関係が重要かを考える。時間がたってから（1D10時間以上）、探索者はその人物に近づくための最善の行動、そしてその人物との関係にとって最善の行動をとる。',
    '収容：探索者は精神療養施設あるいは警察の留置所で意識を取り戻す。探索者は徐々にそこにいたった出来事を思い出すかもしれない。',
    'パニック：探索者は非常に遠い場所で意識を取り戻す。荒野で道に迷っているか、列車に乗っているか、長距離バスに乗っているかもしれない。',
    '恐怖症：探索者は新たな恐怖症を獲得する。恐怖症表（PHコマンド）をロールするか、キーパーがどれか1つ選ぶ。探索者は1D10時間後に意識を取り戻し、この新たな恐怖症の対象を避けるためにあらゆる努力をする。',
    'マニア：探索者は新たなマニアを獲得する。マニア表（MAコマンド）をロールするか、キーパーがどれか1つ選ぶ。この狂気の発作の間、探索者はこの新たなマニアに完全に溺れているだろう。これがほかの人々に気づかれるかどうかは、キーパーとプレイヤーに委ねられる。'
  ].freeze

  # キャスティング・ロールのプッシュに失敗した場合（小）
  FAILED_CASTING_L_TABLE = [
    '視界がぼんやりするか、あるいは一時的な失明。',
    '悲鳴、声、あるいはほかの雑音が肉体から発せられる。',
    '強風やほかの大気の現象。',
    '術者、ほかのその場に居合わせた者が出血する。あるいは環境（例えば、壁）から出血する。',
    '奇妙な幻視と幻覚。',
    'その付近の小動物たちが爆発する。',
    '硫黄の悪臭。',
    'クトゥルフ神話の怪物が偶然召喚される。'
  ].freeze

  # キャスティング・ロールのプッシュに失敗した場合（大）
  FAILED_CASTING_M_TABLE = [
    '大地が震え、壁に亀裂が入って崩れる。',
    '叙事詩的な電撃。',
    '血が空から降る。',
    '術者の手がしなび、焼けただれる。',
    '術者は不自然に年をとる（年齢に+2D10歳、30ページの「年齢」を参照し、能力値に修正を適用すること）。',
    '強力な、あるいは無数のクトゥルフ神話存在が現れ、術者を手始めに、近くの全員を攻撃する！',
    '術者や近くの全員が遠い時代か場所に吸い込まれる。',
    'クトゥルフ神話の神格が偶然招来される。'
  ].freeze

  # 恐怖症表
  PHOBIAS_TABLE = [
    '入浴恐怖症：体、手、顔を洗うのが怖い。',
    '高所恐怖症：高いところが怖い。',
    '飛行恐怖症：飛ぶのが怖い。',
    '広場恐怖症：広場、公共の(混雑した)場所が怖い。',
    '鶏肉恐怖症：鶏肉が怖い。',
    'ニンニク恐怖症：ニンニクが怖い。',
    '乗車恐怖症：車両の中にいたり車両に乗るのが怖い。',
    '風恐怖症：風が怖い。',
    '男性恐怖症：男性が怖い。',
    'イングランド恐怖症：イングランド、もしくはイングランド文化などが怖い。',
    '花恐怖症：花が怖い。',
    '切断恐怖症：手足や指などが切断された人が怖い。',
    'クモ恐怖症：クモが怖い。',
    '稲妻恐怖症：稲妻が怖い。',
    '廃墟恐怖症：廃墟が怖い。',
    '笛恐怖症：笛(フルート)が怖い。',
    '細菌恐怖症：細菌、バクテリアが怖い。',
    '銃弾恐怖症：投擲物や銃弾が怖い。',
    '落下恐怖症：落下が怖い。',
    '書物恐怖症：本が怖い。',
    '植物恐怖症：植物が怖い。',
    '美女恐怖症：美しい女性が怖い。',
    '低温恐怖症：冷たいものが怖い。',
    '時計恐怖症：時計が怖い。',
    '閉所恐怖症：壁に囲まれた場所が怖い。',
    '道化師恐怖症：道化師が怖い。',
    '犬恐怖症：犬が怖い。',
    '悪魔恐怖症：悪魔が怖い。',
    '群集恐怖症：人混みが怖い。',
    '歯科医恐怖症：歯科医が怖い。',
    '処分恐怖症：物を捨てるのが怖い(ためこみ症)',
    '毛皮恐怖症：毛皮が怖い。',
    '構断恐怖症：道路を横断するのが怖い。',
    '教会恐怖症：教会が怖い。',
    '鏡恐怖症：鏡が怖い。',
    'ピン恐怖症：針やピンが怖い。',
    '昆虫恐怖症：昆虫が怖い。',
    '猫恐怖症：猫が怖い。',
    '橋恐怖症：橋を渡るのが怖い。',
    '老人恐怖症：老人や年をとることが怖い。',
    '女性恐怖症：女性が怖い。',
    '血液恐怖症：血が怖い。',
    '過失恐怖症：失敗が怖い。',
    '接触恐怖症：触ることが怖い。',
    '爬虫類恐怖症：爬虫類が怖い。',
    '霧恐怖症：霧が怖い。',
    '銃器恐怖症：銃器が怖い。',
    '水恐怖症：水が怖い。',
    '睡眠恐怖症：眠ったり、催眠状態に陥るのが怖い。',
    '医師恐怖症：医師が怖い。',
    '魚恐怖症：魚が怖い。',
    'ゴキブリ恐怖症：ゴキブリが怖い。',
    '雷鳴恐怖症：雷鳴が怖い。',
    '野菜恐怖症：野菜が怖い。',
    '大騒音恐怖症：大きな騒音が怖い。',
    '湖恐怖症：湖が怖い。',
    '機械恐怖症：機械や装置が怖い。',
    '巨大物恐怖症：巨大なものが怖い。',
    '拘束恐怖症：縛られたり結びつけられたりするのが怖い。',
    '隕石恐怖症：流星や隕石が怖い。',
    '孤独恐怖症：独りでいることが怖い。',
    '汚染恐怖症：汚れたり汚染されたりするのが怖い。',
    '粘液恐怖症：粘液、粘体が怖い。',
    '死体恐怖症：死体が怖い。',
    '8恐怖症：8の数字が怖い。',
    '歯恐怖症：歯が怖い。',
    '夢恐怖症：夢が怖い。',
    '名称恐怖症：特定の言葉（1つまたは複数）を聞くのが怖い。',
    '蛇恐怖症：蛇が怖い。',
    '鳥恐怖症：鳥が怖い。',
    '寄生生物恐怖症：寄生生物が怖い。',
    '人形恐怖症：人形が怖い。',
    '恐食症：のみ込むこと食べること、もしくは食べられることが怖い。',
    '薬物恐怖症：薬物が怖い。',
    '幽霊恐怖症：幽霊が怖い。',
    '羞明：日光が怖い。',
    'ひげ恐怖症：ひげが怖い',
    '河川恐怖症：川が怖い',
    'アルコール恐怖症：アルコールやアルコール飲料が怖い。',
    '火恐怖症：火が怖い。',
    '魔術恐怖症：魔術が怖い。',
    '暗黒恐怖症：暗闇や夜が怖い。',
    '月恐怖症：月が怖い。',
    '鉄道恐怖症：列車の旅が怖い。',
    '星恐怖症：星が怖い。',
    '狭所恐怖症：狭いものや場所が怖い。',
    '対称恐怖症：左右対称が怖い。',
    '生き埋め恐怖症：生き埋めになることや墓地が怖い。',
    '雄牛恐怖症：雄牛が怖い。',
    '電話恐怖症：電話が怖い。',
    '奇形恐怖症：怪物が怖い。',
    '海洋恐怖症：海が怖い。',
    '手術恐怖症：外科手術が怖い。',
    '13恐怖症：13の数字が怖い。',
    '衣類恐怖症：衣服が怖い。',
    '魔女恐怖症：魔女と魔術が怖い。',
    '黄色恐怖症：黄色や「黄色」という言葉が怖い。',
    '外国語恐怖症：外国語が怖い。',
    '外国人恐怖症：外国人が怖い。',
    '動物恐怖症：動物が怖い。',
  ].freeze

  # マニア表
  MANIAS_TABLE = [
    '洗浄マニア：自分の体を洗わずにはいられない。',
    '無為マニア：病的な優柔不断。',
    '暗闇マニア：暗黒に関する過度の嗜好。',
    '高所マニア：高い場所に登らずにはいられない。',
    '善良マニア：病的な親切。',
    '広場マニア：開けた場所にいたいという激しい願望。',
    '先鋭マニア：鋭いもの、とがったものへの執着。',
    '猫マニア：猫に関する異常な愛好心。',
    '疼痛性愛：痛みへの執着。',
    'にんにくマニア：にんにくへの執着。',
    '乗り物マニア：車の中にいることへの執着。',
    '病的快活：不合理なほがらかさ。',
    '花マニア：花への執着。',
    '計算マニア：数への偏執的な没頭。',
    '浪費マニア：衝動的あるいは無謀な浪費。',
    '自己マニア：孤独への過度の嗜好。',
    'バレエマニア：バレエに関する異常な愛好心。',
    '書籍約盗癖：本を盗みたいという強迫的衝動。',
    '書物マニア：本または読書、あるいはその両方への執着。',
    '歯ぎしりマニア：歯ぎしりしたいという強迫的衝動。',
    '悪霊マニア：誰かの中に邪悪な精霊がいるという病的な信念。',
    '自己愛マニア：自分自身の美への執着。',
    '地図マニア：いたる所の地図を見る制御不可能な強迫的衝動。',
    '飛び降りマニア：高い場所から跳躍することへの執着。',
    '寒冷マニア：冷たさ、または冷たいもの、あるいはその両方への異常な欲望。',
    '舞踏マニア：踊ることへの愛好もしくは制御不可能な熱狂。',
    '睡眠マニア：寝ることへの過度の願望。',
    '墓地マニア：墓地への執着。',
    '色彩マニア：特定の色への執着。',
    'ピエロマニア：ピエロへの執着。',
    '遭遇マニア：恐ろしい状況を経験したいという強迫的衝動。',
    '殺害マニア：殺害への執着。',
    '悪魔マニア：誰かが悪魔にとりつかれているという病的な信念。',
    '皮膚マニア：人の皮膚を引っぱりたいという強迫的衝動。',
    '正義マニア：正義が完遂されるのを見たいという執着。',
    'アルコールマニア：アルコールに関する異常な欲求。',
    '毛皮マニア：毛皮を所有することへの執着。',
    '贈り物マニア：贈り物を与えることへの執着。',
    '逃走マニア：逃走することへの迫的衝動。',
    '外出マニア：外を歩き回ることの強迫的衝動。',
    '自己中心マニア：不合理な自心の態度か自己崇拝。',
    '公職マニア：公的な職業に就きいという強欲な衝動。',
    '戦慄マニア：誰かが罪を犯したという病的な信念',
    '知識マニア：知識を得ることへ執着。',
    '静寂マニア：静寂であることへ強迫的衝動。',
    'エーテルマニア：エーテルへの切望',
    '求婚マニア：奇妙な求婚をすることへの執着。',
    '笑いマニア：制御不可能な笑うことへの強迫的衝動。',
    '魔術マニア：魔女と魔術への執着。',
    '筆記マニア：すべてを書き留めることへの執着。',
    '裸体マニア：裸になりたいという強迫的衝動。',
    '幻想マニア：快い幻想(現実とは関係なく)にとらわれやすい異常な傾向。',
    '蟲マニア：蟲に関する過度の嗜好。',
    '火器マニア：火器への執着。',
    '水マニア：水に関する不合理な渇望。',
    '魚マニア：魚への執着。',
    'アイコンマニア：像や肖像への執着。',
    'アイドルマニア：偶像への執着または献身。',
    '情報マニア：事実を集めることへの過度の献身。',
    '絶叫マニア：叫ぶことへの説明できない強迫的衝動。',
    '窃盗マニア：盗むことへの説明できない強迫的衝動。',
    '騒音マニア：大きな、あるいは甲高い騒音を出すことへの制御不可能な強迫的衝動。',
    'ひもマニア：ひもへの執着。',
    '宝くじマニア：宝くじに参加したいという極度の願望。',
    'うつマニア：異常に深くふさぎ込む傾向。',
    '巨石マニア：環状列石/立石があると奇妙な考えにとらわれる異常な傾向。',
    '音楽マニア：音楽もしくは特定の旋律への執着。',
    '作詩マニア：詩を書くことへの強欲な願望。',
    '憎悪マニア：何らかの対象あるいはグループの何もかもを憎む執着。',
    '偏執マニア：ただ1つの思想やアイデアへの異常な執着。',
    '虚言マニア：異常なほどにうそをついたり、誇張して話す。',
    '疾病マニア：想像上の病気に苦められる幻想。',
    '記録マニア：あらゆるものを記録に残そうという強迫的衝動。',
    '名前マニア：人々、場所、ものなどの名前への執着',
    '単語マニア：ある単語を繰り返したいという押さえ切れない欲求。',
    '爪損傷マニア：指の爪をむしったりはがそうとする強迫的衝動。',
    '美食マニア：1種類の食物への異常な愛。',
    '不平マニア：不平を言うことへの異常な喜び。',
    '仮面マニア：仮面や覆面を着けたいという強迫的衝動。',
    '幽霊マニア：幽霊への執着。',
    '殺人マニア：殺人への病的な傾向。',
    '光線マニア：光への病的な願望。',
    '放浪マニア：社会の規範に背きたいという異常な欲望。',
    '長者マニア：富への強迫的な欲望。',
    '病的虚言マニア：うそをつきたくてたまらない強迫的衝動。',
    '放火マニア：火をつけることへの強迫的衝動。',
    '質問マニア：質問したいという激しい強迫的衝動。',
    '鼻マニア：鼻をいじりたいという強迫的衝動。',
    '落書きマニア：いらずら書きや落書きへの執着。',
    '列車マニア：列車と鉄道旅行への強い魅了。',
    '知性マニア：誰かが信じられないほど知的であるという幻想。',
    'テクノマニア：新技術への執着。',
    'タナトスマニア：誰かが死を招く魔術によって呪われているという信念。',
    '宗教マニア：その人が神であるという信仰。',
    'かき傷マニア：かき傷をつけることへの強迫的衝動。',
    '手術マニア：外科手術を行なうことへの不合理な嗜好。',
    '抜毛マニア：自分の髪を引き抜くことへの切望。',
    '失明マニア：病的な視覚障害。',
    '異国マニア：外国のものへの執着。',
    '動物マニア：動物への正気でない溺愛。',
  ].freeze
end
