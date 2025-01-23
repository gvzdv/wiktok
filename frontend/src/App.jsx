import React, { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import { getNextContent } from './services/api';
import './App.css';

const API_BASE_URL = 'https://wiktok-398449484807.us-central1.run.app/';

function App() {
  const [contentList, setContentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const [touchStartY, setTouchStartY] = useState(null);

  // Load initial content only once
  useEffect(() => {
    let mounted = true;

    const loadInitialContent = async () => {
      try {
        setLoading(true);
        console.log('Loading initial content...');

        // Load first piece using the imported service
        const firstContent = await getNextContent();
        if (!mounted) return;

        // Load second piece
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
  }, []); // Empty dependency array means this runs once on mount

  // Preload next content
  const preloadNextContent = useCallback(async () => {
    if (isLoadingNext) return;

    try {
      setIsLoadingNext(true);
      console.log('Preloading next content...');
      const nextContent = await getNextContent();
      setContentList(prev => [...prev, nextContent]);
    } catch (err) {
      console.error('Error preloading next content:', err);
    } finally {
      setIsLoadingNext(false);
    }
  }, [isLoadingNext]);

  // Handle sliding to next video
  const handleNext = useCallback(() => {
    if (currentIndex < contentList.length - 1) {
      setCurrentIndex(prev => prev + 1);

      // If we're showing the second-to-last item, load the next one
      if (currentIndex === contentList.length - 2) {
        preloadNextContent();
      }
    }
  }, [currentIndex, contentList.length, preloadNextContent]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (contentList.length === 0) return <div className="error-message">No content available</div>;

  const currentContent = contentList[currentIndex];
  console.log('Rendering content:', currentContent);

  const videoUrl = currentContent.videoUrl.startsWith('http')
    ? currentContent.videoUrl
    : `${API_BASE_URL}${currentContent.videoUrl.startsWith('/') ? '' : '/'}${currentContent.videoUrl}`;

  const handleTouchStart = e => setTouchStartY(e.touches[0].clientY);
  const handleTouchEnd = e => {
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