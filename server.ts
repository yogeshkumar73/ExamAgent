import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Health & Document context status endpoint
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      aiConfigured: Boolean(getGenAIClient()),
      blueprintSource: 'SkillArena_AI_Full_Project_Plan_87a08dd7.pdf',
    });
  });

  // Evaluate interview response grounded in SkillArena AI Blueprint rubric (Section 5 & Section 16)
  app.post('/api/v1/interviewer/evaluate', async (req, res) => {
    try {
      const {
        question,
        category,
        difficulty,
        topic,
        referenceAnswer,
        rubricCriteria,
        userAnswer,
        sourceContext,
      } = req.body;

      if (!userAnswer || typeof userAnswer !== 'string' || !userAnswer.trim()) {
        res.status(400).json({ error: 'User answer is required for evaluation.' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI_FALLBACK_MODE',
          message: 'Using local deterministic rubric evaluator.',
        });
        return;
      }

      const systemInstruction = `SYSTEM ROLE: AI educational assessment and technical/behavioral interview evaluation agent for SkillArena AI.
OBJECTIVE: Evaluate the candidate's response using the supplied source content (SkillArena AI Technical Blueprint & Candidate Experience), question, reference answer, and weighted rubric.
RULES:
1. Assess meaning and conceptual correctness, not exact wording.
2. List correct, incorrect, and missing concepts.
3. Do not invent unsupported facts.
4. Disclose ambiguity if source evidence is insufficient.
5. Give a refined, production-grade corrected answer and actionable improvement suggestions.
6. Apply the 5-part rubric consistently:
   - Conceptual Correctness (weight 40%)
   - Key Concept Coverage (weight 25%)
   - Explanation Quality (weight 15%)
   - Practical Application / Trade-offs (weight 10%)
   - Clarity & Structure / STAR Method (weight 10%)
7. Rating tiers:
   - 90-100: "Excellent"
   - 75-89: "Good"
   - 50-74: "Needs Improvement"
   - 0-49: "Weak"
8. Also generate one targeted follow-up probing question based on what the candidate missed or can deepen.`;

      const prompt = `SOURCE CONTEXT (Candidate Document & Experience Blueprint):
${sourceContext || 'SkillArena AI Full Project Plan: React + Vite, Python FastAPI, Pydantic, Pandas, NumPy, Scikit-learn (Bayesian Knowledge Tracing, Logistic Regression, Random Forest, EMA), MongoDB (10 collections), Redis (caching, rate limits, locks, leaderboard TTLs), modular monolith HLD/LLD.'}

INTERVIEW QUESTION (${category || 'Technical'} | Topic: ${topic || 'System Design'} | Difficulty: ${difficulty || 'Hard'}):
${question}

REFERENCE ANSWER & RUBRIC ANCHORS:
${referenceAnswer}
Key Rubric Concepts: ${Array.isArray(rubricCriteria) ? rubricCriteria.join(', ') : ''}

CANDIDATE SUBMITTED ANSWER:
${userAnswer}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.NUMBER,
                description: 'Overall weighted score from 0 to 100.',
              },
              rating: {
                type: Type.STRING,
                description: 'Must be one of: Excellent, Good, Needs Improvement, Weak',
              },
              criterionBreakdown: {
                type: Type.OBJECT,
                properties: {
                  conceptualCorrectness: {
                    type: Type.NUMBER,
                    description: 'Score out of 40',
                  },
                  conceptCoverage: {
                    type: Type.NUMBER,
                    description: 'Score out of 25',
                  },
                  explanationQuality: {
                    type: Type.NUMBER,
                    description: 'Score out of 15',
                  },
                  practicalApplication: {
                    type: Type.NUMBER,
                    description: 'Score out of 10',
                  },
                  clarityAndStructure: {
                    type: Type.NUMBER,
                    description: 'Score out of 10',
                  },
                },
                required: [
                  'conceptualCorrectness',
                  'conceptCoverage',
                  'explanationQuality',
                  'practicalApplication',
                  'clarityAndStructure',
                ],
              },
              correctConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              missingConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctedAnswer: {
                type: Type.STRING,
              },
              improvementSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              followUpQuestion: {
                type: Type.STRING,
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Evaluator confidence between 0.80 and 0.99',
              },
            },
            required: [
              'score',
              'rating',
              'criterionBreakdown',
              'correctConcepts',
              'missingConcepts',
              'correctedAnswer',
              'improvementSuggestions',
              'followUpQuestion',
              'confidence',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json({ success: true, data: parsed, source: 'gemini-3.8-flash' });
    } catch (error: any) {
      console.error('Evaluation error:', error?.message || error);
      res.status(500).json({
        error: 'EVALUATION_FAILED',
        message: error?.message || 'Failed to evaluate with AI provider',
      });
    }
  });

  // Generate new grounded interview questions from custom source material or blueprint topics
  app.post('/api/v1/interviewer/generate-question', async (req, res) => {
    try {
      const { topic, category, difficulty, customDocumentText } = req.body;
      const ai = getGenAIClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI_FALLBACK_MODE',
          message: 'Using curated blueprint question bank.',
        });
        return;
      }

      const systemInstruction = `You are a Principal Engineering & Behavioral Interviewer generating a grounded question based on the candidate's technical blueprint and professional experience document.
Generate 1 rigorous, realistic interview question matching the requested topic, category, and difficulty, complete with a comprehensive reference answer, 4-5 key rubric concepts, and a helpful hint.`;

      const prompt = `CANDIDATE DOCUMENT / EXPERIENCE SOURCE:
${customDocumentText || 'SkillArena AI Full Project Plan: Modular monolith using React + TypeScript + Vite, Python FastAPI, Pydantic, Pandas, NumPy, Scikit-learn (Bayesian Knowledge Tracing, Logistic Regression, Random Forest, EMA mastery), MongoDB (10 collections with TTL indexes), Redis (caching topic_analysis 24h, questions 12h, evaluation 1h, distributed locks, rate limiting, leaderboard), anonymous IndexedDB session persistence, and server-side idempotent XP gamification.'}

Generate a ${difficulty || 'Hard'} ${category || 'Technical'} interview question focused on topic: "${topic || 'FastAPI & Redis Caching'}".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              question: { type: Type.STRING },
              topic: { type: Type.STRING },
              category: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              hint: { type: Type.STRING },
              referenceAnswer: { type: Type.STRING },
              rubricConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              expectedDurationSec: { type: Type.NUMBER },
            },
            required: [
              'title',
              'question',
              'topic',
              'category',
              'difficulty',
              'hint',
              'referenceAnswer',
              'rubricConcepts',
              'expectedDurationSec',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Question generation error:', error?.message || error);
      res.status(500).json({
        error: 'GENERATION_FAILED',
        message: error?.message || 'Failed to generate question',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillArena AI server running on http://localhost:${PORT}`);
  });
}

startServer();
