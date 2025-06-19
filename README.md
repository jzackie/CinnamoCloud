# CinnamoCloud - File Management System

## Overview

CinnamoCloud is a modern web-based file management system with a cute themed interface. It lets you upload, organize, and manage your files in the cloud. Key features include favorites, folder organization, and a trash system.

---

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript  
- **Routing:** Wouter for client-side routing  
- **State Management:** React Query (TanStack Query)  
- **UI Components:** Radix UI with custom styling  
- **Styling:** Tailwind CSS using a custom kawaii theme inspired by Cinnamoroll and Kuromi colors  
- **Build Tool:** Vite  

### Backend
- **Runtime:** Node.js with Express.js  
- **Authentication:** Passport.js (local strategy) with session-based auth  
- **Database:** PostgreSQL with Drizzle ORM  
- **File Storage:** Local filesystem with multer for uploads  
- **Session Management:** PostgreSQL session store  

### Database Schema
- **Users:** Manages authentication and profiles  
- **Folders:** Hierarchical folders with soft delete support  
- **Files:** Metadata linked to folders, favorites, and soft deletes  

---

## Key Features

### Authentication
- Username/password login  
- Session-based auth with PostgreSQL sessions  
- Password hashing with scrypt  
- Account recovery using reset keys  
- Protected routes requiring login  

### File Management
- Drag-and-drop file uploads  
- Organize files in nested folders  
- File types categorized (images, videos, PDFs, documents)  
- Mark files as favorites  
- Soft delete with trash and restore options  
- Preview images and common file types  

### User Interface
- Responsive design, works well on mobile  
- Dark and light mode toggle  
- Cute, kawaii-inspired look with animations  
- Switch between grid and list views  
- Search files and folders in real-time  

---

## How It Works (Data Flow)

1. **Login:** User enters credentials → Passport checks → Session created → Access granted to protected pages  
2. **Upload Files:** User uploads → Multer saves files → Metadata saved in database → UI updates via React Query  
3. **Manage Files:** Actions like favorite/delete/restore → API updates database → UI reflects changes  
4. **Search:** User types query → Client filters results instantly → Matches shown immediately  

---

## Dependencies

### Core
- `@neondatabase/serverless` – PostgreSQL connection pooling  
- `drizzle-orm` – Type-safe database ORM  
- `@tanstack/react-query` – Server state management  
- `express` – Backend framework  
- `passport` – Authentication middleware  
- `multer` – File upload handling  

### UI
- `@radix-ui/*` – Accessible UI components  
- `tailwindcss` – CSS framework  
- `wouter` – Lightweight routing  
- `react-hook-form` – Form management  
- `zod` – Validation  

---

## Deployment

### Development
- Vite dev server with hot module reload (HMR) for frontend  
- Express server using TypeScript with `tsx`  
- PostgreSQL database (local or remote)  
- Files saved in local `uploads/` folder  

### Production
- Frontend built by Vite, served as static files  
- Backend bundled with esbuild for Node.js  
- Database migrations via Drizzle Kit  

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string  
- `SESSION_SECRET` — Secret for encrypting sessions  
- File uploads saved in `uploads/` folder (auto-created)  

---

## Changelog

- **June 14, 2025** — Initial project setup  
- Added multi-language support with 40+ translation keys (English, Japanese, Korean, Chinese)  
- Real-time language switching in navigation, auth forms, profile, search, and file management  
- Fixed profile picture display issues and path mismatches  
- Completed translations for authentication, profile, themes, and welcome messages across six languages including Spanish and French  
- Improved UI responsiveness and fixed dark mode styling issues  
- Redesigned cloud shapes and animations for a better kawaii theme experience  
- Replaced loading animations with modern spinners  
- Fixed critical backend registration validation bugs  
- Simplified UI language by removing some “kawaii” terminology for a cleaner look  
- Added reset key popup after registration with copy and download options  
- Backend now validates user inputs thoroughly with friendly messages  

---