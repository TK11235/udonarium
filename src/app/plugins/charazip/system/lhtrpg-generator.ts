import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter } from '../custom-character';
import { format } from 'url';
import { StringUtil } from '@udonarium/core/system/util/string-util';
import { resolveTxt } from 'dns';
import { ɵDomAdapter } from '@angular/platform-browser';

/**
 * ログ・ホライズンTRPG 冒険窓口
 * https://lhrpg.com/lhz/pc?id=161664
 */
export class LhtrpgGenerator {
  static generate(json: LhrpgCharacter): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.name,
      1,
      json.image_url.replace(/http(s)?:/, '')
    );

    /*
     *情報
     */
    const infoElement = gameCharacter.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      gameCharacter.createDataElement('PL', json.player_name)
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('CR', json.character_rank)
    );
    infoElement.appendChild(gameCharacter.createDataElement('種族', json.race));
    infoElement.appendChild(
      gameCharacter.createDataElement('メイン職業', json.main_job)
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('サブ職業', json.sub_job)
    );
    const tagsText = json.tags.map(tag => `[${tag}]`).join(' ');
    infoElement.appendChild(gameCharacter.createNoteElement('タグ', tagsText));
    infoElement.appendChild(
      gameCharacter.createNoteElement('説明', json.remarks)
    );
    infoElement.appendChild(
      gameCharacter.createNoteElement('URL', json.sheet_url)
    );
    /*
     * 戦闘値
     */
    const battleElement = gameCharacter.createDataElement('戦闘値', '');
    gameCharacter.detailDataElement.appendChild(battleElement);
    battleElement.appendChild(
      gameCharacter.createResourceElement(
        'HP',
        json.max_hitpoint,
        json.max_hitpoint
      )
    );
    battleElement.appendChild(
      gameCharacter.createResourceElement('因果力', 10, json.effect)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('行動力', json.action)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('攻撃力', json.physical_attack)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('魔力', json.magic_attack)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('回復力', json.heal_power)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('物防', json.physical_defense)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('魔防', json.magic_defense)
    );
    /*
     * 状態
     */
    const statusElement = gameCharacter.createDataElement('状態', '');
    gameCharacter.detailDataElement.appendChild(statusElement);
    statusElement.appendChild(
      gameCharacter.createResourceElement('ヘイト', 20, 0)
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement('待機', 1, 0)
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement('隠密', 1, 0)
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement('障壁', 50, 0)
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement('再生', 50, 0)
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement('疲労', 50, 0)
    );
    statusElement.appendChild(gameCharacter.createNoteElement('BS', ''));
    statusElement.appendChild(
      gameCharacter.createNoteElement('LS・CS・OS', '')
    );
    /*
     * 能力値
     */
    const abilityElement = gameCharacter.createDataElement('探索技能', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      gameCharacter.createDataElement('STR', json.str_value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('DEX', json.dex_value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('POW', json.pow_value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('INT', json.int_value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('STR基本値', json.str_basic_value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('DEX基本値', json.dex_basic_value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('POW基本値', json.pow_basic_value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('INT基本値', json.int_basic_value)
    );
    /*
     * 技能値
     */
    const skillElement = gameCharacter.createDataElement('技能値', '');
    gameCharacter.detailDataElement.appendChild(skillElement);
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '運動',
        this.convertToCommand(json.abl_motion)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '耐久',
        this.convertToCommand(json.abl_durability)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '解除',
        this.convertToCommand(json.abl_dismantle)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '操作',
        this.convertToCommand(json.abl_operate)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '知覚',
        this.convertToCommand(json.abl_sense)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '交渉',
        this.convertToCommand(json.abl_negotiate)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '知識',
        this.convertToCommand(json.abl_knowledge)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '解析',
        this.convertToCommand(json.abl_analyze)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '回避',
        this.convertToCommand(json.abl_avoid)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '抵抗',
        this.convertToCommand(json.abl_resist)
      )
    );
    skillElement.appendChild(
      gameCharacter.createDataElement(
        '命中',
        this.convertToCommand(json.abl_hit)
      )
    );
    /*
     * 装備
     */
    const equipmentElement = gameCharacter.createDataElement('装備', '');
    gameCharacter.detailDataElement.appendChild(equipmentElement);
    equipmentElement.appendChild(
      gameCharacter.createDataElement('手1', json.hand1 ? json.hand1.alias : '')
    );
    equipmentElement.appendChild(
      gameCharacter.createDataElement('手2', json.hand2 ? json.hand2.alias : '')
    );
    equipmentElement.appendChild(
      gameCharacter.createDataElement(
        '防具',
        json.armor ? json.armor.alias : ''
      )
    );
    equipmentElement.appendChild(
      gameCharacter.createDataElement(
        '補助1',
        json.support_item1 ? json.support_item1.alias : ''
      )
    );
    equipmentElement.appendChild(
      gameCharacter.createDataElement(
        '補助2',
        json.support_item2 ? json.support_item2.alias : ''
      )
    );
    equipmentElement.appendChild(
      gameCharacter.createDataElement(
        '補助3',
        json.support_item3 ? json.support_item3.alias : ''
      )
    );
    equipmentElement.appendChild(
      gameCharacter.createDataElement('鞄', json.bag ? json.bag.alias : '')
    );
    /*
     * 所持品
     */
    const itemElement = gameCharacter.createDataElement('所持品', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (let i = 1; i <= json.items.length; i++) {
      const item = json.items[i];
      itemElement.appendChild(
        gameCharacter.createDataElement(`所持品${i}`, item ? item.alias : '')
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'LogHorizon';
    // チャパレ内容
    let cp = `キャラクター名:${json.name}

○戦闘の基本
{命中} 命中値
{回避} 回避値 ヘイトトップ
{回避}+2 回避値 ヘイトアンダー
{抵値} 抵抗値 ヘイトトップ
{抵抗}+2 抵抗値 ヘイトアンダー
{攻撃力}+1D6 基本武器攻撃、物理ダメージ
{魔力}+1D6 基本魔法攻撃、魔法ダメージ

○被ダメ計算用
C(0-{物防}-0) 被ダメージ=物理ダメージ-物防-軽減
C(0-{魔防}-0) 被ダメージ=魔法ダメージ-魔防-軽減
C(({HP}+{障壁})-0-{ヘイト}*0-0) 残HP＝(HP+障壁)-ダメージ-ヘイトダメージ-その他
C(0-{HP}) 残障壁=残HP-HP
`;
    const timingList = [
      'セットアップ',
      'ムーブ',
      'マイナー',
      'メジャー',
      'イニシアチブ',
      '行動',
      'インスタント',
      '本文',
      'ダメージロール',
      'ダメージ適用直前',
      'ダメージ適用直後',
      '判定直前',
      '判定直後',
      'クリンナップ',
      'プリプレイ',
      'ブリーフィング',
      'レストタイム',
      'インタールード',
      '常時'
    ];
    for (const timing of timingList) {
      const sep = timing === 'メジャー' ? '\n' : '';
      const skills = json.skills.filter(skill => skill.timing === timing);
      if (skills.length > 0) {
        cp += `\n○${timing}\n`;
        cp += skills.map(this.formatSkill).join(sep);
      }
    }
    cp += `
○基本動作
《ラン》 [基本動作] [移動] SR:-/- タイミング:ムーブ 判定：判定なし 対象:自身 射程：至近 コスト:- 制限：- 効果：あなたは【移動力】Ｓｑまで［通常移動］をしてもよい。
《ダッシュ》 [基本動作] [移動] SR:-/- タイミング:ムーブ 判定：判定なし 対象:自身 射程：至近 コスト:- 制限：- 効果：あなたは［【移動力】＋２］Ｓｑまで［通常移動］をしてもよい。あなたは直後のマイナーアクションを１回失う。マイナーアクションを失えない場合は使用できない。
《シフト》 [基本動作] [移動] SR:-/- タイミング:ムーブ 判定：判定なし 対象:自身 射程：至近 コスト:- 制限：- 効果：あなたは１Ｓｑまで［即時移動］をしてもよい。あなたは直後のマイナーアクションを１回失う。マイナーアクションを失えない場合は使用できない。
《敵情を探る》 [基本動作] [偵察] SR:-/- タイミング:ブリーフィング 判定：基本（運動） 対象:本文 射程：本文 コスト:- 制限：- 効果：次のシーンの戦闘における敵の情報を得ようと試みる。〔達成値：１０〕登場するエネミーの数を知る。〔達成値：２０〕そのうちランクが一番低いエネミー１体（該当するエネミーが複数の場合はＧＭが選択）の名称と、［ボス］［モブ］タグの有無を知る。〔ファンブル〕エネミーは偵察に気がつく。
《基本武器攻撃》 [基本動作] [武器攻撃] SR:-/- タイミング:メジャー 判定：対決(命中/回避) 対象:単体 射程：武器 コスト:- 制限：- 効果：対象に［【攻撃力】＋１Ｄ］の物理ダメージを与える。
《基本魔法攻撃》 [基本動作] [魔法攻撃] [杖] [魔石] SR:-/- タイミング: メジャー 判定：対決(命中/抵抗) 対象:単体 射程：4Sq コスト:- 制限：- 効果：対象に［【魔力】＋１Ｄ］の魔法ダメージを与える。
《異常探知》 [基本動作] SR:-/- タイミング:セットアップ 判定：基本（知覚／探知難易度） 対象:広範囲20（無差別） 射程：至近 コスト:- 制限：- 効果：【探知難易度】を持つ範囲内すべての存在を対象とする。対象の［隠蔽］状態および［隠密］状態は解除される。あなたの味方に対しては、解除する効果を適用しなくてもよい。
《エネミー識別》 [基本動作] SR:-/- タイミング:セットアップ 判定：基本（知識／識別難易度） 対象:単体 射程：20Sq コスト:- 制限：- 効果：【識別難易度】を持つキャラクターを対象とする。対象は［識別済］状態となる。
《プロップ解析》 [基本動作] SR:-/- タイミング:メジャー 判定：基本（解析／解析難易度） 対象:本文 射程：1Sq コスト:- 制限：- 効果：【解析難易度】を持つプロップ１つを対象とする。対象は［解析済］状態になる。
《プロップ解除》 [基本動作] SR:-/- タイミング:メジャー 判定：基本（解除／解除難易度） 対象:本文 射程：1Sq コスト:- 制限：- 効果：【解除難易度】を持ち、かつ［解析済］状態のプロップ１つを対象とする。対象は効果を停止する。
《とどめの一撃》 [基本動作] SR:-/- タイミング:インスタント 判定：判定なし 対象:自身 射程：至近 コスト:- 制限：- 効果：このメインプロセスであなたが攻撃を行ない、その攻撃により対象に含まれる［戦闘不能］状態のキャラクターにＨＰダメージを１点でも与えられる状況となった場合、そのキャラクターを［死亡］状態にする。
《かばう》 [基本動作] SR:-/- タイミング:ダメージ適用直前 判定：判定なし 対象:単体 射程：至近 コスト:- 制限：- 効果：あなたは［ダメージ適用ステップ］であなた以外の対象が受ける予定のダメージをかわりに受ける。対象はダメージを受けることはない。《かばう》を行なうためには［未行動］でなければならず、また《かばう》を行なうことで即座に［行動済］になる。１回の攻撃に対して１回まで使用可能。エネミーはこの基本動作を行なえない。
《装備の変更》 [基本動作] [準備] SR:-/- タイミング:マイナー 判定：判定なし 対象:自身 射程：至近 コスト:- 制限：- 効果：［装備品スロット］のアイテムを［所持品スロット］に移してもよい。また、［所持品スロット］のアイテムを［装備品スロット］に装備してもよい。アイテムを足下に落とす、拾うなども装備の変更の一部と見なす。１回の行動でできる装備の変更の数に制限はない。好きなように装備を変更できる。この基本動作をブリーフィングで使用する際、１つの ブリーフィングで複数回使用できる。
《受け渡し》 [基本動作] [準備] SR:-/- タイミング:マイナー 判定：判定なし 対象:単体 射程：至近 コスト:- 制限：- 効果：あなたの［所持品スロット］のアイテム１つを、同意した対象の［所持品スロット］に移動する。対象の［所持品スロット］に空きがない場合、対象がいるＳｑにアイテムは落とされる。この基本動作をブリーフィングで使用する際、１つのブリーフィングで複数回使用できる。
《隠れる》 [基本動作] SR:-/- タイミング:メジャー 判定：判定なし 対象:自身 射程：至近 コスト:- 制限：- 効果：あなたは［隠密］状態になる。ただし、あなたが［ヘイトトップ］の場合、または他のキャラクターの［阻止能力］の対象になっている場合、またはバッドステータスを受けている場合、この基本動作は使用できない。
《アイテム鑑定》 [基本動作] SR:-/- タイミング:メジャー 判定：基本（解析／解析難易度） 対象:本文 射程：至近 コスト:- 制限：- 効果：【解析難易度】を持つアイテム１つを対象とする。対象は［解析済］状態になる。
`;
    let itemList: LhtrpgItem[] = [
      json.hand1,
      json.hand2,
      json.armor,
      json.support_item1,
      json.support_item2,
      json.support_item3,
      json.bag
    ].filter(item => item && (item.recipe || item.prefix_function));
    if (itemList.length > 0) {
      cp += '\n○装備アイテム効果\n';
      cp += itemList
        .map(item => {
          if (item.recipe) {
            return `${item.alias} ネームド効果：${
              item.function.split('\n')[0]
            }\n`;
          }
          if (item.prefix_function) {
            return `${item.alias} プレフィックスド効果：${
              item.prefix_function
            }\n`;
          }
          return '';
        })
        .join('');
    }
    itemList = json.items.filter(item => item);
    if (itemList.length > 0) {
      cp += '\n○所持アイテム一覧\n';
      cp += itemList
        .map(item => {
          const tags = item.tags.map(tag => `[${tag}] `).join('');
          const txt =
            item.timing === '－'
              ? ''
              : `タイミング:${item.timing} 判定:${item.roll} 対象:${
                  item.target
                } 射程:${item.range} `;

          return `${item.alias} ${tags}${txt}効果：${
            item.function.split('\n')[0]
          }\n`;
        })
        .join('');
    }

    cp += `
○各種判定
{運動} 運動値
{耐久} 耐久値
{解除} 解除値
{操作} 操作値
{知覚} 知覚値
{交渉} 交渉値
{知識} 知識値
{解析} 解析値

○消耗表
PCT{CR}+0 体力消耗表
ECT{CR}+0 気力消耗表
GCT{CR}+0 物品消耗表
CCT{CR}+0 金銭消耗表

○財宝表
CTRS{CR}+0 金銭財宝表
MTRS{CR}+0 魔法素材財宝表
ITRS{CR}+0 換金アイテム財宝表
`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }

  private static convertToCommand(str: string): string {
    let val = 0;
    let dice = 0;
    const s = str.split('+');
    for (const elm of s) {
      if (elm.match(/(\d+)D/)) {
        dice += Number.parseInt(elm.replace('D', ''), 10);
      } else {
        val += Number.parseInt(elm, 10);
      }
    }
    if (val > 0) {
      return `${dice}LH+${val}`;
    }
    if (val < 0) {
      return `${dice}LH${val}`;
    }
    return `${dice}LH`;
  }

  private static formatSkill(skill: LhrpgSkill): string {
    const tagsText = skill.tags.map(tag => `[${tag}] `).join('');
    // 効果
    const effect = `《${skill.name}》 ${tagsText}SR:${skill.skill_rank}/${
      skill.skill_max_rank
    } タイミング:${skill.timing} 判定:${skill.roll} 対象:${skill.target} 射程:${
      skill.range
    } コスト:${skill.cost} 制限:${skill.limit} 効果:${skill.function}\n`;
    // 判定
    let judge = '';
    if (skill.roll.includes('対決')) {
      const m = skill.roll.match(/\(((.*)\/.*)\)/);
      judge = `{${m[2]}} ${skill.name}${m[1]}\n`;
    }
    // 障壁
    let barrier = '';
    const bMatch = skill.function.match(/［障壁：([^［］]*)］/);
    if (bMatch) {
      const calc = LhtrpgGenerator.convertToCalc(bMatch[1], skill.skill_rank);
      barrier = `${calc} ${skill.name}付与障壁量\n`;
    }
    // ダメージロール
    let damage = '';
    const dRegex = /［([^［］]*)］(点)?の(物理|魔法|物理または魔法|貫通|直接)ダメージ/g;
    let dMatch = dRegex.exec(skill.function);
    let isFirst = true;
    while (dMatch) {
      const calc = LhtrpgGenerator.convertToCalc(dMatch[1], skill.skill_rank);
      damage += `${calc} ${skill.name}${isFirst ? '' : '追加'}ダメージ(${
        dMatch[3]
      })\n`;
      dMatch = dRegex.exec(skill.function);
      isFirst = false;
    }
    // 回復
    let heal = '';
    const hMatch = skill.function.match(/［([^［］]*)］点回復/);
    if (hMatch) {
      const calc = LhtrpgGenerator.convertToCalc(hMatch[1], skill.skill_rank);
      heal = `${calc} ${skill.name}回復量\n`;
    }
    return `${effect}${judge}${barrier}${damage}${heal}`;
  }

  private static convertToCalc(str: string, skillRank: number): string {
    const txt = StringUtil.toHalfWidth(
      str
        .replace(/【/g, '{')
        .replace(/】/g, '}')
        .replace(/×/g, '*')
    ).replace(/SR/g, skillRank.toString());
    if (txt.includes('D')) {
      if (txt.match(/^\(([^\(\)]+)\)$/)) {
        return txt.replace('(', '').replace(')', '');
      }
      return txt;
    }
    return `C(${txt})`;
  }
}

/*
 * https://lhrpg.com/data/json_api.html
 */
export interface LhrpgCharacter {
  /** プレーヤーキャラクター名 */ name: string;
  /** キャラクターランク */ character_rank: number;
  /** レベル */ level: string;
  /** プレイヤー名 */ player_name: string;
  /** 種族 */ race: string;
  /** アーキ職業 */ archetype: string;
  /** メイン職業 */ main_job: string;
  /** サブ職業 */ sub_job: string;
  /** 性別 */ gender: string;
  /** 人物タグ */ tags: string[];
  /** 説明 */ remarks: string;
  /** 最大HP */ max_hitpoint: number;
  /** 初期因果力 */ effect: number;
  /** 行動力 */ action: number;
  /** 移動力 */ move: number;
  /** 武器の射程 */ range: string;
  /** 回復力 */ heal_power: number;
  /** 攻撃力 */ physical_attack: number;
  /** 魔力 */ magic_attack: number;
  /** 物理防御力 */ physical_defense: number;
  /** 魔法防御力 */ magic_defense: number;
  /** STR能力基本値 */ str_basic_value: number;
  /** DEX能力基本値 */ dex_basic_value: number;
  /** POW能力基本値 */ pow_basic_value: number;
  /** INT能力基本値 */ int_basic_value: number;
  /** STR能力値 */ str_value: number;
  /** DEX能力値 */ dex_value: number;
  /** POW能力値 */ pow_value: number;
  /** INT能力値 */ int_value: number;
  /** 運動値 */ abl_motion: string;
  /** 耐久値 */ abl_durability: string;
  /** 解除値 */ abl_dismantle: string;
  /** 操作値 */ abl_operate: string;
  /** 知覚値 */ abl_sense: string;
  /** 交渉値 */ abl_negotiate: string;
  /** 知識値 */ abl_knowledge: string;
  /** 解析値 */ abl_analyze: string;
  /** 回避値 */ abl_avoid: string;
  /** 抵抗値 */ abl_resist: string;
  /** 命中値 */ abl_hit: string;
  /** ガイディングクリード：クリード名 */ creed_name: string;
  /** ガイディングクリード：信念 */ creed: string;
  /** ガイディングクリード：人物タグ */ creed_tag: string;
  /** ガイディングクリード：解説 */ creed_detail: string;
  /** コネクション一覧 */ connections: LhrpgConnection[];
  /** ユニオン一覧 */ unions: LhrpgConnection[];
  /** 手スロットのアイテム1 */ hand1: LhtrpgItem | null;
  /** 手スロットのアイテム2 */ hand2: LhtrpgItem | null;
  /** 防具スロットのアイテム */ armor: LhtrpgItem | null;
  /** 補助装備スロットのアイテム1 */ support_item1: LhtrpgItem | null;
  /** 補助装備スロットのアイテム2 */ support_item2: LhtrpgItem | null;
  /** 補助装備スロットのアイテム3 */ support_item3: LhtrpgItem | null;
  /** 鞄スロットのアイテム ※1 */ bag: LhtrpgItem | null;
  /** 所持品スロットのアイテム一覧 */ items: (LhtrpgItem | null)[];
  /** 選択中のスタイル特技名 */ style_skill_name: string;
  /** 取得特技一覧 */ skills: LhrpgSkill[];
  /** 画像URL */ image_url: string;
  /** キャラクターシートURL */ sheet_url: string;
}

interface LhrpgConnection {
  /** 人物名／ユニオン名 */ name: string;
  /** タグ */ tags: string[];
  /** 関係／備考 */ detail: string;
}

interface LhrpgSkill {
  /** 特技種別 */ job_type: string;
  /** 戦闘/一般 */ type: string;
  /** 特技名 */ name: string;
  /** スキルランク */ skill_rank: number;
  /** 最大スキルランク */ skill_max_rank: number;
  /** タイミング */ timing: string;
  /** 判定 */ roll: string;
  /** 対象 */ target: string;
  /** 射程 */ range: string;
  /** コスト */ cost: string;
  /** 制限 */ limit: string;
  /** タグ */ tags: string[];
  /** 効果 */ function: string;
  /** 解説 */ explain: string;
  /** 内部ID */ id: number;
}

interface LhtrpgItem {
  /** 種別 */ type: string;
  /** アイテムランク */ item_rank: number;
  /** アイテム名 */ name: string;
  /** ユーザーが付与した別名 */ alias: string;
  /** 攻撃力 */ physical_attack: number;
  /** 魔力 */ magic_attack: number;
  /** 物理防御力 */ physical_defense: number;
  /** 魔法防御力 */ magic_defense: number;
  /** 命中修正 */ hit: number;
  /** 行動修正 */ action: number;
  /** 射程 */ range: string;
  /** タイミング */ timing: string;
  /** 対象 */ target: string;
  /** 判定 */ roll: string;
  /** 価格 */ price: number;
  /** 効果・解説 */ function: string;
  /** タグ */ tags: string[];
  /** レシピ */ recipe: string;
  /** プレフィックスドアイテム効果 */ prefix_function: string;
  /** 内部ID */ id: number;
}
