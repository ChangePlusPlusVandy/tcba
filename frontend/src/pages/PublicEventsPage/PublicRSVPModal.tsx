import { useState } from 'react';
import { format } from 'date-fns';
import type { Event } from '../../hooks/queries/useEvents';

interface PublicRSVPModalProps {
  event: Event;
  onClose: () => void;
  onSubmit: (data: { email: string; name?: string; phone?: string; notes?: string }) => void;
}

export function PublicRSVPModal({ event, onClose, onSubmit }: PublicRSVPModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!formData.email || !validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <div className='fixed inset-0 backdrop-blur-sm bg-gray-900/20 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl'>
          <div className='flex justify-between items-start'>
            <div>
              <h2 className='text-3xl font-bold text-gray-900 mb-2'>RSVP for {event.title}</h2>
              <p className='text-gray-600'>{event.description}</p>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div className='px-8 py-6 bg-gradient-to-br from-blue-50 to-indigo-50'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-white p-3 rounded-lg shadow-sm'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <div>
                <p className='text-xs text-gray-500 uppercase font-semibold'>Date</p>
                <p className='text-gray-900 font-medium'>
                  {format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='bg-white p-3 rounded-lg shadow-sm'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div>
                <p className='text-xs text-gray-500 uppercase font-semibold'>Time</p>
                <p className='text-gray-900 font-medium'>
                  {format(new Date(event.startTime), 'h:mm a')}
                </p>
              </div>
            </div>

            {event.location && (
              <div className='flex items-center gap-3 md:col-span-2'>
                <div className='bg-white p-3 rounded-lg shadow-sm'>
                  <svg
                    className='w-6 h-6 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                </div>
                <div>
                  <p className='text-xs text-gray-500 uppercase font-semibold'>Location</p>
                  <p className='text-gray-900 font-medium'>{event.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className='mx-8 mt-6 bg-blue-100 border border-blue-200 rounded-xl p-4 flex items-start gap-3'>
          <svg
            className='w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <p className='text-blue-900 text-sm'>
            We'll send you event details and reminders via email
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='px-8 py-6 space-y-5'>
          <div>
            <label className='block text-sm font-semibold text-gray-700 mb-2'>
              Email Address <span className='text-red-500'>*</span>
            </label>
            <input
              type='email'
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow`}
              placeholder='your.email@example.com'
            />
            {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Your Name <span className='text-gray-400 text-xs'>(Optional)</span>
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow'
              placeholder='John Doe'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Phone Number <span className='text-gray-400 text-xs'>(Optional)</span>
            </label>
            <input
              type='tel'
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow'
              placeholder='(123) 456-7890'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Additional Notes <span className='text-gray-400 text-xs'>(Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none'
              placeholder='Any questions or special requirements?'
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-500/50'
            >
              Submit RSVP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
