# Learnflow - Enhanced Educational Platform

A comprehensive MERN-stack educational platform with personalized learning, progress tracking, and content management.

## Enhanced Features Overview

### Authentication & Authorization
- ✅ JWT-based authentication with token expiration
- ✅ Role-based access control (User/Admin)
- ✅ Secure password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Protected routes with middleware

### Content Management
- ✅ Complete CRUD operations for Subjects, Books, and Chapters
- ✅ Advanced filtering and pagination
- ✅ Search functionality across titles and authors
- ✅ Chapter management with full content support
- ✅ Rich metadata tracking (difficulty levels, descriptions)

### Progress Tracking
- ✅ Per-user progress tracking across books and chapters
- ✅ Completion statistics and analytics
- ✅ Real-time progress updates
- ✅ Chapter completion marking
- ✅ Progress reset functionality

### Study Features (Oct 2026)
- ✅ SM-2 spaced repetition for flashcards (Anki-style easiness/interval/repetitions, lazy migration from legacy scheduler)
- ✅ Focus timer (Pomodoro presets 25/50/5/15 + custom, pause/resume, Web-Worker ticker immune to background-tab throttling, XP for completed focus sessions)
- ✅ Quiz upgrades: per-attempt question shuffle, optional per-quiz time limit with auto-submit, answer-review screen with explanations
- ✅ Flashcard review: keyboard shortcuts (Space to flip, 1–4 to grade), SM-2 interval feedback, end-of-session summary
- ✅ Dashboard: "Today" strip (due flashcards, focus minutes) + 16-week GitHub-style study heatmap
- ✅ Notes: instant client-side search across text, book and chapter titles
- ✅ Cloze deletion cards: write `{{c1::answer}}` / `{{c1::answer::hint}}` in notes, generate one card per cloze ordinal (Anki-style), review with styled blanks
- ✅ Missed quiz questions auto-enter the flashcard review queue (no duplicates; repeat misses resurface the card)

### API Enhancements
- ✅ Comprehensive input validation middleware
- ✅ Error handling with proper HTTP status codes
- ✅ MongoDB ObjectId validation
- ✅ Duplicate entry prevention
- ✅ Graceful error responses with success flags

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally on default port 27017)

### Server Setup

```bash
cd server
npm install
npm run seed    # Seed database with initial data
npm run dev     # Start development server on port 5000
```

### Client Setup

```bash
cd client
npm install
npm run dev     # Start Vite dev server (default: port 5173)
```

### Environment Variables

Copy `.env.example` to `server/.env` and configure:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens (change in production)
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `CLIENT_URL`: Frontend URL for CORS

## Enhanced API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (with validation)
- `POST /api/auth/login` - Login user (with validation)
- `GET /api/auth/me` - Get current user profile (protected)

### Subjects (Public & Admin)
- `GET /api/subjects` - List all subjects with book counts
- `GET /api/subjects/:id` - Get single subject
- `POST /api/subjects` - Create new subject (Admin only)
- `PUT /api/subjects/:id` - Update subject (Admin only)
- `DELETE /api/subjects/:id` - Delete subject (Admin only)

### Books (Public & Admin)
- `GET /api/books` - List books with pagination & filtering
- `GET /api/books/:id` - Get single book with chapters
- `GET /api/books/:id/stats` - Get book statistics
- `POST /api/books` - Create new book (Admin only)
- `PUT /api/books/:id` - Update book (Admin only)
- `DELETE /api/books/:id` - Delete book (Admin only)

### Chapters (Public & Admin)
- `GET /api/chapters/book/:bookId` - Get chapters for a book
- `GET /api/chapters/:id` - Get single chapter with content
- `GET /api/chapters/book/:bookId/count` - Get chapter count
- `POST /api/chapters` - Create new chapter (Admin only)
- `PUT /api/chapters/:id` - Update chapter (Admin only)
- `DELETE /api/chapters/:id` - Delete chapter (Admin only)

