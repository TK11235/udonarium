# -*- coding: utf-8 -*-

# 骰子ボットの読み込みを担当するクラス
class DiceBotLoader
  # ボットの名前として有効なパターン（クラス名のパターン）
  # @see https://docs.ruby-lang.org/ja/1.8.7/doc/spec=2flexical.html#identifier
  # @see https://docs.ruby-lang.org/ja/1.8.7/doc/spec=2fvariables.html
  #
  # * 最初の文字は大文字のアルファベット
  # * 2文字目以降は英数字かアンダースコア（_）
  BOT_NAME_PATTERN = /\A[A-Z]\w*\z/.freeze

  # 収集時に無視するボット名
  #
  # クラス名として有効なもののみ記述する。
  #
  # * 最初の文字は大文字のアルファベット
  # * 2文字目以降は英数字かアンダースコア（_）
  BOT_NAMES_TO_IGNORE = [
    'DiceBot',
    'DiceBotLoader',
    'DiceBotLoaderList'
  ].freeze

  # 有効なゲームタイプかを返す
  # @param [String] gameType ゲームタイプ
  # @return [Boolean]
  #
  # Object.const_getで該当する骰子ボットのクラスを取得するので、
  # クラス名として有効な名前でなければ、無効なゲームタイプと見なす。
  #
  # また、無視するボット名の一覧に含まれるゲームタイプも無効と見なす。
  #
  # '.' や '/' はクラス名には含まれないため、ディレクトリトラバーサル攻撃も
  # これで防げる。
  def self.validGameType?(gameType)
    BOT_NAME_PATTERN === gameType &&
      !BOT_NAMES_TO_IGNORE.include?(gameType)
  end

  # 登録されていないタイトルの骰子ボットを読み込む
  # @param [String] gameType ゲームタイプ
  # @return [DiceBot] 骰子ボットが存在した場合
  # @return [nil] 読み込み時にエラーが発生した場合
  def self.loadUnknownGame(gameType)
    debug('DiceBotLoader.loadUnknownGame gameType', gameType)

    # unless validGameType?(gameType)
    #   # クラス名として正しくない名前が指定された場合、後の
    #   # Object.const_getで必ず失敗するため、読み込みを中止する
    #   debug('DiceBotLoader.loadUnknownGame: 無効なゲームタイプ',
    #         gameType)
    #   return nil
    # end

    # # validGameType?によって '.' や '/' といったディレクトリが変わる文字が
    # # 含まれていないことが保証されているため、必ず骰子ボットディレクトリ
    # # 直下のファイルが参照される
    # fileName = File.expand_path("#{gameType}.rb", File.dirname(__FILE__))

    # unless File.exist?(fileName)
    #   # ファイルが存在しない場合、後のrequireで必ずLoadErrorが発生するため、
    #   # 読み込みを中止する
    #   debug('DiceBotLoader.loadUnknownGame: 骰子ボットファイルが存在しません',
    #         gameType)
    #   return nil
    # end

    begin
      # require(fileName) # TKfix dynamic requireは不可
      # TKfix 骰子ボットファイルがこのディレクトリ内に存在すると仮定して読み込む
      Object.const_get(gameType).new
    rescue LoadError, StandardError => e
      debug('DiceBotLoader.loadUnknownGame: 骰子ボットの読み込みに失敗しました',
            e.to_s)
      nil
    end
  end

  # 骰子ボットディレクトリに含まれる骰子ボットを収集する
  # @return [Array<DiceBot>]
  def self.collectDiceBots
    # TKfix
    # diceBotDir = File.expand_path(File.dirname(__FILE__))

    # require("#{diceBotDir}/DiceBot")

    # botFiles = Dir.glob("#{diceBotDir}/*.rb")
    # botNames =
    #   botFiles.map { |botFile| File.basename(botFile, '.rb').untaint }
    # validBotNames =
    #   # 特別な名前のものを除外する
    #   (botNames - BOT_NAMES_TO_IGNORE).
    #   # 正しいクラス名になるものだけ選ぶ
    #   select { |botName| BOT_NAME_PATTERN === botName }

    # validBotNames.map do |botName|
    #   require("#{diceBotDir}/#{botName}")
    #   Object.const_get(botName).new
    # }
  end

  # 読み込み処理を初期化する
  # @param [String, Array<String>, Regexp] gameTitlePattern ゲームタイトルのパターン
  # @param [Hash] options 追加のオプション
  # @option options [Array<String>] :filenames 読み込む骰子ボットのファイル名の配列
  # @option options [String, Symbol] :class 骰子ボットのクラス
  #
  # できるだけ簡潔に記述できるようにするため、引数のルールを以下のように定める。
  #
  # = gameTitlePatternの型
  # gameTitlePatternには原則として文字列、文字列の配列、正規表現を渡すことができる。
  #
  # 従来と同様の挙動になるように、指定されたタイトルにマッチさせるときの
  # 大文字小文字の扱いを以下のように定める。
  #
  # * 文字列、文字列の配列の場合は、大文字小文字を区別しない。
  # * 正規表現の場合は、正規表現のオプションに従う。
  #
  # = 引数がgameTitlePatternのみの場合
  #
  # gameTitlePatternに文字列、文字列の配列を指定することができる。
  #
  # == gameTitlePatternが文字列の場合
  #
  # 例：
  #
  #   DiceBotLoader.new('Elysion')
  #
  # * マッチするタイトルは 'Elysion'（大文字小文字区別なし）
  # * 読み込む骰子ボットファイルは diceBot/Elysion.rb（大文字小文字区別あり）
  # * 骰子ボットのクラス名は Elysion（大文字小文字区別あり）
  #
  # == gameTitlePatternが文字列の配列の場合
  #
  # 例：
  #
  #   DiceBotLoader.new(%w(Cthulhu COC))
  #
  # * マッチするタイトルは 'Cthulhu', 'COC'（大文字小文字区別なし）
  # * 読み込む骰子ボットファイルは、最初に指定した diceBot/Cthulhu.rb（大文字小文字区別あり）
  #   * 最初が正式名称、以下が別名というイメージ
  # * 骰子ボットのクラス名は Cthulhu（大文字小文字区別あり）
  #
  # = オプション引数として :filenames のみを渡す場合
  #
  # * gameTitlePatternに文字列、文字列の配列、正規表現を指定することができる。
  # * 読み込む骰子ボットファイルを指定することができる。
  #
  # 例：
  #
  #   DiceBotLoader.new(%w(Elric! EL), :filenames => %w(Elric))
  #
  # * マッチするタイトルは 'Elric!', 'EL'（大文字小文字区別なし）
  # * 読み込む骰子ボットファイルは diceBot/Elric.rb（大文字小文字区別あり）
  # * 骰子ボットのクラス名は :filenames で最初に指定した Elric（大文字小文字区別あり）
  #
  # = オプション引数として :filenames と :class を渡す場合
  #
  # * gameTitlePatternに文字列、文字列の配列、正規表現を指定することができる。
  # * 読み込む骰子ボットファイルを指定することができる。
  # * 作成する骰子ボットのクラス名を指定することができる。
  #
  # 例：
  #
  #   DiceBotLoader.new(/\A(?:Parasite\s*Blood|PB)\z/i,
  #                     :filenames => %w(DemonParasite ParasiteBlood),
  #                     :class => :ParasiteBlood)
  #
  # * 正規表現 /\A(?:Parasite\s*Blood|PB)\z/i と指定されたタイトルをマッチさせる
  # * 読み込む骰子ボットファイルは、大文字小文字区別ありで
  #   * diceBot/DemonParasite.rb
  #   * diceBot/ParasiteBlood.rb
  # * 骰子ボットのクラス名は ParasiteBlood（大文字小文字区別あり）
  def initialize(gameTitlePattern, options = {})
    case gameTitlePattern
    when String
      # 扱いを簡単にするために1要素の配列に変える
      #
      # 大文字小文字を区別しないようにするため、すべて小文字に変える
      @gameTitlePattern = [gameTitlePattern.downcase]
    when Array
      # 大文字小文字を区別しないようにするため、すべて小文字に変える
      @gameTitlePattern = gameTitlePattern.map(&:downcase)
    when Regexp
      unless options[:filenames]
        raise ArgumentError,
              'options[:filenames] is required when gameTitlePattern is a Regexp'
      end

      @gameTitlePattern = gameTitlePattern
    else
      raise TypeError,
            'gameTitlePattern must be a String or an Array<String> or a Regexp'
    end

    # 既定の読み込むファイル名の配列
    # 大文字小文字を区別することに注意
    defaultFilenames =
      case gameTitlePattern
      when String
        [gameTitlePattern]
      when Array
        [gameTitlePattern.first]
      when Regexp
        []
      end

    @filenames = options[:filenames] || defaultFilenames
    @diceBotClass = options[:class] || @filenames.first
  end

  # 指定されたゲームタイトルがパターンとマッチするかを返す
  # @return [Boolean]
  #
  # マッチするパターンが文字列や文字列の配列で指定されていた場合は
  # 指定されたゲームタイトルの大文字小文字を区別しないようにする。
  #
  # 正規表現の場合は指定されたゲームタイトルをそのまま正規表現と
  # マッチさせる。
  def match?(gameTitle)
    case @gameTitlePattern
    when Array
      @gameTitlePattern.include?(gameTitle.downcase)
    when Regexp
      @gameTitlePattern === gameTitle
    end
  end

  # 骰子ボットを読み込む
  # @return [DiceBot]
  def loadDiceBot
    @filenames.each do |filename|
      # TKfix dynamic requireは不可
      #require_path = File.expand_path(filename, File.dirname(__FILE__))
      #require(require_path)
    end

    Object.const_get(@diceBotClass).new
  end
end
