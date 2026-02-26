import { format } from 'date-fns';
import type { Event } from '../../hooks/queries/useEvents';

interface PublicEventListViewProps {
  events: Event[];
  onRSVP: (event: Event) => void;
}

export function PublicEventListView({ events, onRSVP }: PublicEventListViewProps) {
  if (events.length === 0) {
    return (
      <div className='text-center py-12 bg-white rounded-lg shadow'>
        <p className='text-gray-500 text-lg'>No upcoming public events at this time.</p>
        <p className='text-gray-400 mt-2'>Check back soon for new events!</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {events.map(event => (
        <div
          key={event.id}
          className='bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden'
        >
          {/* Content */}
          <div className='p-6'>
            <h3 className='text-xl font-bold text-gray-800 mb-2'>{event.title}</h3>

            <div className='flex items-center gap-3 text-sm text-gray-500 mb-3'>
              <span>{format(new Date(event.startTime), 'MMMM dd, yyyy')}</span>
              {event.tags && event.tags.length > 0 && (
                <div className='flex gap-2'>
                  {event.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className='px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs'>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className='text-gray-600 line-clamp-3 mb-4'>{event.description}</p>

            <div className='flex items-center justify-between pt-4 border-t'>
              <div className='text-sm text-gray-500'>
                {event.rsvpCount} {event.rsvpCount === 1 ? 'person' : 'people'} attending
              </div>
              <button
                onClick={() => onRSVP(event)}
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium'
                disabled={event.maxAttendees ? event.rsvpCount >= event.maxAttendees : false}
              >
                {event.maxAttendees && event.rsvpCount >= event.maxAttendees
                  ? 'Event Full'
                  : 'RSVP'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
