import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { AppspotFactory } from '../system-factory';

/**
 * キャラクターシート倉庫 アマデウス
 */
export class Amadeus implements AppspotFactory {
  gameSystem = 'amadeus';
  name = 'アマデウス';
  href = 'https://character-sheets.appspot.com/amadeus/';
  create = Amadeus.create;

  static appspotFactory(): AppspotFactory {
    return new Amadeus();
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
     * ステータス
     */
    const statusElement = Utils.createDataElement('ステータス', '');
    gameCharacter.detailDataElement.appendChild(statusElement);
    const maxHp = Number.parseInt(json.base.hp.max, 10);
    const vitality = Number.parseInt(json.base.hp.vitality, 10);
    statusElement.appendChild(
      Utils.createResourceElement(
        '生命力',
        Number.isNaN(vitality) ? maxHp : maxHp + vitality,
        json.base.hp.current
      )
    );
    statusElement.appendChild(Utils.createNoteElement('変調', ''));
    statusElement.appendChild(Utils.createResourceElement('目標値', 6, 4));
    statusElement.appendChild(Utils.createResourceElement('判定修正', 5, 0));
    statusElement.appendChild(Utils.createResourceElement('スペシャル', 6, 6));

    /*
     * 情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      Utils.createDataElement('PL', json.base.player || '')
    );
    infoElement.appendChild(
      Utils.createResourceElement('レベル', 10, json.base.level)
    );
    infoElement.appendChild(Utils.createDataElement('神群', json.base.cluster));
    infoElement.appendChild(Utils.createDataElement('親神', json.base.parent));
    infoElement.appendChild(
      Utils.createDataElement('背景', json.base.background)
    );
    const attribute: string = {
      'base.attribute.black': '黒',
      'base.attribute.red': '赤',
      'base.attribute.blue': '青',
      'base.attribute.green': '緑',
      'base.attribute.white': '白',
    }[json.base.attribute.value];
    infoElement.appendChild(Utils.createDataElement('属性', attribute));
    infoElement.appendChild(
      Utils.createDataElement('職業', json.base.job.name)
    );
    infoElement.appendChild(
      Utils.createNoteElement('説明', json.base.memo || '')
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * 能力値
     */
    const diceEval = (dice: string): string => {
      switch (dice) {
        case '1/2':
          return 'D';
        case '1':
          return 'C';
        case '2':
          return 'B';
        case '3':
          return 'A';
        case '4':
          return 'S';
      }
    };
    const modEval = (plus: string) => {
      switch (plus) {
        case '-2':
          return '--';
        case '-1':
          return '-';
        case '+-0':
          return '';
        case '+1':
          return '+';
        case '+2':
          return '++';
        case '+3':
          return '+++';
      }
    };
    const abilityEval = (ability: { eval: string; plus: string }): string => {
      return `${diceEval(ability.eval)}${modEval(ability.plus)}`;
    };
    const abilityList: { name: string; id: string }[] = [
      { name: '武勇', id: 'brave' },
      { name: '技術', id: 'technic' },
      { name: '頭脳', id: 'brain' },
      { name: '霊力', id: 'spirit' },
      { name: '愛', id: 'love' },
      { name: '日常', id: 'mundane' },
    ];
    const abilityElement = Utils.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    for (const abilityInfo of abilityList) {
      abilityElement.appendChild(
        Utils.createDataElement(
          abilityInfo.name,
          abilityEval(json.ability[abilityInfo.id])
        )
      );
    }

    /*
     * ギフト
     */
    const giftElement = Utils.createDataElement('特技', '');
    gameCharacter.detailDataElement.appendChild(giftElement);
    for (const gift of json.gifts) {
      if (!gift.name) {
        continue;
      }
      giftElement.appendChild(
        Utils.createNoteElement(
          gift.name,
          `${gift.type}／${gift.cost}／${gift.judge}／${gift.tag}／${gift.effect}`
        )
      );
    }

    /*
     * アイテム
     */
    const itemElement = Utils.createDataElement('アイテム', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    itemElement.appendChild(
      Utils.createResourceElement(
        '所持金',
        10,
        (json.itemsfoot.money || '').trim()
      )
    );
    let itemCount = 0;
    for (const item of json.items) {
      if (!item.name) {
        continue;
      }
      itemCount++;
      let text = item.type;
      if (item.power) {
        text += `／${item.power}`;
      }
      text += `／${item.effect || ''}`;
      itemElement.appendChild(Utils.createNoteElement(item.name, text));
    }
    for (; itemCount < 3; itemCount++) {
      itemElement.appendChild(
        Utils.createNoteElement('アイテム', '種別／威力／効果')
      );
    }
    itemElement.appendChild(
      Utils.createResourceElement(
        '食料',
        5,
        json.itemsfoot.name.replace(/\D/g, '')
      )
    );

    /*
     * 人物欄
     */
    const personalityElement = Utils.createDataElement('人物欄', '');
    gameCharacter.detailDataElement.appendChild(personalityElement);
    let personalityCount = 0;
    for (const personality of json.personalities) {
      if (!personality.name) {
        continue;
      }
      personalityCount++;
      personalityElement.appendChild(
        Utils.createDataElement(
          personality.name,
          `${personality.relation}(${personality.plusminus}${personality.thought})`
        )
      );
    }
    for (; personalityCount < 4; personalityCount++) {
      personalityElement.appendChild(
        Utils.createDataElement('人物名', '関係(想い)')
      );
    }

    /*
     * 協力者
     */
    const collaboratorElement = Utils.createDataElement('協力者', '');
    gameCharacter.detailDataElement.appendChild(collaboratorElement);
    const collaborators = [json.personalitiesfoot1, json.personalitiesfoot2];
    for (const collaborator of collaborators) {
      if (collaborator.name) {
        collaboratorElement.appendChild(
          Utils.createDataElement(
            collaborator.name,
            `${collaborator.relation}(${collaborator.plusminus}${collaborator.thought})`
          )
        );
      } else {
        collaboratorElement.appendChild(
          Utils.createDataElement('人物名', '関係(想い)')
        );
      }
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Amadeus';
    // チャパレ内容
    let cp = `1d6
2d6
{レベル}D6 活力決定
1D6+{レベル} 奮起

//-----能力値
`;
    for (const abilityInfo of abilityList) {
      const ability = json.ability[abilityInfo.id];
      cp += `R${diceEval(ability.eval)}`;
      if (ability.plus !== '+-0') {
        cp += ability.plus;
      }
      cp += `+{判定修正}@{スペシャル}>={目標値} ${
        abilityInfo.name
      }${abilityEval(ability)}\n`;
    }
    cp += '\n//-----ギフト\n';
    for (const gift of json.gifts) {
      if (!gift.name) {
        continue;
      }
      cp += `《${gift.name}》 {${gift.name}}\n`;
    }
    cp += '\n//-----アイテム\n';
    for (const item of json.items) {
      if (!item.name) {
        continue;
      }
      cp += `《${item.name}》 {${item.name}}\n`;
      if (item.power) {
        cp += `${item.power} 《${item.name}》威力\n`;
      }
    }
    cp += `《食料》 消耗／休憩時に食事を行うことで、【生命力】を1点回復できる。

//-----各種表
RT 関係表
BT 休憩表
FT ファンブル表
FWT 致命傷表
BRT 戦果表
RIT ランダムアイテム表
WT 損傷表
NMT 悪夢表
CST 制約表
FBT 決戦戦果表
RGT ランダムギフト表
`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
