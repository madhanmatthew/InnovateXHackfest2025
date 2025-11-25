const express = require('express');
const { queries } = require('../database');
const { authenticateToken, requireRecruiter } = require('../middleware/auth');

const router = express.Router();

// Get all scenarios (with optional filters)
router.get('/', authenticateToken, (req, res) => {
    try {
        const { category, difficulty } = req.query;

        let scenarios = queries.getAllScenarios();

        // Apply filters
        if (category) {
            scenarios = scenarios.filter(s => s.category === category);
        }
        if (difficulty) {
            scenarios = scenarios.filter(s => s.difficulty === difficulty);
        }

        // Parse JSON fields
        scenarios = scenarios.map(s => ({
            ...s,
            questions: JSON.parse(s.questions_json),
            customizations: s.customizations_json ? JSON.parse(s.customizations_json) : {}
        }));

        // Remove internal fields
        scenarios.forEach(s => {
            delete s.questions_json;
            delete s.customizations_json;
        });

        res.json({ scenarios });
    } catch (error) {
        console.error('Get scenarios error:', error);
        res.status(500).json({ error: 'Failed to fetch scenarios' });
    }
});

// Get specific scenario by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const scenario = queries.getScenarioById(parseInt(req.params.id));

        if (!scenario) {
            return res.status(404).json({ error: 'Scenario not found' });
        }

        // Parse JSON fields
        scenario.questions = JSON.parse(scenario.questions_json);
        scenario.customizations = scenario.customizations_json ? JSON.parse(scenario.customizations_json) : {};
        delete scenario.questions_json;
        delete scenario.customizations_json;

        res.json({ scenario });
    } catch (error) {
        console.error('Get scenario error:', error);
        res.status(500).json({ error: 'Failed to fetch scenario' });
    }
});

// Create new scenario (recruiter only)
router.post('/', authenticateToken, requireRecruiter, (req, res) => {
    try {
        const { title, description, category, difficulty, questions, timeLimit, passingScore, customizations } = req.body;

        // Validation
        if (!title || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Title and questions are required' });
        }

        const result = queries.createScenario(
            title,
            description || '',
            category || 'General',
            difficulty || 'medium',
            JSON.stringify(questions),
            timeLimit || 30,
            passingScore || 70,
            req.user.id,
            JSON.stringify(customizations || {})
        );

        res.status(201).json({
            message: 'Scenario created successfully',
            scenarioId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create scenario error:', error);
        res.status(500).json({ error: 'Failed to create scenario' });
    }
});

// Update scenario (recruiter only, own scenarios)
router.put('/:id', authenticateToken, requireRecruiter, (req, res) => {
    try {
        const { title, description, category, difficulty, questions, timeLimit, passingScore, customizations } = req.body;

        const result = queries.updateScenario(
            title,
            description,
            category,
            difficulty,
            JSON.stringify(questions),
            timeLimit,
            passingScore,
            JSON.stringify(customizations || {}),
            parseInt(req.params.id),
            req.user.id
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Scenario not found or unauthorized' });
        }

        res.json({ message: 'Scenario updated successfully' });
    } catch (error) {
        console.error('Update scenario error:', error);
        res.status(500).json({ error: 'Failed to update scenario' });
    }
});

// Delete scenario (recruiter only, own scenarios)
router.delete('/:id', authenticateToken, requireRecruiter, (req, res) => {
    try {
        const result = queries.deleteScenario(parseInt(req.params.id), req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Scenario not found or unauthorized' });
        }

        res.json({ message: 'Scenario deleted successfully' });
    } catch (error) {
        console.error('Delete scenario error:', error);
        res.status(500).json({ error: 'Failed to delete scenario' });
    }
});

module.exports = router;
