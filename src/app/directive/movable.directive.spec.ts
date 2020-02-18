import { MovableDirective } from './movable.directive';

describe('MovableDirective', () => {
  it('should create an instance', () => {
    const directive = new MovableDirective(null, null, null);
    expect(directive).toBeTruthy();
  });
});
