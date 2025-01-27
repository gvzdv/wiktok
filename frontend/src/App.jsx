import React, { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import { getNextContent } from './services/api';
import './App.css';

function App() {
  const [contentList, setContentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  // Start the first video muted by default
  const [isMuted, setIsMuted] = useState(true);

  const [touchStartY, setTouchStartY] = useState(null);

  // Load initial content only once
  useEffect(() => {
    let mounted = true;

    const loadInitialContent = async () => {
      try {
        setLoading(true);
        console.log('Loading initial content...');

        const firstContent = await getNextContent();
        if (!mounted) return;

        const secondContent = await getNextContent();
        if (!mounted) return;

        setContentList([firstContent, secondContent]);
      } catch (err) {
        if (mounted) {
          console.error('Error loading initial content:', err);
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialContent();

    return () => {
      mounted = false;
    };
  }, []);

  // Preload next content
  const preloadNextContent = useCallback(async () => {
    if (isLoadingNext) return;
    try {
      setIsLoadingNext(true);
      console.log('Preloading next content...');
      const nextContent = await getNextContent();
      setContentList((prev) => [...prev, nextContent]);
    } catch (err) {
      console.error('Error preloading next content:', err);
    } finally {
      setIsLoadingNext(false);
    }
  }, [isLoadingNext]);

  // Go to next video, then re-mute so the new video starts muted
  const handleNext = useCallback(() => {
    if (currentIndex < contentList.length - 1) {
      // <-- Force next video to start muted
      setIsMuted(true);
      setCurrentIndex((prev) => prev + 1);

      // If we're on the second-to-last, preload the next
      if (currentIndex === contentList.length - 2) {
        preloadNextContent();
      }
    }
  }, [currentIndex, contentList.length, preloadNextContent]);

  // Basic loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (contentList.length === 0) return <div className="error-message">No content available</div>;

  // Current content
  const currentContent = contentList[currentIndex];
  console.log('Rendering content:', currentContent);

  // Video URLs are already absolute GCS URLs, no need to modify
  const videoUrl = currentContent.videoUrl;

  // Touch-based swipe
  const handleTouchStart = (e) => setTouchStartY(e.touches[0].clientY);
  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    if (touchStartY - touchEndY > 50) {
      handleNext();
    }
    setTouchStartY(null);
  };

  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={(e) => {
        if (e.deltaY > 0) handleNext();
      }}
    >
      <VideoPlayer
        key={currentIndex}
        videoData={{
          ...currentContent,
          videoUrl: videoUrl
        }}
        isMuted={isMuted}
        onMuteToggle={setIsMuted}
      />
    </div>
  );
}

export default App;