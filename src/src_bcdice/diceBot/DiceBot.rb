# -*- coding: utf-8 -*-
# frozen_string_literal: true

class DiceBot
  # 空の接頭辞（反応するコマンド）
  EMPTY_PREFIXES_PATTERN = /(^|\s)(S)?()(\s|$)/i.freeze

  # ゲームシステムの識別子
  ID = 'DiceBot'

  # ゲームシステム名
  NAME = 'DiceBot'

  # ゲームシステム名の読みがな
  SORT_KEY = '*たいすほつと'

  # ダイスボットの使い方
  HELP_MESSAGE = ''

  class << self
    # 接頭辞（反応するコマンド）の配列を返す
    # @return [Array<String>]
    attr_reader :prefixes

    # 接頭辞（反応するコマンド）の正規表現を返す
    # @return [Regexp]
    attr_reader :prefixesPattern

    # 接頭辞（反応するコマンド）を設定する
    # @param [Array<String>] prefixes 接頭辞のパターンの配列
    # @return [self]
    def setPrefixes(prefixes)
      @prefixes = prefixes.
                  # 最適化が効くように内容の文字列を変更不可にする
                  map(&:freeze).
                  # 配列全体を変更不可にする
                  freeze
      @prefixesPattern = /(^|\s)(S)?(#{prefixes.join('|')})(\s|$)/i.freeze

      self
    end

    # 接頭辞（反応するコマンド）をクリアする
    # @return [self]
    def clearPrefixes
      @prefixes = [].freeze
      @prefixesPattern = EMPTY_PREFIXES_PATTERN

      self
    end

    private

    # 継承された際にダイスボットの接頭辞リストをクリアする
    # @param [DiceBot] subclass DiceBotを継承したクラス
    # @return [void]
    def inherited(subclass)
      subclass.clearPrefixes
    end
  end

  clearPrefixes

  @@bcdice = nil

  DEFAULT_SEND_MODE = 2 # デフォルトの送信形式(0=結果のみ,1=0+式,2=1+ダイス個別)

  def initialize
    @sendMode = DEFAULT_SEND_MODE # (0=結果のみ,1=0+式,2=1+ダイス個別)
    @sortType = 0 # ソート設定(1 = 足し算ダイスでソート有, 2 = バラバラロール（Bコマンド）でソート有, 3 = １と２両方ソート有）
    @sameDiceRerollCount = 0 # ゾロ目で振り足し(0=無し, 1=全部同じ目, 2=ダイスのうち2個以上同じ目)
    @sameDiceRerollType = 0 # ゾロ目で振り足しのロール種別(0=判定のみ, 1=ダメージのみ, 2=両方)
    @d66Type = 1 # d66の差し替え(0=D66無し, 1=順番そのまま([5,3]->53), 2=昇順入れ替え([5,3]->35)
    @isPrintMaxDice = false # 最大値表示
    @upperRollThreshold = 0 # 上方無限
    @unlimitedRollDiceType = 0 # 無限ロールのダイス
    @rerollNumber = 0 # 振り足しする条件
    @defaultSuccessTarget = "" # 目標値が空欄の時の目標値
    @rerollLimitCount = 10000 # 振り足し回数上限
    @fractionType = "omit" # 端数の処理 ("omit"=切り捨て, "roundUp"=切り上げ, "roundOff"=四捨五入)

    if !prefixs.empty? && self.class.prefixes.empty?
      # 従来の方法（#prefixs）で接頭辞を設定していた場合でも
      # クラス側に接頭辞が設定されるようにする
      warn("#{id}: #prefixs is deprecated. Please use .setPrefixes.")
      self.class.setPrefixes(prefixs)
    end
  end

  attr_accessor :rerollLimitCount

  attr_reader :sendMode, :sameDiceRerollCount, :sameDiceRerollType, :d66Type
  attr_reader :isPrintMaxDice, :upperRollThreshold
  attr_reader :defaultSuccessTarget, :rerollNumber, :fractionType

  # ダイスボット設定後に行う処理
  # @return [void]
  #
  # 既定では何もしない。
  def postSet
    # 何もしない
  end

  # ダイスボットについての情報を返す
  # @return [Hash]
  def info
    {
      'gameType' => id,
      'name' => name,
      'sortKey' => sort_key,
      'prefixs' => self.class.prefixes,
      'info' => help_message,
    }
  end

  # ゲームシステムの識別子を返す
  # @return [String]
  def id
    self.class::ID
  end

  # ゲームシステムの識別子を返す
  # @return [String]
  # @deprecated 代わりに {#id} を使ってください
  def gameType
    warn("#{id}: #gameType is deprecated. Please use #id.")
    return id
  end

  # ゲームシステム名を返す
  # @return [String]
  def name
    self.class::NAME
  end

  # ゲームシステム名を返す
  # @return [String]
  # @deprecated 代わりに {#name} を使ってください
  def gameName
    warn("#{id}: #gameName is deprecated. Please use #name.")
    return name
  end

  # ゲームシステム名の読みがなを返す
  # @return [String]
  def sort_key
    self.class::SORT_KEY
  end

  # ダイスボットの使い方を返す
  # @return [String]
  def help_message
    self.class::HELP_MESSAGE
  end

  # ダイスボットの使い方を返す
  # @return [String]
  # @deprecated 代わりに {#help_message} を使ってください
  def getHelpMessage
    warn("#{id}: #getHelpMessage is deprecated. Please use #help_message.")
    return help_message
  end

  # 接頭辞（反応するコマンド）の配列を返す
  # @return [Array<String>]
  def prefixes
    self.class.prefixes
  end

  # @deprecated 代わりに {#prefixes} を使ってください
  alias prefixs prefixes

  def setSendMode(m)
    @sendMode = m
  end

  attr_writer :upperRollThreshold

  def bcdice=(b)
    @@bcdice = b
  end

  def bcdice
    @@bcdice
  end

  def rand(max)
    @@bcdice.rand(max)
  end

  def roll(*args)
    @@bcdice.roll(*args)
  end

  def marshalSignOfInequality(*args)
    @@bcdice.marshalSignOfInequality(*args)
  end

  def unlimitedRollDiceType
    @@bcdice.unlimitedRollDiceType
  end

  attr_reader :sortType

  def setSortType(s)
    @sortType = s
  end

  def d66(*args)
    @@bcdice.getD66Value(*args)
  end

  def parren_killer(string)
    @@bcdice.parren_killer(string)
  end

  def changeText(string)
    debug("DiceBot.parren_killer_add called")
    string
  end

  def dice_command(string, nick_e)
    string = @@bcdice.getOriginalMessage if isGetOriginalMessage

    debug('dice_command Begin string', string)
    secret_flg = false

    unless self.class.prefixesPattern =~ string
      debug('not match in prefixes')
      return '1', secret_flg
    end

    secretMarker = Regexp.last_match(2)
    command = Regexp.last_match(3)

    command = removeDiceCommandMessage(command)
    debug("dicebot after command", command)

    debug('match')

    output_msg, secret_flg = rollDiceCommandCatched(command)
    output_msg = '1' if output_msg.nil? || output_msg.empty?
    secret_flg ||= false

    output_msg = "#{nick_e}: #{output_msg}" if output_msg != '1'

    if secretMarker # 隠しロール
      secret_flg = true if output_msg != '1'
    end

    return output_msg, secret_flg
  end

  # 通常ダイスボットのコマンド文字列は全て大文字に強制されるが、
  # これを嫌う場合にはこのメソッドを true を返すようにオーバーライドすること。
  def isGetOriginalMessage
    false
  end

  def removeDiceCommandMessage(command)
    # "2d6 Attack" のAttackのようなメッセージ部分をここで除去
    command.sub(/[\s　].+/, '')
  end

  def rollDiceCommandCatched(command)
    result = nil
    begin
      debug('call rollDiceCommand command', command)
      result, secret_flg = rollDiceCommand(command)
    rescue StandardError => e
      debug("executeCommand exception", e.to_s, e.backtrace.join("\n"))
    end

    debug('rollDiceCommand result', result)

    return result, secret_flg
  end

  def rollDiceCommand(_command)
    nil
  end

  def dice_command_xRn(_string, _nick_e)
    ''
  end

  # @param total [Integer] コマンド合計値
  # @param dice_total [Integer] ダイス目の合計値
  # @param dice_list [Array<Integer>] ダイスの一覧
  # @param sides [Integer] 振ったダイスの面数
  # @param cmp_op [Symbol] 比較演算子
  # @param target [Integer, String] 目標値の整数か'?'
  # @return [String]
  def check_result(total, dice_total, dice_list, sides, cmp_op, target)
    ret =
      case [dice_list.size, sides]
      when [1, 100]
        check_1D100(total, dice_total, cmp_op, target)
      when [1, 20]
        check_1D20(total, dice_total, cmp_op, target)
      when [2, 6]
        check_2D6(total, dice_total, dice_list, cmp_op, target)
      end

    return ret unless ret.nil? || ret.empty?

    ret =
      case sides
      when 10
        check_nD10(total, dice_total, dice_list, cmp_op, target)
      when 6
        check_nD6(total, dice_total, dice_list, cmp_op, target)
      end

    return ret unless ret.nil? || ret.empty?

    check_nDx(total, cmp_op, target)
  end

  # 成功か失敗かを文字列で返す
  #
  # @param (see #check_result)
  # @return [String]
  def check_nDx(total, cmp_op, target)
    return " ＞ 失敗" if target.is_a?(String)

    # Due to Ruby 1.8
    success = cmp_op == :"!=" ? total != target : total.send(cmp_op, target)
    if success
      " ＞ 成功"
    else
      " ＞ 失敗"
    end
  end

  # @abstruct
  # @param (see #check_result)
  # @return [nil]
  def check_1D100(total, dice_total, cmp_op, target); end

  # @abstruct
  # @param (see #check_result)
  # @return [nil]
  def check_1D20(total, dice_total, cmp_op, target); end

  # @abstruct
  # @param (see #check_result)
  # @return [nil]
  def check_nD10(total, dice_total, dice_list, cmp_op, target); end

  # @abstruct
  # @param (see #check_result)
  # @return [nil]
  def check_2D6(total, dice_total, dice_list, cmp_op, target); end

  # @abstruct
  # @param (see #check_result)
  # @return [nil]
  def check_nD6(total, dice_total, dice_list, cmp_op, target); end

  def get_table_by_2d6(table)
    get_table_by_nD6(table, 2)
  end

  def get_table_by_1d6(table)
    get_table_by_nD6(table, 1)
  end

  def get_table_by_nD6(table, count)
    get_table_by_nDx(table, count, 6)
  end

  def get_table_by_nDx(table, count, diceType)
    num, = roll(count, diceType)

    text = getTableValue(table[num - count])

    return '1', 0 if text.nil?

    return text, num
  end

  def get_table_by_1d3(table)
    debug("get_table_by_1d3")

    count = 1
    num, = roll(count, 6)
    debug("num", num)

    index = ((num - 1) / 2)
    debug("index", index)

    text = table[index]

    return '1', 0 if text.nil?

    return text, num
  end

  def getD66(isSwap)
    return bcdice.getD66(isSwap)
  end

  # D66 ロール用（スワップ、たとえば出目が【６，４】なら「６４」ではなく「４６」とする
  def get_table_by_d66_swap(table)
    isSwap = true
    number = bcdice.getD66(isSwap)
    return get_table_by_number(number, table), number
  end

  # D66 ロール用
  def get_table_by_d66(table)
    dice1, = roll(1, 6)
    dice2, = roll(1, 6)

    num = (dice1 - 1) * 6 + (dice2 - 1)

    text = table[num]

    indexText = "#{dice1}#{dice2}"

    return '1', indexText if text.nil?

    return text, indexText
  end

  # ダイスロールによるポイント等の取得処理用（T&T悪意、ナイトメアハンター・ディープ宿命、特命転校生エクストラパワーポイントなど）
  def getDiceRolledAdditionalText(_n1, _n_max, _dice_max)
    ''
  end

  # ダイス目による補正処理（現状ナイトメアハンターディープ専用）
  def getDiceRevision(_n_max, _dice_max, _total_n)
    return '', 0
  end

  # ガンドッグのnD9専用
  def isD9
    false
  end

  # シャドウラン4版用グリッチ判定
  def getGrichText(_numberSpot1, _dice_cnt_total, _suc)
    ''
  end

  # 振り足しを行うべきかを返す
  # @param [Integer] loop_count ループ数
  # @return [Boolean]
  def should_reroll?(loop_count)
    loop_count < @rerollLimitCount || @rerollLimitCount == 0
  end

  # ** 汎用表サブルーチン
  def get_table_by_number(index, table, default = '1')
    table.each do |item|
      number = item[0]
      if number >= index
        return getTableValue(item[1])
      end
    end

    return getTableValue(default)
  end

  def getTableValue(data)
    if( data.kind_of?( Proc ) )
      # TKfix Procオブジェクトで一旦ブロック化しないとOpalで変換したときに正常に処理されない
      lambdaBlock = lambda{ return data.call() }
      return lambdaBlock.call()
    end

    return data
  end

  def analyzeDiceCommandResultMethod(command)
    # get～DiceCommandResultという名前のメソッドを集めて実行、
    # 結果がnil以外の場合それを返して終了。

    # TKfix public_methods(false)だと[]が返ってくる
    #methodList = public_methods(false).select do |method|
    #  /^get.+DiceCommandResult$/ === method.to_s
    #end

    methodList = public_methods().select do |method|
      /^get.+DiceCommandResult$/ === method.to_s
    end

    methodList.each do |method|
      result = send(method, command)
      return result unless result.nil?
    end

    return nil
  end

  def get_table_by_nDx_extratable(table, count, diceType)
    number, diceText = roll(count, diceType)
    text = getTableValue(table[number - count])
    return text, number, diceText
  end

  def getTableCommandResult(command, tables, isPrintDiceText = true)
    # info = tables[command]
    info = tables[command.upcase] # TKfix extratables互換性
    return nil if info.nil?

    name = info[:name]
    type = info[:type].upcase
    table = info[:table]

    if (type == 'D66') && (@d66Type == 2)
      type = 'D66S'
    end

    text, number, diceText =
      case type
      when /(\d+)D(\d+)/
        count = Regexp.last_match(1).to_i
        diceType = Regexp.last_match(2).to_i
        limit = diceType * count - (count - 1)
        table = getTableInfoFromExtraTableText(table, limit)
        get_table_by_nDx_extratable(table, count, diceType)
      when 'D66', 'D66N'
        table = getTableInfoFromExtraTableText(table, 36)
        item, value = get_table_by_d66(table)
        value = value.to_i
        output = item[1]
        #diceText = (value / 10).to_s + "," + (value % 10).to_s
        diceText = (value / 10).floor.to_s  + "," + (value % 10).to_s # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
        [output, value, diceText]
      when 'D66S'
        table = getTableInfoFromExtraTableText(table, 21)
        output, value = get_table_by_d66_swap(table)
        value = value.to_i
        #diceText = (value / 10).to_s + "," + (value % 10).to_s
        diceText = (value / 10).floor.to_s  + "," + (value % 10).to_s # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
        [output, value, diceText]
      else
        raise "invalid dice Type #{command}"
      end

    text = text.gsub("\\n", "\n")
    text = @@bcdice.rollTableMessageDiceText(text)

    return nil if text.nil?

    return "#{name}(#{number}[#{diceText}]) ＞ #{text}" if isPrintDiceText && !diceText.nil?

    return "#{name}(#{number}) ＞ #{text}"
  end

  def getTableInfoFromExtraTableText(text, count = nil)
    if text.is_a?(String)
      text = text.split(/\n/)
    end

    newTable = text.map do |item|
      if item.is_a?(String) && (/^(\d+):(.*)/ === item)
        [Regexp.last_match(1).to_i, Regexp.last_match(2)]
      else
        item
      end
    end

    unless count.nil?
      if newTable.size != count
        raise "invalid table size:#{newTable.size}\n#{newTable.inspect}"
      end
    end

    return newTable
  end

  def roll_tables(command, tables)
    #table = tables[command]
    table = tables[command.upcase] # TKfix extratables互換性
    unless table
      return nil
    end

    return table.roll(bcdice).to_s
  end
end
