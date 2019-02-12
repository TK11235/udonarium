import { ChatPalette } from '@udonarium/chat-palette';

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
    {
      const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
        json.base.name,
        1,
        imageIdentifier
      );

      /*
       *情報
       */
      const infoElement = gameCharacter.appendDetailElement('情報');
      infoElement.appendChild(
        gameCharacter.createDataElement('PL', json.base.player || '')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('種族', json.base.race)
      );
      infoElement.appendChild(
        gameCharacter.createDataElement(
          '職業',
          `${json.base.mainjob}/${json.base.subjob}`
        )
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('レベル', json.base.level)
      );
      infoElement.appendChild(
        gameCharacter.createNoteElement('説明', json.base.memo)
      );
      infoElement.appendChild(gameCharacter.createNoteElement('URL', url));

      /*
       * 主能力値
       */
      const abilityElement = gameCharacter.appendDetailElement('主能力値');
      abilityElement.appendChild(
        gameCharacter.createDataElement('体力', json.ability.current.strength)
      );
      abilityElement.appendChild(
        gameCharacter.createDataElement('感覚', json.ability.current.sense)
      );
      abilityElement.appendChild(
        gameCharacter.createDataElement('機敏', json.ability.current.agility)
      );
      abilityElement.appendChild(
        gameCharacter.createDataElement(
          '知性',
          json.ability.current.intelligence
        )
      );
      abilityElement.appendChild(
        gameCharacter.createDataElement('精神', json.ability.current.mind)
      );
      /*
       * 戦闘値／副能力値
       */
      const battleabilityElement = gameCharacter.appendDetailElement(
        '戦闘値／副能力値'
      );
      battleabilityElement.appendChild(
        gameCharacter.createResourceElement(
          'HP',
          json.subability.current.maxhp,
          json.subability.current.maxhp
        )
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement(
          '行動値',
          json.battleability.current.action
        )
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement('命中', json.battleability.current.hit)
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement(
          '回避',
          json.battleability.current.dodge
        )
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement(
          '発動',
          json.battleability.current.activate
        )
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement(
          '抵抗',
          json.battleability.current.resistance
        )
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement(
          '物理D',
          json.subability.current.physicald
        )
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement(
          '魔法D',
          json.subability.current.magicald
        )
      );
      battleabilityElement.appendChild(
        gameCharacter.createDataElement('財産', json.subability.current.money)
      );
      /*
       * 神聖石／所持金／ポイント
       */
      const pointElement = gameCharacter.appendDetailElement(
        '神聖石／所持金／ポイント'
      );
      pointElement.appendChild(
        gameCharacter.createDataElement('GR', json.points.gr)
      );
      pointElement.appendChild(
        gameCharacter.createDataElement('神聖石', json.points.divinestone)
      );
      pointElement.appendChild(
        gameCharacter.createDataElement('所持金', json.points.money)
      );
      pointElement.appendChild(
        gameCharacter.createResourceElement(
          '借金',
          json.points.limit || '2000',
          json.points.debt || '0'
        )
      );
      pointElement.appendChild(
        gameCharacter.createResourceElement(
          'GACHAp',
          8,
          json.points.gachap || '0'
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
      const skillElement = gameCharacter.appendDetailElement('スキル');
      let skillCount = 0;
      for (const skill of json.skills) {
        if (!skill.name || divineSkill.includes(skill.name)) {
          continue;
        }
        skillCount++;
        skillElement.appendChild(
          gameCharacter.createNoteElement(
            `スキル${skillCount}`,
            `《${skill.name}》＿${skill.timing}／${skill.range}／${
              skill.target
            }／${skill.effect}`
          )
        );
        skillElement.appendChild(
          gameCharacter.createResourceElement(
            `回数${skillCount}`,
            skill.count2 || '0',
            skill.count1 || '0'
          )
        );
      }
      /*
       * 消耗品
       */
      const expendableElement = gameCharacter.appendDetailElement('消耗品');
      for (const expendable of json.expendables) {
        if (!expendable.name) {
          continue;
        }
        expendableElement.appendChild(
          gameCharacter.createResourceElement(
            expendable.name,
            expendable.count,
            expendable.count
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
    }

    /*
     * 武器
     */
    for (const weapon of json.weapons) {
      if (!weapon.name) {
        continue;
      }
      const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
        weapon.name,
        1,
        imageIdentifier
      );

      /*
       *情報
       */
      const infoElement = gameCharacter.appendDetailElement('情報');
      infoElement.appendChild(
        gameCharacter.createDataElement(
          '種別',
          `${weapon.type}(${weapon.usage})`
        )
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('☆', weapon.reality || '')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('命／発', weapon.hit || '0')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('距離', weapon.range)
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('ダメージ', `${weapon.damage}d`)
      );
      infoElement.appendChild(
        gameCharacter.createResourceElement(
          '耐久',
          weapon.endurance2,
          weapon.endurance1 || weapon.endurance2
        )
      );
      infoElement.appendChild(
        gameCharacter.createNoteElement(
          '付随／神能力',
          weapon.option
            ? `《${weapon.option}》＿${weapon.optiontiming}／${
                weapon.optionrange
              }／${weapon.optiontarget}／${weapon.optioneffect}`
            : ''
        )
      );

      const domParser: DOMParser = new DOMParser();
      domParser.parseFromString(
        gameCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = gameCharacter.appendDetailElement(
        '所有者（並び替え用）'
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('PL', json.base.player || '')
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('行動値', json.base.name)
      );

      const palette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      palette.dicebot = '';
      // チャパレ内容
      let cp = '';
      if (weapon.type === '魔') {
        cp += `2D6+${json.battleability.current.activate}+${weapon.hit} ${
          weapon.name
        }（${json.base.name}）／発動\n`;
        cp += `${weapon.damage}D6+${json.subability.current.magicald} ${
          weapon.name
        }（${json.base.name}）／魔法ダメージ\n`;
      } else {
        cp += `2D6+${json.battleability.current.hit}+${weapon.hit} ${
          weapon.name
        }（${json.base.name}）／命中\n`;
        cp += `${weapon.damage}D6+${json.subability.current.physicald} ${
          weapon.name
        }（${json.base.name}）／物理ダメージ\n`;
      }
      if (weapon.option) {
        cp += `《${weapon.option}》（${weapon.name}／${json.base.name}）＿${
          weapon.optiontiming
        }／${weapon.optionrange}／${weapon.optiontarget}／${
          weapon.optioneffect
        }\n`;
      }

      palette.setPalette(cp);
      palette.initialize();
      gameCharacter.appendChild(palette);

      gameCharacter.update();
      gameCharacters.push(gameCharacter);
    }

    /*
     * 盾
     */
    for (const shield of json.shields) {
      if (!shield.name) {
        continue;
      }
      const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
        shield.name,
        1,
        imageIdentifier
      );

      /*
       * 情報
       */
      const infoElement = gameCharacter.appendDetailElement('情報');
      infoElement.appendChild(
        gameCharacter.createDataElement('種別', shield.type)
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('☆', shield.reality || '')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('回避', shield.dodge || '0')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('抵抗', shield.resistance || '0')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('装甲', shield.armor || '0')
      );
      infoElement.appendChild(
        gameCharacter.createResourceElement(
          '耐久',
          shield.endurance2,
          shield.endurance1 || shield.endurance2
        )
      );
      infoElement.appendChild(
        gameCharacter.createNoteElement(
          '付随／神能力',
          shield.option
            ? `《${shield.option}》＿${shield.optiontiming}／${
                shield.optionrange
              }／${shield.optiontarget}／${shield.optioneffect}`
            : ''
        )
      );

      const domParser: DOMParser = new DOMParser();
      domParser.parseFromString(
        gameCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = gameCharacter.appendDetailElement(
        '所有者（並び替え用）'
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('PL', json.base.player || '')
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('行動値', json.base.name)
      );

      const palette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      palette.dicebot = '';
      // チャパレ内容
      let cp = '';
      if (shield.option) {
        cp += `《${shield.option}》（${shield.name}／${json.base.name}）＿${
          shield.optiontiming
        }／${shield.optionrange}／${shield.optiontarget}／${
          shield.optioneffect
        }\n`;
      }

      palette.setPalette(cp);
      palette.initialize();
      gameCharacter.appendChild(palette);

      gameCharacter.update();
      gameCharacters.push(gameCharacter);
    }

    /*
     * 鎧
     */
    for (const armour of json.armours) {
      if (!armour.name) {
        continue;
      }
      const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
        armour.name,
        1,
        imageIdentifier
      );

      /*
       * 情報
       */
      const infoElement = gameCharacter.appendDetailElement('情報');
      infoElement.appendChild(
        gameCharacter.createDataElement('種別', armour.type)
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('☆', armour.reality || '')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('行動', armour.action || '0')
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('装甲', armour.armor || '0')
      );
      infoElement.appendChild(
        gameCharacter.createResourceElement(
          '耐久',
          armour.endurance2,
          armour.endurance1 || armour.endurance2
        )
      );
      infoElement.appendChild(
        gameCharacter.createNoteElement(
          '付随／神能力',
          armour.option
            ? `《${armour.option}》＿${armour.optiontiming}／${
                armour.optionrange
              }／${armour.optiontarget}／${armour.optioneffect}`
            : ''
        )
      );

      const domParser: DOMParser = new DOMParser();
      domParser.parseFromString(
        gameCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = gameCharacter.appendDetailElement(
        '所有者（並び替え用）'
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('PL', json.base.player || '')
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('行動値', json.base.name)
      );

      const palette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      palette.dicebot = '';
      // チャパレ内容
      let cp = '';
      if (armour.option) {
        cp += `《${armour.option}》（${armour.name}／${json.base.name}）＿${
          armour.optiontiming
        }／${armour.optionrange}／${armour.optiontarget}／${
          armour.optioneffect
        }\n`;
      }

      palette.setPalette(cp);
      palette.initialize();
      gameCharacter.appendChild(palette);

      gameCharacter.update();
      gameCharacters.push(gameCharacter);
    }

    /*
     * 装飾品
     */
    for (const accessory of json.accessories) {
      if (!accessory.name) {
        continue;
      }
      const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
        accessory.name,
        1,
        imageIdentifier
      );

      /*
       * 情報
       */
      const infoElement = gameCharacter.appendDetailElement('情報');
      infoElement.appendChild(
        gameCharacter.createDataElement('種別', accessory.type)
      );
      infoElement.appendChild(
        gameCharacter.createDataElement('☆', accessory.reality || '')
      );
      infoElement.appendChild(
        gameCharacter.createResourceElement(
          '耐久',
          accessory.endurance2,
          accessory.endurance1 || accessory.endurance2
        )
      );
      infoElement.appendChild(
        gameCharacter.createNoteElement(
          '付随／神能力',
          accessory.option
            ? `《${accessory.option}》＿${accessory.optiontiming}／${
                accessory.optionrange
              }／${accessory.optiontarget}／${accessory.optioneffect}`
            : ''
        )
      );

      const domParser: DOMParser = new DOMParser();
      domParser.parseFromString(
        gameCharacter.rootDataElement.toXml(),
        'application/xml'
      );
      /*
       * 所有者（並び替え用）
       */
      const sortElement = gameCharacter.appendDetailElement(
        '所有者（並び替え用）'
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('PL', json.base.player || '')
      );
      sortElement.appendChild(
        gameCharacter.createDataElement('行動値', json.base.name)
      );

      const palette: ChatPalette = new ChatPalette(
        'ChatPalette_' + gameCharacter.identifier
      );
      palette.dicebot = '';
      // チャパレ内容
      let cp = '';
      if (accessory.option) {
        cp += `《${accessory.option}》（${accessory.name}／${
          json.base.name
        }）＿${accessory.optiontiming}／${accessory.optionrange}／${
          accessory.optiontarget
        }／${accessory.optioneffect}\n`;
      }

      palette.setPalette(cp);
      palette.initialize();
      gameCharacter.appendChild(palette);

      gameCharacter.update();
      gameCharacters.push(gameCharacter);
    }

    return gameCharacters;
  }
}
