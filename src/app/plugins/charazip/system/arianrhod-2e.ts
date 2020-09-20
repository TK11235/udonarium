import { CustomCharacter, Utils } from '../custom-character';
import { VampireBloodFactory } from '../system-factory';

/**
 * キャラクター保管所 アリアンロッド
 */
export class Arianrhod2e implements VampireBloodFactory {
  gameSystem = 'ara2';
  name = 'アリアンロッド2e';
  href = 'https://charasheet.vampire-blood.net/list_ara2.html';
  create = Arianrhod2e.create;

  static vampireBloodFactory(): VampireBloodFactory {
    return new Arianrhod2e();
  }

  private static create(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.pc_name,
      3,
      ''
    );

    /*
     * 情報
     */
    const infoElement = gameCharacter.createParentElement('情報');
    infoElement.appendChild(Utils.createDataElement('Player', ''));
    infoElement.appendChild(Utils.createDataElement('年齢', json.age));
    infoElement.appendChild(Utils.createDataElement('性別', json.sex));
    infoElement.appendChild(Utils.createDataElement('CL', json.SL_level));
    infoElement.appendChild(
      Utils.createDataElement('メインクラス', json.main_class)
    );
    infoElement.appendChild(
      Utils.createDataElement('サポートクラス', json.support_class)
    );
    infoElement.appendChild(Utils.createDataElement('種族', json.shuzoku));
    infoElement.appendChild(
      Utils.createNoteElement('設定', json.pc_making_memo)
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * キャラクターの外見
     */
    const appearanceElement = gameCharacter.createParentElement(
      'キャラクターの外見'
    );
    appearanceElement.appendChild(
      Utils.createDataElement('身長', json.pc_height)
    );
    appearanceElement.appendChild(
      Utils.createDataElement('体重', json.pc_weight)
    );
    appearanceElement.appendChild(
      Utils.createDataElement('髪の色', json.color_hair)
    );
    appearanceElement.appendChild(
      Utils.createDataElement('瞳の色', json.color_eye)
    );
    appearanceElement.appendChild(
      Utils.createDataElement('肌の色', json.color_skin)
    );

    /*
     * ライフパス
     */
    const lifepathElement = gameCharacter.createParentElement('ライフパス');
    // 出自
    const shutujiElement = gameCharacter.createParentElement(
      '▼出自',
      lifepathElement
    );
    const shutuji = `${json.shutuji_name}: ${json.shutuji_memo}`;
    shutujiElement.appendChild(Utils.createNoteElement('出自', shutuji));
    shutujiElement.appendChild(
      Utils.createDataElement(
        '取得一般スキル',
        '{《出自で取得したスキル名を記載》}'
      )
    );
    shutujiElement.appendChild(
      Utils.createNoteElement(
        '注意',
        '※キャラクターシートのスキル欄にデータを記載してください。'
      )
    );
    // 境遇
    const kyouguElement = gameCharacter.createParentElement(
      '▼境遇',
      lifepathElement
    );
    const kyougu = `${json.kyougu_name}: ${json.kyougu_memo}`;
    kyouguElement.appendChild(Utils.createNoteElement('境遇', kyougu));
    // 目的
    const mokutekiElement = gameCharacter.createParentElement(
      '▼目的',
      lifepathElement
    );
    const mokuteki = `${json.unmei_name}: ${json.unmei_memo}`;
    mokutekiElement.appendChild(Utils.createNoteElement('目的', mokuteki));

    /*
     * リソース
     */
    const resourceElement = gameCharacter.createParentElement('リソース');
    resourceElement.appendChild(
      Utils.createResourceElement('HP', json.NP8, json.NP8)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('MP', json.NP9, json.NP9)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('フェイト', json.SL_fate, json.SL_fate)
    );
    // フェイト使用上限
    const fateLimitElement = gameCharacter.createParentElement(
      'フェイト使用上限',
      resourceElement
    );
    fateLimitElement.appendChild(Utils.createDataElement('使用上限', json.NP7));
    resourceElement.appendChild(
      Utils.createResourceElement('追加ダイス数', 10, 0)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('行動値', json.BSUM6, json.BSUM6)
    );
    // 防御力
    const defenseElement = gameCharacter.createParentElement(
      '防御力',
      resourceElement
    );
    defenseElement.appendChild(Utils.createDataElement('物防', json.BSUM4));
    defenseElement.appendChild(Utils.createDataElement('魔防', json.BSUM5));
    resourceElement.appendChild(
      Utils.createResourceElement(
        '携帯重量/携帯可能重量',
        json.weight_item_max,
        json.weight_item_sum
      )
    );
    resourceElement.appendChild(
      Utils.createDataElement('移動力', `${json.BSUM7}m`)
    );
    resourceElement.appendChild(
      Utils.createDataElement('所持金', `${json.money}G`)
    );

    /*
     *能力値
     */
    const abilityElement = gameCharacter.createParentElement('能力値');
    // 筋力
    const strElement = gameCharacter.createParentElement(
      `筋力基本値: ${json.NK1}`,
      abilityElement
    );
    strElement.appendChild(Utils.createDataElement('筋力', json.NP1));
    // 器用
    const dexElement = gameCharacter.createParentElement(
      `器用基本値: ${json.NK2}`,
      abilityElement
    );
    dexElement.appendChild(Utils.createDataElement('器用', json.NP2));
    // 敏捷
    const aglElement = gameCharacter.createParentElement(
      `敏捷基本値: ${json.NK3}`,
      abilityElement
    );
    aglElement.appendChild(Utils.createDataElement('敏捷', json.NP3));
    // 知力
    const intElement = gameCharacter.createParentElement(
      `知力基本値: ${json.NK4}`,
      abilityElement
    );
    intElement.appendChild(Utils.createDataElement('知力', json.NP4));
    // 感知
    const wisElement = gameCharacter.createParentElement(
      `感知基本値: ${json.NK5}`,
      abilityElement
    );
    wisElement.appendChild(Utils.createDataElement('感知', json.NP5));
    // 精神
    const powElement = gameCharacter.createParentElement(
      `精神基本値: ${json.NK6}`,
      abilityElement
    );
    powElement.appendChild(Utils.createDataElement('精神', json.NP6));
    // 幸運
    const lukElement = gameCharacter.createParentElement(
      `精神基本値: ${json.NK7}`,
      abilityElement
    );
    lukElement.appendChild(Utils.createDataElement('幸運', json.NP7));

    /*
     * 戦闘値
     */
    const combatElement = gameCharacter.createParentElement('戦闘値');
    combatElement.appendChild(
      Utils.createDataElement(
        '命中判定:右',
        `${json.BSUM1R}+{${json.dice_meichu}}D6`
      )
    );
    combatElement.appendChild(
      Utils.createDataElement(
        '攻撃力:右',
        `${json.BSUM2R}+{${json.dice_attack}}D6`
      )
    );
    combatElement.appendChild(
      Utils.createDataElement(
        '命中判定:左',
        `${json.BSUM1L}+{${json.dice_meichu}}D6`
      )
    );
    combatElement.appendChild(
      Utils.createDataElement(
        '攻撃力:左',
        `${json.BSUM2L}+{${json.dice_attack}}D6`
      )
    );
    combatElement.appendChild(
      Utils.createDataElement(
        '回避判定',
        `${json.BSUM3}+{${json.dice_kaihi}}D6`
      )
    );

    /*
     * 携帯品
     */
    const itemElement = gameCharacter.createParentElement('携帯品(重量)[価格]');
    for (let i = 0; i < json.item_name.length; i++) {
      const name = json.item_name[i];
      if (!name) {
        continue;
      }
      const weight = json.item_weight[i];
      const price = json.item_price[i];
      const memo = json.item_memo[i];
      const elm = gameCharacter.createParentElement(
        `${name}(${weight})[価格:${price}]`,
        itemElement
      );
      elm.appendChild(Utils.createNoteElement(name, memo));
    }

    /*
     * スキル
     */
    const skillElement = gameCharacter.createParentElement(
      'スキル名:レベル/タイミング/判定/対象/射程/コスト'
    );
    // 種族スキル
    const shuzokuSkillName = `《${json.shuzoku_skill_name}》`;
    const shuzokuSkill = [
      `${shuzokuSkillName}:LV★`,
      json.shuzoku_skill_timing,
      json.shuzoku_skill_hantei,
      json.shuzoku_skill_taisho,
      json.shuzoku_skill_range,
      json.shuzoku_skill_cost,
    ].join('/');
    const shuzokuSkillElm = gameCharacter.createParentElement(
      shuzokuSkill,
      skillElement
    );
    shuzokuSkillElm.appendChild(
      Utils.createNoteElement(shuzokuSkillName, json.shuzoku_skill_memo)
    );
    // メインクラススキル
    const mClsSkillName = `《${json.m_cls_skill_name}》`;
    const mClsSkill = [
      `${mClsSkillName}:LV${json.mcls_skill_lv}`,
      json.m_cls_skill_timing,
      json.m_cls_skill_hantei,
      json.m_cls_skill_taisho,
      json.m_cls_skill_range,
      json.m_cls_skill_cost,
    ].join('/');
    const mClsSkillElm = gameCharacter.createParentElement(
      mClsSkill,
      skillElement
    );
    mClsSkillElm.appendChild(
      Utils.createNoteElement(mClsSkillName, json.m_cls_skill_memo)
    );
    for (let i = 0; i < json.skill_name.length; i++) {
      const name = json.skill_name[i];
      if (!name) {
        continue;
      }
      const skillHeader = [
        `《${name}》:LV${json.skill_lv[i]}`,
        json.skill_timing[i],
        json.skill_hantei[i],
        json.skill_taisho[i],
        json.skill_range[i],
        json.skill_cost[i],
      ].join('/');
      const elm = gameCharacter.createParentElement(skillHeader, skillElement);
      elm.appendChild(
        Utils.createNoteElement(`《${name}》`, json.skill_memo[i])
      );
    }
    for (let i = 0; i < json.ippanskill_name.length; i++) {
      const name = json.ippanskill_name[i];
      if (!name) {
        continue;
      }
      const skillHeader = [
        `《${name}》:LV${json.ippanskill_lv[i]}`,
        json.ippanskill_timing[i],
        json.ippanskill_hantei[i],
        json.ippanskill_taisho[i],
        json.ippanskill_range[i],
        json.ippanskill_cost[i],
      ].join('/');
      const elm = gameCharacter.createParentElement(skillHeader, skillElement);
      elm.appendChild(
        Utils.createNoteElement(`《${name}》`, json.ippanskill_memo[i])
      );
    }

    /*
     * 装備品
     */
    const equipmentElement = gameCharacter.createParentElement('装備品');
    // 右手
    const rightHandElement = gameCharacter.createParentElement(
      `右手:${json.IR_name}`,
      equipmentElement
    );
    rightHandElement.appendChild(
      Utils.createDataElement('武器名:右', json.IR_name)
    );
    const rightHandData = [
      `種別:${json.IR_type}`,
      `Lv:${json.IR_lv}`,
      `重量:${json.IR_weight}`,
      `命中判定:${json.BIR1}`,
      `攻撃力:${json.BIR2}`,
      `回避判定:${json.BIR3}`,
      `物理防御:${json.BIR4}`,
      `魔法防御:${json.BIR5}`,
      `行動値:${json.BIR6}`,
      `移動力:${json.BIR7}`,
      `射程:${json.IR_shatei}`,
      `価格:${json.IR_price}`,
      `説明:${json.IR_memo}`,
    ].join('\n');
    rightHandElement.appendChild(
      Utils.createNoteElement('武器データ:右', rightHandData)
    );
    // 左手
    const leftHandElement = gameCharacter.createParentElement(
      `左手:${json.IL_name}`,
      equipmentElement
    );
    leftHandElement.appendChild(
      Utils.createDataElement('武器名:左', json.IL_name)
    );
    const leftHandData = [
      `種別:${json.IL_type}`,
      `Lv:${json.IL_lv}`,
      `重量:${json.IL_weight}`,
      `命中判定:${json.BIL1}`,
      `攻撃力:${json.BIL2}`,
      `回避判定:${json.BIL3}`,
      `物理防御:${json.BIL4}`,
      `魔法防御:${json.BIL5}`,
      `行動値:${json.BIL6}`,
      `移動力:${json.BIL7}`,
      `射程:${json.IL_shatei}`,
      `価格:${json.IL_price}`,
      `説明:${json.IL_memo}`,
    ].join('\n');
    leftHandElement.appendChild(
      Utils.createNoteElement('武器データ:左', leftHandData)
    );
    equipmentElement.appendChild(
      Utils.createResourceElement(
        '武器総重量/筋力基本値',
        json.weight_arms_max,
        json.weight_arms_sum
      )
    );
    // 頭部
    const headElement = gameCharacter.createParentElement(
      `頭部:${json.IH_name}`,
      equipmentElement
    );
    headElement.appendChild(Utils.createDataElement('防具名:頭', json.IH_name));
    const headData = [
      `種別:${json.IH_type}`,
      `Lv:${json.IH_lv}`,
      `重量:${json.IH_weight}`,
      `命中判定:${json.BIH1}`,
      `攻撃力:${json.BIH2}`,
      `回避判定:${json.BIH3}`,
      `物理防御:${json.BIH4}`,
      `魔法防御:${json.BIH5}`,
      `行動値:${json.BIH6}`,
      `移動力:${json.BIH7}`,
      `価格:${json.IH_price}`,
      `説明:${json.IH_memo}`,
    ].join('\n');
    headElement.appendChild(Utils.createNoteElement('防具データ:頭', headData));
    // 胴部
    const bodyElement = gameCharacter.createParentElement(
      `胴部:${json.IB_name}`,
      equipmentElement
    );
    bodyElement.appendChild(Utils.createDataElement('防具名:胴', json.IB_name));
    const bodyData = [
      `種別:${json.IB_type}`,
      `Lv:${json.IB_lv}`,
      `重量:${json.IB_weight}`,
      `命中判定:${json.BIB1}`,
      `攻撃力:${json.BIB2}`,
      `回避判定:${json.BIB3}`,
      `物理防御:${json.BIB4}`,
      `魔法防御:${json.BIB5}`,
      `行動値:${json.BIB6}`,
      `移動力:${json.BIB7}`,
      `価格:${json.IB_price}`,
      `説明:${json.IB_memo}`,
    ].join('\n');
    bodyElement.appendChild(Utils.createNoteElement('防具データ:胴', bodyData));
    // 補助防具
    const subGuardElement = gameCharacter.createParentElement(
      `補助防具:${json.IS_name}`,
      equipmentElement
    );
    subGuardElement.appendChild(
      Utils.createDataElement('防具名:補', json.IS_name)
    );
    const subGuardData = [
      `種別:${json.IS_type}`,
      `Lv:${json.IS_lv}`,
      `重量:${json.IS_weight}`,
      `命中判定:${json.BIS1}`,
      `攻撃力:${json.BIS2}`,
      `回避判定:${json.BIS3}`,
      `物理防御:${json.BIS4}`,
      `魔法防御:${json.BIS5}`,
      `行動値:${json.BIS6}`,
      `移動力:${json.BIS7}`,
      `価格:${json.IS_price}`,
      `説明:${json.IS_memo}`,
    ].join('\n');
    subGuardElement.appendChild(
      Utils.createNoteElement('防具データ:補', subGuardData)
    );
    // 装身具
    const jeweleyElement = gameCharacter.createParentElement(
      `装身具:${json.IA_name}`,
      equipmentElement
    );
    jeweleyElement.appendChild(
      Utils.createDataElement('防具名:装', json.IA_name)
    );
    const jeweleyData = [
      `種別:${json.IA_type}`,
      `Lv:${json.IA_lv}`,
      `重量:${json.IA_weight}`,
      `命中判定:${json.BIA1}`,
      `攻撃力:${json.BIA2}`,
      `回避判定:${json.BIA3}`,
      `物理防御:${json.BIA4}`,
      `魔法防御:${json.BIA5}`,
      `行動値:${json.BIA6}`,
      `移動力:${json.BIA7}`,
      `価格:${json.IA_price}`,
      `説明:${json.IA_memo}`,
    ].join('\n');
    jeweleyElement.appendChild(
      Utils.createNoteElement('防具データ:装', jeweleyData)
    );
    equipmentElement.appendChild(
      Utils.createResourceElement(
        '防具総重量／筋力基本値',
        json.weight_body_max,
        json.weight_body_sum
      )
    );

    /*
     * 状態管理
     */
    const statusElement = gameCharacter.createParentElement('状態管理');
    statusElement.appendChild(Utils.createResourceElement('待機', 1, 0));
    statusElement.appendChild(Utils.createResourceElement('戦闘不能', 1, 0));
    statusElement.appendChild(
      Utils.createNoteElement('受けているBS', '※ここに記載')
    );
    const dicerollElement = gameCharacter.createParentElement(
      'ダイスロール',
      statusElement
    );
    dicerollElement.appendChild(
      Utils.createNoteElement(
        '注意',
        'ダイスロール時の初期ダイス数が10以上になる場合は、下記で項目を追記してください（nは自然数）。'
      )
    );
    dicerollElement.appendChild(Utils.createResourceElement('n', 20, 10));
    dicerollElement.appendChild(
      Utils.createDataElement('m', '({n}＋{追加ダイス数})')
    );

    /*
     * フェイトの使用
     */
    const fateElement = gameCharacter.createParentElement('フェイトの使用');
    fateElement.appendChild(
      Utils.createNoteElement(
        '振り直し',
        'フェイトを消費して、判定の振り直しを行なう。\nフェイトを１点消費。'
      )
    );
    fateElement.appendChild(
      Utils.createNoteElement(
        'ダイス増加',
        'フェイトを消費して、ダイス増加を行なう。\nフェイト使用上限以下の点数を消費。\n消費した点数分インベントリで「追加ダイス数」を上昇させること。'
      )
    );

    /*
     * 詳細
     */
    const detailElement = gameCharacter.createParentElement('◆詳細');
    detailElement.appendChild(
      Utils.createNoteElement('詳細', '判定は、チャットパレット参照。')
    );
    detailElement.appendChild(
      Utils.createNoteElement(
        '注意',
        '▼レベルアップ時の注意\n　・判定などに記載されている{　}の部分は、数字ではなく計算式を表わしているため、この部分を変更するとチャットパレットからの出力がうまく表示されなくなる可能性があります。'
      )
    );

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette = Utils.createChatPalette('Arianrhod');
    // チャパレ内容
    const cpArr: string[] = [];
    cpArr.push(`■使用方法-----------------------------------------------
◆の下の行をダブルクリックすると情報が出力されます。
「追加ダイス数」は、インベントリで操作可能。
　（フェイト使用時、スキル使用時、クリティカル時に使用）
--------------------------------------------------------
◆現在リソース
HP: {HP}
MP: {MP}
フェイト: {フェイト}

◆フェイトの使用-----------------------------------------
{振り直し}
{ダイス増加}

■判定---------------------------------------------------
◆能力値判定
{筋力}+{2}D6　で【筋力】判定。
{器用}+{2}D6　で【器用】判定。
{敏捷}+{2}D6　で【敏捷】判定。
{知力}+{2}D6　で【知力】判定。
{感知}+{2}D6　で【感知】判定。
{精神}+{2}D6　で【精神】判定。
{幸運}+{2}D6　で【幸運】判定。

◆特殊な判定`);
    // トラップ探知
    const trapDetectionMod =
      Number.parseInt(json.THS1, 10) + Number.parseInt(json.THO1, 10);
    cpArr.push(
      `{感知}${Utils.formatModifier(trapDetectionMod)}+{${
        json.dice_wanatanti
      }}D6　でトラップ探知。`
    );
    // トラップ解除
    const trapReleaseMod =
      Number.parseInt(json.THS2, 10) + Number.parseInt(json.THO2, 10);
    cpArr.push(
      `{器用}${Utils.formatModifier(trapReleaseMod)}+{${
        json.dice_wanakaijo
      }}D6　でトラップ解除。`
    );
    // 危険感知
    const dangerDetectionMod =
      Number.parseInt(json.THS3, 10) + Number.parseInt(json.THO3, 10);
    cpArr.push(
      `{感知}${Utils.formatModifier(dangerDetectionMod)}+{${
        json.dice_kanti
      }}D6　で危険感知。`
    );
    // エネミー識別
    const enemyIdentifyMod =
      Number.parseInt(json.THS4, 10) + Number.parseInt(json.THO4, 10);
    cpArr.push(
      `{知力}${Utils.formatModifier(enemyIdentifyMod)}+{${
        json.dice_sikibetu
      }}D6　でエネミー識別。`
    );
    // アイテム鑑定
    const itemIdentifyMod =
      Number.parseInt(json.THS5, 10) + Number.parseInt(json.THO5, 10);
    cpArr.push(
      `{知力}${Utils.formatModifier(itemIdentifyMod)}+{${
        json.dice_kantei
      }}D6　でアイテム鑑定。`
    );
    // 魔術判定
    const magicMod =
      Number.parseInt(json.THS6, 10) + Number.parseInt(json.THO6, 10);
    cpArr.push(
      `{知力}${Utils.formatModifier(magicMod)}+{${
        json.dice_majutu || 0
      }}D6　で魔術判定。`
    );
    // 呪歌判定
    const bardicMod =
      Number.parseInt(json.THS7, 10) + Number.parseInt(json.THO7, 10);
    cpArr.push(
      `{精神}${Utils.formatModifier(bardicMod)}+{${
        json.dice_juka || 0
      }}D6　で呪歌判定。`
    );
    // 錬金術
    const alchemyMod =
      Number.parseInt(json.THS8, 10) + Number.parseInt(json.THO8, 10);
    cpArr.push(
      `{器用}${Utils.formatModifier(alchemyMod)}+{${
        json.dice_renkin || 0
      }}D6　で錬金術判定。`
    );
    cpArr.push(`{筋力}+{2}D6　で登攀・跳躍判定。

■戦闘---------------------------------------------------
◆リアクション
{回避判定}　で回避判定

◆メジャー：攻撃（クリティカル時、「追加ダイス数」を変更してダメージロールへ）
{命中判定:右}
{命中判定:左}

◆ダメージロール
{攻撃力:右}　点のダメージ。
{攻撃力:左}　点のダメージ。

■アイテムデータ-----------------------------------------
◆携帯品`);
    json.item_name
      .filter((name) => name)
      .forEach((name) => cpArr.push(`${name}: {${name}}`));
    cpArr.push(`
■スキル-------------------------------------------------
${shuzokuSkillName}: {${shuzokuSkillName}}
${mClsSkillName}: {${mClsSkillName}}`);
    json.skill_name
      .filter((name) => name)
      .forEach((name) => cpArr.push(`《${name}》: {《${name}》}`));
    json.ippanskill_name
      .filter((name) => name)
      .forEach((name) => cpArr.push(`《${name}》: {《${name}》}`));

    cpArr.push(`
--------------------------------------------------------
以下チャットパレット用
※変更するとチャットパレットがうまく表示されなくなります。
//0=(0＋{追加ダイス数})
//1=(1＋{追加ダイス数})
//2=(2＋{追加ダイス数})
//3=(3＋{追加ダイス数})
//4=(4＋{追加ダイス数})
//5=(5＋{追加ダイス数})
//6=(6＋{追加ダイス数})
//7=(7＋{追加ダイス数})
//8=(8＋{追加ダイス数})
//9=(9＋{追加ダイス数})
`);
    palette.setPalette(cpArr.join('\n'));
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
