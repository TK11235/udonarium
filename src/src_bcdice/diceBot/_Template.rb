# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Template < DiceBot
  # ゲームシステムの識別子
  ID = 'SystemID'

  # ゲームシステム名
  NAME = 'ゲームシステム名'

  # ゲームシステム名の読みがな
  #
  # 「ゲームシステム名の読みがなの設定方法」（docs/dicebot_sort_key.md）を参考にして
  # 設定してください
  SORT_KEY = 'けえむしすてむめい'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
ヘルプメッセージ
ダイスボットの使い方をここに記述します。
MESSAGETEXT

  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes([])

  def initialize
    super

    # @sendMode = DEFAULT_SEND_MODE #(0=結果のみ,1=0+式,2=1+ダイス個別)
    # @sortType = 0;      #ソート設定(1 = 足し算ダイスでソート有, 2 = バラバラロール（Bコマンド）でソート有, 3 = １と２両方ソート有）
    # @sameDiceRerollCount = 0;     #ゾロ目で振り足し(0=無し, 1=全部同じ目, 2=ダイスのうち2個以上同じ目)
    # @sameDiceRerollType = 0;   #ゾロ目で振り足しのロール種別(0=判定のみ, 1=ダメージのみ, 2=両方)
    # @d66Type = 0;        #d66の差し替え
    # @isPrintMaxDice = false;      #最大値表示
    # @upplerRollThreshold = 0;      #上方無限
    # @unlimitedRollDiceType = 0;    #無限ロールのダイス
    # @rerollNumber = 0;      #振り足しする条件
    # @defaultSuccessTarget = "";      #目標値が空欄の時の目標値
    # @rerollLimitCount = 0;    #振り足し回数上限
    # @fractionType = "omit";     #端数の処理 ("omit"=切り捨て, "roundUp"=切り上げ, "roundOff"=四捨五入)
  end

  def changeText(string)
    string
  end

  def rollDiceCommand(_command)
    ''
  end

  # ゲーム別成功度判定(2D6)
  def check_2D6(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)
    ''
  end

  # ゲーム別成功度判定(nD6)
  def check_nD6(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)
    ''
  end

  # ゲーム別成功度判定(nD10)
  def check_nD10(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)
    ''
  end

  # ゲーム別成功度判定(1d100)
  def check_1D100(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)
    ''
  end

  # ゲーム別成功度判定(1d20)
  def check_1D20(_total_n, _dice_n, _signOfInequality, _diff, _dice_cnt, _dice_max, _n1, _n_max)
    ''
  end

  # 以下のメソッドはテーブルの参照用に便利
  # get_table_by_2d6(table)
  # get_table_by_1d6(table)
  # get_table_by_nD6(table, 1)
  # get_table_by_nD6(table, count)
  # get_table_by_1d3(table)
  # get_table_by_number(index, table)
  # get_table_by_d66(table)
end
