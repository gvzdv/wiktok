import React, { useRef, useState, useEffect } from 'react';
import './VideoPlayer.css';
import { API_BASE_URL } from '../../config';

export function VideoPlayer({ videoData, isMuted, onMuteToggle }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Only reset index if the articleUrl changes
  const oldArticleUrlRef = useRef(null);
  useEffect(() => {
    if (!oldArticleUrlRef.current || oldArticleUrlRef.current !== videoData.articleUrl) {
      setIsVideoLoaded(false);
      setError(null);
      setCurrentChunkIndex(0);
    }
    oldArticleUrlRef.current = videoData.articleUrl;
  }, [videoData]);

  // Video autoplay while muted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true; // for iOS

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

  // Handle audio chunk progression
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioEnd = () => {
      if (currentChunkIndex < videoData.chunks.length - 1) {
        setCurrentChunkIndex((prev) => prev + 1);
      } else {
        setCurrentChunkIndex(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }
    };
    audio.addEventListener('ended', handleAudioEnd);
    return () => {
      audio.removeEventListener('ended', handleAudioEnd);
    };
  }, [currentChunkIndex, videoData.chunks]);

  // Load the current audio chunk
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !videoData.chunks[currentChunkIndex]) return;

    let audioUrl = videoData.chunks[currentChunkIndex].audioUrl;
    if (!audioUrl.startsWith('http')) {
      audioUrl = `${API_BASE_URL}${audioUrl}`;
    }

    console.log('Loading audio URL:', audioUrl);
    audioElement.src = audioUrl;

    // Auto-play audio if unmuted
    if (!isMuted) {
      audioElement.play().catch((err) => {
        console.error('Audio play error:', err);
        setError(`Failed to play audio: ${err.message}`);
      });
    }
  }, [currentChunkIndex, videoData.chunks, isMuted]);

  // Tapping on the screen toggles mute/unmute
  const handleScreenTap = async (e) => {
    // If tap hits a link, let it navigate
    if (e.target.closest('a')) return;

    try {
      if (isMuted) {
        // user unmuting
        await audioRef.current.play();
        onMuteToggle(false);
      } else {
        // user muting
        audioRef.current.pause();
        onMuteToggle(true);
      }
    } catch (err) {
      console.error('Toggle mute error:', err);
      setError('Failed to toggle audio');
    }
  };

  const handleVideoError = (error) => {
    console.error('Video loading error:', {
      error,
      videoUrl: videoData.videoUrl,
      mediaError: videoRef.current?.error
    });
    const msg = videoRef.current?.error?.message;
    const errorMessage = msg
      ? `Unable to load video: ${msg}`
      : `Unable to load video. Please try refreshing. (${videoData.videoUrl})`;
    setError(errorMessage);
  };

  const handleAudioError = (error) => {
    console.error('Audio loading error:', error);
    const currentAudioUrl = videoData.chunks[currentChunkIndex]?.audioUrl;
    setError(`Unable to load audio. Please try refreshing. (${currentAudioUrl})`);
  };

  if (!videoData) return null;

  return (
    <div className="video-container" onClick={handleScreenTap}>
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

      <audio ref={audioRef} onError={handleAudioError} />

      {/* Small "tap to unmute/mute" notice */}
      <div className="tap-reminder">
        Tap anywhere to {isMuted ? 'unmute' : 'mute'}
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