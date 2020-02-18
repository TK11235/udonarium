import { CanvasUtil } from './canvas-util';
import { FileReaderUtil } from './file-reader-util';

export enum ImageState {
  NULL = 0,
  THUMBNAIL = 1,
  COMPLETE = 2,
  URL = 1000,
}

export interface ImageContext {
  identifier: string;
  name: string;
  type: string;
  blob: Blob;
  url: string;
  thumbnail: ThumbnailContext;
}

export interface ThumbnailContext {
  type: string;
  blob: Blob;
  url: string;
}

export class ImageFile {
  private context: ImageContext = {
    identifier: '',
    name: '',
    blob: null,
    type: '',
    url: '',
    thumbnail: {
      blob: null,
      type: '',
      url: '',
    }
  };

  get identifier(): string { return this.context.identifier };
  get name(): string { return this.context.name };
  get blob(): Blob { return this.context.blob ? this.context.blob : this.context.thumbnail.blob; };
  get url(): string { return this.context.url ? this.context.url : this.context.thumbnail.url; };
  get thumbnail(): ThumbnailContext { return this.context.thumbnail };

  get state(): ImageState {
    if (!this.url && !this.blob) return ImageState.NULL;
    if (this.url && !this.blob) return ImageState.URL;
    if (this.blob === this.thumbnail.blob) return ImageState.THUMBNAIL;
    return ImageState.COMPLETE;
  }

  private constructor() { }

  static createEmpty(identifier: string): ImageFile {
    let imageFile = new ImageFile();
    imageFile.context.identifier = identifier;

    return imageFile;
  }

  static create(url: string): ImageFile
  static create(context: ImageContext): ImageFile
  static create(arg: any): ImageFile {
    if (typeof arg === 'string') {
      let imageFile = new ImageFile();
      imageFile.context.identifier = arg;
      imageFile.context.name = arg;
      imageFile.context.url = arg;
      return imageFile;
    } else {
      let imageFile = new ImageFile();
      imageFile.apply(arg);
      return imageFile;
    }
  }

  static async createAsync(file: File): Promise<ImageFile>
  static async createAsync(blob: Blob): Promise<ImageFile>
  static async createAsync(arg: any): Promise<ImageFile> {
    if (arg instanceof File) {
      return await ImageFile._createAsync(arg, arg.name);
    } else if (arg instanceof Blob) {
      return await ImageFile._createAsync(arg);
    }
  }

  private static async _createAsync(blob: Blob, name?: string): Promise<ImageFile> {
    let arrayBuffer = await FileReaderUtil.readAsArrayBufferAsync(blob);

    let imageFile = new ImageFile();
    imageFile.context.identifier = await FileReaderUtil.calcSHA256Async(arrayBuffer);
    imageFile.context.name = name;
    imageFile.context.blob = new Blob([arrayBuffer], { type: blob.type });
    imageFile.context.url = window.URL.createObjectURL(imageFile.context.blob);

    try {
      imageFile.context.thumbnail = await ImageFile.createThumbnailAsync(imageFile.context);
    } catch (e) {
      throw e;
    }

    if (imageFile.context.name != null) imageFile.context.name = imageFile.context.identifier;

    return imageFile;
  }

  destroy() {
    this.revokeURLs();
  }

  apply(context: ImageContext) {
    if (!this.context.identifier && context.identifier) this.context.identifier = context.identifier;
    if (!this.context.name && context.name) this.context.name = context.name;
    if (!this.context.blob && context.blob) this.context.blob = context.blob;
    if (!this.context.type && context.type) this.context.type = context.type;
    if (!this.context.url && context.url) {
      if (this.state !== ImageState.URL) window.URL.revokeObjectURL(this.context.url);
      this.context.url = context.url;
    }
    if (!this.context.thumbnail.blob && context.thumbnail.blob) this.context.thumbnail.blob = context.thumbnail.blob;
    if (!this.context.thumbnail.type && context.thumbnail.type) this.context.thumbnail.type = context.thumbnail.type;
    if (!this.context.thumbnail.url && context.thumbnail.url) {
      if (this.state !== ImageState.URL) window.URL.revokeObjectURL(this.context.thumbnail.url);
      this.context.thumbnail.url = context.thumbnail.url;
    }
    this.createURLs();
  }

  toContext(): ImageContext {
    return {
      identifier: this.context.identifier,
      name: this.context.name,
      blob: this.context.blob,
      type: this.context.type,
      url: this.context.url,
      thumbnail: {
        blob: this.context.thumbnail.blob,
        type: this.context.thumbnail.type,
        url: this.context.thumbnail.url,
      }
    }
  }

  private createURLs() {
    if (this.state === ImageState.URL) return;
    if (this.context.blob && this.context.url === '') this.context.url = window.URL.createObjectURL(this.context.blob);
    if (this.context.thumbnail.blob && this.context.thumbnail.url === '') this.context.thumbnail.url = window.URL.createObjectURL(this.context.thumbnail.blob);
  }

  private revokeURLs() {
    if (this.state === ImageState.URL) return;
    window.URL.revokeObjectURL(this.context.url);
    window.URL.revokeObjectURL(this.context.thumbnail.url);
  }

  private static createThumbnailAsync(context: ImageContext): Promise<ThumbnailContext> {
    return new Promise((resolve, reject) => {
      let canvas: HTMLCanvasElement = document.createElement('canvas');
      let render: CanvasRenderingContext2D = canvas.getContext('2d');
      let image: HTMLImageElement = new Image();
      image.onload = (event) => {
        let scale: number = 128 / (image.width < image.height ? image.height : image.width);
        scale = scale < 1 ? scale : 1.0;
        var dstWidth = image.width * scale;
        var dstHeight = image.height * scale;
        canvas.width = image.width;//dstWidth;
        canvas.height = image.height;//dstHeight;
        //render.drawImage(image, 0, 0, image.width, image.height, 0, 0, dstWidth, dstHeight);

        render.drawImage(image, 0, 0);
        CanvasUtil.resize(canvas, dstWidth, dstHeight, true);

        canvas.toBlob(blob => {
          let thumbnail: ThumbnailContext = {
            type: blob.type,
            blob: blob,
            url: window.URL.createObjectURL(blob),
          };
          resolve(thumbnail);
        }, context.blob.type);
      };
      image.onabort = image.onerror = () => {
        reject();
      }
      image.src = context.url;
    });
  }

  static Empty: ImageFile = ImageFile.createEmpty('null');
}
