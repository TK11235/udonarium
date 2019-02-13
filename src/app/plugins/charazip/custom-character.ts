import { SyncObject } from '@udonarium/core/synchronize-object/decorator';

import { DataElement } from '@udonarium/data-element';
import { GameCharacter } from '@udonarium/game-character';

@SyncObject('custom-character')
export class CustomCharacter extends GameCharacter {
  static createCustomCharacter(
    name: string,
    size: number,
    imageIdentifier: string
  ): CustomCharacter {
    const gameCharacter: CustomCharacter = new CustomCharacter();
    gameCharacter.createDataElements();
    gameCharacter.initialize();

    gameCharacter.commonDataElement.appendChild(
      DataElement.create('name', name, {}, `name_${gameCharacter.identifier}`)
    );
    gameCharacter.commonDataElement.appendChild(
      DataElement.create('size', size, {}, `size_${gameCharacter.identifier}`)
    );
    if (
      gameCharacter.imageDataElement.getFirstElementByName('imageIdentifier')
    ) {
      gameCharacter.imageDataElement.getFirstElementByName(
        'imageIdentifier'
      ).value = imageIdentifier;
      gameCharacter.imageDataElement
        .getFirstElementByName('imageIdentifier')
        .update();
    }

    return gameCharacter;
  }

  toXml(): string {
    return super.toXml().replace(/custom-character/g, 'character');
  }

  createDataElement(name: string, value: string | number): DataElement {
    return DataElement.create(name, value, {}, `${name}_${this.identifier}`);
  }

  createResourceElement(
    name: string,
    value: string | number,
    currentValue: string | number
  ): DataElement {
    return DataElement.create(
      name,
      value,
      { type: 'numberResource', currentValue: currentValue },
      `${name}_${this.identifier}`
    );
  }

  createNoteElement(name: string, value: string | number): DataElement {
    return DataElement.create(
      name,
      value,
      { type: 'note' },
      `${name}_${this.identifier}`
    );
  }
}
