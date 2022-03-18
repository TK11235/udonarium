import Loader from 'bcdice/lib/loader/loader';

// bcdice-js custom loader class
export default class BCDiceLoader extends Loader {
  async dynamicImport(className: string): Promise<void> {
    await import(
      /* webpackChunkName: "lib/bcdice/game_system/[request]" */
      /* webpackInclude: /\.js$/ */
      /* webpackExclude: /index.js$/ */
      `bcdice/lib/bcdice/game_system/${className}`
    );
  }
}
