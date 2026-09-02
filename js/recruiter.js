// Recruiter Dashboard Manager
class RecruiterDashboard {
  constructor() {
    this.mainContent = document.getElementById('mainContent');
    this.scenarios = [];
  }

  /**
   * Render main dashboard
   */
  async render() {
    try {
      const { stats, recentResponses } = await api.getAnalyticsOverview();

      this.mainContent.innerHTML = `
        <div>
          <h1>Recruiter Dashboard</h1>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">
            Welcome back, ${authManager.getUser().name}! Here's your recruitment overview.
          </p>

          <!-- Stats Grid -->
          <div class="grid grid-4 mb-3">
            <div class="stat-card">
              <div class="stat-value">${stats.totalScenarios}</div>
              <div class="stat-label">Total Scenarios</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalApplicants}</div>
              <div class="stat-label">Active Applicants</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalResponses}</div>
              <div class ="stat-label">Total Responses</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.avgScore}%</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="glass-card mb-3">
            <h3>Quick Actions</h3>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-primary" onclick="window.navigateTo('scenario-builder')">
                ➕ Create New Scenario
              </button>
              <button class="btn btn-outline" onclick="window.navigateTo('scenarios')">
                📋 Manage Scenarios
              </button>
              <button class="btn btn-outline" onclick="window.navigateTo('analytics')">
                📊 View Analytics
              </button>
            </div>
          </div>

          <!-- Recent Responses -->
          <div class="glass-card">
            <h3>Recent Responses</h3>
            ${recentResponses.length > 0 ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Scenario</th>
                    <th>Score</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentResponses.map(r => `
                    <tr>
                      <td>${escapeHTML(r.applicant_name)}</td>
                      <td>${escapeHTML(r.scenario_title)}</td>
                      <td>
                        <span class="badge badge-${getScoreColor(r.total_score)}">
                          ${r.total_score}%
                        </span>
                      </td>
                      <td>${formatDate(r.submitted_at)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: var(--text-secondary); margin-top: 1rem;">No responses yet.</p>'}
          </div>
        </div>
      `;
    } catch (error) {
      showToast('Failed to load dashboard', 'error');
      console.error(error);
    }
  }

  /**
   * Render scenarios list
   */
  async renderScenarios() {
    try {
      const { scenarios } = await api.getScenarios();
      this.scenarios = scenarios;

      this.mainContent.innerHTML = `
        <div>
          <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h1>My Scenarios</h1>
            <button class="btn btn-primary" onclick="window.navigateTo('scenario-builder')">
              ➕ Create New
            </button>
          </div>

          ${scenarios.length > 0 ? `
            <div class="grid grid-2">
              ${scenarios.map(s => this.renderScenarioCard(s)).join('')}
            </div>
          ` : `
            <div class="glass-card text-center" style="padding: 3rem;">
              <h2>No Scenarios Yet</h2>
              <p style="color: var(--text-secondary); margin: 1rem 0;">
                Create your first assessment scenario to get started.
              </p>
              <button class="btn btn-primary mt-2" onclick="window.navigateTo('scenario-builder')">
                Create Scenario
              </button>
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
   * Render scenario card
   */
  renderScenarioCard(scenario) {
    return `
      <div class="glass-card">
        <div class="flex" style="justify-content: space-between; align-items: start;">
          <div>
            <h3>${escapeHTML(scenario.title)}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${escapeHTML(scenario.description || 'No description')}
            </p>
          </div>
          <span class="badge badge-${scenario.difficulty === 'hard' ? 'error' : scenario.difficulty === 'medium' ? 'warning' : 'success'}">
            ${scenario.difficulty}
          </span>
        </div>
        
        <div class="flex gap-1" style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
          <span>📝 ${scenario.questions.length} questions</span>
          <span>⏱️ ${scenario.time_limit} min</span>
          <span>🎯 ${scenario.passing_score}% pass</span>
        </div>
        
        <div class="flex gap-1" style="margin-top: 1.5rem;">
          <button class="btn btn-outline" onclick="window.recruiterDashboard.viewScenarioAnalytics(${scenario.id})">
            📊 Analytics
          </button>
          <button class="btn btn-outline" onclick="window.navigateTo('scenario-builder', {scenarioId: ${scenario.id}})">
            ✏️ Edit
          </button>
          <button class="btn btn-danger" onclick="window.recruiterDashboard.deleteScenario(${scenario.id})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }

  /**
   * View scenario analytics
   */
  async viewScenarioAnalytics(scenarioId) {
    try {
      const data = await api.getScenarioAnalytics(scenarioId);

      // Create modal for analytics
      const modal = document.createElement('div');
      modal.className = 'modal-overlay active';
      modal.innerHTML = `
        <div class="modal" style="max-width: 700px;">
          <h2>${escapeHTML(data.scenario.title)} - Analytics</h2>
          
          <div class="grid grid-2 mt-2 mb-2">
            <div class="stat-card">
              <div class="stat-value">${data.analytics.totalAttempts}</div>
              <div class="stat-label">Total Attempts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.analytics.avgScore}%</div>
              <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.analytics.passRate}%</div>
              <div class="stat-label">Pass Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatDuration(data.analytics.avgTime)}</div>
              <div class="stat-label">Avg. Time</div>
            </div>
          </div>
          
          <h3>Score Distribution</h3>
          <div class="grid grid-4 mt-2">
            <div class="stat-card">
              <div class="stat-value" style="font-size: 1.5rem;">${data.analytics.distribution.excellent}</div>
              <div class="stat-label">Excellent (90+)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="font-size: 1.5rem;">${data.analytics.distribution.good}</div>
              <div class="stat-label">Good (70-89)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="font-size: 1.5rem;">${data.analytics.distribution.average}</div>
              <div class="stat-label">Average (50-69)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="font-size: 1.5rem;">${data.analytics.distribution.poor}</div>
              <div class="stat-label">Poor (<50)</div>
            </div>
          </div>
          
          <button class="btn btn-primary mt-3" onclick="this.closest('.modal-overlay').remove()">
            Close
          </button>
        </div>
      `;

      document.body.appendChild(modal);
    } catch (error) {
      showToast('Failed to load analytics', 'error');
      console.error(error);
    }
  }

  /**
   * Delete scenario
   */
  async deleteScenario(scenarioId) {
    if (!confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteScenario(scenarioId);
      showToast('Scenario deleted successfully', 'success');
      this.renderScenarios();
    } catch (error) {
      showToast('Failed to delete scenario', 'error');
      console.error(error);
    }
  }

  /**
   * Render scenario builder
   */
  async renderScenarioBuilder(scenarioId = null) {
    let scenario = null;

    if (scenarioId) {
      try {
        const data = await api.getScenario(scenarioId);
        scenario = data.scenario;
      } catch (error) {
        showToast('Failed to load scenario', 'error');
        return;
      }
    }

    this.mainContent.innerHTML = `
      <div>
        <h1>${scenario ? 'Edit' : 'Create'} Scenario</h1>
        
        <form id="scenarioForm" class="glass-card">
          <div class="input-group">
            <label for="title">Scenario Title *</label>
            <input type="text" id="title" class="input-field" placeholder="e.g., Full Stack Developer Assessment" value="${scenario ? escapeHTML(scenario.title) : ''}" required>
          </div>
          
          <div class="input-group">
            <label for="description">Description</label>
            <textarea id="description" class="input-field" placeholder="Describe what this scenario assesses...">${scenario ? escapeHTML(scenario.description) : ''}</textarea>
          </div>
          
          <div class="grid grid-3">
            <div class="input-group">
              <label for="category">Category</label>
              <input type="text" id="category" class="input-field" placeholder="e.g., Software Engineering" value="${scenario ? escapeHTML(scenario.category) : 'General'}">
            </div>
            
            <div class="input-group">
              <label for="difficulty">Difficulty</label>
              <select id="difficulty" class="input-field">
                <option value="easy" ${scenario?.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                <option value="medium" ${!scenario || scenario?.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="hard" ${scenario?.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
              </select>
            </div>
            
            <div class="input-group">
              <label for="timeLimit">Time Limit (minutes)</label>
              <input type="number" id="timeLimit" class="input-field" value="${scenario ? scenario.time_limit : 30}" min="5" max="180">
            </div>
          </div>
          
          <div class="input-group">
            <label for="passingScore">Passing Score (%)</label>
            <input type="number" id="passingScore" class="input-field" value="${scenario ? scenario.passing_score : 70}" min="0" max="100">
          </div>
          
          <h3 class="mt-3">Questions</h3>
          <div id="questionsContainer">
            ${scenario && scenario.questions ? scenario.questions.map((q, i) => this.renderQuestionBuilder(q, i)).join('') : this.renderQuestionBuilder(null, 0)}
          </div>
          
          <button type="button" class="btn btn-outline mt-2" onclick="window.recruiterDashboard.addQuestion()">
            ➕ Add Question
          </button>
          
          <div class="flex gap-2 mt-3">
            <button type="submit" class="btn btn-primary">
              💾 ${scenario ? 'Update' : 'Create'} Scenario
            </button>
            <button type="button" class="btn btn-outline" onclick="window.navigateTo('scenarios')">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;

    // Set up form submission
    document.getElementById('scenarioForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveScenario(scenarioId);
    });

    this.questionCount = scenario ? scenario.questions.length : 1;
  }

  /**
   * Render question builder
   */
  renderQuestionBuilder(question = null, index = 0) {
    const type = question?.type || 'multiple-choice';

    return `
      <div class="glass-card mt-2" id="question-${index}">
        <div class="flex" style="justify-content: space-between; align-items: center;">
          <h4>Question ${index + 1}</h4>
          ${index > 0 ? `<button type="button" class="btn btn-danger" onclick="document.getElementById('question-${index}').remove()">Remove</button>` : ''}
        </div>
        
        <div class="grid grid-2">
          <div class="input-group">
            <label>Question Type</label>
            <select class="input-field question-type" data-index="${index}">
              <option value="multiple-choice" ${type === 'multiple-choice' ? 'selected' : ''}>Multiple Choice</option>
              <option value="text" ${type === 'text' ? 'selected' : ''}>Text Answer</option>
              <option value="coding" ${type === 'coding' ? 'selected' : ''}>Coding Challenge</option>
            </select>
          </div>
          
          <div class="input-group">
            <label>Weight (Points)</label>
            <input type="number" class="input-field question-weight" min="1" max="100" value="${question?.weight || 10}">
          </div>
        </div>
        
        <div class="input-group">
          <label>Question Text *</label>
          <textarea class="input-field question-text" placeholder="Enter your question here..." required>${question ? escapeHTML(question.question) : ''}</textarea>
        </div>
        
        <div class="question-specific-${index}">
          ${this.renderQuestionSpecificFields(type, question, index)}
        </div>
      </div>
    `;
  }

  /**
   * Render question type specific fields
   */
  renderQuestionSpecificFields(type, question, index) {
    if (type === 'multiple-choice') {
      const options = question?.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      return `
        <div class="input-group">
          <label>Options (one per line)</label>
          <textarea class="input-field question-options" placeholder="Option 1\nOption 2\nOption 3\nOption 4" rows="4">${options.join('\n')}</textarea>
        </div>
        <div class="input-group">
          <label>Correct Answer (index, 0-based)</label>
          <input type="number" class="input-field question-correct" min="0" value="${question?.correctAnswer || 0}">
        </div>
      `;
    } else if (type === 'text' || type === 'coding') {
      return `
        <div class="input-group">
          <label>Evaluation Rubric / Expected Answer</label>
          <textarea class="input-field question-rubric" placeholder="Describe what a good answer should include...">${question?.rubric || ''}</textarea>
        </div>
        <div class="input-group">
          <label>Keywords (comma-separated, for basic scoring)</label>
          <input type="text" class="input-field question-keywords" placeholder="keyword1, keyword2, keyword3" value="${question?.keywords?.join(', ') || ''}">
        </div>
      `;
    }
    return '';
  }

  /**
   * Add new question
   */
  addQuestion() {
    const container = document.getElementById('questionsContainer');
    const newQuestion = document.createElement('div');
    newQuestion.innerHTML = this.renderQuestionBuilder(null, this.questionCount);
    container.appendChild(newQuestion.firstElementChild);
    this.questionCount++;

    // Add event listener for type change
    this.setupQuestionTypeListeners();
  }

  /**
   * Set up question type change listeners
   */
  setupQuestionTypeListeners() {
    document.querySelectorAll('.question-type').forEach(select => {
      select.addEventListener('change', (e) => {
        const index = e.target.dataset.index;
        const type = e.target.value;
        const container = document.querySelector(`.question-specific-${index}`);
        container.innerHTML = this.renderQuestionSpecificFields(type, null, index);
      });
    });
  }

  /**
   * Save scenario
   */
  async saveScenario(scenarioId) {
    try {
      // Collect form data
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const category = document.getElementById('category').value;
      const difficulty = document.getElementById('difficulty').value;
      const timeLimit = parseInt(document.getElementById('timeLimit').value);
      const passingScore = parseInt(document.getElementById('passingScore').value);

      // Collect questions
      const questions = [];
      document.querySelectorAll('[id^="question-"]').forEach((questionEl, index) => {
        const type = questionEl.querySelector('.question-type').value;
        const weight = parseInt(questionEl.querySelector('.question-weight').value);
        const questionText = questionEl.querySelector('.question-text').value;

        const question = {
          index,
          type,
          weight,
          question: questionText
        };

        if (type === 'multiple-choice') {
          const optionsText = questionEl.querySelector('.question-options').value;
          question.options = optionsText.split('\n').filter(o => o.trim());
          question.correctAnswer = parseInt(questionEl.querySelector('.question-correct').value);
        } else {
          question.rubric = questionEl.querySelector('.question-rubric')?.value || '';
          const keywordsText = questionEl.querySelector('.question-keywords')?.value || '';
          question.keywords = keywordsText.split(',').map(k => k.trim()).filter(k => k);
        }

        questions.push(question);
      });

      const scenarioData = {
        title,
        description,
        category,
        difficulty,
        questions,
        timeLimit,
        passingScore
      };

      if (scenarioId) {
        await api.updateScenario(scenarioId, scenarioData);
        showToast('Scenario updated successfully', 'success');
      } else {
        await api.createScenario(scenarioData);
        showToast('Scenario created successfully', 'success');
      }

      window.navigateTo('scenarios');
    } catch (error) {
      showToast('Failed to save scenario', 'error');
      console.error(error);
    }
  }

  /**
   * Render analytics page
   */
  async renderAnalytics() {
    try {
      const overview = await api.getAnalyticsOverview();

      this.mainContent.innerHTML = `
        <div>
          <h1>Analytics & Insights</h1>
          
          <div class="grid grid-4 mt-2 mb-3">
            <div class="stat-card">
              <div class="stat-value">${overview.stats.totalScenarios}</div>
              <div class="stat-label">Total Scenarios</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${overview.stats.totalApplicants}</div>
              <div class="stat-label">Total Applicants</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${overview.stats.totalResponses}</div>
              <div class="stat-label">Total Responses</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${overview.stats.avgScore}%</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>
          
          <div class="glass-card">
            <h3>Platform Overview</h3>
            <p style="color: var(--text-secondary); margin-top: 1rem;">
              Your recruitment simulation platform is helping evaluate candidates effectively. ${overview.stats.totalResponses} assessments completed with an average score of ${overview.stats.avgScore}%.
            </p>
            
            ${overview.stats.totalResponses > 0 ? `
              <p style="color: var(--text-secondary); margin-top: 1rem;">
                Click on individual scenarios in the "Manage Scenarios" page to view detailed analytics for each assessment.
              </p>
            ` : `
              <p style="color: var(--warning); margin-top: 1rem;">
                No responses yet. Share your scenarios with applicants to start gathering data.
              </p>
            `}
          </div>
        </div>
      `;
    } catch (error) {
      showToast('Failed to load analytics', 'error');
      console.error(error);
    }
  }
}

// Create global instance
window.recruiterDashboard = new RecruiterDashboard();
