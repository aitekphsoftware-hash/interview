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
];