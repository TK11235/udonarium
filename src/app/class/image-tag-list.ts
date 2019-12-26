import { ImageTag } from './image-tag';
import { SyncObject } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { InnerXml, ObjectSerializer } from './core/synchronize-object/object-serializer';

@SyncObject('image-tag-list')
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

  private imageTagHash: { [imageIdentifier: string]: ImageTag } = {};

  getTags(searchWords: string[]): ImageTag[] {
    return (this.children as ImageTag[]).filter(tag => tag.containsWords(searchWords));
  }

  getTag(imageIdentifier: string): ImageTag {
    const imageTag = this.imageTagHash[imageIdentifier];
    return imageTag ? imageTag : null;
  }

  add(object: ImageTag) {
    let imageTag = this.getTag(object.imageIdentifier);

    if (imageTag) {
      imageTag.tag += ' ' + object.tag;
      object.destroy();
    } else {
      imageTag = object;
      this.imageTagHash[object.imageIdentifier] = object;
      this.appendChild(object);
    }

    return imageTag;
  }

  parseInnerXml(element: Element) {
    // XMLからの新規作成を許可せず、既存のオブジェクトを更新する
    const context = ImageTagList.instance.toContext();
    context.syncData = this.toContext().syncData;
    ImageTagList.instance.apply(context);
    ImageTagList.instance.update();

    for (let i = 0; i < element.children.length; i++) {
      const child = ObjectSerializer.instance.parseXml(element.children[i]);
      if (child instanceof ImageTag) ImageTagList.instance.add(child);
    }

    this.destroy();
  }
}
