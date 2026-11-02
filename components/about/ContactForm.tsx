'use client';

import { useState, FormEvent } from 'react';
import { submitInquiry } from '@/lib/api';
import { ApiError } from '@/lib/fetch';

const PROJECT_TYPES = ['Commercial', 'Editorial', 'Collaboration', 'Other'];

const fieldClass =
  'w-full bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 outline-none py-2.5 text-base md:text-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors';

const labelClass = 'block text-[0.6875rem] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400 mb-2';

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
        <p className="font-display text-4xl md:text-5xl leading-none text-neutral-900 dark:text-neutral-100 mb-4">
          Thank you.
        </p>
        <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400">
          Your message is in — I&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <label htmlFor="name" className={labelClass}>
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
          <label htmlFor="email" className={labelClass}>
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
        <label htmlFor="projectType" className={labelClass}>
          Project type <span className="normal-case tracking-normal text-neutral-400 dark:text-neutral-600">(optional)</span>
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
        <label htmlFor="message" className={labelClass}>
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
        <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="group inline-flex items-baseline gap-3 pb-1 border-b border-neutral-900 dark:border-neutral-100 font-display text-2xl md:text-3xl leading-none text-neutral-900 dark:text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
        <span
          aria-hidden="true"
          className="text-lg transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 motion-reduce:transition-none"
        >
          →
        </span>
      </button>
    </form>
  );
}
