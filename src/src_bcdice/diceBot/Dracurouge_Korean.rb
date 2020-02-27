# -*- coding: utf-8 -*-

class Dracurouge_Korean < DiceBot
  def initialize
    super
    @d66Type = 1
  end

  def gameName
    '드라크루주'
  end

  def gameType
    "Dracurouge:Korean"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・행동판정（DRx+y）
　x：굴리는 주사위의 수（생략시４）, y：갈증수정（생략시０）
　예） DR　DR6　DR+1　DR5+2
・저항판정（DRRx）
　x：굴리는 주사위의
　예） DRR3
・타락표（CTx） x：갈증（예） CT3
・타락의 전조표（CS）
・인연 내용 결정표（BT）
・반응표（RTxy）x：혈통, y：길　xy생략으로 일괄표시
　　혈통　D：드라크, R：로젠부르크, H：헬스가르드, M：더스트하임,
　　　　　A：아발롬　N：노스페라스
　　길　　F：영주, G：근위, R：방랑, W：현자, J：사냥꾼, N：야수
　예）RT（일괄표시）, RTDF（드라크 영주）, RTAN（아발롬 야수）
・D66 다이스 있음
MESSAGETEXT
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand')

    result = getConductResult(command)
    return result unless result.nil?

    result = getResistResult(command)
    return result unless result.nil?

    result = getReactionResult(command)
    return result unless result.nil?

    result = getCorruptionResult(command)
    return result unless result.nil?

    result = getTableResult(command)
    return result unless result.nil?

    return nil
  end

  def getConductResult(command)
    return nil unless /^DR(\d*)(\+(\d+))?$/ === command

    diceCount = Regexp.last_match(1).to_i
    diceCount = 4 if diceCount == 0
    thirstyPoint = Regexp.last_match(3).to_i

    diceList = rollDiceList(diceCount)

    gloryDiceCount = getGloryDiceCount(diceList)
    gloryDiceCount.times { diceList << 10 }

    diceList, calculationProcess = getThirstyAddedResult(diceList, thirstyPoint)
    thirstyPointMarker = (thirstyPoint == 0 ? "" : "+#{thirstyPoint}")

    result = "(#{command}) ＞ #{diceCount}D6#{thirstyPointMarker} ＞ "
    result += "[ #{calculationProcess} ] ＞ " unless calculationProcess.empty?
    result += "[ #{diceList.join(', ')} ]"
    return result
  end

  def rollDiceList(diceCount)
    _dice, str = roll(diceCount, 6)
    diceList = str.split(/,/).collect { |i| i.to_i }.sort

    return diceList
  end

  def getGloryDiceCount(diceList)
    oneCount = countTargetDice(diceList, 1)
    sixCount = countTargetDice(diceList, 6)

    # gloryDiceCount = (oneCount / 2) + (sixCount / 2) 
    gloryDiceCount = ((oneCount / 2).floor) + ((sixCount / 2).floor) # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    return gloryDiceCount
  end

  def countTargetDice(diceList, target)
    diceList.select { |i| i == target }.count
  end

  def getThirstyAddedResult(diceList, thirstyPoint)
    return diceList, '' if thirstyPoint == 0

    targetIndex = diceList.rindex { |i| i <= 6 }
    return diceList, '' if targetIndex.nil?

    textList = []

    diceList.each_with_index do |item, index|
      if targetIndex == index
        textList << "#{item}+#{thirstyPoint}"
      else
        textList << item.to_s
      end
    end

    diceList[targetIndex] += thirstyPoint

    return diceList, textList.join(', ')
  end

  def getResistResult(command)
    return nil unless /^DRR(\d+)$/ === command

    diceCount = Regexp.last_match(1).to_i
    diceCount = 4 if diceCount == 0

    diceList = rollDiceList(diceCount)

    return "(#{command}) ＞ #{diceCount}D6 ＞ [ #{diceList.join(', ')} ]"
  end

  def getReactionResult(command)
    return nil unless /^RT((\w)(\w))?/ === command.upcase

    typeText1 = Regexp.last_match(2)
    typeText2 = Regexp.last_match(3)

    name = "반응표"
    table = getReactionTable
    tableText, number = get_table_by_d66(table)

    type1 = %w{드라크	로젠부르크	헬스가르드	더스트하임	아발롬	노스페라스}
    type1_indexTexts = %w{D R H M A N}
    type2 = %w{영주	근위	방랑	현자	사냥꾼	야수}
    type2_indexTexts = %w{F G R W J N}

    # tensValue = number.to_i / 10
    tensValue = (number.to_i / 10).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    isBefore = (tensValue < 4)
    type = (isBefore ? type1 : type2)
    indexTexts = (isBefore ? type1_indexTexts : type2_indexTexts)
    typeText = (isBefore ? typeText1 : typeText2)

    resultText = ''
    if typeText.nil?
      resultText = getReactionTextFull(type, tableText)
    else
      index = indexTexts.index(typeText)
      return nil if index.nil?

      resultText = getReactionTex(index, type, tableText)
    end

    return "#{name}(#{number}) ＞ #{resultText}"
  end

  def getReactionTextFull(type, tableText)
    resultTexts = []

    type.count.times do |index|
      resultTexts << getReactionTex(index, type, tableText)
    end

    return resultTexts.join('／')
  end

  def getReactionTex(index, type, tableText)
    typeName = type[index]
    texts = tableText.split(/\t/)
    string = texts[index]

    return "#{typeName}：#{string}"
  end

  def getReactionTable
    text = <<TEXT_BLOCK
