/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import './StartForm.css';

interface StartFormProps {
  onSubmit: (data: Record<string, string>) => void;
}

const StartForm: React.FC<StartFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobExperience: '',
  });
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const { fullName, email, phone, jobExperience } = formData;
    setIsFormValid(!!(fullName && email && phone && jobExperience));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  return (
    <div className="start-form-container">
      <form className="start-form" onSubmit={handleSubmit}>
        <h2>Candidate Information</h2>
        <p className="form-subtitle">Please fill out your details to begin the interview.</p>
        
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder="e.g., Jane Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="e.g., jane.doe@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="e.g., (555) 123-4567"
          />
        </div>

        <div className="form-group">
          <label htmlFor="jobExperience">Job Experience Summary</label>
          <textarea
            id="jobExperience"
            name="jobExperience"
            value={formData.jobExperience}
            onChange={handleChange}
            required
            placeholder="Briefly describe your relevant work experience..."
          />
        </div>
        
        <button type="submit" disabled={!isFormValid}>
          Start Interview
        </button>
      </form>
    </div>
  );
};

export default StartForm;
