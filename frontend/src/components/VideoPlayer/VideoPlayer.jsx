import React, { useRef, useState, useEffect, useImperativeHandle } from 'react';
import './VideoPlayer.css';
// If you have a config file for API_BASE_URL, import it.
// Otherwise, you can remove this line or define your base URL.
import { API_BASE_URL } from '../../config';

export function VideoPlayer({ videoData, isMuted, onMuteToggle }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // We'll track the old articleUrl to decide if we should reset.
  const oldArticleUrlRef = useRef(null);

  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    forcePlay() {
      if (!isMuted && audioRef.current) {
        audioRef.current
          .play()
          .catch(err => console.error('forcePlay error:', err));
      }
    },
  }));

  // Only reset index if the articleUrl changed:
  useEffect(() => {
    if (!oldArticleUrlRef.current || oldArticleUrlRef.current !== videoData.articleUrl) {
      // reset to chunk 0 if it's a brand-new article
      setIsVideoLoaded(false);
      setError(null);
      setCurrentChunkIndex(0);
    }
    oldArticleUrlRef.current = videoData.articleUrl;
  }, [videoData]);

  // Autoplay logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is muted by default so mobile allows autoplay
    video.defaultMuted = true;

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

  // Move to next chunk (or loop) when current audio ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioEnd = () => {
      if (currentChunkIndex < videoData.chunks.length - 1) {
        setCurrentChunkIndex(prev => prev + 1);
      } else {
        // If we've hit the last chunk, go back to 0
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

  // Whenever currentChunkIndex or isMuted changes, load the appropriate audio
  useEffect(() => {
    if (!audioRef.current || !videoData.chunks[currentChunkIndex]) return;

    let audioUrl = videoData.chunks[currentChunkIndex].audioUrl;
    if (!audioUrl.startsWith('http')) {
      audioUrl = `${API_BASE_URL}${audioUrl}`;
    }

    console.log('Loading audio URL:', audioUrl);
    audioRef.current.src = audioUrl;

    // Only autoplay audio if not muted
    if (!isMuted) {
      audioRef.current.play().catch(err => {
        console.error('Audio play error:', err);
        setError(`Failed to play audio: ${err.message}`);
      });
    }
  }, [currentChunkIndex, videoData.chunks, isMuted]);

  const handleToggleMute = async () => {
    try {
      if (isMuted) {
        // if user unmutes, play audio immediately
        await audioRef.current.play();
        onMuteToggle(false);
      } else {
        // if user mutes, pause audio
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