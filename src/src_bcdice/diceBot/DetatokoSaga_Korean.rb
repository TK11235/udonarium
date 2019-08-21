# -*- coding: utf-8 -*-

class DetatokoSaga_Korean < DiceBot
  setPrefixes([
    '\d+DS.*', '\d+JD.*',
    'SST', 'StrengthStigmaTable',
    'WST', 'WillStigmaTable',
    'SBET', 'StrengthBadEndTable',
    'WBET', 'WillBadEndTable'
  ])

  def initialize
    super
    @sendMode = 2
    @sortType = 1
    @d66Type = 2
  end

  def gameName
    '데타토코 사가'
  end

  def gameType
    "DetatokoSaga:Korean"
  end

  def getHelpMessage
    info = <<INFO_MESSAGE_TEXT
・통상판정　xDS or xDSy or xDS>=z or xDSy>=z
　(x＝스킬레벨, y＝현재 플래그(생략=0), z＝목표치(생략=８))
　예）3DS　2DS5　0DS　3DS>=10　3DS7>=12
・판정치　xJD or xJDy or xJDy+z or xJDy-z or xJDy/z
　(x＝스킬레벨, y＝현재 플래그(생략=0), z＝수정치(생략=０))
　예）3JD　2JD5　3JD7+1　4JD/3
・체력 낙인표　SST (StrengthStigmaTable)
・기력 낙인표　WST (WillStigmaTable)
・체력 배드엔딩표　SBET (StrengthBadEndTable)
・기력 배드엔딩표　WBET (WillBadEndTable)
INFO_MESSAGE_TEXT
  end

  def rollDiceCommand(command)
    debug("rollDiceCommand begin string", command)

    result = ''

    result = checkRoll(command)
    return result unless result.empty?

    result = checkJudgeValue(command)
    return result unless result.empty?

    debug("각종표로서 처리")
    return rollTableCommand(command)
  end

  # 통상판정　xDS or xDSy or xDS>=z or xDSy>=z
  def checkRoll(string)
    debug("checkRoll begin string", string)

    return '' unless /^(\d+)DS(\d+)?((>=)(\d+))?$/i =~ string

    target = 8

    skill = $1.to_i
    flag = $2.to_i
    target = $5.to_i unless $5.nil?

    result = "판정！　스킬레벨：#{skill}　플래그：#{flag}　목표치：#{target}"

    total, rollText = getRollResult(skill)
    result += " ＞ #{total}[#{rollText}] ＞ 판정치：#{total}"

    success = getSuccess(total, target)
    result += " ＞ #{success}"

    result += getCheckFlagResult(total, flag)

    return result
  end

  def getRollResult(skill)
    diceCount = skill + 1
    diceCount = 3 if  skill == 0

    dice = []
    diceCount.times do |i|
      dice[i], = roll(1, 6)
    end

    diceText = dice.join(',')

    dice = dice.sort
    dice = dice.reverse if skill != 0

    total = dice[0] + dice[1]

    return total, diceText
  end

  def getSuccess(check, target)
    if check >= target
      return "목표치 이상！【성공】"
    end

    return "목표치 미달… 【실패】"
  end

  def getCheckFlagResult(total, flag)
    if total > flag
      return ""
    end

    willText = getDownWill(flag)
    result = ", 플래그 이하！ 【기력#{willText}점 감소】"
    result += " 【판정치 변경 불가】"

    return result
  end

  def getDownWill(flag)
    if flag >= 10
      return "6"
    end

    dice, = roll(1, 6)
    return "1D6->#{ dice }"
  end

  # 스킬판정치　xJD or xJDy or xJDy+z or xJDy-z or xJDy/z
  def checkJudgeValue(string)
    debug("checkJudgeValue begin string", string)

    return '' unless /^(\d+)JD(\d+)?(([+]|[-]|[\/])(\d+))?$/i =~ string

    skill = $1.to_i
    flag = $2.to_i
    operator = $4
    value = $5.to_i

    result = "판정！　스킬레벨：#{skill}　플래그：#{flag}"

    modifyText = getModifyText(operator, value)
    result += "　수정치：#{modifyText}" unless modifyText.empty?

    total, rollText = getRollResult(skill)
    result += " ＞ #{total}[#{rollText}]#{modifyText}"

    totalResult = getTotalResultValue(total, value, operator)
    result += " ＞ #{totalResult}"

    result += getCheckFlagResult(total, flag)

    return result
  end

  def getModifyText(operator, value)
    return "" if( value == 0) # TKfix
    operatorText =
      case operator
      when "+"
        "＋"
      when "-"
        "－"
      when "/"
        "÷"
      else
        return ""
      end

    return "#{operatorText}#{value}"
  end

  def getTotalResultValue(total, value, operator)
    case operator
    when "+"
      return "#{total}+#{value} ＞ 판정치：#{total + value}"
    when "-"
      return "#{total}-#{value} ＞ 판정치：#{total - value}"
    when "/"
      return getTotalResultValueWhenSlash(total, value)
    else
      return "판정치：#{total}"
    end
  end

  def getTotalResultValueWhenSlash(total, value)
    return "0으로는 나누어지지 않습니다" if value == 0

    quotient = ((1.0 * total) / value).ceil

    result = "#{total}÷#{value} ＞ 판정치：#{quotient}"
    return result
  end

  ####################
  # 각종표

  def rollTableCommand(command)
    command = command.upcase
    result = []

    debug("rollDiceCommand command", command)

    name = ''
    text = ''
    total = 0

    case command.upcase
    when "SST", "StrengthStigmaTable".upcase
      name, text, total = choiceStrengthStigmaTable()
    when "WST", "WillStigmaTable".upcase
      name, text, total = choiceWillStigmaTable()
    when "SBET", "StrengthBadEndTable".upcase
      name, text, total = choiceStrengthBadEndTable()
    when "WBET", "WillBadEndTable".upcase
      name, text, total = choiceWillBadEndTable()
    else
      return
    end

    result = "#{name}(#{total}) ＞ #{text}"

    return result
  end

  # ##표 목록

  def choiceStrengthStigmaTable()
    name = "체력 낙인표"
    table = [
"당신은 【낙인】을 2개 받는다. 이 표를 다시 2번 굴려 받을 【낙인】을 정한다(그 경우, 다시 이 눈이 나와도 【낙인】은 늘어나지 않는다).",
"【상처】 심한 상처를 입었다. 어떻게든 싸울 수는 있지만…….",
"【출혈】 피가 흘러넘쳐, 눈이 흐릿하다…….",
"【쇠약】 몸이 약해져, 그 마음마저도 시들어버릴 거 같다.",
"【고통】 아픔과 괴로움, 한심함. 눈에서 눈물이 새어 나온다.",
"【충격】 날려져서, 벽이나 나무에 부딪힌다. 빨리 일어서지 않으면.",
"【피로】 당신의 얼굴에 피로의 색이 강해진다……이 싸움이 힘겨워졌다.",
"【노호】 성가신 공격에 분노의 함성을 지른다. 분노가 싸움을 어렵게 할까?",
"【부상】 상처를 입었다…….",
"【경상】 당신의 피부에 상처가 남았다. 이것만이라면 아무렇지도 않다.",
"기적적으로 당신은 【낙인】을 받지 않았다.",
]

    text, total = get_table_by_2d6(table)
    return name, text, total
  end

  def choiceWillStigmaTable()
    name = "기력 낙인표"

    table = [
"당신은 【낙인】을 2개 받는다. 이 표를 다시 2번 굴려 받을 【낙인】을 정한다(그 경우, 다시 이 눈이 나와도 【낙인】은 늘어나지 않는다).",
"【절망】 어떻게 하지 못하는 상황. 희망은 사라지고……무릎을 꿇을 수밖에 없다.",
"【통곡】 너무도 부조리함에, 어린아이처럼 울음을 터트릴 수밖에 없다.",
"【후회】 이럴 생각은 아니었는데. 하지만 현실은 비정했다.",
"【공포】 공포에 사로잡혔다! 적이, 자신의 손이, 무서워서 참을 수 없다!",
"【갈등】 정말로 이걸로 괜찮은 걸까? 몇 번이고 자신에게 의문이 일어난다…….",
"【증오】 분노와 증오에 사로잡힌 당신은, 본래의 힘을 발휘할 수 있을까?",
"【망연】 이것은 현실인가? 몽롱한 정신으로 당신은 생각한다.",
"【주저】 망설임을 가졌다. 그것은 싸울 의지를 둔하게 할 것인가?",
"【악몽】 이제부터 때때로, 당신은 이 순간을 악몽으로 볼 것이다.",
"기적적으로 당신은 【낙인】을 받지 않았다.",
]

    text, total = get_table_by_2d6(table)
    return name, text, total
  end

  def choiceStrengthBadEndTable()
    name = "체력 배드엔딩표"

    table = [
"【사망】 당신은 죽었다. 다음 세션에 참가하기 위해서는, 클래스 1개를 『몬스터』나 『암흑』으로 클래스 체인지해야만 한다.",
"【목숨 구걸】 당신은 공포를 느껴, 목숨을 구걸했다! 다음 세션 개시 시에, 클래스 1개가 『자코』로 변경된다!",
"【망각】 당신은 기억을 잃고, 우두커니 섰다. 다음 세션에 참가하기 위해서는, 클래스 1개를 변경해야만 한다.",
"【비극】 당신의 공격은 적이 아니라 아군을 맞췄다! 모든 것이 끝날 때까지 당신은 우두커니 서 있게 된다. 임의의 아군의 【체력】을 1D6점 감소시킨다.",
"【폭주】 당신은 이성을 잃고, 충동에 따라 폭주한다! 같은 씬에 있는 전원의 【체력】을 1D6점 감소시킨다.",
"【전락】 당신은 단애절벽에서 떨어진다.",
"【포로】 당신은 적에게 사로잡혔다.",
"【도주】 당신은 겁에 질려, 동료를 버리고 도망쳤다.",
"【중상】 당신은 어찌할 수 없는 상처를 입고, 쓰러졌다.",
"【기절】 당신은 의식을 잃었다. 그리고 정신이 들면 모든 것이 끝나있었다.",
"그래도 아직 일어선다! 당신은 배드엔드를 맞이하지 않았다. 체력의 【낙인】을 1개 지워도 좋다.",
]

    text, total = get_table_by_2d6(table)
    return name, text, total
  end

  def choiceWillBadEndTable()
    name = "기력 배드엔딩표"

    table = [
"【자해】 당신은 스스로 죽음을 골랐다. 다음 세션에 참가하기 위해서는 클래스 1개를 『암흑』으로 클래스 체인지해야만 한다.",
"【타락】 당신은 마음속의 어둠에 먹혔다. 다음 세션 개시 시에, 클래스 1개가 『암흑』이나 『몬스터』로 변경된다!",
"【예속】 당신은 적의 말에 거스를 수 없다. 다음 세션에 당신의 스탠스는 『종속』이 된다.",
"【배반】 배반의 충동. 임의의 아군의 【체력】을 1D6점 감소시키고, 그 자리에서 도망친다.",
"【폭주】 당신은 이성을 잃고, 충동에 따라 폭주한다! 같은 씬에 있는 전원의 【체력】을 1D6점 감소시킨다.",
"【저주】 마음의 어둠이 현재화한 것인가. 적의 원한인가. 저주에 삼켜진 당신은, 그저 고통에 몸부림칠 수밖에 없다.",
"【포로】 당신은 적에게 사로잡혀, 그 자리에서 끌려갔다.",
"【도주】 당신은 겁에 질려, 동료를 버리고 도망쳤다.",
"【방심】 당신은 그저 멍하니 서 있을 수밖에 없다. 정신을 차렸을 때, 모든 것은 끝나있었다.",
"【기절】 당신은 의식을 잃었다. 그리고 정신이 들면 모든 것이 끝나있었다.",
"그래도 아직 포기하지 않아! 당신은 배드엔드를 맞이하지 않았다. 기력의 【낙인】을 1개 지워도 좋다.",
]

    text, total = get_table_by_2d6(table)
    return name, text, total
  end
end
