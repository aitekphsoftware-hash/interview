/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Applicant {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatarUrl: string;
}

export const mockApplicants: Applicant[] = [
  {
    id: '1',
    name: 'Alex Dubois',
    role: 'Senior Frontend Developer',
    experience: '8 years',
    avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
  {
    id: '2',
    name: 'Marie Leclerc',
    role: 'UX/UI Designer',
    experience: '5 years',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: '3',
    name: 'Benoit Mertens',
    role: 'Cloud Solutions Architect',
    experience: '12 years',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '4',
    name: 'Chloé Peeters',
    role: 'Product Manager',
    experience: '7 years',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: '5',
    name: 'Liam Janssen',
    role: 'Data Scientist',
    experience: '4 years',
    avatarUrl: 'https://randomuser.me/api/portraits/men/81.jpg',
  },
  {
    id: '6',
    name: 'Sofia Jacobs',
    role: 'DevOps Engineer',
    experience: '6 years',
    avatarUrl: 'https://randomuser.me/api/portraits/women/88.jpg',
  },
];
