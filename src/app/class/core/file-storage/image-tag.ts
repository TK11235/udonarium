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

  static async createAsync(identifier: string, tag: string): Promise<ImageTag> {
    let imageTag = new ImageTag();
    imageTag.context.identifier = identifier;
    imageTag.context.tag = tag;
    imageTag.context.majorVersion = 1;
    imageTag.context.minorVersion = Math.random();
    return imageTag;
  }

  apply(context: ImageTagContext) {
    if (context) {
      if(!this.context.identifier && context.identifier) this.context.identifier = context.identifier; 
      this.context.tag = context.tag;
      this.context.majorVersion = context.majorVersion;
      this.context.minorVersion = context.minorVersion;
    }
  }

  update(context: ImageTagContext) {
    if (context) {
      if(!this.context.identifier && context.identifier) this.context.identifier = context.identifier; 
      this.context.tag = context.tag;
      this.context.majorVersion += context.majorVersion;
      this.context.minorVersion = Math.random();
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