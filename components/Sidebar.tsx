/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  FunctionCall,
  useSettings,
  useUI,
  useTools,
  useResumeStore,
  WorkExperience,
  Education,
  useMedia,
} from '@/lib/state';
import c from 'classnames';
import { AVAILABLE_VOICES } from '@/lib/constants';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import React, { useEffect, useState } from 'react';
import ToolEditorModal from './ToolEditorModal';

interface SidebarProps {
  interviewActive: boolean;
  onStartInterview: () => void;
}

export default function Sidebar({ interviewActive, onStartInterview }: SidebarProps) {
  const { isSidebarOpen, toggleSidebar, isDevMode } = useUI();
  const [activeTab, setActiveTab] = useState<'applicant' | 'server'>('applicant');

  return (
    <aside className={c('sidebar', { open: isSidebarOpen })}>
      <div className="sidebar-header">
        <h3>Settings</h3>
        <button onClick={toggleSidebar} className="close-button">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="sidebar-tabs">
        <button
          className={c('sidebar-tab-button', { active: activeTab === 'applicant' })}
          onClick={() => setActiveTab('applicant')}
        >
          Applicant Information
        </button>
        {isDevMode && (
          <button
            className={c('sidebar-tab-button', { active: activeTab === 'server' })}
            onClick={() => setActiveTab('server')}
          >
            Server Settings
            <span className="icon dev-lock">lock</span>
          </button>
        )}
      </div>

      <div className="sidebar-content">
        {activeTab === 'applicant' && (
          <ApplicantSettings onStartInterview={onStartInterview} interviewActive={interviewActive} />
        )}
        {activeTab === 'server' && isDevMode && <ServerSettings />}
      </div>
    </aside>
  );
}

interface ApplicantSettingsProps {
  interviewActive: boolean;
  onStartInterview: () => void;
}

function ApplicantSettings({ onStartInterview, interviewActive }: ApplicantSettingsProps) {
  const {
    fullName, setFullName,
    email, setEmail,
    phone, setPhone,
    salaryExpectations, setSalaryExpectations,
    summary, setSummary,
    skills, setSkills,
    workExperience, addWorkExperience, updateWorkExperience, removeWorkExperience,
    education, addEducation, updateEducation, removeEducation,
  } = useResumeStore();
  const { setSystemPromptWithData } = useSettings();
  const { connect } = useLiveAPIContext();
  const { setCamera, setMic, isCameraOn } = useMedia();
  const { toggleSidebar } = useUI();
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setIsFormValid(!!(fullName && email && phone && salaryExpectations));
  }, [fullName, email, phone, salaryExpectations]);

  const handleStart = () => {
    if (!isFormValid) return;
    setSystemPromptWithData(useResumeStore.getState(), isCameraOn);
    onStartInterview();
    connect();
    setMic(true);
    setCamera(true);
    toggleSidebar();
  }

  return (
    <>
    <fieldset disabled={interviewActive}>
       <div className="sidebar-section">
        <h4 className="sidebar-section-title">Primary Information</h4>
        <label>
          Full Name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Jane Doe"
            required
          />
        </label>
         <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., jane.doe@example.com"
            required
          />
        </label>
        <label>
          Phone Number
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., (555) 123-4567"
            required
          />
        </label>
        <label>
          Salary Expectations (Annual)
          <input
            type="text"
            value={salaryExpectations}
            onChange={(e) => setSalaryExpectations(e.target.value)}
            placeholder="e.g., €60,000"
            required
          />
        </label>
      </div>
      <div className="sidebar-section">
        <h4 className="sidebar-section-title">Applicant Resume</h4>
        <label>
          Professional Summary
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="A brief summary of your career..."
          />
        </label>
        <label>
          Skills
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            rows={3}
            placeholder="e.g., React, TypeScript, Project Management"
          />
        </label>
      </div>
      <div className="sidebar-section">
        <h4 className="sidebar-section-title">Work Experience</h4>
        {workExperience.map((job) => (
          <WorkExperienceCard key={job.id} job={job} update={updateWorkExperience} remove={removeWorkExperience} />
        ))}
        <button onClick={addWorkExperience} className="add-entry-button">
          <span className="icon">add</span> Add Experience
        </button>
      </div>
       <div className="sidebar-section">
        <h4 className="sidebar-section-title">Education</h4>
        {education.map((edu) => (
          <EducationCard key={edu.id} edu={edu} update={updateEducation} remove={removeEducation} />
        ))}
        <button onClick={addEducation} className="add-entry-button">
          <span className="icon">add</span> Add Education
        </button>
      </div>
    </fieldset>
    {!interviewActive && (
        <div className="sidebar-footer">
          <button className="start-interview-button" onClick={handleStart} disabled={!isFormValid}>
            Start Interview
          </button>
        </div>
      )}
    </>
  );
}

