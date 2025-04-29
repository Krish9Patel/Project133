# **App Name**: Mindful Journey

## Core Features:

- Secure Authentication: Secure user registration, login, and logout functionality using Django's built-in authentication.
- Text Journaling: A rich text editor for journaling, allowing users to create, read, update, and delete entries. Entries are chronological and user-specific.
- Mood Tracking & Visualization: A daily mood check-in feature using a rating scale or emotion tags. Mood history is visualized as a line chart.
- Meditation Timer: A simple timer component for meditation with start, pause, and reset controls.
- AI Sentiment Analysis: AI-powered sentiment analysis tool that identifies patterns and trends in user's journal entries and mood logs. It summarizes key emotional themes and provides insights into the user's overall emotional state, using the LLM as a tool for pattern recognition.

## Style Guidelines:

- Primary color: Pastel purple (#D8B4FE) to promote a sense of calm and tranquility.
- Secondary color: Baby blue (#A7D1AB) for serenity and peace.
- Accent: Soft peach (#FFDAB9) for warmth and gentle highlights.
- Clean and readable sans-serif fonts.
- Simple, line-based icons for a clean and modern look.
- Clean, spacious layout with ample white space to reduce visual clutter.
- Subtle transitions and animations to create a smooth and engaging user experience.

## Original User Request:
Project: AI-Powered Mental Health Web Application MVP

Overall Goal: Develop a secure and user-friendly web application designed to help individuals improve their mental well-being through self-monitoring and reflection tools. This prompt focuses specifically on building the Minimum Viable Product (MVP).

Target User (MVP): Individuals seeking a private, digital space to track their thoughts and moods, reflect on patterns, and engage in basic mindfulness exercises.

Technology Stack (Please adhere to this stack):

Backend: Python with Django (including Django REST Framework for APIs)
Database: PostgreSQL
Frontend: JavaScript with React
(Note: If you have limitations and strongly recommend Firebase services like Firestore, Firebase Auth, Cloud Functions instead, please provide specific guidance on how to adapt the following requirements to that stack while maintaining security and achieving the core functionality.)

Core MVP Features & Requirements:

Secure User Authentication:

Implement user registration using email and password.
Implement secure user login and logout functionality.
Utilize Django's built-in authentication system (django.contrib.auth).
Ensure strong password hashing (Django's default Argon2 is preferred).
User sessions should be managed securely.
Text Journaling:

Create a dedicated journaling section in the React frontend.
Implement a rich text editor component (e.g., ReactQuill, Draft.js) allowing basic formatting (bold, italics, lists).
Users must be able to Create, Read, Update, and Delete (CRUD) their own journal entries.
Each entry should be associated with the logged-in user and have a timestamp (creation and last updated).
Display journal entries in a chronological list view (most recent first).
Ensure only the logged-in user can access their own journal entries.
Mood Tracking:

Implement a simple daily mood check-in feature.
Allow users to record their mood, for example, using a 1-5 rating scale or selecting from predefined emotion tags (e.g., Happy, Sad, Anxious, Calm, Neutral).
Store the mood entry associated with the logged-in user and the timestamp.
Users should be able to view their mood history.
Basic Data Visualization:

Display the user's mood history as a simple line chart over time (e.g., daily mood rating for the last 7/30 days). Use a React charting library (e.g., Chart.js, Recharts).
Implement the chronological list view for journal entries mentioned in feature #2.
Meditation Timer:

Create a basic, functional timer component in React.
Allow users to set a duration (e.g., 5, 10, 15 minutes).
Provide start, pause, and reset controls.
(Optional MVP+): Include options for simple start/end sounds.
Data Models (PostgreSQL - defined via Django Models):

User: Utilize Django's built-in User model (or a custom user model inheriting from AbstractUser).
JournalEntry:
user: ForeignKey to User (related_name='journal_entries')
content: TextField (storing rich text/HTML from the editor)
created_at: DateTimeField (auto_now_add=True)
updated_at: DateTimeField (auto_now=True)
MoodLog:
user: ForeignKey to User (related_name='mood_logs')
mood_rating: IntegerField (e.g., 1-5) OR mood_tag: CharField/ForeignKey to a MoodTag model
timestamp: DateTimeField (auto_now_add=True)
API Design (Django REST Framework):

Design a RESTful API for communication between the React frontend and Django backend.
Implement necessary endpoints for:
Authentication (Login, Logout, Register - consider using dj-rest-auth or djoser)
Journal Entries (CRUD operations - ListCreateAPIView, RetrieveUpdateDestroyAPIView)
Mood Logs (Create, List)
Ensure API endpoints are secured and require authentication (except for login/register).
Implement permissions ensuring users can only access/modify their own data.
Security & Compliance Considerations (CRITICAL):

HIPAA Principles: While the MVP might not strictly require HIPAA certification yet, implement security with HIPAA technical safeguards in mind from the start.
Data Encryption:
At Rest: Configure PostgreSQL for encryption at rest (e.g., using filesystem encryption, TDE if available, or pgcrypto for sensitive columns like JournalEntry.content).
In Transit: Ensure all communication uses HTTPS/TLS (configure Django and the deployment environment). Secure API communication between React and Django.
Access Control: Implement strict authorization. Users must ONLY access their own data (journal entries, mood logs). Use Django's permission system effectively.
Input Validation: Implement robust validation on both the React frontend and Django backend for all user inputs (forms, API requests) to prevent injection attacks (XSS, SQLi - Django ORM helps prevent SQLi).
Dependencies: Keep all dependencies (Django, React, libraries) updated to patch security vulnerabilities.
Secrets Management: Do NOT hardcode secrets (SECRET_KEY, database passwords, API keys). Use environment variables or a secrets management tool.
OWASP Awareness: Develop with an awareness of common web vulnerabilities (e.g., OWASP Top 10). Use Django's built-in protections (CSRF, XSS protection via templates).
UI/UX Considerations (Brief):

The interface should feel calming, simple, supportive, and intuitive.
Prioritize ease of use for core tasks (journaling, mood tracking).
(Detailed UI design is outside the scope of this build prompt but keep these principles in mind).
Request:

Please provide guidance and generate the foundational code structure for this MVP based on the specified requirements and technology stack (Django, PostgreSQL, React). This could include:

Initial Django project/app setup (settings.py configuration for auth, DRF, database).
Django model definitions (models.py).
Django REST Framework Serializers (serializers.py) and Views (views.py) for the API endpoints.
Basic React project structure (create-react-app or similar).
Example React components for key features (e.g., Journaling form/list, Mood Tracker input, Timer component).
Guidance on setting up secure API communication (e.g., using JWT or Session auth with React).
Instructions for basic local development setup (running Django dev server, React dev server).
Highlight key areas for implementing the specified security measures (encryption points, authentication checks, permissions).

  