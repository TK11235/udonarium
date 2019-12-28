import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ObjectStore } from './core/synchronize-object/object-store';
import { ImageFile } from './core/file-storage/image-file';
import { ImageStorage } from './core/file-storage/image-storage';

@SyncObject('image-tag')
export class ImageTag extends ObjectNode {
  @SyncVar() imageIdentifier: string = '';
  @SyncVar() tag: string = '';

  containsWords(words: string[]): boolean {
    return words.every(word => this.tag.indexOf(word) >= 0);
  }

  static searchImages(searchWords: string[]): ImageFile[] {
    return ObjectStore.instance
      .getObjects<ImageTag>(ImageTag)
      .filter(tag => tag.containsWords(searchWords))
      .map(tag => ImageStorage.instance.get(tag.imageIdentifier))
      .filter(image => image);
  }

  static get(imageIdentifier: string): ImageTag {
    return ObjectStore.instance.get<ImageTag>(`imagetag_${imageIdentifier}`);
  }

  static create(imageIdentifier: string) {
    const object: ImageTag = new ImageTag(`imagetag_${imageIdentifier}`);

    object.imageIdentifier = imageIdentifier;

    object.initialize();
    return object;
  }

  parseInnerXml(element: Element) {
    // 既存のオブジェクトを更新する
    let imageTag = ImageTag.get(this.imageIdentifier);
    if (!imageTag) imageTag = ImageTag.create(this.imageIdentifier);
    const context = imageTag.toContext();
    context.syncData = this.toContext().syncData;
    imageTag.apply(context);
    imageTag.update();
    this.destroy();
  }
}
