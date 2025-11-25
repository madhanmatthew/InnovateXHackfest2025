const express = require('express');
const { queries } = require('../database');
const { authenticateToken, requireRecruiter } = require('../middleware/auth');

const router = express.Router();

// Get overview statistics (recruiter only)
router.get('/overview', authenticateToken, requireRecruiter, (req, res) => {
    try {
        const stats = queries.getOverviewStats();

        // Get recent responses (using sql.js exec method)
        const { db } = require('../database');
        const result = db.exec(`
      SELECT r.*, u.name as applicant_name, s.title as scenario_title
      FROM responses r
      LEFT JOIN users u ON r.applicant_id = u.id
      LEFT JOIN scenarios s ON r.scenario_id = s.id
      ORDER BY r.submitted_at DESC
      LIMIT 10
    `);

        const recentResponses = result.length > 0 ? result[0].values.map(row => {
            const obj = {};
            result[0].columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        }) : [];

        res.json({
            stats: {
                totalScenarios: stats.total_scenarios || 0,
                totalApplicants: stats.total_applicants || 0,
                totalResponses: stats.total_responses || 0,
                avgScore: stats.avg_score ? Math.round(stats.avg_score * 10) / 10 : 0
            },
            recentResponses
        });
    } catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Get scenario-specific analytics (recruiter only)
router.get('/scenarios/:id', authenticateToken, requireRecruiter, (req, res) => {
    try {
        const scenarioId = parseInt(req.params.id);

        // Get scenario details
        const scenario = queries.getScenarioById(scenarioId);
        if (!scenario) {
            return res.status(404).json({ error: 'Scenario not found' });
        }

        // Get all responses for this scenario
        const responses = queries.getResponsesByScenario(scenarioId);

        // Calculate statistics
        const scores = responses.map(r => r.total_score).filter(s => s !== null);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const passRate = responses.length > 0
            ? (responses.filter(r => r.total_score >= scenario.passing_score).length / responses.length) * 100
            : 0;

        // Score distribution
        const distribution = {
            excellent: responses.filter(r => r.total_score >= 90).length,
            good: responses.filter(r => r.total_score >= 70 && r.total_score < 90).length,
            average: responses.filter(r => r.total_score >= 50 && r.total_score < 70).length,
            poor: responses.filter(r => r.total_score < 50).length
        };

        // Time statistics
        const times = responses.map(r => r.time_spent).filter(t => t !== null);
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

        res.json({
            scenario: {
                id: scenario.id,
                title: scenario.title,
                category: scenario.category,
                difficulty: scenario.difficulty
            },
            analytics: {
                totalAttempts: responses.length,
                avgScore: Math.round(avgScore * 10) / 10,
                passRate: Math.round(passRate * 10) / 10,
                avgTime: Math.round(avgTime),
                distribution
            }
        });
    } catch (error) {
        console.error('Scenario analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch scenario analytics' });
    }
});

// Get performance trends over time (recruiter only)
router.get('/performance', authenticateToken, requireRecruiter, (req, res) => {
    try {
        const { db } = require('../database');
        const result = db.exec(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as count,
        AVG(total_score) as avg_score
      FROM responses
      WHERE submitted_at >= DATE('now', '-30 days')
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `);

        const trends = result.length > 0 ? result[0].values.map(row => ({
            date: row[0],
            count: row[1],
            avg_score: row[2]
        })) : [];

        res.json({ trends });
    } catch (error) {
        console.error('Performance trends error:', error);
        res.status(500).json({ error: 'Failed to fetch performance trends' });
    }
});

module.exports = router;
