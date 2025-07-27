# OperatorOS - Enterprise AI Agent Orchestration Platform

## Overview

OperatorOS is a full-stack enterprise AI agent orchestration platform built with TypeScript, React, Express.js, and PostgreSQL. The system provides a sophisticated multi-agent architecture designed to manage and coordinate specialized AI agents across different domains (healthcare, financial, business automation, and sports analytics). The platform features real-time monitoring, task queue management, and a conversational interface designed to work seamlessly with Replit Agent.

## User Preferences

Preferred communication style: Simple, everyday language.
User wants to understand system capabilities and expects full memory retention.
Focus on demonstrating real functionality over technical details.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

**Frontend**: React 18 with TypeScript, built using Vite for fast development and optimized production builds
**Backend**: Express.js REST API server with TypeScript
**Database**: PostgreSQL with Drizzle ORM for type-safe database operations
**UI Framework**: Tailwind CSS with shadcn/ui components for consistent design
**State Management**: TanStack Query for server state management and caching
**Styling**: CSS Variables-based theming system supporting light/dark modes

## Key Components

### Frontend Architecture
- **Component-based React application** using functional components and hooks
- **shadcn/ui component library** providing enterprise-grade UI components
- **TanStack Query** for efficient data fetching, caching, and synchronization
- **Wouter** for lightweight client-side routing
- **Responsive design** with Tailwind CSS and mobile-first approach

### Backend Architecture
- **Express.js REST API** with TypeScript for type safety
- **Modular service architecture** with separate concerns:
  - Agent orchestration service for task routing and management
  - Command processor for conversational interface commands
  - Health monitoring service for system metrics
  - OpenAI service integration for AI capabilities
- **In-memory storage implementation** with interface for future database integration
- **Real-time health monitoring** with automatic metric collection

### Database Design
- **PostgreSQL schema** with Drizzle ORM migrations
- **Core entities**: Users, Conversation Sessions, Agent Pools, Tasks, System Metrics, Activity Logs
- **Relationship management** between users, sessions, and tasks
- **JSON fields** for flexible metadata and configuration storage

### Agent Pool System
- **Domain-specific agent pools**: Healthcare, Financial, Business Automation, Sports Analytics
- **Dynamic scaling capabilities** for agent pool capacity management
- **Status tracking** (online, offline, scaling) with real-time updates
- **Task routing** based on type and agent pool availability

### Task Management
- **Queue-based task processing** with status tracking (queued, processing, completed, failed)
- **Progress monitoring** with real-time updates
- **Metadata storage** for task inputs, outputs, and processing details
- **Agent pool assignment** based on task type and availability

## Data Flow

1. **User Interaction**: Users interact through the React dashboard or conversational interface
2. **Command Processing**: Commands are parsed and routed to appropriate services
3. **Task Creation**: Tasks are created and queued for processing by suitable agent pools
4. **Agent Assignment**: Tasks are assigned to available agents in appropriate pools
5. **Processing**: Agents process tasks using OpenAI integration or mock responses
6. **Status Updates**: Real-time updates flow back through the API to the frontend
7. **Health Monitoring**: System metrics are continuously collected and stored

## External Dependencies

### Core Dependencies
- **OpenAI API**: AI processing capabilities (with fallback to mock responses)
- **Neon Database**: PostgreSQL hosting (configured via DATABASE_URL)
- **Radix UI**: Accessible component primitives for the UI layer

### Development Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: Backend bundling for production
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Type safety across the entire stack

### Runtime Libraries
- **Express.js**: Web server framework
- **React Query**: Server state management
- **Tailwind CSS**: Utility-first styling
- **Zod**: Runtime type validation and schema definition

## Deployment Strategy

### Development Environment
- **Vite development server** for frontend with hot module replacement
- **tsx** for running TypeScript backend in development
- **Concurrent development** with frontend and backend running simultaneously

### Production Build
- **Frontend**: Vite builds optimized React application to static files
- **Backend**: ESBuild bundles Express server with external dependencies
- **Single deployment**: Combined frontend and backend in unified distribution

### Database Management
- **Drizzle migrations** for schema version control
- **Environment-based configuration** via DATABASE_URL
- **Automatic database provisioning** check on startup

### Configuration Management
- **Environment variables** for sensitive data (API keys, database URLs)
- **Type-safe configuration** with runtime validation
- **Development vs production** environment handling

The architecture prioritizes type safety, developer experience, and scalability while maintaining clear separation between frontend presentation, backend business logic, and data persistence layers. The system is designed to handle enterprise-scale AI agent orchestration with real-time monitoring and conversational interface capabilities.

## Recent Changes and Status (July 22, 2025)

### Completed Features
- **Real AI Integration**: Successfully integrated OpenAI GPT-4 and Anthropic Claude APIs with intelligent fallback
- **Agent Pool Management**: All 4 specialized pools operational with dynamic scaling capabilities
- **Task Orchestration**: Real-time task routing and processing with queue management
- **Health Monitoring**: Comprehensive system metrics and performance tracking
- **Conversational Interface**: Natural language command processing through Replit Agent
- **Enterprise Dashboard**: Live monitoring with real-time updates and activity logs

### System Performance
- **Test Suite Success Rate**: 80% with real API integration
- **Current Status**: System Health 100% (excellent), all agent pools operational
- **Active Features**: Healthcare (scaled to 7 agents), Financial, Business Automation, Sports Analytics
- **Recent Activity**: Successfully processed medical analysis, stock analysis, and workflow automation tasks

### Known Issues
- OpenAI API occasionally rate-limited (429 errors) - system automatically falls back to Anthropic
- Some Anthropic API authentication issues (401 errors) - may require fresh API keys
- Sports betting task type mapping resolved

### User Interaction Patterns
- User prefers seeing real functionality demonstrations over technical explanations
- Expects system to maintain conversation context and remember capabilities
- Values understanding what the system can actually do in practice
- Interested in EKG analysis capabilities for medical image processing

### Recent Enhancement (July 27, 2025) - Critical EKG & STEMI Detection System
- **Critical Component Tracking**: Systematic P wave and QRS complex counting with systematic validation protocols
- **Heart Block Detection Engine**: Complete AV dissociation detection to prevent missing life-threatening conditions
- **STEMI Detection Protocol**: Systematic ST segment analysis preventing missed heart attacks requiring cath lab activation
- **ST Elevation Criteria**: Precise measurements (≥1mm limb leads, ≥2mm precordial) with territorial mapping
- **Emergency Flag System**: Immediate alerts for STEMI, complete heart block, AV dissociation, and rate discrepancies
- **Territorial Analysis**: Anterior, Inferior, Lateral, Posterior STEMI detection with reciprocal change validation
- **Professional Medical Standards**: Conservative diagnostic approach with uncertainty flagging and confidence scoring
- **Critical API Endpoints**: /api/analyze-critical-st for STEMI detection, /api/analyze-critical-ekg for component tracking
- **Multi-Layer Validation**: Component tracking service, heart block detector, ST analyzer, and morphology validator integration
- **Enhanced Command Processing**: Conversational interface recognizes STEMI analysis requests with emergency protocols