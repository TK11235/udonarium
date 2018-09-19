import { IPeerContext } from './peer-context';

export class ConnectionCallback {
  willOpen: (peerId: string, sendFrom: string) => void;
  onTimeout: (peerId: string) => void;
  onOpen: (peerId: string) => void;
  onData: (peerId: string, data: any) => void;
  onClose: (peerId: string) => void;
  onError: (peerId: string, err: any) => void;
  onDetectUnknownPeers: (peerIds: string[]) => void;
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
