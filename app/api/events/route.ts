// http://localhost:3030/api/events/
export async function GET(request: Request): Promise<Response> {
  const events = [
    { id: 1, name: 'Event 1' },
    { id: 2, name: 'Event 2' },
    { id: 3, name: 'Event 3' },
  ]

  return new Response(JSON.stringify(events))
}
