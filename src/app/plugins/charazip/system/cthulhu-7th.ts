import { ChatPalette } from '@udonarium/chat-palette';
import { DataElement } from '@udonarium/data-element';

import { CustomCharacter, Utils } from '../custom-character';
import { VampireBloodFactory } from '../system-factory';

export class Cthulhu7th {
  static vampireBloodFactory(): VampireBloodFactory {
    return new Cthulhu7thVampireBloodFactory();
  }

  static charaenoFactory() {
    return new Cthulhu7thCharaenoFactory();
  }
}

/**
 * キャラクター保管所 新クトゥルフ
 */
class Cthulhu7thVampireBloodFactory implements VampireBloodFactory {
  gameSystem = 'coc7';
  name = '新クトゥルフ';
  href = 'https://charasheet.vampire-blood.net/list_coc7.html';
  create = Cthulhu7thVampireBloodFactory.create;

  private static create(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.pc_name,
      1,
      ''
    );

    /*
     *情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(Utils.createDataElement('PL', ''));
    infoElement.appendChild(Utils.createDataElement('職業', json.shuzoku));
    infoElement.appendChild(Utils.createDataElement('年齢', json.age));
    infoElement.appendChild(Utils.createDataElement('性別', json.sex));
    infoElement.appendChild(Utils.createDataElement('出身', json.pc_kigen));
    infoElement.appendChild(
      Utils.createNoteElement('プロフ', json.pc_making_memo)
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * リソース
     */
    const resourceElement = Utils.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      Utils.createResourceElement('耐久力', json.NA10, json.NA10)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('マジック・ポイント', json.NA11, json.NA11)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('正気度', json.SAN_start, json.SAN_Left)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('幸運', json.Luck_start, json.Luck_Left)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('ボーナス・ペナルティ', 2, 0)
    );

    /*
     * 能力値
     */
    const abilityElement = Utils.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(Utils.createDataElement('STR', json.NP1));
    abilityElement.appendChild(Utils.createDataElement('CON', json.NP2));
    abilityElement.appendChild(Utils.createDataElement('DEX', json.NP3));
    abilityElement.appendChild(Utils.createDataElement('APP', json.NP4));
    abilityElement.appendChild(Utils.createDataElement('POW', json.NP5));
    abilityElement.appendChild(Utils.createDataElement('SIZ', json.NP6));
    abilityElement.appendChild(Utils.createDataElement('INT', json.NP7));
    abilityElement.appendChild(Utils.createDataElement('EDU', json.NP8));
    abilityElement.appendChild(Utils.createDataElement('MOV', json.NA9));
    const dmgBonus = json.dmg_bonus;
    abilityElement.appendChild(
      Utils.createDataElement(
        'DB',
        dmgBonus.indexOf('-') < 0 ? `+${dmgBonus}` : dmgBonus
      )
    );
    abilityElement.appendChild(
      Utils.createDataElement('ビルド', json.build_bonus)
    );

    /*
     * 技能
     */
    const skillElements: DataElement[] = [
      Utils.createDataElement('戦闘技能', ''),
      Utils.createDataElement('探索技能', ''),
      Utils.createDataElement('踏破技能', ''),
      Utils.createDataElement('行動技能', ''),
      Utils.createDataElement('交渉技能', ''),
      Utils.createDataElement('知識技能', ''),
    ];
    skillElements.forEach((element) =>
      gameCharacter.detailDataElement.appendChild(element)
    );
    for (let i = 0; i < json.SKAN.length; i++) {
      let skillName = json.SKAN[i];
      const skillSubName = json.SKAM[i];
      if (skillSubName) {
        skillName += `(${skillSubName})`;
      }
      const skillPoint = json.SKAP[i];
      const skillType = Number.parseInt(json.SKTP[i], 10);
      skillElements[skillType].appendChild(
        Utils.createDataElement(skillName, skillPoint)
      );
    }

    /*
     * 武器・防具
     */
    const armsElement = Utils.createDataElement('武器・防具', '');
    gameCharacter.detailDataElement.appendChild(armsElement);
    for (let i = 0; i < json.arms_name.length; i++) {
      const armName = json.arms_name[i];
      if (!armName) {
        continue;
      }
      armsElement.appendChild(
        Utils.createDataElement(armName, json.arms_hit[i])
      );
    }

    /*
     * 所持品
     */
    const itemElement = Utils.createDataElement('所持品', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (let i = 0; i < json.item_name.length; i++) {
      const itemName = json.item_name[i];
      if (!itemName) {
        continue;
      }
      itemElement.appendChild(
        Utils.createNoteElement(itemName, json.item_memo[i])
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Cthulhu7th';
    // チャパレ内容
    let cp = `1d100
CC
CC({ボーナス・ペナルティ})<=

//-----正気度・狂気表
CC({ボーナス・ペナルティ})<={正気度} 〈正気度〉ロール
現在正気度 {正気度}
C(99-{クトゥルフ神話}) 最大正気度
BMR 狂気の発作（リアルタイム）表
BMS 狂気の発作（サマリー）表
PH 恐怖症表
MA マニア表

//-----能力値ロール
CC({ボーナス・ペナルティ})<={STR} STR
CC({ボーナス・ペナルティ})<={CON} CON
CC({ボーナス・ペナルティ})<={SIZ} SIZ
CC({ボーナス・ペナルティ})<={DEX} DEX
CC({ボーナス・ペナルティ})<={APP} APP
CC({ボーナス・ペナルティ})<={INT} INT〈アイデア〉
CC({ボーナス・ペナルティ})<={POW} POW
CC({ボーナス・ペナルティ})<={EDU} EDU〈知識〉
CC({ボーナス・ペナルティ})<={幸運} 〈幸運〉

`;
    const cpSkills = [
      '\n//-----戦闘技能\n',
      '\n//-----探索技能\n',
      '\n//-----踏破技能\n',
      '\n//-----行動技能\n',
      '\n//-----交渉技能\n',
      '\n//-----知識技能\n',
    ];
    for (let i = 0; i < json.SKAN.length; i++) {
      let skillName = json.SKAN[i];
      const skillSubName = json.SKAM[i];
      if (skillSubName) {
        skillName += `(${skillSubName})`;
      }
      const skillType = Number.parseInt(json.SKTP[i], 10);
      cpSkills[
        skillType
      ] += `CC({ボーナス・ペナルティ})<={${skillName}} 〈${skillName}〉\n`;
    }
    cp += cpSkills.join('');
    cp += '\n//-----武器・防具\n';
    for (let i = 0; i < json.arms_name.length; i++) {
      const armName = json.arms_name[i];
      if (!armName) {
        continue;
      }
      const range = json.arms_range[i];
      const vitality = Number.parseInt(json.arms_vitality[i], 10);
      const damage = json.arms_damage[i]
        .replace(/1\/2db/gi, 'DB/2')
        .replace(/\+db/gi, '{DB}');
      cp += `CC({ボーナス・ペナルティ})<={${armName}} :${armName}/${range}\n`;
      if (!Number.isNaN(vitality)) {
        const attackCount = json.arms_attack_count[i];
        const lastShot = json.arms_last_shot[i];
        cp += `FAR(1,{${armName}},${vitality},{ボーナス・ペナルティ}) :${armName}/${range}/回数${attackCount}/装弾数${lastShot}/故障#${vitality}\n`;
      }
      cp += `${damage} :${armName}(ダメージ)\n`;
    }

    cp += `
//-----プッシュ時の詠唱ロールでの失敗表
FCL 控えめな呪文の場合
FCM パワフルな呪文の場合`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}

/**
 * Charaeno 新クトゥルフ神話TRPG
 * https://charaeno.sakasin.net/
 */
class Cthulhu7thCharaenoFactory {
  create = Cthulhu7thCharaenoFactory.create;

  private static create(json: Investigator, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.name,
      1,
      ''
    );

    /*
     *情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(Utils.createDataElement('PL', ''));
    infoElement.appendChild(Utils.createDataElement('職業', json.occupation));
    infoElement.appendChild(Utils.createDataElement('年齢', json.age));
    infoElement.appendChild(Utils.createDataElement('性別', json.sex));
    infoElement.appendChild(Utils.createDataElement('住所', json.residence));
    infoElement.appendChild(Utils.createDataElement('出身', json.birthplace));
    infoElement.appendChild(Utils.createNoteElement('プロフ', json.note));
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * リソース
     */
    const resourceElement = Utils.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      Utils.createResourceElement(
        '耐久力',
        json.attribute.hp,
        json.attribute.hp
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement(
        'マジック・ポイント',
        json.attribute.mp,
        json.attribute.mp
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement(
        '正気度',
        json.attribute.san.max,
        json.attribute.san.value
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement(
        '幸運',
        json.attribute.luck,
        json.attribute.luck
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement('ボーナス・ペナルティ', 2, 0)
    );

    /*
     * 能力値
     */
    const abilityElement = Utils.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);

    ['str', 'con', 'pow', 'dex', 'app', 'siz', 'int', 'edu'].forEach((ab) => {
      abilityElement.appendChild(
        Utils.createDataElement(ab.toUpperCase(), json.characteristics[ab])
      );
    });
    abilityElement.appendChild(
      Utils.createDataElement('MOV', json.attribute.mov)
    );
    abilityElement.appendChild(
      Utils.createDataElement('DB', json.attribute.db)
    );
    abilityElement.appendChild(
      Utils.createDataElement('ビルド', json.attribute.build)
    );

    /*
     * 戦闘技能
     */
    const combatElement = Utils.createDataElement('戦闘技能', '');
    gameCharacter.detailDataElement.appendChild(combatElement);
    let combatSkills: Skill[] = [findSkill(json, '回避')];
    combatSkills = combatSkills.concat(
      sliceSkills(json, '近接戦闘（格闘）', 'クトゥルフ神話')
    );
    combatSkills = combatSkills.concat(
      sliceSkills(json, '射撃（拳銃）', '重機械操作')
    );
    combatSkills.push(findSkill(json, '投擲'));
    for (const skill of combatSkills) {
      combatElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    /*
     * 探索技能
     */
    const exploreElement = Utils.createDataElement('探索技能', '');
    gameCharacter.detailDataElement.appendChild(exploreElement);
    let exploreSkills: Skill[] = [
      '隠密',
      '鍵開け',
      '鑑定',
      '聞き耳',
      '図書館',
      '目星',
    ].map((name) => findSkill(json, name));
    for (const skill of exploreSkills) {
      exploreElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    /*
     * 踏破技能
     */
    const moveElement = Utils.createDataElement('踏破技能', '');
    gameCharacter.detailDataElement.appendChild(moveElement);
    let moveSkills: Skill[] = sliceSkills(json, '運転（自動車）', '応急手当');
    const survival = json.skills.find((skill) =>
      skill.name.startsWith('サバイバル')
    );
    moveSkills = moveSkills.concat(sliceSkills(json, survival.name, '自然'));
    moveSkills.push(findSkill(json, '水泳'));
    const control = json.skills.find((skill) => skill.name.startsWith('操縦'));
    moveSkills = moveSkills.concat(sliceSkills(json, control.name, '手さばき'));
    moveSkills = moveSkills.concat(
      ['登攀', 'ナビゲート'].map((name) => findSkill(json, name))
    );
    for (const skill of moveSkills) {
      moveElement.appendChild(Utils.createDataElement(skill.name, skill.value));
    }

    /*
     * 行動技能
     */
    const actionElement = Utils.createDataElement('行動技能', '');
    gameCharacter.detailDataElement.appendChild(actionElement);
    let actionSkills: Skill[] = sliceSkills(json, '運転（自動車）', '');
    actionSkills = actionSkills.concat(
      ['応急手当', '機械修理'].map((name) => findSkill(json, name))
    );
    const art = json.skills.find((skill) =>
      skill.name.startsWith('芸術／制作')
    );
    actionSkills = actionSkills.concat(sliceSkills(json, art.name, '経理'));
    actionSkills = actionSkills.concat(
      ['重機械操作', '精神分析', '手さばき', '電気修理', '変装'].map((name) =>
        findSkill(json, name)
      )
    );
    for (const skill of actionSkills) {
      actionElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    /*
     * 交渉技能
     */
    const negotiateElement = Utils.createDataElement('交渉技能', '');
    gameCharacter.detailDataElement.appendChild(negotiateElement);
    const negotiateSkills: Skill[] = [
      '威圧',
      '言いくるめ',
      '信用',
      '説得',
      '魅惑',
    ].map((name) => findSkill(json, name));
    for (const skill of negotiateSkills) {
      negotiateElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    /*
     * 知識技能
     */
    const knowledgeElement = Utils.createDataElement('知識技能', '');
    gameCharacter.detailDataElement.appendChild(knowledgeElement);
    let knowledgeSkills: Skill[] = ['医学', 'オカルト'].map((name) =>
      findSkill(json, name)
    );
    const science = json.skills.find((skill) => skill.name.startsWith('科学'));
    knowledgeSkills = knowledgeSkills.concat(
      sliceSkills(json, science.name, '鍵開け')
    );
    knowledgeSkills = knowledgeSkills.concat(
      [
        'クトゥルフ神話',
        '経理',
        '考古学',
        'コンピューター',
        '自然',
        '心理学',
        '人類学',
        '電子工学',
      ].map((name) => findSkill(json, name))
    );
    knowledgeSkills = knowledgeSkills.concat(sliceSkills(json, '法律', '魅惑'));
    knowledgeSkills.push(findSkill(json, '歴史'));
    for (const skill of knowledgeSkills) {
      knowledgeElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    /*
     * その他技能
     */
    const otherElement = Utils.createDataElement('その他技能', '');
    gameCharacter.detailDataElement.appendChild(otherElement);

    const historyIdx = json.skills.findIndex((skill) => skill.name === '歴史');
    const otherSkill = json.skills[historyIdx + 1];
    const otherSkills = otherSkill ? sliceSkills(json, otherSkill.name) : [];
    for (const skill of otherSkills) {
      otherElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    /*
     * 武器・防具
     */
    const armsElement = Utils.createDataElement('武器・防具', '');
    gameCharacter.detailDataElement.appendChild(armsElement);
    json.wapons.forEach((wapon) =>
      armsElement.appendChild(Utils.createDataElement(wapon.name, wapon.value))
    );

    /*
     * 所持品
     */
    const itemElement = Utils.createDataElement('所持品', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    json.possessions.forEach((posession) =>
      itemElement.appendChild(
        Utils.createNoteElement(posession.name, posession.detail)
      )
    );

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Cthulhu7th';
    // チャパレ内容
    let cp = `1d100
CC
CC({ボーナス・ペナルティ})<=

//-----正気度・狂気表
CC({ボーナス・ペナルティ})<={正気度} 〈正気度〉ロール
現在正気度 {正気度}
C(99-{クトゥルフ神話}) 最大正気度
BMR 狂気の発作（リアルタイム）表
BMS 狂気の発作（サマリー）表
PH 恐怖症表
MA マニア表

//-----能力値ロール
CC({ボーナス・ペナルティ})<={STR} STR
CC({ボーナス・ペナルティ})<={CON} CON
CC({ボーナス・ペナルティ})<={SIZ} SIZ
CC({ボーナス・ペナルティ})<={DEX} DEX
CC({ボーナス・ペナルティ})<={APP} APP
CC({ボーナス・ペナルティ})<={INT} INT〈アイデア〉
CC({ボーナス・ペナルティ})<={POW} POW
CC({ボーナス・ペナルティ})<={EDU} EDU〈知識〉
CC({ボーナス・ペナルティ})<={幸運} 〈幸運〉

//-----戦闘技能
${combatSkills
  .map(
    (skill) => `CC({ボーナス・ペナルティ})<={${skill.name}} 〈${skill.name}〉`
  )
  .join('\n')}

//-----探索技能
${exploreSkills
  .map(
    (skill) => `CC({ボーナス・ペナルティ})<={${skill.name}} 〈${skill.name}〉`
  )
  .join('\n')}

//-----踏破技能
${moveSkills
  .map(
    (skill) => `CC({ボーナス・ペナルティ})<={${skill.name}} 〈${skill.name}〉`
  )
  .join('\n')}

//-----行動技能
${actionSkills
  .map(
    (skill) => `CC({ボーナス・ペナルティ})<={${skill.name}} 〈${skill.name}〉`
  )
  .join('\n')}

//-----交渉技能
${negotiateSkills
  .map(
    (skill) => `CC({ボーナス・ペナルティ})<={${skill.name}} 〈${skill.name}〉`
  )
  .join('\n')}

//-----知識技能
${knowledgeSkills
  .map(
    (skill) => `CC({ボーナス・ペナルティ})<={${skill.name}} 〈${skill.name}〉`
  )
  .join('\n')}

//-----その他技能
${otherSkills
  .map(
    (skill) => `CC({ボーナス・ペナルティ})<={${skill.name}} 〈${skill.name}〉`
  )
  .join('\n')}
`;
    cp += '\n//-----武器・防具\n';
    for (const wapon of json.wapons) {
      const malfunction = Number.parseInt(wapon.malfunction, 10);
      const damage = wapon.damage
        .replace(/1\/2DB/gi, 'DB/2')
        .replace(/\+DB/gi, '{DB}');
      cp += `CC({ボーナス・ペナルティ})<={${wapon.name}} :${wapon.name}/${wapon.range}\n`;
      if (!Number.isNaN(malfunction)) {
        cp += `FAR(1,{${wapon.name}},${malfunction},{ボーナス・ペナルティ}) :${wapon.name}/${wapon.range}/回数${wapon.attacks}/装弾数${wapon.ammo}/故障#${malfunction}\n`;
      }
      cp += `${damage} :${wapon.name}(ダメージ)\n\n`;
    }

    cp += `
//-----プッシュ時の詠唱ロールでの失敗表
FCL 控えめな呪文の場合
FCM パワフルな呪文の場合`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}

function findSkill(json: Investigator, skillName: string): Skill {
  return json.skills.find((skill) => skill.name === skillName);
}

function sliceSkills(
  json: Investigator,
  startName: string,
  endName?: string
): Skill[] {
  const start = json.skills.findIndex((skill) => skill.name === startName);
  if (endName) {
    const end = json.skills.findIndex((skill) => skill.name === endName);
    return json.skills.slice(start, end);
  } else {
    return json.skills.slice(start);
  }
}

/**
 * Charaeno Interface
 * {@link https://gist.github.com/ysakasin/567e44da06fe879a36536b0ee2049b9a#apiv16thidsummary}
 */
interface Investigator {
  name: string; // 名前
  occupation: string; // 職業
  age: string; // 年齢
  sex: string; // 性別
  residence: string; // 住所
  birthplace: string; // 出身

  // 各能力値の現在値
  characteristics: {
    str: number;
    con: number;
    pow: number;
    dex: number;
    app: number;
    siz: number;
    int: number;
    edu: number;
  };

  // 耐久力等の現在値および最大正気度
  attribute: {
    hp: number; // 耐久力
    mp: number; // マジック・ポイント
    mov: number; // 移動率
    build: number; // ビルド
    db: string; // ダメージ・ボーナス。0の場合には "+0" となる
    san: {
      value: number;
      max: number;
    };
    luck: number;
  };

  skills: Array<Skill>;
  wapons: Array<Wapon>;
  possessions: Array<Possession>; // 装備と所持品

  // 収入と財産
  credit: {
    spendingLevel: string;
    cash: string;
    assetsDetails: string;
  };
  backstory: Array<Backstory>;
  fellows: Array<Fellow>; // 仲間の探索者
  note: string;
  chatpalette: string; // チャットパレットに用いるための改行区切りのコマンド一覧
}

interface Skill {
  name: string;
  value: number; // 技能の合計値
  edited: boolean; // 技能値が編集されているかどうか。技能の合計値が初期値と異なる場合 true となる
}

interface Wapon {
  name: string; // 名前
  value: string; // 技能値。数値とは限らないことに注意
  damage: string; // ダメージ
  range: string; // 射程
  attacks: string; // 攻撃回数
  ammo: string; // 装弾数
  malfunction: string; // 故障ナンバー
}

interface Possession {
  name: string; // 名前
  count: string; // 所持数。数値とは限らないことに注意
  detail: string; // 物品の詳細説明
}

interface Backstory {
  name: string;
  entries: BackstoryEntry[];
}

interface BackstoryEntry {
  text: string;
  keyConnection?: boolean; // エントリがキーコネクションに指定されていると true となる
}

interface Fellow {
  name: string;
  url: string; // 妥当なURLとは限らないことに注意
}
