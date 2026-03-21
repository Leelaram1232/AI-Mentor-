# CareerPath - AI-Powered Career Learning Path Platform

A modern Career Learning Path platform with:
- Next.js frontend (landing page, onboarding, dashboard)
- Django REST backend (authentication, resources, recommendations)
- PostgreSQL database (recommended)

## Features

- 🎯 **Personalized Onboarding**: Multi-step flow with smooth animations
- 🤖 **AI-Powered Suggestions**: Optional Groq integration for personalized experience labels, skills, and career paths
- 📊 **Interactive Visualization**: Circular career map showing relevance and impact of different career paths
- 🎨 **Modern UI**: Clean, minimal design with MUI components and Framer Motion animations
- 🔐 **Authentication**: Email/password auth via Django + JWT
- 💾 **State Persistence**: Zustand store + backend user preferences
- ⚡ **Fast & Responsive**: Built with Next.js 16 and React 19

## Tech Stack

- **Frontend**: Next.js 16.1.1
- **UI Library**: Material-UI (MUI)
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Backend**: Django + Django REST Framework
- **Auth**: JWT (SimpleJWT)
- **Database**: PostgreSQL (recommended), SQLite fallback for quick local run
- **Web Scraping**: Python + Requests + BeautifulSoup (starter scraper included)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Python 3.10+ installed
- Docker (recommended, for PostgreSQL)
- (Optional) Groq API key (get one at [console.groq.com](https://console.groq.com/keys))

### 1) Frontend setup (Next.js)

```bash
npm install
```

Run the frontend:

```env
# Optional (AI suggestions)
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

# Backend API base URL (Django)
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

Open:
- `http://localhost:3000` (Landing)
- `http://localhost:3000/auth/signup` (Sign up)
- `http://localhost:3000/auth/login` (Login)
- `http://localhost:3000/dashboard` (Dashboard)

### 2) Backend setup (Django REST + PostgreSQL)

The backend lives in `backend/`.

Start PostgreSQL (recommended):

```bash
cd backend
docker compose up -d
```

Create `backend/.env` (you can copy from `backend/.env.example`) and set:

```env
DJANGO_SECRET_KEY=replace-me
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=careerpath
DB_USER=careerpath
DB_PASSWORD=careerpath
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Install backend deps + migrate:

```bash
python -m pip install -r backend/requirements.txt
python backend/manage.py makemigrations
python backend/manage.py migrate
python backend/manage.py seed_demo
python backend/manage.py runserver 8000
```

### Useful backend endpoints

- **Auth**
  - `POST /api/auth/register/`
  - `POST /api/auth/login/`
  - `GET /api/auth/me/`
- **Learning**
  - `GET /api/career-paths/`
  - `GET /api/resources/`
  - `GET /api/preferences/me/` + `PATCH /api/preferences/me/`
  - `GET /api/recommendations/me/`
  - `GET /api/activity/` + `POST /api/activity/`

### Scraping (starter)

Scrape freeCodeCamp News tag pages and store resources:

```bash
python backend/manage.py scrape_resources --source freecodecamp --tag javascript --limit 10 --career-path-slug frontend-developer
```

## Project Structure

```
├── app/
│   ├── onboarding/          # Onboarding flow pages
│   │   ├── page.js          # Landing page
│   │   ├── step1/           # Current self & future goals
│   │   ├── step2/           # Experience & skills
│   │   └── results/         # Career visualization
│   ├── globals.css          # Global styles & design tokens
│   ├── layout.js            # Root layout with Header
│   └── page.js              # Home page
├── components/
│   ├── UI/                  # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── SkillPicker.jsx
│   ├── Layout/              # Layout components
│   │   ├── Header.jsx
│   │   └── ProgressBar.jsx
│   └── CareerVisualization/
│       └── CircularCareerMap.jsx
├── store/                   # Zustand state management (onboarding)
├── utils/                   # Frontend utilities (auth client, groq client)
└── backend/                 # Django REST API + scraping + database models
```

## User Flow

1. **Home Page**: Landing page with overview and CTA
2. **Onboarding Landing**: Introduction to the journey
3. **Step 1**: User describes current self (50 words max) and future goals
4. **Step 2**: AI generates personalized experience categories and skill suggestions
5. **Results**: Interactive circular visualization of career paths with relevance and impact scores

## Design System

The application uses a minimal, clean design system with:

- **Colors**: Primary blue (#2563eb), clean backgrounds, semantic colors
- **Typography**: Inter font family with responsive sizing
- **Spacing**: Consistent spacing scale (xs to xl)
- **Animations**: Smooth, controlled transitions with Framer Motion
- **Layout**: Centered, single-input focused design pattern

## AI Integration

The platform uses Groq's `llama-3.3-70b-versatile` model to generate:

1. **Experience Labels**: Personalized categories based on user's current self and goals
2. **Skill Suggestions**: Relevant skills tailored to experience and aspirations
3. **Career Paths**: Potential career positions with relevance and impact scores

## State Management

Zustand store manages:
- Current onboarding step
- User data (self description, goals, experience, skills)
- AI-generated suggestions
- Loading states
- Persistence to local storage

## Customization

### Modify Design Tokens

Edit `app/globals.css` to customize colors, spacing, typography, etc.

### Adjust AI Prompts

Edit `utils/groqApi.js` to modify the prompts sent to Groq API

### Change Visualization

Edit `components/CareerVisualization/CircularCareerMap.jsx` and `utils/careerPositioning.js`

## Build for Production

```bash
npm run build
npm start
```

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
