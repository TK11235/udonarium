import { ChatPalette } from "@udonarium/chat-palette";

import { CustomCharacter } from "../custom-character";

export class SwordWorld2 {
  /**
   * キャラクター保管所 ソードワールド2.0
   * https://charasheet.vampire-blood.net/list_swordworld2.html
   */
  static generateByVampireVlood(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.pc_name,
      1,
      ""
    );

    /*
     * リソース
     */
    const resourceElement = gameCharacter.createDataElement("リソース", "");
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      gameCharacter.createResourceElement("HP", json.HP, json.HP)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement("MP", json.MP, json.MP)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement("防護点", json.bougo, json.bougo)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement("1ゾロ", 10, 0)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement("穢れ度", 5, json.kegare || 0)
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement("所持金", json.money)
    );
    resourceElement.appendChild(
      gameCharacter.createDataElement(
        "名誉点",
        `${json.total_honor_point}(${json.now_honor_point})`
      )
    );
    /*
     * 情報
     */
    const infoElement = gameCharacter.createDataElement("情報", "");
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(gameCharacter.createDataElement("PL", ""));
    infoElement.appendChild(
      gameCharacter.createDataElement("種族", json.shuzoku_name)
    );
    infoElement.appendChild(
      gameCharacter.createDataElement("種族特徴", json.shuzoku_tokucho)
    );
    infoElement.appendChild(
      gameCharacter.createNoteElement("説明", json.pc_making_memo)
    );
    infoElement.appendChild(gameCharacter.createNoteElement("URL", url));
    /*
     * 能力値
     */
    const abliityElement = gameCharacter.createDataElement("能力値", "");
    gameCharacter.detailDataElement.appendChild(abliityElement);
    abliityElement.appendChild(
      gameCharacter.createDataElement("器用度", json.NP1)
    );
    abliityElement.appendChild(
      gameCharacter.createDataElement("敏捷度", json.NP2)
    );
    abliityElement.appendChild(
      gameCharacter.createDataElement("筋力", json.NP3)
    );
    abliityElement.appendChild(
      gameCharacter.createDataElement("生命力", json.NP4)
    );
    abliityElement.appendChild(
      gameCharacter.createDataElement("知力", json.NP5)
    );
    abliityElement.appendChild(
      gameCharacter.createDataElement("精神力", json.NP6)
    );
    /*
     * 技能
     */
    const skillElement = gameCharacter.createDataElement("技能", "");
    gameCharacter.detailDataElement.appendChild(skillElement);
    skillElement.appendChild(
      gameCharacter.createDataElement("冒険者レベル", json.lv)
    );
    const skillList = [
      "ファイター",
      "グラップラー",
      "フェンサー",
      "シューター",
      "ソーサラー",
      "コンジャラー",
      `プリースト/${json.priest_sinkou}`,
      "フェアリーテイマー",
      "マギテック",
      "スカウト",
      "レンジャー",
      "セージ",
      "エンハンサー",
      "バード",
      "アルケミスト",
      "ライダー",
      "デーモンルーラー",
      "ウォーリーダー",
      "ミスティック",
      "フィジカルマスター",
      "グリモワール",
      "アーティザン",
      "アリストクラシー"
    ];
    const skillLevelList: number[] = [];
    for (let i = 0; i < skillList.length; i++) {
      const skillLevel = json[`V_GLv${i + 1}`];
      if (!skillLevel || skillLevel === "0") {
        skillLevelList.push(0);
        continue;
      }
      skillLevelList.push(Number.parseInt(skillLevel, 10));
      skillElement.appendChild(
        gameCharacter.createDataElement(skillList[i], skillLevel)
      );
    }
    /*
     * バフ・デバフ
     */
    const modifyElement = gameCharacter.createDataElement("バフ・デバフ", "");
    gameCharacter.detailDataElement.appendChild(modifyElement);
    modifyElement.appendChild(
      gameCharacter.createResourceElement("命中", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("回避", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("攻撃", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("クリレイ", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("出目固定", 12, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("魔法行使", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("魔法威力", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("生命抵抗", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("精神抵抗", 5, 0)
    );
    modifyElement.appendChild(
      gameCharacter.createResourceElement("ダメージ軽減", 5, 0)
    );
    /*
     * 所持品
     */
    const itemElement = gameCharacter.createDataElement("所持品", "");
    gameCharacter.detailDataElement.appendChild(itemElement);
    for (let i = 0; i < json.item_name.length; i++) {
      const itemName = json.item_name[i];
      if (!itemName) {
        continue;
      }
      const itemNum = json.item_num[i];
      itemElement.appendChild(
        gameCharacter.createResourceElement(itemName, itemNum, itemNum)
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), "application/xml");

    const palette: ChatPalette = new ChatPalette(
      "ChatPalette_" + gameCharacter.identifier
    );
    palette.dicebot = "SwordWorld2_5";
    // チャパレ内容
    let cpSearch = `1d
1d>=4
2d 【平目】

//-----冒険者判定
2d+{冒険者レベル}+({知力}/6) 【真偽判定】
2d+{冒険者レベル}+({敏捷度}/6) 【跳躍判定】【水泳判定】
2d+{冒険者レベル}+({筋力}/6) 【登攀判定】【腕力判定】

`;

    let cpBattle = `//-----抵抗力
2d+{冒険者レベル}+({生命力}/6)+{生命抵抗} 【生命抵抗力判定】
2d+{冒険者レベル}+({精神力}/6)+{精神抵抗} 【精神抵抗力判定】

//-----ダメージ計算
C({HP}-()+{防護点}+{ダメージ軽減}) 　【残HP（物理ダメージ）】
C({HP}-()+{ダメージ軽減})　【残HP（魔法ダメージ）】
C({MP}-())　【MP消費】

//-----戦闘準備
`;
    if (json.V_GLv10 && json.V_GLv10 !== "0") {
      cpSearch += `//-----スカウト
2d+{スカウト}+({器用度}/6) 【スカウト技巧判定】スリ/変装/隠蔽/解除/罠設置
2d+{スカウト}+({敏捷度}/6) 【スカウト運動判定】先制/受け身/隠密/軽業/登攀/尾行
2d+{スカウト}+({知力}/6) 【スカウト観察判定】宝物鑑定/足跡追跡/異常感知/聞き耳/危険感知/探索/天候予測/罠回避/地図作製

`;
      cpBattle += "2d+{スカウト}+({敏捷度}/6) 【先制判定】\n";
    }
    if (json.V_GLv18 && json.V_GLv18 !== "0") {
      if (json.Sensei_INT_Bonus === "1") {
        cpBattle += "2d+{ウォーリーダー}+({知力}/6) 【先制判定】\n";
      } else {
        cpBattle += "2d+{ウォーリーダー}+({敏捷度}/6) 【先制判定】\n";
      }
    }
    if (json.V_GLv11 && json.V_GLv11 !== "0") {
      cpSearch += `//-----レンジャー
2d+{レンジャー}+({器用度}/6) 【レンジャー技巧判定】応急手当/隠蔽/解除*/罠設置* (*は自然環境のみ)
2d+{レンジャー}+({敏捷度}/6) 【レンジャー運動判定】受け身/隠密/軽業/登攀/尾行
2d+{レンジャー}+({知力}/6) 【レンジャー観察判定】病気知識/薬品学/足跡追跡/異常感知*/聞き耳/危険感知/探索*/天候予測/罠回避*/地図作製* (*は自然環境のみ)
k10+{レンジャー}+({器用度}/6)@13 【救命草】
k0+{レンジャー}+({器用度}/6)@13 【魔香草】
k20+{レンジャー}+({知力}/6)@13 【ヒーリングポーション】
k30+{レンジャー}+({知力}/6)@13 【トリートポーション】
C({レンジャー}+({知力}/6)) 【魔香水】

`;
    }
    if (json.V_GLv12 && json.V_GLv12 !== "0") {
      cpSearch += `//-----セージ
2d+{セージ}+({知力}/6) 【セージ知識判定】見識/文献/魔物知識/文明鑑定/宝物鑑定/病気知識/薬品学/地図作製

`;
      cpBattle += "2d+{セージ}+({知力}/6) 【魔物知識判定】\n";
    }
    if (json.V_GLv14 && json.V_GLv14 !== "0") {
      cpSearch += `//-----バード
2d+{バード}+({知力}/6) 【見識判定】
`;
      if (json.is_juka_senyou === "1") {
        cpSearch += `2d+{バード}+(({精神力}+2)/6) 【演奏判定】\n\n`;
      } else {
        cpSearch += `2d+{バード}+({精神力}/6) 【演奏判定】\n\n`;
      }
    }
    if (json.V_GLv16 && json.V_GLv16 !== "0") {
      cpSearch += `//-----ライダー
2d+{ライダー}+({器用度}/6) 【応急手当判定】
2d+{ライダー}+({敏捷度}/6) 【ライダー運動判定】受け身/騎乗
2d+{ライダー}+({知力}/6) 【ライダー知識判定】弱点隠蔽/魔物知識*/地図作製 (*弱点不可)
2d+{ライダー}+({知力}/6) 【ライダー観察判定*】足跡追跡/異常感知/危険感知/探索/罠回避 (*要【探索指令】)

`;
      cpBattle += "2d+{ライダー}+({知力}/6) 【魔物知識判定*】 (*弱点不可)\n";
    }
    if (json.V_GLv15 && json.V_GLv15 !== "0") {
      cpSearch += `//-----アルケミスト
2d+{アルケミスト}+({知力}/6) 【アルケミスト知識判定】見識/文献/薬品学
2d+{アルケミスト}+({知力}/6) 【賦術判定】

`;
    }
    if (json.V_GLv19 && json.V_GLv19 !== "0") {
      cpSearch += `//-----ミスティック
2d+{ミスティック}+({知力}/6) 【ミスティック観察判定】探索/天候予測
2d+{ミスティック}+({器用度}/6) 【占瞳判定】器用度
2d+{ミスティック}+({知力}/6) 【占瞳判定】知力
2d+{ミスティック}+({精神力}/6) 【占瞳判定】精神力

`;
    }
    if (json.V_GLv22 && json.V_GLv22 !== "0") {
      cpSearch += `//-----アーティザン
2d+{アーティザン}+({知力}/6) 【宝物鑑定判定】

`;
    }
    if (json.V_GLv23 && json.V_GLv23 !== "0") {
      cpSearch += `//-----アリストクラシー
2d+{アリストクラシー}+({精神力}/6) 【印象判定】
2d+{アリストクラシー}+({知力}/6) 【アリストクラシー観察判定*】危険感知/罠回避 (*要【囁く気配Ⅰ】)
2d+{アリストクラシー}+({知力}/6) 【アリストクラシー知識判定*】見識/文献 (*要【秘めたる博識Ⅰ】)

`;
    }

    cpBattle += "\n//-----回避\n";
    if (json.V_kaihi_ginou && json.V_kaihi_ginou !== "0") {
      const kaihiGinouIdx = json.V_kaihi_ginou;
      const kaihiGinouLv = Number.parseInt(
        json[`V_GLv${kaihiGinouIdx}`] || 0,
        10
      );
      const dex = Math.floor(Number.parseInt(json.NP2 || 0, 10) / 6);
      const kaihi = Number.parseInt(json.kaihi || 0, 10);
      const kaihiMod = SwordWorld2.formatSign(kaihi - dex - kaihiGinouLv);
      if (json.is_senyou_shield === "1") {
        cpBattle += `2d+{${json.kaihi_ginou_name}}+(({敏捷度}+2)/6)${kaihiMod}+{回避} 【回避力判定】\n`;
      } else {
        cpBattle += `2d+{${json.kaihi_ginou_name}}+({敏捷度}/6)${kaihiMod}+{回避} 【回避力判定】\n`;
      }
    } else {
      const kaihi = SwordWorld2.formatSign(json.kaihi);
      cpBattle += `2d${kaihi}+{回避} 【回避力判定】\n`;
    }

    for (let i = 0; i < json.arms_name.length; i++) {
      const armsName = json.arms_name[i];
      if (!armsName) {
        continue;
      }
      const vHitGinou = Number.parseInt(json.V_arms_hit_ginou[i] || 0, 10);
      if (vHitGinou <= 0) {
        continue;
      }
      const hitGinouName = skillList[vHitGinou - 1];
      const skillLevel = skillLevelList[vHitGinou - 1];
      const isSenyou = json.arms_is_senyou[i];
      const hitMod = SwordWorld2.formatSign(json.arms_hit_mod[i]);
      const iryoku = json.arms_iryoku[i];
      const critical = json.arms_critical[i];
      const muscle = Number.parseInt(json.NP3, 10);
      const damage = Number.parseInt(json.arms_damage[i], 10);
      const damageMod = SwordWorld2.formatSign(
        damage - skillLevel - Math.floor(muscle / 6)
      );
      cpBattle += `//-----${armsName}\n`;
      if (isSenyou === "1") {
        cpBattle += `2d+{${hitGinouName}}+(({器用度}+2)/6)${hitMod}+{命中} 【命中力判定】${armsName}\n`;
      } else {
        cpBattle += `2d+{${hitGinouName}}+({器用度}/6)${hitMod}+{命中} 【命中力判定】${armsName}\n`;
      }
      cpBattle += `k${iryoku}+{${hitGinouName}}+({筋力}/6)${damageMod}+{攻撃}@${critical} 【威力】${armsName}
k${iryoku}+{${hitGinouName}}+({筋力}/6)${damageMod}+{攻撃}@${critical}$+{クリレイ} 【威力】${armsName}/クリレイ
k${iryoku}+{${hitGinouName}}+({筋力}/6)${damageMod}+{攻撃}@${critical}\${出目固定} 【威力】${armsName}/出目固定
`;
    }
    cpBattle += "\n";

    const magicList = [
      {
        id: 5,
        alias: "真語魔法",
        attack: [0, 10, 20, 30, 40, 50, 60, 70, 100],
        heel: []
      },
      { id: 6, alias: "操霊魔法", attack: [0, 10, 20, 30, 60], heel: [0, 30] },
      {
        id: 7,
        alias: "神聖魔法",
        attack: [10, 20, 30, 40, 50, 70, 90],
        heel: [10, 30, 50, 70]
      },
      {
        id: 8,
        alias: "妖精魔法",
        attack: [10, 20, 30, 40, 50, 60, 70],
        heel: []
      },
      {
        id: 9,
        alias: "魔導機術",
        attack: [10, 20, 30, 40, 70, 90],
        heel: [0, 30, 50]
      },
      { id: 17, alias: "召異魔法", attack: [10, 20, 30, 40, 50], heel: [] },
      {
        id: 21,
        alias: "秘奥魔法",
        attack: [10, 20, 30, 40, 50, 60, 80, 100],
        heel: [20, 100]
      }
    ];
    for (const magic of magicList) {
      const mlv = json[`MLv${magic.id}`];
      if (!mlv) {
        continue;
      }
      const lv = Number.parseInt(mlv, 10);
      const maryoku = json[`maryoku${magic.id}`];
      const int = Math.floor(Number.parseInt(json.NP5 || 0, 10) / 6);
      const mod = SwordWorld2.formatSign(maryoku - int - lv);
      const skillName = skillList[magic.id - 1];
      cpBattle += `//-----${skillName}
2d+{${skillName}}+({知力}/6)${mod}+{魔法行使} 【${magic.alias}行使判定】\n`;
      cpBattle += magic.attack
        .map(
          iryoku =>
            `k${iryoku}+{${skillName}}+({知力}/6)${mod}+{魔法威力} 【${magic.alias}威力${iryoku}】\n`
        )
        .reduce((txt, elm) => txt + elm, "");
      if (magic.id === 7) {
        cpBattle += `k20+{${skillName}}+({知力}/6)${mod}+{魔法威力}@9 【ゴッド・フィスト(小神)】
k30+{${skillName}}+({知力}/6)${mod}+{魔法威力} 【ゴッド・フィスト(大神)】
k40+{${skillName}}+({知力}/6)${mod}+{魔法威力}@11 【ゴッド・フィスト(古代神)】
`;
      }
      cpBattle += magic.heel
        .map(
          iryoku =>
            `k${iryoku}+{${skillName}}+({知力}/6)${mod}+{魔法威力}@13 【${magic.alias}回復${iryoku}】\n`
        )
        .reduce((txt, elm) => txt + elm, "");
      if (magic.id === 21) {
        cpBattle += "k50@13 【モメント＝レストラーレ】\n";
      }
      cpBattle += "\n";
    }
    if (json.MLv5 && json.MLv6) {
      const lv5 = Number.parseInt(json.MLv5, 10);
      const lv6 = Number.parseInt(json.MLv6, 10);
      const skillName = lv5 < lv6 ? "コンジャラー" : "ソーサラー";
      cpBattle += `//-----ウィザード
2d+{${skillName}}+({知力}/6)+{魔法行使} 【深智魔法行使判定】
k0+{${skillName}}+({知力}/6)+{魔法威力} 【深智魔法威力0】
k10+{${skillName}}+({知力}/6)+{魔法威力} 【深智魔法威力10】
k20+{${skillName}}+({知力}/6)+{魔法威力} 【深智魔法威力20】
k70+{${skillName}}+({知力}/6)+{魔法威力} 【深智魔法威力70】

`;
    }

    cpBattle += "//-----戦闘特技\n";
    for (let i = 0; i < json.ST_name.length; i++) {
      const name = json.ST_name[i];
      if (!name) {
        continue;
      }
      const kouka = json.ST_kouka[i];
      cpBattle += `《${name}》${kouka}\n`;
    }
    cpBattle += "\n";

    if (json.V_GLv13 && json.V_GLv13 !== "0") {
      cpBattle += "//-----練技\n";
      for (let i = 0; i < json.ES_name.length; i++) {
        const name = json.ES_name[i];
        if (!name) {
          continue;
        }
        const time = json.ES_koukatime[i];
        const kouka = json.ES_kouka[i];
        cpBattle += `【${name}】(${time})${kouka}\n`;
      }
      cpBattle += `2d+{エンハンサー}+({知力}/6) 【ファイアブレス行使判定】
k10+{エンハンサー}+({知力}/6) 【ファイアブレス威力】

`;
    }

    if (json.V_GLv14 && json.V_GLv14 !== "0") {
      const bonus = json.is_juka_senyou === "1" ? "({精神力}+2)" : "{精神力}";
      cpBattle += "//-----呪歌\n";
      for (let i = 0; i < json.JK_name.length; i++) {
        const name = json.JK_name[i];
        if (!name) {
          continue;
        }
        const kouka = json.JK_kouka[i];
        cpBattle += `【${name}】${kouka}\n`;
      }
      cpBattle += `2d+{バード}+(${bonus}/6) 【演奏判定】
k10+{バード}+(${bonus}/6) 【終律威力10】
k20+{バード}+(${bonus}/6) 【終律威力20】
k30+{バード}+(${bonus}/6) 【終律威力30】
k0+{バード}+(${bonus}/6)@13 【終律回復0】
k10+{バード}+(${bonus}/6)@13 【終律回復10】
k20+{バード}+(${bonus}/6)@13 【終律回復20】
k30+{バード}+(${bonus}/6)@13 【終律回復30】
k40+{バード}+(${bonus}/6)@13 【終律回復40】

`;
    }

    if (json.V_GLv16 && json.V_GLv16 !== "0") {
      cpBattle += "//-----騎芸\n";
      for (let i = 0; i < json.KG_name.length; i++) {
        const name = json.KG_name[i];
        if (!name) {
          continue;
        }
        const timing = json.KG_timing[i];
        const kouka = json.KG_kouka[i];
        cpBattle += `【${name}】(${timing})${kouka}\n`;
      }
      cpBattle += `2d+{ライダー}+({敏捷度}/6) 【騎乗判定】
2d+{ライダー}+({知力}/6) 【弱点隠蔽判定】

`;
    }

    if (json.V_GLv15 && json.V_GLv15 !== "0") {
      cpBattle += "//-----賦術\n";
      for (let i = 0; i < json.HJ_name.length; i++) {
        const name = json.HJ_name[i];
        if (!name) {
          continue;
        }
        const zentei = json.HJ_zentei[i];
        const kouka = json.HJ_kouka[i];
        const b = json.HJ_B[i];
        const a = json.HJ_A[i];
        const s = json.HJ_S[i];
        const ss = json.HJ_SS[i];
        cpBattle += `【${name}】(${zentei})${kouka}(${b}/${a}/${s}/${ss})\n`;
      }
      cpBattle += "2d+{アルケミスト}+({知力}/6) 【賦術判定】\n\n";
    }

    if (json.V_GLv18 && json.V_GLv18 !== "0") {
      cpBattle += "//-----鼓咆\n";
      for (let i = 0; i < json.HO_name.length; i++) {
        const name = json.HO_name[i];
        if (!name) {
          continue;
        }
        const type = json.HO_type[i];
        const rank = json.HO_rank[i];
        const kouka = json.HO_kouka[i];
        cpBattle += `【${name}】(${type}${rank})${kouka}\n`;
      }
      cpBattle += "\n";
    }

    if (json.V_GLv19 && json.V_GLv19 !== "0") {
      cpBattle += "//-----占瞳\n";
      for (let i = 0; i < json.UR_name.length; i++) {
        const name = json.UR_name[i];
        if (!name) {
          continue;
        }
        const type = json.UR_type[i];
        const rank = json.UR_rank[i];
        const kouka = json.UR_kouka[i];
        cpBattle += `【${name}】(${type})(${rank})${kouka}\n`;
      }
      cpBattle += `2d+{ミスティック}+({器用度}/6) 【占瞳判定】器用度
2d+{ミスティック}+({知力}/6) 【占瞳判定】知力
2d+{ミスティック}+({精神力}/6) 【占瞳判定】精神力

`;
    }

    palette.setPalette(cpSearch + cpBattle);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }

  private static formatSign(num: any): string {
    if (!num) {
      return "";
    }
    const valueNum = Number.parseInt(num, 10);
    if (valueNum === 0) {
      return "";
    }
    if (valueNum > 0) {
      return "+" + num;
    }
    return num.toString();
  }
}
