// Authentication Manager
class AuthManager {
    constructor() {
        this.user = this.loadUser();
        this.initAuthModal();
    }

    /**
     * Initialize auth modal bindings
     */
    initAuthModal() {
        const authBtn = document.getElementById('authBtn');
        const authForm = document.getElementById('authForm');
        const authSwitchLink = document.getElementById('authSwitchLink');

        authBtn.addEventListener('click', () => {
            if (this.user) {
                this.logout();
            } else {
                showModal('authModal');
            }
        });

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAuthSubmit();
        });

        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });
    }

    /**
     * Toggle between login and signup
     */
    toggleAuthMode() {
        const nameGroup = document.getElementById('nameGroup');
        const roleGroup = document.getElementById('roleGroup');
        const authTitle = document.getElementById('authTitle');
        const authSubmitText = document.getElementById('authSubmitText');
        const authSwitchText = document.getElementById('authSwitchText');
        const authSwitchLink = document.getElementById('authSwitchLink');

        const isLogin = nameGroup.style.display === 'none';

        if (isLogin) {
            // Switch to signup
            nameGroup.style.display = 'block';
            roleGroup.style.display = 'block';
            authTitle.textContent = 'Create Account';
            authSubmitText.textContent = 'Sign Up';
            authSwitchText.textContent = 'Already have an account?';
            authSwitchLink.textContent = 'Login';
        } else {
            // Switch to login
            nameGroup.style.display = 'none';
            roleGroup.style.display = 'none';
            authTitle.textContent = 'Welcome Back';
            authSubmitText.textContent = 'Login';
            authSwitchText.textContent = "Don't have an account?";
            authSwitchLink.textContent = 'Sign Up';
        }
    }

    /**
     * Handle auth form submission
     */
    async handleAuthSubmit() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const role = document.getElementById('role').value;

        const isSignup = document.getElementById('nameGroup').style.display !== 'none';

        try {
            let response;

            if (isSignup) {
                if (!name) {
                    showToast('Please enter your name', 'error');
                    return;
                }
                response = await api.register(name, email, password, role);
            } else {
                response = await api.login(email, password);
            }

            // Store auth data
            api.setToken(response.token);
            this.saveUser(response.user);
            this.user = response.user;

            // Update UI
            this.updateAuthUI();
            hideModal('authModal');

            // Clear form
            document.getElementById('authForm').reset();

            showToast(`Welcome ${response.user.name}!`, 'success');

            // Navigate to appropriate dashboard
            if (this.user.role === 'recruiter') {
                window.navigateTo('recruiter-dashboard');
            } else {
                window.navigateTo('applicant-dashboard');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    /**
     * Logout user
     */
    logout() {
        api.clearToken();
        this.user = null;
        this.updateAuthUI();
        window.navigateTo('home');
        showToast('Logged out successfully', 'info');
    }

    /**
     * Update authentication UI
     */
    updateAuthUI() {
        const authBtn = document.getElementById('authBtn');
        const navLinks = document.getElementById('navLinks');

        if (this.user) {
            authBtn.textContent = 'Logout';
            authBtn.className = 'btn btn-outline';

            // Update navigation based on role
            if (this.user.role === 'recruiter') {
                navLinks.innerHTML = `
          <li><a href="#" onclick="window.navigateTo('recruiter-dashboard')">Dashboard</a></li>
          <li><a href="#" onclick="window.navigateTo('scenarios')">Scenarios</a></li>
          <li><a href="#" onclick="window.navigateTo('analytics')">Analytics</a></li>
        `;
            } else {
                navLinks.innerHTML = `
          <li><a href="#" onclick="window.navigateTo('applicant-dashboard')">Dashboard</a></li>
          <li><a href="#" onclick="window.navigateTo('browse')">Browse Scenarios</a></li>
          <li><a href="#" onclick="window.navigateTo('my-results')">My Results</a></li>
        `;
            }
        } else {
            authBtn.textContent = 'Login';
            authBtn.className = 'btn btn-primary';
            navLinks.innerHTML = '';
        }
    }

    /**
     * Save user to localStorage
     */
    saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Load user from localStorage
     */
    loadUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.user !== null;
    }

    /**
     * Check if user is recruiter
     */
    isRecruiter() {
        return this.user && this.user.role === 'recruiter';
    }

    /**
     * Check if user is applicant
     */
    isApplicant() {
        return this.user && this.user.role === 'applicant';
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }
}

// Create global auth instance
window.authManager = new AuthManager();
