const express = require('express');
const { queries } = require('../database');
const { authenticateToken, requireRecruiter } = require('../middleware/auth');
const { evaluateResponse } = require('../scoring-engine');

const router = express.Router();

// Submit applicant response
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { scenarioId, answers, timeSpent } = req.body;

        if (!scenarioId || !answers) {
            return res.status(400).json({ error: 'Scenario ID and answers are required' });
        }

        // Get scenario for scoring
        const scenario = queries.getScenarioById.get(scenarioId);
        if (!scenario) {
            return res.status(404).json({ error: 'Scenario not found' });
        }

        // Parse scenario questions
        const questions = JSON.parse(scenario.questions_json);

        // Evaluate response
        const evaluation = await evaluateResponse(questions, answers);

        // Store response
        const result = queries.createResponse.run(
            scenarioId,
            req.user.id,
            JSON.stringify(answers),
            timeSpent || 0,
            JSON.stringify(evaluation.scores),
            JSON.stringify(evaluation.aiEvaluation || {}),
            evaluation.totalScore
        );

        res.status(201).json({
            message: 'Response submitted successfully',
            responseId: result.lastInsertRowid,
            totalScore: evaluation.totalScore,
            passed: evaluation.totalScore >= scenario.passing_score
        });
    } catch (error) {
        console.error('Submit response error:', error);
        res.status(500).json({ error: 'Failed to submit response' });
    }
});

// Get specific response by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const response = queries.getResponseById.get(req.params.id);

        if (!response) {
            return res.status(404).json({ error: 'Response not found' });
        }

        // Check authorization (own response or recruiter viewing their scenario)
        if (req.user.role === 'applicant' && response.applicant_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Parse JSON fields
        response.answers = JSON.parse(response.answers_json);
        response.scores = JSON.parse(response.scores_json);
        response.aiEvaluation = response.ai_evaluation_json ? JSON.parse(response.ai_evaluation_json) : {};
        delete response.answers_json;
        delete response.scores_json;
        delete response.ai_evaluation_json;

        res.json({ response });
    } catch (error) {
        console.error('Get response error:', error);
        res.status(500).json({ error: 'Failed to fetch response' });
    }
});

// Get all responses for a scenario (recruiter only)
router.get('/scenario/:scenarioId', authenticateToken, requireRecruiter, (req, res) => {
    try {
        const responses = queries.getResponsesByScenario.all(req.params.scenarioId);

        // Parse JSON fields
        const parsedResponses = responses.map(r => ({
            ...r,
            answers: JSON.parse(r.answers_json),
            scores: JSON.parse(r.scores_json),
            aiEvaluation: r.ai_evaluation_json ? JSON.parse(r.ai_evaluation_json) : {}
        }));

        parsedResponses.forEach(r => {
            delete r.answers_json;
            delete r.scores_json;
            delete r.ai_evaluation_json;
        });

        res.json({ responses: parsedResponses });
    } catch (error) {
        console.error('Get scenario responses error:', error);
        res.status(500).json({ error: 'Failed to fetch responses' });
    }
});

// Get all responses by applicant
router.get('/applicant/:applicantId', authenticateToken, (req, res) => {
    try {
        // Check authorization
        if (req.user.role === 'applicant' && req.user.id !== parseInt(req.params.applicantId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const responses = queries.getResponsesByApplicant.all(req.params.applicantId);

        // Parse JSON fields
        const parsedResponses = responses.map(r => ({
            ...r,
            answers: JSON.parse(r.answers_json),
            scores: JSON.parse(r.scores_json),
            aiEvaluation: r.ai_evaluation_json ? JSON.parse(r.ai_evaluation_json) : {}
        }));

        parsedResponses.forEach(r => {
            delete r.answers_json;
            delete r.scores_json;
            delete r.ai_evaluation_json;
        });

        res.json({ responses: parsedResponses });
    } catch (error) {
        console.error('Get applicant responses error:', error);
        res.status(500).json({ error: 'Failed to fetch responses' });
    }
});

module.exports = router;
