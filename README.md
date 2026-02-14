# Grade Z - MVP

A modern customer support platform with AI-powered conversation management, built with React, Vite, and Supabase.

## Overview

Grade Z is a real-time customer support application that enables agents to manage conversations with customers. The platform features a clean, dark-themed interface with real-time message synchronization, conversation status tracking, and a comprehensive ticketing system.

## Features

- Real-time conversation management with live updates
- Multi-status conversation workflow (open, ai_handling, escalated, human_handling, closed)
- Message threading with support for customer, AI, and agent messages
- Beautiful gradient-based UI with dark theme
- Real-time message synchronization using Supabase Realtime
- Conversation status tracking and filtering
- Responsive design optimized for large screens

## Tech Stack

- React 19.2.0 - UI framework
- Vite 7.3.1 - Build tool and dev server
- Supabase - Backend as a Service (Database, Auth, Realtime)
- ESLint - Code linting

## Database Schema

The application uses PostgreSQL with the following main tables:

### Conversations
- Tracks conversation lifecycle with status management
- Statuses: open, ai_handling, escalated, human_handling, closed
- Auto-updated timestamps

### Messages
- Stores all conversation messages
- Sender types: customer, ai, agent
- Linked to conversations with cascade delete

### Tickets
- Support ticket management system
- Statuses: open, assigned, resolved, closed
- Linked to conversations

### Knowledge Base
- Stores support documentation and FAQs
- Categorized content for easy retrieval

### Profiles
- User role management (agent, admin)
- Integrated with Supabase Auth

## Security

The application implements Row Level Security (RLS) policies:
- Agents can read and update conversations
- Agents can read and insert messages
- Agents have full access to tickets
- Agents can read knowledge base articles
- Users can only read their own profiles

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/M-Magdy12/vite-project.git
cd vite-project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

Run the SQL schema from `SQL.txt` in your Supabase SQL editor to create all necessary tables, types, functions, and policies.

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
vite-project/
├── src/
│   ├── assets/          # Static assets
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── createClient.js  # Supabase client configuration
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Public assets
├── SQL.txt              # Database schema
├── .env                 # Environment variables (not in git)
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Project dependencies

```

## Key Components

### App.jsx
Main application component that handles:
- Conversation list management
- Real-time message updates
- Message sending and receiving
- Conversation creation
- Status management

### Supabase Integration
- Real-time subscriptions for instant message updates
- Secure authentication and authorization
- Row Level Security for data protection

## UI Features

- Gradient-based design with purple/blue theme
- Smooth animations and transitions
- Auto-scrolling message container
- Status badges with color coding
- Responsive layout for various screen sizes
- Empty states for better UX

## Contributing

This is a collaborative project. If you're a collaborator:

1. Pull the latest changes from main
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private project - All rights reserved
