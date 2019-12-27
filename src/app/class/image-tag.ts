import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { ObjectStore } from './core/synchronize-object/object-store';
import { ImageFile } from './core/file-storage/image-file';
import { ImageStorage } from './core/file-storage/image-storage';

@SyncObject('image-tag')
export class ImageTag extends ObjectNode {
  @SyncVar() imageIdentifier: string = '';

  private static map: Map<string, string> = new Map<string, string>();

  get tag(): string { return this.value as string; }
  set tag(tag: string) { this.value = tag; }

  get image(): ImageFile { return ImageStorage.instance.get(this.imageIdentifier); }

  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    if (ImageTag.map.has(this.imageIdentifier)) {
      const imageTag = ImageTag.getTag(this.imageIdentifier);
      if (imageTag) imageTag.destroy();
    }
    ImageTag.map.set(this.imageIdentifier, this.identifier);
  }

  onStoreRemoved() {
    super.onStoreRemoved();
    ImageTag.map.delete(this.imageIdentifier);
  }

  containsWords(words: string[]): boolean {
    return words.every(word => this.tag.indexOf(word) >= 0);
  }

  static searchImages(searchWords: string[]): ImageFile[] {
    return ObjectStore.instance
      .getObjects<ImageTag>(ImageTag)
      .filter(tag => tag.containsWords(searchWords))
      .map(tag => tag.image)
      .filter(image => image);
  }

  static getTag(imageIdentifier: string): ImageTag {
    const identifier = ImageTag.map.get(imageIdentifier);
    if (identifier != null && ObjectStore.instance.get(identifier)) return ObjectStore.instance.get<ImageTag>(identifier);
    const imageTags = ObjectStore.instance.getObjects<ImageTag>(ImageTag);
    for (const imageTag of imageTags) {
      if (imageTag.imageIdentifier === imageIdentifier) {
        ImageTag.map.set(imageIdentifier, imageTag.identifier);
        return imageTag;
      }
    }
    return null;
  }

  static create(imageIdentifier: string, tag: string) {
    if (ImageTag.getTag(imageIdentifier)) {
      console.warn(`ImageTag: ${imageIdentifier} is already created.`);
      return ImageTag.getTag(imageIdentifier);
    }
    const object: ImageTag = new ImageTag();

    object.imageIdentifier = imageIdentifier;
    object.tag = tag;

    object.initialize();
    return object;
  }
}