type WorkExperienceCardProps = {
  job: WorkExperience;
  update: (id: string, field: keyof WorkExperience, value: string) => void;
  remove: (id: string) => void;
};
// FIX: Changed component definitions to use React.FC to correctly type them as React components, resolving issues with the 'key' prop.
const WorkExperienceCard: React.FC<WorkExperienceCardProps> = ({ job, update, remove }) => {
  return (
    <div className="resume-entry-card">
        <div className="resume-entry-header">
            <p>{job.role || 'New Role'}</p>
            <button onClick={() => remove(job.id)} className="remove-entry-button">
                <span className="icon">delete</span>
            </button>
        </div>
        <input type="text" value={job.role} onChange={e => update(job.id, 'role', e.target.value)} placeholder="Role / Title" />
        <input type="text" value={job.company} onChange={e => update(job.id, 'company', e.target.value)} placeholder="Company" />
        <input type="text" value={job.dates} onChange={e => update(job.id, 'dates', e.target.value)} placeholder="Dates (e.g., 2020-Present)" />
        <textarea value={job.responsibilities} onChange={e => update(job.id, 'responsibilities', e.target.value)} placeholder="Key Responsibilities" rows={3}/>
    </div>
  )
}

type EducationCardProps = {
  edu: Education;
  update: (id: string, field: keyof Education, value: string) => void;
  remove: (id: string) => void;
};
// FIX: Changed component definitions to use React.FC to correctly type them as React components, resolving issues with the 'key' prop.
const EducationCard: React.FC<EducationCardProps> = ({ edu, update, remove }) => {
  return (
    <div className="resume-entry-card">
        <div className="resume-entry-header">
            <p>{edu.institution || 'New School'}</p>
            <button onClick={() => remove(edu.id)} className="remove-entry-button">
                <span className="icon">delete</span>
            </button>
        </div>
        <input type="text" value={edu.institution} onChange={e => update(edu.id, 'institution', e.target.value)} placeholder="Institution Name" />
        <input type="text" value={edu.degree} onChange={e => update(edu.id, 'degree', e.target.value)} placeholder="Degree / Certificate" />
        <input type="text" value={edu.dates} onChange={e => update(edu.id, 'dates', e.target.value)} placeholder="Dates Attended" />
    </div>
  )
}

function ServerSettings() {
  const { systemPrompt, voice, hrImageUrl, setSystemPrompt, setVoice, setHrImageUrl } = useSettings();
  const { tools, toggleTool, addTool, removeTool, updateTool } = useTools();
  const { connected } = useLiveAPIContext();

  const [editingTool, setEditingTool] = useState<FunctionCall | null>(null);

  const handleSaveTool = (updatedTool: FunctionCall) => {
    if (editingTool) {
      updateTool(editingTool.name, updatedTool);
    }
    setEditingTool(null);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHrImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <>
      <fieldset disabled={connected}>
        <div className="sidebar-section">
          <label>
            HR Image
            <div className="image-uploader-container">
                <img src={hrImageUrl} alt="HR Avatar" className="image-uploader-preview" />
                <div className="image-uploader-label">
                    <label htmlFor="hr-image-upload" className="image-uploader-button">
                        Upload Image
                    </label>
                    <input type="file" id="hr-image-upload" accept="image/*" onChange={handleImageUpload} />
                    <span>Recommended: 1:1 ratio</span>
                </div>
            </div>
          </label>
        </div>
        <div className="sidebar-section">
          <label>
            System Prompt
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={10}
              placeholder="Describe the role and personality of the AI..."
            />
          </label>
          <label>
            Voice
            <select value={voice} onChange={e => setVoice(e.target.value)}>
              {AVAILABLE_VOICES.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="sidebar-section">
          <h4 className="sidebar-section-title">Tools</h4>
          <div className="tools-list">
            {tools.map(tool => (
              <div key={tool.name} className="tool-item">
                <label className="tool-checkbox-wrapper">
                  <input
                    type="checkbox"
                    id={`tool-checkbox-${tool.name}`}
                    checked={tool.isEnabled}
                    onChange={() => toggleTool(tool.name)}
                    disabled={connected}
                  />
                  <span className="checkbox-visual"></span>
                </label>
                <label
                  htmlFor={`tool-checkbox-${tool.name}`}
                  className="tool-name-text"
                >
                  {tool.name}
                </label>
                <div className="tool-actions">
                  <button
                    onClick={() => setEditingTool(tool)}
                    disabled={connected}
                    aria-label={`Edit ${tool.name}`}
                  >
                    <span className="icon">edit</span>
                  </button>
                  <button
                    onClick={() => removeTool(tool.name)}
                    disabled={connected}
                    aria-label={`Delete ${tool.name}`}
                  >
                    <span className="icon">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addTool}
            className="add-tool-button"
            disabled={connected}
          >
            <span className="icon">add</span> Add function call
          </button>
        </div>
      </fieldset>
      {editingTool && (
        <ToolEditorModal
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={handleSaveTool}
        />
      )}
    </>
  );
}