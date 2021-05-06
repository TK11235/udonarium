import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { AppspotFactory } from '../system-factory';

/**
 * キャラクターシート倉庫 スタリィドール
 */
export class StarryDolls implements AppspotFactory {
  gameSystem = 'starrydolls';
  name = 'スタリィドール';
  href = 'https://character-sheets.appspot.com/starrydolls/';
  create = StarryDolls.create;

  static appspotFactory(): AppspotFactory {
    return new StarryDolls();
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
    statusElement.appendChild(
      Utils.createDataElement('攻撃力', json.base.jewelry.attack)
    );
    statusElement.appendChild(
      Utils.createDataElement('運命力', json.base.jewelry.destiny)
    );
    statusElement.appendChild(
      Utils.createResourceElement(
        '星命力',
        json.base.jewelry.starlife.max,
        json.base.jewelry.starlife.current
      )
    );
    statusElement.appendChild(
      Utils.createDataElement('守護星座', getSkill(json.base.guardiansign).name)
    );
    let nigate: string = '';
    for (let i = 0; i < 11; i++) {
      if (json.skills[`row${i}`].check5 != null) {
        nigate = getSkill(`skills.row${i}.name5`).name;
      }
    }
    statusElement.appendChild(Utils.createDataElement('苦手特技', nigate));
    const connections = json.connections
      .filter((con) => Boolean(con.name) && Boolean(con.get))
      .map((con) => `${con.name}：${con.attribute}`)
      .join('\n');
    statusElement.appendChild(Utils.createNoteElement('人物欄', connections));

    /*
     * 情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      Utils.createDataElement('PL', json.base.player ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('宝石', json.base.jewelry.name ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('アクセサリ', json.base.accessory ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('武器', json.base.weapon ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('人間への想い', json.base.think ?? '')
    );
    infoElement.appendChild(
      Utils.createNoteElement('願いごと', json.base.wish ?? '')
    );
    infoElement.appendChild(
      Utils.createNoteElement('説明', json.base.memo ?? '')
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * 特技
     */
    const skillElement = Utils.createDataElement('特技', '');
    gameCharacter.detailDataElement.appendChild(skillElement);
    json.learned
      .filter((skill) => Boolean(skill.id))
      .map((skill) => getSkill(skill.id))
      .forEach((skill, i) =>
        skillElement.appendChild(
          Utils.createDataElement(`特技${i + 1}`, format(skill))
        )
      );

    /*
     * 戦星術
     */
    const spellElement = Utils.createDataElement('戦星術', '');
    gameCharacter.detailDataElement.appendChild(spellElement);
    json.spells
      .filter((spell) => Boolean(spell.name))
      .forEach((spell) => {
        const text = [spell.timing, spell.range, spell.cost, spell.skill]
          .map((t) => t?.trim() ?? '')
          .join('／');
        spellElement.appendChild(
          Utils.createNoteElement(spell.name, `${text}\n${spell.effect}`)
        );
      });
    spellElement.appendChild(
      Utils.createNoteElement(
        '終幕',
        [json.curtainfall.name, json.curtainfall.explain]
          .filter(Boolean)
          .join('\n')
      )
    );

    /*
     * アイテム
     */
    const itemElement = Utils.createDataElement('アイテム', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    json.items
      .filter((item) => Boolean(item.name))
      .forEach((item) => {
        itemElement.appendChild(
          Utils.createResourceElement(
            item.name,
            item.count ?? 0,
            item.count ?? 0
          )
        );
      });

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = '';
    // チャパレ内容
    let cp = `1D6
2D6
2D6>=
2D6>=5

星命力: {星命力}

{攻撃力}D6 【基本攻撃】
{運命力}B6 ラプスロール
`;
    cp += '\n//---戦星術・終幕\n';
    cp += json.spells
      .filter((spell) => Boolean(spell.name))
      .map((spell) => `【${spell.name}】{${spell.name}}\n`)
      .join('');
    cp += '{終幕}\n';
    cp += '\n//---アイテム\n';
    cp += json.items
      .filter((item) => Boolean(item.name))
      .map((item) => `「${item.name}」${item.effect ?? ''}\n`);

    cp += `
//---各種表
choice[${CATEGORIES.join(',')}] ランダム分野表
↓ランダム星座表(p.177)↓
choice[おひつじ座,おうし座,ふたご座,かに座,しし座,おとめ座,てんびん座,さそり座,いて座,やぎ座,みずがめ座,うお座] ランダム星座表(p.177)
1D6 主人関係表(p.186)
1D6 関係属性表(p.186)
1D6 奇跡表(p.177)
1D6 戦果表(p.191)
2D6 事件表(p.193)
1D6 遭遇表(p.193)
1D6 致命傷表(p.184)
1D6 カタストロフ表(p.198)
1D6 回想表(p.187)
`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}

const SKILLS = [
  ['創造', '光', 'おうし座', 'おひつじ座', 'リボン', '勇気'],
  ['研究', '雷', '幸運', '精密', '照明具', '知恵'],
  ['守護', 'ふたご座', '幻影', '高速', 'うお座', '熱意'],
  ['絆', '水', 'テレパシー', '怪力', '料理', '調和'],
  ['かに座', '火', '予知夢', '隠密', '獣', 'みずがめ座'],
  ['夢', '風', '星読み', '飛行', '花', '愛情'],
  ['しし座', '木', '治癒', '言霊', '乗り物', 'やぎ座'],
  ['自由', '氷', '天候', '模倣', '書物', 'センス'],
  ['恋愛', 'おとめ座', '変身', '軽業', 'いて座', '根気'],
  ['脚光', '土', '時間停止', '歌舞', '武器', '礼節'],
  ['世界', '闇', 'てんびん座', 'さそり座', '財宝', '理性'],
];

const CATEGORIES = ['願望', '元素', '星使い', '動作', '召喚', '人間性'];

type Skill = {
  name: string;
  category: string;
  dice: number;
};

const getSkill = (id: string): Skill => {
  // skill.idは skills.row8.name2 のような値を持っている
  const matchData = id.match(/^skills\.row(\d+)\.name(\d+)$/);
  if (!matchData) {
    return null;
  }
  const rowId = Number.parseInt(matchData[1], 10);
  const nameId = Number.parseInt(matchData[2], 10);
  const name = SKILLS[rowId][nameId];
  const category = CATEGORIES[nameId];
  const dice = rowId + 2;
  return { name, category, dice };
};

const format = (skill: Skill): string => {
  return `《${skill.name}／${skill.category}${skill.dice}》`;
};
