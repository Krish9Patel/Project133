# Mindful Journey

This project contains both a Next.js frontend and a Django backend for the Mindful Journey application.

## Frontend (Next.js - `src` directory)

This is a NextJS starter in Firebase Studio.

To get started with the frontend:

1.  **Navigate to the root directory.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:9002` (or the specified port).

## Backend (Django - `backend` directory)

The backend provides the API for the Mindful Journey application.

### Backend Setup:

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:** (Recommended)
    ```bash
    # Unix/macOS
    python3 -m venv venv
    source venv/bin/activate

    # Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - **Edit the `.env` file:** Fill in your actual database credentials, a strong `SECRET_KEY`, and ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL (e.g., `http://localhost:9002`).

5.  **Set up the PostgreSQL database:**
    - Ensure PostgreSQL is installed and running.
    - Create the database specified in your `.env` file (e.g., `mindful_journey_db`).
    - Create the database user and password specified in your `.env` file and grant privileges to the database.
      *Example psql commands:*
      ```sql
      CREATE DATABASE mindful_journey_db;
      CREATE USER your_db_user WITH PASSWORD 'your_db_password';
      ALTER ROLE your_db_user SET client_encoding TO 'utf8';
      ALTER ROLE your_db_user SET default_transaction_isolation TO 'read committed';
      ALTER ROLE your_db_user SET timezone TO 'UTC';
      GRANT ALL PRIVILEGES ON DATABASE mindful_journey_db TO your_db_user;
      -- Optional: Grant schema privileges if needed, depending on your setup
      -- GRANT ALL ON SCHEMA public TO your_db_user;
      ```

6.  **Apply database migrations:**
    ```bash
    python manage.py migrate
    ```

7.  **Create a superuser (for accessing the Django admin):**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to create an admin user.

8.  **Run the Django development server:**
    ```bash
    python manage.py runserver
    ```
    The backend API will be available at `http://localhost:8000`. You can access the admin interface at `http://localhost:8000/admin/`.

### Backend Development Notes:

*   **Models:** Defined in `backend/api/models.py`.
*   **Serializers:** Defined in `backend/api/serializers.py`.
*   **Views (API Endpoints):** Defined in `backend/api/views.py`.
*   **URLs:** Configured in `backend/mindful_journey_backend/urls.py` and `backend/api/urls.py`.
*   **Settings:** Configured in `backend/mindful_journey_backend/settings.py`.
*   **Dependencies:** Managed in `backend/requirements.txt`.

## Connecting Frontend and Backend

Ensure the `CORS_ALLOWED_ORIGINS` in your backend `.env` file matches the URL where your frontend is running (e.g., `http://localhost:9002`). The frontend components (`login`, `register`, `journal`, `mood`) need to be updated to make API calls to the backend endpoints (e.g., `http://localhost:8000/api/auth/login/`, `http://localhost:8000/api/journal/`, etc.). Authentication tokens (JWT) received from the backend need to be stored and sent with subsequent API requests.
