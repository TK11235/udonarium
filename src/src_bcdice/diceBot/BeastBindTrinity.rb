# -*- coding: utf-8 -*-
# frozen_string_literal: true

require 'utils/ArithmeticEvaluator'
require 'utils/format'
require 'utils/normalize'
require 'utils/table'
require 'utils/d66_grid_table'

# ビーストバインド トリニティのダイスボット
#
# = 前ver(1.43.07)からの変更・修正
# * nBBで判定を行う際、「ダイスを１個しか振らない場合」の達成値計算が正しくなかった誤りを修正。
# * @x(クリティカル値指定)、を加減式で入力できるように仕様変更。クリティカル値は、加減式での入力なら%w(人間性からのクリティカル値計算)と併用可能に。
# * #y(ファンブル値指定)を加減式で入力できるように仕様変更。また、「ファンブルしても達成値が0にならない」モード#Ayを追加。
# * &v(出目v未満のダイスを出目vとして扱う)のモードを追加。2018年12月現在、ゲーマーズ・フィールド誌先行収録データでのみ使用するモードです。
# * 「暴露表」および「正体判明チャート」をダイスボットに組み込み。
# * どどんとふ以外のボーンズ＆カーズを用いたオンラインセッション用ツールにあわせ、ヘルプメッセージ部分からイニシアティブ表についての言及を削除。
class BeastBindTrinity < DiceBot
  # ゲームシステムの識別子
  ID = 'BeastBindTrinity'

  # ゲームシステム名
  NAME = 'ビーストバインド トリニティ'

  # ゲームシステム名の読みがな
  SORT_KEY = 'ひいすとはいんととりにてい'

  # ダイスボットの使い方
  HELP_MESSAGE = <<INFO_MESSAGE_TEXT
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
・暴露表：EXPO_A
・魔獣化暴露表：EXPO_B
・アイドル専用暴露表：EXPO_I
・アイドル専用魔獣化暴露表：EXPO_J
・正体判明チャートA～C：FACE_A, FACE_B, FACE_C
INFO_MESSAGE_TEXT

  def initialize
    super
    @sendMode = 2
    @sortType = 0
    @d66Type = 2
  end

  class BBCommand
    def initialize(command)
      @command = command
      parse()
    end

    def roll(bot)
      if @parse_error
        return nil
      end

      @bot = bot

      dice_list_org = roll_with_dice_pool()
      if dice_list_org.empty?
        return "ERROR:振るダイスの数が0個です"
      end

      dice_list_filtered = dice_list_org.map { |dice| [dice, @dice_value_lower_limit].max }.sort
      @dice_total = dice_list_filtered.inject(0, :+)

      total = calc_total()

      dice_list_org_str = "[#{dice_list_org.join(',')}]" if dice_list_filtered != dice_list_org

      sequence = [
        command_expr(),
        dice_list_org_str,
        interim_expr(dice_list_filtered),
        dice_status(),
        total.to_s,
        result_compare(total)
      ].compact

      return sequence.join(" ＞ ")
    end

    private

    def parse()
      m = /^(\d+)(?:R6|BB6?)((?:[\+\-]\d+)+)?(?:%(\-?\d+))?(?:@([\+\-\d]+))?(?:#(A)?([\+\-\d]+))?(?:\$([1-6]+))?(?:&([1-6]))?(?:([>=]+)(\d+))?$/.match(@command)
      unless m
        @parse_error = true
        return
      end

      @dice_num = m[1].to_i
      @modify_number = m[2] ? ArithmeticEvaluator.new.eval(m[2]) : 0

      @critical = parse_critical(m[3], m[4])

      @keep_value_on_fumble = !m[5].nil?

      @fumble = parse_fumble(m[6])

      @dice_pool = m[7] ? m[7].split("").map(&:to_i) : []
      @dice_pool.pop(@dice_pool.size - @dice_num) if @dice_pool.size > @dice_num

      @dice_value_lower_limit = m[8].to_i

      @cmp_op = Normalize.comparison_operator(m[9])
      @target_number = m[10] && m[10].to_i

      @parse_error = false
    end

    # @param humanity [String, nil]
    # @param atmark [String, nil]
    # @return [Integer]
    def parse_critical(humanity, atmark)
      humanity = humanity ? humanity.to_i : 99
      atmark_value = atmark ? ArithmeticEvaluator.new.eval(atmark) : 0

      critical =
        if /^[+-]/.match(atmark)
          [critical_from_humanity(humanity) + atmark_value, 12].min
        elsif atmark
          atmark_value
        else
          critical_from_humanity(humanity)
        end

      return critical
    end

    def critical_from_humanity(humanity)
      if humanity <= 0
        9
      elsif humanity <= 20
        10
      elsif humanity <= 40
        11
      else
        12
      end
    end

    # @param sharp [String, nil]
    # @return [Integer]
    def parse_fumble(sharp)
      sharp_value = sharp ? ArithmeticEvaluator.new.eval(sharp) : 0

      if /^[+-]/.match(sharp)
        2 + sharp_value
      elsif sharp
        sharp_value
      else
        2
      end
    end

    def roll_with_dice_pool
      dice_times = @dice_num - @dice_pool.size
      dice_list = Array.new(dice_times) { @bot.roll(1, 6)[0] } + @dice_pool

      return dice_list.sort
    end

    def command_expr
      modifier = Format.modifier(@modify_number)
      "(#{@dice_num}BB#{modifier}@#{@critical}\##{@fumble}#{@cmp_op}#{@target_number})"
    end

    def interim_expr(dice_list)
      expr = "#{@dice_total}[#{dice_list.join(',')}]#{Format.modifier(@modify_number)}"
      expr += "+20" if critical?

      return expr
    end

    def dice_status
      if fumble?
        "ファンブル"
      elsif critical?
        "クリティカル"
      end
    end

    def fumble?
      @dice_total <= @fumble
    end

    def critical?
      @dice_total >= @critical
    end

    def calc_total
      total = @dice_total + @modify_number
      if fumble?
        total = 0 unless @keep_value_on_fumble
      elsif critical?
        total += 20
      end

      if total < 0
        total = 0
      end

      return total
    end

    def result_compare(total)
      if @cmp_op
        total.send(@cmp_op, @target_number) ? "成功" : "失敗"
      end
    end
  end

  def rollDiceCommand(command)
    if (ret = roll_tables(command, TABLES))
      return ret
    end

    bb = BBCommand.new(command)
    return bb.roll(self)
  end

  TABLES = {
    'EMO' => D66GridTable.new(
      '邂逅表',
      [
        ['家族', '家族', '信頼', '信頼', '忘却', '忘却'],
        ['慈愛', '慈愛', '憧憬', '憧憬', '感銘', '感銘'],
        ['同志', '同志', '幼子', '幼子', '興味', '興味'],
        ['ビジネス', 'ビジネス', '師事', '師事', '好敵手', '好敵手'],
        ['友情', '友情', '忠誠', '忠誠', '恐怖', '恐怖'],
        ['執着', '執着', '軽蔑', '軽蔑', '憎悪', '憎悪'],
      ]
    ),
    'EXPO_A' => Table.new(
      '暴露表',
      '1D6',
      [
        '噂になるがすぐ忘れられる',
        '都市伝説として処理される',
        'ワイドショーをにぎわす',
        'シナリオ中［迫害状態］になる',
        '絆の対象ひとりに正体が知られる',
        '魔獣化暴露表へ'
      ]
    ),
    'EXPO_B' => Table.new(
      '魔獣化暴露表',
      '1D6',
      [
        'トンデモ業界の伝説になる',
        'シナリオ中［迫害状態］になる',
        'シナリオ中［迫害状態］になる',
        '絆の対象ひとりに正体が知られる',
        '絆の対象ひとりに正体が知られる',
        '自衛隊退魔部隊×2D6体の襲撃'
      ]
    ),
    'EXPO_I' => Table.new(
      'アイドル専用暴露表',
      '1D6',
      [
        '愉快な伝説として人気になる',
        'ワイドショーをにぎわす',
        '炎上。シナリオ中［迫害状態］',
        '所属事務所に2D6時間説教される',
        '絆の対象ひとりに正体が知られる',
        'アイドル専用魔獣化暴露表へ'
      ]
    ),
    'EXPO_J' => Table.new(
      'アイドル専用魔獣化暴露表',
      '1D6',
      [
        'シナリオ中［迫害状態］になる',
        'シナリオ中［迫害状態］になる',
        '絆の対象ひとりに正体が知られる',
        '事務所から契約を解除される',
        '絆の対象ひとりに正体が知られる',
        '1D6本のレギュラー番組を失う'
      ]
    ),
    'FACE_A' => Table.new(
      '正体判明チャートA',
      '1D6',
      [
        'あなたを受け入れてくれる',
        'あなたを受け入れてくれる',
        '絆が（拒絶）に書き換わる',
        '絆がエゴに書き換わる',
        '気絶しその事実を忘れる',
        '精神崩壊する'
      ]
    ),
    'FACE_B' => Table.new(
      '正体判明チャートB',
      '1D6',
      [
        'あなたを受け入れてくれる',
        '狂乱し攻撃してくる',
        '退場。その場から逃亡。暴露表へ',
        '絆がエゴに書き換わる',
        '精神崩壊する',
        '精神崩壊する'
      ]
    ),
    'FACE_C' => Table.new(
      '正体判明チャートC',
      '1D6',
      [
        'あなたを受け入れてくれる',
        '退場。その場から逃亡。暴露表へ',
        '退場。その場から逃亡。暴露表へ',
        '絆がエゴに書き換わる',
        '精神崩壊する',
        '精神崩壊する'
      ]
    ),
  }.freeze

  setPrefixes(['\d+BB.*', '\d+R6.*'] + TABLES.keys)
end
