import { format } from 'date-fns';
import type { Event } from '../../../hooks/queries/useEvents';

interface OrgEventListViewProps {
  events: Event[];
  onRSVP: (event: Event) => void;
  onCancelRSVP: (eventId: string) => void;
}

export function OrgEventListView({ events, onRSVP, onCancelRSVP }: OrgEventListViewProps) {
  if (events.length === 0) {
    return (
      <div className='text-center py-12 bg-white rounded-lg shadow'>
        <p className='text-gray-500 text-lg'>No upcoming events at this time.</p>
      </div>
    );
  }

  return (
    <div className='grid gap-4'>
      {events.map(event => (
        <div key={event.id} className='card bg-white shadow-lg'>
          <div className='card-body'>
            <div className='flex justify-between items-start'>
              <div className='flex-1'>
                <h2 className='card-title text-2xl'>{event.title}</h2>
                <p className='text-gray-600 mt-2'>{event.description}</p>

                <div className='mt-4 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-gray-500'>📅</span>
                    <span>{format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-gray-500'>⏰</span>
                    <span>
                      {format(new Date(event.startTime), 'h:mm a')} -{' '}
                      {format(new Date(event.endTime), 'h:mm a')}
                    </span>
                  </div>
                  {event.location && (
                    <div className='flex items-center gap-2'>
                      <span className='text-gray-500'>📍</span>
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.zoomLink && (
                    <div className='flex items-center gap-2'>
                      <span className='text-gray-500'>💻</span>
                      <a
                        href={event.zoomLink}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='link link-primary'
                      >
                        Join Virtual Meeting
                      </a>
                    </div>
                  )}
                  <div className='flex items-center gap-2'>
                    <span className='text-gray-500'>👥</span>
                    <span>
                      {event.rsvpCount} RSVP{event.rsvpCount !== 1 ? 's' : ''}
                      {event.maxAttendees && ` / ${event.maxAttendees} max`}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                {event.hasUserRSVPd ? (
                  <button
                    onClick={() => onCancelRSVP(event.id)}
                    className='btn btn-error btn-outline'
                  >
                    Cancel RSVP
                  </button>
                ) : (
                  <button onClick={() => onRSVP(event)} className='btn btn-primary'>
                    RSVP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
