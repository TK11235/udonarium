import { ImageFile } from './core/file-storage/image-file';
import { ImageStorage } from './core/file-storage/image-storage';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { GameObject, ObjectContext } from './core/synchronize-object/game-object';
import { ObjectStore } from './core/synchronize-object/object-store';
import { EventSystem, Network } from './core/system';

@SyncObject('PeerCursor')
export class PeerCursor extends GameObject {
  @SyncVar() peerId: string = '';
  @SyncVar() peerFullstring: string = '';
  @SyncVar() name: string = '';
  @SyncVar() imageIdentifier: string = '';

  static myCursor: PeerCursor = null;
  private static hash: { [peerFullstring: string]: string } = {};

  get isMine(): boolean { return (PeerCursor.myCursor && PeerCursor.myCursor === this); }
  get image(): ImageFile { return ImageStorage.instance.get(this.imageIdentifier); }

  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    if (!this.isMine) {
      EventSystem.register(this)
        .on('DISCONNECT_PEER', -1000, event => {
          if (event.data.peer !== this.peerFullstring) return;
          delete PeerCursor.hash[this.peerFullstring];
          ObjectStore.instance.remove(this);
        });
    }
  }

  // GameObject Lifecycle
  onStoreRemoved() {
    super.onStoreRemoved();
    EventSystem.unregister(this);
    delete PeerCursor.hash[this.peerFullstring];
  }

  static find(peerFullstring: string): PeerCursor {
    let identifier = PeerCursor.hash[peerFullstring];
    if (identifier != null && ObjectStore.instance.get(identifier)) return ObjectStore.instance.get<PeerCursor>(identifier);
    let cursors = ObjectStore.instance.getObjects<PeerCursor>(PeerCursor);
    for (let cursor of cursors) {
      if (cursor.peerFullstring === peerFullstring) {
        PeerCursor.hash[peerFullstring] = cursor.identifier;
        return cursor;
      }
    }
    return null;
  }

  static createMyCursor(): PeerCursor {
    if (PeerCursor.myCursor) {
      console.warn('It is already created.');
      return PeerCursor.myCursor;
    }
    PeerCursor.myCursor = new PeerCursor();
    PeerCursor.myCursor.peerFullstring = Network.peerId;
    PeerCursor.myCursor.initialize();
    return PeerCursor.myCursor;
  }

  // override
  apply(context: ObjectContext) {
    if (context.syncData['peerFullstring'] !== this.peerFullstring) {
      PeerCursor.hash[context.syncData['peerFullstring']] = PeerCursor.hash[this.peerFullstring];
      delete PeerCursor.hash[this.peerFullstring];
    }
    super.apply(context);
  }

  isPeerAUdon() {
    return /u.*d.*o.*n/ig.exec(this.peerFullstring) != null;
  }
}
