import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter } from '../custom-character';

export class Dx3rdGenerator {
  /**
   * キャラクター保管所 ダブルクロス3rd
   * https://charasheet.vampire-blood.net/list_dx3.html
   */
  static generateByVampireVlood(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.pc_name,
      1,
      ''
    );

    /*
     * 情報
     */
    const infoElement = gameCharacter.createDataElement('基本情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(gameCharacter.createDataElement('PL', ''));
    infoElement.appendChild(
      gameCharacter.createDataElement('コードネーム', json.pc_codename)
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('ワークス', json.works_name)
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('カヴァー', json.cover_name)
    );
    const syndrome =
      json.class1_name +
      (json.class2_name ? `／${json.class2_name}` : '') +
      (json.class3_name ? `／${json.class3_name}` : '');
    infoElement.appendChild(
      gameCharacter.createDataElement('シンドローム', syndrome)
    );
    infoElement.appendChild(
      gameCharacter.createNoteElement('説明', json.pc_making_memo)
    );
    infoElement.appendChild(gameCharacter.createNoteElement('URL', url));

    /*
     * リソース
     */
    const resourceElement = gameCharacter.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      gameCharacter.createResourceElement('HP', json.NP5, json.NP5)
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement('行動値', json.armer_total_act)
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement('移動', json.NP8)
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement('装甲値', json.armer_total_def)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        '財産点',
        json.money_point,
        json.money || json.money_point
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement('ロイス', 7, 7)
    );

    /*
     * 侵蝕率の影響
     */
    const erotionElement = gameCharacter.createDataElement('侵蝕率の影響', '');
    gameCharacter.detailDataElement.appendChild(erotionElement);
    erotionElement.appendChild(
      gameCharacter.createResourceElement('侵蝕率', 200, json.NP6)
    );
    erotionElement.appendChild(gameCharacter.createResourceElement('Lv', 3, 0));
    erotionElement.appendChild(gameCharacter.createResourceElement('D', 8, 0));

