import { ChatPalette } from './chat-palette';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';
import { PeerCursor } from './peer-cursor';
@SyncObject('character')
export class GameCharacter extends TabletopObject {
  @SyncVar() rotate: number = 0;
  @SyncVar() roll: number = 0;
  //GM
  @SyncVar() GM: string = '';

  get name(): string { return this.getCommonValue('name', ''); }
  get size(): number { return this.getCommonValue('size', 1); }

  //GM
  get GMName(): string {
    let object = PeerCursor.find(this.GM);
    return object ? object.name : '';
  }
  get hasGM(): boolean {
    if (this.GM) return true
    else return false
  }
  get isMine(): boolean { return PeerCursor.myCursor.name === this.GM; }
  get isDisabled(): boolean {
    //console.log('hasGM', this.hasGM)
   // console.log('isMine', this.isMine)
    return this.hasGM && !this.isMine;
  }

  get chatPalette(): ChatPalette {
    for (let child of this.children) {
      if (child instanceof ChatPalette) return child;
    }
    return null;
  }
  //CLONE2
  set name(value: string) { this.setCommonValue('name', value); }
  static create(name: string, size: number, imageIdentifier: string): GameCharacter {
    let gameCharacter: GameCharacter = new GameCharacter();
    gameCharacter.createDataElements();
    gameCharacter.initialize();
    gameCharacter.createTestGameDataElement(name, size, imageIdentifier);

    return gameCharacter;
  }

  createTestGameDataElement(name: string, size: number, imageIdentifier: string) {
    this.createDataElements();

    let nameElement: DataElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement: DataElement = DataElement.create('size', size, {}, 'size_' + this.identifier);
    //let GMElement: DataElement = DataElement.create('GM', GM, {}, 'GM_' + this.identifier);

    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }

    let resourceElement: DataElement = DataElement.create('資源', '', {}, '資源' + this.identifier);
    let hpElement: DataElement = DataElement.create('HP', 200, { 'type': 'numberResource', 'currentValue': '200' }, 'HP_' + this.identifier);
    let mpElement: DataElement = DataElement.create('MP', 100, { 'type': 'numberResource', 'currentValue': '100' }, 'MP_' + this.identifier);
    let SANElement: DataElement = DataElement.create('SAN', 100, { 'type': 'numberResource', 'currentValue': '100' }, 'SAN_' + this.identifier);

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);
    //this.commonDataElement.appendChild(GMElement);
    this.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(hpElement);
    resourceElement.appendChild(mpElement);
    resourceElement.appendChild(SANElement);
    //TEST
    let testElement: DataElement = DataElement.create('情報', '', {}, '情報' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('説明', '在此處輸入說明\n', { 'type': 'note' }, '説明' + this.identifier));
    testElement.appendChild(DataElement.create('筆記', '任意文字\n１\n２\n３\n４\nHKTRPG', { 'type': 'note' }, '筆記' + this.identifier));

    //TEST
    testElement = DataElement.create('能力', '', {}, '能力' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('器用', '1d100<50', {}, '器用度' + this.identifier));
    testElement.appendChild(DataElement.create('敏捷', '1d100<80', {}, '敏捷度' + this.identifier));
    testElement.appendChild(DataElement.create('筋力', 24, {}, '筋力' + this.identifier));
    testElement.appendChild(DataElement.create('生命力', 24, {}, '生命力' + this.identifier));
    testElement.appendChild(DataElement.create('知力', 24, {}, '知力' + this.identifier));
    testElement.appendChild(DataElement.create('精神力', 24, {}, '精神力' + this.identifier));

    //TEST
    testElement = DataElement.create('戰鬥特技', '', {}, '戰鬥特技' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('Lv1', '全力攻撃', {}, 'Lv1' + this.identifier));
    testElement.appendChild(DataElement.create('Lv3', '武器習熟/劍', {}, 'Lv3' + this.identifier));
    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    let palette: ChatPalette = new ChatPalette('ChatPalette_' + this.identifier);
    palette.setPalette(`對話組合版使用例子：
2d6+1 投擲骰子
１ｄ２０＋{敏捷}＋｛格闘｝　{name}格鬥！
//敏捷=10+{敏捷A}
//敏捷A=10
//格闘＝１`);
    palette.initialize();
    this.appendChild(palette);
  }
  clone2(): this {
    let cloneObject = super.clone();

    let objectname: string;
    let reg = new RegExp('(.*)_([0-9]*)');
    let res = cloneObject.name.match(reg);

    if (res != null && res.length == 3) {
      let cloneNumber: number = parseInt(res[2]) + 1;
      objectname = res[1] + "_" + cloneNumber;
    } else {
      objectname = cloneObject.name + "_2";
    }

    cloneObject.name = objectname;
    cloneObject.update();

    return cloneObject;

  }
}
