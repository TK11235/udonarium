export enum CandidateType {
  UNKNOWN = 'unknown',
  RELAY = 'relay',
  PRFLX = 'prflx',
  SRFLX = 'srflx',
  HOST = 'host',
}

export class WebRTCStats {
  candidateType: CandidateType = CandidateType.UNKNOWN;

  constructor(private peerConnection: RTCPeerConnection) { }

  async updateAsync() {
    let stats: RTCStatsReport = null;
    try {
      stats = await this.peerConnection.getStats();
    } catch (error) {
      console.warn(error);
    }

    if (stats == null) {
      this.candidateType = CandidateType.UNKNOWN;
      return;
    }

    let candidatePairs = [];
    let localCandidates = [];
    let remoteCandidates = [];

    let succeededLocalCandidateIds = [];
    let succeededRemoteCandidateIds = [];
    let usedLocalCandidates = [];
    let usedRemoteCandidates = [];

    stats.forEach(stat => {
      if (0 <= stat.type.indexOf('candidate-pair')) {
        candidatePairs.push(stat);
      }
      if (0 <= stat.type.indexOf('local-candidate')) {
        localCandidates.push(stat);
      }
      if (0 <= stat.type.indexOf('remote-candidate')) {
        remoteCandidates.push(stat);
      }
    });

    candidatePairs.forEach(candidatePair => {
      if (candidatePair.state === 'succeeded') {
        succeededLocalCandidateIds.push(candidatePair.localCandidateId);
        succeededRemoteCandidateIds.push(candidatePair.remoteCandidateId);
      }
    });

    localCandidates.forEach(candidate => {
      if (succeededLocalCandidateIds.includes(candidate.id)) {
        usedLocalCandidates.push(candidate);
      }
    });

    remoteCandidates.forEach(candidate => {
      if (succeededRemoteCandidateIds.includes(candidate.id)) {
        usedRemoteCandidates.push(candidate);
      }
    });

    let candidateType = CandidateType.UNKNOWN;
    let types: CandidateType[] = Object.values(CandidateType);
    usedLocalCandidates.concat(usedRemoteCandidates).forEach(candidate => {
      let index = types.indexOf(candidate.candidateType);
      if (types.indexOf(candidateType) < index) candidateType = types[index];
    });
    this.candidateType = candidateType;
  }
}
