import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  const mockVideoData = {
    videoUrl: "Skytrain.mp4",
    chunks: [
      {
        text: "The Kusanagi Athletic Stadium is part of the Kusanagi Sport Complex in Shizuoka, Japan.",
        audioUrl: "./backend/static/audio/tts_bcac7ae5-4ebf-4201-aec6-ef421760cd0d.mp3"
      },
      {
        text: "The stadium has a main stand with 8,000 seats, a back stand with 12,000 seats, and two ends with 4,000 seats each.",
        audioUrl: ".backend/static/audio/tts_87153c2c-ebbf-4dac-903e-ebfb997da8c5.mp3"
      }
    ]
  };

  beforeEach(() => {
    // Mock the HTMLMediaElement API
    window.HTMLMediaElement.prototype.play = jest.fn();
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  it('renders without crashing', () => {
    render(<VideoPlayer videoData={mockVideoData} />);
  });

  it('displays the first chunk text', () => {
    render(<VideoPlayer videoData={mockVideoData} />);
    expect(screen.getByText('The Kusanagi Athletic Stadium is part of the Kusanagi Sport Complex in Shizuoka, Japan.')).toBeInTheDocument();
  });

  it('renders video element with correct source', () => {
    const { container } = render(<VideoPlayer videoData={mockVideoData} />);
    const videoElement = container.querySelector('video');
    expect(videoElement).toHaveAttribute('src', 'Skytrain.mp4');
  });

  it('renders audio element', () => {
    const { container } = render(<VideoPlayer videoData={mockVideoData} />);
    const audioElement = container.querySelector('audio');
    expect(audioElement).toBeInTheDocument();
  });

  it('returns null when no videoData is provided', () => {
    const { container } = render(<VideoPlayer videoData={null} />);
    expect(container.firstChild).toBeNull();
  });
});