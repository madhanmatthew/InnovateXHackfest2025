// API Configuration
const API_BASE_URL = window.location.origin + '/api';

/**
 * API client with authentication
 */
class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('auth_token');
    }

    /**
     * Make HTTP request
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // Add auth token if available
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    }

    // === Auth Endpoints ===
    async register(name, email, password, role) {
        return this.post('/auth/register', { name, email, password, role });
    }

    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async getProfile() {
        return this.get('/auth/profile');
    }

    // === Scenario Endpoints ===
    async getScenarios(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.get(`/scenarios?${params}`);
    }

    async getScenario(id) {
        return this.get(`/scenarios/${id}`);
    }

    async createScenario(scenarioData) {
        return this.post('/scenarios', scenarioData);
    }

    async updateScenario(id, scenarioData) {
        return this.put(`/scenarios/${id}`, scenarioData);
    }

    async deleteScenario(id) {
        return this.delete(`/scenarios/${id}`);
    }

    // === Response Endpoints ===
    async submitResponse(responseData) {
        return this.post('/responses', responseData);
    }

    async getResponse(id) {
        return this.get(`/responses/${id}`);
    }

    async getScenarioResponses(scenarioId) {
        return this.get(`/responses/scenario/${scenarioId}`);
    }

    async getApplicantResponses(applicantId) {
        return this.get(`/responses/applicant/${applicantId}`);
    }

    // === Analytics Endpoints ===
    async getAnalyticsOverview() {
        return this.get('/analytics/overview');
    }

    async getScenarioAnalytics(scenarioId) {
        return this.get(`/analytics/scenarios/${scenarioId}`);
    }

    async getPerformanceTrends() {
        return this.get('/analytics/performance');
    }
}

// Create global API instance
window.api = new API();
