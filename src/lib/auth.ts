// src/lib/auth.ts
'use client'; // Mark this for client-side usage as it interacts with localStorage

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Stores authentication tokens in localStorage.
 * @param access - The access token.
 * @param refresh - The refresh token.
 */
export function storeTokens(access: string, refresh: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

/**
 * Retrieves the access token from localStorage.
 * @returns The access token or null if not found.
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

/**
 * Retrieves the refresh token from localStorage.
 * @returns The refresh token or null if not found.
 */
export function getRefreshToken(): string | null {
   if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

/**
 * Removes authentication tokens from localStorage.
 */
export function removeTokens(): void {
   if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Checks if the user is currently authenticated based on token presence.
 * Note: This is a basic check. For true verification, validate the token with the backend.
 * @returns True if an access token exists, false otherwise.
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Attempts to refresh the access token using the refresh token.
 * @returns A promise that resolves to the new access token or rejects on failure.
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Refresh token might be invalid or expired, force logout
      console.error("Failed to refresh token:", data);
      removeTokens(); // Clear invalid tokens
      throw new Error(data.detail || 'Failed to refresh token.');
    }

    const newAccessToken = data.access;
    if (newAccessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken); // Store the new access token
       console.log("Access token refreshed successfully.");
      return newAccessToken;
    } else {
       throw new Error('No new access token received in refresh response.');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
     // Optionally trigger a redirect to login page here
     // window.location.href = '/login';
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Performs a fetch request, automatically adding the Authorization header
 * and handling token refresh on 401 Unauthorized errors.
 *
 * @param url The URL to fetch.
 * @param options Fetch options (method, headers, body, etc.).
 * @returns A promise that resolves to the Fetch Response object.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let accessToken = getAccessToken();

  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Ensure Content-Type is set for POST/PUT/PATCH if not already provided
    if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase()) && !headers.has('Content-Type')) {
        if (options.body && !(options.body instanceof FormData)) { // Don't set for FormData
             headers.set('Content-Type', 'application/json');
        }
    }


    const response = await fetch(url, {
      ...options,
      headers: headers,
    });

    if (response.status === 401 && token) { // Unauthorized, potentially expired token
      console.log('Received 401, attempting token refresh...');
      try {
        const newAccessToken = await refreshAccessToken();
        // Retry the original request with the new token
        console.log('Retrying request with new token...');
        return await makeRequest(newAccessToken); // Recursive call with new token
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
         // Force logout or redirect to login if refresh fails
         removeTokens();
         if (typeof window !== 'undefined') {
             // Redirecting... consider using next/navigation router if possible
             window.location.href = '/login?sessionExpired=true';
         }
         // Throw a specific error or return the original 401 response
         // Depending on how you want calling code to handle it.
         throw new Error('Session expired. Please log in again.');
         // return response; // Or return the original 401 response
      }
    }

    return response; // Return the original response if not 401 or if refresh was successful
  };

  return await makeRequest(accessToken);
}


/**
 * Logs the user out by calling the backend logout endpoint and removing tokens.
 */
export async function logout(): Promise<void> {
   const refreshToken = getRefreshToken();
   removeTokens(); // Remove tokens immediately for faster UI update

   if (refreshToken) {
       try {
            // Call the backend logout endpoint (optional but good practice for blacklist)
            // dj-rest-auth logout doesn't strictly require a token if configured correctly,
            // but sending the refresh token helps if blacklist is enabled.
           await fetch(`${API_BASE_URL}/api/auth/logout/`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ refresh: refreshToken }), // Send refresh token for potential blacklisting
           });
           console.log("Backend logout called successfully.");
       } catch (error) {
           console.error("Error calling backend logout:", error);
           // Logout should still proceed locally even if backend call fails
       }
   } else {
       console.log("No refresh token found, skipping backend logout call.");
   }


   // Redirect to login page
   if (typeof window !== 'undefined') {
     window.location.href = '/login'; // Simple redirect
   }
}
