game-character

game-table-mask
terrain
text-note


src\app\component\game-character\game-character.component.css

.is-Yellow-border {
  border: solid 6px #FFCC80;
  color:#FFCC80;
  background-color:#FFCC80;
}

.is-opacity {
  opacity: 0.6;
}

.is-disabled {
  display: none;
}

src\app\component\game-character\game-character.component.ts
get GM(): string { return this.gameCharacter.GM; }
  set GM(GM: string) { this.gameCharacter.GM = GM; }
  get isMine(): boolean { return this.gameCharacter.isMine; }
  get hasGM(): boolean { return this.gameCharacter.hasGM; }
  get GMName(): string { return this.gameCharacter.GMName; }
  get isDisabled(): boolean { return this.gameCharacter.isDisabled; }
  
  .on('DISCONNECT_PEER', event => {
        //GM
        if (this.gameCharacter.GM === event.data.peer) this.changeDetector.markForCheck();
      });
	  
	  
	  
	  let actions: ContextMenuAction[] = [];
	  

	
	
	  
	  
	   if (!this.isMine) {
      actions.push({
        name: 'GM圖層-只供自己看見', action: () => {
          this.GM = Network.peerId;
          SoundEffect.play(PresetSound.lock);
        }
      });

    } else {
      actions.push({
        name: '回到普通圖層', action: () => {
          this.GM = '';
          SoundEffect.play(PresetSound.lock);
        }
      });
    }
	
	
	if (this.gameCharacter === object || (object instanceof ObjectNode && this.gameCharacter.contains(object)) || (object instanceof PeerCursor && object.peerId === this.gameCharacter.GM)) {
          this.changeDetector.markForCheck();
        }


src\app\component\game-character\game-character.component.html

[ngClass]="{'is-opacity': isMine,'is-Yellow-border': isMine,'is-disabled': isDisabled}"

src\app\class\game-character.ts

import { PeerCursor } from '@udonarium/peer-cursor';
import {  Network } from '@udonarium/core/system';

 @SyncVar() GM: string = '';

    get GMName(): string {
    let object = PeerCursor.find(this.GM);
    return object ? object.name : '';
  }
  get hasGM(): boolean { return PeerCursor.find(this.GM) != null; }
  get isMine(): boolean { return Network.peerId === this.GM; }
  get isDisabled(): boolean { return this.hasGM && !this.isMine; }