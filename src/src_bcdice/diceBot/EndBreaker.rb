# -*- coding: utf-8 -*-

class EndBreaker < DiceBot
  setPrefixes(['\d+EB', 'LDUT'])

  def initialize
    super

    @sendMode = 2
    @d66Type = 1
  end

  def gameName
    'エンドブレイカー'
  end

  def gameType
    "EndBreaker"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・判定 (nEB)
  n個のD6を振る判定。ダブルトリガー発動で自動振り足し。
・各種表
  ・生死不明表 (LDUT)
MESSAGETEXT
  end

  def rollDiceCommand(command)
    if /(\d+)EB/i === command
      diceCount = $1.to_i
      return checkRoll(diceCount)
    end

    tableName = ""
    text = ""
    number = 0

    case command
    when "LDUT"
      tableName = "生死不明表"
      text, number = getLifeAndDeathUnknownResult()
    else
      return nil
    end

    result = "#{tableName}(#{number}):#{text}"

    return result
  end

  def checkRoll(diceCount)
    debug("EndBreaker diceCount", diceCount)

    rollCount = diceCount # ダブルトリガー

    result = ""
    diceFullList = []

    while rollCount != 0
      _, dice_str = roll(rollCount, 6)
      diceList = dice_str.split(/,/).collect { |i| i.to_i }.sort
      diceFullList.concat(diceList)

      # 1の出目ごとにダブルトリガーで2個ダイス追加
      rollCount = diceList.select { |i| i == 1 }.size * 2

      result += "[#{diceList.join}]"
      result += " ダブルトリガー! " if rollCount > 0
    end

    # ダイスの出目の個数を集計
    result += " ＞"
    for num in 2..6
      count = diceFullList.select { |i| i == num }.size
      result += " [#{num}:#{count}個]" unless count == 0
    end

    return result
  end

  def getLifeAndDeathUnknownResult()
    table = [
             ' 1日：生還！',
             ' 1日：生還！',
             ' 1日：生還！',
             ' 1日：生還！',
             ' 1日：生還！',
             ' 1日：生還！',

             ' 1日：生還！',
             ' 5日：敵に捕らわれ、ひどい暴行と拷問を受けた。',
             ' 2日：謎の人物に命を救われた。',
             '10日：奴隷として売り飛ばされた。',
             ' 8日：おぞましい儀式の生贄として連れ去られた。',
             ' 9日：幽閉・投獄された。',

             ' 1日：生還！',
             ' 7日：モンスター蠢く地下迷宮に滑落した。',
             '12日強力なマスカレイドにとらわれ、実験台にされた。',
             ' 8日：放浪中に遭遇した事件を、颯爽と解決していた。',
             ' 5日：飢餓状態に追い込まれた。',
             '15日：記憶を失い放浪した。',

             ' 1日：生還！',
             '10日：異性に命を救われて、手厚い看病を受けた。',
             ' 3日：負傷からくる熱病で、生死の境を彷徨った。',
             '11日：闘奴にされたが、戦いと友情の末に自由を獲得した。',
             ' 6日：負傷したまま川に落ち、遥か下流まで流された。',
             ' 9日：敵に連れ去られ、執拗な拷問を受け続けた。',

             ' 1日：生還！',
             ' 4日：繰り返す「死の悪夢」に苛まれた。',
             ' 3日：巨獣の巣に連れ去られた。',
             '10日：謎の集団に救われて、手厚い看病を受けた。',
             ' 3日：チッタニアンの集落に迷い込み、もてなしを受けた。',
             ' 7日：ピュアリィの群れにとらわれ、弄ばれた。',

             ' 1日：生還！',
             ' 6日：楽園のような場所を発見し、しばらく逗留した。',
             ' 9日：盗賊団に救われ、恩返しとして少し用心棒をした。',
             '10日：熱病の見せる官能的な幻影にとらわれ、彷徨った。',
             ' 5日：謎の賞金首に狙われ、傷めつけられていた。',
             ' - ：「五分五分」の一般判定。失敗すると死亡。',
            ]
    return get_table_by_d66(table)
  end
end
