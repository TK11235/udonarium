# -*- coding: utf-8 -*-
# frozen_string_literal: true

class FutariSousa_Korean < DiceBot
  # ゲームシステムの識別子
  ID = 'FutariSousa:Korean'

  # ゲームシステム名
  NAME = '둘이서 수사(후타리소우사)'

  # ゲームシステム名の読みがな
  SORT_KEY = '国際化:Korean:둘이서 수사'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
・판정용 커맨드
탐정용：【DT】…10면체 주사위를 2개 굴려 판정합니다.『유리』라면【3DT】, 『불리』라면【1DT】를 사용합니다.
조수용：【AS】…6면체 주사위를 2개 굴려 판정합니다. 『유리』라면【3AS】, 『불리』라면【1AS】를 사용합니다.
・각종표
【조사】
이상한 버릇 결정표 SHRD
　지껄이다표  　SHFM／강압적인 수사표 　SHBT／시치미 떼기표　　　SHPI
　사건에 몰두표 SHEG／파트너와……표　　SHWP／무언가 하고 있다표 SHDS
　기상천외표　　SHFT／갑작스런 번뜩임표 SHIN／희노애락표 　　　　SHEM
이벤트표
　현장에서　 EVS／어째서?　EVW／협력자와 함께 EVN
　상대쪽에서 EVC／VS용의자 EVV
조사의 장애표 OBT　　변조표 ACT　　목격자표 EWT　　미제사건표 WMT
【설정】
배경표
　탐정　운명의 혈통 　BGDD／천상의 재능 　BGDG／마니아 　　 BGDM
　조수　정의로운 사람 BGAJ／정렬적인 사람 BGAP／말려든 사람 BGAI
신장표 HT　　아지트표 BT　　관계표 GRT　　추억의 물건 결정표 MIT
직업표A・B　　JBT66・JBT10　　패션 특징표A・B　　　　FST66・FST10
감정표A・B　　FLT66・FLT10　　좋아하는 것／싫어하는 것표A・B　LDT66・LDT10
호칭표A・B　NCT66・NCT10
MESSAGETEXT

  def initialize
    super
    @sendMode = 2
    @d66Type = 2

    @success_threshold = 4 # 成功の目標値（固定）
    @special_dice = 6 # スペシャルとなる出目（ダイスの種別によらず固定）
  end

  setPrefixes(
    ['(\d+)?DT', '(\d+)?AS', 'SHRD', 'SHFM', 'SHBT', 'SHPI', 'SHEG', 'SHWP', 'SHDS', 'SHFT', 'SHIN', 'SHEM', 'EVS', 'EVW', 'EVN', 'EVC', 'EVV', 'OBT', 'ACT', 'EWT', 'WMT', 'BGDD', 'BGDG', 'BGDM', 'BGAJ', 'BGAP', 'BGAI', 'HT', 'BT', 'GRT', 'MIT', 'JBT66', 'JBT10', 'FST66', 'FST10', 'FLT66', 'FLT10', 'LDT66', 'LDT10', 'NCT66', 'NCT10',]
  )

  def rollDiceCommand(command)
    output = '1'
    type = ""
    diceText = ""

    case command
    when /^(\d+)?DT$/i
      type = command
      count = (Regexp.last_match(1) || 2).to_i
      output, diceText = get_dt(count)
    when /^(\d+)?AS$/i
      type = command
      count = (Regexp.last_match(1) || 2).to_i
      output, diceText = get_as(count)
    when 'SHRD'
      type = '이상한 버릇 결정표'
      output, diceText = get_strange_habit_random
    when 'SHFM'
      type = '이상한 버릇・지껄이다표'
      output, diceText = get_strange_habit_from_mouth
    when 'SHBT'
      type = '이상한 버릇・강압적인 수사표'
      output, diceText = get_strange_habit_bull_through
    when 'SHPI'
      type = '이상한 버릇・시치미 떼기표'
      output, diceText = get_strange_habit_play_innocent
    when 'SHEG'
      type = '이상한 버릇・사건에 몰두표'
      output, diceText = get_strange_habit_engrossed
    when 'SHWP'
      type = '이상한 버릇・파트너와……표'
      output, diceText = get_strange_habit_with_partner
    when 'SHDS'
      type = '이상한 버릇・무언가 하고 있다표'
      output, diceText = get_strange_habit_do_something
    when 'SHFT'
      type = '이상한 버릇・기상천외표'
      output, diceText = get_strange_habit_fantastic
    when 'SHIN'
      type = '이상한 버릇・갑작스런 번뜩임표'
      output, diceText = get_strange_habit_inspiration
    when 'SHEM'
      type = '이상한 버릇・희노애락표'
      output, diceText = get_strange_habit_emotion
    when 'EVS'
      type = '현장에서／이벤트표'
      output, diceText = get_event_scene
    when 'EVW'
      type = '어째서?／이벤트표'
      output, diceText = get_event_why
    when 'EVN'
      type = '협력자와 함께／이벤트표'
      output, diceText = get_event_npc
    when 'EVC'
      type = '상대쪽에서／이벤트표'
      output, diceText = get_event_coming
    when 'EVV'
      type = 'VS용의자／이벤트표'
      output, diceText = get_event_vs
    when 'OBT'
      type = '조사의 장애표'
      output, diceText = get_obstruction_table
    when 'ACT'
      type = '변조표'
      output, diceText = get_abnormal_condition
    when 'EWT'
      type = '목격자표'
      output, diceText = get_eyewitness_table
    when 'WMT'
      type = '미제사건표'
      output, diceText = get_wrapped_in_mystery_table
    when 'BGDD'
      type = '탐정・운명의 혈통 배경표'
      output, diceText = get_background_detective_destiny
    when 'BGDG'
      type = '탐정・천성의 재능 배경표'
      output, diceText = get_background_detective_genius
    when 'BGDM'
      type = '탐정・마니아 배경표'
      output, diceText = get_background_detective_mania
    when 'BGAJ'
      type = '조수・정의로운 사람 배경표'
      output, diceText = get_background_assistant_justice
    when 'BGAP'
      type = '조수・정렬적인 사람 배경표'
      output, diceText = get_background_assistant_passion
    when 'BGAI'
      type = '조수・말려든 사람 배경표'
      output, diceText = get_background_assistant_involved
    when 'HT'
      type = '신장표'
      output, diceText = get_height_table
    when 'BT'
      type = '아지트표'
      output, diceText = get_base_table
    when 'GRT'
      type = '관계표'
      output, diceText = get_guest_relation_table
    when 'MIT'
      type = '추억의 물건 결정표'
      output, diceText = get_memorial_item_table
    when 'JBT66'
      type = '직업표A'
      output, diceText = get_job_table_66
    when 'JBT10'
      type = '직업표B'
      output, diceText = get_job_table_10
    when 'FST66'
      type = '패션 특징표A'
      output, diceText = get_fashion_table_66
    when 'FST10'
      type = '패션 특징표B'
      output, diceText = get_fashion_table_10
    when 'FLT66'
      type = '감정표A'
      output, diceText = get_feeling_table_66
    when 'FLT10'
      type = '감정표B'
      output, diceText = get_feeling_table_10
    when 'LDT66'
      type = '좋아하는 것／싫어하는 것표A'
      output, diceText = get_like_dislike_table_66
    when 'LDT10'
      type = '좋아하는 것／싫어하는 것표B'
      output, diceText = get_like_dislike_table_10
    when 'NCT66'
      type = '호칭표A'
      output, diceText = get_name_to_call_table_66
    when 'NCT10'
      type = '호칭표B'
      output, diceText = get_name_to_call_table_10
    end

    return "#{type}(#{diceText}) ＞ #{output}"
  end

  # DT
  def get_dt(count)
    diceList = []
    count.times do
      dice, =  roll(1, 10)
      diceList << dice
    end

    output = get_dt_result(diceList)
    diceText = diceList.join(",")

    return output, diceText
  end

  def get_dt_result(diceList)
    max = diceList.max

    return "펌블（변조를 받고, 조수의 마음고생이 1점 상승）" if max <= 1
    return "스페셜（조수의 여유를 1점 획득）" if diceList.include?(@special_dice)
    return "성공" if max >= @success_threshold

    return "실패"
  end

  # AS
  def get_as(count)
    diceList = []
    count.times do
      dice, =  roll(1, 6)
      diceList << dice
    end

    output = get_as_result(diceList)
    diceText = diceList.join(",")

    return output, diceText
  end

  def get_as_result(diceList)
    max = diceList.max

    return "펌블（변조를 받고, 조수의 마음고생이 1점 상승）" if max <= 1
    return "스페셜（여유 2점과, 탐정의 조수를 향한 감정을 획득）" if diceList.include?(@special_dice)
    return "성공（여유 1점과, 탐정의 조수를 향한 감정을 획득）" if max >= @success_threshold

    return "실패"
  end

  def getTableResult(table, dice)
    number, text, command = table.assoc(dice)

    if command.respond_to?(:call)
      text += command.call(self)
    end

    return number, text
  end

  def getAddRollProc(command)
    # 引数なしのlambda
    # Ruby 1.8と1.9以降で引数の個数の解釈が異なるため || が必要
    lambda { || getAddRoll(command) }
  end

  def getAddRoll(command)
    return command if /^\s/.match(command)

    text = rollDiceCommand(command)
    return " ＞ #{command} is NOT found." if text.nil?

    return " ＞ \n #{command} ＞ #{text}"
  end

  # 異常な癖決定表(이상한 버릇 결정표)
  def get_strange_habit_random
    table = [
      [1, '「이상한 버릇・지껄이다표」를 사용한다.'],
      [2, '「이상한 버릇・강압적인 수사표」를 사용한다.'],
      [3, '「이상한 버릇・시치미 떼기표」를 사용한다.'],
      [4, '「이상한 버릇・사건에 몰두표」를 사용한다.'],
      [5, '「이상한 버릇・파트너와……표」를 사용한다.'],
      [6, '「이상한 버릇・무언가 하고 있다표」를 사용한다.'],
      [7, '「이상한 버릇・기상천외표」를 사용한다.'],
      [8, '「이상한 버릇・갑작스런 번뜩임표」를 사용한다.'],
      [9, '「이상한 버릇・희노애락표」를 사용한다.'],
      [10, '원하는「이상한 버릇표」를 사용한다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_from_mouth
    table = [
      [1, '맹렬하게 감사인사를 한다.'],
      [2, '빈정거리는 투로 말해버린다.'],
      [3, '상대의 말을 긍정한 뒤 부정한다.'],
      [4, '히죽히죽 웃으며 사과한다.'],
      [5, '상대의 말을 듣지 않고 자신만 말한다.'],
      [6, '「이렇게는 생각할 수 없을까요?」'],
      [7, '「아니면, 뭔가 숨기고 있는 거라도 있나요?」'],
      [8, '「묘하네요.」'],
      [9, '「대충 알겠어요.」'],
      [10, '「잠자코 있어.」'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_bull_through
    table = [
      [1, '마음대로 수사대상의 가방이나 서랍을 연다.'],
      [2, '경찰의 수사에 끼어든다.'],
      [3, '수사를 위해 해킹이나 불법침입을 한다.'],
      [4, '허가 받지 않은 곳에 들어간다.'],
      [5, '경찰의 수사를 엿보거나 엿듣는다.'],
      [6, '증거품을 허가 없이 해체한다.'],
      [7, '수사대상을 속여 정보를 캐낸다.'],
      [8, '마음대로 관계자의 소지품을 만진다.'],
      [9, '증거품을 마음대로 들고 다닌다.'],
      [10, '마음대로 감식을 시작한다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_play_innocent
    table = [
      [1, '자신의 신분을 속이고 관계자에게 이야기를 듣는다'],
      [2, '정보를 숨기며 이야기를 듣는다'],
      [3, '파트너와 연기를 하며 정보를 캐내려 한다'],
      [4, '행인인 척하며 관계자의 이야기를 엿듣는다.'],
      [5, '우연을 가장해 증거품을 손에 넣어버린다.'],
      [6, '부자연스럽게 시치미를 뗀다.'],
      [7, '관계자를 화나게 하는 연기를 하여 정보를 끌어낸다.'],
      [8, '완곡하게 관계자를 위협한다'],
      [9, '물건을 잃어버렸다고 말하며 현장이나 증거품을 뒤진다.'],
      [10, '관계자에게 유도 신문을 한다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_engrossed
    table = [
      [1, '파트너의 몸을 사용해 사건을 재현하려고 한다'],
      [2, '수수께끼를 푸는 것이 즐거워서 웃어 버린다'],
      [3, '먹지도 자지도 않고 수사를 하다 갑자기 쓰러진다'],
      [4, '생각을 하느라 누구의 목소리도 들리지 않는다.'],
      [5, '사건의 관계도를 가까운 벽이나 바닥에 그리기 시작한다'],
      [6, '사건에 관계되는 말을 계속해서 말해나간다.'],
      [7, '사건 해결 이외의 것은 전혀 생각하고 있지 않다.'],
      [8, '사건의 흐름을 중얼중얼 말하기 시작한다.'],
      [9, '사건 현장을 파고들어 조사를 한다.'],
      [10, '식사중이라도, 상관 없이 사건 이야기를 한다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_with_partner
    table = [
      [1, '파트너의 신뢰에 응석부린다.'],
      [2, '파트너를 두고 먼저 가버린다.'],
      [3, '파트너에게 사건에 대해 어떻게 생각하는지 질문한다.'],
      [4, '파트너에게 자랑한다.'],
      [5, '파트너에게 사건에 관한 퀴즈를 낸다.'],
      [6, '파트너와 사소한 일로 싸움을 한다.'],
      [7, '파트너에게 선생님 행세를 한다.'],
      [8, '파트너가 따라오는 전제로 멋대로 움직인다.'],
      [9, '파트너에 대해서 친절하고 정중하게 사건을 설명한다.'],
      [10, '파트너의 귓가에 갑자기 말하기 시작한다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_do_something
    table = [
      [1, '많은 양의 책을 읽고 있다.'],
      [2, '좋아하는 음악을 큰 소리로 틀고 있다.'],
      [3, '어떤 수식을 풀고 있다.'],
      [4, '많은 양의 좋아하는 음식을 계속 먹고 있다.'],
      [5, '계속 컴퓨터나 스마트폰 등의 화면과 마주보며 조사하고 있다.'],
      [6, '작은 수수께끼를 풀고 있다.'],
      [7, '체스나 장기 등을 두고 있다.'],
      [8, '찻집 자리에 앉아 무언가를 기다리고 있다.'],
      [9, '계속 잠들어 있다가 갑자기 일어난다.'],
      [10, '잠시 아무 것도 하지 않는다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_fantastic
    table = [
      [1, '그만두라는 말을 듣고 있는 일을 한다.'],
      [2, '잠시 사라졌다가 돌아온다.'],
      [3, '예상치 못한 곳(땅 속이나 공중 등)에서 등장한다.'],
      [4, '뭔가 생각나서 갑자기 달리기 시작한다.'],
      [5, '한심한 자신을 비난한다.'],
      [6, '모르는 사이에 사건의 수수께끼를 하나 풀고 있었다.'],
      [7, '사건에 대해 알아차린 모양이지만 누구에게도 가르쳐 주지 않는다.'],
      [8, '두고 가는 편지나 메일로 보고를 하면 모습이 보이지 않는다.'],
      [9, '시계를 보고 갑자기 움직인다.'],
      [10, '사건과는 관계 없을 것 같은 신문의 기사를 읽고 있다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_inspiration
    table = [
      [1, '식사를 하고 있으면 갑자기 수수께끼가 풀린다.'],
      [2, '조수와의 아무렇지도 않은 대화에서 갑자기 수수께끼가 풀린다.'],
      [3, '들려온 대화로부터 갑자기 수수께끼가 풀린다.'],
      [4, '목욕을 하고 있으면 갑자기 수수께끼가 풀린다.'],
      [5, '꿈 속에서 갑자기 수수께끼가 풀린다.'],
      [6, '바람이 불어 날아온 물건으로 수수께끼가 풀린다.'],
      [7, '책을 읽다가 사건의 힌트가 발견된다.'],
      [8, '현장을 다시 방문하니 번뜩인다.'],
      [9, '자료를 확인하는 중에 번뜩인다.'],
      [10, '관계자와 대화를 나누는 중에 번뜩이다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  def get_strange_habit_emotion
    table = [
      [1, '갑자기 운다.'],
      [2, '갑자기 화낸다.'],
      [3, '갑자기 웃기 시작한다.'],
      [4, '갑자기 하이텐션이 된다.'],
      [5, '갑자기 기뻐한다.'],
      [6, '갑자기 소리친다.'],
      [7, '갑자기 히죽거리기 시작한다.'],
      [8, '갑자기 이 사건의 슬픔을 말한다.'],
      [9, '담담하게 일을 진행한다.'],
      [10, '로봇처럼 정해진 것만 한다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  # イベント表
  def get_event_scene
    table = [
      "신경쓰이는 것（P.165）\n　사건이 일어난 현장은 아직 남아 있다.\n　여기서 일어난 '무언가'는 안개 저편에 숨겨져 있었다.\n　그 안개에 손을 뻗는 자들이 있다.",
      "거북해하다（P.166）\n　한 형사가 현장을 열심히 둘러보고 있다.\n　이 사건의 담당을 맡은 오사카베 마사요시(刑部正義)라는 남자다.\n　그는 PC들의 얼굴을 보자마자 얼굴을 찡그린다. 환영받지 못하고 있다.",
      "탐문（P.167）\n　PC들은 현장 부근을 지나다니거나 사건을 목격한 인물이 없는지 찾아다녔다.\n　그러나 어디서 무엇을 물어도 그럴 듯한 단서는 없다.\n　슬슬 다리에 피로가 쌓이기 시작했다.",
      "완고한 관계자（P.168）\n　사건 현장에 어떤 인물이 나타났다.\n　PC들은, 신묘한 얼굴로 현장을 바라보던 그 인물이 궁금해 말을 건다.\n　그 인물은 자신을 피해자의 관계자라고 자칭했다…….",
      "현장을 철저히 조사!（P.169）\n　사건 현장에 남겨진 증거는 거의 찾아냈다.\n　……과연 정말 그럴까?\n　모든 각도에서 조사와 검증을 하여 현장에 남겨진 것은 없는지 찾아보게 됐다.",
      "도망친 인물（P.170）\n　매우 빠르게 누군가가 현장에서 도망치고 있다.\n　그 인물의 달리는 모습이나 초조해하는 모습은 평범하지 않았다.\n　이건, 무언가를 알고 있다. 혹은 무언가를 가지고 떠났을 가능성이 있다.\n　PC들은 쫓기 시작했다.",
    ]
    return get_table_by_1d6(table)
  end

  def get_event_why
    table = [
      "이동 루트（P.171）\n　이 길을 지나갔을 때, 그 사람은 무슨 생각을 했을까?\n　이 길을 지나갔을 때, 그 사람은 무엇을 해야 했을까?\n　사건관계자들의 행적에는 사건에 이어지는 무언가가 남아 있다.\n　그렇게 믿으며, 길을 걷는다.",
      "자신이라면……（P.172）\n　탐정과 조수가 사건에 대해 이야기를 나누고 있었다.\n　이야기의 주제는,「 이 상황에서 자신이 범인이라면 어떻게 할 것인가.」\n　그 가정은 힌트를 줄 수도 있다.",
      "수수께끼의 메시지（P.173）\n　그것은, 수수께끼의 말이었다.\n　단순한 문자열일 수도 있고 뜻 모를 말일 수도 있다.\n　사건과 관련된 장소에 있었다고 해서, 사건에 관련되어 있다고는 할 수 없다.\n　하지만, 이것은 사건에 연루되어 있다. 그렇게 직감이 고하고 있다.",
      "사건 복습（P.174）\n　화이트보드, 칠판, 노트.\n　뭐든지 간에 쓸 것이 필요하다.\n　지금부터 사건에 대해 정리하는 거니까.",
      "수상한 인물은?（P.175）\n　PC들은 한 인물을 쫓고 있다.\n　그 인물은 사건에 이어지는 무언가를 가지고 있다. 그런 확신이 들었다.\n　자, 그는 어떤 사람일까?",
      "피해자의 시점（P.176）\n　피해자의 몸에 무슨 일이 일어났는가.\n　피해자는 무엇을 보았는가.\n　그 힌트는 피해자 자신이 알 것이다.",
    ]
    return get_table_by_1d6(table)
  end

  def get_event_npc
    table = [
      "사건의 영상（P.177）\n　PC들은 눈을 가늘게 뜨고 영상을 바라보고 있다.\n　그것은 공교롭게도 현장에서 찍힌 것이었다.\n　과연 진실은 이 영상 속에 담겨있는 것일까?",
      "특이한 목격자（P.178）\n　PC들은 수사 결과, 사건에 관한 무언가를 봤다는 목격자를 발견한다.\n　그러나 그 사람은 목격증언을 꺼렸다. 왜 그럴까?",
      "전문가（P.179）\n　조사 중, 아무래도 전문적인 지식이 필요한 곳이 나온다.\n　지금이 그 때이고 PC들은 어떻게 할지 고민하고 있었다.",
      "정보상（P.180）\n　메일 소프트웨어에 연락이 왔다.\n　연락해온 곳은 이 일대에서 유명한 정보상이었다.\n　그 정보상에게 걸리면 얻을 수 없는 정보는 없다고 한다.\n　자, 어떻게 할까?",
      "관계자와 함께（P.181）\n　사건관계자 중 한명이 갑자기 협력을 제안했다.\n　아무래도 그 사람도 이 사건에 대해서는 생각하는 구석이 있는 것 같다.",
      "아마추어 추리（P.182）\n　사건관계자 앞에서, 게스트 NPC가 추리를 선보이고 있다.\n　하지만 그 추리는 구멍투성이고…….",
    ]
    return get_table_by_1d6(table)
  end

  def get_event_coming
    table = [
      "수상한 전화（P.183）\n　갑자기 전화가 울렸다.\n　그 전화는 조사를 진전시키게 될까…….\n　동시에, 새로운 수수께끼를 남겼다.",
      "지금은 여가를（P.184）\n　행운은 누워서 기다려라.\n　쥐구멍에도 볕 들 날이 있다.\n　라는 걸로, 일단은 아지트에 있다.\n　과연 상황이 나아질까?",
      "길에서 딱（P.185）\n　개도 쏘다니면 몽둥이에 맞는다.\n　이 말에는 행운을 만난다는 의미도, 봉변을 당한다는 의미도 있다.\n　그럼, 탐정과 조수가 걸으면 무엇에 해당할까?",
      "번뜩이는 순간（P.186）\n　우연한 계기로 탐정은 번뜩이는 수가 있다.\n　이번엔 대체 무엇이 계기였을까?",
      "지인으로부터（P.187）\n　사건 수사의 단서를 가져온 것은, 지인이었다.\n　역시 친구밖에 없다.\n　라고 말하고 싶은 참인데…….",
      "PC들의 위기（P.188）\n　수사는 갑자기 멈췄다.\n　그 원인은 알고 있다.\n　원인을 제거하지 않으면 사건 조사는 할 수 없다.",
    ]
    return get_table_by_1d6(table)
  end

  def get_event_vs
    table = [
      "용의자의 거짓말（P.189）\n　사람은 뭔가 떳떳하지 못한 일이 있을 때 거짓말을 한다.\n　이 용의자는 거짓말을 하고 있다.\n　그렇다면, 무엇을 숨기고 있을까?",
      "흔들림（P.190）\n　그 용의자는 뭔가를 숨기고 있었다.\n　눈에 띄는 거짓말을 하고 있는 것은 아니다.\n 그렇지만 무언가 숨기고 있다. 탐정에겐, 그렇게 보였다.",
      "외모로부터의 추리（P.191）\n　조금만 이야기를 했다.\n　조금만 그 모습을 보았다.\n　조금만, 그 사람을 알았다.\n　그것만으로 탐정이라는 생물은 열을 안다. 원래 그런 것이다.",
      "직접 묻다（P.192）\n　여기서 탐정과 조수는 대담한 수를 썼다.\n　용의자를 상대로 사건의 구체적인 부분까지 파고드는 질문을 한 것이다.\n　그것에 대해 용의자는…….",
      "위협 받다（P.193）\n　아무래도 우리는 위협을 받는 것 같다.",
      "술래가 없는 사이에（P.194）\n　그 용의자를 찾아갔을 때 우연히 자리를 비우고 있었다.\n　이건 기회다.\n　그렇게 생각하는 것이 바로 탐정의 슬픈 천성이다.",
    ]
    return get_table_by_1d6(table)
  end

  # 調査の障害表(조사의 장애표)
  def get_obstruction_table
    table = [
      [11, '탐정과 조수가 경찰에게 마크당한다.'],
      [12, '탐정의 변덕'],
      [13, '탐정의 의욕'],
      [14, '탐정의 기행을 견딜 수 없게 되다.'],
      [15, '탐정이 기이한 의심을 받다.'],
      [16, '탐정이 피곤하다.'],
      [22, '탐정과 조수가 수상한 인물로 오인받는다.'],
      [23, '조수가 파트너에게 신뢰받지 못한다고 생각한다.'],
      [24, '조수가 탐정에게 따라갈 수 없다.'],
      [25, '조수의 수고가 어느 때보다 크다.'],
      [26, '조수의 수사만이 잘 안 된다.'],
      [33, '수사를 위한 자금이 없다.'],
      [34, '세상의 눈이 매섭다.'],
      [35, '경찰로부터 역겹다고 여겨진다.'],
      [36, '관계자가 협력해주지 않는다.'],
      [44, '수사해서는 안 된다고 압력이 들어온다.'],
      [45, '범인에 의한 방해'],
      [46, '범인에 의한 이면공작'],
      [55, '화분이나 철골 등 부자연스럽게 위험한 물건이 날아온다.'],
      [56, '누군가가 탐정과 조수에게 덤벼든다.'],
      [66, '우연이 겹쳐서 잘 안 된다.'],
    ]

    return get_table_by_d66_swap(table)
  end

  # 変調表(변조표)
  def get_abnormal_condition
    table = [
      '엇갈림',
      '탐정의 폭주',
      '다툼',
      '미아',
      '나쁜 소문',
      '주목의 대상',
    ]
    return get_table_by_1d6(table)
  end

  # 目撃者表(목격자표)
  def get_eyewitness_table
    table = [
      "놀이 상대를 원하는 젊은이. 판정기능：≪유행≫",
      "기억력이 나쁜 사람. 판정기능：없음",
      "바쁜 사람. 판정기능：≪비즈니스≫",
      "범인의 지인. 판정기능：≪설득≫",
      "탐정(경찰)을 싫어하는 사람. 판정기능：≪거짓말≫",
      "반사회주의자. 판정기능：≪돌파≫",
    ]
    return get_table_by_1d6(table)
  end

  # 迷宮入り表(미제사건표)
  def get_wrapped_in_mystery_table
    table = [
      [1, '진범이 아닌 인간이 범인이 되어, 실형을 받고 말았다. 그 증거는 없지만 그렇게 직감할 수 있다.'],
      [2, '해결되지 않은 채 시간이 흐르고, 이윽고 사건은 잊혀졌다. 탐정과 조수, 그리고 사건관계자들만 기억한다.'],
      [3, '피해자 유족과 관계자들은 슬픔에 잠겨 있다. 탐정과 조수는 그저 잠자코 보고만 있을 뿐이다. 그때, 범인을 잡았다면…….'],
      [4, '경찰에 의해 범인이 검거되었다고 하지만, 그 사람이 정말로 범인인지 어떤지는 알 수 없다. 탐정도, 뭐라고 말할 수 없는 것 같다.'],
      [5, '증거가 없어져 버렸다. 그것만 있다면, 사건의 조사를 재개할 수 있을 텐데……. 범인의 소행인지조차 알 수 없다.'],
      [6, '관계자가 없어져 버렸다. 그 후 소식도 묘연하다. 도대체 무슨 생각을 하며 사라진 것일까? 어쨌든, 조사는 할 수 없게 되었다.'],
      [7, '관계자에게 미움 받아, 접근 조차 할 수 없게 되었다. 탐정과 조수는 모두 출입금지가 되어 버린 것 같다. 이래서는 조사를 할 수 없다.'],
      [8, '조수는 때때로 피해자의 관계자와 만나고 있다. 그들의 말을 듣고 그들의 감정을 받아들이는 것 같다.'],
      [9, '탐정과 조수는 기회를 발견하고 사건을 재조사하고 있다. 그러나 확실한 증거는 찾지 못한 채 시간이 흘러간다.'],
      [10, '탐정은 직감으로 진범을 밝혀냈다. 하지만 진범을 잡기 위한 증거가 없다. 범인을 고발하지 못해 이를 갈았다.'],
    ]

    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  # 背景表(배경표)
  def get_background_detective_destiny
    table = [
      [1, '『명탐정인 조상(실재)』자신의 조상에 저명한 탐정이 있다. 그 이름을 대면 누구나 알 만한 대인물이다. 자신은 그 피를 진하게 잇고 있는 것 같고, 탐정으로서의 재능을 마음껏 발휘하고 있다.'],
      [2, '『명탐정인 조상(허구)』자신의 조상은 저명한 탐정이다. 그러나 그 활약은 픽션으로 알려져 있다. 그 인물은 실존하지 않는다고 말하지지만… 그것은 사실이 아니다. 자신이 그 피를 잇고 있으니까.'],
      [3, '『부모가 세계적인 탐정』자신의 부모는 세계적으로 알려진 명탐정이다. 숱한 난사건도 해결했다. 자신에게도 그 피가 흐르고 있어 사건에 대한 날카로운 통찰력을 이어받게 되었다.'],
      [4, '『마을의 명탐정』자신의 부모는, 마을에서는 잘 알려진 명탐정이다. 마을 사람들에게 사랑받고 의지가 되는 존재였다. 자신도 그 피를 잇고 있는지 탐정으로서 활동할 힘이 있다.'],
      [5, '『추리작가』자신을 키운 인물은 저명한 추리작가였다. 그 사고능력은 자신에게도 계승되었고, 트릭을 파헤치는 힘은 탐정 수준에 있다고 해도 좋을 것이다.'],
      [6, '『양부모』자신을 키워 준 인물은, 사건을 해결로 이끈 적이 있는 인물이다. 그 사람의 가르침을 받고 자신은 탐정의 재능을 꽃피웠다.'],
      [7, '『타락한 명탐정』일찍이, 자신의 부모는 모든 사건을 해결하여, 명탐정으로 유명했다. 그러나 지금은 뛰어난 사고능력을 악용해 사람들을 장기말마냥 다룬다. 능력을 이어받은 자신도 언젠가는 그렇게 될까?'],
      [8, '『대악인의 피』세상을 떠들썩하게 했던 대악당과 대괴도. 그 피가 자신에게도 흐르고 있다. 그러므로 악인의 사고를 추적할 수 있으며 결과적으로 명탐정처럼 행동한다.'],
      [9, '『숨겨진 핏줄』무슨 이유에서인지, 자신의 뿌리는 말소되어 있다. 내가 누구인지조차 모른다. 단지, 자신에게는 사건을 해결할 수 있는 힘이 있고, 그것이 뿌리와 관계가 있다고 직감할 수 있다.'],
      [10, '『클론』자신은 유명한 명탐정의 DNA에서 태어난 존재다. 그래서인지 명탐정의 힘은 타고난 것이었다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)

    return output, diceText
  end

  def get_background_detective_genius
    table = [
      [1, '『초엘리트』자신은 엘리트로 활약하기 위해 모든 분야의 훈련을 받았다. 그리고 원하는 대로 우수한 사람이 되었다.'],
      [2, '『순간기억능력』본 것은 모두 머릿속에 입력된다. 그리고, 절대로 잊지 않는다. 자신은 그런 능력을 갖추고 있다.'],
      [3, '『지식의 샘』머리 속에 있는 서랍 속에는 온갖 지식이 담겨 있다. 즉, 모르는 게 없다는 얘기다.'],
      [4, '『스파르타 교육』엄격한 교육을 받았고, 그 결과 지식을 얻을 수 있었다. 그 대신, 조금 별난 사고방식이 되어 버렸지만……. 별 것 아닐 것이다.'],
      [5, '『이미 명탐정』이미 수많은 사건을 해결하고 있는 천재이다. 숱한 난사건도 자신의 수완으로 해결해 왔다. 그 옆에는 파트너의 모습도 있었다.'],
      [6, '『동경하는 등』자신에게는 동경하고 있는 상대가 있었다. 그 존재를 따라잡기 위해 노력했고 지금의 능력을 얻었다. 그 인물은, 지금은…….'],
      [7, '『라이벌』자신과 겨루던 라이벌이 있다. 능력으로는 거의 호각이었다. 경쟁 속에서, 자신의 능력은 연마되어 간 것이다.'],
      [8, '『과거의 명탐정』이전에는, 모든 사건을 해결로 이끈 천재였다. 그러나 지금은 사건 해결에 소극적이다. 사건을 멀리하고 싶은 무언가가 있었던 것이다.'],
      [9, '『고립된 명탐정』자신은 천재적인 능력을 가지고 수많은 사건을 해결한 명탐정이다. 그 때문에 소외되고, 두려운 존재로 여겨져, 세간이나 조직 속에서 고립되었다.'],
      [10, '『인공 명탐정』자신은 누군가에게 연금되어 탐정 지식을 주입당한 「인공 명탐정」이다. 명탐정이 되도록 길러진 자신은 그 능력을 기대한 대로 발휘할 수 있다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)

    return output, diceText
  end

  def get_background_detective_mania
    table = [
      [1, '『서스펜스 마니아』자신은 서스펜스물의 픽션이나, 실존하는 사건에 대해서 매우 큰 관심을 가지고 있다. 쌓아온 트릭의 지식을 활용할 수 있는 기회를 노리고 있다.'],
      [2, '『시체 마니아』자기는 시체에 대해 큰 관심을 갖고 있다. 시체의 상태나 상세정보를 아는 것으로써, 강한 흥분을 느끼는 성질인 것이다. 난처한 일이다.'],
      [3, '『과학 마니아』과학에 의해 해명되지 못할 것은 없다. 나는 그렇게 생각하고 있으며 이를 위해 능력을 닦아 왔다. 사람이 일으키는 사건이라도, 과학은 모든 것을 내다볼 수 있을 것이다.'],
      [4, '『이른바 오타쿠』게임이나 만화 등에서 얻은 지식이란 의외로 바보 취급할 수 없다. 자신은 게임을 통해 다양한 지식을 쌓아왔으며 이를 응용함으로써 모든 사건을 해결한다.'],
      [5, '『인간 마니아』자신은 인간을 좋아한다. 그래서 관찰도 하고 있다. 행동에 당사자도 모르는 이유가 있다는 것도 알고 있다. 사건도, 왜 그런 일을 저질렀는지에 관심이 있다.'],
      [6, '『서적 마니아』책에는 모든 것이 적혀 있다. 적어도 자신은 그렇게 생각하고 있고, 그 증거로 책의 지식을 응용함으로써 어려운 사건도 해결할 수 있다. 종이 속의 명탐정처럼.'],
      [7, '『오컬트 마니아』오컬트나 초상현상을 믿는다. 그래서 가짜를 알아보는 법도 알며, 용서할 수 없다고 느끼고 있다. 그것이, 어찌된 영문인지 난사건 해결로도 연결된다. 신기하다.'],
      [8, '『탐정 마니아』동서고금, 다양한 탐정이 있다. 그에 대해 조사해 가는 동안, 자신 또한 탐정으로서의 능력이 갖추어졌다.'],
      [9, '『폭주하는 지식욕』자신은 한 가지 일에 마니아이지만, 그로부터 파생된 것의 지식도 잘 알고 있다. 자신의 지식욕은, 거기서부터 또다시 파생된 것까지 이른다.'],
      [10, '『정의의 마니아』자신이 신봉하고 있는 무언가(서적, 과학 등)가 사건에 연루되면 좌불안석이다. 마니아로서 그 수수께끼를 풀어야 한다.'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)

    return output, diceText
  end

  def get_background_assistant_justice
    table = [
      '『착한 사람』자신은 다른 사람으로부터 곧잘 좋은 사람이라는 말을 듣는다. 그렇기 때문에 다른 사람의 부탁을 받고 사건에 얽히는 일이 잦았다. 그래니 남의 고민을 해결할 수 있는 능력이 있는 파트너와 함께 있다.',
      '『용서할 수 없다』자신은 사건의 피해자에 이입하는 타입이다. 피해자의 심정을 생각하면 참담하면서도 범인을 용서할 수 없다는 생각이 든다. 그래서 범인을 쫓기 위해 파트너가 필요하다.',
      '『납득하고 싶다』자신이 사건에 대해 깊이 관여하는 것은, 자신이 납득하길 원하기 때문이다. 사건을 통해 어떤 해답을 찾기 위해 정의를 행하고 있다. 파트너는 이를 위해 필요한 사람이다.',
      '『이용하고 있다』어떤 수단을 써서라도 사건을 해결하는 것이 옳다고 자신은 생각하고 있다. 그것을 위한 도구로서 파트너를 쓰고 있을 뿐이다.',
      '『믿을 수 있는 협력자』파트너를 의지할 수 있는 협력자라고 느끼고 있다. 파트너는 자신이 곤란할 때, 방황할 때, 대답을 해주는 사람이라고 생각한다. 상대가 어떻게 생각하든 그것은 변하지 않는다.',
      '『정의의 동지』파트너도 함께 정의를 위해 사건 해결을 해주고 있다. 자신은 그렇게 느끼고 있다. 그렇게 믿고 있을 뿐일지도 모르지만, 그 믿음은 멈출 수 없다. 어쩌면 자신이 파트너를 휘두르고 있는지도 모르겠다.',
    ]
    return get_table_by_1d6(table)
  end

  def get_background_assistant_passion
    table = [
      '『능력에 반했다』자신은 파트너의 사건에 관한 능력에 반했다. 그 예리한 통찰력과 추리력, 지식의 깊이. 모든 것이 자신을 매료시키고 있다.',
      '『인품에 반했다』자신이 파트너와 손을 잡고 있는 것은 인격적인 면이 크다. 언뜻 보기 힘든 대목도 있지만 감춰진 본질에 자신은 푹 빠져 있다.',
      '『첫눈에 반했다』처음 만났을 때부터 파트너가 마음에 걸렸다. 그 능력도 그렇지만 직감적인 것을 느꼈던 것이다. 그래서 같이 있는다.',
      '『마음이 맞았다』자신과 파트너는 마음이 잘 맞는다. 두 사람이면 흥을 돋울 수 있고, 두 사람이면 뭐든지 할 수 있다. 그렇게 생각한다……자신이 그렇게 생각하는 것일 뿐일지도 모르지만.',
      '『대립』자신과 파트너는 대립하고 있다. 그래도 함께 있는 것은 파트너를 이해하기 위해서다…… 언젠가, 파트너를 쓰러뜨릴 수단을 찾기 위해서.',
      '『내버려둘 수 없다』파트너를 내버려두면 무슨 짓을 할지 모른다. 그러니까 자신이 지켜보고 있어야 돼. 그렇게 느꼈다.',
    ]
    return get_table_by_1d6(table)
  end

  def get_background_assistant_involved
    table = [
      '『일방적으로 마음에 들었다』파트너가 일방적으로 좋아한다. 어쩌다 그랬는지는 모르겠지만 그런 것 같다. 함께 있는 것은 자신의 의지가 아니지만…….',
      '『리액션 요원』파트너에 의하면, 자신에게 리액션을 기대하고 있는 것 같다. 사건을 해결했을 때나, 어떤 놀라움이 있었을 때에 보이는 반응이 즐겁다던가.',
      '『과거의 빚』과거, 파트너에게 비밀이나 약점을 잡혔다. 그 이후, 파트너가 부려먹고 있다. 아직 도망치지 못했다.',
      '『필요한 인재』파트너에게 자신이 필요하다고 부탁받았다. 그래서, 함께 사건을 해결하고 있다. 왜 자신이 필요한지는 아직 모른다.',
      '『친한 사람』파트너에게 자신은 친근한 인물이다. 소꿉친구와 친구, 친척 등. 그래서 옛날부터 휘둘리고 있고 앞으로도 계속 휘둘릴 것이다.',
      '『우연의 연속』파트너가 사건에 직면할 때마다 마침 그 자리에 있다. 그러다 보니 어느새 친해져 있었다. 지금은 함께 있는 일도 많다.',
    ]
    return get_table_by_1d6(table)
  end

  # 身長表(신장표)
  def get_height_table
    table = [
      '매우 크다',
      '큰 편',
      '평균적',
      '작은 편',
      '매우 작다',
      '파트너보다 조금 크다／조금 작다',
    ]

    return get_table_by_1d6(table)
  end

  # たまり場表(아지트표)
  def get_base_table
    table = [
      [1, 'PC가 일하고 있는 직장'],
      [2, '조용한 분위기의 찻집'],
      [3, '떠들썩한 분위기의 술집'],
      [4, '탐정활동을 위해 빌린 사무소'],
      [5, 'PC 중 한쪽의 집'],
      [6, '단골 음식점'],
      [7, '이동에 쓰이는 차 안'],
      [8, '지인에게 양도받은 창고'],
      [9, '언제나 파트너와 만나는 교차점'],
      [10, '둘만 알고 있는 비밀장소'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  # 関係表()
  def get_guest_relation_table
    table = [
      [11, '옛날 친구'],
      [12, '친구(友人)'],
      [13, '친구(親友)'],
      [14, '안면이 있다'],
      [15, '전우'],
      [16, '악연'],
      [22, '과거에 무언가 있었다'],
      [23, '사촌'],
      [24, '친구의 친구'],
      [25, '먼 친척'],
      [26, '이웃'],
      [33, '민폐를 끼쳤다'],
      [34, '스승'],
      [35, '인터넷으로 알게 되었다'],
      [36, '우연히 알게 되었다'],
      [44, '전에 딱 한 번 만났다'],
      [45, '파트너의 일로 상담 받았다'],
      [46, '파트너에 대해 질문 받았다'],
      [55, '소꿉친구'],
      [56, '파트너를 쫓고 있다'],
      [66, '일방적으로 알려져 있다'],
    ]
    return get_table_by_d66_swap(table)
  end

  # 思い出の品決定表(추억의 물건 결정표)
  def get_memorial_item_table
    table = [
      [11, '아지트에 계속 놓여 있는 배달피자상자'],
      [12, '같이 해결한 사건의 파일'],
      [13, '두 사람이 만난 계기가 된 책'],
      [14, '둘이서 놀았던 체스판이나 장기판'],
      [15, '두 사람의 추억이 쌓인 게임기'],
      [16, '두 사람이 찍힌 사진'],
      [22, '두 사람의 수사노트'],
      [23, '같이 사용한 청소도구'],
      [24, '피해자로부터 받은 인형'],
      [25, '둘이서 같이 앉은 소파'],
      [26, '언제나 앉아있는 의자'],
      [33, '자주 사용하는 전화기'],
      [34, '둘의 시간을 새긴 시계'],
      [35, '언제나 놓여있는 책상'],
      [36, '사건 해설을 한 화이트보드나 칠판'],
      [44, '어째선지 있는 인체모형'],
      [45, '좋아하는 컵'],
      [46, '사건해결에 쓴 소도구'],
      [55, '같이 마시기로 약속한 술이나 주스'],
      [56, '좋아하는 요리'],
      [66, '둘만의 비밀교환일기'],
    ]
    return get_table_by_d66_swap(table)
  end

  # 職業表A(직업표A)
  def get_job_table_66
    table = [
      [11, '파트너와 같음'],
      [12, '프리터'],
      [13, '학생(우수)'],
      [14, '학생(보통)'],
      [15, '학생(불성실)'],
      [16, '교사,강사'],
      [22, '파트너와 같음'],
      [23, '회사원'],
      [24, '주부'],
      [25, '자영업자'],
      [26, '딜레탕트'],
      [33, '파트너와 같음'],
      [34, '형사(신입)'],
      [35, '형사(엘리트)'],
      [36, '공무원'],
      [44, '파트너와 같음'],
      [45, '탐정조수'],
      [46, '탐정'],
      [55, '파트너와 같음'],
      [56, '무직'],
      [66, '파트너와 같음'],
    ]

    return get_table_by_d66_swap(table)
  end

  # 職業表B(직업표B)
  def get_job_table_10
    table = [
      [1, '딜레탕트'],
      [2, '형사'],
      [3, '탐정(유명)'],
      [4, '탐정(인기없음)'],
      [5, '탐정조수'],
      [6, '연구자'],
      [7, '자영업자'],
      [8, '회사원'],
      [9, '작가'],
      [10, '학생'],
    ]

    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  # ファッション特徴表A(패션특징표A)
  def get_fashion_table_66
    table = [
      [11, '고급지향'],
      [12, '정장'],
      [13, '캐주얼 웨어(평상복)'],
      [14, '포멀 웨어(정장)'],
      [15, '스포츠웨어'],
      [16, '합리적임'],
      [22, '선글라스'],
      [23, '와이셔츠'],
      [24, '티셔츠'],
      [25, '목걸이'],
      [26, '모자'],
      [33, '밀리터리'],
      [34, '피어스'],
      [35, '추리닝'],
      [36, '붙임머리'],
      [44, '일본전통옷'],
      [45, '반지'],
      [46, '초커'],
      [55, '샌들'],
      [56, '점퍼'],
      [66, '패션에 구애받지 않는다'],
    ]
    return get_table_by_d66_swap(table)
  end

  # ファッション特徴表B(패션특징표B)
  def get_fashion_table_10
    table = [
      [1, '정장'],
      [2, '인버네스'],
      [3, '백의'],
      [4, '글로브'],
      [5, '파이프'],
      [6, '조끼'],
      [7, '일본전통옷'],
      [8, '컬러풀한 색 사용'],
      [9, '파트너와 같음'],
      [10, '패션에 구애받지 않는다'],
    ]

    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  # 好きなもの／嫌いなもの表A(좋아하는 것/싫어하는 것표A)
  def get_like_dislike_table_66
    table = [
      [11, '시체'],
      [12, '개'],
      [13, '고양이'],
      [14, '서스펜스'],
      [15, '이야기'],
      [16, '아이돌'],
      [22, '범죄'],
      [23, '오컬트'],
      [24, '건강'],
      [25, '정크푸드'],
      [26, '고급식사'],
      [33, '패션'],
      [34, '권력'],
      [35, '명예'],
      [36, '우정'],
      [44, '간식'],
      [45, '고향'],
      [46, '가족'],
      [55, '경찰'],
      [56, '음악'],
      [66, '총'],
    ]

    return get_table_by_d66_swap(table)
  end

  # 好きなもの／嫌いなもの表B(좋아하는 것/싫어하는 것표B)
  def get_like_dislike_table_10
    table = [
      [1, '범죄'],
      [2, '수수께끼'],
      [3, '탐정'],
      [4, '파트너'],
      [5, '파트너가 좋아하는 것'],
      [6, '파트너가 싫어하는 것'],
      [7, '딱히 없음'],
      [8, '체스나 장기 등의 보드게임'],
      [9, '인간'],
      [10, '모르는 것'],
    ]

    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  # 感情表A(감정표A)
  def get_feeling_table_66
    table = [
      [11, '얼굴'],
      [12, '분위기'],
      [13, '외관'],
      [14, '수사방법'],
      [15, '행동거지'],
      [16, '냄새'],
      [22, '존재 그 자체'],
      [23, '말투'],
      [24, '취미(취향)'],
      [25, '왠지 모르게'],
      [26, '타인을 향한 태도'],
      [33, '금전감각'],
      [34, '생활습관'],
      [35, '기능'],
      [36, '복장'],
      [44, '말할 타이밍'],
      [45, '윤리관'],
      [46, '자신을 향한 태도'],
      [55, '거리감'],
      [56, '자신과의 관계'],
      [66, '생활습관'],
    ]

    return get_table_by_d66_swap(table)
  end

  # 感情表B(감정표B)
  def get_feeling_table_10
    table = [
      [1, '인간성'],
      [2, '취미(취향)'],
      [3, '기능'],
      [4, '왠지 모르게'],
      [5, '감각'],
      [6, '분위기'],
      [7, '자신이 모르는 점'],
      [8, '자신이 잘 알고 있는 점'],
      [9, '자신을 향한 태도'],
      [10, '자신과의 관계'],
    ]
    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)
    return output, diceText
  end

  # 呼び名表A(호칭표A)
  def get_name_to_call_table_66
    table = [
      [11, '달링, 허니'],
      [12, '이름'],
      [13, '~군(くん)'],
      [14, '~씨(さん)'],
      [15, '~쨩(ちゃん)'],
      [16, '~님(様), ~공(殿)'],
      [22, '~선배, ~후배'],
      [23, '파트너(相棒)'],
      [24, '당신(あんた)'],
      [25, '당신(あなた)'],
      [26, '선생(님)'],
      [33, '물건으로 비유한다.'],
      [34, '네놈/자네(貴様)、귀하(貴殿)'],
      [35, '너(てめえ、おまえ)'],
      [36, '별명'],
      [44, '유(ユー)'],
      [45, '자네(お前さん)'],
      [46, '탐정군, 탐정씨'],
      [55, '친구'],
      [56, '파트너와 같다.'],
      [66, '매번 호칭이 바뀐다.'],
    ]

    return get_table_by_d66_swap(table)
  end

  # 呼び名表B(호칭표B)
  def get_name_to_call_table_10
    table = [
      [1, '이름'],
      [2, '~군(くん)'],
      [3, '~씨(さん)'],
      [4, '~쨩(ちゃん)'],
      [5, '~님(様), ~공(殿)'],
      [6, '파트너(相棒)'],
      [7, '당신(あんた、あなた)'],
      [8, '너(キミ)'],
      [9, '사랑하는~'],
      [10, '별명'],
    ]

    diceText, = roll(1, 10)
    output = get_table_by_number(diceText, table)

    return output, diceText
  end
end
