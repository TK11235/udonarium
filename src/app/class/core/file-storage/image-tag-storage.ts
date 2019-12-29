import { EventSystem } from '../system';
import { ImageTagContext, ImageTag } from './image-tag';
import { FileReaderUtil } from './file-reader-util';

export type CatalogItem = { identifier: string, imageTagContext: ImageTagContext };

export class ImageTagStorage {
  inputTag: string = '';
  isActive = false;

  private static _instance: ImageTagStorage
  static get instance(): ImageTagStorage {
    if (!ImageTagStorage._instance) ImageTagStorage._instance = new ImageTagStorage();
    return ImageTagStorage._instance;
  }

  private imageTagHash: { [identifier: string]: ImageTag } = {};

  get tags(): ImageTag[] {
    let imageTags: ImageTag[] = [];
    for (let identifier in this.imageTagHash) {
      imageTags.push(this.imageTagHash[identifier]);
    }
    return imageTags;
  }

  private lazyTimer: NodeJS.Timer;

  private constructor() {
    console.log('ImageTagStorage ready...');
  }

  private destroy() {
    for (let identifier in this.imageTagHash) {
      this.delete(identifier);
    }
  }

  async loadAsync(file: File): Promise<void>
  async loadAsync(blob: Blob): Promise<void>
  async loadAsync(arg: any): Promise<void> {
    let tagCsvData: string = await FileReaderUtil.readAsTextAsync(arg);
    let tagLines: string[] = tagCsvData.split("\r\n");
    for (let tagLine of tagLines) {
      let identifier = tagLine.split(",")[0];
      let tag = tagLine.split(",")[1];
      let imageTag = await ImageTag.createAsync(identifier, tag);
      this._add(imageTag);
    }
  }

  async addAsync(identifier: string): Promise<ImageTag> {
    let imageTag: ImageTag = await ImageTag.createAsync(identifier, this.inputTag);
    if (this.isActive) return this._add(imageTag);
    return imageTag;
  }

  add(imageTag: ImageTag): ImageTag {
    return this._add(imageTag);
  }

  private _add(imageTag: ImageTag): ImageTag {
    this.lazySynchronize(100);
    if (this.update(imageTag)) return this.imageTagHash[imageTag.identifier];
    this.imageTagHash[imageTag.identifier] = imageTag;
    console.log('addNewTag()', imageTag);
    return imageTag;
  }

  private update(imageTag: ImageTag): boolean
  private update(imageTag: ImageTagContext): boolean
  private update(imageTag: any): boolean {
    let context: ImageTagContext;
    if (imageTag instanceof ImageTag) {
      context = imageTag.toContext();
    } else {
      context = imageTag;
    }
    let updatingImageTag: ImageTag = this.imageTagHash[imageTag.identifier];
    if (updatingImageTag) {
      updatingImageTag.update(context);
      return true;
    }
    return false;
  }

  delete(identifier: string): boolean {
    let deleteTag: ImageTag = this.imageTagHash[identifier];
    if (deleteTag) {
      delete this.imageTagHash[identifier];
      return true;
    }
    return false;
  }

  get(identifier: string): ImageTag {
    let imageTag: ImageTag = this.imageTagHash[identifier];
    if (imageTag) return imageTag;
    return null;
  }

  synchronize(peer?: string) {
    clearTimeout(this.lazyTimer);
    this.lazyTimer = null;
    EventSystem.call('SYNCHRONIZE_IMAGETAG', this.getCatalog(), peer);
  }

  lazySynchronize(ms: number, peer?: string) {
    clearTimeout(this.lazyTimer);
    this.lazyTimer = setTimeout(() => {
      this.synchronize(peer);
    }, ms);
  }

  getCatalog(): CatalogItem[] {
    let catalog: CatalogItem[] = [];
    for (let imageTag of this.tags) {
      catalog.push({ identifier: imageTag.identifier, imageTagContext: imageTag.toContext() });
    }
    return catalog;
  }
}
