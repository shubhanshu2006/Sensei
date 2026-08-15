import { StateGraph, END, START } from '@langchain/langgraph';
import { llmClient } from './LLMClient.js';
import { logger } from '../../utils/logger.js';

// ---------------------------------------------------------------------------
// InterviewGraph - LangGraph state machine for adaptive interviews
// ---------------------------------------------------------------------------

export interface InterviewState {
  // Context
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  requiredSkills: string[];
  targetQuestions: number;

  // Progress
  currentQuestionIndex: number;
  questionsAsked: Array<{
    question: string;
    answer?: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;

  // Dynamic state
  currentQuestion?: string;
  currentTopic?: string;
  topicsCovered: string[];
  shouldContinue: boolean;
}

export class InterviewGraph {
  private graph: StateGraph<InterviewState>;

  constructor() {
    this.graph = new StateGraph<InterviewState>({
      channels: {
        resumeText: null,
        jobDescription: null,
        jobTitle: null,
        requiredSkills: null,
        targetQuestions: null,
        currentQuestionIndex: null,
        questionsAsked: null,
        currentQuestion: null,
        currentTopic: null,
        topicsCovered: null,
        shouldContinue: null,
      },
    });

    this.setupGraph();
  }

  // Graph Setup

  private setupGraph() {
    // Node: Generate next question
    this.graph.addNode('generate_question', async (state: InterviewState) => {
      logger.info('[InterviewGraph] Generating question', {
        index: state.currentQuestionIndex,
      });

      // Select topic not yet covered
      const uncoveredSkills = state.requiredSkills.filter(
        (skill) => !state.topicsCovered.includes(skill.toLowerCase()),
      );

      const topic = uncoveredSkills[0] || state.requiredSkills[0] || 'general';

      // Generate question using LLM
      const prompt = `You are conducting a technical interview for the position of {jobTitle}.

Job Description:
{jobDescription}

Candidate Resume Summary:
{resumeText}

Questions Asked So Far:
{previousQuestions}

Generate the next interview question focusing on: {topic}

The question should:
- Be open-ended and behavioral/technical
- Match the candidate's experience level
- Allow them to demonstrate practical knowledge
- Take 2-3 minutes to answer

Return only the question text, no preamble.`;

      const question = await llmClient.generateText(
        prompt,
        {
          jobTitle: state.jobTitle,
          jobDescription: state.jobDescription.substring(0, 1000),
          resumeText: state.resumeText.substring(0, 1500),
          topic,
          previousQuestions: state.questionsAsked.map((q) => `- ${q.question}`).join('\n'),
        },
        { temperature: 0.8, maxTokens: 300 },
      );

      return {
        ...state,
        currentQuestion: question.trim(),
        currentTopic: topic,
        topicsCovered: [...state.topicsCovered, topic.toLowerCase()],
      };
    });

    // Node: Wait for answer (placeholder - actual waiting happens in WebSocket)
    this.graph.addNode('await_answer', async (state: InterviewState) => {
      logger.info('[InterviewGraph] Awaiting candidate answer...');
      return state;
    });

    // Node: Analyze response
    this.graph.addNode('analyze_response', async (state: InterviewState) => {
      const currentQA = state.questionsAsked[state.currentQuestionIndex];

      if (!currentQA?.answer) {
        logger.warn('[InterviewGraph] No answer to analyze, skipping');
        return state;
      }

      logger.info('[InterviewGraph] Analyzing response', {
        index: state.currentQuestionIndex,
      });

      // Analyze answer quality (Phase 3 - basic implementation)
      const prompt = `Analyze this interview response:

Question: {question}
Answer: {answer}

Rate the response on:
1. Clarity (0-10)
2. Technical depth (0-10)
3. Relevance (0-10)

Return JSON: { "clarity": X, "depth": X, "relevance": X, "feedback": "brief comment" }`;

      try {
        const analysis = await llmClient.generateJSON(
          prompt,
          {
            question: currentQA.question,
            answer: currentQA.answer.substring(0, 2000),
          },
          { temperature: 0.3, maxTokens: 200 },
        );

        logger.info('[InterviewGraph] Response analyzed', { analysis });
      } catch (error) {
        logger.error('[InterviewGraph] Analysis failed', error);
      }

      return state;
    });

    // Node: Decide next action
    this.graph.addNode('decide_next', async (state: InterviewState) => {
      const shouldContinue = state.currentQuestionIndex + 1 < state.targetQuestions;

      logger.info('[InterviewGraph] Deciding next action', {
        currentIndex: state.currentQuestionIndex,
        target: state.targetQuestions,
        continue: shouldContinue,
      });

      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        shouldContinue,
      };
    });

