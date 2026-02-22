import { format } from 'date-fns';
import type { Event } from '../../../hooks/queries/useEvents';

interface EventListViewProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onPublish: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export function EventListView({ events, onEdit, onPublish, onDelete }: EventListViewProps) {
  if (events.length === 0) {
    return (
      <div className='text-center py-12 bg-white rounded-lg shadow'>
        <p className='text-gray-500 text-lg'>No events found. Create your first event!</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {events.map(event => (
        <div
          key={event.id}
          className='bg-white rounded-lg shadow hover:shadow-lg transition-shadow'
        >
          <div className='flex gap-6 p-6'>
            {/* Content */}
            <div className='flex-1'>
              <div className='flex justify-between items-start mb-2'>
                <h3 className='text-xl font-bold text-gray-800'>{event.title}</h3>
                <button
                  onClick={() => onEdit(event)}
                  className='text-gray-400 hover:text-gray-600'
                  title='Edit'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                    />
                  </svg>
                </button>
              </div>

              <div className='flex items-center gap-4 text-sm text-gray-500 mb-3'>
                <span>{format(new Date(event.startTime), 'MMMM dd, yyyy')}</span>
                {event.tags && event.tags.length > 0 && (
                  <div className='flex gap-2'>
                    {event.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className='px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {event.status === 'DRAFT' && (
                  <span className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs'>
                    Draft
                  </span>
                )}
                {event.status === 'PUBLISHED' && (
                  <span className='px-2 py-1 bg-green-100 text-green-700 rounded text-xs'>
                    Published
                  </span>
                )}
              </div>

              <p className='text-gray-600 line-clamp-2 mb-3'>{event.description}</p>

              <div className='flex items-center justify-between'>
                <div className='flex gap-4 text-sm text-gray-500'>
                  {event.location && (
                    <span className='flex items-center gap-1'>
                      <svg
                        className='w-4 h-4'
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
                      {event.location}
                    </span>
                  )}
                  <span>{event.rsvpCount} RSVPs</span>
                  {event.isPublic && <span className='text-blue-600'>Public</span>}
                </div>

                <div className='flex gap-2'>
                  {event.status === 'DRAFT' && (
                    <button
                      onClick={() => onPublish(event.id)}
                      className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm'
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(event.id)}
                    className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
