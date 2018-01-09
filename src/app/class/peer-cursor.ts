import { Network, EventSystem } from './core/system/system';
import { ObjectStore } from './core/synchronize-object/object-store';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameObject, ObjectContext } from './core/synchronize-object/game-object';
import { FileStorage } from './core/file-storage/file-storage';
import { ImageFile } from './core/file-storage/image-file';
import { Transform, IPoint2D, IPoint3D } from './transform/transform';

@SyncObject('PeerCursor')
export class PeerCursor extends GameObject {
  @SyncVar() peerId: string = '';
  @SyncVar() name: string = '';
  @SyncVar() imageIdentifier: string = '';
  @SyncVar() posX: number = 0;
  @SyncVar() posY: number = 0;
  @SyncVar() posZ: number = 0;

  static myCursor: PeerCursor = null;
  private static hash: { [peerId: string]: string } = {};

  get isMine(): boolean { return (PeerCursor.myCursor && PeerCursor.myCursor === this); }
  get image(): ImageFile { return FileStorage.instance.get(this.imageIdentifier); }

  private updateInterval: NodeJS.Timer = null;
  private callcack: any = (e) => this.onMouseMove(e);

  private _x: number = 0;
  private _y: number = 0;

  initialize(needUpdate: boolean = true) {
    super.initialize(needUpdate);

    if (this.isMine) {
      document.body.addEventListener('mousemove', this.callcack);
      document.body.addEventListener('touchmove', this.callcack);
    } else {
      EventSystem.register(this)
        .on('CLOSE_OTHER_PEER', -1000, event => {
          if (event.data.peer !== this.peerId) return;
          delete PeerCursor.hash[this.peerId];
          ObjectStore.instance.delete(this, false);
        });
    }
  }

  destroy() {
    document.body.removeEventListener('mousemove', this.callcack);
    document.body.removeEventListener('touchmove', this.callcack);
    delete PeerCursor.hash[this.peerId];
    super.destroy();
  }

  static find(peerId): PeerCursor {
    let identifier = PeerCursor.hash[peerId];
    if (identifier != null && ObjectStore.instance.get(identifier)) return ObjectStore.instance.get<PeerCursor>(identifier);
    let cursors = ObjectStore.instance.getObjects<PeerCursor>(PeerCursor);
    for (let cursor of cursors) {
      if (cursor.peerId === peerId) {
        PeerCursor.hash[peerId] = cursor.identifier;
        return cursor;
      }
    }
    return null;
  }

  static createMyCursor(): PeerCursor {
    if (PeerCursor.myCursor) {
      console.warn('It is already created.');
      return;
    }
    PeerCursor.myCursor = new PeerCursor();
    PeerCursor.myCursor.peerId = Network.peerId;
    PeerCursor.myCursor.initialize();
    return PeerCursor.myCursor;
  }

  private onMouseMove(e: any) {
    let x = e.touches ? e.changedTouches[0].pageX : e.pageX;
    let y = e.touches ? e.changedTouches[0].pageY : e.pageY;
    if (x === this._x && y === this._y) return;
    this._x = x;
    this._y = y;
    if (!this.updateInterval) {
      this.updateInterval = setTimeout(() => {
        this.updateInterval = null;
        this.calcLocalCoordinate(this._x, this._y, e.target);
      }, 66);
    }
  }

  // override
  apply(context: ObjectContext) {
    if (context.syncData['peerId'] !== this.peerId) {
      PeerCursor.hash[context.syncData['peerId']] = PeerCursor.hash[this.peerId];
      delete PeerCursor.hash[this.peerId];
    }
    super.apply(context);
  }

  isPeerAUdon() {
    return /u.*d.*o.*n/ig.exec(this.peerId) != null;
  }

  private calcLocalCoordinate(x: number, y: number, target: HTMLElement) {
    let isTerrain = true;
    let node: HTMLElement = target;
    let dragArea = document.getElementById('app-game-table');

    while (node) {
      if (node === dragArea) break;
      node = node.parentElement;
    }
    if (node == null) isTerrain = false;

    let coordinate: IPoint3D = { x: x, y: y, z: 0, w: 0 };
    if (!isTerrain) {
      coordinate = this.convertToLocal(coordinate, dragArea);
      coordinate.z = 0;
    } else {
      coordinate = this.convertLocalToLocal(coordinate, target, dragArea);
    }

    this.posX = coordinate.x;
    this.posY = coordinate.y;
    this.posZ = coordinate.z;
  }

  private convertToLocal(pointer: IPoint2D, element: HTMLElement = document.body): IPoint3D {
    let transformer: Transform = new Transform(element);
    let ray = transformer.globalToLocal(pointer.x, pointer.y, 0);
    transformer.clear();
    return ray;
  }

  private convertLocalToLocal(pointer: IPoint3D, from: HTMLElement, to: HTMLElement): IPoint3D {
    let transformer: Transform = new Transform(from);
    let local = transformer.globalToLocal(pointer.x, pointer.y, pointer.z ? pointer.z : 0);
    let ray = transformer.localToLocal(local.x, local.y, 0, to);
    transformer.clear();
    return ray;
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
  }
}
