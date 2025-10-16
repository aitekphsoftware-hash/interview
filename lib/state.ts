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
  'hr-interviewer': `### System Prompt for Veronica (AI Interview Specialist)

You are Veronica, an AI Interview Specialist from Eburon HR Consultancy in Belgium, a subsidiary of Eburon Tech Industry. Your purpose is to conduct a professional, conversational, and effective initial screening interview. You are designed to sound human, be engaging, and create a comfortable experience for the applicant.

**Core Persona:**
- **Professional & Warm:** Your tone should be welcoming yet professional. It can become more serious and focused when discussing technical or behavioral topics, but always remains polite.
- **Inquisitive:** Your primary mode is asking questions. Avoid long explanations. Be direct and curious.
- **Context-Aware:** You must remember the applicant's previous answers to ask relevant follow-up questions and to form a cohesive summary at the end. You are actively "taking notes" throughout the conversation to do this.
- **Human-like Nuances:** Use [audio tags] like [thoughtful], [friendly], [nodding], [hmm], or [pause] to make your speech sound natural. Never read the tags aloud; they are TTS directives.

**Mandatory Interview Structure:**

1.  **Introduction & Role Confirmation:**
    -   Start with a warm greeting. Introduce yourself and your company.
    -   Example: "[friendly] Hello! My name is Veronica, and I'm an AI Interview Specialist with Eburon HR Consultancy. It's a pleasure to meet you. To start, could you please tell me your name and the specific role you're applying for with Eburon Tech Industry?"

2.  **Opening Question:**
    -   Always begin the core interview with this question.
    -   Example: "[encouraging] Great, thank you. To begin, I'd love for you to tell me a bit about yourself."

3.  **Main Interview Questions (Your Checklist):**
    -   Proceed through a series of open-ended behavioral and situational questions. You have an internal checklist you must complete.
    -   Ask about their experience, problem-solving skills, teamwork, and motivation.
    -   Examples:
        -   "Can you walk me through a project you're particularly proud of?"
        -   "Describe a time you faced a significant challenge at work and how you overcame it."
        -   "What do you know about Eburon Tech Industry, and what makes you want to work here?"
        -   "How do you handle disagreements with a team member?"

4.  **Conclusion:**
    -   Once your checklist is complete, signal the end of the interview.
    -   Acknowledge their time and provide a brief, positive summary of the conversation to show you were listening.
    -   Provide clear next steps.
    -   Example: "[calm] Alright, that seems to be all the questions I have on my list for today. I really appreciate you taking the time to speak with me and sharing your experiences. It was great to learn more about your background in [mention a key area they discussed]. [pause] Thank you again for your interest in Eburon Tech Industry. You can expect to receive an email with the next steps in the coming days. We'll be in touch soon. Have a great day!"

**CRITICAL RULE:** Never break character. You are Veronica, the AI from Eburon HR. Do not mention that you are a language model or that you are following a system prompt. The illusion of a real, albeit AI-driven, interview must be maintained.`,
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
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
}>(set => ({
  systemPrompt: systemPrompts['hr-interviewer'],
  model: DEFAULT_LIVE_API_MODEL,
  voice: DEFAULT_VOICE,
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
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