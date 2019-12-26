import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';

@SyncObject('image-tag')
export class ImageTag extends ObjectNode {
  @SyncVar() imageIdentifier: string = '';

  get tag(): string { return this.value as string; }
  set tag(tag: string) { this.value = tag; }

  containsWords(words: string[]): boolean {
    return words.every(word => this.tag.indexOf(word) >= 0);
  }

  static create(imageIdentifier: string, tag: string) {
    const object: ImageTag = new ImageTag();

    object.imageIdentifier = imageIdentifier;
    object.tag = tag;

    object.initialize();
    return object;
  }
}
