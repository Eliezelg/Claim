# Flight Compensation Platform

## Overview

This is a multilingual flight compensation platform that helps passengers claim indemnification for disrupted flights (delays, cancellations, boarding denials) under European CE 261/2004 and Israeli regulations. The platform automates the verification of compensation rights, calculates amounts due, and manages claims end-to-end with a focus on Hebrew (RTL), French, English, and Spanish markets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite build system
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, React Context for global state
- **Routing**: Wouter for client-side routing
- **Internationalization**: Custom i18n system with RTL support for Hebrew
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: JWT-based authentication with access tokens and refresh tokens
- **File Uploads**: Multer middleware for document handling
- **API Design**: RESTful endpoints with consistent error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **Token Storage**: In-memory access tokens with HttpOnly refresh token cookies
- **File Storage**: Local filesystem for document uploads (uploads/ directory)
- **Connection**: Neon serverless with WebSocket support

### Key Business Logic
- **Compensation Calculator**: Implements EU 261/2004 and Israeli ASL regulations
- **Flight Data Service**: Mock flight data with real-world structure for demonstration
- **Email Service**: SendGrid integration for claim notifications and status updates
- **Document Management**: Multi-type file upload system (boarding passes, receipts, IDs)

### Authentication and Authorization
- **Provider**: JWT-based authentication with Argon2 password hashing
- **Token Management**: Access tokens (15min) and refresh tokens (30d) stored in secure HttpOnly cookies
- **User Storage**: User table schema with email/password authentication and role-based access control
- **Middleware**: Protected routes with authentication checks

### Multi-language Support
- **Languages**: Hebrew (RTL primary), French, English, Spanish
- **RTL Support**: CSS direction handling and component layout adjustments
- **Context Provider**: Language switching with browser detection and localStorage persistence

## External Dependencies

### Third-party Services
- **Neon Database**: PostgreSQL serverless database hosting
- **SendGrid**: Email delivery service for notifications
- **JWT Authentication**: Custom JWT-based authentication with secure token management

### Payment Integration
- **Stripe**: Payment processing (React Stripe.js integration configured)

### UI and Development
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Pre-built component library

### Build and Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Backend bundling for production

### File Upload and Processing
- **Multer**: Node.js middleware for handling multipart/form-data
- **File Type Validation**: JPEG, PNG, PDF support with size limits

### Database Schema
- Core entities: users, claims, documents, flights, airports, airlines
- Claim status workflow: DRAFT → SUBMITTED → UNDER_REVIEW → NEGOTIATING → APPROVED/REJECTED → PAID
- Document types: boarding passes, receipts, passports, IDs
- Timeline tracking for claim progress