    /*
     * ライフパス
     */
    const lifepathElement = gameCharacter.createDataElement('ライフパス', '');
    gameCharacter.detailDataElement.appendChild(lifepathElement);
    lifepathElement.appendChild(
      gameCharacter.createDataElement('出自', json.shutuji_name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('経験', json.keiken_name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('邂逅', json.kaikou_name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('覚醒', json.birth_name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('衝動', json.think_name)
    );

    /*
     * ロイス
     */
    const roiceElement = gameCharacter.createDataElement(
      'ロイス（好意／悪意）',
      ''
    );
    gameCharacter.detailDataElement.appendChild(roiceElement);
    for (let i = 0; i < json.roice_name.length; i++) {
      const roiceName = json.roice_name[i];
      const positive = json.roice_pos[i];
      const negative = json.roice_neg[i];
      roiceElement.appendChild(
        gameCharacter.createDataElement(
          `ロイス${i + 1}`,
          `${roiceName}（${positive}／${negative}）`
        )
      );
    }

    /*
     * 能力値／技能
     */
    const abilityElement = gameCharacter.createDataElement('能力値／技能', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    const skillInfos = [
      { type: 1, name: '白兵' },
      { type: 1, name: '回避' },
      { type: 1, name: '運転_' },
      { type: 2, name: '射撃' },
      { type: 2, name: '知覚' },
      { type: 2, name: '芸術_' },
      { type: 3, name: 'RC' },
      { type: 3, name: '意志' },
      { type: 3, name: '知識_' },
      { type: 4, name: '交渉' },
      { type: 4, name: '調達' },
      { type: 4, name: '情報_' }
    ];
    const skills: {
      type: number;
      name: string;
      total: number;
      extra: number;
    }[] = [];
    for (let i = 0; i < skillInfos.length; i++) {
      const info = skillInfos[i];
      const name = i % 3 === 2 ? info.name + json.skill_memo[i] : info.name;
      const sl = Number.parseInt(json.skill_tokugi[i] || 0, 10);
      const extra = Number.parseInt(json.skill_extra[i] || 0, 10);
      const mod = Number.parseInt(json.skill_sonota[i] || 0, 10);
      skills.push({
        type: info.type,
        name: name,
        total: sl + mod,
        extra: extra
      });
    }
    const skillNames = ['運転_', '芸術_', '知識_', '情報_'];
    for (let i = 0; json.V_skill_id && i < json.V_skill_id.length; i++) {
      const skillId = Number.parseInt(json.V_skill_id[i], 10);
      if (!skillId || skillId <= 0) {
        continue;
      }
      const name = skillNames[skillId - 1] + json.skill_memo[i + 12];
      const sl = Number.parseInt(json.skill_tokugi[i + 12] || 0, 10);
      const extra = Number.parseInt(json.skill_extra[i + 12] || 0, 10);
      const mod = Number.parseInt(json.skill_sonota[i + 12] || 0, 10);
      skills.push({
        type: skillId,
        name: name,
        total: sl + mod,
        extra: extra
      });
    }
    const bodySkills = skills.filter(skill => skill.type === 1);
    const senseSkills = skills.filter(skill => skill.type === 2);
    const mentalSkills = skills.filter(skill => skill.type === 3);
    const socialSkills = skills.filter(skill => skill.type === 4);

    abilityElement.appendChild(
      gameCharacter.createDataElement('【肉体】', json.NP1)
    );
    for (const skill of bodySkills) {
      abilityElement.appendChild(
        gameCharacter.createDataElement(skill.name, skill.total)
      );
    }
    abilityElement.appendChild(
      gameCharacter.createDataElement('【感覚】', json.NP2)
    );
    for (const skill of senseSkills) {
      abilityElement.appendChild(
        gameCharacter.createDataElement(skill.name, skill.total)
      );
    }
    abilityElement.appendChild(
      gameCharacter.createDataElement('【精神】', json.NP3)
    );
    for (const skill of mentalSkills) {
      abilityElement.appendChild(
        gameCharacter.createDataElement(skill.name, skill.total)
      );
    }
    abilityElement.appendChild(
      gameCharacter.createDataElement('【社会】', json.NP4)
    );
    for (const skill of socialSkills) {
      abilityElement.appendChild(
        gameCharacter.createDataElement(skill.name, skill.total)
      );
    }

    /*
     * エフェクト
     */
    const effectElement = gameCharacter.createDataElement('エフェクト', '');
    gameCharacter.detailDataElement.appendChild(effectElement);
    effectElement.appendChild(
      gameCharacter.createDataElement('ワーディング', 'Lv:★｜侵蝕:-')
    );
    const ressurectLv = Number.parseInt(json.ressurect_lv, 10) + 1;
    effectElement.appendChild(
      gameCharacter.createDataElement(
        'リザレクト',
        `Lv:${ressurectLv}｜侵蝕:[SL]d`
      )
    );
    const convertEffectLv = [
      '★',
      1,
      2,
      3,
      4,
      5,
      '★',
      1,
      2,
      3,
      '★',
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ];
    for (let i = 0; i < json.effect_name.length; i++) {
      const effectName = json.effect_name[i];
      if (!effectName) {
        continue;
      }
      let sl = json.S_effect_lv[i];
      if (['★', '○', '◇', '0', '6', '10'].includes(sl)) {
        sl = '★';
      } else {
        sl = convertEffectLv[Number.parseInt(sl, 10)];
      }
      const cost = json.effect_cost[i];
      effectElement.appendChild(
        gameCharacter.createDataElement(effectName, `Lv:${sl}｜侵蝕:${cost}`)
      );
    }
    for (let i = 0; i < json.easyeffect_name.length; i++) {
      const effectName = json.easyeffect_name[i];
      if (!effectName) {
        continue;
      }
      let sl = json.S_easyeffect_lv[i];
      if (sl === '0') {
        sl = '★';
      }
      const cost = json.easyeffect_cost[i] || '';
      effectElement.appendChild(
        gameCharacter.createDataElement(effectName, `Lv:${sl}｜侵蝕:${cost}`)
      );
    }

    /*
     * 武器・コンボ
     */
    const armElement = gameCharacter.createDataElement('武器・コンボ', '');
    gameCharacter.detailDataElement.appendChild(armElement);
    for (let i = 0; i < json.arms_name.length; i++) {
      const armName = json.arms_name[i];
      if (!armName) {
        continue;
      }
      const hit = json.arms_hit[i].replace('r', 'dx10');
      const guardLevel = json.arms_guard_level[i];
      const power = json.arms_power[i];
      const range = json.arms_range[i];
      const memo = json.arms_sonota[i];
      let armText = '';
      if (hit) {
        armText += `判定[${hit}]`;
      }
      if (guardLevel) {
        armText += `ガード[${guardLevel}]`;
      }
      if (power) {
        armText += `攻撃力[${power}]`;
      }
      if (range) {
        armText += `射程[${range}]`;
      }
      if (memo) {
        armText += `その他[${memo}]`;
      }
      armElement.appendChild(gameCharacter.createNoteElement(armName, armText));
    }

    /*
     * 防具
     */
    const armerElement = gameCharacter.createDataElement('防具', '');
    gameCharacter.detailDataElement.appendChild(armerElement);
    const armerName = json.armer_name;
    let armerText = '';
    if (armerName) {
      const deffence = json.armer_def;
      const dodge = json.armer_dodge;
      const move = json.armer_move;
      const memo = json.armer_sonota;
      if (deffence) {
        armerText += `装甲[${deffence}]`;
      }
      if (dodge) {
        armerText += `回避[${dodge}]`;
      }
      if (move) {
        armerText += `行動[${move}]`;
      }
      if (memo) {
        armerText += `その他[${memo}]`;
      }
      armerElement.appendChild(
        gameCharacter.createNoteElement(armerName, armerText)
      );
    }
    const armer2Name = json.armer2_name;
    let armer2Text = '';
    if (armer2Name) {
      const deffence = json.armer2_def;
      const dodge = json.armer2_dodge;
      const move = json.armer2_move;
      const memo = json.armer2_sonota;
      if (deffence) {
        armer2Text += `装甲[${deffence}]`;
      }
      if (dodge) {
        armer2Text += `回避[${dodge}]`;
      }
      if (move) {
        armer2Text += `行動[${move}]`;
      }
      if (memo) {
        armer2Text += `その他[${memo}]`;
      }
      armerElement.appendChild(
        gameCharacter.createNoteElement(armer2Name, armer2Text)
      );
    }

    /*
     * 一般アイテム
     */
    const itemElement = gameCharacter.createDataElement('一般アイテム', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (let i = 0; i < json.item_name.length; i++) {
      const itemName = json.item_name[i];
      if (!itemName) {
        continue;
      }
      const memo = json.item_memo[i];
      itemElement.appendChild(gameCharacter.createNoteElement(itemName, memo));
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'DoubleCross';
    // チャパレ内容
    let cp = '//-----判定';
    cp += '\n({【肉体】}+{D})dx 【肉体】\n';
    for (const skill of bodySkills) {
      cp += `({【肉体】}+${skill.extra}+{D})dx+{${skill.name}} 《${
        skill.name
      }》\n`;
    }
    cp += '\n({【感覚】}+{D})dx 【感覚】\n';
    for (const skill of senseSkills) {
      cp += `({【感覚】}+${skill.extra}+{D})dx+{${skill.name}} 《${
        skill.name
      }》\n`;
    }
    cp += '\n({【精神】}+{D})dx 【精神】\n';
    for (const skill of mentalSkills) {
      cp += `({【精神】}+${skill.extra}+{D})dx+{${skill.name}} 《${
        skill.name
      }》\n`;
    }
    cp += '\n({【社会】}+{D})dx 【社会】\n';
    for (const skill of socialSkills) {
      cp += `({【社会】}+${skill.extra}+{D})dx+{${skill.name}} 《${
        skill.name
      }》\n`;
    }
    cp += `\n\n//-----エフェクト
《ワーディング》 SL[★]ﾀｲﾐﾝｸﾞ[オート]判定[自動]対象[シーン]射程[視界]侵蝕[-]制限[-]効果[非オーヴァードのエキストラ化]
《リザレクト》 SL[1+{Lv}]ﾀｲﾐﾝｸﾞ[気絶時]判定[自動]対象[自身]射程[-]侵蝕[[SL]d]制限[100↓]効果[コスト分のHPで復活]
`;
    for (let i = 0; i < json.effect_name.length; i++) {
      const effectName = json.effect_name[i];
      if (!effectName) {
        continue;
      }
      let sl = json.S_effect_lv[i];
      if (['★', '○', '◇', '0', '6', '10'].includes(sl)) {
        sl = '★';
      } else {
        sl = `${convertEffectLv[Number.parseInt(sl, 10)]}+{Lv}`;
      }
      const timing = json.effect_timing[i];
      const judge = json.effect_hantei[i];
      const target = json.effect_taisho[i];
      const range = json.effect_range[i];
      const cost = json.effect_cost[i];
      const limit = json.effect_page[i];
      const memo = json.effect_memo[i];
      cp += `《${effectName}》 SL[${sl}]`;
      if (timing) {
        cp += `ﾀｲﾐﾝｸﾞ[${timing}]`;
      }
      if (judge) {
        cp += `判定[${judge}]`;
      }
      if (target) {
        cp += `対象[${target}]`;
      }
      if (range) {
        cp += `射程[${range}]`;
      }
      if (cost) {
        cp += `侵蝕[${cost}]`;
      }
      if (limit) {
        cp += `制限[${limit}]`;
      }
      cp += `効果[${memo}]\n`;
    }
    for (let i = 0; i < json.easyeffect_name.length; i++) {
      const effectName = json.easyeffect_name[i];
      if (!effectName) {
        continue;
      }
      let sl = json.S_easyeffect_lv[i];
      if (sl === '0') {
        sl = '★';
      } else {
        sl = `${sl}+{Lv}`;
      }
      const timing = json.easyeffect_timing[i];
      const judge = json.easyeffect_hantei[i];
      const target = json.easyeffect_taisho[i];
      const range = json.easyeffect_range[i];
      const cost = json.easyeffect_cost[i] || '';
      const limit = json.easyeffect_page[i];
      const memo = json.easyeffect_memo[i];
      cp += `《${effectName}》 SL[${sl}]`;
      if (timing) {
        cp += `ﾀｲﾐﾝｸﾞ[${timing}]`;
      }
      if (judge) {
        cp += `判定[${judge}]`;
      }
      if (target) {
        cp += `対象[${target}]`;
      }
      if (range) {
        cp += `射程[${range}]`;
      }
      if (cost) {
        cp += `侵蝕[${cost}]`;
      }
      if (limit) {
        cp += `制限[${limit}]`;
      }
      cp += `効果[${memo}]\n`;
    }
    cp += '\n\n//-----武器・コンボ\n';
    for (let i = 0; i < json.arms_name.length; i++) {
      const armName = json.arms_name[i];
      if (!armName) {
        continue;
      }
      const hit = json.arms_hit[i].replace('r', 'dx10');
      const guardLevel = json.arms_guard_level[i];
      const power = json.arms_power[i];
      const range = json.arms_range[i];
      const memo = json.arms_sonota[i];
      let armText = '';
      if (hit) {
        armText += `判定[${hit}]`;
      }
      if (guardLevel) {
        armText += `ガード[${guardLevel}]`;
      }
      if (power) {
        armText += `攻撃力[${power}]`;
      }
      if (range) {
        armText += `射程[${range}]`;
      }
      if (memo) {
        armText += `その他[${memo}]`;
      }
      cp += `《${armName}》 ${armText}\n`;
      if (hit) {
        cp += `${hit} 《${armName}》 侵蝕:　攻撃力:${power}　効果:${memo}\n\n`;
      }
    }
    cp += '\n//-----防具\n';
    if (armerName) {
      cp += `《${armerName}》 ${armerText}\n`;
    }
    if (armer2Name) {
      cp += `《${armer2Name}》 ${armer2Text}\n`;
    }
    cp += '\n\n//-----一般アイテム\n';
    for (let i = 0; i < json.item_name.length; i++) {
      const itemName = json.item_name[i];
      if (!itemName) {
        continue;
      }
      const memo = json.item_memo[i];
      cp += `《${itemName}》 効果：${memo}\n`;
    }

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }

  /**
   * キャラクターシート倉庫 ダブルクロス3rd
   * https://character-sheets.appspot.com/dx3/
   */
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
    const infoElement = gameCharacter.createDataElement('基本情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(
      gameCharacter.createDataElement('PL', json.base.player || '')
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('コードネーム', json.base.nameKana)
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('ワークス', json.base.works)
    );
    infoElement.appendChild(
      gameCharacter.createDataElement('カヴァー', json.base.cover)
    );
    const syndrome =
      json.base.syndromes.primary.syndrome +
      (json.base.syndromes.secondary.syndrome
        ? `／${json.base.syndromes.secondary.syndrome}`
        : '') +
      (json.base.syndromes.tertiary.syndrome
        ? `／${json.base.syndromes.tertiary.syndrome}`
        : '');
    infoElement.appendChild(
      gameCharacter.createDataElement('シンドローム', syndrome)
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
      gameCharacter.createResourceElement(
        'HP',
        json.subAbility.hp.total,
        json.subAbility.hp.total
      )
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement('行動値', json.subAbility.action.total)
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement('移動', json.subAbility.moveSen.total)
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement(
        '装甲値',
        json.armours
          .filter((armour: any) => armour.armour)
          .map((armour: any) => Number.parseInt(armour.armour, 10))
          .reduce((sum: number, n: number) => sum + n, 0)
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        '財産点',
        json.subAbility.property.total,
        json.subAbility.property.total
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement('ロイス', 7, 7)
    );

    /*
     * 侵蝕率の影響
     */
    const erotionElement = gameCharacter.createDataElement('侵蝕率の影響', '');
    gameCharacter.detailDataElement.appendChild(erotionElement);
    erotionElement.appendChild(
      gameCharacter.createResourceElement(
        '侵蝕率',
        200,
        json.erotion.shock || json.subAbility.erotion.total
      )
    );
    erotionElement.appendChild(gameCharacter.createResourceElement('Lv', 3, 0));
    erotionElement.appendChild(gameCharacter.createResourceElement('D', 8, 0));

    /*
     * ライフパス
     */
    const lifepathElement = gameCharacter.createDataElement('ライフパス', '');
    gameCharacter.detailDataElement.appendChild(lifepathElement);
    lifepathElement.appendChild(
      gameCharacter.createDataElement('出自', json.lifepath.origins.name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('経験', json.lifepath.experience.name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('邂逅', json.lifepath.encounter.name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('覚醒', json.lifepath.arousal.name)
    );
    lifepathElement.appendChild(
      gameCharacter.createDataElement('衝動', json.lifepath.impulse.name)
    );

    /*
     * ロイス
     */
    const loisElement = gameCharacter.createDataElement(
      'ロイス（好意／悪意）',
      ''
    );
    gameCharacter.detailDataElement.appendChild(loisElement);
    let loisNo = 0;
    for (const lois of json.lois) {
      if (!lois.name) {
        continue;
      }
      loisNo++;
      loisElement.appendChild(
        gameCharacter.createDataElement(
          `ロイス${loisNo}`,
          `${lois.name}（${lois.Pfeel || ''}／${lois.Nfeel || ''}）`
        )
      );
    }
    for (; loisNo < 7; loisNo++) {
      loisElement.appendChild(
        gameCharacter.createDataElement(`ロイス${loisNo + 1}`, '')
      );
    }

    /*
     * 能力値／技能
     */
    const abilityElement = gameCharacter.createDataElement('能力値／技能', '');
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      gameCharacter.createDataElement(
        '【肉体】',
        json.baseAbility.body.subtotal
      )
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('白兵', json.skills.hak.A.lv || '0')
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('回避', json.skills.kai.A.lv || '0')
    );
    for (const skills of json.skills.B) {
      if (!skills.name1) {
        continue;
      }
      abilityElement.appendChild(
        gameCharacter.createDataElement(
          `運転_${skills.name1}`,
          skills.lv1 || '0'
        )
      );
    }
    abilityElement.appendChild(
      gameCharacter.createDataElement(
        '【感覚】',
        json.baseAbility.sense.subtotal
      )
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('射撃', json.skills.sha.A.lv || '0')
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('知覚', json.skills.tik.A.lv || '0')
    );
    for (const skills of json.skills.B) {
      if (!skills.name2) {
        continue;
      }
      abilityElement.appendChild(
        gameCharacter.createDataElement(
          `芸術_${skills.name2}`,
          skills.lv2 || '0'
        )
      );
    }
    abilityElement.appendChild(
      gameCharacter.createDataElement(
        '【精神】',
        json.baseAbility.mind.subtotal
      )
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('RC', json.skills.rc.A.lv || '0')
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('意志', json.skills.isi.A.lv || '0')
    );
    for (const skills of json.skills.B) {
      if (!skills.name3) {
        continue;
      }
      abilityElement.appendChild(
        gameCharacter.createDataElement(
          `知識_${skills.name3}`,
          skills.lv3 || '0'
        )
      );
    }
    abilityElement.appendChild(
      gameCharacter.createDataElement(
        '【社会】',
        json.baseAbility.society.subtotal
      )
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('交渉', json.skills.kou.A.lv || '0')
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement('調達', json.skills.tyo.A.lv || '0')
    );
    for (const skills of json.skills.B) {
      if (!skills.name4) {
        continue;
      }
      abilityElement.appendChild(
        gameCharacter.createDataElement(
          `情報_${skills.name4}`,
          skills.lv4 || '0'
        )
      );
    }

    /*
     * エフェクト
     */
    const effectElement = gameCharacter.createDataElement('エフェクト', '');
    gameCharacter.detailDataElement.appendChild(effectElement);
    for (const art of json.arts) {
      if (!art.name) {
        continue;
      }
      let sl = art.level;
      if (sl === '0') {
        sl = '★';
      }
      effectElement.appendChild(
        gameCharacter.createDataElement(
          art.name,
          `Lv:${sl}｜侵蝕:${art.cost || '-'}`
        )
      );
    }

    /*
     * コンボ
     */
    const comboElement = gameCharacter.createDataElement('コンボ', '');
    gameCharacter.detailDataElement.appendChild(comboElement);
    for (const combo of json.combo) {
      if (!combo.name) {
        continue;
      }
      const dice =
        combo.under100.dice +
        (combo.under100.critical ? `@${combo.under100.critical || 10}` : '');
      const cost = combo.under100.cost;
      const attack = combo.under100.attack;
      const range = combo.under100.range;
      const notes = combo.under100.notes;
      let comboText = '';
      if (dice) {
        comboText += `判定[${dice}]`;
      }
      if (cost) {
        comboText += `侵蝕[${cost}]`;
      }
      if (attack) {
        comboText += `攻撃力[${attack}]`;
      }
      if (range) {
        comboText += `射程[${range}]`;
      }
      if (notes) {
        comboText += `効果[${notes}]`;
      }
      comboElement.appendChild(
        gameCharacter.createNoteElement(combo.name, comboText)
      );
    }

    /*
     * 武器
     */
    const weaponElement = gameCharacter.createDataElement('武器', '');
    gameCharacter.detailDataElement.appendChild(weaponElement);
    for (const weapon of json.weapons) {
      if (!weapon.name) {
        continue;
      }
      let weaponText = '';
      if (weapon.guard) {
        weaponText += `ガード[${weapon.guard}]`;
      }
      if (weapon.power) {
        weaponText += `攻撃力[${weapon.power}]`;
      }
      if (weapon.range) {
        weaponText += `射程[${weapon.range}]`;
      }
      if (weapon.notes) {
        weaponText += `その他[${weapon.notes}]`;
      }
      weaponElement.appendChild(
        gameCharacter.createNoteElement(weapon.name, weaponText)
      );
    }

    /*
     * 防具
     */
    const armourElement = gameCharacter.createDataElement('防具', '');
    gameCharacter.detailDataElement.appendChild(armourElement);
    for (const armour of json.armours) {
      if (!armour.name) {
        continue;
      }
      let armourText = '';
      if (armour.armour) {
        armourText += `装甲[${armour.armour}]`;
      }
      if (armour.dodge) {
        armourText += `回避[${armour.dodge}]`;
      }
      if (armour.action) {
        armourText += `行動[${armour.action}]`;
      }
      if (armour.notes) {
        armourText += `その他[${armour.notes}]`;
      }
      armourElement.appendChild(
        gameCharacter.createNoteElement(armour.name, armourText)
      );
    }

    /*
     * 一般アイテム
     */
    const itemElement = gameCharacter.createDataElement('一般アイテム', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (const item of json.items) {
      if (!item.name) {
        continue;
      }
      itemElement.appendChild(
        gameCharacter.createNoteElement(item.name, item.notes || '')
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'DoubleCross';
    // チャパレ内容
    let cp = '//-----判定';
    cp += `\n({【肉体】}+{D})dx 【肉体】
({【肉体】}+{D})dx+{白兵} 《白兵》
({【肉体】}+{D})dx+{回避} 《回避》
`;
    for (const skills of json.skills.B) {
      if (!skills.name1) {
        continue;
      }
      cp += `({【肉体】}+{D})dx+{運転_${skills.name1}} 《運転_${
        skills.name1
      }》\n`;
    }
    cp += `\n({【感覚】}+{D})dx 【感覚】
({【感覚】}+{D})dx+{射撃} 《射撃》
({【感覚】}+{D})dx+{知覚} 《知覚》
`;
    for (const skills of json.skills.B) {
      if (!skills.name2) {
        continue;
      }
      cp += `({【感覚】}+{D})dx+{芸術_${skills.name2}} 《芸術_${
        skills.name2
      }》\n`;
    }
    cp += `\n({【精神】}+{D})dx 【精神】
({【精神】}+{D})dx+{RC} 《RC》
({【精神】}+{D})dx+{意志} 《意志》
`;
    for (const skills of json.skills.B) {
      if (!skills.name3) {
        continue;
      }
      cp += `({【精神】}+{D})dx+{知識_${skills.name3}} 《知識_${
        skills.name3
      }》\n`;
    }
    cp += `\n({【社会】}+{D})dx 【社会】
({【社会】}+{D})dx+{交渉} 《交渉》
({【社会】}+{D})dx+{調達} 《調達》
`;
    for (const skills of json.skills.B) {
      if (!skills.name4) {
        continue;
      }
      cp += `({【社会】}+{D})dx+{情報_${skills.name4}} 《情報_${
        skills.name4
      }》\n`;
    }
    cp += '\n\n//-----エフェクト\n';
    for (const art of json.arts) {
      if (!art.name) {
        continue;
      }
      let sl = art.level;
      if (sl === '0') {
        sl = '★';
      } else {
        sl = `${sl}+{Lv}`;
      }
      cp += `《${art.name}》 SL[${sl}]`;
      if (art.timing) {
        cp += `ﾀｲﾐﾝｸﾞ[${art.timing}]`;
      }
      if (art.judge) {
        cp += `判定[${art.judge}]`;
      }
      if (art.target) {
        cp += `対象[${art.target}]`;
      }
      if (art.range) {
        cp += `射程[${art.range}]`;
      }
      if (art.cost) {
        cp += `侵蝕[${art.cost}]`;
      }
      if (art.limit) {
        cp += `制限[${art.limit}]`;
      }
      if (art.notes) {
        cp += `効果[${art.notes}]`;
      }
      cp += '\n';
    }
    cp += '\n\n//-----コンボ\n';
    for (const combo of json.combo) {
      if (!combo.name) {
        continue;
      }
      const dice =
        combo.under100.dice +
        (combo.under100.critical ? `@${combo.under100.critical || 10}` : '');
      const cost = combo.under100.cost || '';
      const attack = combo.under100.attack || '';
      const range = combo.under100.range || '';
      const notes = combo.under100.notes || '';
      let comboText = '';
      if (dice) {
        comboText += `判定[${dice}]`;
      }
      if (cost) {
        comboText += `侵蝕[${cost}]`;
      }
      if (range) {
        comboText += `射程[${range}]`;
      }
      if (notes) {
        comboText += `効果[${notes}]`;
      }
      cp += `《${combo.name}》 ${comboText}`;
      if (dice) {
        cp += `${dice} 《${
          combo.name
        }》 侵蝕:${cost}　攻撃力:${attack}　効果:${notes}\n\n`;
      }
    }
    cp += '\n//-----武器\n';
    for (const weapon of json.weapons) {
      if (!weapon.name) {
        continue;
      }
      let weaponText = '';
      if (weapon.guard) {
        weaponText += `ガード[${weapon.guard}]`;
      }
      if (weapon.power) {
        weaponText += `攻撃力[${weapon.power}]`;
      }
      if (weapon.range) {
        weaponText += `射程[${weapon.range}]`;
      }
      if (weapon.notes) {
        weaponText += `その他[${weapon.notes}]`;
      }
      cp += `《${weapon.name}》 ${weaponText}\n`;
    }
    cp += '\n\n//-----防具\n';
    for (const armour of json.armours) {
      if (!armour.name) {
        continue;
      }
      let armourText = '';
      if (armour.armour) {
        armourText += `装甲[${armour.armour}]`;
      }
      if (armour.dodge) {
        armourText += `回避[${armour.dodge}]`;
      }
      if (armour.action) {
        armourText += `行動[${armour.action}]`;
      }
      if (armour.notes) {
        armourText += `その他[${armour.notes}]`;
      }
      cp += `《${armour.name}》 ${armourText}\n`;
    }
    cp += '\n\n//-----一般アイテム\n';
    for (const item of json.items) {
      if (!item.name) {
        continue;
      }
      cp += `《${item.name}》 効果：${item.notes || ''}\n`;
    }

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
