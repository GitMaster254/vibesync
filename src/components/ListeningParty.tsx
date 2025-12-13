import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { X } from 'lucide-react'; // Import close icon
import { useListeningParty } from '../hooks/useListeningParty';
import { usePlayerStore } from '../store/usePlayerStore';

interface ListeningPartyProps {
  userId: string;
  username: string;
  // New prop to handle closing the full-page view
  onClose: () => void; 
}

export function ListeningParty({ userId, username, onClose }: ListeningPartyProps) {
  const [roomIdInput, setRoomIdInput] = useState('');
  const { members, isHost, roomId, joinParty, leaveParty } = useListeningParty(userId, username);
  const { currentTrack } = usePlayerStore();

  const handleJoinParty = () => {
    if (roomIdInput.trim()) {
      joinParty(roomIdInput.trim());
    }
  };

  const handleCreateNewParty = () => {
    // Generate a simple, unique room ID
    joinParty(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const handleLeaveAndClose = () => {
    if (roomId) {
      leaveParty();
    }
    onClose();
  }

  // A fixed full-screen container to mimic the original image's background
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 to-black p-4 flex items-center justify-center">
      
      {/* The main card/modal that covers a significant portion of the screen */}
      <Card className="w-full max-w-lg p-6 bg-gray-900 shadow-2xl rounded-xl relative overflow-y-auto">
        
        {/* Close Button at the top right */}
        <button
          onClick={handleLeaveAndClose}
          className="absolute top-4 right-4 text-white hover:text-red-400 p-1 rounded-full transition-colors"
          aria-label="Close Party Mode"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Listening Party
        </h2>

        {!roomId ? (
          // --- Party Creation/Joining View ---
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Join or Create a Party</h3>
            
            {/* Join Party Section */}
            <div className="space-y-3">
              <Input
                placeholder="Enter Room ID"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
              />
              <Button 
                onClick={handleJoinParty}
                disabled={!roomIdInput.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all"
              >
                Join Party
              </Button>
            </div>

            <div className="relative flex justify-center items-center py-2">
                <div className="absolute w-full border-t border-gray-700"></div>
                <span className="relative bg-gray-900 px-3 text-sm text-gray-400">OR</span>
            </div>

            {/* Create New Party Section */}
            <Button
              variant="outline"
              onClick={handleCreateNewParty}
              className="w-full border-2 border-pink-500 text-pink-400 hover:bg-pink-900/20 transition-all font-bold"
            >
              🎉 Create New Party
            </Button>
          </div>
        ) : (
          // --- Active Party View ---
          <div className="space-y-6 text-white">
            <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-mono text-purple-400">Room ID: **{roomId}**</p>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isHost ? 'bg-pink-600' : 'bg-green-600'}`}>
                    {isHost ? 'You are the Host' : 'Participant'}
                </span>
              </div>
              <Button 
                variant="destructive" 
                onClick={leaveParty}
                className="w-full mt-2"
              >
                Leave Party
              </Button>
            </div>

            {/* Now Playing */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-xl font-semibold mb-2 text-pink-400">🎧 Now Playing</h3>
              {currentTrack ? (
                <p className="text-lg">
                  <span className="font-bold">{currentTrack.title}</span> by <span className="text-gray-400">{currentTrack.artist}</span>
                </p>
              ) : (
                <p className="text-gray-400 italic">Nothing playing</p>
              )}
            </div>

            {/* Party Members */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">👥 Party Members ({members.length})</h3>
              <ul className="space-y-3">
                {members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium">
                      {member.username} {member.isHost && (<span className="text-xs font-bold text-pink-400">(Host)</span>)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {/* Note: This time calculation is client-side and can be inaccurate for real-time */}
                      Active: {Math.max(0, Math.floor((Date.now() - member.lastActive) / 1000))}s ago
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
