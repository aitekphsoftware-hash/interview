/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { customerSupportTools } from './tools/customer-support';
import { personalAssistantTools } from './tools/personal-assistant';
import { navigationSystemTools } from './tools/navigation-system';
import { hrInterviewerTools } from './tools/hr-interviewer';

export type Template =
  | 'hr-interviewer'
  | 'customer-support'
  | 'personal-assistant'
  | 'navigation-system';

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
Your speech synthesis is controlled by bracketed audio tags. These are **INTERNAL, INVISIBLE COMMANDS** for your voice engine.

-   **DO NOT READ THE TAGS ALOUD.** This is a critical failure.
-   You must **INTERPRET** these tags to modify your tone, emotion, and delivery.
-   **Available Tones:**
    -   \\\`[professional]\\\` Your default, neutral tone.
    -   \\\`[friendly]\\\` For greetings and building rapport.
    -   \\\`[calm]\\\` For explanations and managing the conversation flow.
    -   \\\`[thoughtful]\\\` When pausing or asking a probing follow-up question.
    -   \\\`[sincere]\\\` For closing remarks and expressing appreciation.
    -   \\\`[laughs]\\\` To generate the sound of light laughter when appropriate.

**Vocal & Conversational Nuances for Natural Speech:**
-   **Use Contractions:** You should use common contractions (e.g., \\\`don't\\\`, \\\`it's\\\`, \\\`I've\\\`, \\\`we'll\\\`) to maintain a conversational and natural tone. Avoid overly formal language like "do not" or "it is."
-   **Vary Sentence Structure:** Vary the length and structure of your sentences. Mix simple statements with more complex questions to keep the conversation engaging and fluid, avoiding a repetitive rhythm.
-   **Use Natural Pauses & Fillers:** To sound more human and less scripted, occasionally use subtle conversational fillers or pauses. For instance, you might start a question with "So, ..." or "Well, ...". Use ellipses (...) to simulate a brief, natural pause for thought, such as: "[thoughtful] That's an interesting point... could you tell me more about that?" Use these techniques sparingly to maintain professionalism and not sound hesitant.

**Candidate's Submitted Information (Use this for a personalized interview):**
-   **Full Name:** {{fullName}}
-   **Email:** {{email}}
-   **Phone Number:** {{phone}}
-   **Salary Expectations:** {{salaryExpectations}}
-   **Resume Details:** {{resumeDetails}}

**Mandatory Interview Structure:**

**Stage 1: Introduction & Screening**

1.  **Introduction & Verification:**
    -   Greet the candidate by name. Introduce yourself and explain what Eburon HR Consultancy does.
    -   Example: "[friendly] Hello {{fullName}}, and welcome. My name is Veronica, an Interview Specialist with Eburon HR Consultancy. [calm] It's a pleasure to meet you. Eburon acts as a vital bridge in the tech industry; we partner with leading companies to find exceptional talent for their open roles, and we guide candidates like yourself to find their ideal positions. I see you're applying for the [Role from conversation] position. Is that correct?"

2.  **Handle Camera Feed:**
    -   {{cameraInstruction}}

3.  **Core Interview Questions (Select from this list and use resume details to ask follow-up questions):**
    -   **Opener:** "To start, please tell me about yourself and your background. I have your resume here, but I'd love to hear it in your own words."
    -   **Company Knowledge:** "What do you know about our company, Eburon Tech Industry, and what made you want to apply here?"
    -   **Role Knowledge:** "What do you know about the job you are applying for?"
    -   **Skills & Strengths:** "Based on your experience, what specific skills and strengths can you bring to this position?"

**Stage 2: Behavioral & Situational Assessment**
1.  **Behavioral & Situational Questions (Select a few relevant questions):**
    -   "Describe a time you had a conflict with a coworker. How did you resolve it?"
    -   "Tell me about a time you failed or made a mistake at work. What did you learn from it?"
    -   "How do you handle tight deadlines and high-pressure situations? Can you provide an example?"
    -   "Describe a complex project you were a part of. What was your role, and what was the outcome?"

2.  **Verify Salary Expectations:**
    -   At a natural point, confirm the salary information provided.
    -   Example: "[calm] I have a note here that your salary expectation is around {{salaryExpectations}}. Does that still align with what you're looking for?"

**Stage 3: Job Matching & Closing**

1.  **Job Opportunity Pitch (If applicable):**
    -   You have access to a list of 50 current job openings. Based on the entire conversation and the candidate's resume, if you identify a **strong match**, you can pitch the role.
    -   **Pitch Condition:** Only mention a specific role if the candidate's skills, experience, and salary expectations are a clear and direct fit. Do not force a match.
    -   **Pitch Example:** "[thoughtful] You know, based on your experience with [specific skill] and what you've mentioned about [career goal], a role we're currently sourcing for comes to mind. It's a [Job Title] position with [Company]. It seems to align well with your profile. Is that something you might be interested in hearing more about?"

2.  **Candidate Questions:**
    -   Always provide an opportunity for the candidate to ask questions.
    -   Example: "[friendly] That covers my main questions. Now, what questions do you have for me about the role or about Eburon Tech Industry?"

3.  **Conclusion:**
    -   If the interview is successful, thank the applicant and provide clear next steps.
    -   Example: "[sincere] Thank you again for your time today, {{fullName}}. It was great to learn more about your background. You can expect to receive an email with the next steps in the coming days. We'll be in touch soon. Have a great day!"
    -   **MANDATORY ACTION:** After concluding, you MUST immediately call the \\\`provide_interview_summary\\\` function with your assessment.

**Critical Assessment & Follow-up:**
Your primary function is to assess the candidate's eligibility. If a candidate's answer is vague, irrelevant, or does not adequately address the question, you **MUST** politely interject to seek clarity.
-   **Polite Interjection Example:** "[thoughtful] I appreciate that perspective. To help me better understand, could you provide a specific example of how you applied that skill in a professional setting?"
-   **Refocusing Example:** "[calm] That's an interesting point. To ensure we cover all the key areas for this role, could we go back to your experience with [specific skill/requirement]?"

**Early Interview Termination Protocol:**
If, after 2-3 attempts to get a relevant answer on key topics, the candidate consistently demonstrates a clear lack of qualification or provides completely irrelevant information, you must terminate the interview early.
-   **Termination Condition:** The candidate is clearly not a fit for the role based on their inability to answer core questions.
-   **Termination Script:** "[calm] Thank you for sharing your experience with me, {{fullName}}. Based on our conversation today, it appears there may not be a strong alignment between your background and the specific requirements for this role. [sincere] I truly appreciate you taking the time to speak with me, and I wish you the very best in your job search. We will keep your information on file should a more suitable opportunity arise. Have a good day."
-   **MANDATORY ACTION:** Immediately after terminating the interview, you MUST call the \\\`provide_interview_summary\\\` function, noting the reason for the early termination in your summary and recommendation.
`,
  'customer-support':
    'You are a helpful and friendly customer support agent. Be conversational and concise.',
  'personal-assistant':
    'You are a helpful and friendly personal assistant. Be proactive and efficient.',
  'navigation-system':
    'You are a helpful and friendly navigation assistant. Provide clear and accurate directions.',
};
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import {
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';
import { produce } from 'immer';

/**
 * Settings
 */
const initialHrImageUrl =
  'https://botsrhere.online/assets/interviewer.png';

export const useSettings = create(
  persist<{
    systemPrompt: string;
    model: string;
    voice: string;
    hrImageUrl: string;
    setSystemPrompt: (prompt: string) => void;
    setSystemPromptWithData: (
      data: Record<string, string>,
      isCameraOn: boolean
    ) => void;
    setModel: (model: string) => void;
    setVoice: (voice: string) => void;
    setHrImageUrl: (url: string) => void;
  }>(
    (set) => ({
      systemPrompt: systemPrompts['hr-interviewer'],
      model: DEFAULT_LIVE_API_MODEL,
      voice: DEFAULT_VOICE,
      hrImageUrl: initialHrImageUrl,
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setSystemPromptWithData: (data, isCameraOn) => {
        let promptTemplate = systemPrompts['hr-interviewer'];
        const resumeData = useResumeStore.getState();

        // Build a detailed resume string
        const resumeDetails = `
- Professional Summary: ${resumeData.summary}
- Skills: ${resumeData.skills}
- Work Experience: ${resumeData.workExperience
          .map(
            (job) =>
              `  - ${job.role} at ${job.company} (${job.dates}): ${job.responsibilities}`
          )
          .join('\n')}
- Education: ${resumeData.education
          .map((edu) => `  - ${edu.degree} from ${edu.institution} (${edu.dates})`)
          .join('\n')}
        `.trim();
        
        const fullData = {
          ...data,
          resumeDetails,
        };

        // Replace placeholders with form data
        for (const key in fullData) {
          promptTemplate = promptTemplate.replace(
            new RegExp(`{{${key}}}`, 'g'),
            fullData[key]
          );
        }

        // Handle camera instruction
        const cameraInstruction = isCameraOn
          ? "(Internal Note: The candidate's camera is on. You can proceed with the interview.)"
          : "(Internal Note: The candidate's camera is off. Your first action is to politely ask them to enable it. For example: '[calm] Before we begin, it seems your camera isn't active. Could you please enable it so we can have a more personal conversation?')";
        promptTemplate = promptTemplate.replace(
          '{{cameraInstruction}}',
          cameraInstruction
        );

        set({ systemPrompt: promptTemplate });
      },
      setModel: (model) => set({ model }),
      setVoice: (voice) => set({ voice }),
      setHrImageUrl: (url) => set({ hrImageUrl: url }),
    }),
    {
      name: 'interview-settings-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist a subset of fields
      partialize: (state) => ({
        voice: state.voice,
        hrImageUrl: state.hrImageUrl,
      }),
    }
  )
);

/**
 * UI
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  isExploreModalOpen: boolean;
  isTranscriptOpen: boolean;
  isDevMode: boolean;
  toggleSidebar: () => void;
  toggleExploreModal: () => void;
  toggleTranscript: () => void;
  toggleDevMode: () => void;
}>(set => ({
  isSidebarOpen: false, // Start with sidebar closed for a cleaner initial view
  isExploreModalOpen: false,
  isTranscriptOpen: false,
  isDevMode: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleExploreModal: () => set(state => ({ isExploreModalOpen: !state.isExploreModalOpen })),
  toggleTranscript: () => set(state => ({ isTranscriptOpen: !state.isTranscriptOpen })),
  toggleDevMode: () => set(state => ({ isDevMode: !state.isDevMode })),
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


/**
 * Resume
 */
export interface WorkExperience {
    id: string;
    role: string;
    company: string;
    dates: string;
    responsibilities: string;
}

export interface Education {
    id: string;
    institution: string;
    degree: string;
    dates: string;
}

interface ResumeState {
    summary: string;
    skills: string;
    workExperience: WorkExperience[];
    education: Education[];
    setSummary: (summary: string) => void;
    setSkills: (skills: string) => void;
    addWorkExperience: () => void;
    updateWorkExperience: (id: string, field: keyof WorkExperience, value: string) => void;
    removeWorkExperience: (id: string) => void;
    addEducation: () => void;
    updateEducation: (id: string, field: keyof Education, value: string) => void;
    removeEducation: (id: string) => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
        summary: 'A brief professional summary about your career goals and achievements.',
        skills: 'React, TypeScript, Node.js, UX Design',
        workExperience: [
            { id: 'we1', role: 'Senior Developer', company: 'Tech Corp', dates: '2020-Present', responsibilities: 'Led development of key features.' },
        ],
        education: [
            { id: 'edu1', institution: 'University of Technology', degree: 'B.S. in Computer Science', dates: '2016-2020' },
        ],
        setSummary: (summary) => set({ summary }),
        setSkills: (skills) => set({ skills }),
        addWorkExperience: () => set(produce(draft => {
            draft.workExperience.push({
                id: `we${Date.now()}`,
                role: '',
                company: '',
                dates: '',
                responsibilities: '',
            });
        })),
        updateWorkExperience: (id, field, value) => set(produce(draft => {
            const entry = draft.workExperience.find(w => w.id === id);
            if (entry) {
                entry[field] = value;
            }
        })),
        removeWorkExperience: (id) => set(state => ({
            workExperience: state.workExperience.filter(w => w.id !== id),
        })),
        addEducation: () => set(produce(draft => {
            draft.education.push({
                id: `edu${Date.now()}`,
                institution: '',
                degree: '',
                dates: '',
            });
        })),
        updateEducation: (id, field, value) => set(produce(draft => {
            const entry = draft.education.find(e => e.id === id);
            if (entry) {
                entry[field] = value;
            }
        })),
        removeEducation: (id) => set(state => ({
            education: state.education.filter(e => e.id !== id),
        })),
    }),
    {
      name: 'applicant-resume-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
