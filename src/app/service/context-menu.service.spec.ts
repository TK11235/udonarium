import { TestBed, inject } from '@angular/core/testing';

import { ContextMenuService } from './context-menu.service';

describe('ContextMenuService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContextMenuService]
    });
  });

  it('should ...', inject([ContextMenuService], (service: ContextMenuService) => {
    expect(service).toBeTruthy();
  }));
});
