import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter } from '../custom-character';
import { AppspotFactory } from '../system-factory';

/**
 * キャラクターシート倉庫 シノビガミ
 */
export class Shinobigami implements AppspotFactory {
  gameSystem = 'shinobigami';
  name = 'シノビガミ';
  href = 'https://character-sheets.appspot.com/shinobigami/';
  create = Shinobigami.create;

  static appspotFactory(): AppspotFactory {
    return new Shinobigami();
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
     * 体力
     */
    const statusElement = gameCharacter.createDataElement('体力', '');
    gameCharacter.detailDataElement.appendChild(statusElement);
    statusElement.appendChild(
      gameCharacter.createResourceElement(
        '器術',
        1,
        json.skills.damage.check0 == null ? 1 : 0
      )
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement(
        '体術',
        1,
        json.skills.damage.check1 == null ? 1 : 0
      )
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement(
        '忍術',
        1,
        json.skills.damage.check2 == null ? 1 : 0
      )
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement(
        '謀術',
        1,
        json.skills.damage.check3 == null ? 1 : 0
      )
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement(
        '戦術',
        1,
        json.skills.damage.check4 == null ? 1 : 0
      )
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement(
        '妖術',
        1,
        json.skills.damage.check5 == null ? 1 : 0
      )
    );
    statusElement.appendChild(
      gameCharacter.createResourceElement('頑健', 4, 0)
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
      gameCharacter.createDataElement(
        'HO',
        json.scenario.pcno ? `PC${json.scenario.pcno}` : ''
      )
    );
    const upperstyles = {
      a: '斜歯忍軍',
      ab: '鞍馬神流',
      bc: 'ハグレモノ',
      cd: '比良坂機関',
      de: '私立御斎学園',
      e: '隠忍の血統',
    };
    const style = `${upperstyles[json.base.upperstyle]}/${json.base.substyle}`;
    infoElement.appendChild(gameCharacter.createDataElement('流派', style));
    infoElement.appendChild(
      gameCharacter.createNoteElement('説明', json.base.memo)
    );
    infoElement.appendChild(gameCharacter.createNoteElement('URL', url));

    /*
     * 特技
     */
    const skillElement = gameCharacter.createDataElement('特技', '');
    gameCharacter.detailDataElement.appendChild(skillElement);
    const tokui = {
      a: '器術',
      ab: '体術',
      bc: '忍術',
      cd: '謀術',
      de: '戦術',
      e: '妖術',
    };
    skillElement.appendChild(
      gameCharacter.createDataElement('得意分野', tokui[json.base.upperstyle])
    );
    const skillNameList = [
      ['絡繰術', '騎乗術', '生存術', '医術', '兵糧術', '異形化'],
      ['火術', '砲術', '潜伏術', '毒術', '鳥獣術', '召喚術'],
      ['水術', '手裏剣術', '遁走術', '罠術', '野戦術', '死霊術'],
      ['針術', '手練', '盗聴術', '調査術', '地の利', '結界術'],
      ['仕込み', '身体操術', '腹話術', '詐術', '意気', '封術'],
      ['衣装術', '歩法', '隠形術', '対人術', '用兵術', '言霊術'],
      ['縄術', '走法', '変装術', '遊芸', '記憶術', '幻術'],
      ['登術', '飛術', '香術', '九ノ一の術', '見敵術', '瞳術'],
      ['拷問術', '骨法術', '分身の術', '傀儡の術', '暗号術', '千里眼の術'],
      ['壊器術', '刀術', '隠蔽術', '流言の術', '伝達術', '憑依術'],
      ['掘削術', '怪力', '第六感', '経済力', '人脈', '呪術'],
    ];
    let skillCount = 0;
    for (const skill of json.learned) {
      if (!skill.id) {
        continue;
      }
      skillCount++;
      // skill.idは skills.row8.name2 のような値を持っている
      const matchData = skill.id.match(/^skills\.row(\d+)\.name(\d+)$/);
      if (!matchData) {
        continue;
      }
      const rowId = matchData[1];
      const nameId = matchData[2];
      const skillName = skillNameList[rowId][nameId];
      const category = ['器術', '体術', '忍術', '謀術', '戦術', '妖術'][nameId];
      skillElement.appendChild(
        gameCharacter.createDataElement(
          `特技${skillCount}`,
          `${skillName}(${category})`
        )
      );
    }

    /*
     * 忍法
     */
    const ninpouElement = gameCharacter.createDataElement(
      '忍法　タイプ/指定特技/間合/コスト/エフェクト',
      ''
    );
    gameCharacter.detailDataElement.appendChild(ninpouElement);
    for (const ninpou of json.ninpou) {
      if (!ninpou.name) {
        continue;
      }
      ninpouElement.appendChild(
        gameCharacter.createNoteElement(
          ninpou.name,
          `${ninpou.type}／${ninpou.targetSkill}／${ninpou.range}／${ninpou.cost}／${ninpou.effect}`
        )
      );
    }

    /*
     * 背景
     */
    const backgroundElement = gameCharacter.createDataElement('背景', '');
    gameCharacter.detailDataElement.appendChild(backgroundElement);
    for (const background of json.background) {
      if (!background.name) {
        continue;
      }
      backgroundElement.appendChild(
        gameCharacter.createNoteElement(
          background.name,
          `${background.type}／${background.effect || ''}`
        )
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'ShinobiGami';
    // チャパレ内容
    let cp = `1D6
2D6
2D6>=
2D6>=5
D66
ET　【感情表】
FT　【ファンブル表】
WT　【変調表】
RTT　【ランダム特技決定表】
ST　【シーン表(無印)】

//-----忍法
`;
    cp += json.ninpou
      .filter((ninpou: any) => ninpou.name)
      .reduce(
        (txt: string, ninpou: any) =>
          txt + `[${ninpou.name}] {${ninpou.name}}\n`,
        ''
      );
    cp += '\n//-----背景\n';
    cp += json.background
      .filter((background: any) => background.name)
      .reduce(
        (txt: string, background: any) =>
          txt + `[${background.name}] {${background.name}}\n`,
        ''
      );

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
