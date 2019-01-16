import { TestBed } from '@angular/core/testing';

import { GameObjectInventoryService } from './game-object-inventory.service';

describe('GameObjectInventoryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GameObjectInventoryService = TestBed.get(GameObjectInventoryService);
    expect(service).toBeTruthy();
  });
});
