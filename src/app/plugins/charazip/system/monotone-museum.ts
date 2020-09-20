import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { AppspotFactory } from '../system-factory';

/**
 * キャラクターシート倉庫 モノトーンミュージアム
 */
export class MonotoneMuseum implements AppspotFactory {
  gameSystem = 'mnt';
  name = 'モノトーンミュージアム';
  href = 'https://character-sheets.appspot.com/mnt/';
  create = MonotoneMuseum.create;

  static appspotFactory(): AppspotFactory {
    return new MonotoneMuseum();
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
     * 情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      Utils.createDataElement('PL', json.base.player || '')
    );
    infoElement.appendChild(
      Utils.createNoteElement('説明', json.base.memo || '')
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));
    /*
     * リソース
     */
    const resourceElement = Utils.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      Utils.createResourceElement(
        'HP',
        json.outfits.total.hp,
        json.outfits.total.hp
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement(
        'MP',
        json.outfits.total.mp,
        json.outfits.total.mp
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement('剥離値', 20, json.base.exfoliation.value)
    );
    const fortunePoint: number =
      Number.parseInt(json.fortunepoint || 0, 10) +
      Number.parseInt(json.addfortunepoint || 0, 10);
    resourceElement.appendChild(
      Utils.createResourceElement('財産ポイント', fortunePoint, fortunePoint)
    );
    /*
     * ステータス
     */
    const statusElement = Utils.createDataElement('ステータス', '');
    gameCharacter.detailDataElement.appendChild(statusElement);
    statusElement.appendChild(
      Utils.createDataElement('演者レベル', json.base.level)
    );
    const classElement = Utils.createDataElement('クラス', '');
    statusElement.appendChild(classElement);
    for (const clazz of json.classes) {
      classElement.appendChild(
        Utils.createDataElement(clazz.name, clazz.level)
      );
    }
    statusElement.appendChild(
      Utils.createDataElement('基本剥離値', json.base.exfoliation.init)
    );
    /*
     * 配役
     */
    const lifepathElement = Utils.createDataElement('配役', '');
    gameCharacter.detailDataElement.appendChild(lifepathElement);
    lifepathElement.appendChild(
      Utils.createDataElement(
        '出自',
        `${json.lifepath.birth.name || ''}/${json.lifepath.birth.memo || ''}`
      )
    );
    lifepathElement.appendChild(
      Utils.createDataElement(
        '境遇',
        `${json.lifepath.environment.name || ''}/${
          json.lifepath.environment.memo || ''
        }`
      )
    );
    const partnerElement = Utils.createDataElement('パートナー', '');
    lifepathElement.appendChild(partnerElement);
    for (const connection of json.lifepath.connection) {
      partnerElement.appendChild(
        Utils.createDataElement(
          connection.name || '',
          connection.relation || ''
        )
      );
    }
    /*
     * 能力値
     */
    const abilityElement = Utils.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      Utils.createDataElement('肉体', json.abl.body.bonus)
    );
    abilityElement.appendChild(
      Utils.createDataElement('知覚', json.abl.sense.bonus)
    );
    abilityElement.appendChild(
      Utils.createDataElement('意志', json.abl.will.bonus)
    );
    abilityElement.appendChild(
      Utils.createDataElement('感応', json.abl.sympathy.bonus)
    );
    abilityElement.appendChild(
      Utils.createDataElement('社会', json.abl.society.bonus)
    );
    abilityElement.appendChild(
      Utils.createDataElement('縫製', json.abl.sewing.bonus)
    );
    /*
     * 戦闘値
     */
    const battleElement = Utils.createDataElement('戦闘値', '');
    gameCharacter.detailDataElement.appendChild(battleElement);
    battleElement.appendChild(
      Utils.createDataElement('命中値', json.outfits.total.hit)
    );
    battleElement.appendChild(
      Utils.createDataElement('回避値', json.outfits.total.dodge)
    );
    battleElement.appendChild(
      Utils.createDataElement('術操値', json.outfits.total.magic)
    );
    battleElement.appendChild(
      Utils.createDataElement('抵抗値', json.outfits.total.countermagic)
    );
    battleElement.appendChild(
      Utils.createDataElement('行動値', json.outfits.total.action)
    );
    battleElement.appendChild(
      Utils.createDataElement('耐久力', json.outfits.total.hp)
    );
    battleElement.appendChild(
      Utils.createDataElement('精神力', json.outfits.total.mp)
    );
    /*
     * アイテム
     */
    const itemElement = Utils.createDataElement('アイテム', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (const item of json.items) {
      if (!item.name) {
        continue;
      }
      itemElement.appendChild(Utils.createDataElement(item.name, item.effect));
    }
    /*
     * 逸脱能力
     */
    const specialElement = Utils.createDataElement('逸脱能力', '');
    gameCharacter.detailDataElement.appendChild(specialElement);
    let specialCount = 0;
    for (const special of json.specials) {
      if (!special.name) {
        continue;
      }
      specialCount++;
      specialElement.appendChild(
        Utils.createDataElement(`逸脱能力${specialCount}`, special.name)
      );
    }
    while (specialCount < 3) {
      specialCount++;
      specialElement.appendChild(
        Utils.createDataElement(`逸脱能力${specialCount}`, '')
      );
    }
    /*
     * 特技
     */
    const skillElement = Utils.createDataElement('特技', '');
    gameCharacter.detailDataElement.appendChild(skillElement);
    for (const skill of json.skills) {
      if (!skill.name) {
        continue;
      }
      skillElement.appendChild(
        Utils.createDataElement(
          skill.name,
          `${skill.class || ''}/${skill.level || ''}/${skill.type || ''}/${
            skill.timing || ''
          }/${skill.judge || ''}/${skill.difficulty || ''}/${
            skill.target || ''
          }/${skill.range || ''}/${skill.cost || ''}/${skill.memo || ''}`
        )
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'MonotoneMuseum';
    // チャパレ内容
    let cp = `HP: {HP}
MP: {MP}
剥離値: {剥離値}
財産ポイント: {財産ポイント}

2d6+{肉体}>=0[] 肉体
2d6+{知覚}>=0[] 知覚
2d6+{意志}>=0[] 意志
2d6+{感応}>=0[] 感応
2d6+{社会}>=0[] 社会
2d6+{縫製}>=0[] 縫製

2d6+{命中値}>=0[] 命中値
2d6+{回避値}>=0[] 回避値
2d6+{術操値}>=0[] 術操値
2d6+{抵抗値}>=0[] 抵抗値

ET 感情表
OT 兆候表
WDT 世界歪曲表

ET2 感情表2.0
OT2 兆候表2.0
WDT2 世界歪曲表2.0
`;
    cp += json.specials
      .filter((special: any) => special.name)
      .reduce(
        (txt: string, special: any) =>
          txt +
          `《${special.name}》 ${special.timing || ''}/${
            special.target || ''
          }/${special.range || ''}/${special.cost || ''}/${
            special.effect || ''
          }\n`,
        '\n'
      );
    cp += json.skills
      .filter((skill: any) => skill.name)
      .reduce(
        (txt: string, skill: any) =>
          txt +
          `《${skill.name}》 ${skill.class || ''}/${skill.level || ''}/${
            skill.type || ''
          }/${skill.timing || ''}/${skill.judge || ''}/${
            skill.difficulty || ''
          }/${skill.target || ''}/${skill.range || ''}/${skill.cost || ''}/${
            skill.memo || ''
          }\n`,
        '\n'
      );

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
