import { EventSystem } from '../system';
import { ImageContext, ImageFile, ImageState } from './image-file';

export type CatalogItem = { readonly identifier: string, readonly state: number };

export class ImageStorage {
  private static _instance: ImageStorage
  static get instance(): ImageStorage {
    if (!ImageStorage._instance) ImageStorage._instance = new ImageStorage();
    return ImageStorage._instance;
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
    console.log('ImageStorage ready...');
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
    let image: ImageFile;
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
    if (ImageState.COMPLETE <= image.state) this.lazySynchronize(100);
    if (this.update(image)) return this.imageHash[image.identifier];
    this.imageHash[image.identifier] = image;
    console.log('add Image: ' + image.identifier);
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
    if (this.lazyTimer) clearTimeout(this.lazyTimer);
    this.lazyTimer = null;
    EventSystem.call('SYNCHRONIZE_FILE_LIST', this.getCatalog(), peer);
  }

  lazySynchronize(ms: number, peer?: string) {
    if (this.lazyTimer) clearTimeout(this.lazyTimer);
    this.lazyTimer = setTimeout(() => {
      this.lazyTimer = null;
      this.synchronize(peer);
    }, ms);
  }

  getCatalog(): CatalogItem[] {
    let catalog: CatalogItem[] = [];
    for (let image of this.images) {
      if (ImageState.COMPLETE <= image.state) {
        catalog.push({ identifier: image.identifier, state: image.state });
      }
    }
    return catalog;
  }
}
