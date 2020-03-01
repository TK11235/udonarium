import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';

@SyncObject('image-tag')
export class ImageTag extends ObjectNode {
  @SyncVar() imageIdentifier: string = '';
  @SyncVar() tag: string = '';
}