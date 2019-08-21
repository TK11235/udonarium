# -*- coding: utf-8 -*-

class Postman < DiceBot
  setPrefixes([
    'WEA\d*',
    '(\d+)?PO.*',
    'FRE'
  ])

  def initialize
    super
    @sortType = 1 # ダイスのソート有
  end

  def gameName
    '壊れた世界のポストマン'
  end

  def gameType
    "Postman"
  end

  def getHelpMessage
    return <<MESSAGETEXT
◆判定：[n]PO[+-a][> or >= or @X]　　[]内省略可。

達成値と判定の成否、クリティカル、ファンブルを結果表示します。
「n」でダイス数を指定。省略時は2D。
「+-a」で達成値への修正を指定。「+2+1-4」のような複数回指定可。
「>X」「>=X」「@X」で難易度を指定可。
「>X」は達成値>難易度、「>=X」「@X」は達成値>=難易度で判定します。

【書式例】
3PO+2-1 → 3Dで達成値修正+1の判定。達成値のみ表示。
PO@5+2 → 2Dで目標値7の判定。判定の成否と達成値を表示。
4PO-2+1>7+2 → 4Dで達成値修正-1、目標値9（同値は失敗）の判定。


◆天候チェック：WEA[n]　　[]内省略可。

天候チェック表を参照します。
「n」を指定すると、指定した結果を表示します。（【幸運点】使用時用）


◆自由行動シチュエーション表：FRE
MESSAGETEXT
  end

  def rollDiceCommand(command)
    text =
      case command.upcase

      when /(\d+)?PO(\d+)?(([+-]\d+)*)?((>|>=|@)(\d+)(([+-]\d+)*)?)?/i
        diceCount = ($1 || 2).to_i
        diceCount = 2 if diceCount < 2

        modify = ($2 || 0).to_i
        # modifyAddString = $3
        modifyAddString = $3.to_s # TKfix

        type = ($6 || '')
        target = ($7 || 0).to_i
        # targetAddString = $8
        targetAddString = $8.to_s # TKfix

        modify_list = modifyAddString.scan(/[+-]\d+/)
        modify_list.each { |i| modify += i.to_i }

        if target != 0
          target_list = targetAddString.scan(/[+-]\d+/)
          target_list.each { |j| target += j.to_i }
        end

        checkRoll(diceCount, modify, type, target)

      when /WEA(\d+)?/i
        roc = ($1 || 0).to_i
        get_weather_table(roc)

      when 'FRE'
        get_free_situation_table

      end

    return text
  end

  def checkRoll(diceCount, modify, type, target)
    dice, diceText = roll(diceCount, 6, @sortTye)

    diceArray = diceText.split(/,/).collect { |i| i.to_i }
    dice2 = diceArray[-2] + diceArray[-1]
    diceText2 = "#{diceArray[-2]},#{diceArray[-1]}"
    criticalCount = diceArray.count { |i| i == 6 }

    if modify != 0
      modifyText = ''
      modifyText = "+" if modify > 0
      modifyText += modify.to_s
    end

    result = dice2 + modify

    if type != ''
      resultText = " 【失敗】"
      operatorText = ">"
      if type == '>'
        resultText = " 【成功】" if result > target
      else
        operatorText += "="
        resultText = " 【成功】" if result >= target
      end
    end

    if criticalCount >= 2
      resultText = " 【成功】（クリティカル）"
    elsif dice == diceCount
      resultText = " 【失敗】（ファンブル）"
    end

    text = "#{diceCount}D6(#{diceText})#{modifyText} ＞ #{dice2}(#{diceText2})#{modifyText} = 達成値：#{result}"
    text += "#{operatorText}#{target} " if target > 0
    text += resultText.to_s

    return text
  end

  def get_weather_table(roc)
    name = "天候チェック"
    table = [
              [2, '大雨と強風。探索判定の難易度に+4。'],
              [3, '風が強い1日になりそう。探索判定の難易度に+2。'],
              [4, '晴れ。特になし。'],
              [5, '夜の間の雨でぬかるむ。探索判定の難易度に+2。'],
              [6, 'それなりの雨足。探索判定の難易度に+2。'],
              [7, '晴れ。特になし。'],
              [8, '天気は大荒れ。探索判定の難易度に+4。'],
              [9, '小雨が降る。探索判定の難易度に+1。'],
              [10, 'それなりの雨足。探索判定の難易度に+2。'],
              [11, '晴れ。特になし。'],
              [12, '風が強い1日になりそう。探索判定の難易度に+2。']
            ]

    if roc == 0
      dice, diceText = roll(2, 6)
    else
      roc = 2 if roc < 2
      roc = 12 if roc > 12
      dice = roc
      diceText = "Choice:#{roc}"
    end

    tableText = get_table_by_number(dice, table)
    text = "#{name}(#{diceText}) ＞ #{dice}：#{tableText}"
    return text
  end

  def get_free_situation_table()
    name = "自由行動シチュエーション表"
    table = [
              [2, '何をするでもなく、霞がかったような夜空を見上げる。ふと隣に目を向ければ、彼/彼女が居た。彼/彼女は、こうなる前の夜空を知っているのだろうか。'],
              [3, '夢を見た。大戦の最中、街が、人が、世界が焼けていく悪夢を。追い立てられるようにして目を覚ますと、彼/彼女が君を見ていた。　……もしかして、自分はよほどうなされていたのだろうか。'],
              [4, '周囲で見つけたガラクタを使って、ちょっとしたビックリ玩具を作ってみた。「彼/ 彼女」にコイツをけしかけたら、どんな反応をするだろうか？'],
              [5, '使えそうなものがないか探していると、カタンと物音がして何かが落ちた。拾い上げてみたそれは、かつてここで生活していた誰かの名残（写真、家具、玩具等）だった。'],
              [6, 'テントの中で夜を過ごしていると、ふと彼/彼女と話したくてたまらない気持ちになった。言ってしまえば、夜の静けさに寂しさを覚えてしまったのだ。'],
              [7, 'ここまでの配達の記録をつけていたら、背後から視線を感じる……！　もしや、彼/彼女に覗かれている……！？'],
              [8, '周囲を探索していると、君一人では手の届かないところに金属製の箱か何かがあることに気づいた。彼/彼女に手伝ってもらえば、取れるだろうか……？'],
              [9, '朝まではまだしばらくあるというのに、目が覚めてしまった。二度寝しようにも寝付けずに居ると、隣でもぞもぞと動く気配がする。彼/彼女も、どうやら同じらしい。'],
              [10, '他愛のない話をするうちに、君は彼/彼女に問いかけていた。「何故、ポストマンになろうと思ったのか」　……そういえば、君自身はどうだったろうか。'],
              [11, '保存食にありつこうとしたその時、君は気づいた。一匹のネズミが、彼/彼女の荷物の中に潜り込もうとしている。彼/彼女は気づいていないが、このままでは食料が危ない！'],
              [12, 'テントを設営し、落ち着いた頃にふと気づく。　……身体が熱い。少し、だるさもあるような気もする。大したことはないと思うが、彼/彼女に相談しておいた方がいいだろうか。']
            ]
    dice, diceText = roll(2, 6)
    tableText = get_table_by_number(dice, table)
    text = "#{name}(#{diceText}) ＞ #{dice}：#{tableText}"
    return text
  end
end
