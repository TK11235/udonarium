# -*- coding: utf-8 -*-

dodontof_root = File.expand_path('..', File.dirname(__FILE__))
unless $LOAD_PATH.include?(dodontof_root)
  $LOAD_PATH.unshift(dodontof_root)
end

require 'test/unit'
require 'bcdiceCore'
require 'diceBot/DiceBotLoader'

class TestDiceBotLoaders < Test::Unit::TestCase
  def setup
    $isDebug = false

    @bcDice = BCDiceMaker.new.newBcDice
  end

  def test_None
    assertDiceBot('DiceBot', 'None')
  end

  def test_Cthulhu
    assertDiceBot('Cthulhu', 'Cthulhu')
    assertDiceBot('Cthulhu', 'COC')
  end

  def test_Hieizan
    assertDiceBot('Hieizan', 'Hieizan')
    assertDiceBot('Hieizan', 'COCH')
  end

  def test_Elric
    assertDiceBot('Elric!', 'Elric!')
    assertDiceBot('Elric!', 'EL')
  end

  def test_RuneQuest
    assertDiceBot('RuneQuest', 'RuneQuest')
    assertDiceBot('RuneQuest', 'RQ')
  end

  def test_Chill
    assertDiceBot('Chill', 'Chill')
    assertDiceBot('Chill', 'CH')
  end

  def test_RoleMaster
    assertDiceBot('RoleMaster', 'RoleMaster')
    assertDiceBot('RoleMaster', 'RM')
  end

  def test_ShadowRun
    assertDiceBot('ShadowRun', 'ShadowRun')
    assertDiceBot('ShadowRun', 'SR')
  end

  def test_ShadowRun4
    assertDiceBot('ShadowRun4', 'ShadowRun4')
    assertDiceBot('ShadowRun4', 'SR4')
  end

  def test_Pendragon
    assertDiceBot('Pendragon', 'Pendragon')
    assertDiceBot('Pendragon', 'PD')
  end

  def test_SwordWorld2_0
    assertDiceBot('SwordWorld2.0', 'SwordWorld 2.0')
    assertDiceBot('SwordWorld2.0', 'SwordWorld2.0')
    assertDiceBot('SwordWorld2.0', 'SW 2.0')
    assertDiceBot('SwordWorld2.0', 'SW2.0')
  end

  def test_SwordWorld
    assertDiceBot('SwordWorld', 'SwordWorld')
    assertDiceBot('SwordWorld', 'SW')
  end

  def test_Arianrhod
    assertDiceBot('Arianrhod', 'Arianrhod')
    assertDiceBot('Arianrhod', 'AR')
  end

  def test_InfiniteFantasia
    assertDiceBot('InfiniteFantasia', 'Infinite Fantasia')
    assertDiceBot('InfiniteFantasia', 'InfiniteFantasia')
    assertDiceBot('InfiniteFantasia', 'IF')
  end

  def test_WARPS
    assertDiceBot('WARPS', 'WARPS')
  end

  def test_DemonParasite
    assertDiceBot('DemonParasite', 'Demon Parasite')
    assertDiceBot('DemonParasite', 'DemonParasite')
    assertDiceBot('DemonParasite', 'DP')
  end

  def test_ParasiteBlood
    assertDiceBot('ParasiteBlood', 'Parasite Blood')
    assertDiceBot('ParasiteBlood', 'ParasiteBlood')
    assertDiceBot('ParasiteBlood', 'PB')
  end

  def test_Gundog
    assertDiceBot('Gundog', 'Gun Dog')
    assertDiceBot('Gundog', 'GunDog')
    assertDiceBot('Gundog', 'GD')
  end

  def test_GundogZero
    assertDiceBot('GundogZero', 'Gun Dog Zero')
    assertDiceBot('GundogZero', 'Gun DogZero')
    assertDiceBot('GundogZero', 'GunDog Zero')
    assertDiceBot('GundogZero', 'GunDogZero')
    assertDiceBot('GundogZero', 'GDZ')
  end

  def test_TunnelsAndTrolls
    assertDiceBot('Tunnels & Trolls', 'Tunnels & Trolls')
    assertDiceBot('Tunnels & Trolls', 'Tunnels &Trolls')
    assertDiceBot('Tunnels & Trolls', 'Tunnels& Trolls')
    assertDiceBot('Tunnels & Trolls', 'Tunnels&Trolls')
    assertDiceBot('Tunnels & Trolls', 'TuT')
  end

  def test_NightmareHunterDeep
    assertDiceBot('NightmareHunterDeep', 'Nightmare Hunter=Deep')
    assertDiceBot('NightmareHunterDeep', 'Nightmare Hunter Deep')
    assertDiceBot('NightmareHunterDeep', 'Nightmare HunterDeep')
    assertDiceBot('NightmareHunterDeep', 'NightmareHunter=Deep')
    assertDiceBot('NightmareHunterDeep', 'NightmareHunter Deep')
    assertDiceBot('NightmareHunterDeep', 'NightmareHunterDeep')
    assertDiceBot('NightmareHunterDeep', 'NHD')
  end

  def test_Warhammer
    assertDiceBot('Warhammer', 'War HammerFRP')
    assertDiceBot('Warhammer', 'War Hammer')
    assertDiceBot('Warhammer', 'WarHammerFRP')
    assertDiceBot('Warhammer', 'WarHammer')
    assertDiceBot('Warhammer', 'WH')
  end

  def test_PhantasmAdventure
    assertDiceBot('PhantasmAdventure', 'Phantasm Adventure')
    assertDiceBot('PhantasmAdventure', 'PhantasmAdventure')
    assertDiceBot('PhantasmAdventure', 'PA')
  end

  def test_ChaosFlare
    assertDiceBot('Chaos Flare', 'Chaos Flare')
    assertDiceBot('Chaos Flare', 'ChaosFlare')
    assertDiceBot('Chaos Flare', 'CF')
  end

  def test_ChaosFlare_cards
    assertDiceBot('Chaos Flare', 'Chaos Flare')

    cardTrader = @bcDice.cardTrader
    assert_equal(2, cardTrader.numOfDecks)
    assert_equal(2, cardTrader.numOfJokers)
    assert_equal(0, cardTrader.card_place)
    assert_equal(false, cardTrader.canTapCard)
  end

  def test_CthulhuTech
    assertDiceBot('CthulhuTech', 'Cthulhu Tech')
    assertDiceBot('CthulhuTech', 'CthulhuTech')
    assertDiceBot('CthulhuTech', 'CT')
  end

  def test_TokumeiTenkousei
    assertDiceBot('TokumeiTenkousei', 'Tokumei Tenkousei')
    assertDiceBot('TokumeiTenkousei', 'TokumeiTenkousei')
    assertDiceBot('TokumeiTenkousei', 'ToT')
  end

  def test_ShinobiGami
    assertDiceBot('ShinobiGami', 'Shinobi Gami')
    assertDiceBot('ShinobiGami', 'ShinobiGami')
    assertDiceBot('ShinobiGami', 'SG')
  end

  def test_DoubleCross
    assertDiceBot('DoubleCross', 'Double Cross')
    assertDiceBot('DoubleCross', 'DoubleCross')
    assertDiceBot('DoubleCross', 'DX')
  end

  def test_Satasupe
    assertDiceBot('Satasupe', 'Sata Supe')
    assertDiceBot('Satasupe', 'SataSupe')
    assertDiceBot('Satasupe', 'SS')
  end

  def test_ArsMagica
    assertDiceBot('ArsMagica', 'Ars Magica')
    assertDiceBot('ArsMagica', 'ArsMagica')
    assertDiceBot('ArsMagica', 'AM')
  end

  def test_DarkBlaze
    assertDiceBot('DarkBlaze', 'Dark Blaze')
    assertDiceBot('DarkBlaze', 'DarkBlaze')
    assertDiceBot('DarkBlaze', 'DB')
  end

  def test_NightWizard
    assertDiceBot('NightWizard', 'Night Wizard')
    assertDiceBot('NightWizard', 'NightWizard')
    assertDiceBot('NightWizard', 'NW')
  end

  def test_Torg
    assertDiceBot('TORG', 'TORG')
  end

  def test_Torg1_5
    assertDiceBot('TORG1.5', 'TORG1.5')
  end

  def test_HuntersMoon
    assertDiceBot('HuntersMoon', 'Hunters Moon')
    assertDiceBot('HuntersMoon', 'HuntersMoon')
    assertDiceBot('HuntersMoon', 'HM')
  end

  def test_BloodCrusade
    assertDiceBot('BloodCrusade', 'Blood Crusade')
    assertDiceBot('BloodCrusade', 'BloodCrusade')
    assertDiceBot('BloodCrusade', 'BC')
  end

  def test_MeikyuKingdom
    assertDiceBot('MeikyuKingdom', 'Meikyu Kingdom')
    assertDiceBot('MeikyuKingdom', 'MeikyuKingdom')
    assertDiceBot('MeikyuKingdom', 'MK')
  end

  def test_EarthDawn
    assertDiceBot('EarthDawn', 'Earth Dawn')
    assertDiceBot('EarthDawn', 'EarthDawn')
    assertDiceBot('EarthDawn', 'ED')
  end

  def test_EarthDawn3
    assertDiceBot('EarthDawn3', 'Earth Dawn3')
    assertDiceBot('EarthDawn3', 'EarthDawn3')
    assertDiceBot('EarthDawn3', 'ED3')
  end

  def test_EarthDawn4
    assertDiceBot('EarthDawn4', 'Earth Dawn4')
    assertDiceBot('EarthDawn4', 'EarthDawn4')
    assertDiceBot('EarthDawn4', 'ED4')
  end

  def test_EmbryoMachine
    assertDiceBot('EmbryoMachine', 'Embryo Machine')
    assertDiceBot('EmbryoMachine', 'EmbryoMachine')
    assertDiceBot('EmbryoMachine', 'EM')
  end

  def test_GehennaAn
    assertDiceBot('GehennaAn', 'Gehenna An')
    assertDiceBot('GehennaAn', 'GehennaAn')
    assertDiceBot('GehennaAn', 'GA')
  end

  def test_MagicaLogia
    assertDiceBot('MagicaLogia', 'Magica Logia')
    assertDiceBot('MagicaLogia', 'MagicaLogia')
    assertDiceBot('MagicaLogia', 'ML')
  end

  def test_Nechronica
    assertDiceBot('Nechronica', 'Nechronica')
    assertDiceBot('Nechronica', 'NC')
  end

  def test_MeikyuDays
    assertDiceBot('MeikyuDays', 'Meikyu Days')
    assertDiceBot('MeikyuDays', 'MeikyuDays')
    assertDiceBot('MeikyuDays', 'MD')
  end

  def test_Peekaboo
    assertDiceBot('Peekaboo', 'Peekaboo')
    assertDiceBot('Peekaboo', 'PK')
  end

  def test_BarnaKronika
    assertDiceBot('BarnaKronika', 'Barna Kronika')
    assertDiceBot('BarnaKronika', 'BarnaKronika')
    assertDiceBot('BarnaKronika', 'BK')
  end

  def test_BarnaKronika_cards
    assertDiceBot('BarnaKronika', 'Barna Kronika')

    cardTrader = @bcDice.cardTrader
    assert_equal(1, cardTrader.numOfDecks)
    assert_equal(2, cardTrader.numOfJokers)
    assert_equal(0, cardTrader.card_place)
    assert_equal(false, cardTrader.canTapCard)
  end

  def test_RokumonSekai2
    assertDiceBot('RokumonSekai2', 'RokumonSekai2')
    assertDiceBot('RokumonSekai2', 'RS2')
  end

  def test_MonotoneMusium
    assertDiceBot('MonotoneMusium', 'Monotone Musium')
    assertDiceBot('MonotoneMusium', 'MonotoneMusium')
    assertDiceBot('MonotoneMusium', 'MM')
  end

  def test_ZettaiReido
    assertDiceBot('ZettaiReido', 'Zettai Reido')
    assertDiceBot('ZettaiReido', 'ZettaiReido')
  end

  def test_EclipsePhase
    assertDiceBot('EclipsePhase', 'EclipsePhase')
  end

  def test_NjslyrBattle
    assertDiceBot('NJSLYRBATTLE', 'NJSLYRBATTLE')
  end

  def test_ShinMegamiTenseiKakuseihen
    assertDiceBot('SMTKakuseihen', 'ShinMegamiTenseiKakuseihen')
    assertDiceBot('SMTKakuseihen', 'SMTKakuseihen')
  end

  def test_Ryutama
    assertDiceBot('Ryutama', 'Ryutama')
  end

  def test_CardRanker
    assertDiceBot('CardRanker', 'CardRanker')
  end

  def test_ShinkuuGakuen
    assertDiceBot('ShinkuuGakuen', 'ShinkuuGakuen')
  end

  def test_CrashWorld
    assertDiceBot('CrashWorld', 'CrashWorld')
  end

  def test_WitchQuest
    assertDiceBot('WitchQuest', 'WitchQuest')
  end

  def test_BattleTech
    assertDiceBot('BattleTech', 'BattleTech')
  end

  def test_Elysion
    assertDiceBot('Elysion', 'Elysion')
  end

  def test_GeishaGirlwithKatana
    assertDiceBot('GeishaGirlwithKatana', 'GeishaGirlwithKatana')
  end

  def test_Gurps
    assertDiceBot('GURPS', 'GURPS')
  end

  def test_GurpsFW
    assertDiceBot('GurpsFW', 'GurpsFW')
  end

  def test_FilledWith
    assertDiceBot('FilledWith', 'FilledWith')
  end

  def test_HarnMaster
    assertDiceBot('HarnMaster', 'HarnMaster')
  end

  def test_Insane
    assertDiceBot('Insane', 'Insane')
  end

  def test_KillDeathBusiness
    assertDiceBot('KillDeathBusiness', 'KillDeathBusiness')
  end

  def test_Kamigakari
    assertDiceBot('Kamigakari', 'Kamigakari')
  end

  def test_RecordOfSteam
    assertDiceBot('RecordOfSteam', 'RecordOfSteam')
  end

  def test_Oukahoushin3rd
    assertDiceBot('Oukahoushin3rd', 'Oukahoushin3rd')
  end

  def test_BeastBindTrinity
    assertDiceBot('BeastBindTrinity', 'BeastBindTrinity')
  end

  def test_BloodMoon
    assertDiceBot('BloodMoon', 'BloodMoon')
  end

  def test_Utakaze
    assertDiceBot('Utakaze', 'Utakaze')
  end

  def test_EndBreaker
    assertDiceBot('EndBreaker', 'EndBreaker')
  end

  def test_KanColle
    assertDiceBot('KanColle', 'KanColle')
  end

  def test_GranCrest
    assertDiceBot('GranCrest', 'GranCrest')
  end

  def test_HouraiGakuen
    assertDiceBot('HouraiGakuen', 'HouraiGakuen')
  end

  def test_TwilightGunsmoke
    assertDiceBot('TwilightGunsmoke', 'TwilightGunsmoke')
  end

  def test_Garako
    assertDiceBot('Garako', 'Garako')
  end

  def test_ShoujoTenrankai
    assertDiceBot('ShoujoTenrankai', 'ShoujoTenrankai')
  end

  def test_GardenOrder
    assertDiceBot('GardenOrder', 'GardenOrder')
  end

  private

  def assertDiceBot(gameType, pattern)
    loader = DiceBotLoaderList.find(pattern)
    assert(loader, '読み込み処理が見つかる')

    loaderDowncase = DiceBotLoaderList.find(pattern.downcase)
    assert_same(loader, loaderDowncase,
                '小文字指定で読み込み処理が見つかる')

    diceBot = loader.loadDiceBot
    assert_equal(gameType, diceBot.gameType,
                 'loaderで読み込んだダイスボットのゲームタイプが等しい')

    @bcDice.setGameByTitle(pattern)
    assert_equal(gameType, @bcDice.getGameType,
                 'setGameByTitle後のゲームタイプが等しい')

    @bcDice.setGameByTitle(pattern.downcase)
    assert_equal(gameType, @bcDice.getGameType,
                 '小文字を指定したsetGameByTitle後のゲームタイプが等しい')
  end
end
