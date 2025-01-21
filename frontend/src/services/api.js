import { API_BASE_URL } from '../config';

export const getNextContent = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/next-content`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
};