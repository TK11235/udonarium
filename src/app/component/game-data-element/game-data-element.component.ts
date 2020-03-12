import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { EventSystem, Network } from '@udonarium/core/system';
import { DataElement } from '@udonarium/data-element';
import { ChatMessageService } from 'service/chat-message.service';
import { PeerCursor } from '@udonarium/peer-cursor';
import { ChatTab } from '@udonarium/chat-tab';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { GameCharacter } from '@udonarium/game-character';
@Component({
  selector: 'game-data-element, [game-data-element]',
  templateUrl: './game-data-element.component.html',
  styleUrls: ['./game-data-element.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class GameDataElementComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() gameDataElement: DataElement = null;
  @Input() isEdit: boolean = false;
  @Input() isTagLocked: boolean = false;
  @Input() isValueLocked: boolean = false;

  private _sendTo: string;
  get sendTo(): string { return this._sendTo };
  private _name: string = '';
  get name(): string { return this._name; }
  @Input() character: GameCharacter = null;
  set name(name: string) { this._name = name; this.setUpdateTimer(); }
  get myPeer(): PeerCursor { return PeerCursor.myCursor; }
  private _value: number | string = 0;
  get value(): number | string { return this._value; }
  set value(value: number | string) { this._value = value; this.setUpdateTimer(); }
  get chatTabs(): ChatTab[] {
    return ObjectStore.instance.getObjects(ChatTab);
  }
  get infoTab(): ChatTab {
    return this.chatTabs.find(chatTab => chatTab.receiveInfo);
  }

  private _currentValue: number | string = 0;
  get currentValue(): number | string { return this._currentValue; }
  set currentValue(currentValue: number | string) { this._currentValue = currentValue; this.setUpdateTimer(); }
  private _chatTabidentifier: string = '';
  get chatTab(): ChatTab { return ObjectStore.instance.get<ChatTab>(this.chatTabidentifier); }
  get chatTabidentifier(): string { return this._chatTabidentifier; }
  private updateTimer: NodeJS.Timer = null;
  private _color: string = "#000000";
  get color(): string { return this._color };
  set color(color: string) {
    this._color = color;
    console.log('this.character', this.character)
    if (this.character.chatPalette) this.character.chatPalette.color = color;
  };
  constructor(
    public chatMessageService: ChatMessageService,
    private changeDetector: ChangeDetectorRef
  ) { }


  ngOnInit() {
    if (this.gameDataElement) this.setValues(this.gameDataElement);

    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', -1000, event => {
        if (this.gameDataElement && event.data.identifier === this.gameDataElement.identifier) {
          this.setValues(this.gameDataElement);
          this.changeDetector.markForCheck();
        }
      })
      .on('DELETE_GAME_OBJECT', -1000, event => {
        if (this.gameDataElement && this.gameDataElement.identifier === event.data.identifier) {
          this.changeDetector.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  ngAfterViewInit() {

  }
  sendLogMessage(text, value) {
    this.chatMessageService.sendMessage(this.infoTab, value + " " + text, this.chatMessageService.gameType, this.myPeer.name, this.sendTo, this._color);
  }

  addElement() {
    this.gameDataElement.appendChild(DataElement.create('タグ', '', {}));
  }

  deleteElement() {
    this.gameDataElement.destroy();
  }

  upElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (0 < index) {
      let prevElement = parentElement.children[index - 1];
      parentElement.insertBefore(this.gameDataElement, prevElement);
    }
  }

  downElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (index < parentElement.children.length - 1) {
      let nextElement = parentElement.children[index + 1];
      parentElement.insertBefore(nextElement, this.gameDataElement);
    }
  }

  setElementType(type: string) {
    this.gameDataElement.setAttribute('type', type);
  }

  private setValues(object: DataElement) {
    this._name = object.name;
    this._currentValue = object.currentValue;
    this._value = object.value;
  }

  private setUpdateTimer() {
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      if (this.gameDataElement.name !== this.name) this.gameDataElement.name = this.name;
      if (this.gameDataElement.currentValue !== this.currentValue) this.gameDataElement.currentValue = this.currentValue;
      if (this.gameDataElement.value !== this.value) this.gameDataElement.value = this.value;
      this.updateTimer = null;
    }, 66);
  }
}
