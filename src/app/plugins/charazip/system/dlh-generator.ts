import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter } from '../custom-character';
import { strictEqual } from 'assert';
import { stringify } from 'querystring';

/**
 * キャラクターシート倉庫 インセイン
 * https://character-sheets.appspot.com/dlh/
 */
export class DlhGenerator {
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
      gameCharacter.createDataElement('本名', json.base.nameKana || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('オリジン', json.base.origin)
    );
    infoElement.appendChild(
      gameCharacter.createNoteElement('説明', json.base.memo)
    );
    infoElement.appendChild(gameCharacter.createNoteElement('URL', url));

    /*
     * リソース
     */
    const resourceElement = gameCharacter.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      gameCharacter.createResourceElement('ターン・カウンタ', 21, 0)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        'ライフ',
        json.energy.life.max,
        json.energy.life.current
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        'サニティ',
        json.energy.sanity.max,
        json.energy.sanity.current
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        'クレジット',
        json.energy.credit.max,
        json.energy.credit.current
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        'リマーク',
        1,
        json.energy.remark ? 1 : 0
      )
    );
    resourceElement.appendChild(gameCharacter.createNoteElement('状態', ''));

    /*
     * 能力値
     */
    const abilityElement = gameCharacter.createDataElement('能力値', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      gameCharacter.createDataElement('肉体', json.ability.body.value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('精神', json.ability.mental.value)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('環境', json.ability.env.value)
    );

    /*
     * 技能
     */
    // 肉体技能
    const bodySkillElement = gameCharacter.createDataElement('肉体技能', '');
    gameCharacter.detailDataElement.appendChild(bodySkillElement);
    bodySkillElement.appendChild(
      gameCharacter.createDataElement(
        '白兵Lv',
        json.skills.body.s1.level || '0'
      )
    );
    bodySkillElement.appendChild(
      gameCharacter.createDataElement(
        '射撃Lv',
        json.skills.body.s2.level || '0'
      )
    );
    bodySkillElement.appendChild(
      gameCharacter.createDataElement(
        '運動Lv',
        json.skills.body.s3.level || '0'
      )
    );
    bodySkillElement.appendChild(
      gameCharacter.createDataElement(
        '生存Lv',
        json.skills.body.s4.level || '0'
      )
    );
    bodySkillElement.appendChild(
      gameCharacter.createDataElement(
        '操縦Lv',
        json.skills.body.s5.level || '0'
      )
    );
    // 精神技能
    const mentalSkillElement = gameCharacter.createDataElement('精神技能', '');
    gameCharacter.detailDataElement.appendChild(mentalSkillElement);
    mentalSkillElement.appendChild(
      gameCharacter.createDataElement(
        '霊能Lv',
        json.skills.mental.s1.level || '0'
      )
    );
    mentalSkillElement.appendChild(
      gameCharacter.createDataElement(
        '心理Lv',
        json.skills.mental.s2.level || '0'
      )
    );
    mentalSkillElement.appendChild(
      gameCharacter.createDataElement(
        '意志Lv',
        json.skills.mental.s3.level || '0'
      )
    );
    mentalSkillElement.appendChild(
      gameCharacter.createDataElement(
        '知覚Lv',
        json.skills.mental.s4.level || '0'
      )
    );
    mentalSkillElement.appendChild(
      gameCharacter.createDataElement(
        '追憶Lv',
        json.skills.mental.s5.level || '0'
      )
    );
    // 環境技能
    const envSkillElement = gameCharacter.createDataElement('環境技能', '');
    gameCharacter.detailDataElement.appendChild(envSkillElement);
    envSkillElement.appendChild(
      gameCharacter.createDataElement('作戦Lv', json.skills.env.s1.level || '0')
    );
    envSkillElement.appendChild(
      gameCharacter.createDataElement('隠密Lv', json.skills.env.s2.level || '0')
    );
    envSkillElement.appendChild(
      gameCharacter.createDataElement('交渉Lv', json.skills.env.s3.level || '0')
    );
    envSkillElement.appendChild(
      gameCharacter.createDataElement('科学Lv', json.skills.env.s4.level || '0')
    );
    envSkillElement.appendChild(
      gameCharacter.createDataElement('経済Lv', json.skills.env.s5.level || '0')
    );

    /*
     * パワー
     */
    const powerElement = gameCharacter.createDataElement('パワー', '');
    gameCharacter.detailDataElement.appendChild(powerElement);
    for (const power of json.power) {
      if (!power.name) {
        continue;
      }
      powerElement.appendChild(
        gameCharacter.createNoteElement(
          power.name,
          `${power.attribute || '-'} / ${power.judge || '-'} / ${power.timing ||
            '-'} / ${power.range || '-'} / ${power.target ||
            '-'} / ${power.cost || '-'} / ${power.effect || '-'}`
        )
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'DeadlineHeroes';
    // チャパレ内容
    let cp = `1D6
2D6
3D6
1D10
DLH00

//------技能
【肉体】
DLH{白兵} 白兵判定
DLH{射撃} 射撃判定
DLH{運動} 運動判定
DLH{生存} 生存判定
DLH{操縦} 操縦判定
【精神】
DLH{霊能} 霊能判定
DLH{心理} 心理判定
DLH{意志} 意志判定
DLH{知覚} 知覚判定
DLH{追憶} 追憶判定
【環境】
DLH{作戦} 作戦判定
DLH{隠密} 隠密判定
DLH{交渉} 交渉判定
DLH{科学} 科学判定
DLH{経済} 経済判定

//------パワー
`;
    cp += json.power
      .filter((power: any) => power.name)
      .reduce(
        (txt: string, power: any) =>
          txt +
          `【${power.name}】 ${power.attribute || '-'} / ${power.judge ||
            '-'} / ${power.timing || '-'} / ${power.range ||
            '-'} / ${power.target || '-'} / ${power.cost ||
            '-'} / ${power.effect || '-'}`.replace(/\n/g, ' ') +
          '\n',
        ''
      );

    cp += `
//------デスチャート
DCL(0-{ライフ}) (肉体)デスチャート
DCS(0-{サニティ}) (精神)デスチャート
DCC(0-{クレジット}) (環境)デスチャート

//------判定オプション
【集中】 代償：サニティ4 / 自身の判定直前に使用。成功率を+10%してもよい。
【支援】 代償：クレジット4 / 他人の判定直前に使用。成功率を+10%してもよい。（複数の支援は累積しない）

//------共通アクション
【基本攻撃】 判定：任意 / タイミング：行動 / 射程：1 / 対象：1体 / 代償：ターン10 / 1D6点のダメージを与える。
1D6 【基本攻撃】 ダメージ
【戦闘移動】 代償：ターン5 / タイミング：行動 / 隣接するエリアに移動する。ただし敵のいるエリアへは移動できない。また、敵と同じエリアにいる場合、このアクションを取ることはできない。
【接敵】 代償：ターン10 / タイミング：行動 / 敵のいないエリアから敵がいる隣接エリアへと移動する。
【離脱】 代償：ターン10 / タイミング：行動 / 敵がいるエリアから、隣接するエリアに移動する。
【飛行状態になる】 代償：ターン2 / タイミング：行動 / 「移動適正：飛行」を持つキャラクターが、飛行状態となることができる。解除にも同様の代償が必要。
【隠れる】 判定：隠密 / 代償：ターン20 / タイミング：行動 / 隠密状態になり、隠密エリアに移動する。敵のいるエリアではこのアクションは選択できない。
DLH{隠密} 【隠れる】 隠密判定
【待機】 代償：任意のターン / アクションとして「何もしない」を選択。

//------変数定義用（弄らない）
//白兵={肉体}+{白兵Lv}
//射撃={肉体}+{射撃Lv}
//運動={肉体}+{運動Lv}
//生存={肉体}+{生存Lv}
//操縦={肉体}+{操縦Lv}
//霊能={精神}+{霊能Lv}
//心理={精神}+{心理Lv}
//意志={精神}+{意志Lv}
//知覚={精神}+{知覚Lv}
//追憶={精神}+{追憶Lv}
//作戦={環境}+{作戦Lv}
//隠密={環境}+{隠密Lv}
//交渉={環境}+{交渉Lv}
//科学={環境}+{科学Lv}
//経済={環境}+{経済Lv}

`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
