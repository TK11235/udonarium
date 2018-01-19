import { EventSystem, Network } from '../system/system';
import { ObjectFactory } from './object-factory';
import { GameObject, ObjectContext } from './game-object';
import { ObjectStore } from './object-store';

export class ObjectSynchronizer {
  private static _instance: ObjectSynchronizer
  static get instance(): ObjectSynchronizer {
    if (!ObjectSynchronizer._instance) ObjectSynchronizer._instance = new ObjectSynchronizer();
    return ObjectSynchronizer._instance;
  }

  private constructor() { }

  initialize() {
    this.destroy();
    console.log('ObjectSynchronizer ready...');
    EventSystem.register(this)
      .on('OPEN_OTHER_PEER', 2, event => {
        if (!event.isSendFromSelf) return;
        console.log('OPEN_OTHER_PEER GameRoomService !!!', event.data.peer);
        ObjectStore.instance.synchronize();
      })
      .on('CLOSE_OTHER_PEER', 0, event => {
        if (!event.isSendFromSelf) return;
        console.log('CLOSE_OTHER_PEER GameRoomService !!!', event.data.peer);
        EventSystem.call('DELETE_GAME_OBJECT', { identifier: event.data.peer });
      })
      .on('UPDATE_GAME_OBJECT', 0, event => {
        let context: ObjectContext = event.data;
        let object: GameObject = ObjectStore.instance.get(context.identifier);
        if (object) {
          if (!event.isSendFromSelf) this.updateObject(object, context);
        } else {
          this.createObject(context);
        }
      })
      .on('DELETE_GAME_OBJECT', 0, event => {
        let context: ObjectContext = event.data;
        let object = ObjectStore.instance.get(event.data.identifier);
        if (object !== null) {
          ObjectStore.instance.delete(object, false);
        }
      });
  }

  destroy() {
    EventSystem.unregister(this);
  }

  private updateObject(object: GameObject, context: ObjectContext) {
    if (context.majorVersion + context.minorVersion < object.version) {
      object.update(false);
    } else if (context.majorVersion + context.minorVersion > object.version) {
      object.apply(context);
    }
  }

  private createObject(context: ObjectContext) {
    if (ObjectStore.instance.isDeleted(context.identifier, context)) {
      EventSystem.call('DELETE_GAME_OBJECT', { identifier: context.identifier });
      return;
    }
    let newObject: GameObject = ObjectFactory.instance.create(context.aliasName, context.identifier);
    if (!newObject) {
      console.log(context.aliasName + ' is Unknown...?', context);
      return;
    }
    newObject.apply(context);
    newObject.initialize(false);
  }
}
setTimeout(function () { ObjectSynchronizer.instance; }, 0);
