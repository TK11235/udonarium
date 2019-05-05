import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter } from '../custom-character';

/**
 * キャラクターシート倉庫 モノトーンミュージアム
 * https://character-sheets.appspot.com/mnt/
 */
export class MonotonemuseumGenerator {
  static geneateByAppspot(
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
    const infoElement = gameCharacter.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      gameCharacter.createDataElement('PL', json.base.player || '')
    );
    infoElement.appendChild(
      gameCharacter.createNoteElement('説明', json.base.memo || '')
    );
    infoElement.appendChild(gameCharacter.createNoteElement('URL', url));
    /*
     * リソース
     */
    const resourceElement = gameCharacter.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        'HP',
        json.outfits.total.hp,
        json.outfits.total.hp
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        'MP',
        json.outfits.total.mp,
        json.outfits.total.mp
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        '剥離値',
        20,
        json.base.exfoliation.value
      )
    );
    /*
     * ステータス
     */
    const statusElement = gameCharacter.createDataElement('ステータス', '');
    gameCharacter.detailDataElement.appendChild(statusElement);
    statusElement.appendChild(
      gameCharacter.createDataElement('演者レベル', json.base.level)
    );
    const classElement = gameCharacter.createDataElement('クラス', '');
    statusElement.appendChild(classElement);
    for (const clazz of json.classes) {
      classElement.appendChild(
        gameCharacter.createDataElement(clazz.name, clazz.level)
      );
    }
    statusElement.appendChild(
      gameCharacter.createDataElement('基本剥離値', json.base.exfoliation.init)
    );
    /*
     * 配役
     */
    const lifepathElement = gameCharacter.createDataElement('配役', '');
    gameCharacter.detailDataElement.appendChild(lifepathElement);
    lifepathElement.appendChild(
      gameCharacter.createDataElement(
        '出自',
        `${json.lifepath.birth.name || ''}/${json.lifepath.birth.memo || ''}`
      )
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement(
        '境遇',
        `${json.lifepath.environment.name || ''}/${json.lifepath.environment
          .memo || ''}`
      )
    );
    const partnerElement = gameCharacter.createDataElement('パートナー', '');
    lifepathElement.appendChild(partnerElement);
    for (const connection of json.lifepath.connection) {
      partnerElement.appendChild(
        gameCharacter.createDataElement(
          connection.name || '',
          connection.relation || ''
        )
      );
    }
    /*
     * 能力値
     */
    const abilityElement = gameCharacter.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      gameCharacter.createDataElement('肉体', json.abl.body.bonus)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('知覚', json.abl.sense.bonus)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('意志', json.abl.will.bonus)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('感応', json.abl.sympathy.bonus)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('社会', json.abl.society.bonus)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('縫製', json.abl.sewing.bonus)
    );
    /*
     * 戦闘値
     */
    const battleElement = gameCharacter.createDataElement('戦闘値', '');
    gameCharacter.detailDataElement.appendChild(battleElement);
    battleElement.appendChild(
      gameCharacter.createDataElement('命中値', json.outfits.total.hit)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('回避値', json.outfits.total.dodge)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('術操値', json.outfits.total.magic)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('抵抗値', json.outfits.total.countermagic)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('行動値', json.outfits.total.action)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('耐久力', json.outfits.total.hp)
    );
    battleElement.appendChild(
      gameCharacter.createDataElement('精神力', json.outfits.total.mp)
    );
    /*
     * アイテム
     */
    const itemElement = gameCharacter.createDataElement('アイテム', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (const item of json.items) {
      if (!item.name) {
        continue;
      }
      itemElement.appendChild(
        gameCharacter.createDataElement(item.name, item.effect)
      );
    }
    /*
     * 逸脱能力
     */
    const specialElement = gameCharacter.createDataElement('逸脱能力', '');
    gameCharacter.detailDataElement.appendChild(specialElement);
    let specialCount = 0;
    for (const special of json.specials) {
      if (!special.name) {
        continue;
      }
      specialCount++;
      specialElement.appendChild(
        gameCharacter.createDataElement(`逸脱能力${specialCount}`, special.name)
      );
    }
    /*
     * 特技
     */
    const skillElement = gameCharacter.createDataElement('特技', '');
    gameCharacter.detailDataElement.appendChild(skillElement);
    for (const skill of json.skills) {
      if (!skill.name) {
        continue;
      }
      skillElement.appendChild(
        gameCharacter.createDataElement(
          skill.name,
          `${skill.class || ''}/${skill.level || ''}/${skill.type ||
            ''}/${skill.timing || ''}/${skill.judge || ''}/${skill.difficulty ||
            ''}/${skill.target || ''}/${skill.range || ''}/${skill.cost ||
            ''}/${skill.memo || ''}`
        )
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'MonotoneMusium';
    // チャパレ内容
    let cp = `2d6+{肉体} 肉体
2d6+{知覚} 知覚
2d6+{意志} 意志
2d6+{感応} 感応
2d6+{社会} 社会
2d6+{縫製} 縫製

2d6+{命中値} 命中値
2d6+{回避値} 回避値
2d6+{術操値} 術操値
2d6+{抵抗値} 抵抗値

`;
    cp += json.specials
      .filter((special: any) => special.name)
      .reduce(
        (txt: string, special: any) =>
          txt +
          `《${special.name}》 ${special.timing || ''}/${special.target ||
            ''}/${special.range || ''}/${special.cost || ''}/${special.effect ||
            ''}\n`,
        '\n'
      );
    cp += json.skills
      .filter((skill: any) => skill.name)
      .reduce(
        (txt: string, skill: any) =>
          txt +
          `《${skill.name}》 ${skill.class || ''}/${skill.level ||
            ''}/${skill.type || ''}/${skill.timing || ''}/${skill.judge ||
            ''}/${skill.difficulty || ''}/${skill.target || ''}/${skill.range ||
            ''}/${skill.cost || ''}/${skill.memo || ''}\n`,
        '\n'
      );

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
