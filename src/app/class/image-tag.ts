import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';

@SyncObject('image-tag')
export class ImageTag extends ObjectNode {
    @SyncVar() imageIdentifier: string = '';
    @SyncVar() isSave: boolean = false;

    get tag():string {return <string>this.value; }

    set tag(tag:string) { this.value = tag; }

    isContainsWord(word: string) :boolean {
        if(this.tag.indexOf(word) == -1) { return false; }
        else {return true; }
    }

    
}