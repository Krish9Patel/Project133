# AuraLog
This project contains both a Next.js frontend and a Django backend for the AuraLog application.

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

The backend provides the API for the Aura Log application.

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
    - **Generate and add FIELD_ENCRYPTION_KEY:**
        - Run the following command in your terminal (with your virtualenv activated):
          ```bash
          python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
          ```
        - Copy the generated key (a long base64 string) and paste it as the value for `FIELD_ENCRYPTION_KEY` in your `.env` file. **Keep this key secure and backed up! Losing it means losing encrypted data.**
    - **Configure HTTPS Proxy Settings (Production):** If deploying behind a reverse proxy (like Nginx or Apache) that handles HTTPS, uncomment and configure `USE_X_FORWARDED_HOST`, `SECURE_PROXY_SSL_HEADER_NAME`, and `SECURE_PROXY_SSL_HEADER_VALUE` in your `.env` file according to your proxy setup.

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

      -- Optional but Recommended for DB-level encryption: Enable pgcrypto
      -- Connect to your database (\c mindful_journey_db) and run:
      -- CREATE EXTENSION IF NOT EXISTS pgcrypto;
      ```

6.  **Apply database migrations:**
    ```bash
    python manage.py migrate
    ```
    *(Note: If you applied encryption to existing fields, you might need a data migration script to encrypt the old data. The current setup encrypts new/updated data.)*

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

*   **Models:** Defined in `backend/api/models.py`. Journal `content` is now encrypted using `fernet_fields`.
*   **Serializers:** Defined in `backend/api/serializers.py`.
*   **Views (API Endpoints):** Defined in `backend/api/views.py`.
*   **URLs:** Configured in `backend/mindful_journey_backend/urls.py` and `backend/api/urls.py`.
*   **Settings:** Configured in `backend/mindful_journey_backend/settings.py`. Includes HTTPS proxy settings and encryption key setup.
*   **Dependencies:** Managed in `backend/requirements.txt`. Added `django-fernet-fields`.
*   **Encryption:** Journal entry content is encrypted at the application level using `django-fernet-fields` and the `FIELD_ENCRYPTION_KEY` from your `.env`. Database-level encryption (e.g., TDE, filesystem encryption) is still recommended for comprehensive protection.

## Connecting Frontend and Backend

Ensure the `CORS_ALLOWED_ORIGINS` in your backend `.env` file matches the URL where your frontend is running (e.g., `http://localhost:9002`). The frontend components (`login`, `register`, `journal`, `mood`) make API calls to the backend endpoints (e.g., `http://localhost:8000/api/auth/login/`, `http://localhost:8000/api/journal/`, etc.). Authentication tokens (JWT) received from the backend are stored (e.g., localStorage) and sent with subsequent API requests via the `fetchWithAuth` helper.

## Production Deployment Considerations

*   **HTTPS:** ALWAYS use HTTPS in production. Configure your reverse proxy (Nginx, Apache, etc.) to handle SSL/TLS termination and ensure Django's `SECURE_*` settings (especially `SECURE_PROXY_SSL_HEADER`) are correctly configured in `settings.py` (using environment variables). Set `DEBUG=False`.
*   **Database Encryption:** While application-level encryption for the `content` field is added, consider enabling Transparent Data Encryption (TDE) or filesystem encryption at the database/OS level for complete data-at-rest protection.
*   **SECRET_KEY:** Use a unique, unpredictable, and secret key in production.
*   **ALLOWED_HOSTS:** List only your production domain(s).
*   **Static Files:** Run `python manage.py collectstatic` and configure your web server to serve static files efficiently.
*   **Web Server:** Use a production-grade web server like Gunicorn or uWSGI behind your reverse proxy.
*   **Environment Variables:** Manage all secrets and environment-specific settings using environment variables or a secrets management system. Do NOT commit your production `.env` file.
*   **Backups:** Regularly back up your database AND your `FIELD_ENCRYPTION_KEY`.
