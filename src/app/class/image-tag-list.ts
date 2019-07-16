import { ImageTag } from './image-tag';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { InnerXml } from './core/synchronize-object/object-serializer';

@SyncObject('ImageTagList')
export class ImageTagList extends ObjectNode implements InnerXml {
    // todo:シングルトン化するのは妥当？
    private static _instance: ImageTagList;
    static get instance(): ImageTagList {
        if (!ImageTagList._instance) {
        ImageTagList._instance = new ImageTagList('ImageTagList');
        ImageTagList._instance.initialize();
        }
        return ImageTagList._instance;
    }
    
    get imageTags(): ImageTag[] {return <ImageTag[]> this.children; }

    getMatchTags(searchWord: string) :ImageTag[] {
        let resultTags: ImageTag[] = [];

        for(let target of this.imageTags) {
            if(target.isContainsWord(searchWord)) {
                resultTags.push(target);
            }
        }

        return resultTags;
    }

    innerXml(): string { return ''; }

    parseInnerXml(element: Element) {
      // XMLからの新規作成を許可せず、既存のオブジェクトを更新する
      let context = ImageTagList.instance.toContext();
      context.syncData = this.toContext().syncData;
      ImageTagList.instance.apply(context);
      ImageTagList.instance.update();
  
      this.destroy();
    }
}