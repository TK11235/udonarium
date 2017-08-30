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

  private constructor() {
    console.log('ObjectSynchronizer ready...');
    EventSystem.register(this)
      .on('OPEN_OTHER_PEER', 2, event => {
        if (event.sendFrom !== Network.peerId) return;
        console.log('OPEN_OTHER_PEER GameRoomService !!!', event.data.peer);
        ObjectStore.instance.synchronize();
      })
      .on('CLOSE_OTHER_PEER', 0, event => {
        if (event.sendFrom !== Network.peerId) return;
        console.log('CLOSE_OTHER_PEER GameRoomService !!!', event.data.peer);
        EventSystem.call('DELETE_GAME_OBJECT', { identifier: event.data.peer });
      })
      .on('UPDATE_GAME_OBJECT', 0, event => {
        //if (event.sendFrom === Network.peerId) return;
        let context: ObjectContext = event.data;
        let object: GameObject = ObjectStore.instance.get(context.identifier);
        if (object) {
          // Update
          if (event.sendFrom === Network.peerId) return;
          if (context.majorVersion + context.minorVersion < object.version) {
            object.update(false);
          } else if (context.majorVersion + context.minorVersion > object.version) {
            object.apply(context);
          }
        } else {
          // Create
          let garbageIdentifier = ObjectStore.instance.getDeletedObject(context.identifier);
          if (garbageIdentifier && ObjectStore.instance.isDeleted(garbageIdentifier, context)) {
            EventSystem.call('DELETE_GAME_OBJECT', { identifier: garbageIdentifier });
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
}
setTimeout(function () { ObjectSynchronizer.instance; }, 0);
