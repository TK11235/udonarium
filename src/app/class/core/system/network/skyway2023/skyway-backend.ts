import { ChannelScope, nowInSec, SkyWayAuthToken, uuidV4 } from '@skyway-sdk/core';

export namespace SkyWayBackend {
  export async function createSkyWayAuthToken(appId: string, channelName: string, peerId: string): Promise<string> {
    return createSkyWayAuthTokenMock(appId, channelName, peerId);
  }
}

/**
 * SkyWayAuthTokenを生成するモック実装.
 * 
 * **シークレットキーはフロントエンドでは秘匿されている必要があります. この実装を本番環境で運用しないでください.**
 * 
 * サーバを構築せずにフロントエンドでSkyWayAuthTokenを生成した場合、
 * シークレットキーをエンドユーザが取得できるため、誰でも任意のChannelやRoomを生成して参加できる等のセキュリティ上の問題が発生します.
 * 
 * @param appId アプリケーションID
 * @param channelName 接続するチャンネルの名称
 * @param peerId PeerId
 * @returns JWT
 */
async function createSkyWayAuthTokenMock(appId: string, channelName: string, peerId: string): Promise<string> {
  // モック実装のため、アプリケーションIDとシークレットキーは固定値
  // 本番環境ではシークレットキーをサーバなどに置いて秘匿する
  const _appId = '<SkyWay2023 Application ID>';
  const _secret = '<SkyWay2023 Secret key>';

  const _lobbySize = 4;

  let lobbyChannels: ChannelScope[] = [];
  for (let index = 0; index < _lobbySize; index++) {
    lobbyChannels.push({
      name: `udonarium-lobby-${index}`,
      actions: ['read', 'create'],
      members: [
        {
          name: peerId,
          actions: ['write'],
          publication: {
            actions: [],
          },
          subscription: {
            actions: [],
          },
        },
      ],
    });
  }

  let roomChannels: ChannelScope[] = [];
  roomChannels.push({
    name: channelName,
    actions: ['read', 'create'],
    members: [
      {
        name: peerId,
        actions: ['write'],
        publication: {
          actions: ['write'],
        },
        subscription: {
          actions: ['write'],
        },
      },
      {
        name: '*',
        actions: ['signal'],
        publication: {
          actions: [],
        },
        subscription: {
          actions: [],
        },
      },
    ],
  });

  let token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    scope: {
      app: {
        id: _appId,
        turn: false,
        actions: ['read'],
        channels: lobbyChannels.concat(roomChannels),
      },
    },
  }).encode(_secret);

  return token;
}
