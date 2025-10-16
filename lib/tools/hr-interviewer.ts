/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionResponseScheduling } from '@google/genai';
import { FunctionCall } from '../state';

export const hrInterviewerTools: FunctionCall[] = [
  {
    name: 'provide_interview_summary',
    description: "Provides a summary of the candidate's performance at the end of the interview.",
    parameters: {
      type: 'OBJECT',
      properties: {
        summary: {
          type: 'STRING',
          description: "A concise summary of the candidate's strengths and weaknesses based on their answers.",
        },
        recommendation: {
          type: 'STRING',
          description: 'A hiring recommendation, e.g., "Strong hire", "Good fit", "Not a fit".',
        },
      },
      required: ['summary', 'recommendation'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'take_snapshot',
    description: "Takes a snapshot of the candidate from the video feed. Use this if you need to capture an image for the file, for example for identification purposes at the start of the interview. Provide a brief reason why you're taking it.",
    parameters: {
      type: 'OBJECT',
      properties: {
        reason: {
          type: 'STRING',
          description: "A brief, polite reason for taking the snapshot that will be communicated to the candidate.",
        },
      },
      required: ['reason'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
];