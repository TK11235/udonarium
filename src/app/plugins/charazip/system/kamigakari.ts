import { ChatPalette } from '@udonarium/chat-palette';

import { CustomCharacter, Utils } from '../custom-character';
import { VampireBloodFactory } from '../system-factory';

/**
 * キャラクター保管所 神我狩
 */
export class Kamigakari implements VampireBloodFactory {
  gameSystem = 'kmgkr';
  name = '神我狩';
  href = 'https://charasheet.vampire-blood.net/list_kmgkr.html';
  create = Kamigakari.create;

  static vampireBloodFactory(): VampireBloodFactory {
    return new Kamigakari();
  }

  private static create(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.pc_name,
      1,
      ''
    );

    /*
     * リソース
     */
    const resourceElement = Utils.createDataElement('リソース', '');
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      Utils.createResourceElement('生命力', json.NP9, json.NP9)
    );
    resourceElement.appendChild(Utils.createResourceElement('霊紋', 22, 22));
    resourceElement.appendChild(
      Utils.createResourceElement('行動値', json.act, json.act)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('装甲', json.def, json.def)
    );
    resourceElement.appendChild(
      Utils.createResourceElement('結界', json.mdef, json.mdef)
    );
    resourceElement.appendChild(Utils.createResourceElement('超過霊力', 2, 0));
    resourceElement.appendChild(Utils.createNoteElement('状態変化', ''));

    /*
     * 情報
     */
    const infoElement = Utils.createDataElement('情報', '');
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(Utils.createDataElement('PL', ''));
    infoElement.appendChild(
      Utils.createDataElement('種族', json.manual_shuzoku)
    );
    infoElement.appendChild(
      Utils.createDataElement('メイン称号', json.main_class)
    );
    infoElement.appendChild(
      Utils.createDataElement('サブ称号', json.support_class)
    );
    infoElement.appendChild(
      Utils.createDataElement('表の職業', json.omote_face)
    );
    infoElement.appendChild(Utils.createDataElement('組織', json.shuzoku));
    // infoElement.appendChild(Utils.createDataElement('経緯', json.shutuji_name));
    // infoElement.appendChild(
    //   Utils.createDataElement('霊紋の位置', json.kyougu_name)
    // );
    // infoElement.appendChild(
    //   Utils.createDataElement('霊紋の形状', json.shape_name)
    // );
    // infoElement.appendChild(Utils.createDataElement('目的', json.unmei_name));
    infoElement.appendChild(
      Utils.createNoteElement('設定', json.pc_making_memo)
    );
    infoElement.appendChild(Utils.createNoteElement('URL', url));

    /*
     * 主能力値
     */
    const abliityElement = Utils.createDataElement('主能力値(判定値)', '');
    gameCharacter.detailDataElement.appendChild(abliityElement);
    abliityElement.appendChild(Utils.createDataElement('体力', json.NB1));
    abliityElement.appendChild(Utils.createDataElement('敏捷', json.NB2));
    abliityElement.appendChild(Utils.createDataElement('知性', json.NB3));
    abliityElement.appendChild(Utils.createDataElement('精神', json.NB4));
    abliityElement.appendChild(Utils.createDataElement('幸運', json.NB5));

    /**
     * 武器
     */
    const arms: Arm[] = [];
    const armCategoryMap = {
      '0': '',
      '1': '肉弾/剣',
      '2': '肉弾/槍',
      '3': '肉弾/斧',
      '4': '肉弾/槌',
      '5': '射撃',
      '6': '射撃/※',
      '7': '魔法',
      '8': '盾',
    };
    for (let i = 0; i < json.arms_name.length; i++) {
      const name: string = json.arms_name[i];
      if (!name) {
        continue;
      }
      const isEquip: boolean = json.arms_is_equip[i] === '1';
      const categoryId: string = json.arms_cate[i];
      const category: string = armCategoryMap[categoryId];
      const range: string = json.arms_range[i];
      const target: string = json.arms_target[i];
      const resist: string = json.arms_resist[i];
      const hitMod: number = Number.parseInt(json.arms_hit_mod[i] || 0, 10);
      const damageMod: number = Number.parseInt(
        json.arms_damage_mod[i] || 0,
        10
      );
      const memo: string = json.arms_memo[i];
      const text = [
        [category, range, target, target, resist].filter(Boolean).join('／'),
        memo,
      ]
        .filter(Boolean)
        .join('\n');
      arms.push({
        name,
        isEquip,
        category,
        hitMod,
        damageMod,
        text,
      });
    }
    const meleeArms = arms.filter((arm) => arm.category.startsWith('肉弾'));
    const rangeArms = arms.filter((arm) => arm.category.startsWith('射撃'));
    const magicArms = arms.filter((arm) => arm.category === '魔法');

    /*
     * 戦闘値
     */
    const battleElement = Utils.createDataElement('戦闘値(総計)', '');
    gameCharacter.detailDataElement.appendChild(battleElement);
    const hit = Number.parseInt(json.NP1, 10);
    battleElement.appendChild(Utils.createDataElement('命中', hit));
    if (meleeArms.length > 0) {
      const hitMod = meleeArms
        .filter((arm) => arm.isEquip)
        .map((arm) => arm.hitMod)
        .reduce(sum, 0);
      battleElement.appendChild(
        Utils.createDataElement('命中[肉弾武器]', hit + hitMod)
      );
    }
    if (rangeArms.length > 0) {
      const hitMod = rangeArms
        .filter((arm) => arm.isEquip)
        .map((arm) => arm.hitMod)
        .reduce(sum, 0);
      battleElement.appendChild(
        Utils.createDataElement('命中[射撃武器]', hit + hitMod)
      );
    }
    battleElement.appendChild(Utils.createDataElement('回避', json.kaihi));
    const cast = Number.parseInt(json.NP3, 10);
    const castMod = magicArms
      .filter((arm) => arm.isEquip)
      .map((arm) => arm.hitMod)
      .reduce(sum, 0);
    battleElement.appendChild(Utils.createDataElement('発動', cast + castMod));
    battleElement.appendChild(Utils.createDataElement('抵抗', json.NP4));
    battleElement.appendChild(Utils.createDataElement('看破', json.NP5));
    const physicalDamage = Number.parseInt(json.NP6, 10);
    battleElement.appendChild(Utils.createDataElement('物D', physicalDamage));
    if (meleeArms.length > 0) {
      const damageMod = meleeArms
        .filter((arm) => arm.isEquip)
        .map((arm) => arm.damageMod)
        .reduce(sum, 0);
      battleElement.appendChild(
        Utils.createDataElement('物D[肉弾武器]', physicalDamage + damageMod)
      );
    }
    if (rangeArms.some((arm) => arm.category === '射撃')) {
      const damageMod = rangeArms
        .filter((arm) => arm.category === '射撃' && arm.isEquip)
        .map((arm) => arm.damageMod)
        .reduce(sum, 0);
      battleElement.appendChild(
        Utils.createDataElement('物D[射撃武器]', physicalDamage + damageMod)
      );
    }
    if (rangeArms.some((arm) => arm.category === '射撃※')) {
      const damageMod = rangeArms
        .filter((arm) => arm.category === '射撃※' && arm.isEquip)
        .map((arm) => arm.damageMod)
        .reduce(sum, 0);
      battleElement.appendChild(
        Utils.createDataElement('物D[射撃武器※]', damageMod)
      );
    }
    const magicalDamage = Number.parseInt(json.NP7, 10);
    const damageMod = magicArms
      .filter((arm) => arm.isEquip)
      .map((arm) => arm.damageMod)
      .reduce(sum, 0);
    battleElement.appendChild(
      Utils.createDataElement('魔D', magicalDamage + damageMod)
    );
    battleElement.appendChild(Utils.createDataElement('戦闘移動', json.ido));
    battleElement.appendChild(
      Utils.createDataElement('全力移動', json.zenryoku_ido)
    );

    /*
     * タレント
     */
    const skillElement = Utils.createDataElement('タレント', '');
    gameCharacter.detailDataElement.appendChild(skillElement);
    for (let i = 0; i <= json.skill_name.length; i++) {
      let name = json.skill_name[i];
      if (!name) {
        continue;
      }
      name = name.replace(/^《|》$/g, '');
      const timing = json.skill_timing[i];
      const range = json.skill_range[i];
      const taisho = json.skill_taisho[i];
      const cost = json.skill_cost[i];
      const limit = json.skill_limit[i];
      const memo = json.skill_memo[i];
      const text = [
        [timing, range, taisho, cost, limit].filter(Boolean).join('／'),
        memo,
      ]
        .filter(Boolean)
        .join('\n');
      skillElement.appendChild(Utils.createNoteElement(`《${name}》`, text));
    }

    /*
     * 武器・防具
     */
    const equipmentElement = Utils.createDataElement('武器・防具', '');
    gameCharacter.detailDataElement.appendChild(equipmentElement);
    arms.forEach((arm) => {
      equipmentElement.appendChild(Utils.createNoteElement(arm.name, arm.text));
    });

    /*
     * 所持品
     */
    const itemElement = Utils.createDataElement('所持品', '');
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (let i = 0; i < json.item_name.length; i++) {
      const name = json.item_name[i];
      if (!name) {
        continue;
      }
      const num = json.item_num[i];
      const memo = json.item_memo[i];
      itemElement.appendChild(
        Utils.createNoteElement(
          name,
          [num === '' ? null : `個数: ${num}`, memo].filter(Boolean).join('\n')
        )
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), 'application/xml');

    const palette: ChatPalette = new ChatPalette(
      'ChatPalette_' + gameCharacter.identifier
    );
    palette.dicebot = 'Kamigakari';
    // チャパレ内容
    let cp = `1d6
2d6
3d6
4d6

生命力: {生命力}
霊紋: {霊紋}

//---主能力値（判定値）
2d6+{体力} 【体力】判定
2d6+{敏捷} 【敏捷】判定
2d6+{知性} 【知性】判定
2d6+{精神} 【精神】判定
2d6+{幸運} 【幸運】判定

//---戦闘値(総計)
2d6+{命中} 【命中】判定
`;

    if (meleeArms.length > 0) {
      cp += '2d6+{命中[肉弾武器]} 【命中】判定(肉弾武器)\n';
    }
    if (rangeArms.length > 0) {
      cp += '2d6+{命中[射撃武器]} 【命中】判定(射撃武器)\n';
    }
    cp += `2d6+{回避} 【回避】判定
2d6+{発動} 【発動】判定
2d6+{抵抗} 【抵抗】判定
2d6+{看破} 【看破】判定
C({物D}) [物理ダメージ]
`;
    if (meleeArms.length > 0) {
      cp += 'C({物D[肉弾武器]}) [物理ダメージ](肉弾武器)\n';
    }
    if (rangeArms.some((arm) => arm.category === '射撃')) {
      cp += 'C({物D[射撃武器]}) [物理ダメージ](射撃武器)\n';
    }
    if (rangeArms.some((arm) => arm.category === '射撃※')) {
      cp += 'C({物D[射撃武器※]}) [物理ダメージ](射撃武器※)\n';
    }
    cp += `C({魔D}) [魔法ダメージ]

//---タレント
`;
    json.skill_name
      .filter(Boolean)
      .map((name) => name.replace(/^《|》$/g, ''))
      .forEach((name) => {
        cp += `《${name}》{《${name}》}\n`;
      });

    cp += '\n//---武器・防具\n';
    arms.forEach((arm) => {
      cp += `「${arm.name}」{${arm.name}}\n`;
      if (arm.category.startsWith('肉弾')) {
        cp += '2d6+{命中[肉弾武器]} 【命中】判定(肉弾武器)\n';
        cp += 'C({物D[肉弾武器]}) [物理ダメージ](肉弾武器)\n';
      } else if (arm.category === '射撃') {
        cp += '2d6+{命中[射撃武器]} 【命中】判定(射撃武器)\n';
        cp += 'C({物D[射撃武器]}) [物理ダメージ](射撃武器)\n';
      } else if (arm.category === '射撃※') {
        cp += '2d6+{命中[射撃武器]} 【命中】判定(射撃武器)\n';
        cp += 'C({物D[射撃武器※]}) [物理ダメージ](射撃武器※)\n';
      } else if (arm.category === '魔法') {
        cp += '2d6+{発動} 【発動】判定\n';
        cp += 'C({魔D}) [魔法ダメージ]\n';
      }
      cp += '\n';
    });

    cp += `
ET 感情表
KT 魔境臨界表
MT 獲得素材チャート`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}

type Arm = {
  name: string;
  isEquip: boolean;
  category: string;
  hitMod: number;
  damageMod: number;
  text: string;
};

const sum = (l: number, r: number) => l + r;
