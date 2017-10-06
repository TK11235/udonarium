import { Network, EventSystem } from './core/system/system';
import { ObjectStore } from './core/synchronize-object/object-store';
import { SyncObject, SyncVar } from './core/synchronize-object/anotation';
import { GameObject, ObjectContext } from './core/synchronize-object/game-object';
import { FileStorage } from './core/file-storage/file-storage';
import { ImageFile } from './core/file-storage/image-file';

@SyncObject('PeerCursor')
export class PeerCursor extends GameObject {
  @SyncVar() peerId: string = '';
  @SyncVar() name: string = '';
  @SyncVar() left: number = 0;
  @SyncVar() top: number = 0;
  @SyncVar() imageIdentifier: string = '';

  static myCursor: PeerCursor = null;
  private static hash: { [peerId: string]: string } = {};

  get isMine(): boolean { return (PeerCursor.myCursor && PeerCursor.myCursor === this); }
  get image(): ImageFile { return FileStorage.instance.get(this.imageIdentifier); }

  private $cursorElement: JQuery = null;
  private updateInterval: NodeJS.Timer = null;
  private deleteTimer: any = null;
  private callcack: any = (e) => this.onMouseMove(e);

  initialize(needUpdate: boolean = true) {
    super.initialize(needUpdate);

    if (this.isMine) {
      document.body.addEventListener('mousemove', this.callcack);
      document.body.addEventListener('touchmove', this.callcack);
    } else {
      EventSystem.register(this)
        .on('CLOSE_OTHER_PEER', -1000, event => {
          if (event.data.peer !== this.peerId) return;
          this.removeCursorElement();
          delete PeerCursor.hash[this.peerId];
          ObjectStore.instance.delete(this, false);
        });
      this.crerateCursorElement();
    }
  }

  destroy() {
    this.removeCursorElement();
    delete PeerCursor.hash[this.peerId];
    super.destroy();
  }

  private removeCursorElement() {
    if (this.deleteTimer !== null) {
      clearTimeout(this.deleteTimer);
      this.deleteTimer = null;
    }
    if (this.$cursorElement !== null) {
      this.$cursorElement.remove();
      this.$cursorElement = null;
    }

    document.body.removeEventListener('mousemove', this.callcack);
    document.body.removeEventListener('touchmove', this.callcack);
  }

  static find(peerId): PeerCursor {
    let identifier = PeerCursor.hash[peerId];
    if (identifier != null && ObjectStore.instance.get(identifier)) return ObjectStore.instance.get<PeerCursor>(identifier);
    let cursors = ObjectStore.instance.getObjects(PeerCursor);
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
    if (x === this.left && y === this.top) return;
    if (!this.updateInterval) {
      this.updateInterval = setTimeout(() => {
        this.setPosition(x, y);
        this.left = x;
        this.top = y;
        this.updateInterval = null;
      }, 66);
    }
  }

  private startDeleteTimer() {
    if (this.deleteTimer !== null) clearTimeout(this.deleteTimer);

    this.deleteTimer = setTimeout(() => {
      this.$cursorElement.css('opacity', 0);

      this.deleteTimer = setTimeout(() => {
        this.$cursorElement.css('display', 'none');
      }, 1000);

    }, 3000);
    this.$cursorElement.css('display', 'block');
    this.$cursorElement.css('opacity', 1.0);
  }

  onUpdate() {
    this.setPosition(this.left, this.top);
    if (this.$cursorElement) {
      this.startDeleteTimer();
    }
  }

  // override
  apply(context: ObjectContext) {
    if (context.syncData['peerId'] !== this.peerId) {
      PeerCursor.hash[context.syncData['peerId']] = PeerCursor.hash[this.peerId];
      delete PeerCursor.hash[this.peerId];
    }
    super.apply(context);
    this.onUpdate();
  }

  setPosition(left: number, top: number) {
    if (this.$cursorElement) {
      this.$cursorElement.html('■' + this.name);
      this.$cursorElement.css('transform', 'translateX(' + left + 'px) translateY(' + top + 'px)');
    }
  }

  isPeerAUdon() {
    return /u.*d.*o.*n/ig.exec(this.peerId) != null;
  }

  private crerateCursorElement() {
    this.$cursorElement = $('<div>');
    this.$cursorElement.css('position', 'absolute');
    this.$cursorElement.css('transition', 'transform 66ms linear, opacity 1.0s ease-out');
    this.$cursorElement.css('white-space', 'nowrap');
    this.$cursorElement.appendTo('#app-table-layer');
    this.$cursorElement.html('■' + this.name);
    this.startDeleteTimer();
  }
}
