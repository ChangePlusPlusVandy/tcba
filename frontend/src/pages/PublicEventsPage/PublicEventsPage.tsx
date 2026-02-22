import { useState } from 'react';
import { usePublicEvents } from '../../hooks/queries/useEvents';
import { usePublicRSVP } from '../../hooks/mutations/useEvents';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { PublicEventListView } from './PublicEventListView';
import { PublicRSVPModal } from './PublicRSVPModal';
import type { Event } from '../../hooks/queries/useEvents';

const localizer = momentLocalizer(moment);

export function PublicEventsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const { data: events = [], isLoading, refetch } = usePublicEvents(upcomingOnly);
  const rsvpMutation = usePublicRSVP();

  const handleRSVP = async (data: {
    email: string;
    name?: string;
    phone?: string;
    notes?: string;
  }) => {
    if (!selectedEvent) return;
    try {
      await rsvpMutation.mutateAsync({ eventId: selectedEvent.id, data });
      setShowRSVPModal(false);
      setSelectedEvent(null);
      refetch();
      alert(
        'RSVP successful! You will receive a confirmation email and reminders before the event.'
      );
    } catch (error: any) {
      alert(error.message || 'Failed to RSVP');
    }
  };

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    resource: event,
  }));

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-4xl font-bold'>Upcoming Events</h1>
        </div>

        <div className='flex gap-2 mb-6 justify-between items-center'>
          <div className='flex gap-2'>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              List View
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded ${view === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Calendar View
            </button>
          </div>
          <div className='flex items-center gap-2'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={upcomingOnly}
                onChange={e => setUpcomingOnly(e.target.checked)}
                className='w-4 h-4'
              />
              <span className='text-sm text-gray-700'>Upcoming events only</span>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <span className='loading loading-spinner loading-lg'></span>
          </div>
        ) : view === 'list' ? (
          <PublicEventListView
            events={events}
            onRSVP={event => {
              setSelectedEvent(event);
              setShowRSVPModal(true);
            }}
          />
        ) : (
          <div className='bg-white p-4 rounded-lg shadow' style={{ height: '700px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor='start'
              endAccessor='end'
              style={{ height: '100%' }}
              onSelectEvent={event => {
                setSelectedEvent(event.resource);
                setShowRSVPModal(true);
              }}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: '#3b82f6',
                },
              })}
            />
          </div>
        )}

        {showRSVPModal && selectedEvent && (
          <PublicRSVPModal
            event={selectedEvent}
            onClose={() => {
              setShowRSVPModal(false);
              setSelectedEvent(null);
            }}
            onSubmit={handleRSVP}
          />
        )}
      </div>
    </div>
  );
}
