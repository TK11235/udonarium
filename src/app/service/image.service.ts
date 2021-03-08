import { Injectable } from '@angular/core';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';

const skeletonImage: ImageFile = ImageFile.create('./assets/images/skeleton.png');

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor() { }

  getSkeletonOr(image: ImageFile): ImageFile
  getSkeletonOr(imageIdentifier: string): ImageFile
  getSkeletonOr(arg: any): ImageFile {
    let image: ImageFile = arg instanceof ImageFile ? arg : ImageStorage.instance.get(arg);
    return image && !image.isEmpty ? image : skeletonImage;
  }

  getEmptyOr(image: ImageFile): ImageFile
  getEmptyOr(imageIdentifier: string): ImageFile
  getEmptyOr(arg: any): ImageFile {
    let image: ImageFile = arg instanceof ImageFile ? arg : ImageStorage.instance.get(arg);
    return image && !image.isEmpty ? image : ImageFile.Empty;
  }
}
