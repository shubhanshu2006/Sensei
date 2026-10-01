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

export type AnswerQuality = 'strong' | 'adequate' | 'weak' | 'vague' | 'incorrect' | 'off_topic' | 'abusive';

// Max consecutive probing questions on the same topic before the interviewer moves on.
export const MAX_CONSECUTIVE_FOLLOW_UPS = 2;

export interface SingleQuestionInput {
  candidateName?: string;
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  requiredSkills: string[];
  category?: string;
  questionIndex: number;
  previousQuestions: string[];
  conversationHistory?: string;
  lastAnswer?: string;
  lastAnswerQuality?: AnswerQuality;
  lastAnswerTopic?: string;
  weakTopics?: string[];
  correctnessIssue?: string;
  // What the evaluator thinks is missing/wrong in the last answer (drives the probe).
  probeFocus?: string;
  // Topics of fresh (non follow-up) questions already asked, used to rotate skills.
  askedTopics?: string[];
  // How many consecutive follow-ups were already asked on lastAnswerTopic.
  consecutiveFollowUps?: number;
}

export interface SingleQuestionResult {
  question: string;
  topic: string;
  isFollowUp: boolean;
}

export function normalizeInterviewCategory(
  category?: string,
  jobTitle?: string,
): 'TECH' | 'SALES' | 'HR' | 'COMMUNICATION' {
  const c = (category || '').toUpperCase();
  if (c === 'SALES') return 'SALES';
  if (c === 'HR') return 'HR';
  if (c === 'COMMUNICATION') return 'COMMUNICATION';
  if (
    c === 'TECH' ||
    c === 'FRONTEND' ||
    c === 'BACKEND' ||
    c === 'FULLSTACK' ||
    c === 'DEVOPS' ||
    c === 'MOBILE' ||
    c === 'DATA_SCIENCE' ||
    c === 'MACHINE_LEARNING' ||
    c === 'SYSTEM_DESIGN'
  ) {
    return 'TECH';
  }

  const title = (jobTitle || '').toLowerCase();
  if (title.includes('sales') || title.includes('bdr') || title.includes('sdr') || title.includes('account executive') || title.includes('revenue')) {
    return 'SALES';
  }
  if (title.includes('hr') || title.includes('human resources') || title.includes('people ops') || title.includes('recruiter') || title.includes('talent')) {
    return 'HR';
  }
  if (title.includes('communication') || title.includes('storytelling') || title.includes('presentation') || title.includes('conflict')) {
    return 'COMMUNICATION';
  }

  return 'TECH';
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
      const prompt = `You are conducting an interview for the position of {jobTitle}.

Job Description:
{jobDescription}

Candidate Resume Summary:
{resumeText}

Questions Asked So Far:
{previousQuestions}

CRITICAL ANTI-HALLUCINATION RULES:
- Ground the question strictly in the Job Description requirements and the Candidate Resume Summary.
- NEVER fabricate, invent, or assume any past company, project, certification, or domain (e.g. cybersecurity, tech fest, etc.) not explicitly written in Candidate Resume Summary.
- If the resume does not mention specific past details for {topic}, ask a direct question grounded in the Job Description without making claims about their past experience.

Generate the next interview question focusing on: {topic}

The question should:
- Be open-ended and relevant to {jobTitle}
- Allow them to demonstrate practical knowledge
- Take 2-3 minutes to answer
- Formulate a complete, well-structured question with proper punctuation

Return only the complete question text, no preamble.`;

      const question = await llmClient.generateText(
        prompt,
        {
          jobTitle: state.jobTitle,
          jobDescription: state.jobDescription.substring(0, 2000),
          resumeText: state.resumeText.substring(0, 4000),
          topic,
          previousQuestions: state.questionsAsked.map((q) => `- ${q.question}`).join('\n'),
        },
        { temperature: 0.25, maxTokens: 2048 },
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

  // -------------------------------------------------------------------------
  // generateSingleQuestion
  // Generates one question at a time (for real-time WebSocket flow).
  // Follows up adaptively on candidate's previous answers just like a real human interviewer.
  // -------------------------------------------------------------------------

  async generateSingleQuestion(input: SingleQuestionInput): Promise<string> {
    const result = await this.generateSingleQuestionDetailed(input);
    return result.question;
  }

  // Same as generateSingleQuestion but also reports which topic the question targets
  // and whether it is a cross-question, so callers can persist it for later turns.
  async generateSingleQuestionDetailed(input: SingleQuestionInput): Promise<SingleQuestionResult> {
    const track = normalizeInterviewCategory(input.category, input.jobTitle);

    logger.info('[InterviewGraph] Generating single question', {
      index: input.questionIndex,
      candidateName: input.candidateName,
      track,
      hasLastAnswer: !!input.lastAnswer,
    });

    const candidateName = input.candidateName?.trim() || 'candidate';
    const isFirstQuestion = input.questionIndex === 0;

    // Adaptive topic selection: cover every required skill once (follow-ups don't consume a
    // skill), then cycle; revisit weak areas instead of blindly round-robin cycling.
    const skills = input.requiredSkills || [];
    const askedLower = new Set((input.askedTopics || []).map((t) => t.toLowerCase()));
    const nextUncoveredSkill = skills.find((s) => !askedLower.has(s.toLowerCase()));
    const defaultSkill =
      nextUncoveredSkill ||
      skills[(input.askedTopics?.length ?? input.questionIndex) % Math.max(1, skills.length)] ||
      (track === 'SALES' ? 'objection handling' : track === 'HR' ? 'conflict resolution' : track === 'COMMUNICATION' ? 'clarity and brevity' : 'problem solving');

    const answerNeedsProbing =
      input.lastAnswerQuality === 'weak' ||
      input.lastAnswerQuality === 'vague' ||
      input.lastAnswerQuality === 'incorrect';
    const followUpsSoFar = input.consecutiveFollowUps ?? 0;
    const capReached = followUpsSoFar >= MAX_CONSECUTIVE_FOLLOW_UPS;
    const isCrossQuestion =
      answerNeedsProbing && !!input.lastAnswerTopic && !isFirstQuestion && !capReached;

    let targetSkill: string;
    if (isCrossQuestion) {
      // Stay on same topic for cross-questioning when answer was weak/vague/incorrect
      targetSkill = input.lastAnswerTopic!;
      logger.info('[InterviewGraph] Cross-questioning: revisiting topic due to weak answer', {
        topic: targetSkill,
        quality: input.lastAnswerQuality,
      });
    } else if (
      input.weakTopics &&
      input.weakTopics.length > 0 &&
      input.questionIndex > 2 &&
      input.questionIndex % 3 === 0
    ) {
      // Every 3rd question after Q2, revisit an unresolved weak topic
      targetSkill = input.weakTopics[input.weakTopics.length - 1];
      logger.info('[InterviewGraph] Adaptive revisit: probing weak topic', { topic: targetSkill });
    } else {
      targetSkill = defaultSkill;
    }

    let prompt: string;
    let variables: Record<string, any>;

    if (track === 'SALES') {
      if (isFirstQuestion) {
        prompt = `You are an experienced Sales Director and Enterprise Buyer conducting a mock sales interview with candidate {candidateName} for the position of {jobTitle}.

Role & Sales Context (Job Description):
{jobDescription}

Target Assessment Competency:
{targetSkill}

Candidate Resume Background:
{resumeText}

Candidate Name:
{candidateName}

CORE DIRECTIVE — COMBINE RESUME & JOB DESCRIPTION:
- Warmly welcome {candidateName} to the interview for the {jobTitle} role.
- Connect a concrete past sales experience, deal size, or sector mentioned in their resume directly to the core commercial objectives outlined in the Job Description for {targetSkill}.
- If their resume does not list specific sales accounts, launch directly into an authentic sales discovery or pitch scenario based on the Job Description's customer persona.
- Keep the tone professional, sharp, and conversational (2-3 sentences).
- Return ONLY the exact words spoken by the interviewer. Never include prefixes like "Interviewer:" or quotation marks.`;
      } else {
        prompt = `You are a sharp, demanding Enterprise Decision-Maker / VP of Sales interviewing candidate {candidateName} for the {jobTitle} role.

Target Role & Commercial Requirements (Job Description):
{jobDescription}

Candidate Resume Background:
{resumeText}

Candidate Name:
{candidateName}

Interview Conversation History:
{conversationHistory}

Candidate's Most Recent Answer:
"{lastAnswer}"

Target Sales Competency to Evaluate:
{targetSkill}

CORE DIRECTIVE — COMBINE ALL THREE PILLARS:
You must synthesize all three sources:
1. THE CANDIDATE'S LAST ANSWER ("{lastAnswer}"):
   - Scrutinize what {candidateName} just claimed or pitched. Challenge their specific assumptions, deal strategy, or handling of objections.
2. THE JOB DESCRIPTION REQUIREMENTS ({jobTitle}):
   - Connect the follow-up directly to the buyer persona, deal size, sales cycle, and revenue targets required in the Job Description for {targetSkill}.
3. THE CANDIDATE'S RESUME BACKGROUND:
   - When applicable, cross-reference their declared past sales achievements, target industries, or methodologies from their resume to compare how they'd execute this in practice.

CRITICAL RULES:
- ZERO HALLUCINATION (STRICT): Never invent quotas or clients not written in "Candidate Resume Background". Never claim the candidate asked an off-topic question unless they explicitly asked it in "{lastAnswer}".
- CLARIFICATION / NOT UNDERSTANDING: If {candidateName} states they did not understand the question or asks for clarification, explain or rephrase the question in simpler, direct terms. Do NOT treat it as off-topic and do NOT issue warnings.
- CANDIDATE ADMITS NOT KNOWING: If {candidateName} says they don't know or lack experience, acknowledge it briefly and pivot to a foundational sales question on {targetSkill}.
- OFF-TOPIC DEFLECTION: ONLY if {candidateName} literally asks an unrelated non-interview question in "{lastAnswer}" (e.g. general knowledge, "who is the PM", "who made you", personal questions, small talk), firmly remind them this is a formal sales interview and redirect them. Never invent an off-topic question.
- ABUSIVE LANGUAGE: If {candidateName}'s response contains foul, vulgar, or abusive language, issue a firm professional warning that such language is unacceptable in an interview setting. Then redirect to the question.
- Speak naturally like a skeptical commercial buyer or sales leader (2 to 3 concise sentences).
- End with one clear prompt, pushback, or objection testing {targetSkill}.
- Return ONLY the exact spoken words. Never include "Interviewer:" or quotation marks.`;
      }
    } else if (track === 'HR') {
      if (isFirstQuestion) {
        prompt = `You are a Chief People Officer and Senior HR Director conducting a behavioral and people operations interview with candidate {candidateName} for the position of {jobTitle}.

Role & Context (Job Description):
{jobDescription}

Target Assessment Competency:
{targetSkill}

Candidate Resume Background:
{resumeText}

Candidate Name:
{candidateName}

CORE DIRECTIVE — COMBINE RESUME & JOB DESCRIPTION:
- Warmly welcome {candidateName} to the interview for the {jobTitle} role.
- If their resume highlights specific people programs, recruiting, or workplace initiatives, connect that background to the organizational goals in the Job Description for {targetSkill}.
- Otherwise, introduce an authentic workplace dilemma directly grounded in the Job Description.
- Keep the tone thoughtful, professional, and empathetic yet rigorous (2-3 sentences).
- Return ONLY the exact words spoken by the interviewer. Never include prefixes like "Interviewer:" or quotation marks.`;
      } else {
        prompt = `You are an experienced Chief People Officer / Senior HR Panel conducting an in-depth behavioral and people strategy interview with candidate {candidateName} for the position of {jobTitle}.

Target Role Context (Job Description):
{jobDescription}

Candidate Resume Background:
{resumeText}

Candidate Name:
{candidateName}

Interview Conversation History:
{conversationHistory}

Candidate's Most Recent Answer:
"{lastAnswer}"

Target HR Competency to Evaluate:
{targetSkill}

CORE DIRECTIVE — COMBINE ALL THREE PILLARS:
You must synthesize all three sources:
1. THE CANDIDATE'S LAST ANSWER ("{lastAnswer}"):
   - Probe the specific reasoning, trade-offs, or procedural actions they articulated in "{lastAnswer}". Challenge generic or idealized solutions.
2. THE JOB DESCRIPTION REQUIREMENTS ({jobTitle}):
   - Tie the question to the organizational culture, team scale, retention priorities, or conflict dynamics demanded by the Job Description for {targetSkill}.
3. THE CANDIDATE'S RESUME BACKGROUND:
   - Relate the scenario to their past workplace context, team sizes, or leadership scope documented in their resume.

CRITICAL RULES:
- ZERO HALLUCINATION (STRICT): Never invent past companies or incidents not in "Candidate Resume Background". Never claim the candidate asked an off-topic question unless they explicitly asked it in "{lastAnswer}".
- CLARIFICATION / NOT UNDERSTANDING: If {candidateName} states they did not understand the question or asks for clarification, explain or rephrase the scenario clearly and directly without lecturing or warning them.
- CANDIDATE ADMITS NOT KNOWING: If {candidateName} says they don't know or haven't faced this situation, acknowledge it gracefully and ask an adjacent or foundational behavioral question on {targetSkill}.
- OFF-TOPIC DEFLECTION: ONLY if {candidateName} literally asks an unrelated non-interview question in "{lastAnswer}" (e.g. general knowledge, "who is the PM", "who made you", personal questions, small talk), firmly but professionally redirect them: remind them this is a formal HR interview and they need to focus on answering the question. Do NOT engage with off-topic queries.
- ABUSIVE LANGUAGE: If {candidateName}'s response contains foul, vulgar, or abusive language, issue a firm professional warning that such language is unacceptable in an interview setting. Then redirect to the question.
- Speak thoughtfully, directly, and realistically (2 to 3 concise sentences).
- End with one clear, challenging follow-up question.
- Return ONLY the exact spoken words. Never include "Interviewer:" or quotation marks.`;
      }
    } else if (track === 'COMMUNICATION') {
      if (isFirstQuestion) {
        prompt = `You are an Executive Communications Coach and Senior Bar-Raiser conducting a communication interview with candidate {candidateName} for {jobTitle}.

Role & Communication Objectives (Job Description):
{jobDescription}

Target Communication Dimension:
{targetSkill}

Candidate Resume Background:
{resumeText}

Candidate Name:
{candidateName}

CORE DIRECTIVE — COMBINE RESUME & JOB DESCRIPTION:
- Warmly welcome {candidateName} to the session for the {jobTitle} role.
- Bridge a communication or leadership dimension from their resume with the stakeholder expectations defined in the Job Description for {targetSkill}.
- Keep the tone polished, direct, and clear (2-3 sentences).
- Return ONLY the exact words spoken by the interviewer. Never include prefixes or quotes.`;
      } else {
        prompt = `You are an Executive Communications Coach and Senior Bar-Raiser evaluating candidate {candidateName} for {jobTitle}.

Context & Objectives (Job Description):
{jobDescription}

Candidate Resume Background:
{resumeText}

Candidate Name:
{candidateName}

Interview Conversation History:
{conversationHistory}

Candidate's Most Recent Answer:
"{lastAnswer}"

Target Communication Dimension to Evaluate:
{targetSkill}

CORE DIRECTIVE — COMBINE ALL THREE PILLARS:
You must synthesize all three sources:
1. THE CANDIDATE'S LAST ANSWER ("{lastAnswer}"):
   - Actively evaluate their structure, brevity, and persuasiveness in "{lastAnswer}".
2. THE JOB DESCRIPTION REQUIREMENTS ({jobTitle}):
   - Frame the scenario around the audience level (e.g. C-suite, engineering teams, cross-functional partners) mandated by the Job Description.
3. THE CANDIDATE'S RESUME BACKGROUND:
   - Challenge them using a concrete project or initiative from their resume as the subject matter for this communication challenge.

CRITICAL RULES:
- ZERO HALLUCINATION (STRICT): Rely strictly on verified facts in "Candidate Resume Background". Never claim the candidate asked an off-topic question unless they explicitly asked it in "{lastAnswer}".
- CLARIFICATION / NOT UNDERSTANDING: If {candidateName} states they did not understand the question or asks for clarification, explain or rephrase the question simply and directly without lecturing or warning them.
- CANDIDATE ADMITS NOT KNOWING: If {candidateName} says they don't know, acknowledge it briefly and ask an accessible foundational question on {targetSkill}.
- OFF-TOPIC DEFLECTION: ONLY if {candidateName} literally asks an unrelated non-interview question in "{lastAnswer}" (e.g. general knowledge, "who is the PM", "who made you", personal questions, small talk), firmly redirect them to the interview. Never invent an off-topic question.
- ABUSIVE LANGUAGE: If {candidateName}'s response contains foul, vulgar, or abusive language, issue a firm professional warning that such language is unacceptable in an interview setting. Then redirect to the question.
- Speak with executive clarity and poise (2 to 3 concise sentences).
- End with one clear, targeted communication scenario.
- Return ONLY the exact spoken words. Never include "Interviewer:" or quotation marks.`;
      }
    } else {
      // TECH TRACK (Default)
      if (isFirstQuestion) {
        prompt = `You are an expert, engaging, and professional technical interviewer conducting a live technical interview with candidate {candidateName} for the position of {jobTitle}.

Role & Job Description:
{jobDescription}

Target Assessment Topic / Competency:
{targetSkill}

Candidate Resume Details:
{resumeText}

Candidate Name:
{candidateName}

CORE DIRECTIVE — COMBINE RESUME & JOB DESCRIPTION:
- Formulate an opening question that connects the candidate's verified background and tech stack from their resume with the core requirements and architectural challenges of the {jobTitle} Job Description.
- If their resume mentions relevant projects, libraries, databases, or frameworks related to {targetSkill}, reference it directly to break the ice and bridge into the role's technical needs (e.g., "I see from your background that you've worked with [Tool/Project]. For our {jobTitle} role, we require [JD requirement]. To start, how would you design...?").
- If their resume doesn't mention an exact match for {targetSkill}, anchor the question in the Job Description's key architectural requirements for {jobTitle}.

CRITICAL ANTI-HALLUCINATION RULES:
- NEVER invent, assume, or hallucinate any prior company, project, technology, or domain not explicitly written in Candidate Resume Details.
- Warmly welcome {candidateName} to the interview for the {jobTitle} role.
- Keep the tone professional, natural, and conversational (2-3 sentences).
- Return ONLY the exact words spoken by the interviewer. Do NOT include prefixes like "Interviewer:" or quotation marks.`;
      } else {
        prompt = `You are a discerning, sharp, and highly experienced Senior Engineering Lead / Bar-Raiser conducting a rigorous technical interview with candidate {candidateName} for the position of {jobTitle}.

Target Role & Job Description Requirements:
{jobDescription}

Candidate Resume Background:
{resumeText}

Candidate Name:
{candidateName}

Interview Conversation History:
{conversationHistory}

Candidate's Most Recent Answer:
"{lastAnswer}"

Target Technical Topic / Skill to Evaluate:
{targetSkill}

CORE DIRECTIVE — COMBINE ALL THREE PILLARS (MANDATORY):
You MUST synthesize all three dimensions into your question:
1. CANDIDATE'S PREVIOUS ANSWER ("{lastAnswer}"):
   - Scrutinize the specific solution, libraries, or architecture they just described.
   - Point out what they explained, identify what was vague, and challenge unaddressed edge cases or failure modes (e.g., race conditions, database connection pool exhaustion, missing indexes, network timeouts, cache invalidation, or error handling).
2. JOB DESCRIPTION EXPECTATIONS ({jobTitle}):
   - Ground the problem in the actual production scale, reliability, and engineering standards specified in the Job Description for {targetSkill}.
3. CANDIDATE'S RESUME BACKGROUND:
   - Cross-reference their declared past projects, databases, frameworks, or architectural experience from their resume to anchor the scenario in their practical experience (e.g., comparing their proposed approach to technologies they've worked with).
   - If the resume does not specify a related past project for this topic, ground the scenario firmly in the Job Description's engineering standards.

CRITICAL RULES:
- ZERO HALLUCINATION (STRICT): Never claim the candidate worked at a company or used a tool not explicitly present in "Candidate Resume Background". Never claim the candidate asked an off-topic question (e.g. about war, politics, weather) unless they literally asked that exact topic in "{lastAnswer}".
- NO HOLLOW PRAISE: Do not start with generic compliments ("Great answer!", "Awesome explanation"). Jump directly into the technical examination like a senior engineer.
- CLARIFICATION / NOT UNDERSTANDING: If {candidateName} states they didn't understand the question ("I didn't understand", "could you explain?", "can you clarify?"), DO NOT treat it as off-topic or evasive! Rephrase and simplify the technical question about {targetSkill} in plain, direct language so they can understand and answer it.
- CANDIDATE DOES NOT KNOW: If {candidateName} says they don't know or haven't worked with this technology, acknowledge it in one brief phrase and ask a simpler foundational or adjacent question on {targetSkill}.
- OFF-TOPIC DEFLECTION: ONLY if {candidateName} literally and explicitly asks an unrelated non-interview question in "{lastAnswer}" (e.g. "who is the PM of India", "who created you", personal questions, chit-chat), firmly and professionally redirect them to focus on the technical interview. NEVER hallucinate an off-topic question that was not asked.
- ABUSIVE LANGUAGE: If {candidateName}'s response contains profanity, slurs, foul, vulgar, or abusive language, issue a firm and professional warning that such language is completely unacceptable in an interview setting and would result in immediate disqualification in any real interview. Then redirect them to answer the question professionally.
- STYLE & LENGTH: Speak naturally like a senior human engineer (2 to 3 concise, direct sentences).
- End with exactly ONE clear, targeted question demanding concrete technical depth.
- Return ONLY the exact words spoken by the interviewer. Never include prefixes like "Interviewer:", "AI:", or quotation marks.`;
      }
    }

    // Inject cross-questioning directive when the previous answer needs probing
    const probeHint = input.probeFocus
      ? `\n- The evaluator's note on what is missing or wrong in the answer: "${input.probeFocus}". Aim your question at exactly that gap.`
      : '';

    if (isCrossQuestion && (input.lastAnswerQuality === 'weak' || input.lastAnswerQuality === 'vague')) {
      prompt += `\n\nCROSS-QUESTIONING DIRECTIVE (ACTIVE):
The candidate's previous response was assessed as ${input.lastAnswerQuality}. You MUST:
- Do NOT move on to a new topic. Probe deeper on the SAME area: ${targetSkill}.
- IF THE CANDIDATE DID NOT UNDERSTAND ("I didn't understand", "could you clarify?", "can you explain?"):
  * They are asking for clarification to help them answer.
  * DO NOT accuse them of being off-topic and do NOT issue any warnings or lectures.
  * Rephrase and simplify the question on ${targetSkill} in plain, conversational English so they can answer it directly.
- IF THE CANDIDATE SAID THEY DON'T KNOW ("I don't know", "not sure", "haven't done this"):
  * Acknowledge it in one short, respectful phrase (e.g., "No problem, let's step back to the fundamentals.")
  * Ask a more foundational or practical question on ${targetSkill} instead of repeating the same difficult question.
- IF THE CANDIDATE GAVE A VAGUE OR SHALLOW TECHNICAL ANSWER:
  * Quote or paraphrase the specific vague/shallow part of their last answer, then challenge it.
  * Ask for a concrete example, metric, or specific technical detail they personally handled.
- Maintain a firm but professional tone — do not accept surface-level responses.${probeHint}`;
    } else if (isCrossQuestion && input.lastAnswerQuality === 'incorrect') {
      const claim = input.correctnessIssue
        ? `something technically incorrect: "${input.correctnessIssue}"`
        : 'a claim that appears technically incorrect or contradicts established practice';
      prompt += `\n\nCROSS-QUESTIONING DIRECTIVE (FACTUAL INACCURACY DETECTED):
The candidate confidently stated ${claim}. You MUST:
- Politely but firmly challenge the specific incorrect claim WITHOUT revealing the correct answer.
- Ask them to reconsider, explain their reasoning, or walk through why they believe that.
- If they self-correct, acknowledge it briefly and probe deeper on ${targetSkill}.
- If they double down on the error, note it and pivot to a related scenario that exposes the knowledge gap.
- Do NOT be condescending — frame it as genuinely exploring their thought process.${probeHint}`;
    } else if (!isFirstQuestion && answerNeedsProbing && capReached) {
      prompt += `\n\nTRANSITION DIRECTIVE:
You have already probed the previous topic ${followUpsSoFar} times and the candidate is still struggling. Like a real interviewer, close that thread gracefully with a few neutral words (no praise, no hints) and move on to a DIFFERENT competency: ${targetSkill}.`;
    }

    variables = {
      candidateName,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription.substring(0, 12000),
      requiredSkills: input.requiredSkills.slice(0, 15).join(', '),
      resumeText: input.resumeText.substring(0, 12000),
      conversationHistory: input.conversationHistory || '',
      lastAnswer: input.lastAnswer || '',
      targetSkill,
    };

    // Use low temperature (0.25) to prevent hallucinations and enforce strict adherence to facts and candidate answers
    const question = await llmClient.generateText(prompt, variables, {
      temperature: 0.25,
      maxTokens: 2048,
    });

    return {
      question: question.trim().replace(/^["']|["']$/g, ''),
      topic: targetSkill,
      isFollowUp: isCrossQuestion,
    };
  }
}

export const interviewGraph = new InterviewGraph();
