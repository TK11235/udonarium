import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { AppspotFactory } from '../system-factory';

interface Style {
  name: string;
  divineWork: string;
  effect: string;
}

interface Protect {
  protecS: number;
  protecP: number;
  protecI: number;
}

/**
 * キャラクターシート倉庫 トーキョー・ナイトメア
 */
export class TokyoNightmare implements AppspotFactory {
  gameSystem = 'tnm';
  name = 'トーキョー・ナイトメア';
  href = 'https://character-sheets.appspot.com/tnm/';
  create = TokyoNightmare.create;

  static appspotFactory(): AppspotFactory {
    return new TokyoNightmare();
  }

  private static create(
    json: any,
    url: string,
    imageIdentifier: string
  ): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.base.name,
      1,
      imageIdentifier
    );

    /*
     * パーソナルデータ
     */
    const personalElement = Utils.createDataElement('パーソナルデータ', '');
    gameCharacter.detailDataElement.appendChild(personalElement);
    personalElement.appendChild(
      Utils.createDataElement('PL', json.base.player || '')
    );
    personalElement.appendChild(Utils.createDataElement('キャスト番号', ''));
    personalElement.appendChild(
      Utils.createDataElement('所属', json.base.post)
    );
    const baseMemo = (json.base.memo || '').trim();
    const baseMemoir = (json.base.memoir || '').trim();
    const memo =
      baseMemo === '' || baseMemoir === ''
        ? baseMemoir + baseMemo
        : `${baseMemoir}\n\n---\n\n${baseMemo}`;
    personalElement.appendChild(Utils.createNoteElement('設定', memo));
    personalElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * スタイル・神業
     */
    const styleElement = Utils.createDataElement('スタイル・神業', '');
    gameCharacter.detailDataElement.appendChild(styleElement);
    const styleList: { [styleNo: string]: Style } = {
      '0': {
        name: 'カブキ',
        divineWork: 'チャイ',
        effect: '神業や判定の効果ひとつを打ち消す',
      },
      '1': {
        name: 'バサラ',
        divineWork: '天変地異',
        effect: 'トループ1グループを倒すか、住居やヴィークルひとつを破壊する',
      },
      '2': {
        name: 'タタラ',
        divineWork: 'タイムリー',
        effect: '必要なアウトフィットを入手する',
      },
      '3': {
        name: 'ミストレス',
        divineWork: 'ファイト！',
        effect: '対象の神業使用回数をひとつ増やす',
      },
      '4': {
        name: 'カブト',
        divineWork: '難攻不落',
        effect: 'どんな攻撃によるダメージも防ぐ',
      },
      '5': {
        name: 'カリスマ',
        divineWork: '神の御言葉',
        effect:
          'キャラクターひとりを［精神崩壊］させるか、任意の精神ダメージを与える',
      },
      '6': {
        name: 'マネキン',
        divineWork: 'プリーズ！',
        effect: '対象に神業を1回使用させる／お願いひとつを聞いてもらう',
      },
      '7': {
        name: 'カゼ',
        divineWork: '脱出',
        effect: 'ヴィークルでどんな状況からも逃げ出す',
      },
      '8': {
        name: 'フェイト',
        divineWork: '真実',
        effect: 'キャラクターひとりから本当のことを聞き出す',
      },
      '9': {
        name: 'クロマク',
        divineWork: '腹心',
        effect:
          '自分が受けたダメージひとつを打ち消す（腹心が代わりに受けてくれる）',
      },
      '10': {
        name: 'エグゼク',
        divineWork: '買収',
        effect: 'アウトフィットや組織ひとつを買い取る',
      },
      '11': {
        name: 'カタナ',
        divineWork: '死の舞踏',
        effect:
          '近距離までのキャラクターひとりに任意の肉体ダメージ（［完全死亡］含む）を与える',
      },
      '12': {
        name: 'クグツ',
        divineWork: '完全偽装',
        effect: '情報や事実ひとつを完璧に偽装する',
      },
      '13': {
        name: 'カゲ',
        divineWork: '不可知',
        effect:
          '誰にも気づかれずに行動（メインプロセス）を1回行なう。リアクション不可',
      },
      '14': {
        name: 'チャクラ',
        divineWork: '黄泉還り',
        effect:
          'キャラクターひとりが受けている肉体・精神ダメージをすべて回復する。癒やすのが他のキャラクターの場合、そのシーン中に受けたダメージのみ可能。',
      },
      '15': {
        name: 'レッガー',
        divineWork: '不可触',
        effect: '事実をもみ消したり、他人に押しつけたりする',
      },
      '16': {
        name: 'カブトワリ',
        divineWork: 'とどめの一撃',
        effect:
          '至近距離以外にいるキャラクターひとりに任意の肉体ダメージ（［完全死亡］含む）を与える',
      },
      '17': {
        name: 'ハイランダー',
        divineWork: '天罰',
        effect: 'なんでもひとつ望む効果を得る',
      },
      '18': {
        name: 'マヤカシ',
        divineWork: '守護神',
        effect: 'キャラクターひとりに対する任意のダメージひとつを打ち消す',
      },
      '19': {
        name: 'トーキー',
        divineWork: '暴露',
        effect: 'どんな事柄でも自由に報道する',
      },
      '20': {
        name: 'イヌ',
        divineWork: '制裁',
        effect:
          'キャラクターひとりに任意の社会ダメージ（［抹殺］含む）を与えるか、社会ダメージを打ち消す',
      },
      '21': {
        name: 'ニューロ',
        divineWork: '電脳神',
        effect:
          'ウェブやウェブに接続されたものを操り、ダメージを与える以外の望む効果を得る',
      },
      '-2': {
        name: 'テツジン',
        divineWork: '鋼鉄心',
        effect: '〈タイプ〉による',
      },
      '-9': {
        name: 'ハンドラー',
        divineWork: '友情',
        effect:
          'キャラクターひとりに対するダメージのような不都合な効果をひとつ打ち消す。',
      },
      '-12': {
        name: 'クロガネ',
        divineWork: '万能道具',
        effect: '〈フォルム〉による',
      },
      '-14': {
        name: 'ヒルコ',
        divineWork: '突然変異',
        effect: '神業をひとつコピーする',
      },
      '-17': {
        name: 'エトランゼ',
        divineWork: '超越品',
        effect: 'なんでもひとつ望む効果を得る',
      },
      '-18': {
        name: 'アヤカシ',
        divineWork: '霧散',
        effect:
          'いつでも、自分の受けたダメージひとつを消去し、甦ることができる',
      },
    };
    const pkDisp: { [pkIndex: string]: string } = {
      null: '',
      '0': '',
      '1': '●',
      '2': '◎',
      '3': '◎●',
    };
    const style1 = styleList[json.styles.style1];
    const pk1 = pkDisp[json.styles.pk1];
    const style2 = styleList[json.styles.style2];
    const pk2 = pkDisp[json.styles.pk2];
    const style3 = styleList[json.styles.style3];
    const pk3 = pkDisp[json.styles.pk3];
    styleElement.appendChild(
      Utils.createDataElement(
        'スタイル',
        `${style1.name}${pk1}、${style2.name}${pk2}、${style3.name}${pk3}`
      )
    );
    const divineWorkElement = Utils.createDataElement('神業', '');
    styleElement.appendChild(divineWorkElement);
    divineWorkElement.appendChild(
      Utils.createResourceElement(style1.divineWork, 1, 1)
    );
    divineWorkElement.appendChild(
      Utils.createResourceElement(style2.divineWork, 1, 1)
    );
    divineWorkElement.appendChild(
      Utils.createResourceElement(style3.divineWork, 1, 1)
    );

    /*
     * 能力値・制御値
     */
    const abilityElement = Utils.createDataElement('能力値・制御値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    const abilityRe = /\d+\((\d+)\)/;
    const reasonElement = Utils.createDataElement('理性♠', '');
    abilityElement.appendChild(reasonElement);
    const reasonAbl = json.ability.reason.abl.replace(abilityRe, '$1');
    const reasonCtl = json.ability.reason.ctl.replace(abilityRe, '$1');
    reasonElement.appendChild(Utils.createDataElement('理性', reasonAbl));
    reasonElement.appendChild(Utils.createDataElement('理性(制)', reasonCtl));
    const passionElement = Utils.createDataElement('感情♣', '');
    abilityElement.appendChild(passionElement);
    const passionAbl = json.ability.passion.abl.replace(abilityRe, '$1');
    const passionCtl = json.ability.passion.ctl.replace(abilityRe, '$1');
    passionElement.appendChild(Utils.createDataElement('感情', passionAbl));
    passionElement.appendChild(Utils.createDataElement('感情(制)', passionCtl));
    const lifeElement = Utils.createDataElement('生命♥', '');
    abilityElement.appendChild(lifeElement);
    const lifeAbl = json.ability.life.abl.replace(abilityRe, '$1');
    const lifeCtl = json.ability.life.ctl.replace(abilityRe, '$1');
    lifeElement.appendChild(Utils.createDataElement('生命', lifeAbl));
    lifeElement.appendChild(Utils.createDataElement('生命(制)', lifeCtl));
    const mundaneElement = Utils.createDataElement('外界◆', '');
    abilityElement.appendChild(mundaneElement);
    const mundaneAbl = json.ability.mundane.abl.replace(abilityRe, '$1');
    const mundaneCtl = json.ability.mundane.ctl.replace(abilityRe, '$1');
    mundaneElement.appendChild(Utils.createDataElement('外界', mundaneAbl));
    mundaneElement.appendChild(Utils.createDataElement('外界(制)', mundaneCtl));

    /*
     * アクトデータ
     */
    const actElement = Utils.createDataElement('アクトデータ', '');
    gameCharacter.detailDataElement.appendChild(actElement);
    actElement.appendChild(
      Utils.createResourceElement('報酬点', 21, json.base.reward)
    );
    actElement.appendChild(
      Utils.createNoteElement('アクトコネ', '（得たコネ）')
    );
    actElement.appendChild(
      Utils.createNoteElement('メモ', '（得たアドレスやアウトフィットなど）')
    );

    /*
     * 戦闘データ
     */
    const combatElement = Utils.createDataElement('戦闘データ', '');
    gameCharacter.detailDataElement.appendChild(combatElement);
    combatElement.appendChild(
      Utils.createResourceElement('CS', json.ability.cs, json.ability.cs)
    );
    const protectElement = Utils.createDataElement('防御力', '');
    combatElement.appendChild(protectElement);
    const { protecS, protecP, protecI }: Protect = json.armours
      .map((armour) => {
        return {
          protecS: Number.parseInt(armour.protecS || 0, 10),
          protecP: Number.parseInt(armour.protecP || 0, 10),
          protecI: Number.parseInt(armour.protecI || 0, 10),
        };
      })
      .reduce(
        (acc: Protect, cur: Protect) => {
          return {
            protecS: acc.protecS + cur.protecS,
            protecP: acc.protecP + cur.protecP,
            protecI: acc.protecI + cur.protecI,
          };
        },
        {
          protecS: 0,
          protecP: 0,
          protecI: 0,
        }
      );
    protectElement.appendChild(Utils.createDataElement('S', protecS));
    protectElement.appendChild(Utils.createDataElement('P', protecP));
    protectElement.appendChild(Utils.createDataElement('I', protecI));
    combatElement.appendChild(Utils.createNoteElement('肉体ダメージ', ''));
    combatElement.appendChild(Utils.createNoteElement('精神ダメージ', ''));
    combatElement.appendChild(Utils.createNoteElement('社会ダメージ', ''));

    /*
     * BS
     */
    const bsElement = Utils.createDataElement('BS', '');
    gameCharacter.detailDataElement.appendChild(bsElement);
    bsElement.appendChild(Utils.createDataElement('恐慌', ''));
    bsElement.appendChild(Utils.createDataElement('蛇毒', ''));
    bsElement.appendChild(Utils.createNoteElement('重圧', ''));
    bsElement.appendChild(Utils.createDataElement('衰弱', ''));
    bsElement.appendChild(Utils.createNoteElement('捕縛', ''));
    bsElement.appendChild(Utils.createNoteElement('酩酊', ''));
    bsElement.appendChild(Utils.createDataElement('狼狽', ''));

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = '';
    // チャパレ内容
    let cp = `//-----神業
《${style1.divineWork}》${style1.effect}
《${style2.divineWork}》${style2.effect}
《${style3.divineWork}》${style3.effect}

//-----能力値
C({理性}+) 理性♠
C({感情}+) 感情♣
C({生命}+) 生命♥
C({外界}+) 外界◆

//-----制御値
C({理性(制)}+) 理性(制御値)♠
C({感情(制)}+) 感情(制御値)♣
C({生命(制)}+) 生命(制御値)♥
C({外界(制)}+) 外界(制御値)◆

//-----制御判定
C({理性}+) 制御判定(理性♠)<=制御値{理性(制)}
C({感情}+) 制御判定(感情♣)<=制御値{感情(制)}
C({生命}+) 制御判定(生命♥)<=制御値{生命(制)}
C({外界}+) 制御判定(外界◆)<=制御値{外界(制)}
`;
    cp += '\n//-----一般技能\n';
    const skills = json.skills1
      .concat(json.skills2)
      .concat(json.skills3)
      .concat(json.skills4);
    const toSuit = (skill: { s: string; c: string; h: string; d: string }) => {
      let ret = '';
      ret += skill.s === '1' ? '♠' : '♤';
      ret += skill.c === '1' ? '♣' : '♧';
      ret += skill.h === '1' ? '♥' : '♡';
      ret += skill.d === '1' ? '◆' : '◇';
      return ret;
    };
    for (const skill of skills) {
      if (!skill.name || !skill.level) {
        continue;
      }
      const suit = toSuit(skill);
      cp += `〈${skill.name}〉Lv.${skill.level}[${suit}]\n`;
    }
    cp += '\n//-----スタイル技能\n';
    for (const skill of json.superhumanskills) {
      if (!skill.name || !skill.level) {
        continue;
      }
      const suit = toSuit(skill);
      const arr: string[] = [`Lv.${skill.level}[${suit}]`];
      if (skill.skill) arr.push(skill.skill);
      if (skill.timing) arr.push(skill.timing);
      if (skill.target) arr.push(skill.target);
      if (skill.range) arr.push(skill.range);
      if (skill.aim) arr.push(skill.aim);
      if (skill.confront) arr.push(skill.confront);
      const text = `〈${skill.name}〉 ${arr.join(' | ')} | ${
        skill.notes || ''
      }`.replace(/\r|\n/g, ' ');
      cp += text + '\n';
    }
    cp += '\n//-----武器\n';
    for (const weapon of json.weapons) {
      if (!weapon.name) {
        continue;
      }
      const arr: string[] = [];
      if (weapon.concealA || weapon.concealB)
        arr.push(`${weapon.concealA || '0'}/${weapon.concealB || '0'}`);
      if (weapon.attack) arr.push(weapon.attack);
      if (weapon.defense) arr.push(weapon.defense);
      if (weapon.electrical_control) arr.push(weapon.electrical_control);
      const text = `「${weapon.name}」 ${arr.join(' | ')} | ${
        weapon.notes || ''
      }`.replace(/\r|\n/g, ' ');
      cp += text + '\n';
    }
    cp += '\n//-----防具\n';
    for (const armour of json.armours) {
      if (!armour.name) {
        continue;
      }
      const arr: string[] = [];
      if (armour.concealA || armour.concealB)
        arr.push(`${armour.concealA || '0'}/${armour.concealB || '0'}`);
      if (armour.control) arr.push(armour.control);
      if (armour.electrical_control) arr.push(armour.electrical_control);
      const text = `「${armour.name}」 ${arr.join(' | ')} | ${
        armour.notes || ''
      }`.replace(/\r|\n/g, ' ');
      cp += text + '\n';
    }
    cp += '\n//-----装備\n';
    for (const outfit of json.outfits) {
      if (!outfit.name) {
        continue;
      }
      const arr: string[] = [];
      if (outfit.concealA || outfit.concealB)
        arr.push(`${outfit.concealA || '0'}/${outfit.concealB || '0'}`);
      if (outfit.electrical_control) arr.push(outfit.electrical_control);
      const text = `「${outfit.name}」 ${arr.join(' | ')} | ${
        outfit.notes || ''
      }`.replace(/\r|\n/g, ' ');
      cp += text + '\n';
    }
    cp += '\n//-----ヴィークル\n';
    for (const vehicle of json.vehicles) {
      if (!vehicle.name) {
        continue;
      }
      const arr: string[] = [];
      if (vehicle.concealA || vehicle.concealB)
        arr.push(`${vehicle.concealA || '0'}/${vehicle.concealB || '0'}`);
      if (vehicle.attack) arr.push(vehicle.attack);
      if (vehicle.sf) arr.push(vehicle.sf);
      if (vehicle.protecS || vehicle.protecP || vehicle.protecI)
        arr.push(
          `${vehicle.protecS || '0'}/${vehicle.protecS || '0'}/${
            vehicle.protecI || '0'
          }`
        );
      if (vehicle.control) arr.push(vehicle.control);
      if (vehicle.crew) arr.push(vehicle.crew);
      if (vehicle.electrical_control) arr.push(vehicle.electrical_control);
      const text = `「${vehicle.name}」 ${arr.join(' | ')} | ${
        vehicle.notes || ''
      }`.replace(/\r|\n/g, ' ');
      cp += text + '\n';
    }
    cp += '\n//-----住居\n';
    for (const residence of json.residences) {
      if (!residence.name) {
        continue;
      }
      const arr: string[] = [];
      if (residence.entry) arr.push(residence.entry);
      const text = `「${residence.name}」 ${arr.join(' | ')} | ${
        residence.notes || ''
      }`.replace(/\r|\n/g, ' ');
      cp += text + '\n';
    }
    cp += `\n//-----メモ\n${baseMemo}`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
