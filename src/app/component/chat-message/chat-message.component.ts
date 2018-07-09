import { ObjectStore } from '../../class/core/synchronize-object/object-store';
import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

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
  changeDetection: ChangeDetectionStrategy.Default
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
    this.chatMessage.tag = this.chatMessage.tag.replace('secret', '');
  }
}
