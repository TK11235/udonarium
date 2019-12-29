enum ImageState {
  EMPTY = 0,
  USER_CREATE = 1,
  FILE_LOAD = 2,
}

export interface ImageTagContext {
  identifier: string;
  tag: string;
  majorVersion: number;
  minorVersion: number;
}

export class ImageTag {
  private context: ImageTagContext = {
    identifier: '',
    tag: '',
    majorVersion: 0,
    minorVersion: 0,
  }

  get identifier() { return this.context.identifier; }
  get tag() { return this.context.tag; }
  get version() { return this.context.majorVersion + this.context.minorVersion; }

  private constructor() {}

  static createEmpty(identifier: string): ImageTag {
    let imageTag = new ImageTag();
    imageTag.context.identifier = identifier;
    return imageTag;
  }

  static async loadAsync(identifier: string, tag: string): Promise<ImageTag> {
    let imageTag = new ImageTag();
    imageTag.context.identifier = identifier;
    imageTag.context.tag = tag;
    imageTag.context.majorVersion = ImageState.FILE_LOAD;
    imageTag.context.minorVersion = 0;
    return imageTag;
  }

  static async createAsync(identifier: string, tag: string): Promise<ImageTag> {
    let imageTag = new ImageTag();
    imageTag.context.identifier = identifier;
    imageTag.context.tag = tag;
    imageTag.context.majorVersion = ImageState.USER_CREATE;
    imageTag.context.minorVersion = 0;
    return imageTag;
  }

  apply(context: ImageTagContext) {
    let version = context.majorVersion + context.minorVersion;
    if (context && this.version < version) {
      if(!this.context.identifier && context.identifier) this.context.identifier = context.identifier; 
      this.context.tag = context.tag;
      this.context.majorVersion = context.majorVersion;
      this.context.minorVersion = context.minorVersion;
    }
  }

  toContext(): ImageTagContext {
    return {
      identifier: this.context.identifier,
      tag: this.context.tag,
      majorVersion: this.context.majorVersion,
      minorVersion: this.context.minorVersion,
    }
  }
}