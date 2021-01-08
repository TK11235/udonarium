import { Injectable } from '@angular/core';
import { ImageFile } from '@udonarium/core/file-storage/image-file';

const skeletonImage: ImageFile = ImageFile.create('./assets/images/skeleton.png');

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor() { }

  getSkeletonOr(image: ImageFile): ImageFile {
    return image && !image.isEmpty ? image : skeletonImage;
  }
}
