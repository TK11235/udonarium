import { UnrealDiceOnlinePage } from './app.po';

describe('unreal-dice-online App', () => {
  let page: UnrealDiceOnlinePage;

  beforeEach(() => {
    page = new UnrealDiceOnlinePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
