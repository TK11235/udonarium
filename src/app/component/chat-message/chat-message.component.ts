import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { FileStorage } from '../../class/core/file-storage/file-storage';
import { ImageFile } from '../../class/core/file-storage/image-file';
import { ChatMessage, ChatMessageContext } from '../../class/chat-message';

@Component({
  selector: 'chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css'],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateX(0)', opacity: '1.0' })),
      transition('void => *', [
        style({ transform: 'translateX(100px)', opacity: '0.0' }),
        animate('200ms ease')
      ]),
      transition('* => void', [
        animate(100, style({ transform: 'translateX(100%)' }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChatMessageComponent implements OnInit, AfterViewInit {
  @Input() chatMessage: ChatMessage;
  @Output() onInit: EventEmitter<null> = new EventEmitter();
  imageFile: ImageFile = ImageFile.Empty;

  ngOnInit() {
    let file: ImageFile = this.chatMessage.image;
    if (file) this.imageFile = file;
  }

  ngAfterViewInit() {
    this.onInit.emit();
  }

  discloseMessage() {
    let originalMessage: ChatMessage = ObjectStore.instance.get<ChatMessage>(this.chatMessage.responseIdentifier);
    this.chatMessage.tag = this.chatMessage.tag.replace('secret', '');
    this.chatMessage.to = originalMessage.to;
    this.chatMessage.name = '<Secret-BCDice：' + originalMessage.name + '>'
    if (0 < originalMessage.to.length && this.chatMessage.to.indexOf(originalMessage.from) < 0) {
      this.chatMessage.responseIdentifier = null;
      this.chatMessage.to += ' ' + originalMessage.from;
    }
  }
}
