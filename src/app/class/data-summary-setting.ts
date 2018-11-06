import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { GameObject } from './core/synchronize-object/game-object';
import { InnerXml } from './core/synchronize-object/object-serializer';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

@SyncObject('summary-setting')
export class DataSummarySetting extends GameObject implements InnerXml {
  // todo:シングルトン化するのは妥当？
  private static _instance: DataSummarySetting;
  static get instance(): DataSummarySetting {
    if (!DataSummarySetting._instance) {
      DataSummarySetting._instance = new DataSummarySetting('DataSummarySetting');
      DataSummarySetting._instance.initialize();
    }
    return DataSummarySetting._instance;
  }

  @SyncVar() sortTag: string = 'name';
  @SyncVar() sortOrder: SortOrder = SortOrder.ASC;
  @SyncVar() dataTag: string = 'HP MP 敏捷度 生命力 精神力';

  get dataTags(): string[] { return this.dataTag.split(/\s+/); }

  innerXml(): string { return ''; }
  parseInnerXml(element: Element) {
    // XMLからの新規作成を許可せず、既存のオブジェクトを更新する
    let context = DataSummarySetting.instance.toContext();
    context.syncData = this.toContext().syncData;
    DataSummarySetting.instance.apply(context);
    DataSummarySetting.instance.update();

    this.destroy();
  }
}
