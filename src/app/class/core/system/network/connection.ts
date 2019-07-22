import { IPeerContext } from './peer-context';

export class ConnectionCallback {
  onOpen: (peerId: string) => void;
  onClose: (peerId: string) => void;
  onConnect: (peerId: string) => void;
  onDisconnect: (peerId: string) => void;
  onData: (peerId: string, data: any) => void;
  onError: (peerId: string, err: any) => void;
}

export interface Connection {
  readonly peerId: string;
  readonly peerIds: string[];
  readonly peerContext: IPeerContext;
  readonly peerContexts: IPeerContext[];
  readonly callback: ConnectionCallback;
  readonly bandwidthUsage: number;

  open(peerId: string)
  open(peerId: string, roomId: string, roomName: string, password: string)
  close()
  connect(peerId: string): boolean
  disconnect(peerId: string): boolean
  disconnectAll()
  send(data: any, sendTo?: string)
  setApiKey(key: string);
  listAllPeers(): Promise<string[]>
}
