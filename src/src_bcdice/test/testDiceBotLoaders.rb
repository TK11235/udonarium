# -*- coding: utf-8 -*-

dodontof_root = File.expand_path('..', File.dirname(__FILE__))
unless $:.include?(dodontof_root)
  $:.unshift(dodontof_root)
end

require 'test/unit'
require 'bcdiceCore'
require 'diceBot/DiceBotLoader'
require 'diceBot/DiceBotLoaderList'

# ダイスボット読み込みのテスト
#
# 1. ゲームシステムの識別子が有効かを調べるテストケース
# 2. 特定の名前のダイスボットの読み込み禁止を確認するテストケース
# 3. 複数の名前で読み込めるダイスボットの読み込みを確認するテストケース
# 4. ダイスボットファイルを置いただけで読み込めることを確認するテストケース
class TestDiceBotLoaders < Test::Unit::TestCase
  # ダイスボットのディレクトリ
  DICE_BOT_DIR = File.expand_path('../diceBot', File.dirname(__FILE__))

  def setup
    $isDebug = false

    @bcDice = BCDiceMaker.new.newBcDice
  end

  #--
  # 1. ゲームシステムの識別子が有効かを調べるテストケース
  #++

  # 「Cthulhu」という識別子は有効
  def test_id_Cthulhu_should_be_valid
    assert(DiceBotLoader.validGameType?('Cthulhu'))
  end

  # 「Cthulhu7th」という識別子は有効
  def test_id_Cthulhu7th_should_be_valid
    assert(DiceBotLoader.validGameType?('Cthulhu7th'))
  end

  # 「Cthulhu7th_Korean」という識別子は有効
  def test_id_Cthulhu7th_Korean_should_be_valid
    assert(DiceBotLoader.validGameType?('Cthulhu7th_Korean'))
  end

  # 「_Template」という識別子は無効
  def test_id_Template_should_be_invalid
    assert(!DiceBotLoader.validGameType?('_Template'))
  end

  # 「test」という識別子は無効
  def test_id_test_should_be_invalid
    assert(!DiceBotLoader.validGameType?('test'))
  end

  #--
  # 2. 特定の名前のダイスボットの読み込み禁止を確認するテストケース
  #++

  # 存在しないダイスボットを読み込まない
  def test_shouldNotLoadDiceBotNotFound
    assertDiceBotNotFound('NotFound')
  end

  # 「DiceBot」という名前のダイスボットを読み込まない
  def test_shouldNotLoadDiceBotNamedDiceBot
    assertDiceBotIgnored('DiceBot')
  end

  # 「DiceBotLoader」という名前のダイスボットを読み込まない
  def test_shouldNotLoadDiceBotNamedDiceBotLoader
    assertDiceBotIgnored('DiceBotLoader')
  end

  # 「DiceBotLoaderList」という名前のダイスボットを読み込まない
  def test_shouldNotLoadDiceBotNamedDiceBotLoaderList
    assertDiceBotIgnored('DiceBotLoaderList')
  end

  # 「_Template」という名前のダイスボットを読み込まない
  def test_shouldNotLoadDiceBotNamed_Template
    assertDiceBotIgnored('_Template')
  end

  #--
  # 3. 複数の名前で読み込めるダイスボットの読み込みを確認するテストケース
  #++

  def test_None
    assertDiceBotWithLoader('DiceBot', 'None')
  end

  def test_Cthulhu
    assertDiceBotWithLoader('Cthulhu', 'Cthulhu')
    assertDiceBotWithLoader('Cthulhu', 'COC')
  end

  def test_Hieizan
    assertDiceBotWithLoader('Hieizan', 'Hieizan')
    assertDiceBotWithLoader('Hieizan', 'COCH')
  end

  def test_Elric
    assertDiceBotWithLoader('Elric', 'Elric')
    assertDiceBotWithLoader('Elric', 'EL')
  end

  def test_RuneQuest
    assertDiceBotWithLoader('RuneQuest', 'RuneQuest')
    assertDiceBotWithLoader('RuneQuest', 'RQ')
  end

  def test_Chill
    assertDiceBotWithLoader('Chill', 'Chill')
    assertDiceBotWithLoader('Chill', 'CH')
  end

  def test_RoleMaster
    assertDiceBotWithLoader('RoleMaster', 'RoleMaster')
    assertDiceBotWithLoader('RoleMaster', 'RM')
  end

  def test_ShadowRun
    assertDiceBotWithLoader('ShadowRun', 'ShadowRun')
    assertDiceBotWithLoader('ShadowRun', 'SR')
  end

  def test_ShadowRun4
    assertDiceBotWithLoader('ShadowRun4', 'ShadowRun4')
    assertDiceBotWithLoader('ShadowRun4', 'SR4')
  end

  def test_Pendragon
    assertDiceBotWithLoader('Pendragon', 'Pendragon')
    assertDiceBotWithLoader('Pendragon', 'PD')
  end

  def test_SwordWorld2_0
    assertDiceBotWithLoader('SwordWorld2.0', 'SwordWorld 2.0')
    assertDiceBotWithLoader('SwordWorld2.0', 'SwordWorld2.0')
    assertDiceBotWithLoader('SwordWorld2.0', 'SW 2.0')
    assertDiceBotWithLoader('SwordWorld2.0', 'SW2.0')
  end

  def test_SwordWorld
    assertDiceBotWithLoader('SwordWorld', 'SwordWorld')
    assertDiceBotWithLoader('SwordWorld', 'SW')
  end

  def test_Arianrhod
    assertDiceBotWithLoader('Arianrhod', 'Arianrhod')
    assertDiceBotWithLoader('Arianrhod', 'AR')
  end

  def test_InfiniteFantasia
    assertDiceBotWithLoader('InfiniteFantasia', 'Infinite Fantasia')
    assertDiceBotWithLoader('InfiniteFantasia', 'InfiniteFantasia')
    assertDiceBotWithLoader('InfiniteFantasia', 'IF')
  end

  def test_WARPS
    assertDiceBotWithLoader('WARPS', 'WARPS')
  end

  def test_DemonParasite
    assertDiceBotWithLoader('DemonParasite', 'Demon Parasite')
    assertDiceBotWithLoader('DemonParasite', 'DemonParasite')
    assertDiceBotWithLoader('DemonParasite', 'DP')
  end

  def test_ParasiteBlood
    assertDiceBotWithLoader('ParasiteBlood', 'Parasite Blood')
    assertDiceBotWithLoader('ParasiteBlood', 'ParasiteBlood')
    assertDiceBotWithLoader('ParasiteBlood', 'PB')
  end

  def test_Gundog
    assertDiceBotWithLoader('Gundog', 'Gun Dog')
    assertDiceBotWithLoader('Gundog', 'GunDog')
    assertDiceBotWithLoader('Gundog', 'GD')
  end

  def test_GundogZero
    assertDiceBotWithLoader('GundogZero', 'Gun Dog Zero')
    assertDiceBotWithLoader('GundogZero', 'Gun DogZero')
    assertDiceBotWithLoader('GundogZero', 'GunDog Zero')
    assertDiceBotWithLoader('GundogZero', 'GunDogZero')
    assertDiceBotWithLoader('GundogZero', 'GDZ')
  end

  def test_TunnelsAndTrolls
    assertDiceBotWithLoader('TunnelsAndTrolls', 'Tunnels & Trolls')
    assertDiceBotWithLoader('TunnelsAndTrolls', 'Tunnels &Trolls')
    assertDiceBotWithLoader('TunnelsAndTrolls', 'Tunnels& Trolls')
    assertDiceBotWithLoader('TunnelsAndTrolls', 'Tunnels&Trolls')
    assertDiceBotWithLoader('TunnelsAndTrolls', 'TuT')
  end

  def test_NightmareHunterDeep
    assertDiceBotWithLoader('NightmareHunterDeep', 'Nightmare Hunter=Deep')
    assertDiceBotWithLoader('NightmareHunterDeep', 'Nightmare Hunter Deep')
    assertDiceBotWithLoader('NightmareHunterDeep', 'Nightmare HunterDeep')
    assertDiceBotWithLoader('NightmareHunterDeep', 'NightmareHunter=Deep')
    assertDiceBotWithLoader('NightmareHunterDeep', 'NightmareHunter Deep')
    assertDiceBotWithLoader('NightmareHunterDeep', 'NightmareHunterDeep')
    assertDiceBotWithLoader('NightmareHunterDeep', 'NHD')
  end

  def test_Warhammer
    assertDiceBotWithLoader('Warhammer', 'War HammerFRP')
    assertDiceBotWithLoader('Warhammer', 'War Hammer')
    assertDiceBotWithLoader('Warhammer', 'WarHammerFRP')
    assertDiceBotWithLoader('Warhammer', 'WarHammer')
    assertDiceBotWithLoader('Warhammer', 'WH')
  end

  def test_PhantasmAdventure
    assertDiceBotWithLoader('PhantasmAdventure', 'Phantasm Adventure')
    assertDiceBotWithLoader('PhantasmAdventure', 'PhantasmAdventure')
    assertDiceBotWithLoader('PhantasmAdventure', 'PA')
  end

  def test_ChaosFlare
    assertDiceBotWithLoader('ChaosFlare', 'ChaosFlare')
    assertDiceBotWithLoader('ChaosFlare', 'ChaosFlare')
    assertDiceBotWithLoader('ChaosFlare', 'CF')
  end

  def test_ChaosFlare_cards
    assertDiceBotWithLoader('ChaosFlare', 'ChaosFlare')

    cardTrader = @bcDice.cardTrader
    assert_equal(2, cardTrader.numOfDecks)
    assert_equal(2, cardTrader.numOfJokers)
    assert_equal(0, cardTrader.card_place)
    assert_equal(false, cardTrader.canTapCard)
  end

  def test_CthulhuTech
    assertDiceBotWithLoader('CthulhuTech', 'Cthulhu Tech')
    assertDiceBotWithLoader('CthulhuTech', 'CthulhuTech')
    assertDiceBotWithLoader('CthulhuTech', 'CT')
  end

  def test_TokumeiTenkousei
    assertDiceBotWithLoader('TokumeiTenkousei', 'Tokumei Tenkousei')
    assertDiceBotWithLoader('TokumeiTenkousei', 'TokumeiTenkousei')
    assertDiceBotWithLoader('TokumeiTenkousei', 'ToT')
  end

  def test_ShinobiGami
    assertDiceBotWithLoader('ShinobiGami', 'Shinobi Gami')
    assertDiceBotWithLoader('ShinobiGami', 'ShinobiGami')
    assertDiceBotWithLoader('ShinobiGami', 'SG')
  end

  def test_DoubleCross
    assertDiceBotWithLoader('DoubleCross', 'Double Cross')
    assertDiceBotWithLoader('DoubleCross', 'DoubleCross')
    assertDiceBotWithLoader('DoubleCross', 'DX')
  end

  def test_Satasupe
    assertDiceBotWithLoader('Satasupe', 'Sata Supe')
    assertDiceBotWithLoader('Satasupe', 'SataSupe')
    assertDiceBotWithLoader('Satasupe', 'SS')
  end

  def test_ArsMagica
    assertDiceBotWithLoader('ArsMagica', 'Ars Magica')
    assertDiceBotWithLoader('ArsMagica', 'ArsMagica')
    assertDiceBotWithLoader('ArsMagica', 'AM')
  end

  def test_DarkBlaze
    assertDiceBotWithLoader('DarkBlaze', 'Dark Blaze')
    assertDiceBotWithLoader('DarkBlaze', 'DarkBlaze')
    assertDiceBotWithLoader('DarkBlaze', 'DB')
  end

  def test_NightWizard
    assertDiceBotWithLoader('NightWizard', 'Night Wizard')
    assertDiceBotWithLoader('NightWizard', 'NightWizard')
    assertDiceBotWithLoader('NightWizard', 'NW')
  end

  def test_Torg
    assertDiceBotWithLoader('TORG', 'TORG')
  end

  def test_Torg1_5
    assertDiceBotWithLoader('TORG1.5', 'TORG1.5')
  end

  def test_HuntersMoon
    assertDiceBotWithLoader('HuntersMoon', 'Hunters Moon')
    assertDiceBotWithLoader('HuntersMoon', 'HuntersMoon')
    assertDiceBotWithLoader('HuntersMoon', 'HM')
  end

  def test_BloodCrusade
    assertDiceBotWithLoader('BloodCrusade', 'Blood Crusade')
    assertDiceBotWithLoader('BloodCrusade', 'BloodCrusade')
    assertDiceBotWithLoader('BloodCrusade', 'BC')
  end

  def test_MeikyuKingdom
    assertDiceBotWithLoader('MeikyuKingdom', 'Meikyu Kingdom')
    assertDiceBotWithLoader('MeikyuKingdom', 'MeikyuKingdom')
    assertDiceBotWithLoader('MeikyuKingdom', 'MK')
  end

  def test_EarthDawn
    assertDiceBotWithLoader('EarthDawn', 'Earth Dawn')
    assertDiceBotWithLoader('EarthDawn', 'EarthDawn')
    assertDiceBotWithLoader('EarthDawn', 'ED')
  end

  def test_EarthDawn3
    assertDiceBotWithLoader('EarthDawn3', 'Earth Dawn3')
    assertDiceBotWithLoader('EarthDawn3', 'EarthDawn3')
    assertDiceBotWithLoader('EarthDawn3', 'ED3')
  end

  def test_EarthDawn4
    assertDiceBotWithLoader('EarthDawn4', 'Earth Dawn4')
    assertDiceBotWithLoader('EarthDawn4', 'EarthDawn4')
    assertDiceBotWithLoader('EarthDawn4', 'ED4')
  end

  def test_EmbryoMachine
    assertDiceBotWithLoader('EmbryoMachine', 'Embryo Machine')
    assertDiceBotWithLoader('EmbryoMachine', 'EmbryoMachine')
    assertDiceBotWithLoader('EmbryoMachine', 'EM')
  end

  def test_GehennaAn
    assertDiceBotWithLoader('GehennaAn', 'Gehenna An')
    assertDiceBotWithLoader('GehennaAn', 'GehennaAn')
    assertDiceBotWithLoader('GehennaAn', 'GA')
  end

  def test_MagicaLogia
    assertDiceBotWithLoader('MagicaLogia', 'Magica Logia')
    assertDiceBotWithLoader('MagicaLogia', 'MagicaLogia')
    assertDiceBotWithLoader('MagicaLogia', 'ML')
  end

  def test_Nechronica
    assertDiceBotWithLoader('Nechronica', 'Nechronica')
    assertDiceBotWithLoader('Nechronica', 'NC')
  end

  def test_MeikyuDays
    assertDiceBotWithLoader('MeikyuDays', 'Meikyu Days')
    assertDiceBotWithLoader('MeikyuDays', 'MeikyuDays')
    assertDiceBotWithLoader('MeikyuDays', 'MD')
  end

  def test_Peekaboo
    assertDiceBotWithLoader('Peekaboo', 'Peekaboo')
    assertDiceBotWithLoader('Peekaboo', 'PK')
  end

  def test_BarnaKronika
    assertDiceBotWithLoader('BarnaKronika', 'Barna Kronika')
    assertDiceBotWithLoader('BarnaKronika', 'BarnaKronika')
    assertDiceBotWithLoader('BarnaKronika', 'BK')
  end

  def test_BarnaKronika_cards
    assertDiceBotWithLoader('BarnaKronika', 'Barna Kronika')

    cardTrader = @bcDice.cardTrader
    assert_equal(1, cardTrader.numOfDecks)
    assert_equal(2, cardTrader.numOfJokers)
    assert_equal(0, cardTrader.card_place)
    assert_equal(false, cardTrader.canTapCard)
  end

  def test_RokumonSekai2
    assertDiceBotWithLoader('RokumonSekai2', 'RokumonSekai2')
    assertDiceBotWithLoader('RokumonSekai2', 'RS2')
  end

  def test_MonotoneMuseum
    assertDiceBotWithLoader('MonotoneMuseum', 'Monotone Museum')
    assertDiceBotWithLoader('MonotoneMuseum', 'MonotoneMuseum')
    assertDiceBotWithLoader('MonotoneMuseum', 'MM')
  end

  def test_ZettaiReido
    assertDiceBotWithLoader('ZettaiReido', 'Zettai Reido')
    assertDiceBotWithLoader('ZettaiReido', 'ZettaiReido')
  end

  def test_EclipsePhase
    assertDiceBotWithLoader('EclipsePhase', 'EclipsePhase')
  end

  def test_NjslyrBattle
    assertDiceBotWithLoader('NJSLYRBATTLE', 'NJSLYRBATTLE')
  end

  def test_ShinMegamiTenseiKakuseihen
    assertDiceBotWithLoader('SMTKakuseihen', 'ShinMegamiTenseiKakuseihen')
    assertDiceBotWithLoader('SMTKakuseihen', 'SMTKakuseihen')
  end

  def test_Ryutama
    assertDiceBotWithLoader('Ryutama', 'Ryutama')
  end

  def test_CardRanker
    assertDiceBotWithLoader('CardRanker', 'CardRanker')
  end

  def test_ShinkuuGakuen
    assertDiceBotWithLoader('ShinkuuGakuen', 'ShinkuuGakuen')
  end

  def test_CrashWorld
    assertDiceBotWithLoader('CrashWorld', 'CrashWorld')
  end

  def test_WitchQuest
    assertDiceBotWithLoader('WitchQuest', 'WitchQuest')
  end

  def test_BattleTech
    assertDiceBotWithLoader('BattleTech', 'BattleTech')
  end

  def test_Elysion
    assertDiceBotWithLoader('Elysion', 'Elysion')
  end

  def test_GeishaGirlwithKatana
    assertDiceBotWithLoader('GeishaGirlwithKatana', 'GeishaGirlwithKatana')
  end

  def test_Gurps
    assertDiceBotWithLoader('GURPS', 'GURPS')
  end

  def test_GurpsFW
    assertDiceBotWithLoader('GurpsFW', 'GurpsFW')
  end

  def test_FilledWith
    assertDiceBotWithLoader('FilledWith', 'FilledWith')
  end

  def test_HarnMaster
    assertDiceBotWithLoader('HarnMaster', 'HarnMaster')
  end

  def test_Insane
    assertDiceBotWithLoader('Insane', 'Insane')
  end

  def test_KillDeathBusiness
    assertDiceBotWithLoader('KillDeathBusiness', 'KillDeathBusiness')
  end

  def test_Kamigakari
    assertDiceBotWithLoader('Kamigakari', 'Kamigakari')
  end

  def test_RecordOfSteam
    assertDiceBotWithLoader('RecordOfSteam', 'RecordOfSteam')
  end

  def test_Oukahoushin3rd
    assertDiceBotWithLoader('Oukahoushin3rd', 'Oukahoushin3rd')
  end

  def test_BeastBindTrinity
    assertDiceBotWithLoader('BeastBindTrinity', 'BeastBindTrinity')
  end

  def test_BloodMoon
    assertDiceBotWithLoader('BloodMoon', 'BloodMoon')
  end

  def test_Utakaze
    assertDiceBotWithLoader('Utakaze', 'Utakaze')
  end

  def test_EndBreaker
    assertDiceBotWithLoader('EndBreaker', 'EndBreaker')
  end

  def test_KanColle
    assertDiceBotWithLoader('KanColle', 'KanColle')
  end

  def test_GranCrest
    assertDiceBotWithLoader('GranCrest', 'GranCrest')
  end

  def test_HouraiGakuen
    assertDiceBotWithLoader('HouraiGakuen', 'HouraiGakuen')
  end

  def test_TwilightGunsmoke
    assertDiceBotWithLoader('TwilightGunsmoke', 'TwilightGunsmoke')
  end

  def test_Garako
    assertDiceBotWithLoader('Garako', 'Garako')
  end

  def test_ShoujoTenrankai
    assertDiceBotWithLoader('ShoujoTenrankai', 'ShoujoTenrankai')
  end

  def test_GardenOrder
    assertDiceBotWithLoader('GardenOrder', 'GardenOrder')
  end

  def test_DarkSouls
    assertDiceBotWithLoader('DarkSouls', 'DarkSouls')
  end

  #--
  # 4. ダイスボットファイルを置いただけで読み込めることを確認するテストケース
  #++

  def test_AceKillerGene
    assertDiceBotWithoutLoader('AceKillerGene')
  end

  def test_Airgetlamh
    assertDiceBotWithoutLoader('Airgetlamh')
  end

  def test_Alsetto
    assertDiceBotWithoutLoader('Alsetto')
  end

  def test_Alshard
    assertDiceBotWithoutLoader('Alshard')
  end

  def test_Amadeus
    assertDiceBotWithoutLoader('Amadeus')
  end

  def test_Amadeus_Korean
    assertDiceBotWithoutLoader('Amadeus:Korean', 'Amadeus_Korean')
  end

  def test_Avandner
    assertDiceBotWithoutLoader('Avandner')
  end

  def test_BadLife
    assertDiceBotWithoutLoader('BadLife')
  end

  def test_BeginningIdol
    assertDiceBotWithoutLoader('BeginningIdol')
  end

  def test_BeginningIdol_Korean
    assertDiceBotWithoutLoader('BeginningIdol:Korean',
                               'BeginningIdol_Korean')
  end

  def test_BladeOfArcana
    assertDiceBotWithoutLoader('BladeOfArcana')
  end

  def test_BlindMythos
    assertDiceBotWithoutLoader('BlindMythos')
  end

  def test_Chill3
    assertDiceBotWithoutLoader('Chill3')
  end

  def test_CodeLayerd
    assertDiceBotWithoutLoader('CodeLayerd')
  end

  def test_ColossalHunter
    assertDiceBotWithoutLoader('ColossalHunter')
  end

  def test_Cthulhu7th
    assertDiceBotWithoutLoader('Cthulhu7th')
  end

  def test_Cthulhu7th_ChineseTraditional
    assertDiceBotWithoutLoader('Cthulhu7th:ChineseTraditional',
                               'Cthulhu7th_ChineseTraditional')
  end

  def test_Cthulhu7th_Korean
    assertDiceBotWithoutLoader('Cthulhu7th:Korean', 'Cthulhu7th_Korean')
  end

  def test_Cthulhu_ChineseTraditional
    assertDiceBotWithoutLoader('Cthulhu:ChineseTraditional',
                               'Cthulhu_ChineseTraditional')
  end

  def test_Cthulhu_Korean
    assertDiceBotWithoutLoader('Cthulhu:Korean', 'Cthulhu_Korean')
  end

  def test_DarkDaysDrive
    assertDiceBotWithoutLoader('DarkDaysDrive')
  end

  def test_DeadlineHeroes
    assertDiceBotWithoutLoader('DeadlineHeroes')
  end

  def test_DetatokoSaga
    assertDiceBotWithoutLoader('DetatokoSaga')
  end

  def test_DetatokoSaga_Korean
    assertDiceBotWithoutLoader('DetatokoSaga:Korean', 'DetatokoSaga_Korean')
  end

  def test_DiceOfTheDead
    assertDiceBotWithoutLoader('DiceOfTheDead')
  end

  def test_Dracurouge
    assertDiceBotWithoutLoader('Dracurouge')
  end

  def test_Dracurouge_Korean
    assertDiceBotWithoutLoader('Dracurouge:Korean', 'Dracurouge_Korean')
  end

  def test_DungeonsAndDragons
    assertDiceBotWithoutLoader('DungeonsAndDragons')
  end

  def test_EtrianOdysseySRS
    assertDiceBotWithoutLoader('EtrianOdysseySRS')
  end

  def test_FullMetalPanic
    assertDiceBotWithoutLoader('FullMetalPanic')
  end

  def test_GoldenSkyStories
    assertDiceBotWithoutLoader('GoldenSkyStories')
  end

  def test_Gorilla
    assertDiceBotWithoutLoader('Gorilla')
  end

  def test_GundogRevised
    assertDiceBotWithoutLoader('GundogRevised')
  end

  def test_HatsuneMiku
    assertDiceBotWithoutLoader('HatsuneMiku')
  end

  def test_Insane_Korean
    assertDiceBotWithoutLoader('Insane:Korean', 'Insane_Korean')
  end

  def test_IthaWenUa
    assertDiceBotWithoutLoader('IthaWenUa')
  end

  def test_JamesBond
    assertDiceBotWithoutLoader('JamesBond')
  end

  def test_Kamigakari_Korean
    assertDiceBotWithoutLoader('Kamigakari:Korean', 'Kamigakari_Korean')
  end

  def test_KemonoNoMori
    assertDiceBotWithoutLoader('KemonoNoMori')
  end

  def test_KillDeathBusiness_Korean
    assertDiceBotWithoutLoader('KillDeathBusiness:Korean',
                               'KillDeathBusiness_Korean')
  end

  def test_LiveraDoll
    assertDiceBotWithoutLoader('LiveraDoll')
  end

  def test_LogHorizon
    assertDiceBotWithoutLoader('LogHorizon')
  end

  def test_LogHorizon_Korean
    assertDiceBotWithoutLoader('LogHorizon:Korean', 'LogHorizon_Korean')
  end

  def test_LostRoyal
    assertDiceBotWithoutLoader('LostRoyal')
  end

  def test_MetalHead
    assertDiceBotWithoutLoader('MetalHead')
  end

  def test_MetalHeadExtream
    assertDiceBotWithoutLoader('MetalHeadExtream')
  end

  def test_MetallicGuardian
    assertDiceBotWithoutLoader('MetallicGuardian')
  end

  def test_MonotoneMuseum_Korean
    assertDiceBotWithoutLoader('MonotoneMuseum:Korean',
                               'MonotoneMuseum_Korean')
  end

  def test_Nechronica_Korean
    assertDiceBotWithoutLoader('Nechronica:Korean', 'Nechronica_Korean')
  end

  def test_NightWizard3rd
    assertDiceBotWithoutLoader('NightWizard3rd')
  end

  def test_Nuekagami
    assertDiceBotWithoutLoader('Nuekagami')
  end

  def test_OneWayHeroics
    assertDiceBotWithoutLoader('OneWayHeroics')
  end

  def test_Paranoia
    assertDiceBotWithoutLoader('Paranoia')
  end

  def test_Pathfinder
    assertDiceBotWithoutLoader('Pathfinder')
  end

  def test_SRS
    assertDiceBotWithoutLoader('SRS')
  end

  def test_ScreamHighSchool
    assertDiceBotWithoutLoader('ScreamHighSchool')
  end

  def test_SevenFortressMobius
    assertDiceBotWithoutLoader('SevenFortressMobius')
  end

  def test_SharedFantasia
    assertDiceBotWithoutLoader('SharedFantasia')
  end

  def test_Skynauts
    assertDiceBotWithoutLoader('Skynauts')
  end

  def test_StrangerOfSwordCity
    assertDiceBotWithoutLoader('StrangerOfSwordCity')
  end

  def test_Strave
    assertDiceBotWithoutLoader('Strave')
  end

  def test_TherapieSein
    assertDiceBotWithoutLoader('TherapieSein')
  end

  def test_TokyoNova
    assertDiceBotWithoutLoader('TokyoNova')
  end

  def test_WaresBlade
    assertDiceBotWithoutLoader('WaresBlade')
  end

  def test_YankeeYogSothoth
    assertDiceBotWithoutLoader('YankeeYogSothoth')
  end

  private

  # ダイスボットが存在しないことを表明する
  # @param [String] id ゲームシステムの識別子
  # @return [void]
  def assertDiceBotNotFound(id)
    fileName = File.join(DICE_BOT_DIR, "#{id}.rb")
    assert(!File.exist?(fileName), 'ファイルが存在しない')

    assert_nil(DiceBotLoaderList.find(id),
               '読み込み処理が存在しない')
    assert_nil(DiceBotLoader.loadUnknownGame(id),
               'loadUnknownGameで読み込まれない')
  end

  # ダイスボットを読み込もうとしても無視されることを表明する
  # @param [String] id ゲームシステムの識別子
  # @return [void]
  def assertDiceBotIgnored(id)
    fileName = File.join(DICE_BOT_DIR, "#{id}.rb")
    assert(File.exist?(fileName), 'ファイルが存在する')

    assert_nil(DiceBotLoaderList.find(id),
               '読み込み処理が存在しない')
    assert_nil(DiceBotLoader.loadUnknownGame(id),
               'loadUnknownGameで読み込まれない')
  end

  # DiceBotLoaderを通じて正しいダイスボットが読み込まれることを表明する
  # @param [String] id ゲームシステムの識別子
  # @param [String] pattern 読み込む際に指定する名前
  # @return [void]
  def assertDiceBotWithLoader(id, pattern)
    loader = DiceBotLoaderList.find(pattern)
    assert(loader, '読み込み処理が見つかる')

    loaderDowncase = DiceBotLoaderList.find(pattern.downcase)
    assert_same(loader, loaderDowncase,
                '小文字指定で読み込み処理が見つかる')

    diceBot = loader.loadDiceBot
    assert_equal(id, diceBot.id,
                 'loaderで読み込んだダイスボットのゲームシステム識別子が等しい')

    @bcDice.setGameByTitle(pattern)
    assert_equal(id, @bcDice.getGameType,
                 'setGameByTitle後のダイスボットのゲームシステム識別子が等しい')

    @bcDice.setGameByTitle(pattern.downcase)
    assert_equal(id, @bcDice.getGameType,
                 '小文字を指定したsetGameByTitle後のダイスボットのゲームシステム識別子が等しい')
  end

  # DiceBotLoaderなしでも正しいダイスボットが読み込まれることを表明する
  # @param [String] id ゲームシステムの識別子
  # @param [String] pattern 読み込む際に指定する名前
  # @return [void]
  def assertDiceBotWithoutLoader(id, pattern = id)
    assert_nil(DiceBotLoaderList.find(pattern), '読み込み処理が存在しない')

    @bcDice.setGameByTitle(pattern)
    assert_equal(id, @bcDice.getGameType,
                 'setGameByTitle後のダイスボットのゲームシステム識別子が等しい')
  end
end
