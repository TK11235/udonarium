# -*- coding: utf-8 -*-

class DiceBot
  # 空の接頭辞（反応するコマンド）
  EMPTY_PREFIXES_PATTERN = /(^|\s)(S)?()(\s|$)/i.freeze

  # 接頭辞（反応するコマンド）の配列を返す
  # @return [Array<String>]
  class << self
    attr_reader :prefixes
  end

  # 接頭辞（反応するコマンド）の正規表現を返す
  # @return [Regexp]
  class << self
    attr_reader :prefixesPattern
  end

  # 接頭辞（反応するコマンド）を設定する
  # @param [Array<String>] prefixes 接頭辞のパターンの配列
  # @return [self]
  def self.setPrefixes(prefixes)
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
  def self.clearPrefixes
    @prefixes = [].freeze
    @prefixesPattern = EMPTY_PREFIXES_PATTERN

    self
  end

  # 継承された際に骰子ボットの接頭辞リストをクリアする
  # @param [DiceBot] subclass DiceBotを継承したクラス
  # @return [void]
  def self.inherited(subclass)
    subclass.clearPrefixes
  end

  clearPrefixes

  @@bcdice = nil

  @@DEFAULT_SEND_MODE = 2 # デフォルトの送信形式(0=結果のみ,1=0+式,2=1+骰子個別)

  def initialize
    @sendMode = @@DEFAULT_SEND_MODE # (0=結果のみ,1=0+式,2=1+骰子個別)
    @sortType = 0 # ソート設定(1 = 足し算骰子でソート有, 2 = バラバラロール（Bコマンド）でソート有, 3 = １と２両方ソート有）
    @sameDiceRerollCount = 0 # ゾロ目で振り足し(0=無し, 1=全部同じ目, 2=骰子のうち2個以上同じ目)
    @sameDiceRerollType = 0 # ゾロ目で振り足しのロール種別(0=判定のみ, 1=ダメージのみ, 2=両方)
    @d66Type = 1 # d66の差し替え(0=D66無し, 1=順番そのまま([5,3]->53), 2=升序入れ替え([5,3]->35)
    @isPrintMaxDice = false # 最大値表示
    @upplerRollThreshold = 0      # 上方無限
    @unlimitedRollDiceType = 0    # 無限ロールの骰子
    @rerollNumber = 0 # 振り足しする条件
    @defaultSuccessTarget = "" # 目標値が空欄の時の目標値
    @rerollLimitCount = 10000 # 振り足し回数上限
    @fractionType = "omit" # 端数の処理 ("omit"=切り捨て, "roundUp"=切り上げ, "roundOff"=四捨五入)

    @gameType = 'DiceBot'

    if !prefixs.empty? && self.class.prefixes.empty?
      # 従来の方法（#prefixs）で接頭辞を設定していた場合でも
      # クラス側に接頭辞が設定されるようにする
      warn("#{gameType}: #prefixs is deprecated. Please use .setPrefixes.")
      self.class.setPrefixes(prefixs)
    end
  end

  attr_accessor :rerollLimitCount

  attr_reader :sendMode, :sameDiceRerollCount, :sameDiceRerollType, :d66Type
  attr_reader :isPrintMaxDice, :upplerRollThreshold
  attr_reader :defaultSuccessTarget, :rerollNumber, :fractionType

  # 骰子ボット設定後に行う処理
  # @return [void]
  #
  # 既定では何もしない。
  def postSet
    # 何もしない
  end

  def info
    {
      'name' => gameName,
      'gameType' => gameType,
      'prefixs' => self.class.prefixes,
      'info' => getHelpMessage,
    }
  end

  def gameName
    gameType
  end

  # 接頭辞（反応するコマンド）の配列を返す
  # @return [Array<String>]
  def prefixes
    self.class.prefixes
  end

  # @deprecated 代わりに {#prefixes} を使ってください
  alias prefixs prefixes

  attr_reader :gameType

  def setGameType(type)
    @gameType = type
  end

  def setSendMode(m)
    @sendMode = m
  end

  attr_writer :upplerRollThreshold

  def bcdice=(b)
    @@bcdice = b
  end

  def bcdice
    @@bcdice
  end

  def rand(max)
    @@bcdice.rand(max)
  end

  def check_suc(*params)
    @@bcdice.check_suc(*params)
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

  def rollDiceAddingUp(*arg)
    @@bcdice.rollDiceAddingUp(*arg)
  end

  def getHelpMessage
    ''
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

  # 通常骰子ボットのコマンド文字列は全て大文字に強制されるが、
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

  def setDiceText(diceText)
    debug("setDiceText diceText", diceText)
    @diceText = diceText
  end

  def setDiffText(diffText)
    @diffText = diffText
  end

  def dice_command_xRn(_string, _nick_e)
    ''
  end

  def check_2D6(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(2D6)
    ''
  end

  def check_nD6(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(nD6)
    ''
  end

  def check_nD10(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max) # ゲーム別成功度判定(nD10)
    ''
  end

  def check_1D100(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)    # ゲーム別成功度判定(1d100)
    ''
  end

  def check_1D20(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)     # ゲーム別成功度判定(1d20)
    ''
  end

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

  # 骰子ロールによるポイント等の取得処理用（T&T悪意、ナイトメアハンター・ディープ宿命、特命転校生エクストラパワーポイントなど）
  def getDiceRolledAdditionalText(_n1, _n_max, _dice_max)
    ''
  end

  # 骰子目による補正処理（現状ナイトメアハンターディープ専用）
  def getDiceRevision(_n_max, _dice_max, _total_n)
    return '', 0
  end

  # 骰子目文字列から骰子値を変更する場合の処理（現状クトゥルフ・テック専用）
  def changeDiceValueByDiceText(dice_now, _dice_str, _isCheckSuccess, _dice_max)
    dice_now
  end

  # SW専用
  def setRatingTable(_nick_e, _tnick, _channel_to_list)
    '1'
  end

  # ガンドッグのnD9専用
  def isD9
    false
  end

  # シャドウラン4版用グリッチ判定
  def getGrichText(_numberSpot1, _dice_cnt_total, _suc)
    ''
  end

  # SW2.0 の超成功用
  def check2dCritical(critical, dice_new, dice_arry, loop_count); end

  def is2dCritical
    false
  end

  # 振り足しを行うべきかを返す
  # @param [Integer] loop_count ループ数
  # @return [Boolean]
  def should_reroll?(loop_count)
    loop_count < @rerollLimitCount || @rerollLimitCount == 0
  end

  def getDiceList
    getDiceListFromDiceText(@diceText)
  end

  def getDiceListFromDiceText(diceText)
    debug("getDiceList diceText", diceText)

    diceList = []

    if /\[([\d,]+)\]/ =~ diceText
      diceText = Regexp.last_match(1)
    end

    return diceList unless /([\d,]+)/ =~ diceText

    diceString = Regexp.last_match(1)
    diceList = diceString.split(/,/).collect { |i| i.to_i }

    debug("diceList", diceList)

    return diceList
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

    return table.roll(bcdice)
  end
end
