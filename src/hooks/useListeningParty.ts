import { useEffect, useState } from 'react';
import { getWebSocketService } from '../lib/websocket-service';
import { Track } from '../lib/db';
import { usePlayerStore } from '../store/usePlayerStore';

interface PartyMember {
  userId: string;
  username: string;
  isHost: boolean;
  lastActive: number;
}

interface UseListeningPartyReturn {
  members: PartyMember[];
  isHost: boolean;
  roomId: string | null;
  joinParty: (roomId: string) => void;
  leaveParty: () => void;
  syncPlayback: () => void;
}

export function useListeningParty(userId: string, username: string): UseListeningPartyReturn {
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const wsService = getWebSocketService();
  const { currentTrack, isPlaying, currentTime } = usePlayerStore();

  useEffect(() => {
    // Handle party join/leave events
    wsService.addEventListener('JOIN_PARTY', (message) => {
      const { userId, username, isHost } = message.payload;
      setMembers(prev => [
        ...prev,
        {
          userId,
          username,
          isHost,
          lastActive: Date.now(),
        },
      ]);
    });

    wsService.addEventListener('LEAVE_PARTY', (message) => {
      const { userId } = message.payload;
      setMembers(prev => prev.filter(member => member.userId !== userId));
    });

    // Handle playback sync events
    wsService.addEventListener('SYNC_PLAYBACK', (message) => {
      if (!isHost) {
        const { track, position, isPlaying } = message.payload;
        usePlayerStore.setState({
          currentTrack: track,
          currentTime: position,
          isPlaying,
        });
      }
    });

    return () => {
      if (roomId) {
        leaveParty();
      }
    };
  }, [wsService, isHost, roomId]);

  // Sync playback periodically if host
  useEffect(() => {
    if (!isHost || !roomId) return;

    const interval = setInterval(() => {
      syncPlayback();
    }, 5000);

    return () => clearInterval(interval);
  }, [isHost, roomId, currentTrack, isPlaying, currentTime]);

  const joinParty = (newRoomId: string) => {
    setRoomId(newRoomId);
    setIsHost(members.length === 0);
    wsService.joinRoom(newRoomId);
  };

  const leaveParty = () => {
    wsService.leaveRoom();
    setRoomId(null);
    setIsHost(false);
    setMembers([]);
  };

  const syncPlayback = () => {
    if (!currentTrack) return;
    wsService.syncPlayback(currentTrack, currentTime, isPlaying);
  };

  return {
    members,
    isHost,
    roomId,
    joinParty,
    leaveParty,
    syncPlayback,
  };
}