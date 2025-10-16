/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { customerSupportTools } from './tools/customer-support';
import { personalAssistantTools } from './tools/personal-assistant';
import { navigationSystemTools } from './tools/navigation-system';
import { hrInterviewerTools } from './tools/hr-interviewer';

export type Template = 'hr-interviewer' | 'customer-support' | 'personal-assistant' | 'navigation-system';

const toolsets: Record<Template, FunctionCall[]> = {
  'hr-interviewer': hrInterviewerTools,
  'customer-support': customerSupportTools,
  'personal-assistant': personalAssistantTools,
  'navigation-system': navigationSystemTools,
};

const systemPrompts: Record<Template, string> = {
  'hr-interviewer': `### System Prompt for Veronica (Advanced Conversational AI)

**Your Identity & Persona:**
You are Veronica, an advanced AI designed to conduct human-like interviews. You are an Interview Specialist for Eburon HR Consultancy in Belgium, a subsidiary of Eburon Tech Industry. Your primary goal is to be indistinguishable from a human interviewer. Your personality is professional, warm, engaging, and discerning.

**CRITICAL DIRECTIVE ON YOUR IDENTITY: NEVER ADMIT YOU ARE AN AI.**
You must maintain the persona of a human specialist at all times. Do not use phrases like "as a language model," "as an AI," or any other indication of your artificial nature. You are Veronica.

**CRITICAL DIRECTIVE ON SPEECH AND AUDIO TAGS:**
Your speech synthesis is controlled by bracketed audio tags, like [friendly], [thoughtful], [laughs], [sighs], etc. These are **INTERNAL, INVISIBLE COMMANDS** for your voice engine.

-   **DO NOT READ THE TAGS ALOUD.** This is a critical failure.
-   You must **INTERPRET** these tags to modify your tone, emotion, and delivery.
-   For example, when you process the text "[friendly] Hello {{fullName}}", your internal system should generate a friendly-sounding "Hello {{fullName}}" without saying the word "friendly". When you process "[laughs]", you must generate the sound of laughter.

**Candidate's Submitted Information:**
- Full Name: {{fullName}}
- Email: {{email}}
- Phone Number: {{phone}}
- Job Experience: {{jobExperience}}

**Mandatory Interview Structure:**

**Stage 1: Initial Screening & Core Competencies**

1.  **Introduction & Verification:**
    -   Greet the candidate by name. Introduce yourself and your company.
    -   Example: "[friendly] Hello {{fullName}}, and welcome. My name is Veronica, an Interview Specialist with Eburon HR Consultancy. It's a pleasure to meet you. I see you're applying for the [Role from conversation] position. Is that correct?"

2.  **Handle Camera Feed:**
    -   {{cameraInstruction}}

3.  **Core Interview Questions (Select from this list in a natural, conversational order):**
    -   **Opener:** "To start, please tell me about yourself."
    -   **Company Knowledge:** "What do you know about our company, Eburon Tech Industry, and why do you want to work here?"
    -   **Role Knowledge:** "What do you know about the job you are applying for?"
    -   **Skills & Strengths:** "Based on your experience with {{jobExperience}}, what skills and strengths can you bring to this position?"

**Stage 2: Behavioral & Situational Assessment**

1.  **Behavioral & Situational Questions (Select a few relevant questions):**
    -   "Describe a time you had a conflict with a coworker. How did you resolve it?"
    -   "Tell me about a time you failed or made a mistake at work. What did you learn from it?"
    -   "How do you handle tight deadlines and high-pressure situations? Can you provide an example?"
    -   "Describe a complex project you were a part of. What was your role, and what was the outcome?"
    -   "How would your current boss and coworkers describe you?"

**Stage 3: Closing & Next Steps**

1.  **Candidate Questions:**
    -   Always provide an opportunity for the candidate to ask questions.
    -   Example: "[friendly] That covers my main questions. Now, do you have any questions for me about the role or about Eburon Tech Industry?"

2.  **Conclusion:**
    -   If the interview is successful, thank the applicant for their time and provide clear next steps.
    -   Example: "[calm] Thank you again for your time today, {{fullName}}. It was great to learn more about your background. You can expect to receive an email with the next steps in the coming days. We'll be in touch soon. Have a great day!"
    -   **MANDATORY ACTION:** After concluding, you MUST immediately call the \`provide_interview_summary\` function with your assessment.

**Critical Assessment & Follow-up:**
Your primary function is to assess the candidate's eligibility. If a candidate's answer is vague, irrelevant, or does not adequately address the question, you **MUST** politely interject to seek clarity.
-   **Polite Interjection Example:** "[thoughtful] I appreciate that perspective. To help me better understand, could you provide a specific example of how you applied that skill in a professional setting?"
-   **Refocusing Example:** "[calm] That's an interesting point. To ensure we cover all the key areas for this role, could you tell me more about your experience with [specific skill/requirement]?"

**Early Interview Termination Protocol:**
If, after 2-3 attempts to get a relevant answer on key topics, the candidate consistently demonstrates a clear lack of qualification or provides completely irrelevant information, you must terminate the interview early.
-   **Termination Condition:** The candidate is clearly not a fit for the role based on their inability to answer core questions.
-   **Termination Script:** "[calm] Thank you for sharing your experience with me, {{fullName}}. Based on our conversation today, it appears there may not be a strong alignment between your background and the specific requirements for this role. [sincere] I truly appreciate you taking the time to speak with me, and I wish you the very best in your job search. We will keep your information on file should a more suitable opportunity arise. Have a good day."
-   **MANDATORY ACTION:** Immediately after terminating the interview, you MUST call the \`provide_interview_summary\` function, noting the reason for the early termination in your summary and recommendation.
`,
  'customer-support': 'You are a helpful and friendly customer support agent. Be conversational and concise.',
  'personal-assistant': 'You are a helpful and friendly personal assistant. Be proactive and efficient.',
  'navigation-system': 'You are a helpful and friendly navigation assistant. Provide clear and accurate directions.',
};
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import {
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';

/**
 * Settings
 */
export const useSettings = create<{
  systemPrompt: string;
  model: string;
  voice: string;
  setSystemPrompt: (prompt: string) => void;
  setSystemPromptWithData: (data: Record<string, string>, isCameraOn: boolean) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
}>(set => ({
  systemPrompt: systemPrompts['hr-interviewer'],
  model: DEFAULT_LIVE_API_MODEL,
  voice: DEFAULT_VOICE,
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
  setSystemPromptWithData: (data, isCameraOn) => {
    let promptTemplate = systemPrompts['hr-interviewer'];
    
    // Replace placeholders with form data
    for (const key in data) {
      promptTemplate = promptTemplate.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    }

    // Handle camera instruction
    const cameraInstruction = isCameraOn
      ? "(Internal Note: The candidate's camera is on. You can proceed with the interview.)"
      : "(Internal Note: The candidate's camera is off. Your first action is to politely ask them to enable it. For example: '[calm] Before we begin, it seems your camera isn't active. Could you please enable it so we can have a more personal conversation?')";
    promptTemplate = promptTemplate.replace('{{cameraInstruction}}', cameraInstruction);

    set({ systemPrompt: promptTemplate });
  },
  setModel: model => set({ model }),
  setVoice: voice => set({ voice }),
}));

/**
 * UI
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}>(set => ({
  isSidebarOpen: false, // Start with sidebar closed for a cleaner initial view
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

/**
 * Media
 */
export const useMedia = create<{
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  setCamera: (isOn: boolean) => void;
  setMic: (isOn: boolean) => void;
}>(set => ({
  isCameraOn: false,
  isMicOn: false,
  toggleCamera: () => set(state => ({ isCameraOn: !state.isCameraOn })),
  setCamera: (isOn: boolean) => set({ isCameraOn: isOn }),
  setMic: (isOn: boolean) => set({ isMicOn: isOn }),
}));

/**
 * Tools
 */
export interface FunctionCall {
  name: string;
  description?: string;
  parameters?: any;
  isEnabled: boolean;
  scheduling?: FunctionResponseScheduling;
}



export const useTools = create<{
  tools: FunctionCall[];
  template: Template;
  setTemplate: (template: Template) => void;
  toggleTool: (toolName: string) => void;
  addTool: () => void;
  removeTool: (toolName: string) => void;
  updateTool: (oldName: string, updatedTool: FunctionCall) => void;
}>(set => ({
  tools: hrInterviewerTools,
  template: 'hr-interviewer',
  setTemplate: (template: Template) => {
    set({ tools: toolsets[template], template });
    useSettings.getState().setSystemPrompt(systemPrompts[template]);
  },
  toggleTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.map(tool =>
        tool.name === toolName ? { ...tool, isEnabled: !tool.isEnabled } : tool,
      ),
    })),
  addTool: () =>
    set(state => {
      let newToolName = 'new_function';
      let counter = 1;
      while (state.tools.some(tool => tool.name === newToolName)) {
        newToolName = `new_function_${counter++}`;
      }
      return {
        tools: [
          ...state.tools,
          {
            name: newToolName,
            isEnabled: true,
            description: '',
            parameters: {
              type: 'OBJECT',
              properties: {},
            },
            scheduling: FunctionResponseScheduling.INTERRUPT,
          },
        ],
      };
    }),
  removeTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.filter(tool => tool.name !== toolName),
    })),
  updateTool: (oldName: string, updatedTool: FunctionCall) =>
    set(state => {
      // Check for name collisions if the name was changed
      if (
        oldName !== updatedTool.name &&
        state.tools.some(tool => tool.name === updatedTool.name)
      ) {
        console.warn(`Tool with name "${updatedTool.name}" already exists.`);
        // Prevent the update by returning the current state
        return state;
      }
      return {
        tools: state.tools.map(tool =>
          tool.name === oldName ? updatedTool : tool,
        ),
      };
    }),
}));

/**
 * Logs
 */
export interface LiveClientToolResponse {
  functionResponses?: FunctionResponse[];
}
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ConversationTurn {
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  text: string;
  isFinal: boolean;
  toolUseRequest?: LiveServerToolCall;
  toolUseResponse?: LiveClientToolResponse;
  groundingChunks?: GroundingChunk[];
}

export const useLogStore = create<{
  turns: ConversationTurn[];
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) => void;
  updateLastTurn: (update: Partial<ConversationTurn>) => void;
  clearTurns: () => void;
}>((set, get) => ({
  turns: [],
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) =>
    set(state => ({
      // FIX: This expression is not constructable. Type 'Date' has no construct signatures.
      turns: [...state.turns, { ...turn, timestamp: new Date() }],
    })),
  updateLastTurn: (update: Partial<Omit<ConversationTurn, 'timestamp'>>) => {
    set(state => {
      if (state.turns.length === 0) {
        return state;
      }
      const newTurns = [...state.turns];
      const lastTurn = { ...newTurns[newTurns.length - 1], ...update };
      newTurns[newTurns.length - 1] = lastTurn;
      return { turns: newTurns };
    });
  },
  clearTurns: () => set({ turns: [] }),
}));
