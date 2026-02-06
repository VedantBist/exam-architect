# Exam Architect

A comprehensive exam management and testing platform built with modern web technologies. Exam Architect provides a complete solution for creating exams, managing students, and tracking results with a secure authentication system.

## Features

- **User Authentication**: Secure login system powered by Supabase with role-based access control
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
- **Backend**: Supabase (PostgreSQL + Auth)
- **Testing**: Vitest
- **Code Quality**: ESLint

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or Bun package manager
- Supabase account (for database and auth)

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

# Configure environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local
```

### Development

```bash
# Start the development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:5173`

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
└── integrations/      # External service integrations (Supabase)
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run migrations from `supabase/migrations/`
3. Configure auth policies for students and admins

## Documentation

- [Authentication System](./AUTH_SYSTEM.md) - Detailed auth architecture
- [Project Report](./PROJECT_REPORT.md) - Comprehensive project overview
- [Quick Reference](./QUICK_REF.md) - Quick commands and tips

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Author

**Vedant Bisht** - [GitHub](https://github.com/VedantBist)
