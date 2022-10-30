import Loader, { I18nJsonObject } from 'bcdice/lib/loader/loader';

// bcdice-js custom loader class
export default class BCDiceLoader extends Loader {
  async dynamicImportI18n(baseClassName: string, locale: string): Promise<I18nJsonObject> {
    return (await import(
      /* webpackChunkName: "lib/bcdice/i18n/[request]" */
      /* webpackInclude: /\.json$/ */
      /* webpackExclude: /i18n.json$/ */
      `bcdice/lib/bcdice/i18n/${baseClassName}.${locale}.json`)).default as I18nJsonObject;
  }

  async dynamicImport(className: string): Promise<void> {
    await import(
      /* webpackChunkName: "lib/bcdice/game_system/[request]" */
      /* webpackInclude: /\.js$/ */
      /* webpackExclude: /index.js$/ */
      `bcdice/lib/bcdice/game_system/${className}`
    );
  }
}
