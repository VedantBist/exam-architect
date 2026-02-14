# Exam Architect

A comprehensive exam management and testing platform built with modern web technologies. Exam Architect provides a complete solution for creating exams, managing students, and tracking results with a secure authentication system.

## Features

- **User Authentication**: Role-based login/signup flows for admin and student users
- **Admin Dashboard**: Create, manage, and monitor exams with comprehensive analytics
- **Student Dashboard**: View available exams, take exams, and track results
- **Exam Creation**: Intuitive interface for creating exams with multiple question types
- **Real-time Results**: Instant feedback and detailed result tracking
- **Responsive Design**: Fully responsive UI that works on desktop and mobile devices
- **TypeScript Support**: Full type safety across the application

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn-ui + Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Local mode (browser storage) or Spring Boot API (`backend/`)
- **Testing**: Vitest
- **Code Quality**: ESLint

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or Bun package manager
- Java 21 + Maven (for Spring Boot backend mode)

### Installation

```bash
# Clone the repository
git clone https://github.com/VedantBist/exam-architect.git

# Navigate to the project directory
cd exam-architect

# Install dependencies
npm install
# or
bun install

# Configure environment variables (optional for API mode)
cp .env .env.local
```

### Development

```bash
# Start the development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:5173`

### Backend API Mode (Spring Boot)

By default, frontend runs in local mode. To route data to Spring Boot backend, set:

```bash
VITE_BACKEND_MODE=api
VITE_BACKEND_URL=http://localhost:8080/api/v1
```

If `VITE_BACKEND_MODE` is omitted (or set to `local`), the app uses localStorage fallback.

To run Spring Boot backend, see `backend/README.md`.

### Build

```bash
# Build for production
npm run build
# or
bun run build

# Preview production build
npm run preview
# or
bun run preview
```

### Testing

```bash
# Run tests
npm run test
# or
bun run test
```

## Project Structure

```
src/
├── pages/              # Page components (Auth, Dashboard, etc.)
├── components/         # Reusable UI components
│   ├── ui/            # shadcn-ui components
│   ├── auth/          # Authentication components
│   └── layout/        # Layout components
├── lib/               # Utility functions and helpers
├── hooks/             # Custom React hooks
├── data/              # Static data and seeds
└── integrations/      # External service integrations
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```
VITE_BACKEND_MODE=local
VITE_BACKEND_URL=http://localhost:8080/api/v1
```

## Documentation

- [Authentication System](./AUTH_SYSTEM.md) - Detailed auth architecture
- [Project Report](./PROJECT_REPORT.md) - Comprehensive project overview
- [Quick Reference](./QUICK_REF.md) - Quick commands and tips
- [Backend Migration Checklist](./docs/backend-migration/migration-checklist.md) - Phase-by-phase parity tracker
- [Cutover Runbook](./docs/backend-migration/cutover-runbook.md) - Staging/prod deploy, monitoring, rollback

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Author

**Vedant Bist** - [GitHub](https://github.com/VedantBist)
