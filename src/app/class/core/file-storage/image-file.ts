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
        resize(canvas, dstWidth, dstHeight, true);

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

/**
 * https://github.com/viliusle/Hermite-resize
 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
 * 
 * @param {HtmlElement} canvas
 * @param {int} width
 * @param {int} height
 * @param {boolean} resize_canvas if true, canvas will be resized. Optional.
 */
function resize(canvas: HTMLCanvasElement, width: number, height: number, resize_canvas?: boolean) {
  var width_source = canvas.width;
  var height_source = canvas.height;
  width = Math.round(width);
  height = Math.round(height);

  var ratio_w = width_source / width;
  var ratio_h = height_source / height;
  var ratio_w_half = Math.ceil(ratio_w / 2);
  var ratio_h_half = Math.ceil(ratio_h / 2);

  var ctx = canvas.getContext("2d");
  var img = ctx.getImageData(0, 0, width_source, height_source);
  var img2 = ctx.createImageData(width, height);
  var data = img.data;
  var data2 = img2.data;

  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      var x2 = (i + j * width) * 4;
      var weight = 0;
      var weights = 0;
      var weights_alpha = 0;
      var gx_r = 0;
      var gx_g = 0;
      var gx_b = 0;
      var gx_a = 0;
      var center_y = (j + 0.5) * ratio_h;
      var yy_start = Math.floor(j * ratio_h);
      var yy_stop = Math.ceil((j + 1) * ratio_h);
      for (var yy = yy_start; yy < yy_stop; yy++) {
        var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
        var center_x = (i + 0.5) * ratio_w;
        var w0 = dy * dy; //pre-calc part of w
        var xx_start = Math.floor(i * ratio_w);
        var xx_stop = Math.ceil((i + 1) * ratio_w);
        for (var xx = xx_start; xx < xx_stop; xx++) {
          var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
          var w = Math.sqrt(w0 + dx * dx);
          if (w >= 1) {
            //pixel too far
            continue;
          }
          //hermite filter
          weight = 2 * w * w * w - 3 * w * w + 1;
          var pos_x = 4 * (xx + yy * width_source);
          //alpha
          gx_a += weight * data[pos_x + 3];
          weights_alpha += weight;
          //colors
          if (data[pos_x + 3] < 255)
            weight = weight * data[pos_x + 3] / 250;
          gx_r += weight * data[pos_x];
          gx_g += weight * data[pos_x + 1];
          gx_b += weight * data[pos_x + 2];
          weights += weight;
        }
      }
      data2[x2] = gx_r / weights;
      data2[x2 + 1] = gx_g / weights;
      data2[x2 + 2] = gx_b / weights;
      data2[x2 + 3] = gx_a / weights_alpha;
    }
  }
  //clear and resize canvas
  if (resize_canvas === true) {
    canvas.width = width;
    canvas.height = height;
  } else {
    ctx.clearRect(0, 0, width_source, height_source);
  }

  //draw
  ctx.putImageData(img2, 0, 0);
};