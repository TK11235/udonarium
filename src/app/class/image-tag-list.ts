import { ImageTag } from './image-tag';
import { SyncObject } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { InnerXml, ObjectSerializer } from './core/synchronize-object/object-serializer';
import { ObjectStore } from './core/synchronize-object/object-store';

@SyncObject('image-tag-list')
export class ImageTagList extends ObjectNode implements InnerXml {
  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    ObjectStore.instance.remove(this); // ObjectStoreには登録しない
  }

  innerXml(): string {
    return ObjectStore.instance
      .getObjects<ImageTag>(ImageTag)
      .map(object => object.toXml())
      .join();
  }
}
