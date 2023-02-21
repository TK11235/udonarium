import { IPeerContext } from './peer-context';
import { IRoomInfo } from './room-info';

export class ConnectionCallback {
  onOpen: (peerId: string) => void;
  onClose: (peerId: string) => void;
  onConnect: (peerId: string) => void;
  onDisconnect: (peerId: string) => void;
  onData: (peerId: string, data: any) => void;
  onError: (peerId: string, errorType: string, errorMessage: string, errorObject: any) => void;
}

export interface Connection {
  readonly peerId: string;
  readonly peerIds: string[];
  readonly peerContext: IPeerContext;
  readonly peerContexts: IPeerContext[];
  readonly callback: ConnectionCallback;
  readonly bandwidthUsage: number;

  open(userId?: string)
  open(userId: string, roomId: string, roomName: string, password: string)
  close()
  connect(context: IPeerContext): boolean
  disconnect(context: IPeerContext): boolean
  disconnectAll()
  send(data: any, sendTo?: string)
  setApiKey(key: string);
  listAllPeers(): Promise<string[]>
  listAllRooms(): Promise<IRoomInfo[]>
}
