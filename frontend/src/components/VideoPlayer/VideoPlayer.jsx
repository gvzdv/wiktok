import React, { useRef, useState, useEffect } from 'react';
import './VideoPlayer.css';
import { API_BASE_URL } from '../../config';

export function VideoPlayer({ videoData, isMuted, onMuteToggle }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when videoData changes
  useEffect(() => {
    setIsVideoLoaded(false);
    setError(null);
    setCurrentChunkIndex(0);
  }, [videoData]);

  // Handle video loading and autoplay
  useEffect(() => {
    const video = videoRef.current;
    video.defaultMuted = true;
    if (!video) return;

    const handleCanPlay = async () => {
      console.log('Video can play');
      setIsVideoLoaded(true);
      setError(null);
      try {
        await video.play();
      } catch (err) {
        console.error('Autoplay failed:', err);
      }
    };

    const handleError = (e) => {
      console.error('Video loading error:', e);
      setError(`Failed to load video: ${videoData.videoUrl}`);
      setIsVideoLoaded(false);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoData.videoUrl]);

  // Handle audio completion to move to next chunk or loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioEnd = () => {
      if (currentChunkIndex < videoData.chunks.length - 1) {
        setCurrentChunkIndex(prev => prev + 1);
      } else {
        // Reset to beginning when last chunk finishes
        setCurrentChunkIndex(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }
    };

    audio.addEventListener('ended', handleAudioEnd);
    return () => audio.removeEventListener('ended', handleAudioEnd);
  }, [currentChunkIndex, videoData.chunks]);

  // Load audio for current chunk
  useEffect(() => {
    if (audioRef.current && videoData.chunks[currentChunkIndex]) {
      const audioUrl = videoData.chunks[currentChunkIndex].audioUrl;
      // Ensure audioUrl is absolute
      const fullAudioUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `${API_BASE_URL}${audioUrl}`;

      console.log('Loading audio URL:', fullAudioUrl);
      audioRef.current.src = fullAudioUrl;

      if (!isMuted) {
        audioRef.current.play().catch(err => {
          console.error('Audio play error:', err);
          setError(`Failed to play audio: ${err.message}`);
        });
      }
    }
  }, [currentChunkIndex, videoData.chunks, isMuted]);

  useEffect(() => {
    console.log('Video URL:', videoData.videoUrl);
    console.log('Video element:', videoRef.current);
    
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadstart', () => console.log('Video loadstart'));
      video.addEventListener('loadedmetadata', () => console.log('Video loadedmetadata'));
      video.addEventListener('loadeddata', () => console.log('Video loadeddata'));
    }
  }, [videoData.videoUrl]);

  const handleToggleMute = async () => {
    try {
      if (isMuted) {
        await audioRef.current.play();
        onMuteToggle(false);
      } else {
        audioRef.current.pause();
        onMuteToggle(true);
      }
    } catch (error) {
      console.error('Toggle mute error:', error);
      setError('Failed to toggle audio');
    }
  };

  const handleVideoError = (error) => {
    console.error('Video loading error:', {
      error,
      videoUrl: videoData.videoUrl,
      mediaError: videoRef.current?.error
    });
    
    const errorMessage = videoRef.current?.error?.message 
      ? `Unable to load video: ${videoRef.current.error.message}`
      : `Unable to load video. Please try refreshing the page. (${videoData.videoUrl})`;
      
    setError(errorMessage);
  };

  const handleAudioError = (error) => {
    console.error('Audio loading error:', error);
    const currentAudioUrl = videoData.chunks[currentChunkIndex]?.audioUrl;
    setError(`Unable to load audio. Please try refreshing the page. (${currentAudioUrl})`);
  };

  if (!videoData) return null;

  return (
    <div className="video-container">
      {error && <div className="error-overlay">{error}</div>}

      <video
        ref={videoRef}
        src={videoData.videoUrl}
        className="video-player"
        loop
        muted
        playsInline
        autoPlay
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        crossOrigin="anonymous"
        onError={handleVideoError}
      />

      <audio
        ref={audioRef}
        src={videoData.chunks[currentChunkIndex]?.audioUrl}
        onError={handleAudioError}
      />

      <div className="controls-overlay">
        <button
          className="mute-button"
          onClick={handleToggleMute}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      <div className="subtitle-overlay">
        {videoData.chunks[currentChunkIndex] && (
          <p className="subtitle-text">
            {videoData.chunks[currentChunkIndex].text}
          </p>
        )}
      </div>

      {videoData.articleUrl && (
        <div className="article-link-container">
          <a
            href={videoData.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="article-link"
          >
            Read on Wikipedia: {videoData.title}
          </a>
          <a
            href="https://www.linkedin.com/in/mike-gvozdev/"
            target="_blank"
            rel="noopener noreferrer"
            className="article-link"
          >
            Say hi to the creator
          </a>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;