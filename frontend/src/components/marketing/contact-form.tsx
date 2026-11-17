'use client'

import { useState } from 'react'
import { SketchButton, skPaper } from '@/components/sketch'
import { siteConfig } from '@/config/site'
import { SUPPORT_CATEGORIES } from './support-data'

/**
 * Contact form. There is no backend endpoint for contact messages yet, so submitting only shows the
 * confirmation state and nothing is sent. A visible note says so.
 */
export function ContactForm() {
  const [done, setDone] = useState(false)
  const supportEmail = siteConfig.contact.supportEmail

  if (done) {
    return (
      <div className={skPaper({ tape: true, className: 'p-7 text-center' })} role="status">
        <h2 className="font-display text-[1.6rem] font-semibold">Message drawn up</h2>
        <p className="text-ink-soft mt-2">
          This form is not connected yet, so nothing was sent. To reach us, please email{' '}
          <a className="text-blue font-bold underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
          .
        </p>
        <div className="mt-5">
          <SketchButton variant="line" size="sm" onClick={() => setDone(false)}>
            Back to the form
          </SketchButton>
        </div>
      </div>
    )
  }

  return (
    <form
      className={skPaper({ tape: true, className: 'p-7' })}
      onSubmit={(e) => {
        e.preventDefault()
        setDone(true)
      }}
    >
      <p className="sk-hand text-blue mb-3 text-[1.15rem]" role="note">
        Note: this form is not connected yet, so messages are not sent. Email {supportEmail} instead.
      </p>
      <div className="sk-field">
        <label htmlFor="contact-name">Name</label>
        <input id="contact-name" name="name" autoComplete="name" required />
      </div>
      <div className="sk-field">
        <label htmlFor="contact-email">Email</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="sk-field">
        <label htmlFor="contact-topic">Topic</label>
        <select id="contact-topic" name="topic" defaultValue={SUPPORT_CATEGORIES[0].title}>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.title}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="sk-field">
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" required placeholder="How can we help?" />
      </div>
      <SketchButton type="submit">Send message</SketchButton>
    </form>
  )
}
