# -*- coding: utf-8 -*-

class BadLife < DiceBot
  setPrefixes(['\d?(BAD|BL|GL).*', '[TDGKSB]RN', 'SKL'])

  def initialize
    super
  end

  def gameName
    '犯罪活劇RPGバッドライフ'
  end

  def gameType
    "BadLife"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・判定：nBADm[±a][Cb±c][Fd±e][@X±f][!OP]　　[]内のコマンドは省略可。
・BADコマンドは「BL」コマンドで代用可。
・博徒は「GL」コマンドで〈波乱万丈〉の効果を適用。

「n」で振るダイス数、「m」で特性値、「±a」で達成値への修正値、
「Cb±c」でクリティカル値への修正、「Fd±e」でファンブル値への修正、
「@X」で目標難易度を指定。
「±a」「Cb±c」「Fd±e」[@X±f]部分は「4+1-3」などの複数回指定可。
「!OP」部分で、一部のスキルやガジェットの追加効果を指定可。
使用可能なコマンドは以下の通り。順不同、複数同時使用も可。
A：〈先見の明〉　　H：［重撃］

【書式例】
BAD → 1ダイスで達成値を表示。
3BAD10+2-1 → 3ダイスで修正+11の達成値を表示。
BL8@15 → 1ダイスで修正+8、難易度15の判定。
2BL8C-1F1@15 → 2ダイスで修正+8、C値-1、F値+1、難易度15の判定。
GL6@20 → 1ダイスで修正+6、難易度20の判定。〈波乱万丈〉の効果。
GL6@20!HA → 上記に加えて〈先見の明〉［重撃］の効果。

・コードネーム表
怪盗：TRN　　　闇医者：DRN　　博徒：GRN
殺シ屋：KRN　　業師：SRN　　　遊ビ人：BRN

