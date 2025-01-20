const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function getNextContent() {
  const response = await fetch(`${API_URL}/next-content`);
  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }
  return response.json();
}