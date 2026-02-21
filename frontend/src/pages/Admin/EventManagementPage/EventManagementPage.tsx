import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useAdminEvents } from '../../../hooks/queries/useAdminEvents';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

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
  isPublished: boolean;
};

type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export function EventManagementPage() {
  const { getToken } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [selectedDeletedEventIds, setSelectedDeletedEventIds] = useState<string[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const createEvent = useCreateEvent();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const {
    data: eventsData,
    isLoading: loading,
    error: eventsError,
  } = useAdminEvents(currentPage, itemsPerPage);
  const error = eventsError ? 'Failed to fetch events' : '';

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tags`);
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

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

  const eventsResponse = eventsData || {};
  const events = eventsResponse.data || eventsResponse;
  const eventsArray = Array.isArray(events) ? events : [];
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

      setIsCreateModalOpen(false);
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

  const published = eventsArray.filter(a => a.isPublished === true);
  const drafts = eventsArray.filter(a => a.isPublished === false);

  const currentFilterCount =
    filter === 'ALL'
      ? events?.length || 0
      : filter === 'PUBLISHED'
        ? published?.length || 0
        : drafts?.length || 0;

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {filter === 'ALL' && `All Events (${currentFilterCount})`}
          {filter === 'PUBLISHED' && `Published (${currentFilterCount})`}
          {filter === 'DRAFTS' && `Drafts (${currentFilterCount})`}
        </h1>

        <div className='flex items-center gap-4 mb-6'>
          <div className='flex gap-2'>
            {(['ALL', 'PUBLISHED', 'DRAFTS'] as const).map((f: 'ALL' | 'PUBLISHED' | 'DRAFTS') => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                  filter === f
                    ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } cursor-pointer`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className='relative tag-dropdown-container'>
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className='px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center gap-2'
            >
              <span>
                {tagsFilter.length > 0 ? `Tags (${tagsFilter.length})` : 'Filter by Tags'}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>

            {tagDropdownOpen && (
              <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto'>
                {tags.length === 0 ? (
                  <div className='px-4 py-3 text-sm text-gray-500'>No tags available</div>
                ) : (
                  <div className='py-2'>
                    {tags.map((tag: Tag) => (
                      <label
                        key={tag.id}
                        className='flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={tagsFilter.includes(tag.name)}
                          onChange={e => {
                            if (e.target.checked) {
                              setTagsFilter([...tagsFilter, tag.name]);
                            } else {
                              setTagsFilter(tagsFilter.filter(t => t !== tag.name));
                            }
                          }}
                          className='w-4 h-4 text-[#194B90] border-gray-300 rounded focus:ring-[#194B90]'
                        />
                        <span className='ml-2 text-sm text-gray-700'>{tag.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {tagsFilter.length > 0 && (
                  <div className='border-t border-gray-200 px-4 py-2'>
                    <button
                      onClick={() => {
                        setTagsFilter([]);
                        setTagDropdownOpen(false);
                      }}
                      className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* <button
            onClick={() => setIsCreateModalOpen(true)}
            className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
          >
            Create
          </button> */}
          {/* <button
             // onClick={() => setShowCreateModal(true)}
             className='btn btn-primary'
           >
             Create Event
           </button> */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
          >
            Create Event
          </button>
          {/* </div> */}
          {/* {selectedDeletedEventIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
            >
              Delete Selected ({selectedEventIds.length})
            </button>
          )} */}
          <div className='flex-1 max-w-xl ml-auto'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search events...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#194B90]'
              />
              <svg
                className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
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

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6'>
            {error}
          </div>
        )}
        {isCreateModalOpen && (
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
                        Start Time <span className='text-red-500'>*</span>
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
                        End Time <span className='text-red-500'>*</span>
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
                      onClick={() => setIsCreateModalOpen(false)}
                      className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              <div
                className='modal-backdrop bg-black/30'
                onClick={() => setIsCreateModalOpen(false)}
              ></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
  // return (
  //   <div className='flex min-h-screen bg-gray-50'>
  //     <AdminSidebar />
  //     {/* <div className='p-6'> */}
  //     <div className='flex-1 p-8'>
  //       <h1 className='text-3xl font-bold text-gray-800 mb-6'>Event Management</h1>

  //       {/* <button
  //           // onClick={() => setShowCreateModal(true)}
  //           className='btn btn-primary'
  //         >
  //           Create Event
  //         </button> */}

  //       <button
  //         onClick={() => setShowCreateModal(true)}
  //         className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
  //       >
  //         Create Event
  //       </button>
  //       {/* </div> */}

  //       <div className='alert alert-info'>
  //         <span>Implement event management page</span>
  //         <ul className='list-disc ml-6 mt-2'>
  //           <li>Display all events with filters (draft, published, etc.)</li>
  //           <li>Create event form (title, description, date/time, location, zoom link)</li>
  //           <li>Edit existing events</li>
  //           <li>Publish/unpublish events</li>
  //           <li>View RSVP list for each event</li>
  //           <li>Delete events</li>
  //         </ul>
  //       </div>

  //       {/* Events table/list */}
  //       {/* Create/Edit event modal */}
  //       {showCreateModal && (
  //         <>
  //           <input type='checkbox' checked readOnly className='modal-toggle' />
  //           <div className='modal modal-open'>
  //             <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
  //               <h3 className='font-bold text-xl text-gray-900 mb-4'>Create New Event</h3>

  //               <form onSubmit={handleCreateEvent} className='space-y-4'>
  //                 {/* Title */}
  //                 <div>
  //                   <label className='block text-sm font-semibold text-gray-700 mb-1'>
  //                     Title <span className='text-red-500'>*</span>
  //                   </label>
  //                   <input
  //                     type='text'
  //                     required
  //                     value={newEvent.title}
  //                     onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
  //                     className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
  //                     placeholder='Enter event title'
  //                   />
  //                 </div>

  //                 {/* Description (ReactQuill) */}
  //                 <div>
  //                   <label className='block text-sm font-semibold text-gray-700 mb-1'>
  //                     Description <span className='text-red-500'>*</span>
  //                   </label>
  //                   <input
  //                     type='text'
  //                     required
  //                     value={newEvent.description}
  //                     onChange={e =>
  //                       setNewEvent(prev => ({
  //                         ...prev,
  //                         description: e.target.value,
  //                       }))
  //                     }
  //                     className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
  //                     placeholder='Enter event description'
  //                   />
  //                   {/* <div style={{ height: '250px' }}>
  //                     <ReactQuill
  //                       theme='snow'
  //                       value={newEvent.description}
  //                       onChange={value => setNewEvent({ ...newEvent, description: value })}
  //                       placeholder='Enter event description...'
  //                       style={{ height: '200px' }}
  //                     />
  //                   </div> */}
  //                 </div>

  //                 {/* Date & Time */}
  //                 <div className='grid grid-cols-2 gap-4'>
  //                   <div>
  //                     <label className='block text-sm font-semibold text-gray-700 mb-1'>
  //                       Start Time *
  //                     </label>
  //                     <input
  //                       type='datetime-local'
  //                       required
  //                       value={newEvent.startTime}
  //                       onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
  //                       className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
  //                     />
  //                   </div>

  //                   <div>
  //                     <label className='block text-sm font-semibold text-gray-700 mb-1'>
  //                       End Time *
  //                     </label>
  //                     <input
  //                       type='datetime-local'
  //                       required
  //                       value={newEvent.endTime}
  //                       onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
  //                       className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
  //                     />
  //                   </div>
  //                 </div>

  //                 {/* Location + Link */}
  //                 <div className='grid grid-cols-2 gap-4'>
  //                   <div>
  //                     <label className='block text-sm font-semibold text-gray-700 mb-1'>
  //                       Location
  //                     </label>
  //                     <input
  //                       type='text'
  //                       value={newEvent.location}
  //                       onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
  //                       className='w-full px-3 py-2 border border-gray-300 rounded-lg'
  //                       placeholder='Physical location (optional)'
  //                     />
  //                   </div>

  //                   <div>
  //                     <label className='block text-sm font-semibold text-gray-700 mb-1'>
  //                       Virtual Link
  //                     </label>
  //                     <input
  //                       type='url'
  //                       value={newEvent.link}
  //                       onChange={e => setNewEvent({ ...newEvent, link: e.target.value })}
  //                       className='w-full px-3 py-2 border border-gray-300 rounded-lg'
  //                       placeholder='Zoom / Google Meet link'
  //                     />
  //                   </div>
  //                 </div>

  //                 {/* Max Attendees */}
  //                 <div>
  //                   <label className='block text-sm font-semibold text-gray-700 mb-1'>
  //                     Max Attendees
  //                   </label>
  //                   <input
  //                     type='number'
  //                     min='1'
  //                     value={newEvent.maxAttendees}
  //                     onChange={e => setNewEvent({ ...newEvent, maxAttendees: e.target.value })}
  //                     className='w-full px-3 py-2 border border-gray-300 rounded-lg'
  //                     placeholder='Leave blank for unlimited'
  //                   />
  //                 </div>

  //                 {/* File Upload */}
  //                 <FileUpload
  //                   attachmentUrls={newEvent.attachmentUrls}
  //                   onFilesChange={files => setNewEvent({ ...newEvent, attachmentUrls: files })}
  //                 />

  //                 {/* Action Buttons */}
  //                 <div className='flex gap-3 pt-4'>
  //                   {/* Publish */}
  //                   <button
  //                     type='button'
  //                     onClick={async () => {
  //                       setNewEvent({ ...newEvent, isPublished: true });
  //                       await handleCreateEvent(new Event('submit') as any);
  //                     }}
  //                     className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-lg font-medium'
  //                   >
  //                     Publish
  //                   </button>

  //                   {/* Save Draft */}
  //                   <button
  //                     type='button'
  //                     onClick={async () => {
  //                       setNewEvent({ ...newEvent, isPublished: false });
  //                       await handleCreateEvent(new Event('submit') as any);
  //                     }}
  //                     className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium'
  //                   >
  //                     Save to Drafts
  //                   </button>

  //                   {/* Cancel */}
  //                   <button
  //                     type='button'
  //                     onClick={() => setShowCreateModal(false)}
  //                     className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
  //                   >
  //                     Cancel
  //                   </button>
  //                 </div>
  //               </form>
  //             </div>

  //             <div
  //               className='modal-backdrop bg-black/30'
  //               onClick={() => setShowCreateModal(false)}
  //             ></div>
  //           </div>
  //         </>
  //       )}
  //     </div>
  //   </div>
  // );
}

export default EventManagementPage;