하늘에 빛나는 붉은 달을 올려본다	콧방귀를 뀐다	헛기침을 한다	미간을 찌푸리고 생각에 잠긴다	하품을 참는다	명왕령의 방향을 노려본다
작게 한숨을 쉰다	앞머리를 쓸어 올린다	눈썹을 찌푸린다	주변을 평가하는 눈으로 본다	머리를 긁적인다	혀를 찬다
상대를 내려다보듯이 본다	자신의 머리를 만진다	투덜거린다	손에 책을 구현화시켜 적어넣는다	손에 생긴 과일을 먹는다	고개숙여 바닥이나 지면을 노려본다
지그시 눈을 감고 말을 건다	혼자서 작게 웃는다	무표정하게 상대를 관찰한다	재미없다는 듯이 바라본다	붙임성 좋은 웃음을 짓는다	무의식적으로 눈물이 흐른다
희미하게 미소짓는다	콧노래를 부른다	발밑에 지옥문이 생긴다	안정된 발걸음으로 다가간다	밤새가 어깨에 날아든다	입술을 깨문다
품 속에서 박쥐가 날아오른다	한쪽 발을 중심으로 빙그르르 돈다	주변에 작게 원망하는 목소리가 울린다	눈을 감고 과거를 생각한다	검은 고양이가 발밑에 재롱부리며 달라붙는다	가슴을 누르고 지그시 생각한다
머리 위를 박쥐가 소용돌이 치듯이 난다	꽃잎을 구현화해 흩날린다	비난하는 듯한 눈빛을 향한다	발자취에 옅은 안개가 낀다	주변에 요정의 빛이 춤춘다	고개를 크게 흔들어 사념을 쫓는다
눈썹을 찌푸리는 동시에 눈이 붉게 빛난다	의상이나 갑옷의 색이나 장식을 바꾼다	직립부동의 자세로 서있는다	쓴웃음을 지으며 다가선다	순식간에 상대편에 나타난다	마음 속의 분노로 험악한 얼굴이 된다
손에 있는 와인을 가볍게 마신다	자신에게 취해 눈을 감는다	질린듯한 모습으로 한숨을 쉰다	현상을 분석하는 혼잣말을 한다	순식간에 상대에게서 멀어진다	의연한 태도로 맞선다
몸 전체에서 옅은 붉은 색의 오오라가 피어난다	구현화한 꽃을 손에서 가지고 논다	갑자기 돌아서며 노려본다	흥미깊은듯이 질문한다	벌레나 식물에게 정신이 팔린다	마른 웃음소리를 흘린다
겁 없는 웃음을 짓는다	마음에 드는 상대를 꼬시려고 한다	주변의 공기가 얼어붙는다	눈 앞의 양식에 불평을 말한다	순수한 웃음을 보인다	자신의 혈족을 깎아내리는 말을 한다
바람 없이 머리카락이 날린다	어깨를 움츠린다	가슴에 손을 얹고 자신을 안정시킨다	무감동하게 가볍게 인사한다	실수로 누군가를 말려들게해서 넘어진다	조용한 분노와 함께 눈이 창백하게 빛난다
질린 눈으로 상대를 응시한다	자신의 무기에 입맞춤을 한다	손에 구현화한 사슬을 가지고 논다	손에 구현화한 펜을 가지고 논다	누군가에게 응석부리듯이 기댄다	들꽃을 만지고 그것을 시들게 한다
발밑에 작은 회오리바람이 일어난다	권유하는 듯이 누군가의 손을 잡는다	주변을 엄격한 눈으로 바라본다	눈을 뜨고 감탄한다	웃음을 띠며 고개를 끄덕인다	지친 모습으로 희미하게 빛나는 숨을 내뱉는다
격정이나 긴장감에 머리가 거꾸로 선다	악기를 구현화해 연주한다	동료에게 의심의 시선을 보낸다	책, 소매, 망토 등으로 입가를 가린다	작게 고개를 갸웃거린다	자신의 문장을 멍하게 바라본다
붉은 달빛을 받으며 눈을 감는다	상대에게 윙크한다	감정에 맞춰 주변에 사슬이 구현화된다	공중에 떠서 미끄러지듯이 나아간다	수많은 검은 깃털이 하늘에 흩날린다	자조적으로 작게 웃는다
무기를 들고 맹세를 선창한다	의상에 붙은 먼지를 털어낸다	타락에 대해 충고한다	무감정하게 상황을 분석한다	과일을 꺼내서 먹는다	지친 눈으로 멍하게 다른 사람을 본다
자신의 문장을 쭉 바라본다	망토에서 무수한 나비가 날아오른다	차가운 시선으로 상대를 훑어본다	순간, 모습이 안개에 휩싸여 희미해진다	뭔가 있어 보이는 말이나 행동을 한다	뭔가 결심한듯한듯이 얼굴을 들어올린다
상대의 눈을 들여다 봐 마음을 짐작한다	주군의 옆에 살짝 다가선다	일전의 싸움에 대해 얘기한다	상대를 헤아리듯이 바라본다	“적”을 생각해내 험악한 눈이 된다	짐승과 같이 거칠게 호흡한다
자신의 영지를 생각한다	문장이 새겨진 방패를 들어 올린다	바람에 머리카락이 나부낀다	안경을 구현화해 쓴다	침을 뱉는다	그렁그렁한 눈으로 상대를 올려다본다
종자를 시중들게 한다	무기를 차고 기품있게 인사한다	구현화한 탈것을 쓰다듬는다	조그마한 점을 주의깊게 본다	구현화한 무기를 쓰다듬는다	고개를 숙이고 심호흡한다
종자의 시중을 받는다	자신의 방패의 문장을 손가락으로 따라그린다	동료의 어깨를 두드린다, 혹은 안는다	과장되게 한숨을 쉬어보인다	음울한 눈으로 허공을 노려본다	벽이나 바닥에 손톱을 세워 할퀸다
마음에 드는 상대에게 손짓한다	다른 기사에게 바싹 다가간다	상쾌하게 웃는다	눈을 감고 사색에 잠긴다	옷자락에서 나타난 뱀이나 거미를 쓰다듬는다	자신에게 이르는 혼잣말을 한다
근심에 가득차 생각에 잠긴다	주군의 등뒤에서 상대를 노려본다	소리 높여 이름을 댄다	다른 기사에게 조언한다	골똘히 생각하는 눈으로 밤하늘을 본다	타락의 전조를 지그시 본다
무겁게 끄덕인다	주군의 앞, 또는 옆에서 무릎꿇는다	주변에 적극적으로 말을 건다	얼버무리듯이 헛기침을 한다	자신의 무기를 핥는다	다른 기사에게서 눈을 돌린다
상냥한 미소를 짓는다	겸연쩍다는듯 얼굴을 붉힌다	자신의 이름에 맹세한다	작게 인사한다	어둡게 웃음짓는다	다른 기사의 눈치를 살핀다
슬쩍 자신의 문장을 보여준다	누군가의 앞을 가로막고 선다	과장되게 누군가를 치켜세운다	다른 기사에게 눈으로 신호를 보낸다	그늘에 숨는다	상대를 노려보며 신음한다
와인잔을 다른 기사에게 건넨다	정신사납게 돌아다닌다	다른 기사에게 시합을 신청한다	불가사의한 웃음을 짓는다	다른 기사의 문장을 관찰한다	자신의 손가락을 가볍게 핥는다
가만히 풍경을 바라본다	수줍은 웃음을 짓는다	망토를 과장되게 펄럭인다	하늘에 뜬 별들을 바라본다	분위기를 못읽는 발언을 한다	다른 기사에게 거리를 두어진다
손바닥에 체스말을 구현화한다	긴장한 시선으로 주변을 둘러본다	상대를 치켜 세우며 입맞춤을 요구한다	깊은 지식으로 자세한 설명을 한다	갑자기 뒤돌아보며 등뒤를 경계한다	영악한 웃음을 짓는다
가슴을 펴고 자신있게 발언한다	마음 속에서 다른 기사와 시합을 한다	자신의 고향을 떠올린다	미래에 대해 점쳐본다	과거의 원통함에 피눈물을 흘린다	자신의 피부를 손톱등으로 상처입힌다
빠르게 사죄한다	가만히 기다리고 있는다	자신의 문장에 대해 얘기한다	사소한 예언을 한다	상어와 같이 웃는다	몰래 입맛을 다신다
다른 기사를 정면에서 칭찬한다	주군을 지그시 바라본다	다른 기사와 잡담을 한다	소문의 일종을 다른 기사에게 속삭인다	그 자리에 없는 기사를 비웃는다	요염하게 곁눈질을 보낸다
다른 기사의 머리나 볼을 쓰다듬는다	주군을 치켜 세운다	곤란한듯이 작게 신음한다	사소한 물건을 흥미깊게 관찰한다	다른 기사와의 거리를 느낀다	애처로운 눈으로 자신의 문장을 바라본다
우렁차게 이름을 댄다	주군의 소매를 꽉 쥔다	윗사람의 앞에서 무릎을 꿇고 예를 다한다	달을 올려다보고 드라쿨을 칭송한다	나직하게 이름을 댄다	사냥감을 노리는 눈으로 다른 기사를 본다
입가를 가리며 기품있게 웃는다	주군에 대한 주변의 태도를 비난한다	아랫사람에게 미소짓는다	다른 기사의 감정에 충고한다	아랫사람을 내려다보는 눈으로 본다	자학적인 말을 한다
TEXT_BLOCK

    return text.split(/\n/)
  end

  def getCorruptionResult(command)
    return nil unless /^CT(\d+)$/ === command.upcase

    modify = Regexp.last_match(1).to_i

    name = "타락표"
    table =
      [
        [ 0, "당신은 완전히 타락했다. 이 시점에서 당신은 [월 플라워]가 되어 늑대인간, 검은 산양, 야수 중 하나가 된다. 그 [막]의 종료 후에 세션에서 퇴장한다. 247페이지의 「소멸・완전한 타락」을 참조한다."],
        [ 1, "당신의 육체는 정신에 걸맞는 변화를 일으킨다……. 「타락의 전조표」를 2번 굴리고 특징을 얻는다. 이 세션 종료 후, 【길】을 「야수」로 변경한다.(이미「야수」라면 【길】은 변하지 않는다)"],
        [ 3, "당신의 육체는 정신에 걸맞는 변화를 일으킨다……. 「타락의 전조표」를 1번 굴리고 특징을 얻는다. 이 세션 종료 후, 【길】을 「야수」로 변경한다.(이미「야수」라면 【길】은 변하지 않는다)"],
        [ 5, "고귀한 마음도 언젠가는 타락한다. 당신이 지금 가장 많은 루주를 얻은 대상에 대한 루주를 전부 잃고, 같은 수 만큼의 누아르를 얻는다. 누아르를 얻은 결과, 【갈증】이 3점 이상이 된 경우 다시 타락표를 굴린다."],
        [ 6, "내면에 잠든 짐승의 숨결……당신이 지금 【갈증】을 얻은 누아르의 대상에게 임의의 누아르 2점을 획득한다."],
        [ 7, "내면에 잠든 짐승의 숨결……당신이 지금 【갈증】을 얻은 누아르의 대상에게 임의의 누아르 1점을 획득한다."],
        [ 8, "날뛰는 마음을 가라앉힌다……다행히 아무 일도 없었다."],
        [99, "당신은 미쳐 날뛰는 감정을 억누르고 이성을 되찾았다! 【갈증】이 1 감소한다!"],
      ]

    number, number_text = roll(2, 6)
    index = (number - modify)
    debug('index', index)
    text = get_table_by_number(index, table)

    return "2D6[#{number_text}]-#{modify} ＞  #{name}(#{index}) ＞ #{text}"
  end

  def getTableResult(command)
    info = @@tables[command.upcase]
    return nil if info.nil?

    name = info[:name]
    type = info[:type]
    table = info[:table]

    text, number =
      case type
      when '2D6'
        get_table_by_2d6(table)
      when '1D6'
        get_table_by_1d6(table)
      end

    return nil if text.nil?

    return "#{name}(#{number}) ＞ #{text}"
  end

  def getCorruptionTable; end

  @@tables =
    {
      'CS' => {
        :name => "타락의 전조표",
        :type => '2D6',
        :table => [
          "당신은 완전히 타락했다. 이 시점에서 당신은 [월 플라워]가 되어 늑대인간, 검은 산양, 야수 중 하나가 된다. 그 [막]의 종료 후에 세션에서 퇴장한다. 247페이지의 「소멸・완전한 타락」을 참조한다.",
          "짐승 그 자체의 머리(늑대, 산양, 박쥐 중 하나)",
          "밤새의 날개",
          "박쥐의 날개",
          "갈퀴발톱이 있는 이형의 팔",
          "뒤틀린 두 개의 뿔",
          "늑대의 귀와 꼬리",
          "창백해진 피부",
          "이상한 빛을 발하는 눈",
          "튀어나온 송곳니",
          "눈에 보이는 변화는 없다……",
        ],
      },

      'BT' => {
        :name => "인연 내용 결정표：루주／누아르",
        :type => '1D6',
        :table => [
          "연민(Pity)　상대를 불쌍히 여기고 동정한다. ／모멸(Contempt)　상대를 깔보고 경멸한다.",
          "친구(Friend)　상대에게 우정을 갖는다. ／질투(Jealousy)　상대를 부러워하고 질투한다. ",
          "신뢰(Trust)　상대를 신뢰한다. ／욕망(Desire)　상대를 원하고 나의 것으로 만들고 싶어한다.",
          "사랑(Love)　상대를 좋아하고 사랑한다. ／분노(Anger)　상대에게 분노를 느낀다. ",
          "존경(Respect)　상대의 실력이나 정신을 존경한다. ／살의(Kill)　상대에게 살의를 느끼고 없애고자 한다.",
          "복종(Obey)　상대를 주군으로서 받들고 충의를 맹세한다. ／복수(Vendetta)　상대를 원망하고 원수로 여긴다.",
        ],
      },
    }

  setPrefixes(['DR.*', 'RT.*', 'CT\d+'] + @@tables.keys)
end
