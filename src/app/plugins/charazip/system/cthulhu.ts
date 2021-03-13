import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { VampireBloodFactory } from '../system-factory';

export class Cthulhu {
  static vampireBloodFactory(): VampireBloodFactory {
    return new CthulhuVampireBloodFactory();
  }

  static charaenoFactory() {
    return new CthulhuCharaeoFactory();
  }
}

/**
 * キャラクター保管所 クトゥルフ
 */
class CthulhuVampireBloodFactory implements VampireBloodFactory {
  gameSystem = 'coc';
  name = 'クトゥルフ';
  href = 'https://charasheet.vampire-blood.net/list_coc.html';
  create = CthulhuVampireBloodFactory.create;

  private static create(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.pc_name,
      1,
      ''
    );

    /*
     * リソース
     */
    const resourceElement = Utils.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      Utils.createResourceElement('HP', json.NA9, json.NA9)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('MP', json.NA10, json.NA10)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('SAN', json.SAN_Max, json.SAN_Left)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('神話技能', 99, json.TKAP[3])
    );
    resourceElement.appendChild(
      Utils.createResourceElement('不定領域', 99, json.SAN_Danger)
    );

    /*
     *情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(Utils.createDataElement('PL', ''));
    // 持ち物
    const items = json.item_name.filter((item: any) => item).join('/');
    const arms = json.arms_name.filter((arm: any) => arm).join('/');
    infoElement.appendChild(
      Utils.createNoteElement('持ち物', `${items}/${arms}`)
    );
    infoElement.appendChild(
      Utils.createNoteElement('プロフ', json.pc_making_memo)
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     *能力値
     */
    const abilityElement = Utils.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(Utils.createDataElement('STR', json.NP1));
    abilityElement.appendChild(Utils.createDataElement('CON', json.NP2));
    abilityElement.appendChild(Utils.createDataElement('POW', json.NP3));
    abilityElement.appendChild(Utils.createDataElement('DEX', json.NP4));
    abilityElement.appendChild(Utils.createDataElement('APP', json.NP5));
    abilityElement.appendChild(Utils.createDataElement('SIZ', json.NP6));
    abilityElement.appendChild(Utils.createDataElement('INT', json.NP7));
    abilityElement.appendChild(Utils.createDataElement('EDU', json.NP8));
    abilityElement.appendChild(Utils.createDataElement('db', json.dmg_bonus));

    /*
     *戦闘技能
     */
    const combatElement = Utils.createDataElement('戦闘技能', '');
    gameCharacter.detailDataElement.appendChild(combatElement);
    let combatSkillNames = [
      '回避',
      'キック',
      '組み付き',
      'こぶし(パンチ)',
      '頭突き',
      '投擲',
      'マーシャルアーツ',
      '拳銃',
      'サブマシンガン',
      'ショットガン',
      'マシンガン',
      'ライフル',
    ];
    if (json.TBAName) {
      combatSkillNames = combatSkillNames.concat(json.TBAName);
    }
    for (let i = 0; i < combatSkillNames.length; i++) {
      const skillName = combatSkillNames[i];
      if (!skillName) {
        continue;
      }
      const skillPoint = json.TBAP[i];
      combatElement.appendChild(Utils.createDataElement(skillName, skillPoint));
    }

    /*
     * 探索技能
     */
    const exploreElement = Utils.createDataElement('探索技能', '');
    gameCharacter.detailDataElement.appendChild(exploreElement);
    let exploreSkillNames = [
      '応急手当',
      '鍵開け',
      '隠す',
      '隠れる',
      '聞き耳',
      '忍び歩き',
      '写真術',
      '精神分析',
      '追跡',
      '登攀',
      '図書館',
      '目星',
    ];
    if (json.TFAName) {
      exploreSkillNames = exploreSkillNames.concat(json.TFAName);
    }
    for (let i = 0; i < exploreSkillNames.length; i++) {
      const skillName = exploreSkillNames[i];
      if (!skillName) {
        continue;
      }
      const skillPoint = json.TFAP[i];
      exploreElement.appendChild(
        Utils.createDataElement(skillName, skillPoint)
      );
    }

    /*
     * 行動技能
     */
    const actionElement = Utils.createDataElement('行動技能', '');
    gameCharacter.detailDataElement.appendChild(actionElement);
    let actionSkillNames = [
      json.unten_bunya ? `運転(${json.unten_bunya})` : '運転',
      '機械修理',
      '重機械操作',
      '乗馬',
      '水泳',
      json.seisaku_bunya ? `製作(${json.seisaku_bunya})` : '製作',
      json.main_souju_norimono ? `操縦(${json.main_souju_norimono})` : '操縦',
      '跳躍',
      '電気修理',
      'ナビゲート',
      '変装',
    ];
    if (json.TAAName) {
      actionSkillNames = actionSkillNames.concat(json.TAAName);
    }
    for (let i = 0; i < actionSkillNames.length; i++) {
      const skillName = actionSkillNames[i];
      if (!skillName) {
        continue;
      }
      const skillPoint = json.TAAP[i];
      actionElement.appendChild(Utils.createDataElement(skillName, skillPoint));
    }

    /*
     * 交渉技能
     */
    const negotiateElement = Utils.createDataElement('交渉技能', '');
    gameCharacter.detailDataElement.appendChild(negotiateElement);
    let negotiateSkillNames = [
      '言いくるめ',
      '信用',
      '説得',
      '値切り',
      json.mylang_name ? `母国語(${json.mylang_name})` : '母国語',
    ];
    if (json.TCAName) {
      negotiateSkillNames = negotiateSkillNames.concat(json.TCAName);
    }
    for (let i = 0; i < negotiateSkillNames.length; i++) {
      const skillName = negotiateSkillNames[i];
      if (!skillName) {
        continue;
      }
      const skillPoint = json.TCAP[i];
      negotiateElement.appendChild(
        Utils.createDataElement(skillName, skillPoint)
      );
    }

    /*
     * 知識技能
     */
    const knowledgeElement = Utils.createDataElement('知識技能', '');
    gameCharacter.detailDataElement.appendChild(knowledgeElement);
    let knowledgeSkillNames = [
      '医学',
      'オカルト',
      '化学',
      null, // "クトゥルフ神話",        // リソース欄に記載するため、こちらには記載しない
      json.geijutu_bunya ? `芸術(${json.geijutu_bunya})` : '芸術',
      '経理',
      '考古学',
      'コンピューター',
      '心理学',
      '人類学',
      '生物学',
      '地質学',
      '電子工学',
      '天文学',
      '博物学',
      '物理学',
      '法律',
      '薬学',
      '歴史',
    ];
    if (json.TKAName) {
      knowledgeSkillNames = knowledgeSkillNames.concat(json.TKAName);
    }
    for (let i = 0; i < knowledgeSkillNames.length; i++) {
      const skillName = knowledgeSkillNames[i];
      if (!skillName) {
        continue;
      }
      const skillPoint = json.TKAP[i];
      knowledgeElement.appendChild(
        Utils.createDataElement(skillName, skillPoint)
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Cthulhu';
    // チャパレ内容
    let cp = `//-----リソース管理
現在HP {HP}
現在MP {MP}
現在SAN値 {SAN}
CC<={SAN}  :SANチェック
不定領域 {不定領域}

//-----神話技能
CC<={神話技能}  :クトゥルフ神話技能

//-----戦闘技能
${combatSkillNames
  .filter((name) => name)
  .map((name) => `CC<={${name}}  :${name}`)
  .join('\n')}

//-----探索技能
${exploreSkillNames
  .filter((name) => name)
  .map((name) => `CC<={${name}}  :${name}`)
  .join('\n')}

//-----行動技能
${actionSkillNames
  .filter((name) => name)
  .map((name) => `CC<={${name}}  :${name}`)
  .join('\n')}

//-----交渉技能
${negotiateSkillNames
  .filter((name) => name)
  .map((name) => `CC<={${name}}  :${name}`)
  .join('\n')}

//-----知識技能
${knowledgeSkillNames
  .filter((name) => name)
  .map((name) => `CC<={${name}}  :${name}`)
  .join('\n')}

//-----能力値×５ロール
CC<=({STR}*5)  :STRx5
CC<=({CON}*5)  :CONx5
CC<=({DEX}*5)  :DEXx5
CC<=({APP}*5)  :APPx5
CC<=({EDU}*5)  :EDUx5:知識
CC<=({INT}*5)  :INTx5:ｱｲﾃﾞｱ
CC<=({POW}*5)  :POWx5:幸運
`;
    if (!json.armName) {
      cp += '\n//-----武器・防具\n';
      for (let i = 0; i < json.arms_name.length; i++) {
        const armName = json.arms_name[i];
        if (!armName) {
          continue;
        }
        const armHit = json.arms_hit[i];
        const armDamage = json.arms_damage[i].replace('db', '{db}');
        cp += `CCB<=${armHit}  :${armName}\n${armDamage}   :${armName}(ダメージ)\n`;
      }
    }

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}

/**
 * Charaeno クトゥルフ神話TRPG
 * https://charaeno.sakasin.net/
 */
class CthulhuCharaeoFactory {
  create = CthulhuCharaeoFactory.create;

  private static create(json: Investigator, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.name,
      1,
      ''
    );

    /*
     * リソース
     */
    const resourceElement = Utils.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      Utils.createResourceElement('HP', json.attribute.hp, json.attribute.hp)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('MP', json.attribute.mp, json.attribute.mp)
    );
    resourceElement.appendChild(
      Utils.createResourceElement(
        'SAN',
        json.attribute.san.max,
        json.attribute.san.value
      )
    );
    const mythosSkill: Skill = json.skills.find(
      (skill) => skill.name === 'クトゥルフ神話'
    );
    resourceElement.appendChild(
      Utils.createResourceElement('神話技能', 99, mythosSkill.value)
    );
    const sanDanger = Math.floor(json.attribute.san.value * 0.8);
    resourceElement.appendChild(
      Utils.createResourceElement('不定領域', 99, sanDanger)
    );

    /*
     *情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(Utils.createDataElement('PL', ''));
    // 持ち物
    const items = json.possessions
      .map((possession) => `${possession.name}(${possession.count})`)
      .join('/');
    infoElement.appendChild(Utils.createNoteElement('持ち物', items));
    infoElement.appendChild(Utils.createNoteElement('プロフ', json.note));
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     *能力値
     */
    const abilityElement = Utils.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    ['str', 'con', 'pow', 'dex', 'app', 'siz', 'int', 'edu'].forEach((ab) => {
      abilityElement.appendChild(
        Utils.createDataElement(ab.toUpperCase(), json.characteristics[ab])
      );
    });
    abilityElement.appendChild(
      Utils.createDataElement('db', json.attribute.db)
    );

    /*
     *戦闘技能
     */
    const combatElement = Utils.createDataElement('戦闘技能', '');
    gameCharacter.detailDataElement.appendChild(combatElement);
    let combatSkills: Skill[] = [findSkill(json, '回避')];
    combatSkills = combatSkills.concat(sliceSkills(json, 'キック')); // キック ~ 最後
    combatSkills.push(findSkill(json, '投擲'));
    combatSkills.push(findSkill(json, 'マーシャルアーツ'));
    combatSkills = combatSkills.concat(sliceSkills(json, '拳銃', 'キック'));
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
      '応急手当',
      '鍵開け',
      '隠す',
      '隠れる',
      '聞き耳',
      '忍び歩き',
      '写真術',
      '精神分析',
      '追跡',
      '登攀',
      '図書館',
      '目星',
    ].map((name) => findSkill(json, name));
    for (const skill of exploreSkills) {
      exploreElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    /*
     * 行動技能
     */
    const actionElement = Utils.createDataElement('行動技能', '');
    gameCharacter.detailDataElement.appendChild(actionElement);
    let actionSkills: Skill[] = sliceSkills(json, '運転（自動車）', '応急手当');
    actionSkills = actionSkills.concat(
      ['機械修理', '重機械操作', '乗馬'].map((name) => findSkill(json, name))
    );
    actionSkills = actionSkills.concat(sliceSkills(json, '水泳', '精神分析'));
    const control = json.skills.find((skill) => skill.name.startsWith('操縦'));
    actionSkills = actionSkills.concat(
      sliceSkills(json, control.name, '地質学')
    );
    actionSkills = actionSkills.concat(
      ['跳躍', '電気修理', 'ナビゲート', '変装'].map((name) =>
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
    let negotiateSkills: Skill[] = [
      '言いくるめ',
      '信用',
      '説得',
      '値切り',
    ].map((name) => findSkill(json, name));
    const otherlang = json.skills.find((skill) =>
      skill.name.startsWith('ほかの言語')
    );
    negotiateSkills = negotiateSkills.concat(
      sliceSkills(json, otherlang.name, 'マーシャルアーツ')
    );
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
    let knowledgeSkills: Skill[] = [
      '医学',
      'オカルト',
      '化学',
      // 'クトゥルフ神話',        // リソース欄に記載するため、こちらには記載しない
    ].map((name) => findSkill(json, name));
    const art = json.skills.find((skill) => skill.name.startsWith('芸術'));
    knowledgeSkills = knowledgeSkills.concat(
      sliceSkills(json, art.name, '忍び歩き')
    );
    knowledgeSkills = knowledgeSkills.concat(
      [
        '心理学',
        '人類学',
        '生物学',
        '地質学',
        '電子工学',
        '天文学',
        '博物学',
        '物理学',
        '法律',
        '薬学',
        '歴史',
      ].map((name) => findSkill(json, name))
    );
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
    const otherSkills = sliceSkills(json, otherSkill.name, '拳銃');
    for (const skill of otherSkills) {
      otherElement.appendChild(
        Utils.createDataElement(skill.name, skill.value)
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Cthulhu';
    // チャパレ内容
    let cp = `//-----リソース管理
現在HP {HP}
現在MP {MP}
現在SAN値 {SAN}
CC<={SAN}  :SANチェック
不定領域 {不定領域}

//-----神話技能
CC<={神話技能}  :クトゥルフ神話技能

//-----戦闘技能
${combatSkills.map((skill) => `CC<={${skill.name}}  :${skill.name}`).join('\n')}

//-----探索技能
${exploreSkills
  .map((skill) => `CC<={${skill.name}}  :${skill.name}`)
  .join('\n')}

//-----行動技能
${actionSkills.map((skill) => `CC<={${skill.name}}  :${skill.name}`).join('\n')}

//-----交渉技能
${negotiateSkills
  .map((skill) => `CC<={${skill.name}}  :${skill.name}`)
  .join('\n')}

//-----知識技能
${knowledgeSkills
  .map((skill) => `CC<={${skill.name}}  :${skill.name}`)
  .join('\n')}

//-----その他技能
${otherSkills.map((skill) => `CC<={${skill.name}}  :${skill.name}`).join('\n')}

//-----能力値×５ロール
CC<=({STR}*5)  :STRx5
CC<=({CON}*5)  :CONx5
CC<=({DEX}*5)  :DEXx5
CC<=({APP}*5)  :APPx5
CC<=({EDU}*5)  :EDUx5:知識
CC<=({INT}*5)  :INTx5:ｱｲﾃﾞｱ
CC<=({POW}*5)  :POWx5:幸運
`;
    cp += '\n//-----武器・防具\n';
    for (const wapon of json.wapons) {
      const hit = wapon.value === '' ? `{${wapon.name}}` : wapon.value;
      const damage = wapon.damage.replace('+DB', '{db}');
      cp += `CCB<=${hit}  :${wapon.name}\n${damage}   :${wapon.name}(ダメージ)\n`;
    }

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
  birthplace: string; // 出身
  degree: string; // 学校・学位
  mentalDisorder: string; // 精神的な障害
  age: string; // 年齢
  sex: string; // 性別

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
    db: string; // ダメージ・ボーナス。0の場合には "+0" となる
    san: {
      value: number; // 正気度
      max: number; // 最大正気度
    };
  };

  skills: Array<Skill>;
  wapons: Array<Wapon>;
  possessions: Array<Possession>; // 装備と所持品

  personalData: {
    address: string; // 住所
    description: string; // 描写
    family: string; // 家族＆友人
    insanity: string; // 狂気の症状
    injuries: string; // 負傷
    scar: string; // 傷跡など
  };

  credit: {
    income: string; // 収入
    cash: string; // 手持ち現金
    deposit: string; // 預金
    personalProperty: string; // 個人資産
    realEstate: string; // 不動産
  };

  mythosTomes: string; // 読んだクトゥルフ神話の魔導書
  artifactsAndSpells: string; // アーティファクト／学んだ呪文
  encounters: string; // 遭遇した超自然の存在
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
  hp: string; // 耐久力
}

interface Possession {
  name: string; // 名前
  count: string; // 所持数。数値とは限らないことに注意
  detail: string; // 物品の詳細説明
}