### Progress Tracking (Authenticated Users)
- `GET /api/progress/:userId` - Get user's progress
- `GET /api/progress/:userId/book/:bookId` - Get progress for specific book
- `POST /api/progress` - Update or create progress
- `POST /api/progress/complete-chapter` - Mark chapter as complete
- `DELETE /api/progress/:userId/book/:bookId` - Reset progress for a book

### Flashcards (SM-2 spaced repetition)
- `GET /api/flashcards/due?userId=` - Cards due for review (with SM-2 state)
- `POST /api/flashcards/review` - Grade a card (`Again|Hard|Good|Easy`); returns `nextReviewInDays`, easiness factor, XP
- `POST /api/flashcards/from-note` - Generate cloze deletion cards from a note's `{{c1::...}}` markup (one card per ordinal, idempotent)
- Wrong quiz answers auto-create `quiz-miss` review cards on `POST /api/quiz/submit` (returns `srsQueued`)

### Study Sessions (Focus timer)
- `POST /api/study/sessions` - Start a session (`focus|short-break|long-break`, planned minutes, optional subject)
- `POST /api/study/sessions/:id/complete` - Complete; awards XP for focus ≥ 5 min
- `POST /api/study/sessions/:id/abandon` - Abandon a running session
- `GET /api/study/stats/:userId?days=7` - Focus minutes/sessions per day

### Quizzes
- `GET /api/quizzes` - List quizzes (with question counts)
- `GET /api/quizzes/:id` - Quiz with questions (answers never leaked; includes `timeLimitMinutes`)
- `POST /api/quiz/submit` - Submit; returns score, XP, per-answer review with explanations

### System
- `GET /api/health` - Health check endpoint
- `GET /api` - API documentation

## Request/Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message",
  "count": 10, // For list responses
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific validation errors"] // Optional
}
```

## Validation Rules

### User Registration/Login
- Email: Valid email format, required
- Password: Minimum 6 characters, required
- Name: Required, trimmed

### Books & Chapters
- Title: 2-200 characters, required
- Author: 2-100 characters, required  
- Description: Optional, max 1000 characters
- Chapter Number: 1-999, required
- Content: Required for chapters

### Subjects
- Name: 2-100 characters, required
- Description: Optional, max 500 characters

## Security Features

1. **Authentication Middleware**: All protected routes require valid JWT token
2. **Role-Based Access Control**: Admin-only routes for content management
3. **Input Sanitization**: All user inputs are trimmed and validated
4. **Password Security**: bcrypt hashing with salt rounds
5. **CORS Configuration**: Restricts origins to configured client URL
6. **Error Handling**: Prevents sensitive information leakage

## Database Models

### User Model
- Name, Email (unique), Password, Role (user/admin), Timestamps

### Subject Model  
- Name (unique), Description, Timestamps

### Book Model
- Title, Author, Subject (reference), Difficulty (Beginner/Intermediate/Advanced), Description, Cover Image, Timestamps

### Chapter Model
- Book (reference), Chapter Number, Title, Content, Pages, Timestamps

### Progress Model
- User (reference), Book (reference), Chapter (reference), Last Page Read, Completed Chapters (array), Timestamps
- Compound index for (user, book) uniqueness

## Testing Instructions

1. Start MongoDB: `mongod`
2. Run server: `cd server && npm run dev`
3. Run client: `cd client && npm run dev`
4. Test registration/login flow
5. Browse catalogue with filtering/search
6. Test book reader with progress tracking
7. Test admin functionality (if using admin account)

## Development Notes

- Use `npm run seed` to populate database with sample data
- Admin accounts can be created by setting `role: 'admin'` in the database
- All API calls require proper authentication headers for protected routes
- Environment-specific configurations are managed via .env files
- Error logs are saved to console with appropriate log levels

## Deployment Considerations

1. Change `JWT_SECRET` to a strong, random string
2. Set `NODE_ENV=production` in production
3. Configure production MongoDB URI
4. Set appropriate CORS origins for production client
5. Consider adding rate limiting for production
6. Implement HTTPS for all production endpoints
