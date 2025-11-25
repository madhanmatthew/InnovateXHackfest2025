const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI (optional)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Evaluate applicant response against scenario questions
 * @param {Array} questions - Array of question objects
 * @param {Array} answers - Array of answer objects
 * @returns {Object} Evaluation result with scores and feedback
 */
async function evaluateResponse(questions, answers) {
    const scores = [];
    let totalPoints = 0;
    let earnedPoints = 0;

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const answer = answers[i];
        const weight = question.weight || 1;

        let score = {
            questionIndex: i,
            questionText: question.question,
            type: question.type,
            maxPoints: weight,
            earnedPoints: 0,
            feedback: ''
        };

        switch (question.type) {
            case 'multiple-choice':
                score = evaluateMultipleChoice(question, answer, weight);
                break;

            case 'text':
                score = await evaluateTextAnswer(question, answer, weight);
                break;

            case 'coding':
                score = await evaluateCodingAnswer(question, answer, weight);
                break;

            default:
                score.feedback = 'Question type not supported';
        }

        scores.push(score);
        totalPoints += weight;
        earnedPoints += score.earnedPoints;
    }

    // Calculate percentage score
    const totalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Generate overall AI evaluation
    let aiEvaluation = null;
    if (genAI) {
        aiEvaluation = await generateAIEvaluation(questions, answers, scores, totalScore);
    }

    return {
        scores,
        totalScore: Math.round(totalScore * 10) / 10,
        earnedPoints,
        totalPoints,
        aiEvaluation
    };
}

/**
 * Evaluate multiple choice question
 */
function evaluateMultipleChoice(question, answer, weight) {
    const isCorrect = answer.selectedOption === question.correctAnswer;

    return {
        questionIndex: question.index,
        questionText: question.question,
        type: 'multiple-choice',
        maxPoints: weight,
        earnedPoints: isCorrect ? weight : 0,
        feedback: isCorrect ? '✓ Correct answer' : `✗ Incorrect. Correct answer: ${question.options[question.correctAnswer]}`
    };
}

/**
 * Evaluate text answer using AI or keyword matching
 */
async function evaluateTextAnswer(question, answer, weight) {
    const userAnswer = answer.textAnswer || '';

    // Use AI evaluation if available
    if (genAI && userAnswer.length > 10) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const prompt = `
You are an expert evaluator for recruitment assessments. Evaluate this answer:

Question: ${question.question}
Expected Answer/Rubric: ${question.rubric || 'N/A'}
Applicant's Answer: ${userAnswer}

Provide:
1. Score (0-${weight}) based on accuracy, completeness, and relevance
2. Brief feedback (2-3 sentences)

Format your response as JSON:
{
  "score": <number>,
  "feedback": "<string>"
}
      `.trim();

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse AI response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiResult = JSON.parse(jsonMatch[0]);
                return {
                    questionIndex: question.index,
                    questionText: question.question,
                    type: 'text',
                    maxPoints: weight,
                    earnedPoints: Math.min(aiResult.score, weight),
                    feedback: aiResult.feedback
                };
            }
        } catch (error) {
            console.error('AI evaluation error:', error);
        }
    }

    // Fallback: keyword-based evaluation
    return evaluateByKeywords(question, userAnswer, weight);
}

/**
 * Evaluate coding answer
 */
async function evaluateCodingAnswer(question, answer, weight) {
    const code = answer.codeAnswer || '';

    if (genAI && code.length > 10) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const prompt = `
You are a senior software engineer evaluating a coding assessment.

Question: ${question.question}
Expected Solution/Requirements: ${question.rubric || 'N/A'}
Applicant's Code:
\`\`\`
${code}
\`\`\`

Evaluate on:
- Correctness (does it solve the problem?)
- Code quality (readability, structure)
- Best practices
- Edge case handling

Provide:
1. Score (0-${weight})
2. Detailed feedback highlighting strengths and areas for improvement

Format as JSON:
{
  "score": <number>,
  "feedback": "<string>"
}
      `.trim();

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiResult = JSON.parse(jsonMatch[0]);
                return {
                    questionIndex: question.index,
                    questionText: question.question,
                    type: 'coding',
                    maxPoints: weight,
                    earnedPoints: Math.min(aiResult.score, weight),
                    feedback: aiResult.feedback
                };
            }
        } catch (error) {
            console.error('AI coding evaluation error:', error);
        }
    }

    // Fallback: basic evaluation
    return {
        questionIndex: question.index,
        questionText: question.question,
        type: 'coding',
        maxPoints: weight,
        earnedPoints: code.length > 50 ? weight * 0.5 : 0,
        feedback: 'Code submitted. Manual review recommended.'
    };
}

/**
 * Keyword-based evaluation (fallback)
 */
function evaluateByKeywords(question, answer, weight) {
    if (!question.keywords || question.keywords.length === 0) {
        return {
            questionIndex: question.index,
            questionText: question.question,
            type: 'text',
            maxPoints: weight,
            earnedPoints: answer.length > 20 ? weight * 0.5 : 0,
            feedback: 'Answer received. Contains sufficient detail.'
        };
    }

    const lowerAnswer = answer.toLowerCase();
    const matchedKeywords = question.keywords.filter(kw =>
        lowerAnswer.includes(kw.toLowerCase())
    );

    const ratio = matchedKeywords.length / question.keywords.length;
    const earnedPoints = ratio * weight;

    return {
        questionIndex: question.index,
        questionText: question.question,
        type: 'text',
        maxPoints: weight,
        earnedPoints,
        feedback: `Matched ${matchedKeywords.length}/${question.keywords.length} key concepts. ${ratio >= 0.7 ? 'Good coverage!' : 'Consider addressing: ' + question.keywords.filter(k => !matchedKeywords.includes(k)).join(', ')
            }`
    };
}

/**
 * Generate overall AI evaluation and recommendations
 */
async function generateAIEvaluation(questions, answers, scores, totalScore) {
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
You are a recruitment expert providing feedback on a candidate's assessment.

Overall Score: ${totalScore}%

Performance by Question:
${scores.map((s, i) => `${i + 1}. ${s.questionText}: ${s.earnedPoints}/${s.maxPoints} points`).join('\n')}

Provide:
1. Overall performance summary (2-3 sentences)
2. Top 3 strengths
3. Top 3 areas for improvement
4. Recommendation (hire/maybe/no based on score)

Format as JSON:
{
  "summary": "<string>",
  "strengths": ["<string>", "<string>", "<string>"],
  "improvements": ["<string>", "<string>", "<string>"],
  "recommendation": "<hire|maybe|no>"
}
    `.trim();

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error('AI overall evaluation error:', error);
    }

    return null;
}

module.exports = {
    evaluateResponse
};
