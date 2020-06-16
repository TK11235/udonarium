import { ChatPalette } from "@udonarium/chat-palette";
import { DataElement } from "@udonarium/data-element";

import { CustomCharacter } from "../custom-character";

/**
 * キャラクター保管所 新クトゥルフ
 * https://charasheet.vampire-blood.net/list_coc7.html
 */
export class Cthulhu7th {
  static generateByVampireVlood(json: any, url: string): CustomCharacter[] {
    const gameCharacter: CustomCharacter = CustomCharacter.createCustomCharacter(
      json.pc_name,
      1,
      ""
    );

    /*
     *情報
     */
    const infoElement = gameCharacter.createDataElement("情報", "");
    gameCharacter.detailDataElement.appendChild(infoElement);
    infoElement.appendChild(gameCharacter.createDataElement("PL", ""));
    infoElement.appendChild(
      gameCharacter.createDataElement("職業", json.shuzoku)
    );
    infoElement.appendChild(gameCharacter.createDataElement("年齢", json.age));
    infoElement.appendChild(gameCharacter.createDataElement("性別", json.sex));
    infoElement.appendChild(
      gameCharacter.createDataElement("出身", json.pc_kigen)
    );
    infoElement.appendChild(
      gameCharacter.createNoteElement("プロフ", json.pc_making_memo)
    );
    infoElement.appendChild(gameCharacter.createNoteElement("URL", url));

    /*
     * リソース
     */
    const resourceElement = gameCharacter.createDataElement("リソース", "");
    gameCharacter.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(
      gameCharacter.createResourceElement("耐久力", json.NA10, json.NA10)
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        "マジック・ポイント",
        json.NA11,
        json.NA11
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        "正気度",
        json.SAN_start,
        json.SAN_Left
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement(
        "幸運",
        json.Luck_start,
        json.Luck_Left
      )
    );
    resourceElement.appendChild(
      gameCharacter.createResourceElement("ボーナス・ペナルティ", 2, 0)
    );

    /*
     * 能力値
     */
    const abilityElement = gameCharacter.createDataElement("能力値", "");
    gameCharacter.detailDataElement.appendChild(abilityElement);
    abilityElement.appendChild(
      gameCharacter.createDataElement("STR", json.NP1)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("CON", json.NP2)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("DEX", json.NP3)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("APP", json.NP4)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("POW", json.NP5)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("SIZ", json.NP6)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("INT", json.NP7)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("EDU", json.NP8)
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("MOV", json.NA9)
    );
    const dmgBonus = json.dmg_bonus;
    abilityElement.appendChild(
      gameCharacter.createDataElement(
        "DB",
        dmgBonus.indexOf("-") < 0 ? `+${dmgBonus}` : dmgBonus
      )
    );
    abilityElement.appendChild(
      gameCharacter.createDataElement("ビルド", json.build_bonus)
    );

    /*
     *戦闘技能
     */
    const skillElements: DataElement[] = [
      gameCharacter.createDataElement("戦闘技能", ""),
      gameCharacter.createDataElement("探索技能", ""),
      gameCharacter.createDataElement("踏破技能", ""),
      gameCharacter.createDataElement("行動技能", ""),
      gameCharacter.createDataElement("交渉技能", ""),
      gameCharacter.createDataElement("知識技能", ""),
    ];
    skillElements.forEach((element) =>
      gameCharacter.detailDataElement.appendChild(element)
    );
    for (let i = 0; i < json.SKAN.length; i++) {
      let skillName = json.SKAN[i];
      const skillSubName = json.SKAM[i];
      if (skillSubName) {
        skillName += `(${skillSubName})`;
      }
      const skillPoint = json.SKAP[i];
      const skillType = Number.parseInt(json.SKTP[i], 10);
      skillElements[skillType].appendChild(
        gameCharacter.createDataElement(skillName, skillPoint)
      );
    }

    /*
     * 武器・防具
     */
    const armsElement = gameCharacter.createDataElement("武器・防具", "");
    gameCharacter.detailDataElement.appendChild(armsElement);
    for (let i = 0; i < json.arms_name.length; i++) {
      const armName = json.arms_name[i];
      if (!armName) {
        continue;
      }
      armsElement.appendChild(
        gameCharacter.createDataElement(armName, json.arms_hit[i])
      );
    }

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
      itemElement.appendChild(
        gameCharacter.createNoteElement(itemName, json.item_memo[i])
      );
    }

