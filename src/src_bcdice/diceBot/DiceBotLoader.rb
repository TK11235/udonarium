# -*- coding: utf-8 -*-
# frozen_string_literal: true

# ダイスボットの読み込みを担当するクラス
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
  # Object.const_getで該当するダイスボットのクラスを取得するので、
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

  # 登録されていないタイトルのダイスボットを読み込む
  # @param [String] gameType ゲームタイプ
  # @return [DiceBot] ダイスボットが存在した場合
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
    # # 含まれていないことが保証されているため、必ずダイスボットディレクトリ
    # # 直下のファイルが参照される
    # fileName = File.expand_path("#{gameType}.rb", File.dirname(__FILE__))

    # unless File.exist?(fileName)
    #   # ファイルが存在しない場合、後のrequireで必ずLoadErrorが発生するため、
    #   # 読み込みを中止する
    #   debug('DiceBotLoader.loadUnknownGame: ダイスボットファイルが存在しません',
    #         gameType)
    #   return nil
    # end

    begin
      # require(fileName) # TKfix dynamic requireは不可
      # TKfix ダイスボットファイルがこのディレクトリ内に存在すると仮定して読み込む
      Object.const_get(gameType).new
    rescue LoadError, StandardError => e
      debug('DiceBotLoader.loadUnknownGame: ダイスボットの読み込みに失敗しました',
            e.to_s)
      nil
    end
  end

  # ダイスボットディレクトリに含まれるダイスボットを収集する
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
  # @option options [Array<String>] :filenames 読み込むダイスボットのファイル名の配列
  # @option options [String, Symbol] :class ダイスボットのクラス
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
  # * 読み込むダイスボットファイルは diceBot/Elysion.rb（大文字小文字区別あり）
  # * ダイスボットのクラス名は Elysion（大文字小文字区別あり）
  #
  # == gameTitlePatternが文字列の配列の場合
  #
  # 例：
  #
  #   DiceBotLoader.new(%w(Cthulhu COC))
  #
  # * マッチするタイトルは 'Cthulhu', 'COC'（大文字小文字区別なし）
  # * 読み込むダイスボットファイルは、最初に指定した diceBot/Cthulhu.rb（大文字小文字区別あり）
  #   * 最初が正式名称、以下が別名というイメージ
  # * ダイスボットのクラス名は Cthulhu（大文字小文字区別あり）
  #
  # = オプション引数として :filenames のみを渡す場合
  #
  # * gameTitlePatternに文字列、文字列の配列、正規表現を指定することができる。
  # * 読み込むダイスボットファイルを指定することができる。
  #
  # 例：
  #
  #   DiceBotLoader.new(%w(Elric! EL), :filenames => %w(Elric))
  #
  # * マッチするタイトルは 'Elric!', 'EL'（大文字小文字区別なし）
  # * 読み込むダイスボットファイルは diceBot/Elric.rb（大文字小文字区別あり）
  # * ダイスボットのクラス名は :filenames で最初に指定した Elric（大文字小文字区別あり）
  #
  # = オプション引数として :filenames と :class を渡す場合
  #
  # * gameTitlePatternに文字列、文字列の配列、正規表現を指定することができる。
  # * 読み込むダイスボットファイルを指定することができる。
  # * 作成するダイスボットのクラス名を指定することができる。
  #
  # 例：
  #
  #   DiceBotLoader.new(/\A(?:Parasite\s*Blood|PB)\z/i,
  #                     :filenames => %w(DemonParasite ParasiteBlood),
  #                     :class => :ParasiteBlood)
  #
  # * 正規表現 /\A(?:Parasite\s*Blood|PB)\z/i と指定されたタイトルをマッチさせる
  # * 読み込むダイスボットファイルは、大文字小文字区別ありで
  #   * diceBot/DemonParasite.rb
  #   * diceBot/ParasiteBlood.rb
  # * ダイスボットのクラス名は ParasiteBlood（大文字小文字区別あり）
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

  # ダイスボットを読み込む
  # @return [DiceBot]
  def loadDiceBot
    # TKfix dynamic requireは不可
    #@filenames.each do |filename|
    #  require_path = File.expand_path(filename, File.dirname(__FILE__))
    #  require(require_path)
    #end

    Object.const_get(@diceBotClass).new
  end
end
