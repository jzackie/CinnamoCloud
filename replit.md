# CinnamoCloud - File Management System

## Overview

CinnamoCloud is a modern web-based file management system with a kawaii-themed interface. The application allows users to upload, organize, and manage files in a cloud storage environment with features like favorites, folder organization, and trash management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state
- **UI Components**: Radix UI with custom styling
- **Styling**: Tailwind CSS with custom kawaii theme (Cinnamoroll/Kuromi colors)
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Authentication**: Passport.js with local strategy and session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local file system with multer for uploads
- **Session Management**: PostgreSQL session store

### Database Schema
- **Users**: Authentication and profile management
- **Folders**: Hierarchical folder structure with soft deletes
- **Files**: File metadata with folder association, favorites, and soft deletes

## Key Components

### Authentication System
- Local authentication with username/password
- Session-based authentication using PostgreSQL store
- Password hashing with scrypt
- Reset key system for account recovery
- Protected routes with authentication middleware

### File Management
- File upload with drag-and-drop support
- Folder organization with hierarchical structure
- File categorization by MIME type (images, videos, PDFs, documents)
- Favorite files system
- Soft delete with trash/restore functionality
- File preview for images and basic file types

### User Interface
- Responsive design with mobile support
- Dark/light theme toggle
- Kawaii-themed design with custom animations
- Grid and list view modes
- Search functionality across files and folders

## Data Flow

1. **Authentication Flow**: User logs in → Passport validates → Session created → Protected routes accessible
2. **File Upload Flow**: User selects files → Multer processes upload → File metadata stored in database → UI updates via React Query
3. **File Management Flow**: User actions (favorite, delete, restore) → API endpoints → Database updates → UI reflects changes
4. **Search Flow**: User types query → Client-side filtering → Results displayed in real-time

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **express**: Web framework
- **passport**: Authentication middleware
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Accessible UI components
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router
- **react-hook-form**: Form management
- **zod**: Schema validation

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- PostgreSQL database (can be local or remote)
- File uploads stored in local `uploads` directory

### Production
- Frontend built with Vite and served as static assets
- Backend bundled with esbuild for Node.js runtime
- Deployment target: Autoscale (configured for Replit deployment)
- Database migrations managed via Drizzle Kit

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- File storage directory: `uploads/` (created automatically)

## Changelog
- June 14, 2025. Initial setup
- June 14, 2025. Completed comprehensive internationalization system with 40+ translation keys for English, Japanese, Korean, and Chinese languages. Added real-time language switching throughout main navigation, authentication forms, profile management, search functionality, and file management interfaces. Fixed profile picture display issue by resolving path mismatch between file storage and database URLs.
- June 14, 2025. Completed comprehensive translation coverage for all remaining untranslated text elements including authentication page hero section, profile page sections, theme preferences, username sections, and welcome messages. Added 15+ new translation keys covering welcome messages, hero text, feature descriptions, and placeholder text. All text elements now properly translate across 6 languages (English, Japanese, Korean, Chinese, Spanish, French) for complete internationalization coverage.
- June 14, 2025. Fixed list view functionality by implementing proper viewMode conditional rendering and added comprehensive list view layout to FileCard component. Fixed missing dark mode CSS for upload buttons and cloud elements by adding Kuromi-themed variants for all light-mode-only styling including cloud backgrounds, button borders, and hover states. Improved cloud shape design to look more realistic with proper proportions and positioning. Fixed dark mode text visibility in auth page alert by adding proper text color classes for both themes. Enhanced theme toggle button visibility with semi-transparent background and stronger borders for better contrast. Fixed signup form compression by setting fixed width container instead of responsive max-width. Implemented comprehensive mobile responsiveness across entire application including auth page (stacked layout, responsive form sizing, mobile search bar), main drive interface (collapsible sidebar with icon-only buttons on small screens, responsive grid layout with 2-6 columns based on screen size), and file cards (scaled icons, text, and action buttons for mobile devices). Fixed remaining responsive issues with category navigation buttons (icon-only on mobile), action bar buttons (hidden text on small screens), storage info section (simplified mobile display), and breadcrumb navigation (truncated text and smaller icons). Updated cloud shapes to more realistic design with enhanced 3D styling using asymmetric border-radius and layered pseudo-elements with shadow effects. Replaced all loading animations from Cinnamoroll characters to modern donut spinners using SVG circles with customizable variants (classic spinning, bouncing, pulsing gradient). Redesigned cloud shapes to look like Cinnamoroll character with adorable ears, cute facial expression (eyes and mouth), fluffy body, and characteristic tail for enhanced kawaii theme integration. Improved cloud positioning by bringing circular sections closer to main body for more realistic cloud appearance. Added comprehensive translations for auth page including theme switch button, reset password modal, and all form fields across all 6 supported languages (English, Japanese, Korean, Chinese, Spanish, French).
- June 14, 2025. Fixed critical backend registration validation bug and simplified interface language. Added comprehensive server-side validation for user registration including required field validation, username/password length requirements, email format validation, and duplicate account prevention. Simplified interface by removing all "kawaii" and "cute" terminology across all 6 languages while maintaining Cinnamoroll theming for a cleaner, more professional appearance. Added reset key popup dialog after successful user registration with copy-to-clipboard and download functionality. Backend now properly validates: required fields (username, email, displayName, password), minimum username length (3 chars), minimum password length (6 chars), valid email format, and prevents duplicate usernames/emails. All validation messages are user-friendly and properly handled by frontend error display.

## User Preferences

Preferred communication style: Simple, everyday language.