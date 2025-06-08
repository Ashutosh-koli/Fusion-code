let eventsDB = [];

export default [
  {
    url: '/api/events',
    method: 'get',
    response: () => eventsDB,
  },
  {
    url: '/api/events',
    method: 'post',
    response: ({ body }) => {
      const newEvent = JSON.parse(body);
      eventsDB.push(newEvent);
      return newEvent;
    },
  },
];
