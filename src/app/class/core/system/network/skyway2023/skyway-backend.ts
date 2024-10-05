import { ChannelScope, nowInSec, SkyWayAuthToken, uuidV4 } from '@skyway-sdk/core';

export class SkyWayBackend {
  constructor(readonly url: string) { }

  async alive(): Promise<boolean> {
    return fetchStatus(this.url);
  }

  async createSkyWayAuthToken(channelName: string, peerId: string): Promise<string> {
    return fetchSkyWayAuthToken(this.url, channelName, peerId);
    //return createSkyWayAuthTokenMock(channelName, peerId);
  }
}

async function fetchStatus(url: string): Promise<boolean> {
  try {
    const api = new URL('/v1/status', url);
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
      },
    }
    const response = await fetch(api, options);

    return response.status === 200
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function fetchSkyWayAuthToken(url: string, channelName: string, peerId: string): Promise<string> {
  try {
    const api = new URL('/v1/skyway2023/token', url);

    const body = JSON.stringify({
      formatVersion: 1,
      channelName: channelName,
      peerId: peerId,
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
      },
      body,
    }

    const response = await fetch(api, options);

    if (response.status !== 200) return '';

    const jsonObj = await response.json();
    return jsonObj.token ?? '';
  } catch (err) {
    console.error(err);
    return '';
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
 * @param channelName 接続するチャンネルの名称
 * @param peerId PeerId
 * @returns JWT
 */
async function createSkyWayAuthTokenMock(channelName: string, peerId: string): Promise<string> {
  // モック実装のため、アプリケーションIDとシークレットキーは固定値
  // 本番環境ではシークレットキーをサーバなどに置いて秘匿する
  const _appId = '<SkyWay2023 Application ID>';
  const _secret = '<SkyWay2023 Secret key>';

  const _lobbySize = 4;

  let lobbyChannels: ChannelScope[] = [];
  lobbyChannels.push({
    name: `udonarium-lobby-\*-of-${_lobbySize}`,
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
    version: 2,
  }).encode(_secret);

  return token;
}
