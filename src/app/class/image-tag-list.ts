import { ImageTag } from './image-tag';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { InnerXml } from './core/synchronize-object/object-serializer';
import { PeerCursor } from './peer-cursor';

@SyncObject('ImageTagList')
export class ImageTagList extends ObjectNode implements InnerXml {
  // todo:シングルトン化するのは妥当？
  private static _instance: ImageTagList;
  static get instance(): ImageTagList {
    if (!ImageTagList._instance) {
      ImageTagList._instance = new ImageTagList('ImageTagList');
      ImageTagList._instance.initialize();
    }
    return ImageTagList._instance;
  }

  getTagsByWords(searchWords: string[]): ImageTag[] {
    const resultTags: ImageTag[] = [];

    for (const target of this.children as ImageTag[]) {
      if (target.containsWords(searchWords)) {
        resultTags.push(target);
      }
    }

    return resultTags;
  }

  getTagFromIdentifier(imageIdentifier: string): ImageTag {
    for (const target of this.children as ImageTag[]) {
      if (target.imageIdentifier === imageIdentifier) {
        return target;
      }
    }

    console.log('NotFound Target ImageTag from ImageTagList', imageIdentifier);
    return null;
  }

    pushTag(ide:string ,newtag:string = PeerCursor.myCursor.name ) :ImageTag {
        let retTag =this.getTagFromIdentifier(ide);

        if(retTag == null) {
            retTag = new ImageTag();
            retTag.imageIdentifier = ide;
            retTag.tag = newtag;
            this.appendChild(retTag);
            return retTag;
        }

        if(retTag.tag != newtag) {
            retTag.tag = newtag;
        }
        return retTag;
    }

    innerXml(): string { return ''; }

    parseInnerXml(element: Element) {
      // XMLからの新規作成を許可せず、既存のオブジェクトを更新する
      let context = ImageTagList.instance.toContext();
      context.syncData = this.toContext().syncData;
      ImageTagList.instance.apply(context);
      ImageTagList.instance.update();
  
      this.destroy();
    }
}