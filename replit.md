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

## User Preferences

Preferred communication style: Simple, everyday language.