import { TestBed, inject } from '@angular/core/testing';

import { ChatMessageService } from './chat-message.service';

describe('ChatMessageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatMessageService]
    });
  });

  it('should ...', inject([ChatMessageService], (service: ChatMessageService) => {
    expect(service).toBeTruthy();
  }));
});
