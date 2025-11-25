// Temporary mock user for demo purposes
// In a real app, this would be replaced with proper authentication
export const getCurrentUser = () => {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    username: 'User ' + Math.floor(Math.random() * 1000),
  };
};