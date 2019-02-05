import { ChatPalette } from '@udonarium/chat-palette';
import { DataElement } from '@udonarium/data-element';

import { CustomCharacter } from '../custom-character';

/**
 * キャラクターシート倉庫 ディヴァインチャージャー
 * https://character-sheets.appspot.com/divinecharger/
 */
export class DivinechargerGenerator {
  static generateByAppspot(
    json: any,
    url: string,
    imageIdentifier: string
  ): CustomCharacter[] {
    const gameCharacters: CustomCharacter[] = [];

    /*
     * キャラクター
     */
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter();

    /*
     * common
     */
    gameCharacter.commonDataElement.appendChild(
      DataElement.create(
        'name',
        json.base.name,
        {},
        'name_' + gameCharacter.identifier
      )
    );
    gameCharacter.commonDataElement.appendChild(
      DataElement.create('size', 1, {}, 'size_' + gameCharacter.identifier)
    );

    if (
      gameCharacter.imageDataElement.getFirstElementByName('imageIdentifier')
    ) {
      gameCharacter.imageDataElement.getFirstElementByName(
        'imageIdentifier'
      ).value = imageIdentifier || '';
      gameCharacter.imageDataElement
        .getFirstElementByName('imageIdentifier')
        .update();
    }

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
      DataElement.create(
        'PL',
        json.base.player || '',
        {},
        'PL_' + gameCharacter.identifier
      )
    );
    infoElement.appendChild(
      DataElement.create(
        '種族',
        json.base.race,
        {},
        '種族' + gameCharacter.identifier
      )
    );
    infoElement.appendChild(
      DataElement.create(
        '職業',
        `${json.base.mainjob}/${json.base.subjob}`,
        {},
        '職業' + gameCharacter.identifier
      )
    );
    infoElement.appendChild(
      DataElement.create(
        'レベル',
        json.base.level,
        {},
        'レベル' + gameCharacter.identifier
      )
    );
    infoElement.appendChild(
      DataElement.create(
        '説明',
        json.base.memo,
        { type: 'note' },
        '説明' + gameCharacter.identifier
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
     * 主能力値
     */
    const abilityElement = DataElement.create(
      '主能力値',
      '',
      {},
      '主能力値' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      DataElement.create(
        '体力',
        json.ability.current.strength,
        {},
        '体力_' + gameCharacter.identifier
      )
    );
    abilityElement.appendChild(
      DataElement.create(
        '感覚',
        json.ability.current.sense,
        {},
        '感覚_' + gameCharacter.identifier
      )
    );
    abilityElement.appendChild(
      DataElement.create(
        '機敏',
        json.ability.current.agility,
        {},
        '機敏_' + gameCharacter.identifier
      )
    );
    abilityElement.appendChild(
      DataElement.create(
        '知性',
        json.ability.current.intelligence,
        {},
        '知性_' + gameCharacter.identifier
      )
    );
    abilityElement.appendChild(
      DataElement.create(
        '精神',
        json.ability.current.mind,
        {},
        '精神_' + gameCharacter.identifier
      )
    );
    /*
     * 戦闘値／副能力値
     */
    const battleabilityElement = DataElement.create(
      '戦闘値／副能力値',
      '',
      {},
      '戦闘値／副能力値' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(battleabilityElement);
    battleabilityElement.appendChild(
      DataElement.create(
        'HP',
        json.subability.current.maxhp,
        { type: 'numberResource', currentValue: json.subability.current.maxhp },
        'HP' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '行動値',
        json.battleability.current.action,
        {},
        '行動値_' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '命中',
        json.battleability.current.hit,
        {},
        '命中_' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '回避',
        json.battleability.current.dodge,
        {},
        '回避_' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '発動',
        json.battleability.current.activate,
        {},
        '発動_' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '抵抗',
        json.battleability.current.resistance,
        {},
        '抵抗_' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '物理D',
        json.subability.current.physicald,
        {},
        '物理D_' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '魔法D',
        json.subability.current.magicald,
        {},
        '魔法D_' + gameCharacter.identifier
      )
    );
    battleabilityElement.appendChild(
      DataElement.create(
        '財産',
        json.subability.current.money,
        {},
        '財産_' + gameCharacter.identifier
      )
    );
    /*
     * 神聖石／所持金／ポイント
     */
    const pointElement = DataElement.create(
      '神聖石／所持金／ポイント',
      '',
      {},
      '神聖石／所持金／ポイント' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(pointElement);
    pointElement.appendChild(
      DataElement.create(
        'GR',
        json.points.gr,
        {},
        'GR' + gameCharacter.identifier
      )
    );
    pointElement.appendChild(
      DataElement.create(
        '神聖石',
        json.points.divinestone,
        {},
        '神聖石_' + gameCharacter.identifier
      )
    );
    pointElement.appendChild(
      DataElement.create(
        '所持金',
        json.points.money,
        {},
        '所持金_' + gameCharacter.identifier
      )
    );
    pointElement.appendChild(
      DataElement.create(
        '借金',
        json.points.limit || '2000',
        { type: 'numberResource', currentValue: json.points.debt || '0' },
        '借金_' + gameCharacter.identifier
      )
    );
    pointElement.appendChild(
      DataElement.create(
        'GACHAp',
        8,
        { type: 'numberResource', currentValue: json.points.gachap || '0' },
        'GACHAp_' + gameCharacter.identifier
      )
    );
    /*
     * スキル
     */
    const divineSkill = [
      '神聖課金',
      '神聖増力',
      '神聖装着',
      'ファイナルストライク'
    ];
    const skillElement = DataElement.create(
      'スキル',
      '',
      {},
      'スキル' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(skillElement);
    let skillCount = 0;
    for (const skill of json.skills) {
      if (!skill.name || divineSkill.includes(skill.name)) {
        continue;
      }
      skillCount++;
      skillElement.appendChild(
        DataElement.create(
          `スキル${skillCount}`,
          `《${skill.name}》＿${skill.timing}／${skill.range}／${
            skill.target
          }／${skill.effect}`,
          { type: 'note' },
          `スキル${skillCount}_${gameCharacter.identifier}`
        )
      );
      skillElement.appendChild(
        DataElement.create(
          `回数${skillCount}`,
          skill.count2 || '0',
          { type: 'numberResource', currentValue: skill.count1 || '0' },
          `回数${skillCount}_${gameCharacter.identifier}`
        )
      );
    }
    /*
     * 消耗品
     */
    const expendableElement = DataElement.create(
      '消耗品',
      '',
      {},
      '消耗品' + gameCharacter.identifier
    );
    gameCharacter.detailDataElement.appendChild(expendableElement);
    for (const expendable of json.expendables) {
      if (!expendable.name) {
        continue;
      }
      expendableElement.appendChild(
        DataElement.create(
          expendable.name,
          expendable.count,
          { type: 'numberResource', currentValue: expendable.count },
          `${expendable.name}_${gameCharacter.identifier}`
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
    palette.dicebot = '';
    // チャパレ内容
    let cp = `2D6+

//------GACHA
1B6 GACHA[単発]
3B6 GACHA[3連]
6B6 GACHA[6連]

//------主能力値
2D6+{体力} 【体力】
2D6+{感覚} 【感覚】
2D6+{機敏} 【機敏】
2D6+{知性} 【知性】
2D6+{精神} 【精神】

//------戦闘値
2D6+{命中} 【命中】
2D6+{回避} 【回避】
2D6+{発動} 【発動】
2D6+{抵抗} 【抵抗】
`;
    cp += '\n//------武器\n';
    for (const weapon of json.weapons) {
      if (!weapon.name) {
        continue;
      }
      if (weapon.type === '魔') {
        cp += `2D6+{発動}+${weapon.hit} ${weapon.name}／発動\n`;
        cp += `${weapon.damage}D6+{魔法D} ${weapon.name}／魔法ダメージ\n`;
      } else {
        cp += `2D6+{命中}+${weapon.hit} ${weapon.name}／命中\n`;
        cp += `${weapon.damage}D6+{物理D} ${weapon.name}／物理ダメージ\n`;
      }
      if (weapon.option) {
        cp += `《${weapon.option}》（${weapon.name}）＿${
          weapon.optiontiming
        }／${weapon.optionrange}／${weapon.optiontarget}／${
          weapon.optioneffect
        }\n`;
      }
    }
    cp += '\n//------盾／鎧／装飾品\n';
    cp += json.shields
      .filter((shield: any) => shield.name && shield.option)
      .reduce(
        (txt: string, shield: any) =>
          txt +
          `《${shield.option}》（${shield.name}）＿${shield.optiontiming}／${
            shield.optionrange
          }／${shield.optiontarget}／${shield.optioneffect}\n`,
        ''
      );
    cp += json.armours
      .filter((armour: any) => armour.name && armour.option)
      .reduce(
        (txt: string, armour: any) =>
          txt +
          `《${armour.option}》（${armour.name}）＿${armour.optiontiming}／${
            armour.optionrange
          }／${armour.optiontarget}／${armour.optioneffect}\n`,
        ''
      );
    cp += json.accessories
      .filter((accessory: any) => accessory.name && accessory.option)
      .reduce(
        (txt: string, accessory: any) =>
          txt +
          `《${accessory.option}》（${accessory.name}）＿${
            accessory.optiontiming
          }／${accessory.optionrange}／${accessory.optiontarget}／${
            accessory.optioneffect
          }\n`,
        ''
      );
    cp += '\n//------神聖能力／スキル\n';
    cp += json.skills
      .filter((expendable: any) => expendable.name)
      .reduce(
        (txt: string, skill: any) =>
          txt +
          `《${skill.name}》＿${skill.timing}／${skill.range}／${
            skill.target
          }／${skill.effect}\n`,
        ''
      );
    cp += '\n//------消耗品\n';
    cp += json.expendables
      .filter((expendable: any) => expendable.name)
      .reduce(
        (txt: string, expendable: any) =>
          txt +
          `「${expendable.name}」＿${expendable.timing}／${
            expendable.effect
          }\n`,
        ''
      );

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    gameCharacters.push(gameCharacter);

    /*
     * 武器
     */
    for (const weapon of json.weapons) {
      if (!weapon.name) {
        continue;
      }
      const weaponCharacter: CustomCharacter = CustomCharacter.createCustomCharacter();

      /*
       * common
       */
      weaponCharacter.commonDataElement.appendChild(
        DataElement.create(
          'name',
          weapon.name,
          {},
          'name_' + weaponCharacter.identifier
        )
      );
      weaponCharacter.commonDataElement.appendChild(
        DataElement.create('size', 1, {}, 'size_' + weaponCharacter.identifier)
      );

      if (
        weaponCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        )
      ) {
        weaponCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        ).value = imageIdentifier || '';
        weaponCharacter.imageDataElement
          .getFirstElementByName('imageIdentifier')
          .update();
      }

      /*
       *情報
       */
      const weaponInfo = DataElement.create(
        '情報',
        '',
        {},
        '情報' + weaponCharacter.identifier
      );
      weaponCharacter.detailDataElement.appendChild(weaponInfo);
      weaponInfo.appendChild(
        DataElement.create(
          '種別',
          `${weapon.type}(${weapon.usage})`,
          {},
          '種別_' + weaponCharacter.identifier
        )
      );
      weaponInfo.appendChild(
        DataElement.create(
          '☆',
          weapon.reality || '',
          {},
          '☆_' + weaponCharacter.identifier
        )
      );
      weaponInfo.appendChild(
        DataElement.create(
          '命／発',
          weapon.hit || '0',
          {},
          '命／発_' + weaponCharacter.identifier
        )
      );
      weaponInfo.appendChild(
        DataElement.create(
          '距離',
          weapon.range,
          {},
          '距離_' + weaponCharacter.identifier
        )
      );
      weaponInfo.appendChild(
        DataElement.create(
          'ダメージ',
          `${weapon.damage}d`,
          {},
          'ダメージ_' + weaponCharacter.identifier
        )
      );
      weaponInfo.appendChild(
        DataElement.create(
          '耐久',
          weapon.endurance2,
          {
            type: 'numberResource',
            currentValue: weapon.endurance1 || weapon.endurance2
          },
          '耐久_' + weaponCharacter.identifier
        )
      );
      weaponInfo.appendChild(
        DataElement.create(
          '付随／神能力',
          weapon.option
            ? `《${weapon.option}》＿${weapon.optiontiming}／${
                weapon.optionrange
              }／${weapon.optiontarget}／${weapon.optioneffect}`
            : '',
          { type: 'note' },
          '付随／神能力_' + weaponCharacter.identifier
        )
      );

      domParser.parseFromString(
        weaponCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = DataElement.create(
        '所有者（並び替え用）',
        '',
        {},
        '所有者（並び替え用）' + weaponCharacter.identifier
      );
      weaponCharacter.detailDataElement.appendChild(sortElement);
      sortElement.appendChild(
        DataElement.create(
          'PL',
          json.base.player || '',
          {},
          'PL_' + weaponCharacter.identifier
        )
      );
      sortElement.appendChild(
        DataElement.create(
          '行動値',
          json.base.name,
          {},
          '行動値_' + weaponCharacter.identifier
        )
      );

      const weaponPalette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      weaponPalette.dicebot = '';
      // チャパレ内容
      let weaponCp = '';
      if (weapon.type === '魔') {
        weaponCp += `2D6+${json.battleability.current.activate}+${weapon.hit} ${
          weapon.name
        }（${json.base.name}）／発動\n`;
        weaponCp += `${weapon.damage}D6+${json.subability.current.magicald} ${
          weapon.name
        }（${json.base.name}）／魔法ダメージ\n`;
      } else {
        weaponCp += `2D6+${json.battleability.current.hit}+${weapon.hit} ${
          weapon.name
        }（${json.base.name}）／命中\n`;
        weaponCp += `${weapon.damage}D6+${json.subability.current.physicald} ${
          weapon.name
        }（${json.base.name}）／物理ダメージ\n`;
      }
      if (weapon.option) {
        weaponCp += `《${weapon.option}》（${weapon.name}／${
          json.base.name
        }）＿${weapon.optiontiming}／${weapon.optionrange}／${
          weapon.optiontarget
        }／${weapon.optioneffect}\n`;
      }

      weaponPalette.setPalette(weaponCp);
      weaponPalette.initialize();
      weaponCharacter.appendChild(weaponPalette);

      weaponCharacter.update();
      gameCharacters.push(weaponCharacter);
    }

    /*
     * 盾
     */
    for (const shield of json.shields) {
      if (!shield.name) {
        continue;
      }
      const shieldCharacter: CustomCharacter = CustomCharacter.createCustomCharacter();

      /*
       * common
       */
      shieldCharacter.commonDataElement.appendChild(
        DataElement.create(
          'name',
          shield.name,
          {},
          'name_' + shieldCharacter.identifier
        )
      );
      shieldCharacter.commonDataElement.appendChild(
        DataElement.create('size', 1, {}, 'size_' + shieldCharacter.identifier)
      );

      if (
        shieldCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        )
      ) {
        shieldCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        ).value = imageIdentifier || '';
        shieldCharacter.imageDataElement
          .getFirstElementByName('imageIdentifier')
          .update();
      }

      /*
       * 情報
       */
      const shieldInfo = DataElement.create(
        '情報',
        '',
        {},
        '情報' + shieldCharacter.identifier
      );
      shieldCharacter.detailDataElement.appendChild(shieldInfo);
      shieldInfo.appendChild(
        DataElement.create(
          '種別',
          shield.type,
          {},
          '種別_' + shieldCharacter.identifier
        )
      );
      shieldInfo.appendChild(
        DataElement.create(
          '☆',
          shield.reality || '',
          {},
          '☆_' + shieldCharacter.identifier
        )
      );
      shieldInfo.appendChild(
        DataElement.create(
          '回避',
          shield.dodge || '0',
          {},
          '回避_' + shieldCharacter.identifier
        )
      );
      shieldInfo.appendChild(
        DataElement.create(
          '抵抗',
          shield.resistance || '0',
          {},
          '抵抗_' + shieldCharacter.identifier
        )
      );
      shieldInfo.appendChild(
        DataElement.create(
          '装甲',
          shield.armor || '0',
          {},
          '装甲' + shieldCharacter.identifier
        )
      );
      shieldInfo.appendChild(
        DataElement.create(
          '耐久',
          shield.endurance2,
          {
            type: 'numberResource',
            currentValue: shield.endurance1 || shield.endurance2
          },
          '耐久_' + shieldCharacter.identifier
        )
      );
      shieldInfo.appendChild(
        DataElement.create(
          '付随／神能力',
          shield.option
            ? `《${shield.option}》＿${shield.optiontiming}／${
                shield.optionrange
              }／${shield.optiontarget}／${shield.optioneffect}`
            : '',
          { type: 'note' },
          '付随／神能力_' + shieldCharacter.identifier
        )
      );

      domParser.parseFromString(
        shieldCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = DataElement.create(
        '所有者（並び替え用）',
        '',
        {},
        '所有者（並び替え用）' + shieldCharacter.identifier
      );
      shieldCharacter.detailDataElement.appendChild(sortElement);
      sortElement.appendChild(
        DataElement.create(
          'PL',
          json.base.player || '',
          {},
          'PL_' + shieldCharacter.identifier
        )
      );
      sortElement.appendChild(
        DataElement.create(
          '行動値',
          json.base.name,
          {},
          '行動値_' + shieldCharacter.identifier
        )
      );

      const shieldPalette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      shieldPalette.dicebot = '';
      // チャパレ内容
      let shieldCp = '';
      if (shield.option) {
        shieldCp += `《${shield.option}》（${shield.name}／${
          json.base.name
        }）＿${shield.optiontiming}／${shield.optionrange}／${
          shield.optiontarget
        }／${shield.optioneffect}\n`;
      }

      shieldPalette.setPalette(shieldCp);
      shieldPalette.initialize();
      shieldCharacter.appendChild(shieldPalette);

      shieldCharacter.update();
      gameCharacters.push(shieldCharacter);
    }

    /*
     * 鎧
     */
    for (const armour of json.armours) {
      if (!armour.name) {
        continue;
      }
      const armourCharacter: CustomCharacter = CustomCharacter.createCustomCharacter();

      /*
       * common
       */
      armourCharacter.commonDataElement.appendChild(
        DataElement.create(
          'name',
          armour.name,
          {},
          'name_' + armourCharacter.identifier
        )
      );
      armourCharacter.commonDataElement.appendChild(
        DataElement.create('size', 1, {}, 'size_' + armourCharacter.identifier)
      );

      if (
        armourCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        )
      ) {
        armourCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        ).value = imageIdentifier || '';
        armourCharacter.imageDataElement
          .getFirstElementByName('imageIdentifier')
          .update();
      }

      /*
       * 情報
       */
      const armourInfo = DataElement.create(
        '情報',
        '',
        {},
        '情報' + armourCharacter.identifier
      );
      armourCharacter.detailDataElement.appendChild(armourInfo);
      armourInfo.appendChild(
        DataElement.create(
          '種別',
          armour.type,
          {},
          '種別_' + armourCharacter.identifier
        )
      );
      armourInfo.appendChild(
        DataElement.create(
          '☆',
          armour.reality || '',
          {},
          '☆_' + armourCharacter.identifier
        )
      );
      armourInfo.appendChild(
        DataElement.create(
          '行動',
          armour.action || '0',
          {},
          '行動_' + armourCharacter.identifier
        )
      );
      armourInfo.appendChild(
        DataElement.create(
          '装甲',
          armour.armor || '0',
          {},
          '装甲' + armourCharacter.identifier
        )
      );
      armourInfo.appendChild(
        DataElement.create(
          '耐久',
          armour.endurance2,
          {
            type: 'numberResource',
            currentValue: armour.endurance1 || armour.endurance2
          },
          '耐久_' + armourCharacter.identifier
        )
      );
      armourInfo.appendChild(
        DataElement.create(
          '付随／神能力',
          armour.option
            ? `《${armour.option}》＿${armour.optiontiming}／${
                armour.optionrange
              }／${armour.optiontarget}／${armour.optioneffect}`
            : '',
          { type: 'note' },
          '付随／神能力_' + armourCharacter.identifier
        )
      );

      domParser.parseFromString(
        armourCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = DataElement.create(
        '所有者（並び替え用）',
        '',
        {},
        '所有者（並び替え用）' + armourCharacter.identifier
      );
      armourCharacter.detailDataElement.appendChild(sortElement);
      sortElement.appendChild(
        DataElement.create(
          'PL',
          json.base.player || '',
          {},
          'PL_' + armourCharacter.identifier
        )
      );
      sortElement.appendChild(
        DataElement.create(
          '行動値',
          json.base.name,
          {},
          '行動値_' + armourCharacter.identifier
        )
      );

      const armourPalette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      armourPalette.dicebot = '';
      // チャパレ内容
      let armourCp = '';
      if (armour.option) {
        armourCp += `《${armour.option}》（${armour.name}／${
          json.base.name
        }）＿${armour.optiontiming}／${armour.optionrange}／${
          armour.optiontarget
        }／${armour.optioneffect}\n`;
      }

      armourPalette.setPalette(armourCp);
      armourPalette.initialize();
      armourCharacter.appendChild(armourPalette);

      armourCharacter.update();
      gameCharacters.push(armourCharacter);
    }

    /*
     * 装飾品
     */
    for (const accessory of json.accessories) {
      if (!accessory.name) {
        continue;
      }
      const accessoryCharacter: CustomCharacter = CustomCharacter.createCustomCharacter();

      /*
       * common
       */
      accessoryCharacter.commonDataElement.appendChild(
        DataElement.create(
          'name',
          accessory.name,
          {},
          'name_' + accessoryCharacter.identifier
        )
      );
      accessoryCharacter.commonDataElement.appendChild(
        DataElement.create(
          'size',
          1,
          {},
          'size_' + accessoryCharacter.identifier
        )
      );

      if (
        accessoryCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        )
      ) {
        accessoryCharacter.imageDataElement.getFirstElementByName(
          'imageIdentifier'
        ).value = imageIdentifier || '';
        accessoryCharacter.imageDataElement
          .getFirstElementByName('imageIdentifier')
          .update();
      }

      /*
       * 情報
       */
      const accessoryInfo = DataElement.create(
        '情報',
        '',
        {},
        '情報' + accessoryCharacter.identifier
      );
      accessoryCharacter.detailDataElement.appendChild(accessoryInfo);
      accessoryInfo.appendChild(
        DataElement.create(
          '種別',
          accessory.type,
          {},
          '種別_' + accessoryCharacter.identifier
        )
      );
      accessoryInfo.appendChild(
        DataElement.create(
          '☆',
          accessory.reality || '',
          {},
          '☆_' + accessoryCharacter.identifier
        )
      );
      accessoryInfo.appendChild(
        DataElement.create(
          '耐久',
          accessory.endurance2,
          {
            type: 'numberResource',
            currentValue: accessory.endurance1 || accessory.endurance2
          },
          '耐久_' + accessoryCharacter.identifier
        )
      );
      accessoryInfo.appendChild(
        DataElement.create(
          '付随／神能力',
          accessory.option
            ? `《${accessory.option}》＿${accessory.optiontiming}／${
                accessory.optionrange
              }／${accessory.optiontarget}／${accessory.optioneffect}`
            : '',
          { type: 'note' },
          '付随／神能力_' + accessoryCharacter.identifier
        )
      );

      domParser.parseFromString(
        accessoryCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = DataElement.create(
        '所有者（並び替え用）',
        '',
        {},
        '所有者（並び替え用）' + accessoryCharacter.identifier
      );
      accessoryCharacter.detailDataElement.appendChild(sortElement);
      sortElement.appendChild(
        DataElement.create(
          'PL',
          json.base.player || '',
          {},
          'PL_' + accessoryCharacter.identifier
        )
      );
      sortElement.appendChild(
        DataElement.create(
          '行動値',
          json.base.name,
          {},
          '行動値_' + accessoryCharacter.identifier
        )
      );

      const accessoryPalette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      accessoryPalette.dicebot = '';
      // チャパレ内容
      let accessoryCp = '';
      if (accessory.option) {
        accessoryCp += `《${accessory.option}》（${accessory.name}／${
          json.base.name
        }）＿${accessory.optiontiming}／${accessory.optionrange}／${
          accessory.optiontarget
        }／${accessory.optioneffect}\n`;
      }

      accessoryPalette.setPalette(accessoryCp);
      accessoryPalette.initialize();
      accessoryCharacter.appendChild(accessoryPalette);

      accessoryCharacter.update();
      gameCharacters.push(accessoryCharacter);
    }

    return gameCharacters;
  }
}