・スキル表：SKL
MESSAGETEXT
  end

  def rollDiceCommand(command)
    command = command.upcase

    result = judgeDice(command)
    return result unless result.nil?

    output =
      case command

      when /([TDGKSB])RN/i
        initials = $1
        get_name_table(initials)

      when 'SKL'
        get_skill_table

      end

    return output
  end

  def judgeDice(command)
    unless (m = /(\d+)?(BAD|BL|GL)([\+\-\d+]*)((C|F)([\+\-\d+]*)?)?((C|F)([\+\-\d+]*))?(\@([\+\-\d+]*))?(\!(\D*))?/i.match(command))
      return nil
    end

    diceCount = (m[1] || 1).to_i

    critical = 20
    fumble = 1

    isStormy = (m[2] == 'GL') # 波乱万丈
    if  isStormy
      critical -= 3
      fumble += 1
    end

    modify = get_value(m[3])

    critical, fumble = get_critival_fumble(critical, fumble, m[5], m[6])
    critical, fumble = get_critival_fumble(critical, fumble, m[8], m[9])

    target = get_value(m[11])
    optionalText = (m[13] || '')

    return checkRoll(diceCount, modify, critical, fumble, target, isStormy, optionalText)
  end

  def get_critival_fumble(critical, fumble, marker, text)
    case marker
    when 'C'
      critical += get_value(text)
    when 'F'
      fumble += get_value(text)
    end

    return critical, fumble
  end

  def checkRoll(diceCount, modify, critical, fumble, target, isStormy, optionalText)
    isAnticipation = optionalText.include?('A')    # 先見の明
    isHeavyAttack = optionalText.include?('H')     # 重撃

    dice, diceText = roll(diceCount, 20)
    diceMax = 0
    diceArray = diceText.split(/,/).collect { |i| i.to_i }
    diceArray.each do |i| # さくら鯖で.maxを使うと、何故か.minになる……
      diceMax = i if  i > diceMax
    end

    diceMax = 5 if isHeavyAttack && diceMax <= 5   # 重撃

    isCritical = (diceMax >= critical)
    isFumble = (diceMax <= fumble)

    diceMax = 20 if isCritical                     # クリティカル
    total = diceMax + modify
    total += 5 if isAnticipation && diceMax <= 7   # 先見の明
    total = 0 if isFumble                          # ファンブル

    result = "#{diceCount}D20\(C:#{critical},F:#{fumble}\) ＞ "
    result += "#{diceMax}\[#{diceText}\]"
    result += "\+" if modify > 0
    result += modify.to_s if modify != 0
    result += "\+5" if isAnticipation && diceMax <= 7 # 先見の明
    result += " ＞ 達成値：#{total}"

    if target > 0
      success = total - target
      result += ">=#{target} 成功度：#{success} ＞ "

      if isCritical
        result += "成功（クリティカル）"
      elsif  total >= target
        result += "成功"
      else
        result += "失敗"
        result += "（ファンブル）" if isFumble
      end
    else
      result += " クリティカル" if isCritical
      result += " ファンブル" if isFumble
    end

    skillText = ""
    skillText += "〈波乱万丈〉" if  isStormy
    skillText += "〈先見の明〉" if  isAnticipation
    skillText += "［重撃］" if isHeavyAttack
    result += " #{skillText}" if skillText != ""

    return result
  end

  def get_name_table(initials)
    case initials
    when 'T'  # Thief
      name = '怪盗コードネーム表'
      table = [
                [1, 'フォックス'],
                [2, 'フォックス'],
                [3, 'ラット'],
                [4, 'ラット'],
                [5, 'キャット'],
                [6, 'キャット'],
                [7, 'タイガー'],
                [8, 'タイガー'],
                [9, 'シャーク'],
                [10, 'シャーク'],
                [11, 'コンドル'],
                [12, 'コンドル'],
                [13, 'スパイダー'],
                [14, 'スパイダー'],
                [15, 'ウルフ'],
                [16, 'ウルフ'],
                [17, 'コヨーテ'],
                [18, 'コヨーテ'],
                [19, 'ジャガー'],
                [20, 'ジャガー']
              ]
    when 'D'  # Doctor
      name = '闇医者コードネーム表'
      table = [
                [1, 'キャンサー'],
                [2, 'キャンサー'],
                [3, 'ヘッドエイク'],
                [4, 'ヘッドエイク'],
                [5, 'ブラッド'],
                [6, 'ブラッド'],
                [7, 'ウーンズ'],
                [8, 'ウーンズ'],
                [9, 'ポイズン'],
                [10, 'ポイズン'],
                [11, 'ペイン'],
                [12, 'ペイン'],
                [13, 'スリープ'],
                [14, 'スリープ'],
                [15, 'キュア'],
                [16, 'キュア'],
                [17, 'デス'],
                [18, 'デス'],
                [19, 'リーンカーネイション'],
                [20, 'リーンカーネイション']
              ]
    when 'G'  # Gambler
      name = '博徒コードネーム表'
      table = [
                [1, 'リトルダイス'],
                [2, 'リトルダイス'],
                [3, 'プラチナム'],
                [4, 'プラチナム'],
                [5, 'プレジデント'],
                [6, 'プレジデント'],
                [7, 'ドリーム'],
                [8, 'ドリーム'],
                [9, 'アクシデント'],
                [10, 'アクシデント'],
                [11, 'グリード'],
                [12, 'グリード'],
                [13, 'フォーチュン'],
                [14, 'フォーチュン'],
                [15, 'ミラクル'],
                [16, 'ミラクル'],
                [17, 'ホープ'],
                [18, 'ホープ'],
                [19, 'ビッグヒット'],
                [20, 'ビッグヒット']
              ]
    when 'K'  # Killer
      name = '殺シ屋コードネーム表'
      table = [
                [1, 'ハンマー'],
                [2, 'ハンマー'],
                [3, 'アロー'],
                [4, 'アロー'],
                [5, 'ボマー'],
                [6, 'ボマー'],
                [7, 'キャノン'],
                [8, 'キャノン'],
                [9, 'ブレード'],
                [10, 'ブレード'],
                [11, 'スティング'],
                [12, 'スティング'],
                [13, 'ガロット'],
                [14, 'ガロット'],
                [15, 'パイルバンカー'],
                [16, 'パイルバンカー'],
                [17, 'レイザー'],
                [18, 'レイザー'],
                [19, 'カタナ'],
                [20, 'カタナ']
              ]
    when 'S'  # Schemer
      name = '業師コードネーム表'
      table = [
                [1, 'ローズ'],
                [2, 'ローズ'],
                [3, 'サクラ'],
                [4, 'サクラ'],
                [5, 'ライラック'],
                [6, 'ライラック'],
                [7, 'ダンデライオン'],
                [8, 'ダンデライオン'],
                [9, 'フリージア'],
                [10, 'フリージア'],
                [11, 'カクタス'],
                [12, 'カクタス'],
                [13, 'ロータス'],
                [14, 'ロータス'],
                [15, 'リリィ'],
                [16, 'リリィ'],
                [17, 'ラフレシア'],
                [18, 'ラフレシア'],
                [19, 'ヒヤシンス'],
                [20, 'ヒヤシンス']
              ]
    when 'B'  # Bum
      name = '遊ビ人コードネーム表'
      table = [
                [1, 'モノポリー'],
                [2, 'モノポリー'],
                [3, 'ブリッジ'],
                [4, 'ブリッジ'],
                [5, 'チェッカー'],
                [6, 'チェッカー'],
                [7, 'アクワイア'],
                [8, 'アクワイア'],
                [9, 'ジャンケン'],
                [10, 'ジャンケン'],
                [11, 'トランプ'],
                [12, 'トランプ'],
                [13, 'ケイドロ'],
                [14, 'ケイドロ'],
                [15, 'パンデミック'],
                [16, 'パンデミック'],
                [17, 'スゴロク'],
                [18, 'スゴロク'],
                [19, 'キャベツカンテイ'],
                [20, 'キャベツカンテイ']
              ]
    else
      return nil
    end

    return get_badlife_1d20_table_result(name, table)
  end

  def get_skill_table
    name = 'スキル表'
    table = [
              [1, '一撃離脱'],
              [2, '一撃離脱'],
              [3, 'チェイサー'],
              [4, 'チェイサー'],
              [5, '影の外套'],
              [6, '影の外套'],
              [7, '二段ジャンプ'],
              [8, '二段ジャンプ'],
              [9, '韋駄天'],
              [10, '韋駄天'],
              [11, '手練'],
              [12, '手練'],
              [13, 'ハニーテイスト'],
              [14, 'ハニーテイスト'],
              [15, '先見の明'],
              [16, '先見の明'],
              [17, 'ベテラン'],
              [18, 'ベテラン'],
              [19, '応急手当'],
              [20, '応急手当'],
              [21, 'セラピー'],
              [22, 'セラピー'],
              [23, '緊急治療'],
              [24, '緊急治療'],
              [25, 'ゴールドディガー'],
              [26, 'ゴールドディガー'],
              [27, 'デイリーミッション'],
              [28, 'デイリーミッション'],
              [29, '見切り'],
              [30, '見切り'],
              [31, '鷹の目'],
              [32, '鷹の目'],
              [33, 'しびれ罠'],
              [34, 'しびれ罠'],
              [35, '大逆転'],
              [36, '大逆転'],
              [37, '武器習熟：○○'],
              [38, '武器習熟：○○'],
              [39, '百発百中'],
              [40, '百発百中'],
              [41, '屈強な肉体'],
              [42, '屈強な肉体'],
              [43, '二刀流'],
              [44, '二刀流'],
              [45, 'クイックリカバリー'],
              [46, 'クイックリカバリー'],
              [47, '体験主義'],
              [48, '体験主義'],
              [49, '破釜沈船'],
              [50, '破釜沈船'],
              [51, '想定の範囲内'],
              [52, '想定の範囲内'],
              [53, 'セカンドチャンス'],
              [54, 'セカンドチャンス'],
              [55, '優秀な子分'],
              [56, '優秀な子分'],
              [57, '時間管理術'],
              [58, '時間管理術'],
              [59, '連撃術'],
              [60, '連撃術'],
              [61, '罵詈雑言'],
              [62, '罵詈雑言'],
              [63, 'ケセラセラ'],
              [64, 'ケセラセラ'],
              [65, 'ダンス＆ミュージック'],
              [66, 'ダンス＆ミュージック'],
              [67, 'フェイント'],
              [68, 'フェイント'],
              [69, 'ヘイトコントロール'],
              [70, 'ヘイトコントロール'],
              [71, '惜別'],
              [72, '惜別'],
              [73, '戦闘マシーン'],
              [74, '戦闘マシーン'],
              [75, '戦闘マシーン'],
              [76, '名医'],
              [77, '名医'],
              [78, '名医'],
              [79, '忍者'],
              [80, '忍者'],
              [81, '忍者'],
              [82, '観察眼'],
              [83, '観察眼'],
              [84, '観察眼'],
              [85, 'クレバー'],
              [86, 'クレバー'],
              [87, 'クレバー'],
              [88, 'フェイスマン'],
              [89, 'フェイスマン'],
              [90, 'フェイスマン'],
              [91, 'スポーツマン'],
              [92, 'スポーツマン'],
              [93, 'スポーツマン'],
              [94, '不屈'],
              [95, '不屈'],
              [96, '不屈'],
              [97, '慎重'],
              [98, '慎重'],
              [99, '慎重'],
              [100, 'この表を2回振る']
            ]
    dice, = roll(1, 100)
    result = get_table_by_number(dice, table)

    return get_badlife_table_result(name, dice, result)
  end

  def get_badlife_1d20_table_result(name, table)
    dice, = roll(1, 20)
    output = get_table_by_number(dice, table)
    return get_badlife_table_result(name, dice, output)
  end

  def get_badlife_table_result(name, dice, output)
    return "#{name}(#{dice}) ＞ #{output}"
  end

  def get_value(text)
    text ||= ""
    return parren_killer("(0#{ text })").to_i
  end
end
