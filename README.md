# Real-Time Team Chat Application

A production-quality Slack/Discord clone built with the MERN stack + Socket.IO and Tailwind CSS.

## Features
- **Real-Time Messaging**: Built with Socket.IO for instant communication.
- **Workspaces & Channels**: Create and join workspaces with channel-based conversations.
- **Authentication**: JWT and bcrypt based secure authentication.
- **Audit Logs**: PostgreSQL integration using Prisma to track workspace and channel creation events.
- **Modern UI**: Styled with Tailwind CSS v4 and Lucide React icons.

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (for databases)

## Quick Start
1. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```
2. **Setup Backend**:
   ```bash
   cd server
   npm install
   npx prisma db push
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
