export enum PeerSessionGrade {
  UNSPECIFIED,
  LOW,
  MIDDLE,
  HIGH,
}

export interface PeerSessionState {
  /**
   * 接続方法の評価. `PeerSessionGrade.LOW`よりも`PeerSessionGrade.HIGH`の方がより望ましい方法で通信している事を示す.
   */
  readonly grade: PeerSessionGrade;
  /**
   * データ送信に対する宛先からの応答時間(Round-Trip Time). 単位はms.
   */
  readonly ping: number;
  /**
   * 接続の健康度を`[0.0, 1.0]`の区間で表現した値. 値が1.0より低い場合、通信が切断している可能性がある.
   */
  readonly health: number;
  /**
   * 通信速度の評価を`[0.0, 1.0]`の区間で表現した値. 値が高いほど通信速度が速い.
   */
  readonly speed: number;
  /**
   * 接続についての任意の説明.
   */
  readonly description: string;
}

export interface MutablePeerSessionState extends PeerSessionState {
  grade: PeerSessionGrade;
  ping: number;
  health: number;
  speed: number;
  description: string;
}
