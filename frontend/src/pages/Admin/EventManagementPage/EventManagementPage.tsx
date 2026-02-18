import { useMemo, useRef, useState } from 'react';
// Import event hooks
// import { useEvents } from '../../../hooks/queries/useEvents';
// import { useCreateEvent, useUpdateEvent, usePublishEvent, useDeleteEvent } from '../../../hooks/mutations/useEvents';
import AdminSidebar from '../../../components/AdminSidebar';
// import ReactQuill from 'react-quill-new';
import Toast from '../../../components/Toast';

import { useEvents } from '../../../hooks/queries/useEvents';
import FileUpload from '../../../components/FileUpload';
import ReactQuill from 'react-quill-new';
import {
  useCreateEvent,
  useUpdateEvent,
  usePublishEvent,
  useDeleteEvent,
  useRSVP,
} from '../../../hooks/mutations/useEvents';

type EventForm = {
  title: string;
  description: string;
  location: string;
  link: string;
  meetingPassword: string;
  startTime: string;
  endTime: string;
  timezone: string;
  maxAttendees: string;
  tags: Tag[];
  attachmentUrls: string[]; // URLs of uploaded attachments
  // status: 'DRAFT' | 'PUBLISHED';
  isPublished: boolean;
};

type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export function EventManagementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const createEvent = useCreateEvent();
  // const { useCreateEvent, useUpdateEvent, usePublishEvent, useDeleteEvent, useRSVP } = useEvents();
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    link: '',
    meetingPassword: '',
    startTime: '',
    endTime: '',
    timezone: '',
    maxAttendees: '',
    isPublished: false,
    tags: [] as string[],
    attachmentUrls: [] as string[],
    // status: 'DRAFT',
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);
  // const quillRef = useRef<ReactQuill>(null);

  // const quillModules = useMemo(
  //   () => ({
  //     toolbar: {
  //       container: [
  //         [{ header: [1, 2, 3, false] }],
  //         ['bold', 'italic', 'underline', 'strike'],
  //         [{ list: 'ordered' }, { list: 'bullet' }],
  //         ['link', 'image'],
  //         ['align-image-left', 'align-image-center', 'align-image-right'],
  //         ['clean'],
  //       ],
  //       handlers: {},
  //       // handlers: {
  //       //   image: handleImageUpload,
  //       //   'align-image-left': () => alignImage('left'),
  //       //   'align-image-center': () => alignImage('center'),
  //       //   'align-image-right': () => alignImage('right'),
  //       // },
  //     },
  //   })
  //   // [handleImageUpload, alignImage]
  // );

  // Fetch all events with useEvents() (no filters to see all statuses)
  // Handle create event with useCreateEvent()
  // Handle update event with useUpdateEvent()
  // Handle publish event with usePublishEvent()
  // Handle delete event with useDeleteEvent()

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement create event logic
    try {
      console.log(newEvent);
      const payload = {
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location || null,
        link: newEvent.link || null,
        meetingPassword: newEvent.meetingPassword || null,
        startTime: newEvent.startTime ? new Date(newEvent.startTime).toISOString() : null,
        endTime: newEvent.endTime ? new Date(newEvent.endTime).toISOString() : null,
        timezone: newEvent.timezone,
        maxAttendees: newEvent.maxAttendees === '' ? null : Number(newEvent.maxAttendees),
        tags: newEvent.tags,
        attachmentUrls: newEvent.attachmentUrls,
        isPublished: newEvent.isPublished,
      };

      // await useCreateEvent.mutateAsync(payload);

      await createEvent.mutateAsync(payload);

      const successMessage = newEvent.isPublished
        ? 'Event created successfully'
        : 'Event saved successfully';
      setToast({ message: successMessage, type: 'success' });

      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        location: '',
        link: '',
        meetingPassword: '',
        startTime: '',
        endTime: '',
        timezone: '',
        maxAttendees: '',
        isPublished: false,
        tags: [] as string[],
        attachmentUrls: [] as string[],
      });
    } catch (error: any) {
      console.error('Error creating event:', error);
      setToast({ message: error.message || 'Failed to create event', type: 'error' });
    }
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold'>Event Management</h1>

          {/* <button
            // onClick={() => setShowCreateModal(true)}
            className='btn btn-primary'
          >
            Create Event
          </button> */}

          <button
            onClick={() => setShowCreateModal(true)}
            className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
          >
            Create Event
          </button>
        </div>

        <div className='alert alert-info'>
          <span>Implement event management page</span>
          <ul className='list-disc ml-6 mt-2'>
            <li>Display all events with filters (draft, published, etc.)</li>
            <li>Create event form (title, description, date/time, location, zoom link)</li>
            <li>Edit existing events</li>
            <li>Publish/unpublish events</li>
            <li>View RSVP list for each event</li>
            <li>Delete events</li>
          </ul>
        </div>

        {/* Events table/list */}
        {/* Create/Edit event modal */}
        {showCreateModal && (
          <>
            <input type='checkbox' checked readOnly className='modal-toggle' />
            <div className='modal modal-open'>
              <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
                <h3 className='font-bold text-xl text-gray-900 mb-4'>Create New Event</h3>

                <form onSubmit={handleCreateEvent} className='space-y-4'>
                  {/* Title */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Title <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={newEvent.title}
                      onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      placeholder='Enter event title'
                    />
                  </div>

                  {/* Description (ReactQuill) */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Description <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={newEvent.description}
                      onChange={e =>
                        setNewEvent(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      placeholder='Enter event description'
                    />
                    {/* <div style={{ height: '250px' }}>
                      <ReactQuill
                        theme='snow'
                        value={newEvent.description}
                        onChange={value => setNewEvent({ ...newEvent, description: value })}
                        placeholder='Enter event description...'
                        style={{ height: '200px' }}
                      />
                    </div> */}
                  </div>

                  {/* Date & Time */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>
                        Start Time *
                      </label>
                      <input
                        type='datetime-local'
                        required
                        value={newEvent.startTime}
                        onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>
                        End Time *
                      </label>
                      <input
                        type='datetime-local'
                        required
                        value={newEvent.endTime}
                        onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                  </div>

                  {/* Location + Link */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>
                        Location
                      </label>
                      <input
                        type='text'
                        value={newEvent.location}
                        onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg'
                        placeholder='Physical location (optional)'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>
                        Virtual Link
                      </label>
                      <input
                        type='url'
                        value={newEvent.link}
                        onChange={e => setNewEvent({ ...newEvent, link: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg'
                        placeholder='Zoom / Google Meet link'
                      />
                    </div>
                  </div>

                  {/* Max Attendees */}
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Max Attendees
                    </label>
                    <input
                      type='number'
                      min='1'
                      value={newEvent.maxAttendees}
                      onChange={e => setNewEvent({ ...newEvent, maxAttendees: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg'
                      placeholder='Leave blank for unlimited'
                    />
                  </div>

                  {/* File Upload */}
                  <FileUpload
                    attachmentUrls={newEvent.attachmentUrls}
                    onFilesChange={files => setNewEvent({ ...newEvent, attachmentUrls: files })}
                  />

                  {/* Action Buttons */}
                  <div className='flex gap-3 pt-4'>
                    {/* Publish */}
                    <button
                      type='button'
                      onClick={async () => {
                        setNewEvent({ ...newEvent, isPublished: true });
                        await handleCreateEvent(new Event('submit') as any);
                      }}
                      className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-lg font-medium'
                    >
                      Publish
                    </button>

                    {/* Save Draft */}
                    <button
                      type='button'
                      onClick={async () => {
                        setNewEvent({ ...newEvent, isPublished: false });
                        await handleCreateEvent(new Event('submit') as any);
                      }}
                      className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium'
                    >
                      Save to Drafts
                    </button>

                    {/* Cancel */}
                    <button
                      type='button'
                      onClick={() => setShowCreateModal(false)}
                      className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              <div
                className='modal-backdrop bg-black/30'
                onClick={() => setShowCreateModal(false)}
              ></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EventManagementPage;
