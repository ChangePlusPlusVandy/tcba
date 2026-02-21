import { useState } from 'react';
import { format } from 'date-fns';
import type { Event } from '../../../hooks/queries/useEvents';

interface RSVPModalProps {
  event: Event;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function RSVPModal({ event, onClose, onSubmit }: RSVPModalProps) {
  const [formData, setFormData] = useState({
    status: 'GOING' as 'GOING' | 'MAYBE' | 'NOT_GOING',
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-4">{event.title}</h3>

        <div className="mb-6 space-y-2">
          <p className="text-gray-700">{event.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📅</span>
            <span>{format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">⏰</span>
            <span>{format(new Date(event.startTime), 'h:mm a')}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📍</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Response *</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'GOING' })}
                className={`btn flex-1 ${formData.status === 'GOING' ? 'btn-success' : 'btn-outline'}`}
              >
                ✓ Going
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'MAYBE' })}
                className={`btn flex-1 ${formData.status === 'MAYBE' ? 'btn-warning' : 'btn-outline'}`}
              >
                ? Maybe
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'NOT_GOING' })}
                className={`btn flex-1 ${formData.status === 'NOT_GOING' ? 'btn-error' : 'btn-outline'}`}
              >
                ✕ Can't Go
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Attendee Name</span>
            </label>
            <input
              type="text"
              value={formData.attendeeName}
              onChange={(e) => setFormData({ ...formData, attendeeName: e.target.value })}
              className="input input-bordered"
              placeholder="Optional"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Contact Email</span>
            </label>
            <input
              type="email"
              value={formData.attendeeEmail}
              onChange={(e) => setFormData({ ...formData, attendeeEmail: e.target.value })}
              className="input input-bordered"
              placeholder="Optional"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notes</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea textarea-bordered"
              placeholder="Any additional information..."
            />
          </div>

          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit RSVP
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
