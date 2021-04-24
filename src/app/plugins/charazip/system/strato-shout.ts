import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { AppspotFactory } from '../system-factory';

/**
 * キャラクターシート倉庫 ストラトシャウト
 */
export class StratoShout implements AppspotFactory {
  gameSystem = 'stratoshout';
  name = 'ストラトシャウト';
  href = 'https://character-sheets.appspot.com/stratoshout/';
  create = StratoShout.create;

  static appspotFactory(): AppspotFactory {
    return new StratoShout();
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
     * リソース
     */
    const resourceElement = Utils.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      Utils.createResourceElement(
        'ディスコード',
        10,
        json.base.instrument.discord ?? 0
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement(
        'コンディション',
        10,
        json.base.instrument.condition ?? 0
      )
    );
    resourceElement.appendChild(
      Utils.createResourceElement('腕前', 10, json.base.instrument.skill ?? 0)
    );
    const bonds = json.bonds.filter((bond) => bond.name && bond.level);
    const bondLevels = bonds
      .map((bond) => bond.level)
      .reduce((sum, val) => sum + val, 0);
    resourceElement.appendChild(
      Utils.createResourceElement('絆', 10, bondLevels)
    );
    resourceElement.appendChild(
      Utils.createNoteElement(
        '絆の内容',
        bonds
          .map((bond) => `${bond.name}／${bond.attribute}／${bond.level}`)
          .join('\n')
      )
    );

    /*
     * 情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      Utils.createDataElement('PL', json.base.player ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('カナ', json.base.nameKana ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('性別', json.base.sex ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('年齢', json.base.age ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('バンド名', json.base.bandname ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('作戦', json.base.strategy ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('レベル', json.base.level ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('経緯', json.base.circumstances ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('楽器名/種別', json.base.instrument.name ?? '')
    );
    infoElement.appendChild(
      Utils.createDataElement('楽器威力', json.base.instrument.damage ?? '')
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
    const skillNameList = [
      ['過去', '頭', '闇', '悲しい', '泣く', '死'],
      ['恋人', '目', '武器', '怒り', '忘れる', '喪失'],
      ['仲間', '耳', '魔法', '不安', '消す', '暴力'],
      ['家族', '口', '獣', '恐怖', '壊す', '孤独'],
      ['自分', '胸', '町', '驚き', '叫ぶ', '後悔'],
      ['今', '心臓', '歌', '高鳴り', '歌う', '実力'],
      ['理由', '血', '窓', '情熱', '踊る', '退屈'],
      ['夢', '背中', '花', '確信', '走る', '本性'],
      ['世界', '手', '空', '期待', '出会う', '富'],
      ['幸せ', 'XXX', '季節', '楽しい', '呼ぶ', '恋愛'],
      ['未来', '足', '光', '喜び', '笑う', '生'],
    ];
    const learnedSkills = json.learned
      .filter((skill) => skill.id)
      .map((skill) => {
        // skill.idは skills.row8.name2 のような値を持っている
        const m = skill.id.match(/^skills\.row(\d+)\.name(\d+)$/);
        const rowId = Number.parseInt(m[1], 10);
        const nameId = Number.parseInt(m[2], 10);
        const skillName = skillNameList[rowId][nameId];
        const category = ['主義', '身体', 'モチーフ', '情緒', '行動', '逆境'][
          nameId
        ];
        return `${skillName}／${category}${rowId + 2}`;
      });
    let skillCount = 0;
    learnedSkills.forEach((skill) => {
      skillCount++;
      skillElement.appendChild(
        Utils.createDataElement(`特技${skillCount}`, skill)
      );
    });

    /*
     * スキル
     */
    const abilityElement = Utils.createDataElement('スキル', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    const abilities = json.ability.filter((ability) => ability.name);
    abilities.forEach((ability) => {
      abilityElement.appendChild(
        Utils.createNoteElement(
          ability.name,
          `${ability.timing ?? ''}／${ability.effect ?? ''}`
        )
      );
    });

    /*
     * フレーズ
     */
    const phraseElement = Utils.createDataElement('フレーズ', '');
    gameCharacter.detailDataElement.appendChild(phraseElement);
    phraseElement.appendChild(
      Utils.createNoteElement(
        'フレーズ1',
        json.phrases.phrase1.effect
          ? `${json.phrases.phrase1.effect}／${json.phrases.phrase1.skill}`
          : ''
      )
    );
    phraseElement.appendChild(
      Utils.createNoteElement(
        'フレーズ2',
        json.phrases.phrase2.effect
          ? `${json.phrases.phrase2.effect}／${json.phrases.phrase2.skill}`
          : ''
      )
    );
    phraseElement.appendChild(
      Utils.createNoteElement(
        'フレーズ3',
        json.phrases.phrase3.effect
          ? `${json.phrases.phrase3.effect}／${json.phrases.phrase3.skill}`
          : ''
      )
    );

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'StratoShout';
    // チャパレ内容
    let cp = `1D6
2D6
2D6>=
2D6>=5
EMO 感情表

ディスコード: {ディスコード}
コンディション: {コンディション}
腕前: {腕前}
絆: {絆}

{楽器威力}+{腕前} 通常攻撃
{楽器威力}+{腕前}+2D6 フレーズ攻撃
1D6 通常回復
2D6 フレーズ回復

`;
    cp += abilities
      .map((ability) => `「${ability.name}」{${ability.name}}`)
      .join('\n');
    cp += `

AT 特技表(ランダム)
AT1 特技表(主義
AT2 特技表(身体)
AT3 特技表(モチーフ)
AT4 特技表(エモーション)
AT5 特技表(行動)
AT6 特技表(逆境)

SCENE 汎用シーン表
MACHI 街角シーン表
GAKKO 学校シーン表
BAND バンドシーン表
TENKAI シーン展開表

VOT ボーカルトラブル表
GUT ギタートラブル表
BAT ベーストラブル表
KEYT キーボードトラブル表
DRT ドラムトラブル表`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
