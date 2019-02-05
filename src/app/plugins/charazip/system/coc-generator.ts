import { ChatPalette } from '@udonarium/chat-palette';
import { DataElement } from '@udonarium/data-element';

import { CustomCharacter } from '../custom-character';

/**
 * キャラクター保管所 クトゥルフ
 * https://charasheet.vampire-blood.net/list_coc.html
 */
export class CocGenerator {
  static generateByVampireVlood(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter();

    /*
     * common
     */
    const nameElement = DataElement.create(
      'name',
      json.pc_name,
      {},
      'name_' + gameCharacter.identifier
    );
    const sizeElement = DataElement.create(
      'size',
      1,
      {},
      'size_' + gameCharacter.identifier
    );
    gameCharacter.commonDataElement.appendChild(nameElement);
    gameCharacter.commonDataElement.appendChild(sizeElement);

    if (
      gameCharacter.imageDataElement.getFirstElementByName('imageIdentifier')
    ) {
      gameCharacter.imageDataElement.getFirstElementByName(
        'imageIdentifier'
      ).value = '';
      gameCharacter.imageDataElement
        .getFirstElementByName('imageIdentifier')
        .update();
    }

    /*
     * リソース
     */
    const resourceElement = DataElement.create(
      'リソース',
      '',
      {},
      'リソース' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(resourceElement);

    resourceElement.appendChild(
      DataElement.create(
        'HP',
        json.NA9,
        { type: 'numberResource', currentValue: json.NA9 },
        'HP_' + gameCharacter.identifier
      )
    );
    resourceElement.appendChild(
      DataElement.create(
        'MP',
        json.NA10,
        { type: 'numberResource', currentValue: json.NA10 },
        'MP_' + gameCharacter.identifier
      )
    );
    resourceElement.appendChild(
      DataElement.create(
        'SAN',
        json.SAN_Max,
        { type: 'numberResource', currentValue: json.SAN_Left },
        'SAN_' + gameCharacter.identifier
      )
    );
    resourceElement.appendChild(
      DataElement.create(
        '神話技能',
        99,
        { type: 'numberResource', currentValue: json.TKAP[3] },
        '神話技能_' + gameCharacter.identifier
      )
    );
    resourceElement.appendChild(
      DataElement.create(
        '不定領域',
        99,
        { type: 'numberResource', currentValue: json.SAN_Danger },
        '不定領域_' + gameCharacter.identifier
      )
    );

    /*
     *情報
     */
    const infoElement = DataElement.create(
      '情報',
      '',
      {},
      '情報' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      DataElement.create('PL名', '', {}, 'PL名_' + gameCharacter.identifier)
    );
    // 持ち物
    const items = json.item_name.filter((item: any) => item).join('/');
    const arms = json.arms_name.filter((arm: any) => arm).join('/');
    infoElement.appendChild(
      DataElement.create(
        '持ち物',
        `${items}/${arms}`,
        { type: 'note' },
        '持ち物' + gameCharacter.identifier
      )
    );
    infoElement.appendChild(
      DataElement.create(
        'プロフ',
        json.pc_making_memo,
        { type: 'note' },
        'プロフ' + gameCharacter.identifier
      )
    );
    infoElement.appendChild(
      DataElement.create(
        'URL',
        url,
        { type: 'note' },
        'URL_' + gameCharacter.identifier
      )
    );

    /*
     *能力値
     */
    const abilityElement = DataElement.create(
      '能力値',
      '',
      {},
      '能力値' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      DataElement.create('STR', json.NP1, {}, 'STR_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create('CON', json.NP2, {}, 'CON_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create('POW', json.NP3, {}, 'POW_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create('DEX', json.NP4, {}, 'DEX_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create('APP', json.NP5, {}, 'APP_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create('SIZ', json.NP6, {}, 'SIZ_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create('INT', json.NP7, {}, 'INT_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create('EDU', json.NP8, {}, 'EDU_' + gameCharacter.identifier)
    );
    abilityElement.appendChild(
      DataElement.create(
        'db',
        json.dmg_bonus,
        {},
        'db_' + gameCharacter.identifier
      )
    );

    /*
     *戦闘技能
     */
    const combatElement = DataElement.create(
      '戦闘技能',
      '',
      {},
      '戦闘技能' + gameCharacter.identifier
    );
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
      'ライフル'
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
      combatElement.appendChild(
        DataElement.create(
          skillName,
          skillPoint,
          {},
          skillName + '_' + gameCharacter.identifier
        )
      );
    }

    /*
     * 探索技能
     */
    const exploreElement = DataElement.create(
      '探索技能',
      '',
      {},
      '探索技能' + gameCharacter.identifier
    );
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
      '目星'
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
        DataElement.create(
          skillName,
          skillPoint,
          {},
          skillName + '_' + gameCharacter.identifier
        )
      );
    }

    /*
     * 行動技能
     */
    const actionElement = DataElement.create(
      '行動技能',
      '',
      {},
      '行動技能' + gameCharacter.identifier
    );
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
      '変装'
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
      actionElement.appendChild(
        DataElement.create(
          skillName,
          skillPoint,
          {},
          skillName + '_' + gameCharacter.identifier
        )
      );
    }

    /*
     * 交渉技能
     */
    const negotiateElement = DataElement.create(
      '交渉技能',
      '',
      {},
      '交渉技能' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(negotiateElement);
    let negotiateSkillNames = [
      '言いくるめ',
      '信用',
      '説得',
      '値切り',
      json.mylang_name ? `母国語(${json.mylang_name})` : '母国語'
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
        DataElement.create(
          skillName,
          skillPoint,
          {},
          skillName + '_' + gameCharacter.identifier
        )
      );
    }

    /*
     * 知識技能
     */
    const knowledgeElement = DataElement.create(
      '知識技能',
      '',
      {},
      '知識技能' + gameCharacter.identifier
    );
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
      '歴史'
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
        DataElement.create(
          skillName,
          skillPoint,
          {},
          skillName + '_' + gameCharacter.identifier
        )
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(
      gameCharacter.rootDataElement.toXml(),
      'application/xml'
    );

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Cthulhu';
    // チャパレ内容
    let cp = `//-----SAN管理
CC<={SAN}  :SANチェック
現在SAN値 {SAN}

//-----神話技能
CC<={神話技能}  :クトゥルフ神話技能
`;
    cp += '\n//-----戦闘技能\n';
    for (const skillName of combatSkillNames) {
      if (!skillName) {
        continue;
      }
      cp += `CC<={${skillName}}  :${skillName}\n`;
    }
    cp += '\n//-----探索技能\n';
    for (const skillName of exploreSkillNames) {
      if (!skillName) {
        continue;
      }
      cp += `CC<={${skillName}}  :${skillName}\n`;
    }
    cp += '\n//-----行動技能\n';
    for (const skillName of actionSkillNames) {
      if (!skillName) {
        continue;
      }
      cp += `CC<={${skillName}}  :${skillName}\n`;
    }
    cp += '\n//-----交渉技能\n';
    for (const skillName of negotiateSkillNames) {
      if (!skillName) {
        continue;
      }
      cp += `CC<={${skillName}}  :${skillName}\n`;
    }
    cp += '\n//-----知識技能\n';
    for (const skillName of knowledgeSkillNames) {
      if (!skillName) {
        continue;
      }
      cp += `CC<={${skillName}}  :${skillName}\n`;
    }
    cp += `
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
        cp += `CC<=${armHit}  :${armName}\n${armDamage}   :${armName}(ダメージ)\n`;
      }
    }

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
