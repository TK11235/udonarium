import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

import { ChatMessage } from '@udonarium/chat-message';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ChatMessageService } from 'service/chat-message.service';

@Component({
  selector: 'chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css'],
  animations: [
    trigger('flyInOut', [
      transition('* => active', [
        animate('200ms ease-out', keyframes([
          style({ transform: 'translateX(100px)', offset: 0 }),
          style({ transform: 'translateX(0)', offset: 1.0 })
        ]))
      ]),
      transition('void => *', [
        animate('100ms ease-out', keyframes([
          style({ opacity: '0', offset: 0 }),
          style({ opacity: '1', offset: 1.0 })
        ]))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.Default
})

export class ChatMessageComponent implements OnInit, AfterViewInit {
  @Input() chatMessage: ChatMessage;
  imageFile: ImageFile = ImageFile.Empty;
  animeState: string = 'inactive';

  constructor(
    private chatMessageService: ChatMessageService
  ) { }

  ngOnInit() {
    let file: ImageFile = this.chatMessage.image;
    if (file) this.imageFile = file;
    let time = this.chatMessageService.getTime();
    if (time - 10 * 1000 < this.chatMessage.timestamp) this.animeState = 'active';
  }

  ngAfterViewInit() {
  }

  discloseMessage() {
    this.chatMessage.tag = this.chatMessage.tag.replace('secret', '');
  }
}
