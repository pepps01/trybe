import { Platform } from 'react-native';

type CalendarEvent = {
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  notes?: string | null;
};

/**
 * Opens the phone's own "new event" screen pre-filled with the programme.
 * Uses the OS dialog, so Android needs no calendar permission (iOS asks for
 * write-only access). Resolves true when the event was (probably) added:
 * iOS reports "saved"; Android can't tell, so any completed dialog counts.
 */
export async function addToCalendar(event: CalendarEvent): Promise<boolean> {
  if (!event.startsAt) throw new Error('This programme has no start time yet.');
  let Calendar: typeof import('expo-calendar/legacy');
  try {
    Calendar = await import('expo-calendar/legacy');
  } catch {
    throw new Error('Calendar isn’t available in this build of the app.');
  }

  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 60 * 60 * 1000);

  if (Platform.OS === 'ios') {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) throw new Error('Allow calendar access in Settings to add this programme.');
  }

  const result = await Calendar.createEventInCalendarAsync({
    title: event.title,
    startDate: start,
    endDate: end,
    location: event.location ?? undefined,
    notes: event.notes ?? undefined,
  });
  return Platform.OS === 'ios' ? result.action === 'saved' : result.action !== 'canceled';
}
