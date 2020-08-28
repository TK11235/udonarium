import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter } from '../custom-character';

/**
 * キャラクターシート倉庫 サタスペ
 * https://character-sheets.appspot.com/satasupe/
 */
export class Satasupe {
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
     * リソース
     */
    const resourceElement = gameCharacter.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      gameCharacter.createResourceElement('肉体点', 10, 10)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement('精神点', 10, 10)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement('サイフ', json.base.abl.life.value, json.base.abl.life.value)
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
      gameCharacter.createDataElement('故郷', json.base.homeland || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('性別', json.base.sex || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('年齢', json.base.age || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('外見', json.base.style || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('所属チーム', json.base.team || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('表の顔', json.base.surface || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('盟約', json.base.alliance || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('階級', json.base.hierarchy || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('好きななもの', json.base.likes || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('嫌いなもの', json.base.dislikes || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('好みのタイプ', json.base.favorites || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('好みの映画', json.base.movie || '')
    );
    infoElement.appendChild(gameCharacter.createNoteElement('URL', url));

    /*
     * 環境値
     */
    const abilityElement = gameCharacter.createDataElement('環境値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      gameCharacter.createDataElement('犯罪', json.base.abl.crime.value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('生活', json.base.abl.life.value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('恋愛', json.base.abl.love.value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('教養', json.base.abl.culture.value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('戦闘', json.base.abl.combat.value)
    );

    /*
     * 天分値
     */
    const giftElement = gameCharacter.createDataElement('天分値', '');
    gameCharacter.detailDataElement.appendChild(giftElement);
    giftElement.appendChild(
      gameCharacter.createDataElement('肉体', json.base.gift.body.value)
    );
    giftElement.appendChild(
      gameCharacter.createDataElement('精神', json.base.gift.mind.value)
    );

    /*
     * 戦闘値
     */
    const powerElement = gameCharacter.createDataElement('天分値', '');
    gameCharacter.detailDataElement.appendChild(powerElement);
    powerElement.appendChild(
      gameCharacter.createDataElement('反応値', json.base.power.initiative)
    );
    powerElement.appendChild(
      gameCharacter.createDataElement('攻撃力', json.base.power.attack)
    );
    powerElement.appendChild(
      gameCharacter.createDataElement('破壊力', json.base.power.destroy)
    );

    /*
     * 性業値
     */
    const emotionElement = gameCharacter.createDataElement('性業', '');
    gameCharacter.detailDataElement.appendChild(emotionElement);
    emotionElement.appendChild(
      gameCharacter.createDataElement('性業値', json.base.emotion)
    );
    
    /*
     * 趣味
     */
    const hobbyElement = gameCharacter.createDataElement('趣味(コミュニティ)　',　'');
    gameCharacter.detailDataElement.appendChild(hobbyElement);
    const hobbyNameList = [
      ['イベント', '音楽', 'アラサガシ', 'アウトドア', '育成', 'アダルト'],
      ['アブノーマル', '好きなタグ', 'おせっかい', '工作', 'サビシガリヤ', '飲食'],
      ['カワイイ', 'トレンド', '好きなタグ', 'スポーツ', 'ヒマツブシ', 'ギャンブル'],
      ['トンデモ', '読書', '家事', '同一のタグ', '宗教', 'ゴシップ'],
      ['マニア', 'パフォーマンス', 'ガリ勉', 'ハイソ', '同一のタグ', 'ファッション'],
      ['オタク', '美術', '健康', '旅行', 'ワビサビ', 'ハプニング']
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
      const colId = matchData[1] -1;
      const rowId = matchData[2] -1;
      const hobbyName = hobbyNameList[rowId][colId];
      const category = ['ｻﾌﾞｶﾙ系', 'ｱｰﾄ系', 'ﾏｼﾞﾒ系', '休日系', 'ｲﾔｼ系', '風俗系'][colId];
      hobbyElement.appendChild(
        gameCharacter.createDataElement(
          `趣味${hobbyCount}`,
         `${hobbyName} (${category})`
        )
      );
    }
    
    /*
     * 状態
     */
    const conditionElement = gameCharacter.createDataElement('状態　',　'');
    gameCharacter.detailDataElement.appendChild(conditionElement);
    conditionElement.appendChild(
      gameCharacter.createDataElement('トラウマ', json.cond.trauma.value || '')
    );
    conditionElement.appendChild(
      gameCharacter.createDataElement('中毒', json.cond.addiction.value || '')
    );
    conditionElement.appendChild(
      gameCharacter.createDataElement('トリコ', json.cond.prisoner.value || '')
    );
    conditionElement.appendChild(
      gameCharacter.createDataElement('SAN', json.cond.san.value || '')
    );
    conditionElement.appendChild(
      gameCharacter.createDataElement('クトゥルフ神話技能', json.cond.cthulhu.value || '')
    );

    /*
     * アジト
     */
    const homeElement = gameCharacter.createDataElement('アジト　',　'');
    gameCharacter.detailDataElement.appendChild(homeElement);
    homeElement.appendChild(
      gameCharacter.createDataElement('トラウマ', json.home.place || '')
    );
    homeElement.appendChild(
      gameCharacter.createDataElement('中毒', json.home.comfortable || '')
    );
    homeElement.appendChild(
      gameCharacter.createDataElement('トリコ', json.home.security || '')
    );
    
    /*
     * 一般装備
     */
    const outfitsElement = gameCharacter.createDataElement('一般装備　使用／効果／特殊機能',　'');
    gameCharacter.detailDataElement.appendChild(outfitsElement);
    for (const outfits of json.outfits) {
      if (!outfits.name) {
        continue;
      }
      outfitsElement.appendChild(
        gameCharacter.createNoteElement(
          outfits.name,
          `${outfits.use || ''}／${outfits.effect || ''}／${outfits.notes || ''}`
        )
      );
    }

    /*
     * 武器
     */
    const weaponsElement = gameCharacter.createDataElement('武器　命中／ダメージ／射程／特殊機能',　'');
    gameCharacter.detailDataElement.appendChild(weaponsElement);
    for (const weapons of json.weapons) {
      if (!weapons.name) {
        continue;
      }
      weaponsElement.appendChild(
        gameCharacter.createNoteElement(
          weapons.name,
          `${weapons.aim || ''}／${weapons.damage || ''}／${weapons.range || ''}／${weapons.notes || ''}`
        )
      );
    }

    /*
     * 乗り物
     */
    const vehiclesElement = gameCharacter.createDataElement('乗り物　名称／スピード／車体／荷物／特殊機能',　'');
    gameCharacter.detailDataElement.appendChild(vehiclesElement);
    for (const vehicles of json.vehicles) {
      if (!vehicles.name) {
        continue;
      }
      vehiclesElement.appendChild(
        gameCharacter.createNoteElement(
          vehicles.name,
          `${vehicles.speed || ''}／${vehicles.frame || ''}／${vehicles.burden || ''}／${vehicles.notes || ''}`
        )
      );
    }
 
    /*
     * カルマ
     */
    const karmaElement = gameCharacter.createDataElement('カルマ　異能or代償名／使用／対象／判定／効果',　'');
    gameCharacter.detailDataElement.appendChild(karmaElement);
    for (const karma of json.karma) {
      if (!karma.name) {
        continue;
      }
      karmaElement.appendChild(
        gameCharacter.createNoteElement(
          `${karma.name} (異能)`,
          `${karma.talent.name || ''}／${karma.talent.use || ''}／${karma.talent.target || ''}／${karma.talent.judge || ''}／${karma.talent.effect || ''}`
        )
      );
      karmaElement.appendChild(
        gameCharacter.createNoteElement(
          `${karma.name} (代償)`,
          `${karma.price.name || ''}／${karma.price.use || ''}／${karma.price.target || ''}／${karma.price.judge || ''}／${karma.price.effect || ''}`
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
