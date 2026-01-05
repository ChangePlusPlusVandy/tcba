// import { useState } from 'react';
// Import event hooks
// import { useEvents, useMyRSVPs } from '../../../hooks/queries/useEvents';
// import { useRSVP } from '../../../hooks/mutations/useEvents';

export function EventsPage() {
  // const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Fetch upcoming events with useEvents({ status: 'PUBLISHED', upcoming: true })
  // Handle RSVP submission with useRSVP()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>

      <div className="alert alert-info">
        <span>Implement events page</span>
        <ul className="list-disc ml-6 mt-2">
          <li>Display upcoming events in cards/list</li>
          <li>Show event details (title, date, location, zoom link)</li>
          <li>Display RSVP count and max attendees</li>
          <li>Add RSVP buttons (Going, Maybe, Not Going)</li>
          <li>Show event details modal</li>
        </ul>
      </div>

      {/* Event cards grid */}
      {/* Event details modal */}
    </div>
  );
}
