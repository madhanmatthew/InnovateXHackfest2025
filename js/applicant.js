// Applicant Dashboard Manager
class ApplicantDashboard {
    constructor() {
        this.mainContent = document.getElementById('mainContent');
        this.currentScenario = null;
        this.answers = [];
        this.startTime = null;
    }

    /**
     * Render main applicant dashboard
     */
    async render() {
        try {
            const user = authManager.getUser();
            const { responses } = await api.getApplicantResponses(user.id);
            const { scenarios } = await api.getScenarios();

            // Calculate stats
            const completedCount = responses.length;
            const avgScore = responses.length > 0
                ? responses.reduce((sum, r) => sum + r.total_score, 0) / responses.length
                : 0;
            const passedCount = responses.filter(r => r.total_score >= 70).length;

            this.mainContent.innerHTML = `
        <div>
          <h1>Welcome, ${escapeHTML(user.name)}!</h1>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">
            Explore scenarios, test your skills, and track your progress.
          </p>

          <!-- Stats Grid -->
          <div class="grid grid-3 mb-3">
            <div class="stat-card">
              <div class="stat-value">${scenarios.length}</div>
              <div class="stat-label">Available Scenarios</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${completedCount}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${Math.round(avgScore)}%</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="glass-card mb-3">
            <h3>Quick Actions</h3>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-primary" onclick="window.navigateTo('browse')">
                🔍 Browse Scenarios
              </button>
              <button class="btn btn-outline" onclick="window.navigateTo('my-results')">
                📊 View My Results
              </button>
            </div>
          </div>

          <!-- Available Scenarios -->
          <div class="glass-card">
            <h3>Featured Scenarios</h3>
            ${scenarios.length > 0 ? `
              <div class="grid grid-2 mt-2">
                ${scenarios.slice(0, 4).map(s => `
                  <div class="glass-card">
                    <h4>${escapeHTML(s.title)}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                      ${escapeHTML(s.description || 'No description')}
                    </p>
                    <div class="flex gap-1 mt-2" style="flex-wrap: wrap;">
                      <span class="badge badge-${s.difficulty === 'hard' ? 'error' : s.difficulty === 'medium' ? 'warning' : 'success'}">
                        ${s.difficulty}
                      </span>
                      <span class="badge badge-info">${s.category}</span>
                      <span class="badge badge-info">${s.questions.length} questions</span>
                    </div>
                    <button class="btn btn-primary mt-2" onclick="window.navigateTo('simulation', {scenarioId: ${s.id}})" style="width: 100%;">
                      Start Assessment
                    </button>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: var(--text-secondary); margin-top: 1rem;">No scenarios available yet.</p>'}
          </div>

          <!-- Recent Results -->
          ${responses.length > 0 ? `
            <div class="glass-card mt-3">
              <h3>Recent Results</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${responses.slice(0, 5).map(r => `
                    <tr>
                      <td>${escapeHTML(r.scenario_title)}</td>
                      <td>
                        <span class="badge badge-${getScoreColor(r.total_score)}">
                          ${r.total_score}%
                        </span>
                      </td>
                      <td>${r.total_score >= 70 ? '✅ Passed' : '❌ Failed'}</td>
                      <td>${formatDate(r.submitted_at)}</td>
                      <td>
                        <button class="btn btn-outline" onclick="window.navigateTo('results', {responseId: ${r.id}})">
                          View
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>
      `;
        } catch (error) {
            showToast('Failed to load dashboard', 'error');
            console.error(error);
        }
    }

    /**
     * Render browse scenarios page
     */
    async renderBrowse() {
        try {
            const { scenarios } = await api.getScenarios();

            this.mainContent.innerHTML = `
        <div>
          <h1>Browse Scenarios</h1>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">
            Choose a scenario to test your skills
          </p>

          ${scenarios.length > 0 ? `
            <div class="grid grid-2">
              ${scenarios.map(s => `
                <div class="glass-card">
                  <div class="flex" style="justify-content: space-between; align-items: start;">
                    <div>
                      <h3>${escapeHTML(s.title)}</h3>
                      <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                        ${escapeHTML(s.description || 'No description')}
                      </p>
                    </div>
                    <span class="badge badge-${s.difficulty === 'hard' ? 'error' : s.difficulty === 'medium' ? 'warning' : 'success'}">
                      ${s.difficulty}
                    </span>
                  </div>
                  
                  <div class="flex gap-1" style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem; flex-wrap: wrap;">
                    <span>📂 ${s.category}</span>
                    <span>📝 ${s.questions.length} questions</span>
                    <span>⏱️ ${s.time_limit} min</span>
                    <span>🎯 ${s.passing_score}% to pass</span>
                  </div>
                  
                  <button class="btn btn-primary mt-2" onclick="window.navigateTo('simulation', {scenarioId: ${s.id}})" style="width: 100%;">
                    🚀 Start Assessment
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="glass-card text-center" style="padding: 3rem;">
              <h2>No Scenarios Available</h2>
              <p style="color: var(--text-secondary); margin-top: 1rem;">
                Check back later for new assessment opportunities.
              </p>
            </div>
          `}
        </div>
      `;
        } catch (error) {
            showToast('Failed to load scenarios', 'error');
            console.error(error);
        }
    }

    /**
     * Render simulation interface
     */
    async renderSimulation(scenarioId) {
        try {
            const { scenario } = await api.getScenario(scenarioId);
            this.currentScenario = scenario;
            this.answers = new Array(scenario.questions.length).fill(null).map(() => ({}));
            this.startTime = Date.now();
            this.currentQuestionIndex = 0;

            this.mainContent.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto;">
          <!-- Header -->
          <div class="glass-card mb-2">
            <div class="flex" style="justify-content: space-between; align-items: center;">
              <div>
                <h2 style="margin: 0;">${escapeHTML(scenario.title)}</h2>
                <p style="color: var(--text-secondary); margin: 0.5rem 0 0 0;">
                  ${scenario.questions.length} questions • ${scenario.time_limit} minutes
                </p>
              </div>
              <div style="text-align: right;">
                <div id="timer" style="font-size: 2rem; font-weight: 700; color: var(--primary-1);">
                  ${scenario.time_limit}:00
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Time Remaining</div>
              </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="progress-bar mt-2">
              <div id="progressFill" class="progress-fill" style="width: 0%"></div>
            </div>
          </div>

          <!-- Question Container -->
          <div id="questionContainer" class="glass-card">
            <!-- Dynamic question content -->
          </div>

          <!-- Navigation -->
          <div class="flex gap-2 mt-2" style="justify-content: space-between;">
            <button id="prevBtn" class="btn btn-outline" onclick="window.applicantDashboard.previousQuestion()" disabled>
              ← Previous
            </button>
            <div>
              <span style="color: var(--text-secondary);">
                Question <span id="questionNumber">1</span> of ${scenario.questions.length}
              </span>
            </div>
            <button id="nextBtn" class="btn btn-primary" onclick="window.applicantDashboard.nextQuestion()">
              Next →
            </button>
          </div>
        </div>
      `;

            // Start timer
            this.startTimer(scenario.time_limit * 60);

            // Render first question
            this.renderQuestion(0);
        } catch (error) {
            showToast('Failed to load scenario', 'error');
            console.error(error);
        }
    }

    /**
     * Render current question
     */
    renderQuestion(index) {
        const question = this.currentScenario.questions[index];
        const container = document.getElementById('questionContainer');

        let questionHTML = `
      <div>
        <h3>Question ${index + 1}</h3>
        <p style="color: var(--text-primary); font-size: 1.1rem; margin: 1rem 0;">
          ${escapeHTML(question.question)}
        </p>
        <div class="mt-2">
    `;

        switch (question.type) {
            case 'multiple-choice':
                questionHTML += `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${question.options.map((option, i) => `
              <label class="glass-card" style="cursor: pointer; padding: 1rem; transition: all 0.3s;">
                <input type="radio" name="mcq-${index}" value="${i}" 
                  ${this.answers[index].selectedOption === i ? 'checked' : ''}
                  onchange="window.applicantDashboard.saveAnswer(${index}, 'selectedOption', ${i})"
                  style="margin-right: 0.5rem;">
                ${escapeHTML(option)}
              </label>
            `).join('')}
          </div>
        `;
                break;

            case 'text':
                questionHTML += `
          <textarea class="input-field" rows="8" placeholder="Type your answer here..." 
            onchange="window.applicantDashboard.saveAnswer(${index}, 'textAnswer', this.value)"
          >${this.answers[index].textAnswer || ''}</textarea>
        `;
                break;

            case 'coding':
                questionHTML += `
          <textarea class="input-field" rows="12" placeholder="// Write your code here..." 
            style="font-family: 'JetBrains Mono', monospace; font-size: 0.9rem;"
            onchange="window.applicantDashboard.saveAnswer(${index}, 'codeAnswer', this.value)"
          >${this.answers[index].codeAnswer || ''}</textarea>
        `;
                break;
        }

        questionHTML += `
        </div>
      </div>
    `;

        container.innerHTML = questionHTML;

        // Update UI
        document.getElementById('questionNumber').textContent = index + 1;
        document.getElementById('prevBtn').disabled = index === 0;
        document.getElementById('nextBtn').textContent =
            index === this.currentScenario.questions.length - 1 ? 'Submit' : 'Next →';

        // Update progress
        const progress = ((index + 1) / this.currentScenario.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;

        this.currentQuestionIndex = index;
    }

    /**
     * Save answer
     */
    saveAnswer(index, field, value) {
        this.answers[index][field] = value;
    }

    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.renderQuestion(this.currentQuestionIndex - 1);
        }
    }

    /**
     * Navigate to next question or submit
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentScenario.questions.length - 1) {
            this.renderQuestion(this.currentQuestionIndex + 1);
        } else {
            this.submitAssessment();
        }
    }

    /**
     * Start countdown timer
     */
    startTimer(seconds) {
        const timerEl = document.getElementById('timer');
        let remaining = seconds;

        this.timerInterval = setInterval(() => {
            remaining--;

            const minutes = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

            // Warning color when < 5 minutes
            if (remaining < 300) {
                timerEl.style.color = 'var(--warning)';
            }
            if (remaining < 60) {
                timerEl.style.color = 'var(--error)';
            }

            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                showToast('Time is up! Submitting your answers...', 'warning');
                setTimeout(() => this.submitAssessment(), 2000);
            }
        }, 1000);
    }

    /**
     * Submit assessment
     */
    async submitAssessment() {
        if (!confirm('Are you sure you want to submit your assessment? You cannot change your answers after submission.')) {
            return;
        }

        clearInterval(this.timerInterval);

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            const response = await api.submitResponse({
                scenarioId: this.currentScenario.id,
                answers: this.answers,
                timeSpent
            });

            showToast('Assessment submitted successfully!', 'success');

            // Navigate to results
            setTimeout(() => {
                window.navigateTo('results', { responseId: response.responseId });
            }, 1000);
        } catch (error) {
            showToast('Failed to submit assessment', 'error');
            console.error(error);
        }
    }

    /**
     * Render results page
     */
    async renderResults(responseId) {
        try {
            const { response } = await api.getResponse(responseId);

            const passed = response.total_score >= 70;

            this.mainContent.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto;">
          <!-- Score Card -->
          <div class="glass-card text-center mb-3" style="padding: 3rem;">
            <div style="font-size: 6rem; margin-bottom: 1rem;">
              ${passed ? '🎉' : '📊'}
            </div>
            <h1 style="font-size: 3rem; margin-bottom: 0.5rem;">
              ${response.total_score}%
            </h1>
            <h2 style="color: var(--text-secondary); font-weight: 400;">
              ${passed ? 'Congratulations! You Passed!' : 'Keep Practicing!'}
            </h2>
            <div class="flex gap-2 mt-3" style="justify-content: center;">
              <span class="badge badge-${getScoreColor(response.total_score)}" style="font-size: 1rem; padding: 0.5rem 1.5rem;">
                ${passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
              </span>
            </div>
          </div>

          <!-- Overall Feedback -->
          ${response.aiEvaluation && response.aiEvaluation.summary ? `
            <div class="glass-card mb-3">
              <h3>AI Evaluation Summary</h3>
              <p style="color: var(--text-secondary); margin-top: 1rem;">
                ${escapeHTML(response.aiEvaluation.summary)}
              </p>
              
              ${response.aiEvaluation.strengths ? `
                <div class="mt-2">
                  <h4>Strengths</h4>
                  <ul style="color: var(--success); margin-top: 0.5rem;">
                    ${response.aiEvaluation.strengths.map(s => `<li>${escapeHTML(s)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${response.aiEvaluation.improvements ? `
                <div class="mt-2">
                  <h4>Areas for Improvement</h4>
                  <ul style="color: var(--warning); margin-top: 0.5rem;">
                    ${response.aiEvaluation.improvements.map(i => `<li>${escapeHTML(i)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Question-by-Question Breakdown -->
          <div class="glass-card">
            <h3>Question-by-Question Analysis</h3>
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
              ${response.scores.map((score, i) => `
                <div class="glass-card">
                  <div class="flex" style="justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0;">Question ${i + 1}</h4>
                    <span class="badge badge-${getScoreColor((score.earnedPoints / score.maxPoints) * 100)}">
                      ${score.earnedPoints} / ${score.maxPoints} points
                    </span>
                  </div>
                  <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                    ${escapeHTML(score.questionText)}
                  </p>
                  <p style="color: var(--text-primary); margin-top: 1rem;">
                    <strong>Feedback:</strong> ${escapeHTML(score.feedback)}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-3" style="justify-content: center;">
            <button class="btn btn-primary" onclick="window.navigateTo('browse')">
              Browse More Scenarios
            </button>
            <button class="btn btn-outline" onclick="window.navigateTo('my-results')">
              View All Results
            </button>
          </div>
        </div>
      `;
        } catch (error) {
            showToast('Failed to load results', 'error');
            console.error(error);
        }
    }

    /**
     * Render my results page
     */
    async renderMyResults() {
        try {
            const user = authManager.getUser();
            const { responses } = await api.getApplicantResponses(user.id);

            this.mainContent.innerHTML = `
        <div>
          <h1>My Results</h1>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">
            Track your assessment history and performance
          </p>

          ${responses.length > 0 ? `
            <div class="glass-card">
              <table class="table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${responses.map(r => `
                    <tr>
                      <td>${escapeHTML(r.scenario_title)}</td>
                      <td><span class="badge badge-info">${r.category}</span></td>
                      <td>
                        <span class="badge badge-${getScoreColor(r.total_score)}">
                          ${r.total_score}%
                        </span>
                      </td>
                      <td>${r.total_score >= 70 ? '✅ Passed' : '❌ Failed'}</td>
                      <td>${formatDate(r.submitted_at)}</td>
                      <td>
                        <button class="btn btn-outline" onclick="window.navigateTo('results', {responseId: ${r.id}})">
                          View Details
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="glass-card text-center" style="padding: 3rem;">
              <h2>No Results Yet</h2>
              <p style="color: var(--text-secondary); margin: 1rem 0;">
                Complete your first assessment to see your results here.
              </p>
              <button class="btn btn-primary mt-2" onclick="window.navigateTo('browse')">
                Browse Scenarios
              </button>
            </div>
          `}
        </div>
      `;
        } catch (error) {
            showToast('Failed to load results', 'error');
            console.error(error);
        }
    }
}

// Create global instance
window.applicantDashboard = new ApplicantDashboard();
