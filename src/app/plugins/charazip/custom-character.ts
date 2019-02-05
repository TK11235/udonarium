import { GameCharacter } from '@udonarium/game-character';
import { SyncObject } from '@udonarium/core/synchronize-object/decorator';

@SyncObject('custom-character')
export class CustomCharacter extends GameCharacter {
  toXml(): string {
    return super.toXml().replace(/custom-character/g, 'character');
  }

  static createCustomCharacter(): CustomCharacter {
    const gameCharacter: CustomCharacter = new CustomCharacter();
    gameCharacter.createDataElements();
    gameCharacter.initialize();
    return gameCharacter;
  }
}
