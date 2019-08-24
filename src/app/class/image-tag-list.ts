import { ImageTag } from './image-tag';
import { SyncObject } from './core/synchronize-object/decorator';
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

  pushTag(imageIdentifier: string, newtag: string = PeerCursor.myCursor.name): ImageTag {
    let imageTag = this.getTagFromIdentifier(imageIdentifier);

    if (!imageTag) {
      imageTag = new ImageTag();
      imageTag.imageIdentifier = imageIdentifier;
      imageTag.tag = newtag;
      imageTag.initialize();
      this.appendChild(imageTag);
      return imageTag;
    }

    if (imageTag.tag !== newtag) {
      imageTag.tag = newtag;
    }
    return imageTag;
  }

  innerXml(): string { return ''; }

  parseInnerXml(element: Element) {
    // XMLからの新規作成を許可せず、既存のオブジェクトを更新する
    const context = ImageTagList.instance.toContext();
    context.syncData = this.toContext().syncData;
    ImageTagList.instance.apply(context);
    ImageTagList.instance.update();

    this.destroy();
  }
}
