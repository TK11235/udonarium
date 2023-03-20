import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy } from '@angular/core';

import { Card } from '@udonarium/card';
import { CardStack } from '@udonarium/card-stack';
import { EventSystem, Network } from '@udonarium/core/system';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';

import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';

import { PanelOption, PanelService } from 'service/panel.service';

@Component({
  selector: 'card-stack-list',
  templateUrl: './card-stack-list.component.html',
  styleUrls: ['./card-stack-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardStackListComponent implements OnChanges, OnDestroy {
  @Input() cardStack: CardStack = null;

  owner: string = Network.peer.userId;

  constructor(
    private panelService: PanelService,
    private changeDetector: ChangeDetectorRef,
  ) { }

  ngOnChanges() {
    Promise.resolve().then(() => this.panelService.title = this.cardStack.name + ' のカード一覧');
    EventSystem.unregister(this);
    EventSystem.register(this)
      .on(`UPDATE_GAME_OBJECT/identifier/${this.cardStack?.identifier}`, event => {
        this.changeDetector.markForCheck();
        if (this.cardStack.owner !== this.owner) {
          this.panelService.close();
        }
      })
      .on(`UPDATE_OBJECT_CHILDREN/identifier/${this.cardStack?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on('DELETE_GAME_OBJECT', event => {
        if (this.cardStack && this.cardStack.identifier === event.data.identifier) {
          this.panelService.close();
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
    if (this.cardStack.owner === this.owner) {
      this.cardStack.owner = '';
    }
  }

  drawCard(card: Card) {
    card.parent.removeChild(card);
    card.location.x = this.cardStack.location.x + 100 + (Math.random() * 50);
    card.location.y = this.cardStack.location.y + 25 + (Math.random() * 50);
    card.location.name = this.cardStack.location.name;
    card.rotate += this.cardStack.rotate;
    if (360 < card.rotate) card.rotate -= 360;
    card.toTopmost();
    SoundEffect.play(PresetSound.cardDraw);
  }

  up(card: Card) {
    let parent = card.parent;
    let index: number = parent.children.indexOf(card);
    if (0 < index) {
      let prev = parent.children[index - 1];
      parent.insertBefore(card, prev);
    }
  }

  down(card: Card) {
    let parent = card.parent;
    let index: number = parent.children.indexOf(card);
    if (index < parent.children.length - 1) {
      let next = parent.children[index + 1];
      parent.insertBefore(next, card);
    }
  }

  close(needShuffle: boolean = false) {
    if (needShuffle) {
      this.cardStack.shuffle();
      EventSystem.call('SHUFFLE_CARD_STACK', { identifier: this.cardStack.identifier });
      SoundEffect.play(PresetSound.cardShuffle);
    }
    this.panelService.close();
  }

  showDetail(gameObject: Card) {
    let coordinate = {
      x: this.panelService.left,
      y: this.panelService.top
    };
    let title = 'カード設定';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x + 10, top: coordinate.y + 20, width: 600, height: 600 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }

  trackByCard(index: number, card: Card) {
    return card.identifier;
  }
}
