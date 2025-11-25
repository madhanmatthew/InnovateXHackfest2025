// Main Application Controller
class App {
    constructor() {
        this.mainContent = document.getElementById('mainContent');
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        // Update auth UI
        authManager.updateAuthUI();

        // Set up routing
        this.setupRouting();

        // Navigate to home or dashboard based on auth status
        if (authManager.isAuthenticated()) {
            if (authManager.isRecruiter()) {
                this.navigateTo('recruiter-dashboard');
            } else {
                this.navigateTo('applicant-dashboard');
            }
        } else {
            this.navigateTo('home');
        }
    }

    /**
     * Set up client-side routing
     */
    setupRouting() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const route = window.location.hash.slice(1) || 'home';
            this.loadRoute(route);
        });
    }

    /**
     * Navigate to a route
     * @param {string} route - Route name
     * @param {object} data - Optional data to pass to route
     */
    navigateTo(route, data = {}) {
        window.location.hash = route;
        this.loadRoute(route, data);
    }

    /**
     * Load route content
     * @param {string} route - Route name
     * @param {object} data - Optional data
     */
    async loadRoute(route, data = {}) {
        // Show loading
        this.mainContent.innerHTML = '';
        this.mainContent.appendChild(createSpinner());

        try {
            switch (route) {
                case 'home':
                    this.renderHome();
                    break;

                case 'recruiter-dashboard':
                    if (!authManager.isRecruiter()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.recruiterDashboard.render();
                    break;

                case 'scenarios':
                    if (!authManager.isRecruiter()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.recruiterDashboard.renderScenarios();
                    break;

                case 'scenario-builder':
                    if (!authManager.isRecruiter()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.recruiterDashboard.renderScenarioBuilder(data.scenarioId);
                    break;

                case 'analytics':
                    if (!authManager.isRecruiter()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.recruiterDashboard.renderAnalytics();
                    break;

                case 'applicant-dashboard':
                    if (!authManager.isApplicant()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.applicantDashboard.render();
                    break;

                case 'browse':
                    if (!authManager.isApplicant()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.applicantDashboard.renderBrowse();
                    break;

                case 'simulation':
                    if (!authManager.isApplicant()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.applicantDashboard.renderSimulation(data.scenarioId);
                    break;

                case 'results':
                    if (!authManager.isApplicant()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.applicantDashboard.renderResults(data.responseId);
                    break;

                case 'my-results':
                    if (!authManager.isApplicant()) {
                        this.navigateTo('home');
                        return;
                    }
                    await window.applicantDashboard.renderMyResults();
                    break;

                default:
                    this.renderHome();
            }
        } catch (error) {
            console.error('Route loading error:', error);
            this.mainContent.innerHTML = `
        <div class="glass-card text-center">
          <h2>Error Loading Page</h2>
          <p style="color: var(--text-secondary); margin-top: 1rem;">
            ${escapeHTML(error.message)}
          </p>
          <button class="btn btn-primary mt-2" onclick="window.navigateTo('home')">
            Go Home
          </button>
        </div>
      `;
        }
    }

    /**
     * Render home page
     */
    renderHome() {
        this.mainContent.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <h1 style="font-size: 3.5rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 1.5rem;">
          Welcome to RecruitSim
        </h1>
        <p style="font-size: 1.25rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto 3rem;">
          AI-powered recruitment simulation platform. Create scenarios, evaluate candidates, and make data-driven hiring decisions.
        </p>
        
        <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 4rem;">
          <button class="btn btn-primary" onclick="showModal('authModal')">
            Get Started
          </button>
          <button class="btn btn-outline" onclick="document.getElementById('features').scrollIntoView({behavior: 'smooth'})">
            Learn More
          </button>
        </div>
        
        <div id="features" class="grid grid-3" style="margin-top: 4rem;">
          <div class="glass-card">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
            <h3>Scenario Builder</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
              Create custom assessment scenarios with multiple question types and evaluation criteria.
            </p>
          </div>
          
          <div class="glass-card">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
            <h3>AI Evaluation</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
              Intelligent response analysis powered by Google Gemini AI for accurate scoring.
            </p>
          </div>
          
          <div class="glass-card">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
            <h3>Analytics Dashboard</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
              Comprehensive insights and performance metrics to make informed decisions.
            </p>
          </div>
        </div>
        
        <div class="grid grid-2" style="margin-top: 3rem;">
          <div class="glass-card" style="text-align: left;">
            <h3>For Recruiters</h3>
            <ul style="color: var(--text-secondary); margin-top: 1rem; line-height: 2;">
              <li>✓ Create unlimited scenarios</li>
              <li>✓ Custom question types (MCQ, text, coding)</li>
              <li>✓ Real-time applicant tracking</li>
              <li>✓ Advanced analytics & reporting</li>
              <li>✓ AI-powered evaluation</li>
            </ul>
          </div>
          
          <div class="glass-card" style="text-align: left;">
            <h3>For Applicants</h3>
            <ul style="color: var(--text-secondary); margin-top: 1rem; line-height: 2;">
              <li>✓ Browse available assessments</li>
              <li>✓ Immersive simulation experience</li>
              <li>✓ Instant feedback & scores</li>
              <li>✓ Detailed performance insights</li>
              <li>✓ Progress tracking</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    }
}

// Set up global navigation
window.navigateTo = (route, data) => {
    window.app.navigateTo(route, data);
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
