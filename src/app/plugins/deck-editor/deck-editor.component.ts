import {
  Component,
  OnInit,
  ViewContainerRef,
  ViewChild,
  NgZone,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CardStack } from '@udonarium/card-stack';
import { Card } from '@udonarium/card';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { SaveDataService } from 'service/save-data.service';
import { ModalService } from 'service/modal.service';
import { FileArchiver } from '@udonarium/core/file-storage/file-archiver';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { EventSystem } from '@udonarium/core/system';
import { ObjectFactory } from '@udonarium/core/synchronize-object/object-factory';
import { ObjectSerializer } from '@udonarium/core/synchronize-object/object-serializer';
import { TabletopService } from 'service/tabletop.service';
import { ContextMenuService } from 'service/context-menu.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { FileSelecterComponent } from 'component/file-selecter/file-selecter.component';

@Component({
  selector: 'app-deck-editor',
  templateUrl: './deck-editor.component.html',
  styleUrls: ['./deck-editor.component.css'],
})
export class DeckEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modalLayer', { read: ViewContainerRef, static: true })
  modalLayerViewContainerRef: ViewContainerRef;
  private immediateUpdateTimer: NodeJS.Timer = null;
  private lazyUpdateTimer: NodeJS.Timer = null;

  selectedStack: CardStack = null;
  selectedStackXml: string = '';
  get stackName(): string {
    return this.selectedStack.name;
  }
  set stackName(name: string) {
    if (this.isEditable) {
      const element = this.selectedStack.getElement(
        'name',
        this.selectedStack.commonDataElement
      );
      element.value = name;
    }
  }

  get cardStacks(): CardStack[] {
    return ObjectStore.instance.getObjects(CardStack);
  }
  get isEmpty(): boolean {
    return this.cardStacks.length < 1;
  }
  get isDeleted(): boolean {
    return this.selectedStack
      ? ObjectStore.instance.get(this.selectedStack.identifier) == null
      : false;
  }
  get isEditable(): boolean {
    return !this.isEmpty && !this.isDeleted;
  }

  constructor(
    private saveDataService: SaveDataService,
    private modalService: ModalService,
    private pointerDeviceService: PointerDeviceService,
    private tabletopService: TabletopService,
    private ngZone: NgZone
  ) {
    this.ngZone.runOutsideAngular(() => {
      FileArchiver.instance.initialize();
      ImageStorage.instance;
      ObjectFactory.instance;
      ObjectSerializer.instance;
      ObjectStore.instance;
    });
    this.pointerDeviceService.initialize();
    this.tabletopService.makeDefaultTable();
    this.createBlankDeck();
    EventSystem.register(this).on<File>('FILE_LOADED', (event) => {
      this.lazyNgZoneUpdate(false);
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    ModalService.defaultParentViewContainerRef = ContextMenuService.defaultParentViewContainerRef = this.modalLayerViewContainerRef;
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  onChangeSelectStack(identifier: string): void {
    this.selectedStack = ObjectStore.instance.get<CardStack>(identifier);
    this.selectedStackXml = '';
  }

  createTrump(): void {
    this.selectedStack = this.tabletopService.createTrump({ x: 0, y: 0, z: 0 });
    this.selectedStackXml = '';
  }

  createBlankDeck(): void {
    this.selectedStack = CardStack.create('空の山札');
    this.selectedStackXml = '';
  }

  addCard(): void {
    const card = DeckEditorComponent.createCard();
    this.selectedStack.putOnTop(card);
  }

  faceUpAll(): void {
    this.selectedStack.faceUpAll();
  }

  faceDownAll(): void {
    this.selectedStack.faceDownAll();
  }

  async save(): Promise<void> {
    if (!this.selectedStack) {
      return;
    }

    const element = this.selectedStack.getElement(
      'name',
      this.selectedStack.commonDataElement
    );
    const objectName: string = element ? (element.value as string) : '';

    await this.saveDataService.saveGameObjectAsync(
      this.selectedStack,
      'xml_' + objectName,
      () => {}
    );
  }

  delete(): void {
    if (!this.isEmpty && this.selectedStack) {
      this.selectedStackXml = this.selectedStack.toXml();
      this.selectedStack.destroy();
    }
  }

  restore(): void {
    if (this.selectedStack && this.selectedStackXml) {
      this.selectedStack = ObjectSerializer.instance.parseXml(
        this.selectedStackXml
      ) as CardStack;
      this.selectedStackXml = '';
    }
  }

  trackByCard(index: number, card: Card) {
    return card.identifier;
  }

  openModal(name: string = '', isAllowedEmpty: boolean = false): void {
    this.modalService
      .open<string>(FileSelecterComponent, { isAllowedEmpty })
      .then((value) => {
        if (!confirm('すべての裏面の画像を変更しますがよろしいでしょうか？'))
          return;
        if (!this.selectedStack || !this.isEditable || !value) return;
        for (const card of this.selectedStack.cards) {
          const element = card.imageDataElement.getFirstElementByName(name);
          if (!element) continue;
          element.value = value;
        }
      });
  }

  /**
   * @see TabletopService#createTrump from 'service/tabletop.service';
   */
  private static createCard(): Card {
    const back = './assets/images/trump/z02.gif';
    if (!ImageStorage.instance.get(back)) {
      ImageStorage.instance.add(back);
    }
    const url: string = './assets/images/trump/x01.gif';
    if (!ImageStorage.instance.get(url)) {
      ImageStorage.instance.add(url);
    }
    return Card.create('カード', url, back);
  }

  private lazyNgZoneUpdate(isImmediate: boolean) {
    if (isImmediate) {
      if (this.immediateUpdateTimer !== null) return;
      this.immediateUpdateTimer = setTimeout(() => {
        this.immediateUpdateTimer = null;
        if (this.lazyUpdateTimer != null) {
          clearTimeout(this.lazyUpdateTimer);
          this.lazyUpdateTimer = null;
        }
        this.ngZone.run(() => {});
      }, 0);
    } else {
      if (this.lazyUpdateTimer !== null) return;
      this.lazyUpdateTimer = setTimeout(() => {
        this.lazyUpdateTimer = null;
        if (this.immediateUpdateTimer != null) {
          clearTimeout(this.immediateUpdateTimer);
          this.immediateUpdateTimer = null;
        }
        this.ngZone.run(() => {});
      }, 100);
    }
  }
}
