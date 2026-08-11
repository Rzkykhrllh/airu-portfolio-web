'use client';

import { useState, FormEvent } from 'react';
import { submitInquiry } from '@/lib/api';
import { ApiError } from '@/lib/fetch';

const PROJECT_TYPES = ['Commercial', 'Editorial', 'Collaboration', 'Other'];

const fieldClass =
  'w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white outline-none py-2 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await submitInquiry({ name, email, projectType: projectType || undefined, message, company });
      setStatus('sent');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again, or email directly.'
      );
    }
  };

  if (status === 'sent') {
    return (
      <div className="py-8">
        <p
          className="text-2xl italic text-gray-900 dark:text-white mb-2"
          style={{ fontFamily: 'var(--font-cormorant), serif' }}
        >
          Thank you.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Your message is in — I'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Honeypot — hidden from real visitors, bots fill every field blindly.
          Zero-size + overflow-hidden instead of an off-screen offset, so it
          can't ever introduce a stray horizontal scrollbar. */}
      <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Name
          </label>
          <input
            id="name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="projectType" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          Project type <span className="text-gray-400 dark:text-gray-600">(optional)</span>
        </label>
        <select
          id="projectType"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className={`${fieldClass} appearance-none cursor-pointer`}
        >
          <option value="">Select one...</option>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={4}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} resize-none`}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
