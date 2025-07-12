# CounselFlow Ultimate

A comprehensive counseling practice management system built with modern web technologies.

## 🚀 Features

- **Client Management**: Comprehensive client profiles and records
- **Appointment Scheduling**: Flexible scheduling system with calendar integration
- **Session Notes**: Detailed session documentation and progress tracking
- **User Management**: Role-based access control (Admin, Counselor, Client)
- **Dashboard Analytics**: Practice insights and reporting
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

This is a monorepo built with:

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **UI**: React with Tailwind CSS
- **Package Manager**: npm with workspaces
- **Build Tool**: Turbo

### Project Structure

```
CounselFlow-Ultimate/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Express.js backend API
├── packages/
│   ├── ui/           # Shared React components
│   ├── shared/       # Shared utilities and types
│   └── database/     # Prisma schema and database client
└── .vscode/          # VS Code configuration
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm 10+

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   cd packages/database
   npx prisma generate
   npx prisma db push
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

This will start:
- Web app: http://localhost:3000
- API server: http://localhost:3001

## 📦 Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all applications for production
- `npm run lint` - Run ESLint across all packages
- `npm run test` - Run tests across all packages
- `npm run clean` - Clean all build outputs

## 🗃️ Database

The application uses SQLite with Prisma ORM. The database schema includes:

- **Users**: Authentication and role management
- **Clients**: Client profiles and contact information
- **Appointments**: Scheduling and appointment management
- **Sessions**: Session notes and progress tracking

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Create and run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

## 🎨 UI Components

The `@counselflow/ui` package contains reusable React components:

- Button
- Form components
- Modal dialogs
- Data tables
- And more...

## 📱 Responsive Design

The application is built with mobile-first responsive design using Tailwind CSS, ensuring optimal user experience across all devices.

## 🔐 Authentication & Authorization

Role-based access control with three user types:
- **Admin**: Full system access
- **Counselor**: Client and session management
- **Client**: Limited access to own information

## 🚀 Deployment

The application can be deployed on various platforms:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Docker** containers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact [your-email@example.com] or create an issue in the repository.
