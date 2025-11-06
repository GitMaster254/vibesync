import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useListeningParty } from '../hooks/useListeningParty';
import { usePlayerStore } from '../store/usePlayerStore';

interface ListeningPartyProps {
  userId: string;
  username: string;
}

export function ListeningParty({ userId, username }: ListeningPartyProps) {
  const [roomIdInput, setRoomIdInput] = useState('');
  const { members, isHost, roomId, joinParty, leaveParty } = useListeningParty(userId, username);
  const { currentTrack } = usePlayerStore();

  const handleJoinParty = () => {
    if (roomIdInput.trim()) {
      joinParty(roomIdInput.trim());
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Listening Party</h2>
      
      {!roomId ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Room ID"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
            />
            <Button onClick={handleJoinParty}>Join Party</Button>
          </div>
          <Button
            variant="outline"
            onClick={() => joinParty(Math.random().toString(36).substring(2, 9))}
          >
            Create New Party
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Room ID: {roomId}</p>
              <p className="text-sm text-muted-foreground">
                {isHost ? 'You are the host' : 'You are a participant'}
              </p>
            </div>
            <Button variant="destructive" onClick={leaveParty}>
              Leave Party
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Now Playing</h3>
            {currentTrack ? (
              <p>{currentTrack.title} - {currentTrack.artist}</p>
            ) : (
              <p className="text-muted-foreground">Nothing playing</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Party Members</h3>
            <ul className="space-y-2">
              {members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between"
                >
                  <span>{member.username} {member.isHost && '(Host)'}</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((Date.now() - member.lastActive) / 1000)}s ago
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}