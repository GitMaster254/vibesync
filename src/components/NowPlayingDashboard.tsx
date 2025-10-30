import React, { useState, useEffect, useRef } from "react";
import { Heart, Shuffle, SkipForward, Play, Pause } from "lucide-react";

// ✅ Correct Song type definition
export type Song = {
  id: string;
  title: string;
  artist?: string;
  url: string;
  cover?: string;
};

type Props = {
  songs: Song[];
  autoPlay?: boolean;
};

export default function NowPlayingDashboard({ songs, autoPlay = false }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isShuffle, setIsShuffle] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch {
      return [];
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSong = songs[currentIndex];

  // 🎧 Initialize and manage audio
  useEffect(() => {
    if (!currentSong) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(currentSong.url);
    audioRef.current = newAudio;

    if (autoPlay || isPlaying) {
      newAudio.play();
      setIsPlaying(true);
    }

    newAudio.addEventListener("ended", handleSkip);

    return () => {
      newAudio.pause();
      newAudio.removeEventListener("ended", handleSkip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentSong?.url]);

  // 💾 Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ▶️ Play / Pause toggle
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // ⏭️ Skip or shuffle next song
  const handleSkip = () => {
    if (songs.length === 0) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      setCurrentIndex(randomIndex);
    } else {
      setCurrentIndex((prev) => (prev + 1) % songs.length);
    }
  };

  // 🔀 Toggle shuffle
  const toggleShuffle = () => setIsShuffle((prev) => !prev);

  // ❤️ Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 text-white p-6 rounded-2xl shadow-lg w-full max-w-md">
      {currentSong ? (
        <>
          {/* 🎵 Cover Art */}
          <img
            src={currentSong.cover || "/default-cover.jpg"}
            alt={currentSong.title}
            className="w-40 h-40 rounded-xl shadow-md mb-4 object-cover"
          />

          {/* 🎤 Song Info */}
          <div className="text-center">
            <h2 className="text-xl font-semibold">{currentSong.title}</h2>
            <p className="text-gray-400">{currentSong.artist || "Unknown Artist"}</p>
          </div>

          {/* 🎚️ Controls */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition ${
                isShuffle ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-6 h-6" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition"
              title="Next Song"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className="mt-6 transition"
            title="Add to Favorites"
          >
            <Heart
              className={`w-7 h-7 ${
                favorites.includes(currentSong.id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400 hover:text-red-400"
              }`}
            />
          </button>
        </>
      ) : (
        <p>No song selected.</p>
      )}
    </div>
  );
}
