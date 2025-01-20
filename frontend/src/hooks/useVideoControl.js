import { useState, useEffect } from 'react';

export function useVideoControl(audioRef, chunks) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  useEffect(() => {
    if (!audioRef.current || !chunks) return;

    const handleTimeUpdate = () => {
      const currentTime = audioRef.current.currentTime;
      const newIndex = chunks.findIndex(
        chunk => currentTime >= chunk.startTime && currentTime < chunk.endTime
      );
      if (newIndex !== -1) {
        setCurrentChunkIndex(newIndex);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    return () => audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
  }, [chunks]);

  return currentChunkIndex;
}