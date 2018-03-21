import { EventSystem } from '../system/system';
import { ImageFile, ImageContext, ImageState } from './image-file';
import { FileSharingSystem } from './file-sharing-system';

export type Catalog = { identifier: string, state: number }[];

export class FileStorage {
  private static _instance: FileStorage
  static get instance(): FileStorage {
    if (!FileStorage._instance) FileStorage._instance = new FileStorage();
    return FileStorage._instance;
  }

  private imageHash: { [identifier: string]: ImageFile } = {};

  get images(): ImageFile[] {
    let images: ImageFile[] = [];
    for (let identifier in this.imageHash) {
      images.push(this.imageHash[identifier]);
    }
    return images;
  }

  private lazyTimer: NodeJS.Timer;

  private constructor() {
    console.log('FileStorage ready...');
    window.addEventListener('beforeunload', event => {
      this.destroy();
    });
  }

  private destroy() {
    for (let identifier in this.imageHash) {
      this.delete(identifier);
    }
  }

  async addAsync(file: File): Promise<ImageFile>
  async addAsync(blob: Blob): Promise<ImageFile>
  async addAsync(arg: any): Promise<ImageFile> {
    let image: ImageFile = await ImageFile.createAsync(arg);

    return this._add(image);
  }

  add(url: string): ImageFile
  add(image: ImageFile): ImageFile
  add(context: ImageContext): ImageFile
  add(arg: any): ImageFile {
    let image: ImageFile
    if (typeof arg === 'string') {
      image = ImageFile.create(arg);
    } else if (arg instanceof ImageFile) {
      image = arg;
    } else {
      if (this.update(arg)) return this.imageHash[arg.identifier];
      image = ImageFile.create(arg);
    }
    return this._add(image);
  }

  private _add(image: ImageFile): ImageFile {
    this.lazySynchronize(100);
    if (this.update(image)) return this.imageHash[image.identifier];
    this.imageHash[image.identifier] = image;
    console.log('addNewFile()', image);
    return image;
  }

  private update(image: ImageFile): boolean
  private update(image: ImageContext): boolean
  private update(image: any): boolean {
    let context: ImageContext;
    if (image instanceof ImageFile) {
      context = image.toContext();
    } else {
      context = image;
    }
    let updatingImage: ImageFile = this.imageHash[image.identifier];
    if (updatingImage) {
      updatingImage.apply(image);
      return true;
    }
    return false;
  }

  delete(identifier: string): boolean {
    let deleteImage: ImageFile = this.imageHash[identifier];
    if (deleteImage) {
      deleteImage.destroy();
      delete this.imageHash[identifier];
      return true;
    }
    return false;
  }

  get(identifier: string): ImageFile {
    let image: ImageFile = this.imageHash[identifier];
    if (image) return image;
    return null;
  }

  synchronize(peer?: string) {
    clearTimeout(this.lazyTimer);
    this.lazyTimer = null;
    EventSystem.call('SYNCHRONIZE_FILE_LIST', this.getCatalog(), peer);
  }

  lazySynchronize(ms: number, peer?: string) {
    clearTimeout(this.lazyTimer);
    this.lazyTimer = setTimeout(() => {
      this.synchronize(peer);
    }, ms);
  }

  getCatalog(): Catalog {
    let catalog: Catalog = [];
    for (let image of FileStorage.instance.images) {
      if (ImageState.COMPLETE <= image.state) {
        catalog.push({ identifier: image.identifier, state: image.state });
      }
    }
    return catalog;
  }
}
