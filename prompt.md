VibeSync Music Player App Prompt
Overview
VibeSync is a modern, offline-friendly Progressive Web App (PWA) music player built with React, TypeScript, Tailwind CSS,NextJS, node. It provides a seamless music listening experience with local storage, karaoke mode, and rich metadata extraction.

Core Features
🎵 Music Library Management
Local File Import: Upload audio files (MP3, M4A, etc.) directly from device
Metadata Extraction: Automatic extraction of title, artist, album, duration, cover art using FFmpeg and music-metadata library
Duplicate Detection: Prevents importing duplicate tracks based on filename and file size
Offline Storage: All music files stored locally in IndexedDB for offline playback
Playlist Creation: Create and manage custom playlists
Track Organization: Sort and filter tracks by various criteria
🎤 Karaoke Mode
Full-Screen Experience: Immersive karaoke interface with visual transitions
Transition Effects: Multiple customizable effects (Stage Curtain, Spotlight Sweep, Vinyl Spin, Neon Glow, Zoom & Blur)
Countdown Timer: 3-2-1 countdown before playback starts
Performance Scoring: Automatic scoring system at track completion
Lyrics Display: Placeholder for future lyrics synchronization
Speaker Recommendations: Tips for better audio experience
🎛️ Audio Player Features
Global Audio Singleton: Prevents multiple audio instances for smooth playback
Playback Controls: Play, pause, skip forward/backward, shuffle, repeat modes
Progress Seeking: Interactive progress bar with time display
Volume Control: Adjustable volume with persistence
Media Session API: Integration with device media controls
Visualizer: Real-time audio visualization with customizable bars
🎨 User Interface & Experience
Responsive Design: Optimized for desktop and mobile devices
Dark/Light Theme: System-aware theme switching with smooth transitions
PWA Installation: Installable as native app on desktop and mobile
Smooth Animations: Framer Motion animations throughout the interface
Haptic Feedback: Vibration feedback on supported devices
Ambient Mode: Subtle color-cycling background when idle
🔧 Settings & Customization
Theme Selection: Manual dark/light mode toggle
Karaoke Effects: Choose preferred transition effects
Auto-Scan: Option to automatically scan folders for new music
Haptics Toggle: Enable/disable vibration feedback
Ambient Mode: Toggle idle background effects
Data Management: Clear all app data and cache
📱 Progressive Web App Features
Offline Capability: Full functionality without internet connection
Installable: Add to home screen on mobile devices
Background Sync: Service worker for background operations
Manifest: Proper PWA manifest with icons and metadata
🔍 Search & Discovery
Global Search: Search across all tracks and playlists
Recently Played: Quick access to recently listened tracks
Most Played: Discover frequently played tracks
Favorites: Star tracks for quick access
📊 Analytics & Stats
Play Count Tracking: Automatic tracking of play counts
Last Played: Timestamp of last playback
Import History: Track import dates and sources
Technical Architecture
Frontend Stack
React 18 with TypeScript for type safety
Tailwind CSS for consistent, accessible UI components
Zustand for lightweight state management
Framer Motion for smooth animations
IndexedDB via idb library for local data storage
Audio Processing
FFmpeg for comprehensive metadata extraction
music-metadata library for tag parsing
Web Audio API for real-time visualization
Media Session API for device integration
Backend Integration
Formidable for multipart file handling
CORS enabled for cross-origin requests
Development Tools
ESLint for code quality
TypeScript for type checking
PWA plugins for service worker and manifest generation
User Journey
First Visit: User discovers the app and installs it as PWA
Import Music: Upload audio files from device or folders
Browse Library: Explore tracks, create playlists, mark favorites
Play Music: Use the full-screen player with rich controls
Karaoke Experience: Enter karaoke mode for immersive singing
Customize: Adjust settings, themes, and preferences
Offline Enjoyment: Continue using all features without internet
Key Differentiators
Offline-First: Complete functionality without network dependency
Rich Metadata: Professional-grade metadata extraction with cover art
Karaoke Innovation: Unique visual transition effects and scoring
PWA Excellence: Native app-like experience in the browser
Performance: Optimized for smooth playback and large libraries
Accessibility: Built with accessibility best practices