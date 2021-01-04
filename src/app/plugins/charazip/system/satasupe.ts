import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { AppspotFactory } from '../system-factory';

/**
 * キャラクターシート倉庫 サタスペ
 */
export class Satasupe implements AppspotFactory {
  gameSystem = 'satasupe';
  name = 'サタスペ';
  href = 'https://character-sheets.appspot.com/satasupe/';
  create = Satasupe.create;

  static appspotFactory(): AppspotFactory {
    return new Satasupe();
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
    resourceElement.appendChild(Utils.createResourceElement('肉体点', 10, 10));
    resourceElement.appendChild(Utils.createResourceElement('精神点', 10, 10));
    resourceElement.appendChild(
      Utils.createResourceElement(
        'サイフ',
        json.base.abl.life.value,
        json.base.abl.life.value
      )
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
      Utils.createDataElement('故郷', json.base.homeland || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('性別', json.base.sex || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('年齢', json.base.age || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('外見', json.base.style || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('所属チーム', json.base.team || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('表の顔', json.base.surface || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('盟約', json.base.alliance || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('階級', json.base.hierarchy || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('好きななもの', json.base.likes || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('嫌いなもの', json.base.dislikes || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('好みのタイプ', json.base.favorites || '')
    );
    infoElement.appendChild(
      Utils.createDataElement('好みの映画', json.base.movie || '')
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * 環境値
     */
    const abilityElement = Utils.createDataElement('環境値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      Utils.createDataElement('犯罪', json.base.abl.crime.value)
    );
    abilityElement.appendChild(
      Utils.createDataElement('生活', json.base.abl.life.value)
    );
    abilityElement.appendChild(
      Utils.createDataElement('恋愛', json.base.abl.love.value)
    );
    abilityElement.appendChild(
      Utils.createDataElement('教養', json.base.abl.culture.value)
    );
    abilityElement.appendChild(
      Utils.createDataElement('戦闘', json.base.abl.combat.value)
    );

    /*
     * 天分値
     */
    const giftElement = Utils.createDataElement('天分値', '');
    gameCharacter.detailDataElement.appendChild(giftElement);
    giftElement.appendChild(
      Utils.createDataElement('肉体', json.base.gift.body.value)
    );
    giftElement.appendChild(
      Utils.createDataElement('精神', json.base.gift.mind.value)
    );

    /*
     * 戦闘値
     */
    const powerElement = Utils.createDataElement('天分値', '');
    gameCharacter.detailDataElement.appendChild(powerElement);
    powerElement.appendChild(
      Utils.createDataElement('反応値', json.base.power.initiative)
    );
    powerElement.appendChild(
      Utils.createDataElement('攻撃力', json.base.power.attack)
    );
    powerElement.appendChild(
      Utils.createDataElement('破壊力', json.base.power.destroy)
    );

    /*
     * 性業値
     */
    const emotionElement = Utils.createDataElement('性業', '');
    gameCharacter.detailDataElement.appendChild(emotionElement);
    emotionElement.appendChild(
      Utils.createDataElement('性業値', json.base.emotion)
    );

    /*
     * 趣味
     */
    const hobbyElement = Utils.createDataElement('趣味(コミュニティ)　', '');
    gameCharacter.detailDataElement.appendChild(hobbyElement);
    const hobbyNameList = [
      ['イベント', '音楽', 'アラサガシ', 'アウトドア', '育成', 'アダルト'],
      [
        'アブノーマル',
        '好きなタグ',
        'おせっかい',
        '工作',
        'サビシガリヤ',
        '飲食',
      ],
      [
        'カワイイ',
        'トレンド',
        '好きなタグ',
        'スポーツ',
        'ヒマツブシ',
        'ギャンブル',
      ],
      ['トンデモ', '読書', '家事', '同一のタグ', '宗教', 'ゴシップ'],
      [
        'マニア',
        'パフォーマンス',
        'ガリ勉',
        'ハイソ',
        '同一のタグ',
        'ファッション',
      ],
      ['オタク', '美術', '健康', '旅行', 'ワビサビ', 'ハプニング'],
    ];
    let hobbyCount = 0;
    for (const hobby of json.learned) {
      if (!hobby.id) {
        continue;
      }
      hobbyCount++;
      // hobby.idは hobby.2_5 のような値を持っている(*_*の*部分はサイコロの目なので1スタート)
      const matchData = hobby.id.match(/^hobby\.(\d+)_(\d+)$/);
      if (!matchData) {
        continue;
      }
      const colId = matchData[1] - 1;
      const rowId = matchData[2] - 1;
      const hobbyName = hobbyNameList[rowId][colId];
      const category = [
        'ｻﾌﾞｶﾙ系',
        'ｱｰﾄ系',
        'ﾏｼﾞﾒ系',
        '休日系',
        'ｲﾔｼ系',
        '風俗系',
      ][colId];
      hobbyElement.appendChild(
        Utils.createDataElement(
          `趣味${hobbyCount}`,
          `${hobbyName} (${category})`
        )
      );
    }

    /*
     * 状態
     */
    const conditionElement = Utils.createDataElement('状態　', '');
    gameCharacter.detailDataElement.appendChild(conditionElement);
    conditionElement.appendChild(
      Utils.createDataElement('トラウマ', json.cond.trauma.value || '')
    );
    conditionElement.appendChild(
      Utils.createDataElement('中毒', json.cond.addiction.value || '')
    );
    conditionElement.appendChild(
      Utils.createDataElement('トリコ', json.cond.prisoner.value || '')
    );
    conditionElement.appendChild(
      Utils.createDataElement('SAN', json.cond.san.value || '')
    );
    conditionElement.appendChild(
      Utils.createDataElement(
        'クトゥルフ神話技能',
        json.cond.cthulhu.value || ''
      )
    );

    /*
     * アジト
     */
    const homeElement = Utils.createDataElement('アジト　', '');
    gameCharacter.detailDataElement.appendChild(homeElement);
    homeElement.appendChild(
      Utils.createDataElement('場所', json.home.place || '')
    );
    homeElement.appendChild(
      Utils.createDataElement('快適度', json.home.comfortable || '')
    );
    homeElement.appendChild(
      Utils.createDataElement('セキュリティ', json.home.security || '')
    );

    /*
     * 一般装備
     */
    const outfitsElement = Utils.createDataElement(
      '一般装備　使用／効果／特殊機能',
      ''
    );
    gameCharacter.detailDataElement.appendChild(outfitsElement);
    for (const outfits of json.outfits) {
      if (!outfits.name) {
        continue;
      }
      outfitsElement.appendChild(
        Utils.createNoteElement(
          outfits.name,
          `${outfits.use || ''}／${outfits.effect || ''}／${
            outfits.notes || ''
          }`
        )
      );
    }

    /*
     * 武器
     */
    const weaponsElement = Utils.createDataElement(
      '武器　命中／ダメージ／射程／特殊機能',
      ''
    );
    gameCharacter.detailDataElement.appendChild(weaponsElement);
    for (const weapons of json.weapons) {
      if (!weapons.name) {
        continue;
      }
      weaponsElement.appendChild(
        Utils.createNoteElement(
          weapons.name,
          `${weapons.aim || ''}／${weapons.damage || ''}／${
            weapons.range || ''
          }／${weapons.notes || ''}`
        )
      );
    }

    /*
     * 乗り物
     */
    const vehiclesElement = Utils.createDataElement(
      '乗り物　名称／スピード／車体／荷物／特殊機能',
      ''
    );
    gameCharacter.detailDataElement.appendChild(vehiclesElement);
    for (const vehicles of json.vehicles) {
      if (!vehicles.name) {
        continue;
      }
      vehiclesElement.appendChild(
        Utils.createNoteElement(
          vehicles.name,
          `${vehicles.speed || ''}／${vehicles.frame || ''}／${
            vehicles.burden || ''
          }／${vehicles.notes || ''}`
        )
      );
    }

    /*
     * カルマ
     */
    const karmaElement = Utils.createDataElement(
      'カルマ　異能or代償名／使用／対象／判定／効果',
      ''
    );
    gameCharacter.detailDataElement.appendChild(karmaElement);
    for (const karma of json.karma) {
      if (!karma.name) {
        continue;
      }
      karmaElement.appendChild(
        Utils.createNoteElement(
          `${karma.name} (異能)`,
          `${karma.talent.name || ''}／${karma.talent.use || ''}／${
            karma.talent.target || ''
          }／${karma.talent.judge || ''}／${karma.talent.effect || ''}`
        )
      );
      karmaElement.appendChild(
        Utils.createNoteElement(
          `${karma.name} (代償)`,
          `${karma.price.name || ''}／${karma.price.use || ''}／${
            karma.price.target || ''
          }／${karma.price.judge || ''}／${karma.price.effect || ''}`
        )
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Satasupe';
    // チャパレ内容
    let cp = `1D6
2D6
2D6>=
D66

//-----行為判定
`;
    cp += `\n({犯罪})R>=
({生活})R>=
({恋愛})R>=
({教養})R>=
({戦闘})R>=
({肉体})R>=
({精神})R>=

({攻撃力})R>=

SR{性業値}

//-----情報判定
TAGT{成功度数}　【タグ決定】
CrimeIET　【犯罪イベント表】
LifeIET　【生活イベント表】
LoveIET　【恋愛イベント表】
CultureIET　【教養イベント表】
CombatIET　【戦闘イベント表】
CrimeIHT　【犯罪ハプニング表】
LifeIHT　【生活ハプニング表】
LoveIHT　【恋愛ハプニング表】
CultureIHT　【教養ハプニング表】
CombatIHT　【戦闘ハプニング表】

//-----その他表
FumbleT 【命中判定ファンブル表】
FatalT 【致命傷表】
FatalVT　【乗物致命傷表】
RomanceFT　【ロマンスファンブル表】
AccidentT　【アクシデント表】
GeneralAT　【汎用アクシデント表】
AfterT　【その後表】
KusaiMT　【臭い飯表】
EnterT　【登場表】
BudTT　【バッドトリップ表】
NPCT 【NPCの年齢と好みを一括出力】

`;
    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
