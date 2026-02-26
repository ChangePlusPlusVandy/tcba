import { useState } from 'react';
import { useEvents } from '../../../hooks/queries/useEvents';
import {
  useCreateEvent,
  useUpdateEvent,
  usePublishEvent,
  useDeleteEvent,
} from '../../../hooks/mutations/useEvents';
import type { EventData } from '../../../hooks/mutations/useEvents';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventListView } from './EventListView';
import { EventFormModal } from './EventFormModal';
import type { Event } from '../../../hooks/queries/useEvents';
import AdminSidebar from '../../../components/AdminSidebar';

const localizer = momentLocalizer(moment);

export function EventManagementPage() {
  const [view, setView] = useState<'list' | 'calendar' | 'create' | 'edit'>('list');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const { data: events = [], isLoading, refetch } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const publishEvent = usePublishEvent();
  const deleteEvent = useDeleteEvent();

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter.toUpperCase();
  });

  const handleCreateEvent = async (data: EventData) => {
    try {
      await createEvent.mutateAsync(data);
      setView('list');
      refetch();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };

  const handleCreateAndPublishEvent = async (data: EventData) => {
    try {
      const newEvent = await createEvent.mutateAsync(data);
      // Immediately publish the newly created event
      await publishEvent.mutateAsync(newEvent.id);
      setView('list');
      refetch();
    } catch (error) {
      console.error('Error creating and publishing event:', error);
      alert('Failed to create and publish event');
    }
  };

  const handleUpdateEvent = async (data: Partial<EventData>) => {
    if (!editingEvent) return;
    try {
      await updateEvent.mutateAsync({ id: editingEvent.id, data });
      setEditingEvent(null);
      setView('list');
      refetch();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    if (
      !confirm(
        'Are you sure you want to publish this event? Notifications will be sent to all members.'
      )
    ) {
      return;
    }
    try {
      await publishEvent.mutateAsync(eventId);
      refetch();
    } catch (error) {
      console.error('Error publishing event:', error);
      alert('Failed to publish event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
    try {
      await deleteEvent.mutateAsync(eventId);
      // If we're editing the event being deleted, go back to list view
      if (editingEvent?.id === eventId) {
        setEditingEvent(null);
        setView('list');
      }
      refetch();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  // Convert events to calendar format
  const calendarEvents = filteredEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    resource: event,
  }));

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8 overflow-auto'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='flex justify-between items-center mb-8'>
            {view === 'create' || view === 'edit' ? (
              <button
                onClick={() => {
                  setView('list');
                  setEditingEvent(null);
                }}
                className='flex items-center gap-2 text-gray-600 hover:text-gray-800'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 19l-7-7 7-7'
                  />
                </svg>
                Back
              </button>
            ) : (
              <h1 className='text-4xl font-bold text-gray-800'>Events</h1>
            )}
            {view === 'list' && (
              <button
                onClick={() => setView('create')}
                className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium'
              >
                + Create New Event
              </button>
            )}
          </div>

          {/* Search and Filters - Only show in list/calendar view */}
          {(view === 'list' || view === 'calendar') && (
            <div className='bg-white rounded-lg shadow p-4 mb-6'>
              <div className='flex gap-4 items-center justify-between flex-wrap'>
                <div className='flex-1 min-w-[200px]'>
                  <div className='relative'>
                    <input
                      type='text'
                      placeholder='Search tags, title, description...'
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <svg
                      className='absolute left-3 top-2.5 w-5 h-5 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </div>
                </div>

                <div className='flex gap-2 items-center'>
                  <button className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
                      />
                    </svg>
                    Filter
                  </button>

                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='all'>All Status</option>
                    <option value='draft'>Draft</option>
                    <option value='published'>Published</option>
                    <option value='cancelled'>Cancelled</option>
                  </select>

                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded ${view === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    title='List View'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 6h16M4 12h16M4 18h16'
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => setView('calendar')}
                    className={`p-2 rounded ${view === 'calendar' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    title='Calendar View'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <span className='loading loading-spinner loading-lg'></span>
            </div>
          ) : view === 'create' ? (
            <EventFormModal
              event={null}
              onClose={() => setView('list')}
              onSubmit={handleCreateEvent}
              onPublish={handleCreateAndPublishEvent}
            />
          ) : view === 'edit' ? (
            <EventFormModal
              event={editingEvent}
              onClose={() => {
                setView('list');
                setEditingEvent(null);
              }}
              onSubmit={handleUpdateEvent}
              onPublish={async data => {
                await handleUpdateEvent(data);
                if (editingEvent) {
                  await handlePublishEvent(editingEvent.id);
                }
              }}
            />
          ) : view === 'list' ? (
            <EventListView
              events={filteredEvents}
              onEdit={event => {
                setEditingEvent(event);
                setView('edit');
              }}
              onPublish={handlePublishEvent}
              onDelete={handleDeleteEvent}
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
                  setEditingEvent(event.resource);
                  setView('edit');
                }}
                eventPropGetter={event => {
                  const bgColor =
                    event.resource.status === 'PUBLISHED'
                      ? '#10b981'
                      : event.resource.status === 'DRAFT'
                        ? '#6b7280'
                        : '#ef4444';
                  return {
                    style: {
                      backgroundColor: bgColor,
                    },
                  };
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
