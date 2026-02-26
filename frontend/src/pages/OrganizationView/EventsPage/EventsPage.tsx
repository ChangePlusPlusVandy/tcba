import { useState } from 'react';
import { useEvents } from '../../../hooks/queries/useEvents';
import { useRSVP, useCancelRSVP } from '../../../hooks/mutations/useEvents';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { OrgEventListView } from './OrgEventListView';
import { RSVPModal } from './RSVPModal';
import type { Event } from '../../../hooks/queries/useEvents';

const localizer = momentLocalizer(moment);

export function EventsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);

  const {
    data: events = [],
    isLoading,
    refetch,
  } = useEvents({ status: 'PUBLISHED', upcoming: true });
  const rsvpMutation = useRSVP();
  const cancelRSVPMutation = useCancelRSVP();

  const handleRSVP = async (data: any) => {
    if (!selectedEvent) return;
    try {
      await rsvpMutation.mutateAsync({ eventId: selectedEvent.id, data });
      setShowRSVPModal(false);
      setSelectedEvent(null);
      refetch();
      alert('RSVP successful! You will receive email reminders before the event.');
    } catch (error: any) {
      alert(error.message || 'Failed to RSVP');
    }
  };

  const handleCancelRSVP = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel your RSVP?')) return;
    try {
      await cancelRSVPMutation.mutateAsync(eventId);
      refetch();
      alert('RSVP cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel RSVP');
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
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Events</h1>
      </div>

      <div className='flex gap-2 mb-6'>
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

      {isLoading ? (
        <div className='flex justify-center items-center h-64'>
          <span className='loading loading-spinner loading-lg'></span>
        </div>
      ) : view === 'list' ? (
        <OrgEventListView
          events={events}
          onRSVP={event => {
            setSelectedEvent(event);
            setShowRSVPModal(true);
          }}
          onCancelRSVP={handleCancelRSVP}
        />
      ) : (
        <div className='bg-white p-4 rounded-lg shadow' style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor='start'
            endAccessor='end'
            style={{ height: '100%' }}
            onSelectEvent={(event: { resource: Event }) => {
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
        <RSVPModal
          event={selectedEvent}
          onClose={() => {
            setShowRSVPModal(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleRSVP}
        />
      )}
    </div>
  );
}
