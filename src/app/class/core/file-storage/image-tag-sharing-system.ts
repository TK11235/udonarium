import { EventSystem } from '../system';
import { ImageTagContext, ImageTag } from './image-tag';
import { CatalogItem, ImageTagStorage } from './image-tag-storage';

export class ImageTagSharingSystem {
  private static _instance: ImageTagSharingSystem
  static get instance(): ImageTagSharingSystem {
    if (!ImageTagSharingSystem._instance) ImageTagSharingSystem._instance = new ImageTagSharingSystem();
    return ImageTagSharingSystem._instance;
  }

  private constructor() {
    console.log('ImageTagSharingSystem ready...');
  }

  initialize() {
    EventSystem.register(this)
      .on('CONNECT_PEER', 1, event => {
        if (!event.isSendFromSelf) return;
        console.log('CONNECT_PEER ImageTagStorageService !!!', event.data.peer);
        ImageTagStorage.instance.synchronize();
      })
      .on('SYNCHRONIZE_IMAGETAG', event => {
        if (event.isSendFromSelf) return;
        console.log('SYNCHRONIZE_IMAGETAG ImageTagStorageService ' + event.sendFrom);
        let otherCatalog: CatalogItem[] = event.data;
        for (let item of otherCatalog) {
          let imageTag: ImageTag = ImageTagStorage.instance.get(item.identifier);
          let itemVersion = item.imageTagContext.majorVersion + item.imageTagContext.minorVersion;
          if (imageTag === null || imageTag.version < itemVersion) {
            let updateImageTag = ImageTag.copy(item.imageTagContext);
            ImageTagStorage.instance.add(updateImageTag);
          }
        }
      });
  }

  private destroy() {
    EventSystem.unregister(this);
  }
}