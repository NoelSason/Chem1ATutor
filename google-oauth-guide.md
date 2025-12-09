# Google OAuth 2.0 Implementation Guide

## Overview
This guide walks you through implementing real Google Sign-In for the Chem 1A Tutor application.

## Prerequisites
- Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Your application URL (e.g., `http://localhost:8000` for local development)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Chem1A-Tutor`
4. Click **"Create"**
5. Wait for project creation (takes ~30 seconds)

---

## Step 2: Enable Google Identity Services

1. In the Google Cloud Console, ensure your new project is selected
2. Navigate to **"APIs & Services"** → **"Library"**
3. Search for **"Google Identity Services"** or **"Google+ API"**
4. Click on it and press **"Enable"**

---

## Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the **OAuth consent screen**:
   - User Type: **External** (for testing) or **Internal** (if you have a Google Workspace)
   - App name: `Chem 1A Tutor`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"**
   - Scopes: Skip for now (click **"Save and Continue"**)
   - Test users: Add your email (for testing)
   - Click **"Save and Continue"**

4. Back to **"Create OAuth client ID"**:
   - Application type: **Web application**
   - Name: `Chem 1A Tutor Web Client`
   
5. **Authorized JavaScript origins:**
   - Add: `http://localhost:8000` (for local development)
   - Add: `https://yourdomain.com` (for production, when ready)

6. **Authorized redirect URIs:**
   - Add: `http://localhost:8000` (for local)
   - Add: `https://yourdomain.com` (for production)

7. Click **"Create"**

8. **IMPORTANT:** Copy your **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)

---

## Step 4: Integrate Google Sign-In Library

### Update HTML

Add the Google Sign-In library to your `index.html` (or `practice.html`):

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- ... existing head content ... -->
    
    <!-- Add Google Sign-In Library -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <!-- ... existing content ... -->
    
    <!-- Replace the current login button with Google's -->
    <div id="googleSignInBtn"></div>
</body>
</html>
\`\`\`

### Update JavaScript (app.js)

Replace the simulated login logic with real Google OAuth:

\`\`\`javascript
// ===== GOOGLE OAUTH CONFIGURATION =====
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'; // REPLACE THIS

// Initialize Google Sign-In
function initializeLogin() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('chemTutorUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserData();
        updateUserUI();
    }

    // Initialize Google Sign-In
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleLogin,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Render the Google Sign-In button
        google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            {
                theme: 'filled_blue',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left'
            }
        );

        // Also show One Tap prompt if not logged in
        if (!currentUser) {
            google.accounts.id.prompt();
        }
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Handle Google Login Response
function handleGoogleLogin(response) {
    try {
        // Decode the JWT credential
        const credential = response.credential;
        const payload = parseJwt(credential);

        // Extract user information
        currentUser = {
            name: payload.name,
            email: payload.email,
            avatar: payload.picture || payload.name.charAt(0).toUpperCase(),
            googleId: payload.sub,
            isGoogleAuth: true
        };

        // Save to localStorage
        localStorage.setItem('chemTutorUser', JSON.stringify(currentUser));

        // Load user data and update UI
        loadUserData();
        updateUserUI();

        console.log('Google login successful:', currentUser.name);
    } catch (error) {
        console.error('Error handling Google login:', error);
        alert('Login failed. Please try again.');
    }
}

// Helper function to parse JWT
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}

// Updated logout function
function logout() {
    // Sign out from Google
    if (currentUser?.isGoogleAuth && typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
    }

    // Clear local data
    currentUser = null;
    userStats = { totalAnswered: 0, correctAnswers: 0 };
    quizHistory = [];
    localStorage.removeItem('chemTutorUser');
    
    // Update UI
    updateStatsDisplay();
    document.getElementById('userProfile').classList.add('hidden');
    
    // Reload to show login button again
    location.reload();
}
\`\`\`

### Update HTML for Logout

Add a logout button in your header:

\`\`\`html
<div class="user-profile hidden" id="userProfile">
    <span class="user-name" id="userName">User</span>
    <img class="avatar" id="userAvatar" src="" alt="Avatar" />
    <button class="btn btn-secondary btn-sm" id="logoutBtn">Sign Out</button>
</div>
\`\`\`

---

## Step 5: Update CSS for Avatar Image

Since Google provides profile pictures, update your CSS:

\`\`\`css
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover; /* For images */
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: 1.2rem;
    border: 2px solid var(--bg-tertiary);
    box-shadow: 0 0 0 2px var(--primary-500);
    transition: transform var(--transition-base);
}

/* Handle both image and text avatars */
.avatar[src] {
    background: transparent;
}
\`\`\`

### Update JavaScript to Handle Avatar

\`\`\`javascript
function updateUserUI() {
    const profile = document.getElementById('userProfile');
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');

    nameEl.textContent = currentUser.name;
    
    // If Google auth, use profile picture
    if (currentUser.isGoogleAuth && currentUser.avatar.startsWith('http')) {
        avatarEl.src = currentUser.avatar;
        avatarEl.alt = currentUser.name;
    } else {
        // Fallback to initial
        avatarEl.removeAttribute('src');
        avatarEl.textContent = currentUser.avatar;
    }
    
    profile.classList.remove('hidden');
    updateStatsDisplay();
}
\`\`\`

---

## Step 6: Testing

### Local Testing
1. Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID
2. Start your local server: `python3 -m http.server 8000`
3. Open `http://localhost:8000`
4. Click the Google Sign-In button
5. Select your Google account
6. Verify you're logged in with your Google profile

### Troubleshooting

**Issue: "Unauthorized JavaScript origin"**
- Solution: Make sure `http://localhost:8000` is added to authorized origins in Google Cloud Console

**Issue: "Invalid client ID"**
- Solution: Double-check you copied the entire Client ID correctly

**Issue: Google button doesn't appear**
- Solution: Check browser console for errors. Ensure the Google library script loaded.

**Issue: "This app isn't verified"**
- Solution: This is normal during development. Click "Advanced" → "Go to Chem 1A Tutor (unsafe)" for testing.

---

## Step 7: Production Deployment

When deploying to production:

1. Update **Authorized JavaScript origins** in Google Cloud Console:
   - Add your production domain: `https://yourdomain.com`

2. Update **Authorized redirect URIs**:
   - Add: `https://yourdomain.com`

3. Update the Client ID in your code (or use environment variables)

4. **Verify your app** in Google Cloud Console:
   - Go to OAuth consent screen
   - Submit for verification (required for public apps)

---

## Security Best Practices

1. **Never commit Client ID to public repositories** (use environment variables)
2. **Use HTTPS in production** (required by Google)
3. **Validate tokens on backend** if you have one
4. **Set appropriate scopes** (only request what you need)
5. **Implement token refresh** for long sessions

---

## Environment Variables (Optional)

For better security, use environment variables:

\`\`\`javascript
// config.js
const CONFIG = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'fallback-for-dev'
};
\`\`\`

---

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Overview](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In JavaScript Library](https://developers.google.com/identity/gsi/web/guides/overview)

---

## Summary Checklist

- [ ] Create Google Cloud project
- [ ] Enable Google Identity Services
- [ ] Create OAuth 2.0 credentials
- [ ] Copy Client ID
- [ ] Add Google Sign-In library to HTML
- [ ] Update JavaScript with Client ID
- [ ] Test login flow
- [ ] Update CSS for profile pictures
- [ ] Test logout flow
- [ ] Add production domain when ready

**Estimated Setup Time:** 15-20 minutes

---

*Last Updated: December 2025*
