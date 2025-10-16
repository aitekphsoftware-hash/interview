/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Corrected import syntax for useState
import React, { useState } from 'react';
import Modal from '../Modal';
import { useUI } from '@/lib/state';
import { belgianJobs } from '@/lib/jobs';
import { mockApplicants } from '@/lib/applicants';

const ExploreModal: React.FC = () => {
  const { isExploreModalOpen, toggleExploreModal } = useUI();
  const [activeTab, setActiveTab] = useState<'companies' | 'applicants'>('companies');

  if (!isExploreModalOpen) {
    return null;
  }

  return (
    <Modal onClose={toggleExploreModal}>
      <div className="explore-modal">
        <div className="explore-modal-header">
          <h2>Explore Opportunities</h2>
          <p>Discover companies hiring in Belgium and view candidate profiles.</p>
        </div>
        <div className="explore-modal-tabs">
          <button
            className={`tab-button ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            Hiring Companies
          </button>
          <button
            className={`tab-button ${activeTab === 'applicants' ? 'active' : ''}`}
            onClick={() => setActiveTab('applicants')}
          >
            Applicants
          </button>
        </div>
        <div className="explore-modal-content">
          {activeTab === 'companies' && (
            <div className="job-listings">
              {belgianJobs.map((job, index) => (
                <div key={index} className="job-card">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                  <p className="job-location">{job.location}</p>
                  <div className="job-details">
                    <span className="job-detail-item">{job.type}</span>
                    <span className="job-detail-item">{job.industry}</span>
                  </div>
                  <p className="job-description">{job.description}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'applicants' && (
            <div className="applicant-listings">
              {mockApplicants.map(applicant => (
                <div key={applicant.id} className="applicant-card">
                  <img src={applicant.avatarUrl} alt={applicant.name} className="applicant-avatar" />
                  <div className="applicant-info">
                    <h3 className="applicant-name">{applicant.name}</h3>
                    <p className="applicant-role">{applicant.role}</p>
                    <p className="applicant-experience">{applicant.experience} of experience</p>
                  </div>
                  <div className="applicant-action">
                    <button className="pick-button" title="Under Development">
                      Pick for Interview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExploreModal;