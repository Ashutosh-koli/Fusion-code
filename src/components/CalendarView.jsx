import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarView() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Request permission once on mount
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    fetch('/api/events')
      .then((r) => r.json())
      .then((fetchedEvents) => {
        setEvents(fetchedEvents);
        scheduleNotifications(fetchedEvents);
      });
  }, []);

  const scheduleNotifications = (events) => {
    events.forEach((event) => {
      const eventTime = new Date(event.start);
      const now = new Date();
      const timeDifference = eventTime - now;

      if (timeDifference > 0) {
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification(`Reminder: ${event.title}`, {
              body: `Your event "${event.title}" is starting now.`,
            });
          }
        }, timeDifference);
      }
    });
  };

  const handleDateSelect = (selectInfo) => {
    const input = prompt('Enter title and optional time (e.g. "Meeting 3p")');
    if (!input || !input.trim()) return;

    const parts = input.trim().split(/\s+/);
    let timeStr = parts.slice(-1)[0];
    let title = input.trim();

    if (!/^\d{1,2}(:\d{2})?\s*(am|pm|AM|PM|a|p|A|P)$/.test(timeStr)) {
      timeStr = '';
    } else {
      title = parts.slice(0, -1).join(' ') || timeStr;
    }

    let { startStr } = selectInfo;
    let { endStr } = selectInfo;
    let allDay = selectInfo.allDay;

    if (timeStr) {
      const t = timeStr.trim().toLowerCase().replace(/([ap])m?$/, '$1');
      const [, hh, mm = '00', ap] = t.match(/^(\d{1,2})(?::(\d{2}))?([ap])$/);
      let hr = parseInt(hh);
      if (ap === 'p' && hr !== 12) hr += 12;
      if (ap === 'a' && hr === 12) hr = 0;
      const iso = `${startStr}T${String(hr).padStart(2, '0')}:${mm}:00`;
      startStr = iso;
      const dt = new Date(iso);
      dt.setHours(dt.getHours() + 1);
      endStr = dt.toISOString().slice(0, 19);
      allDay = false;
    }

    const newEvent = {
      id: Date.now().toString(),
      title,
      start: startStr,
      end: endStr,
      allDay,
    };

    setEvents((prev) => [...prev, newEvent]);
    scheduleNotifications([newEvent]);
    selectInfo.view.calendar.unselect();
  };

  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        height="auto"
        editable={true}
        selectable={true}
        selectMirror={true}
        displayEventTime={true}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        select={handleDateSelect}
        eventClick={(ci) => {
          if (window.confirm(`Delete "${ci.event.title}"?`)) {
            setEvents((prev) => prev.filter((e) => e.id !== ci.event.id));
          }
        }}
      />
    </div>
  );
}