    // Define edges
    this.graph.addEdge('generate_question' as any, 'await_answer' as any);
    this.graph.addEdge('await_answer' as any, 'analyze_response' as any);
    this.graph.addEdge('analyze_response' as any, 'decide_next' as any);
    
    // Conditional edge - continue or end
    this.graph.addConditionalEdges(
      'decide_next' as any,
      (state: any) => (state.shouldContinue ? 'generate_question' : END)
    );

    // Set entry point
    this.graph.addEdge(START, 'generate_question' as any);
  }

  // runInterview
  // Executes the interview flow and returns generated questions.
  //
  // Note: This is a stateful process - call updateStateWithAnswer() between
  // questions to feed candidate responses back into the graph.

  async runInterview(input: {
    resumeText: string;
    jobDescription: string;
    jobTitle: string;
    requiredSkills: string[];
    targetQuestions?: number;
  }): Promise<string[]> {
    logger.info('[InterviewGraph] Starting interview generation', {
      jobTitle: input.jobTitle,
      targetQuestions: input.targetQuestions || 10,
    });

    const initialState: InterviewState = {
      resumeText: input.resumeText,
      jobDescription: input.jobDescription,
      jobTitle: input.jobTitle,
      requiredSkills: input.requiredSkills,
      targetQuestions: input.targetQuestions || 10,
      currentQuestionIndex: 0,
      questionsAsked: [],
      topicsCovered: [],
      shouldContinue: true,
    };

    const compiledGraph = this.graph.compile();
    const result: any = await compiledGraph.invoke(initialState as any);

    const questions = result.questionsAsked?.map((qa: any) => qa.question) || [];

    logger.info('[InterviewGraph] Interview generation complete', {
      questionsGenerated: questions.length,
    });

    return questions;
  }

  // generateSingleQuestion
  // Generates one question at a time (for real-time WebSocket flow).

  async generateSingleQuestion(input: {
    resumeText: string;
    jobDescription: string;
    jobTitle: string;
    requiredSkills: string[];
    questionIndex: number;
    previousQuestions: string[];
  }): Promise<string> {
    logger.info('[InterviewGraph] Generating single question', {
      index: input.questionIndex,
    });

    const prompt = `You are conducting a technical interview for {jobTitle}.

Job Description:
{jobDescription}

Candidate Resume:
{resumeText}

Previous Questions:
{previousQuestions}

Generate question #{questionNumber} focusing on: {skill}

Requirements:
- Open-ended and behavioral/technical
- Should take 2-3 minutes to answer
- Match candidate's experience level

Return only the question text.`;

    const question = await llmClient.generateText(
      prompt,
      {
        jobTitle: input.jobTitle,
        jobDescription: input.jobDescription.substring(0, 1000),
        resumeText: input.resumeText.substring(0, 1500),
        previousQuestions: input.previousQuestions.join('\n'),
        questionNumber: input.questionIndex + 1,
        skill: input.requiredSkills[input.questionIndex % input.requiredSkills.length] || 'general',
      },
      { temperature: 0.8, maxTokens: 300 },
    );

    return question.trim();
  }
}

export const interviewGraph = new InterviewGraph();
