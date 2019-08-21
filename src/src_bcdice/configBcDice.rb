# -*- coding: utf-8 -*-

require 'kconv'
require 'configBcDiceForSystem.rb'

$isDebug = false

$bcDiceVersion = "2.03.02"

$SEND_STR_MAX = 405; # 最大送信文字数(本来は500byte上限)
$isRollVoidDiceAtAnyRecive = true; # 発言の度に空ダイスを振るか？
$DICE_MAXCNT = 200;              # ダイスが振れる最大個数
$DICE_MAXNUM = 1000;             # ダイスの最大面数
$ircCode = 6;          # IRCサーバとの通信に使うコードをRuby::Kconv値で指定
$isHandSort = true;              # 手札をソートする必要があるか？
$quitCommand = 'お疲れ様';           # 終了用のTalkコマンド
$quitMessage = 'さようなら'; # 終了時のメッセージ
$OPEN_DICE = 'Open Dice!';       # シークレットダイスの出目表示コマンド
$OPEN_PLOT = 'Open Plot!';       # プロットの表示コマンド
$ADD_PLOT = 'PLOT';              # プロットの入力コマンド
$READY_CMD = '#HERE';            # 自分の居るチャンネルの宣言コマンド

# $server = "localhost";            # サーバー
$server = "irc.trpg.net";           # サーバー
$port = 6667;                       # ポート番号
$defaultLoginChannelsText = "#Dice_Test"; # ボットが最初に参加するチャンネル名
$nick = "bcDICE"
$userName = "v" + $bcDiceVersion # ユーザー名
$ircName = "rubydice";              # IRCネーム
$defaultGameType = ""               # デフォルトゲームタイプ
$extraCardFileName = "" # 拡張カードファイル名

$iniFileName = 'bcdice.ini'

$allGameTypes = %w{
AceKillerGene
Airgetlamh
Alsetto
Alshard
Alter_raise
Amadeus
Amadeus:Korean
Arianrhod
ArsMagica
Avandner
BadLife
BarnaKronika
BattleTech
BeastBindTrinity
BeginningIdol
BeginningIdol:Korean
BladeOfArcana
BlindMythos
BloodCrusade
BloodMoon
CardRanker
Chaos_Flare
Chill
Chill3
CodeLayerd
ColossalHunter
CrashWorld
Cthulhu
Cthulhu7th
Cthulhu7th:ChineseTraditional
Cthulhu7th:Korean
Cthulhu:ChineseTraditional
Cthulhu:Korean
CthulhuTech
DarkBlaze
DarkDaysDrive
DarkSouls
DeadlineHeroes
DemonParasite
DetatokoSaga
DetatokoSaga:Korean
DiceOfTheDead
DoubleCross
Dracurouge
Dracurouge:Korean
DungeonsAndDoragons
EarthDawn
EarthDawn3
EarthDawn4
EclipsePhase
Elric!
Elysion
EmbryoMachine
EndBreaker
EtrianOdysseySRS
FilledWith
FullMetalPanic
FutariSousa
GURPS
Garako
GardenOrder
GehennaAn
GeishaGirlwithKatana
GoldenSkyStories
Gorilla
GranCrest
Gundog
GundogRevised
GundogZero
GurpsFW
HarnMaster
HatsuneMiku
Hieizan
HouraiGakuen
HuntersMoon
Illusio
InfiniteFantasia
Insane
Insane:Korean
IthaWenUa
JamesBond
Kamigakari
Kamigakari:Korean
KanColle
KillDeathBusiness
KillDeathBusiness:Korean
KurayamiCrying
LiveraDoll
LogHorizon
LogHorizon:Korean
LostRoyal
MagicaLogia
MeikyuDays
MeikyuKingdom
MetalHead
MetalHeadExtream
MetallicGuadian
MonotoneMusium
MonotoneMusium:Korean
NJSLYRBATTLE
Nechronica
Nechronica:Korean
NightWizard
NightWizard3rd
NightmareHunterDeep
Nuekagami
OneWayHeroics
OrgaRain
Oukahoushin3rd
Paranoia
ParasiteBlood
Pathfinder
Peekaboo
Pendragon
PhantasmAdventure
Postman
Raisondetre
RecordOfSteam
RokumonSekai2
RoleMaster
RuneQuest
Ryutama
SMTKakuseihen
SRS
Satasupe
SevenFortressMobius
ShadowRun
ShadowRun4
SharedFantasia
ShinkuuGakuen
ShinobiGami
ShoujoTenrankai
Skynauts
StellarKnights
StrangerOfSwordCity
StratoShout
Strave
SwordWorld
SwordWorld2.0
SwordWorld2.5
TORG
TORG1.5
TherapieSein
TokumeiTenkousei
TokyoGhostResearch
TokyoNova
TrinitySeven
Tunnels_&_Trolls
TwilightGunsmoke
Utakaze
WARPS
WaresBlade
Warhammer
WitchQuest
WorldOfDarkness
YankeeYogSothoth
ZettaiReido
}