    const domParser: DOMParser = new DOMParser();
    domParser.parseFromString(gameCharacter.toXml(), "application/xml");

    const palette: ChatPalette = new ChatPalette(
      "ChatPalette_" + gameCharacter.identifier
    );
    palette.dicebot = "Cthulhu7th";
    // チャパレ内容
    let cp = `1d100
CC
CC({ボーナス・ペナルティ})<=

//-----正気度・狂気表
CC({ボーナス・ペナルティ})<={正気度} 〈正気度〉ロール
現在正気度 {正気度}
C(99-{クトゥルフ神話}) 最大正気度
BMR 狂気の発作（リアルタイム）表
BMS 狂気の発作（サマリー）表
PH 恐怖症表
MA マニア表

//-----能力値ロール
CC({ボーナス・ペナルティ})<={STR} STR
CC({ボーナス・ペナルティ})<={CON} CON
CC({ボーナス・ペナルティ})<={SIZ} SIZ
CC({ボーナス・ペナルティ})<={DEX} DEX
CC({ボーナス・ペナルティ})<={APP} APP
CC({ボーナス・ペナルティ})<={INT} INT〈アイデア〉
CC({ボーナス・ペナルティ})<={POW} POW
CC({ボーナス・ペナルティ})<={EDU} EDU〈知識〉
CC({ボーナス・ペナルティ})<={幸運} 〈幸運〉

`;
    const cpSkills = [
      "\n//-----戦闘技能\n",
      "\n//-----探索技能\n",
      "\n//-----踏破技能\n",
      "\n//-----行動技能\n",
      "\n//-----交渉技能\n",
      "\n//-----知識技能\n",
    ];
    for (let i = 0; i < json.SKAN.length; i++) {
      let skillName = json.SKAN[i];
      const skillSubName = json.SKAM[i];
      if (skillSubName) {
        skillName += `(${skillSubName})`;
      }
      const skillType = Number.parseInt(json.SKTP[i], 10);
      cpSkills[
        skillType
      ] += `CC({ボーナス・ペナルティ})<={${skillName}} 〈${skillName}〉\n`;
    }
    cp += cpSkills.join("");
    cp += "\n//-----武器・防具\n";
    for (let i = 0; i < json.arms_name.length; i++) {
      const armName = json.arms_name[i];
      if (!armName) {
        continue;
      }
      const range = json.arms_range[i];
      const vitality = Number.parseInt(json.arms_vitality[i], 10);
      const damage = json.arms_damage[i]
        .replace(/1\/2db/gi, "DB/2")
        .replace(/\+db/gi, "{DB}");
      cp += `CC({ボーナス・ペナルティ})<={${armName}} :${armName}/${range}`;
      if (!Number.isNaN(vitality)) {
        const attackCount = json.arms_attack_count[i];
        const lastShot = json.arms_last_shot[i];
        cp += `FAR(1,{${armName}},${vitality},{ボーナス・ペナルティ}) :${armName}/${range}/回数${attackCount}/装弾数${lastShot}/故障#${vitality}`;
      }
      cp += `\n${damage} :${armName}(ダメージ)\n`;
    }

    cp += `
//-----プッシュ時の詠唱ロールでの失敗表
FCL 控えめな呪文の場合
FCM パワフルな呪文の場合`;

    palette.setPalette(cp);
    palette.initialize();
    gameCharacter.appendChild(palette);

    gameCharacter.update();
    return [gameCharacter];
  }
}
