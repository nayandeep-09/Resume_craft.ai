// ============================================
// USER DATABASE (using localStorage)
// ============================================

class UserDatabase {
    constructor() {
        this.storageKey = 'resumePro_users';
        this.sessionKey = 'resumePro_session';
        this.initializeDatabase();
    }

    initializeDatabase() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // Hash password (simple method - for production use bcrypt)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Register new user
    registerUser(firstName, lastName, email, password) {
        const users = this.getAllUsers();
        
        // Check if email already exists
        if (users.find(user => user.email === email)) {
            return { success: false, message: 'Email already registered!' };
        }

        const newUser = {
            id: Date.now(),
            firstName,
            lastName,
            email,
            passwordHash: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(this.storageKey, JSON.stringify(users));
        return { success: true, message: 'Account created successfully!', user: newUser };
    }

    // Login user
    loginUser(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, message: 'Email not found. Please sign up first.' };
        }

        const passwordHash = this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, message: 'Incorrect password. Please try again.' };
        }

        // Create session
        this.createSession(user);
        return { success: true, message: 'Login successful!', user };
    }

    // Create session
    createSession(user) {
        const session = {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    // Get current session
    getSession() {
        const session = localStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }

    // End session
    endSession() {
        localStorage.removeItem(this.sessionKey);
    }

    // Get all users
    getAllUsers() {
        const users = localStorage.getItem(this.storageKey);
        return users ? JSON.parse(users) : [];
    }

    // Check if user is logged in
    isUserLoggedIn() {
        return this.getSession() !== null;
    }
}

// Initialize database
const db = new UserDatabase();

// ============================================
// PAGE SWITCHING
// ============================================

function switchPage(page) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    if (page === 'login') {
        document.querySelector('.login-page').classList.add('active');
    } else if (page === 'signup') {
        document.querySelector('.signup-page').classList.add('active');
    } else if (page === 'dashboard') {
        document.querySelector('.dashboard-page').classList.add('active');
    }
}

// ============================================
// MESSAGE DISPLAY
// ============================================

function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message show ${type}`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

// ============================================
// LOGIN FUNCTIONALITY
// ============================================

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validation
    if (!email || !password) {
        showMessage('loginMessage', 'Please fill in all fields.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('loginMessage', 'Please enter a valid email address.', 'error');
        return;
    }

    // Attempt login
    const result = db.loginUser(email, password);

    if (result.success) {
        showMessage('loginMessage', result.message, 'success');
        
        // Save email if remember me is checked
        if (rememberMe) {
            localStorage.setItem('resumePro_remembered_email', email);
        } else {
            localStorage.removeItem('resumePro_remembered_email');
        }

        // Redirect to dashboard after 1 second
        setTimeout(() => {
            displayDashboard(result.user);
            switchPage('dashboard');
            document.getElementById('loginForm').reset();
        }, 1000);
    } else {
        showMessage('loginMessage', result.message, 'error');
    }
});

// Load remembered email on page load
document.addEventListener('DOMContentLoaded', function() {
    const rememberedEmail = localStorage.getItem('resumePro_remembered_email');
    if (rememberedEmail) {
        document.getElementById('login-email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }

    // Check if user is already logged in
    if (db.isUserLoggedIn()) {
        const session = db.getSession();
        displayDashboard(session);
        switchPage('dashboard');
    }
});

// ============================================
// SIGNUP FUNCTIONALITY
// ============================================

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showMessage('signupMessage', 'Please fill in all fields.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('signupMessage', 'Please enter a valid email address.', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('signupMessage', 'Password must be at least 6 characters long.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('signupMessage', 'Passwords do not match!', 'error');
        return;
    }

    // Attempt registration
    const result = db.registerUser(firstName, lastName, email, password);

    if (result.success) {
        showMessage('signupMessage', result.message, 'success');
        
        // Clear form
        document.getElementById('signupForm').reset();
        
        // Reset password strength meter
        updatePasswordStrength('');

        // Switch to login page after 2 seconds
        setTimeout(() => {
            switchPage('login');
            document.getElementById('login-email').value = email;
        }, 2000);
    } else {
        showMessage('signupMessage', result.message, 'error');
    }
});

// ============================================
// PASSWORD STRENGTH METER
// ============================================

document.getElementById('signup-password').addEventListener('input', function() {
    updatePasswordStrength(this.value);
});

function updatePasswordStrength(password) {
    const strengthMeter = document.getElementById('strengthMeter');
    const strengthText = document.getElementById('strengthText');

    // Remove all classes
    strengthMeter.classList.remove('weak', 'medium', 'strong');

    if (!password) {
        strengthText.textContent = '';
        return;
    }

    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength < 2) {
        strengthMeter.classList.add('weak');
        strengthText.textContent = 'Weak password';
    } else if (strength < 4) {
        strengthMeter.classList.add('medium');
        strengthText.textContent = 'Medium password';
    } else {
        strengthMeter.classList.add('strong');
        strengthText.textContent = 'Strong password';
    }
}

// ============================================
// DASHBOARD
// ============================================

function displayDashboard(user) {
    document.getElementById('userNameDisplay').textContent = user.firstName + ' ' + user.lastName;
    document.getElementById('userFirstName').textContent = user.firstName;
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        db.endSession();
        switchPage('login');
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
        showMessage('loginMessage', 'Logged out successfully!', 'success');
    }
}

// ============================================
// FORGOT PASSWORD
// ============================================

function handleForgotPassword(e) {
    e.preventDefault();
    const email = prompt('Enter your email address:');
    
    if (email) {
        const users = db.getAllUsers();
        const userExists = users.find(user => user.email === email);
        
        if (userExists) {
            showMessage('loginMessage', 'Password reset link sent to ' + email + '. (Demo - check console)', 'success');
            console.log('Reset email would be sent to:', email);
        } else {
            showMessage('loginMessage', 'Email not found in our system.', 'error');
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
