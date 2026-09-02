# Recruitment Simulation System

A modern, AI-powered recruitment simulation platform built for InnovateX Hackfest 2025.

## 🚀 Features

### For Recruiters
- **Scenario Builder**: Create custom assessment scenarios with multiple question types (MCQ, text, coding)
- **AI Evaluation**: Intelligent response analysis powered by Google Gemini AI
- **Dashboard Analytics**: Comprehensive insights on applicant performance
- **Customization**: Configure passing scores, time limits, and evaluation criteria
- **Response Management**: View and analyze all applicant submissions

### For Applicants
- **Browse Scenarios**: Explore available assessments across different categories
- **Immersive Simulations**: Full-screen assessment experience with timer and progress tracking
- **Instant Feedback**: Receive detailed scores and AI-generated feedback
- **Performance Tracking**: View history and track improvement over time
- **Detailed Results**: Question-by-question analysis with strengths and improvements

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **SQLite** (better-sqlite3) - Lightweight database
- **JWT** - Secure authentication
- **bcrypt** - Password hashing
- **Google Gemini AI** - AI-powered evaluation

### Frontend
- **Vanilla HTML/CSS/JavaScript** - No framework dependencies
- **Glassmorphism UI** - Modern, premium design
- **Dark Theme** - Eye-friendly interface
- **Responsive Design** - Works on all devices

## 📦 Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd InnovateXHackfest2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and set:
   - `JWT_SECRET`: A random secret key for JWT signing
   - `GEMINI_API_KEY`: (Optional) Your Google Gemini API key for AI evaluation
     - Get your key from: https://makersuite.google.com/app/apikey

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   Navigate to: `http://localhost:3000`

## 🎯 Quick Start Guide

### Creating Your First Scenario (Recruiter)

1. Click "Login" and create an account with role "Recruiter"
2. Navigate to "Scenarios" → "Create New"
3. Fill in scenario details:
   - Title and description
   - Category and difficulty level
   - Time limit and passing score
4. Add questions:
   - Choose question type (Multiple Choice, Text, or Coding)
   - Enter question text
   - Configure evaluation criteria
5. Click "Create Scenario"

### Taking an Assessment (Applicant)

1. Click "Login" and create an account with role "Applicant"
2. Browse available scenarios
3. Click "Start Assessment" on a scenario
4. Answer questions within the time limit
5. Submit and view detailed results with AI feedback

## 📊 Database Schema

```sql
-- Users
id, name, email, password_hash, role (recruiter/applicant), created_at

-- Scenarios
id, title, description, category, difficulty, questions_json, 
time_limit, passing_score, created_by, created_at, customizations_json

-- Responses
id, scenario_id, applicant_id, answers_json, submitted_at, time_spent,
scores_json, ai_evaluation_json, total_score
```

## 🤖 AI Evaluation

The system supports AI-powered evaluation using Google Gemini:

- **Text Answers**: Contextual analysis against rubrics
- **Coding Challenges**: Code quality, correctness, and best practices
- **Overall Insights**: Strengths, improvements, and recommendations

If no API key is provided, the system falls back to keyword-based scoring.

## 🎨 Design Highlights

- **Glassmorphism Effects**: Modern frosted-glass UI elements
- **Vibrant Gradients**: Purple-pink-blue color palette
- **Smooth Animations**: Micro-interactions on all UI elements
- **Premium Typography**: Inter font family
- **Dark Mode**: Eye-friendly default theme

## 📁 Project Structure

```
InnovateXHackfest2025/
├── server/
│   ├── server.js           # Express server
│   ├── database.js         # SQLite database layer
│   ├── scoring-engine.js   # Evaluation logic
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   └── routes/
│       ├── auth.js         # Auth endpoints
│       ├── scenarios.js    # Scenario CRUD
│       ├── responses.js    # Response management
│       └── analytics.js    # Analytics endpoints
├── js/
│   ├── app.js              # Main app controller
│   ├── api.js              # API client
│   ├── auth.js             # Auth manager
│   ├── utils.js            # Utility functions
│   ├── recruiter.js        # Recruiter dashboard
│   └── applicant.js        # Applicant dashboard
├── index.html              # Main HTML page
├── styles.css              # Global styles
└── package.json            # Dependencies
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Input sanitization
- SQL injection prevention (prepared statements)

## 🏆 Judging Criteria Alignment

- **Innovation**: AI-powered evaluation, glassmorphism UI, comprehensive analytics
- **Usability**: Intuitive interfaces for both recruiters and applicants
- **Problem-Solving Depth**: Complete end-to-end recruitment simulation workflow
- **UI/UX Quality**: Premium design, smooth animations, responsive layout
- **Technical Execution**: Clean architecture, secure backend, efficient database
- **Clarity of Presentation**: Well-documented code and user flows

## 📝 License

MIT License - Built for InnovateX Hackfest 2025

## 🙏 Acknowledgments

- Google Gemini AI for intelligent evaluation
- Inter font family for typography
- better-sqlite3 for database management