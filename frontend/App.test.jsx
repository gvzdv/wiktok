import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Mock fetch before each test
    global.fetch = jest.fn();
  });

  it('renders loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('fetches and displays content', async () => {
    const mockContent = {
      videoUrl: 'test-video.mp4',
      chunks: [
        {
          text: 'Test chunk 1',
          audioUrl: 'test-audio-1.mp3'
        }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockContent)
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test chunk 1')).toBeInTheDocument();
    });
  });
});