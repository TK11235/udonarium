import { GameSystemInfo } from 'bcdice/lib/bcdice/game_system_list.json';
import GameSystemClass from 'bcdice/lib/game_system';

import BCDiceLoader from './bcdice/bcdice-loader';
import { ChatMessage, ChatMessageContext } from './chat-message';
import { ChatTab } from './chat-tab';
import { SyncObject } from './core/synchronize-object/decorator';
import { GameObject } from './core/synchronize-object/game-object';
import { ObjectStore } from './core/synchronize-object/object-store';
import { EventSystem } from './core/system';
import { PromiseQueue } from './core/system/util/promise-queue';
import { StringUtil } from './core/system/util/string-util';

interface DiceRollResult {
  id: string;
  result: string;
  isSecret: boolean;
}

@SyncObject('dice-bot')
export class DiceBot extends GameObject {
  private static loader: BCDiceLoader;
  private static queue: PromiseQueue = DiceBot.initializeDiceBotQueue();

  static diceBotInfos: GameSystemInfo[] = [];

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
          if (!rollText || repeat < 1) return;
          // 繰り返しコマンドに変換
          if (repeat > 1) {
            rollText = `x${repeat} ${rollText}`
          }

          let rollResult = await DiceBot.diceRollAsync(rollText, gameType);
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
    let id: string = rollResult.id.split(':')[0];
    let result: string = rollResult.result;
    let isSecret: boolean = rollResult.isSecret;

    if (result.length < 1) return;

    let diceBotMessage: ChatMessageContext = {
      identifier: '',
      tabIdentifier: originalMessage.tabIdentifier,
      originFrom: originalMessage.from,
      from: 'System-BCDice',
      timestamp: originalMessage.timestamp + 1,
      imageIdentifier: '',
      tag: `system dicebot${isSecret ? ' secret' : ''}`,
      name: `${id} : ${originalMessage.name}${isSecret ? ' (Secret)' : ''}`,
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

  static async diceRollAsync(message: string, gameType: string): Promise<DiceRollResult> {
    const empty: DiceRollResult = { id: gameType, result: '', isSecret: false };
    try {
      const gameSystem = await DiceBot.loadGameSystemAsync(gameType);
      if (!gameSystem?.COMMAND_PATTERN.test(message)) return empty;

      const result = gameSystem.eval(message);
      if (result) {
        console.log('diceRoll!!!', result.text);
        console.log('isSecret!!!', result.secret);
        return {
          id: gameSystem.ID,
          result: result.text,
          isSecret: result.secret,
        };
      }
    } catch (e) {
      console.error(e);
    }
    return empty;
  }

  static async getHelpMessage(gameType: string): Promise<string> {
    try {
      const gameSystem = await DiceBot.loadGameSystemAsync(gameType);
      return gameSystem.HELP_MESSAGE;
    } catch (e) {
      console.error(e);
    }
    return '';
  }

  static async loadGameSystemAsync(gameType: string): Promise<GameSystemClass> {
    return await DiceBot.queue.add(() => {
      const id = this.diceBotInfos.some((info) => info.id === gameType)
        ? gameType
        : 'DiceBot';
      return DiceBot.loader.dynamicLoad(id);
    });
  }

  private static initializeDiceBotQueue(): PromiseQueue {
    let queue = new PromiseQueue('DiceBotQueue');
    queue.add(async () => {
      DiceBot.loader = new (await import(
        /* webpackChunkName: "lib/bcdice/bcdice-loader" */
        './bcdice/bcdice-loader')
      ).default();
      DiceBot.diceBotInfos = DiceBot.loader.listAvailableGameSystems()
        .sort((a, b) => {
          if (a.sortKey < b.sortKey) return -1;
          if (a.sortKey > b.sortKey) return 1;
          return 0;
        });
    });
    return queue;
  }
}
