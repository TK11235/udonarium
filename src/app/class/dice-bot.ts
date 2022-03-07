import Loader from 'bcdice/lib/loader/loader';
import GameSystemClass from 'bcdice/lib/game_system';
import { GameSystemInfo } from 'bcdice/lib/bcdice/game_system_list.json';

import { ChatMessage, ChatMessageContext } from './chat-message';
import { ChatTab } from './chat-tab';
import { SyncObject } from './core/synchronize-object/decorator';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectStore } from './core/synchronize-object/object-store';
import { EventSystem } from './core/system';
import { PromiseQueue } from './core/system/util/promise-queue';
import { StringUtil } from './core/system/util/string-util';

interface DiceRollResult {
  result: string;
  isSecret: boolean;
}

// bcdice-js custom loader class
class WebpackLoader extends Loader {
  async dynamicImport(className: string): Promise<void> {
    await import(
      /* webpackChunkName: "[request]"  */
      /* webpackInclude: /\.js$/ */
      `bcdice/lib/bcdice/game_system/${className}`
    );
  }
}

@SyncObject('dice-bot')
export class DiceBot extends GameObject {
  private static loader: WebpackLoader = new WebpackLoader();
  private static queue: PromiseQueue = new PromiseQueue('DiceBotQueue');

  static diceBotInfos: GameSystemInfo[] = DiceBot.loader.listAvailableGameSystems().sort(
    (a, b) => {
      let aKey: string = a.sortKey;
      let bKey: string = b.sortKey;
      if (aKey < bKey) {
        return -1;
      }
      if (aKey > bKey) {
        return 1;
      }
      return 0
    }
  );

  // GameObject Lifecycle
  onStoreAdded() {
    super.onStoreAdded();
    EventSystem.register(this)
      .on('SEND_MESSAGE', async event => {
        let chatMessage = ObjectStore.instance.get<ChatMessage>(event.data.messageIdentifier);
        if (!chatMessage || !chatMessage.isSendFromSelf || chatMessage.isSystem) return;

        let text: string = StringUtil.toHalfWidth(chatMessage.text);
        let gameType: string = chatMessage.tag;

        try {
          let regArray = /^((\d+)?[^\S\n]+)?([\S]*)?/ig.exec(text);
          let repeat: number = (regArray[2] != null) ? Number(regArray[2]) : 1;
          let rollText: string = (regArray[3] != null) ? regArray[3] : text;
          const gameSystem = await DiceBot.loadGameSystemAsync(gameType);
          if (!rollText || repeat < 1 || !gameSystem.COMMAND_PATTERN.test(rollText)) return;
          // 繰り返しコマンドに変換
          if (repeat > 1) {
            rollText = `x${repeat} ${rollText}`
          }

          let rollResult = await DiceBot.diceRollAsync(rollText, gameSystem);
          if (!rollResult.result) return;
          this.sendResultMessage(rollResult, chatMessage);
        } catch (e) {
          console.error(e);
        }
        return;
      });
  }

  // GameObject Lifecycle
  onStoreRemoved() {
    super.onStoreRemoved();
    EventSystem.unregister(this);
  }

  private sendResultMessage(rollResult: DiceRollResult, originalMessage: ChatMessage) {
    let result: string = rollResult.result;
    let isSecret: boolean = rollResult.isSecret;

    if (result.length < 1) return;

    result = result.replace(/[＞]/g, s => '→').trim();

    let diceBotMessage: ChatMessageContext = {
      identifier: '',
      tabIdentifier: originalMessage.tabIdentifier,
      originFrom: originalMessage.from,
      from: 'System-BCDice',
      timestamp: originalMessage.timestamp + 1,
      imageIdentifier: '',
      tag: isSecret ? 'system secret' : 'system',
      name: isSecret ? '<Secret-BCDice：' + originalMessage.name + '>' : '<BCDice：' + originalMessage.name + '>',
      text: result
    };

    if (originalMessage.to != null && 0 < originalMessage.to.length) {
      diceBotMessage.to = originalMessage.to;
      if (originalMessage.to.indexOf(originalMessage.from) < 0) {
        diceBotMessage.to += ' ' + originalMessage.from;
      }
    }
    let chatTab = ObjectStore.instance.get<ChatTab>(originalMessage.tabIdentifier);
    if (chatTab) chatTab.addMessage(diceBotMessage);
  }

  static diceRollAsync(message: string, gameSystem: GameSystemClass): Promise<DiceRollResult> {
    return DiceBot.queue.add(() => {
      try {
        const result = gameSystem.eval(message);
        if (result) {
          console.log('diceRoll!!!', result.text);
          console.log('isSecret!!!', result.secret);
          return {
            result: `${gameSystem.ID} : ${result.text}`,
            isSecret: result.secret,
          };
        }
      } catch (e) {
        console.error(e);
      }
      return { result: '', isSecret: false };
    });
  }

  static getHelpMessage(gameType: string): Promise<string> {
    return DiceBot.queue.add(async (resolve, reject) => {
      let help = '';
      try {
        const gameSystem = await DiceBot.loadGameSystemAsync(gameType);
        help = gameSystem.HELP_MESSAGE;
      } catch (e) {
        console.error(e);
      }
      resolve(help);
      return;
    });
  }

  static loadGameSystemAsync(gameType: string): Promise<GameSystemClass> {
    const id = this.diceBotInfos.some((info) => info.id === gameType)
      ? gameType
      : 'DiceBot';
    return DiceBot.loader.dynamicLoad(id);
  }
}
