# -*- coding: utf-8 -*-

class BladeOfArcana < DiceBot
  setPrefixes([
    '\d+A\d*[CF]?\d*[CF]?\d*',
    'CT3[\+\-]?',
    'CTR[\+\-]?',
    'DJV\-?',
    'AKST[\+\-]?'
  ])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
  end

  def gameName
    'ブレイド・オブ・アルカナ'
  end

  def gameType
    "BladeOfArcana"
  end

  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
■行為判定　nA[m][Cx][Fy]
　n：ダイス数　　m：判定値(省略時はクリティカル値と同じ)
　x：クリティカル値(省略時は1)　　y：ファンブル値(省略時は20)
　注）[m]、[Cx]、[Fy]は省略可能。
　　例）3A12C4F15→3個振り12以下で成功。C値4、F値は15。
　　例）3A12→3個振り12以下で成功。C値1、F値は20。

■各種表　(+：出目2～21に変更　-：出目0～19に変更)
●リインカーネイション
　因縁表　CTR[+/-]　　前世邂逅表　DJV[-]
　悪徳シーン表　AKST[+/-]
●The 3rd（第三版）
　因縁表　CT3[+/-]
　注）[]内は省略可能。
　　例）CTR→因縁表（R版）を出目1～20でロールする。
　　例）CTR+→因縁表（R版）を出目2～21でロールする。
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    case command.upcase
    when /^(\d+)A(\d*)([CF]?)(\d*)([CF]?)(\d*)$/
      counts = Regexp.last_match(1).to_i
      judgment = Regexp.last_match(2).to_i
      option1 = Regexp.last_match(3)
      argument1 = Regexp.last_match(4)
      option2 = Regexp.last_match(5)
      argument2 = Regexp.last_match(6)
      return nil if (option1.empty? != argument1.empty?) || (option2.empty? != argument2.empty?) || (!option2.empty? && (option1 == option2))

      if option1 == 'C'
        critical = argument1.to_i
        fumble = argument2.to_i
      else
        critical = argument2.to_i
        fumble = argument1.to_i
      end
      return rollAct(counts, judgment, critical, fumble)

    when /^CT3([\+\-]?)$/
      sign = Regexp.last_match(1)
      title = '因縁表(The 3rd)　『BoA3』P292'
      table = [
        "【他生】",
        "【師弟】",
        "【忘却】",
        "【兄姉】",
        "【貸し】",
        "【慕情】",
        "【主従】",
        "【強敵】",
        "【秘密】",
        "【恩人】",
        "【告発】",
        "【友人】",
        "【仇敵】",
        "【父母】",
        "【借り】",
        "【信頼】",
        "【幼子】",
        "【取引】",
        "【地縁】",
        "【同志】",
        "【不審】",
        "【自身】",
      ]
      return tableText(title, table, sign)

    when /^CTR([\+\-]?)$/
      sign = Regexp.last_match(1)
      title = '因縁表(リインカーネイション)　『BAR』P51、299'
      table = [
        "【他生】",
        "【師弟】",
        "【忘却】",
        "【兄姉】",
        "【貸し】",
        "【憧憬】",
        "【主従】",
        "【強敵】",
        "【秘密】",
        "【恩人】",
        "【取引】",
        "【友人】",
        "【怨敵】",
        "【後援】",
        "【借り】",
        "【信頼】",
        "【弟妹】",
        "【商売】",
        "【奇縁】",
        "【同志】",
        "【有為】",
        "【自身】",
      ]
      return tableText(title, table, sign)

    when /^DJV(\-?)$/
      sign = Regexp.last_match(1)
      title = '前世邂逅表（デジャブ）　『BAR』P235'
      table = [
        "【鮮烈な風】\n風は懐かしい匂いを、香りを運んでくる。それは……。",
        "【薄暗い影】\nまるで時が止まってしまっているかのようだ。",
        "【操りの糸】\nそれはあなたを導く蜘蛛の糸。",
        "【天上の光】\n偉大なるものがもたらす、天上からの御しるし。",
        "【温もり】\n春のひなたのような温かさを感じる。",
        "【鋭いナイフ】\n鋭いナイフのような視線を感じる。これは……。",
        "【共鳴】\n同じ感覚を感じる、ふたりは通じ合っている。",
        "【城壁】\n厳しく高い城壁のように重く堅く厚い。",
        "【砕ける器】\n落ちれば砕ける。砕ければそれは器ではない。",
        "【陽炎】\n求めれば揺らいで消える。",
        "【終わりなき円環】\nそれはあなたを捉え巡る輪廻の輪。",
        "【天秤】\n揺れるバランス、揺れ続ける安定。",
        "【流れる水】\nひとつ所にとどまらず、姿を固めることはない",
        "【光る刃】\n鋭く光る刃のような、鋭いまなざし。",
        "【悪魔】\nあまりにも危険な魅力、それは悪魔的だった。",
        "【牙】\n獲物を引き裂く鋭く長い、牙。",
        "【輝く星】\n星は暗く小さい。だがそこに輝く。",
        "【冴え渡る月光】\n冷たさと安らかさが同居している。",
        "【照りつける太陽】\n暑い。",
        "【燃えさかる炎】\n炎はすべてを破壊し、すべてを滅ぼす。",
        "【世界】\nすべてはこの世界の中で起こり、終わる。",
        "【なし】",
      ]
      return tableText(title, table, sign)

    when /^AKST([\+\-]?)$/
      sign = Regexp.last_match(1)
      title = '悪徳シーン表　『GoV』P16、164'
      table = [
        "▼ウェントス／止まない風\n【行動】殺戮者の狂気に当てられたのか、通り魔的殺人者が現れる。切り裂かれた人々の悲鳴が響き渡る。",
        "▼エフェクトス／原初の力\n【行動】殺戮者の配下が無法を働く。店先で金品を要求したり、暴力を振るったりしている。",
        "▼クレアータ／傀儡人形の王\n【行動】殺戮者の配下が人々の行動を監視している。違反した者には即座に罰が与えられる。",
        "▼マーテル／生ける神\n【行動】殺戮者の配下が人々に殺戮者への信仰を告白し、忠誠を宣誓するように強要している。",
        "▼コロナ／簒奪者\n【行動】嘆き悲しんでいる者がいる。殺戮者によって、財産、地位、家族あるいは、恋人を奪い取られたという。",
        "▼フィニス／永遠の人\n【行動】怪物が人々を虐殺している。この地には人間が多すぎるのだという。それが彼らの主の決定だ。",
        "▼エルス／無私なる愛\n【行動】殺戮者の配下が略奪を働いている。どうやら、殺戮者に献上するものを争っているようだ。",
        "▼アダマス／万物の保護者\n【行動】反逆者と名指しされる。人々は君たちに接触しようとしない。情報を集めるにも苦労しそうだ。",
        "▼アルドール／終わりなき戦い\n【行動】ならず者の集団が人々を襲っている。力を示さなければ切り捨てられるのは彼らなのだ。",
        "▼ファンタスマ／謀略の渦\n【行動】人々は君を見るなり逃げ出した。どうやら恐ろしい殺人者だと思われているようだ。",
        "▼アクシス／真理の探究者\n【行動】殺戮者の配下の手によって、人々が連れ去られている。誰ひとりもどってこない。",
        "▼レクス／捕縛者\n【行動】殺戮者への恐怖に駆られた人々はその命令にしたがって徒党を組み、PCたちを捜索している。",
        "▼アクア／澱んだ水\n【行動】人々は獣のように生きている。言葉は通じない。有効なのは力、暴力だけだ。",
        "▼グラディウス／暗き死の刃\n【行動】殺戮者とその配下によって虐殺が行なわれている。見渡す限り、死者ばかりだ。",
        "▼アングルス／純白の恐怖\n【行動】遊びとして人間狩りが行なわれている。人々は逃げ惑い、殺戮者は愉悦に笑う。",
        "▼ディアボルス／悪魔の囁き\n【行動】殺戮者は少年少女を召し上げている。召し上げられた者たちは音信不通となってしまう。",
        "▼フルキフェル／裏切り者\n【行動】人々は猜疑の目で君を見る。嘘を吐くのが普通の場所で真実を見いだせるだろうか。",
        "▼ステラ／破滅への愛\n【行動】街や村落が破壊されている。焼け野原の中、人々は力なくうずくまる。ここには絶望だけがあった。",
        "▼ルナ／奪う者\n【行動】君たちの目の前に略奪が繰り返される。略奪のために略奪を行なう殺戮者の配下たち。",
        "▼デクストラ／邪悪な技\n【行動】殺戮者による非道な人体実験が繰り返されている。そのための実験材料が集められている。",
        "▼イグニス／根源たる炎\n【行動】街や集落、あるいは店舗や住宅が焼き討ちに合う。人々は互いに陥れ、磔刑が行なわれている。",
        "▼オービス／闇の鎖\n【行動】世界の完全なる破滅、人類の絶滅、無作為で広範囲な虐殺が行なわれる。",
      ]
      return tableText(title, table, sign)
    end

    return nil
  end

  def rollAct(counts, judgment = 0, critical = 0, fumble = 0)
    if critical < 1
      critical = 1
    end
    if judgment <= 0
      judgment = critical
    elsif critical > judgment
      critical = judgment
    end

    if fumble <= 0
      fumble = 20
    end
    if counts <= 0
      counts = 1
      fumble -= 5
    end
    if fumble < 2
      fumble = 2
    elsif fumble > 20
      fumble = 20
    end

    value, string = roll(counts, 20, 1)
    text = "(#{counts}A#{judgment}C#{critical}F#{fumble}) ＞ #{string} ＞ "

    unless counts == 1
      value = string.split(",").map(&:to_i).min
      text += "#{value} ＞ "
    end

    if value >= fumble
      text += 'ファンブル'
    elsif value <= critical
      text += 'クリティカル'
    elsif value > judgment
      text += '失敗'
    else
      text += '成功'
    end
    return text
  end

  def tableText(title, table, sign = '')
    number, = roll(1, 20)
    index = number
    if sign == '+'
      index += 1
    elsif sign == '-'
      index -= 1
    end

    text = "#{title} ＞ #{index}"
    unless sign.empty?
      text += "[#{number}#{sign}1]"
    end
    return text + ' ＞ ' + table[index]
  end
end
