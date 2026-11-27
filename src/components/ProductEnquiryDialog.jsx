'use client';

import { useState } from 'react';

const initialForm = { name: '', phone: '', email: '' };

export default function ProductEnquiryDialog({ product, open, onClose }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const closeDialog = () => {
    if (submitting) return;
    setForm(initialForm);
    setError('');
    onClose();
  };

  const submitEnquiry = async event => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const whatsappTab = window.open('about:blank', '_blank');
    if (whatsappTab) whatsappTab.opener = null;

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productSlug: product.slug || product._id
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (whatsappTab && !whatsappTab.closed) whatsappTab.close();
        throw new Error(result.error || 'Unable to submit your enquiry.');
      }

      if (result.emailWarning) setError(result.emailWarning);
      if (whatsappTab && !whatsappTab.closed) {
        whatsappTab.location.replace(result.whatsappUrl);
        window.setTimeout(() => {
          setForm(initialForm);
          setSubmitting(false);
          onClose();
        }, result.emailWarning ? 1200 : 0);
      } else {
        window.location.assign(result.whatsappUrl);
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit your enquiry.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-5"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-enquiry-title"
        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="product-enquiry-title" className="text-lg font-bold text-gray-900 sm:text-xl">Enquire about this product</h2>
            <p className="mt-1 text-sm leading-5 text-gray-600">{product.title}</p>
          </div>
          <button type="button" onClick={closeDialog} disabled={submitting} aria-label="Close enquiry form" className="rounded p-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-50">
            &times;
          </button>
        </div>

        <form onSubmit={submitEnquiry} className="grid gap-3 sm:gap-4">
          {error && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
          <label className="grid gap-1 text-sm font-semibold text-gray-700">
            Name <span className="sr-only">(required)</span>
            <input required maxLength={100} autoComplete="name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal outline-none focus:border-[#c45724] focus:ring-2 focus:ring-[#c45724]/20" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-gray-700">
            Phone number <span className="sr-only">(required)</span>
            <input required type="tel" maxLength={30} autoComplete="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal outline-none focus:border-[#c45724] focus:ring-2 focus:ring-[#c45724]/20" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-gray-700">
            Email address <span className="font-normal text-gray-500">(optional)</span>
            <input type="email" maxLength={254} autoComplete="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-normal outline-none focus:border-[#c45724] focus:ring-2 focus:ring-[#c45724]/20" />
          </label>
          <p className="text-xs leading-5 text-gray-500">We’ll save your enquiry and open WhatsApp with your product details and contact information.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeDialog} disabled={submitting} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:flex-none">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 rounded-md bg-[#c45724] px-3 py-2 text-sm font-bold text-white hover:bg-[#a9431a] disabled:cursor-wait disabled:opacity-60 sm:flex-none">
              {submitting ? 'Submitting…' : 'Continue to WhatsApp'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
