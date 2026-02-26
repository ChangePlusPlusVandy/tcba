import { useState } from 'react';
import { usePublicEvents } from '../../hooks/queries/useEvents';
import { usePublicRSVP } from '../../hooks/mutations/useEvents';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { PublicEventListView } from './PublicEventListView';
import { PublicRSVPModal } from './PublicRSVPModal';
import type { Event } from '../../hooks/queries/useEvents';
import { MutatingDots } from 'react-loader-spinner';

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

        <div className='flex gap-2 mb-6 items-center'>
          <button
            onClick={() => setView('list')}
            className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg shadow-sm border transition-colors whitespace-nowrap text-sm sm:text-base ${view === 'list' ? 'bg-[#D54242] text-white border-[#D54242]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg shadow-sm border transition-colors whitespace-nowrap text-sm sm:text-base ${view === 'calendar' ? 'bg-[#D54242] text-white border-[#D54242]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Calendar View
          </button>
          <div className='flex items-center gap-2 ml-2'>
            <span className={`text-sm font-medium transition-colors ${!upcomingOnly ? 'text-gray-600' : 'text-gray-400'}`}>
              All
            </span>
            <button
              onClick={() => setUpcomingOnly(!upcomingOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${upcomingOnly ? 'bg-[#D54242]' : 'bg-gray-300'}`}
              aria-label='Toggle upcoming events filter'
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${upcomingOnly ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${upcomingOnly ? 'text-gray-600' : 'text-gray-400'}`}>
              Upcoming
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center items-center py-12'>
            <MutatingDots
              visible={true}
              height='100'
              width='100'
              color='#D54242'
              secondaryColor='#D54242'
              radius='12.5'
              ariaLabel='mutating-dots-loading'
            />
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
              onSelectEvent={(event: { resource: Event }) => {
                setSelectedEvent(event.resource);
                setShowRSVPModal(true);
              }}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: '#f5c2c7',
                  color: '#88242C',
                  fontWeight: '500',
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
