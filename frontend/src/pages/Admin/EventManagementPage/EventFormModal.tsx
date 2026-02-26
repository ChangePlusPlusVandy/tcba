import { useState, useEffect } from 'react';
import type { Event } from '../../../hooks/queries/useEvents';
import type { EventData } from '../../../hooks/mutations/useEvents';

interface EventFormModalProps {
  event: Event | null;
  onClose: () => void;
  onSubmit: (data: EventData | Partial<EventData>) => void;
  onPublish?: (data: EventData | Partial<EventData>) => void;
}

export function EventFormModal({ event, onClose, onSubmit, onPublish }: EventFormModalProps) {
  const [formData, setFormData] = useState<EventData>({
    title: '',
    description: '',
    location: '',
    zoomLink: '',
    meetingPassword: '',
    startTime: '',
    endTime: '',
    timezone: 'America/Chicago',
    isPublic: false,
    maxAttendees: undefined,
    tags: [],
    attachments: [],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        location: event.location || '',
        zoomLink: event.zoomLink || '',
        meetingPassword: event.meetingPassword || '',
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
        isPublic: event.isPublic,
        maxAttendees: event.maxAttendees,
        tags: event.tags,
        attachments: event.attachments,
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  return (
    <div className='bg-white rounded-lg shadow p-8'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          {event ? 'Edit Event' : 'Create New Event'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Event Title */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Event Title <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter event title'
          />
        </div>

        {/* Date */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Date <span className='text-red-500'>*</span>
          </label>
          <div className='grid grid-cols-2 gap-4'>
            <input
              type='datetime-local'
              required
              value={
                formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''
              }
              onChange={e =>
                setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <input
              type='datetime-local'
              required
              value={formData.endTime ? new Date(formData.endTime).toISOString().slice(0, 16) : ''}
              onChange={e =>
                setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Tags</label>
          <div className='flex gap-2 mb-3 flex-wrap'>
            {formData.tags &&
              formData.tags.map(tag => (
                <span
                  key={tag}
                  className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2'
                >
                  {tag}
                  <button
                    type='button'
                    onClick={() => removeTag(tag)}
                    className='hover:text-blue-900 font-bold'
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
          <div className='flex gap-2'>
            <input
              type='text'
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Add a tag...'
            />
            <button
              type='button'
              onClick={addTag}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
              + Add
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Description <span className='text-red-500'>*</span>
          </label>
          <textarea
            required
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none'
            placeholder='Enter event description'
          />
          <div className='text-right text-sm text-gray-400 mt-1'>500 words</div>
        </div>

        {/* Location & Zoom */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Location</label>
            <input
              type='text'
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Physical location'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Zoom Link</label>
            <input
              type='url'
              value={formData.zoomLink}
              onChange={e => setFormData({ ...formData, zoomLink: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='https://zoom.us/...'
            />
          </div>
        </div>

        {/* Meeting Password */}
        {formData.zoomLink && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Meeting Password</label>
            <input
              type='text'
              value={formData.meetingPassword}
              onChange={e => setFormData({ ...formData, meetingPassword: e.target.value })}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Optional meeting password'
            />
          </div>
        )}

        {/* Max Attendees */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Max Attendees (Optional)
          </label>
          <input
            type='number'
            min='1'
            value={formData.maxAttendees || ''}
            onChange={e =>
              setFormData({
                ...formData,
                maxAttendees: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Leave empty for unlimited'
          />
        </div>

        {/* Is Public */}
        <div className='flex items-center gap-3'>
          <input
            type='checkbox'
            id='isPublic'
            checked={formData.isPublic}
            onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
          />
          <label htmlFor='isPublic' className='text-sm text-gray-700'>
            Open to Public (allows non-members to RSVP)
          </label>
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-3 pt-6 border-t border-gray-200'>
          <button
            type='button'
            onClick={onClose}
            className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700'
          >
            Cancel
          </button>
          {event ? (
            // Editing mode - just Save button
            <button
              type='submit'
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Save
            </button>
          ) : (
            // Creating mode - Save Draft and Publish buttons
            <>
              <button
                type='submit'
                className='px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700'
              >
                Save Draft
              </button>
              <button
                type='button'
                onClick={() => {
                  // Submit as published
                  if (onPublish) {
                    onPublish({ ...formData });
                  }
                }}
                className='px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
              >
                Publish
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
