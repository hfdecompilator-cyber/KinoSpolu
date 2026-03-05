import type { StreamingService } from '@/types';

export interface ServiceConfig {
  id: StreamingService;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

export const STREAMING_SERVICES: ServiceConfig[] = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', bgColor: 'bg-red-600', icon: '🎬', description: 'Movies & TV Shows' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', bgColor: 'bg-red-500', icon: '▶️', description: 'Videos & Live Streams' },
  { id: 'spotify', name: 'Spotify', color: '#1DB954', bgColor: 'bg-green-500', icon: '🎵', description: 'Music & Podcasts' },
  { id: 'twitch', name: 'Twitch', color: '#9146FF', bgColor: 'bg-purple-500', icon: '🎮', description: 'Live Streaming' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1', bgColor: 'bg-blue-500', icon: '📦', description: 'Movies & Originals' },
  { id: 'disney', name: 'Disney+', color: '#113CCF', bgColor: 'bg-blue-700', icon: '🏰', description: 'Disney, Marvel, Star Wars' },
  { id: 'hbo', name: 'HBO Max', color: '#B535F6', bgColor: 'bg-purple-600', icon: '🎭', description: 'Premium Series & Films' },
  { id: 'apple', name: 'Apple TV+', color: '#555555', bgColor: 'bg-gray-600', icon: '🍎', description: 'Apple Originals' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', bgColor: 'bg-green-400', icon: '📺', description: 'TV Shows & Movies' },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF', bgColor: 'bg-blue-600', icon: '⭐', description: 'CBS, Paramount Films' },
];

export const getServiceConfig = (id: StreamingService): ServiceConfig =>
  STREAMING_SERVICES.find((s) => s.id === id) || STREAMING_SERVICES[0];

export const PARTY_TAGS = [
  'Movie Night', 'Binge Watch', 'New Release', 'Classic', 'Horror',
  'Comedy', 'Action', 'Romance', 'Sci-Fi', 'Documentary',
  'Anime', 'K-Drama', 'Music', 'Gaming', 'Sports',
  'Chill', 'Late Night', 'Weekend', 'Series Premiere', 'Finale',
];

export const SAMPLE_THUMBNAILS = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop',
];

export const AVATAR_COLORS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-teal-500 to-green-500',
  'from-amber-500 to-yellow-500',
];

export const getAvatarColor = (userId: string): string => {
  const hash = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};
