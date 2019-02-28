# -*- coding: utf-8 -*-

class DiceOfTheDead < DiceBot
  setPrefixes(['(ZMB|BIO).*'])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @d66Type = 2
  end

  def gameName
    'ダイス・オブ・ザ・デッド'
  end

  def gameType
    "DiceOfTheDead"
  end

  def getHelpMessage
    info = <<INFO_MESSAGE_TEXT
・ゾンビ化表　ZMB+x
（x=オープン中の感染度マスの数。+xは省略可能、省略時は0）
・感染度表　BIOx
（xは被弾回数。xは省略可能、省略時は1）
（上記二つは最初からシークレットダイスで行われます）
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    command = command.upcase

    result = ''
    secret_flg = false

    case command
    when /^BIO(\d+)?$/i
      roll_times = ($1 or 1).to_i
      result = checkInfection( roll_times )
      secret_flg = true
    when /^ZMB(\+(\d+))?$/i
      value = $2.to_i
      result = rollZombie( value )
      secret_flg = true
    end

    return result, secret_flg
  end

  def checkInfection(roll_times)

    result = "感染度表"

    roll_times.times do

      d1, = roll(1, 6)
      d2, = roll(1, 6)

      result += "　＞　出目：#{d1}、#{d2}　"

      index1 = (d1 / 2.0).ceil - 1
      index2 = (d2 / 2.0).ceil - 1

      table =
        [["「右下（【足】＋１）」", "「右中（【足】＋１）」", "「右上（【足】＋１）」"],
         ["「中下（【腕】＋１）」", "「真中（【腕】＋１）」", "「中上（【腕】＋１）」"],
         ["「左下（【頭】＋１）」", "「左中（【頭】＋１）」", "「左上（【頭】＋１）」"],
        ]

      result += table[index1][index2]
    end

    return result
  end

  ####################
  # 各種表

  def rollZombie(value)

    d1, = roll(1, 6)
    d2, = roll(1, 6)

    diceTotal = d1 + d2 + value

    table = [
             [5, "５以下：影響なし"],
             [6, "６：任意の部位を１点回復"],
             [7, "７：〈アイテム〉武器を１つその場に落とす"],
             [8, "８：〈アイテム〉便利道具１つをその場に落とす"],
             [9, "９：〈アイテム〉消耗品１つをその場に落とす"],
             [10, "１０：腕の傷が広がる。「部位：【腕】」１点ダメージ"],
             [11, "１１：足の傷が広がる。「部位：【足】」１点ダメージ"],
             [12, "１２：頭の傷が広がる。「部位：【頭】」１点ダメージ"],
             [13, "１３：【ゾンビ化表】が新たに適用されるまで「【感染度】＋１マス」の効果を受ける"],
             [14, "１４：即座に自分以外の味方１人のスロット内の〈アイテム〉１つをランダムに捨てさせる"],
             [15, "１５：味方１人に素手で攻撃を行う"],
             [16, "１６：即座に感染度が１上昇する"],
             [17, "１７：次のターンのみ、すべての【能力値】を２倍にする"],
             [18, "１８以上：自分以外の味方１人にできる限り全力で攻撃を行う。〈アイテム〉も可能な限り使用する"]
            ]

    minDice = table.first.first
    maxDice = table.last.first
    index = diceTotal
    index = [minDice, index].max
    index = [index, maxDice].min

    number, text = table.assoc(index)
    result = "ゾンビ化表　＞　出目：#{d1}＋#{d2}　感染度：#{value}　合計値：#{diceTotal}　＞　#{text}"

    return result
  end
end
