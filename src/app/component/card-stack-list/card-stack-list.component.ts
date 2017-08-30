import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Input, ViewChild, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { ModalService } from '../../service/modal.service';
import { PanelService, PanelOption } from '../../service/panel.service';
import { PointerDeviceService } from '../../service/pointer-device.service';

import { CardStack } from '../../class/card-stack';
import { Card, CardState } from '../../class/card';
import { Network, EventSystem } from '../../class/core/system/system';
import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { ImageFile } from '../../class/core/file-storage/image-file';

@Component({
  selector: 'card-stack-list',
  templateUrl: './card-stack-list.component.html',
  styleUrls: ['./card-stack-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardStackListComponent implements OnInit {
  @Input() cardStack: CardStack = null;

  owner: string = Network.peerId;

  constructor(
    private ngZone: NgZone,
    //private gameRoomService: GameRoomService,
    //private contextMenuService: ContextMenuService,
    //private modalService: ModalService,
    private panelService: PanelService,
    private elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private pointerDeviceService: PointerDeviceService
  ) { }

  ngOnInit() {
    this.panelService.title = this.cardStack.name + ' のカード一覧';
    //this.cardStack = this.modalService.option instanceof CardStack ? this.modalService.option : this.cardStack;
    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (event.data.aliasName === Card.aliasName) this.changeDetector.markForCheck();
        if (event.data.identifier !== this.cardStack.identifier) {
          return;
        } else {
          if (this.cardStack.owner !== this.owner) this.panelService.close();
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
    card.moveToTop();
    card.update();
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
      EventSystem.call('SHUFFLE_CARD_STACK', { identifier: this.cardStack.identifier });
      //this.cardStack.shuffle();
    }
    this.panelService.close();
  }
}