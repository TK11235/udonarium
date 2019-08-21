# -*- coding: utf-8 -*-

class CthulhuTech < DiceBot
  def initialize
    super
    @sendMode = 2
    @sortType = 1
  end

  def gameName
    'クトゥルフテック'
  end

  def gameType
    "CthulhuTech"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
テストのダイス計算を実装。
成功、失敗、クリティカル、ファンブルの自動判定。
コンバットテスト(防御側有利なので「>=」ではなく「>」で入力)の時はダメージダイスも表示。
INFO_MESSAGE_TEXT
  end

  def check_nD10(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)# ゲーム別成功度判定(nD10)
    if signOfInequality == ">=" # 通常のテスト
      @isCombatTest = false
      return check_nD10_nomalTest(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    end

    if signOfInequality == ">" # コンバットテスト
      @isCombatTest = true
      return check_nD10_combatTest(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    end
  end

  def check_nD10_nomalTest(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    #if( n1 >= (dice_cnt / 2 + 0.9).to_i )
    if( n1 >= ((dice_cnt / 2).floor + 0.9).to_i ) # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
      return " ＞ ファンブル"
    end

    isSuccess = false
    if @isCombatTest
      isSuccess = (total_n > diff)
    else
      isSuccess = (total_n >= diff)
    end

    unless isSuccess
      return " ＞ 失敗"
    end

    if total_n >= diff + 10
      return " ＞ クリティカル"
    end

    return " ＞ 成功"
  end

  def check_nD10_combatTest(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)
    result = check_nD10_nomalTest(total_n, dice_n, signOfInequality, diff, dice_cnt, dice_max, n1, n_max)

    case result
    when " ＞ クリティカル", " ＞ 成功"
      result += getDamageDice(total_n, diff)
    end

    return result
  end

  def getDamageDice(total_n, diff)
    debug('getDamageDice total_n, diff', total_n, diff)
    damageDiceCount = ((total_n - diff) / 5.0).ceil
    debug('damageDiceCount', damageDiceCount)
    damageDice = "(#{damageDiceCount}d10)" # ダメージダイスの表示

    return damageDice
  end

  # ダイス目文字列からダイス値を変更する場合の処理
  # クトゥルフ・テックの判定用ダイス計算
  def changeDiceValueByDiceText(dice_now, dice_str, isCheckSuccess, dice_max)
    debug("changeDiceValueByDiceText dice_now, dice_str, isCheckSuccess, dice_max", dice_now, dice_str, isCheckSuccess, dice_max)
    if isCheckSuccess && (dice_max == 10)
      debug('cthulhutech_check(dice_str) called')
      debug('dice_str, dice_now', dice_str, dice_now)
      dice_now = cthulhutech_check(dice_str)
    end
    debug('dice_str, dice_now', dice_str, dice_now)

    return dice_now
  end

  ####################           CthulhuTech         ########################
  # CthulhuTechの判定用ダイス計算
  def cthulhutech_check (dice_str)
    dice_aRR = dice_str.split(/,/).collect { |i| i.to_i }

    dice_num = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    max_num = 0

    dice_aRR.each do |dice_n|
      dice_num[(dice_n - 1)] += 1

      if dice_n > max_num # 1.個別のダイスの最大値
        max_num = dice_n
      end
    end

    if dice_aRR.length >= 2 # ダイスが2個以上ロールされている
      10.times do |i|
        if dice_num[i] > 1 # 2.同じ出目の合計値
          dice_now = dice_num[i] * (i + 1)
          max_num = dice_now if dice_now > max_num
        end
      end

      if dice_aRR.length >= 3 # ダイスが3個以上ロールされている
        10.times do |i|
          break if  dice_num[i + 2] == nil

          if dice_num[i] > 0
            if (dice_num[i + 1] > 0) && (dice_num[i + 2] > 0) # 3.連続する出目の合計
              dice_now = i * 3 + 6 # ($i+1) + ($i+2) + ($i+3) = $i*3 + 6

              ((i + 3)...10).step do |i2|
                break if dice_num[i2] == 0

                dice_now += i2 + 1
              end

              max_num = dice_now if dice_now > max_num
            end
          end
        end
      end
    end

    return max_num
  end
end
