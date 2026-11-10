import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDay, formatTimeRange } from '@/api/today-protocol';
import type { ProgrammeDetail } from '@/api/programmes-protocol';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Toast } from '@/components/Toast';
import { addToCalendar } from '@/services/calendar';
import { colors, fonts, radius } from '@/theme';

type Props = { programme: ProgrammeDetail; visible: boolean; onClose: () => void };

/** "Add to your calendar" sheet → OS add-event dialog → "Programme added" toast. */
export function AddToCalendarSheet({ programme, visible, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const when = [formatDay(programme.startsAt), formatTimeRange(programme.startsAt, programme.endsAt)].filter(Boolean).join(' · ');

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const added = await addToCalendar({
        title: programme.title,
        startsAt: programme.startsAt,
        endsAt: programme.endsAt,
        location: programme.venue,
        notes: programme.summary,
      });
      if (added) setToast('Programme added to your calendar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The programme could not be added to your calendar.');
    } finally {
      setBusy(false);
    }
  };

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add to your calendar">
      {toast ? <Toast message={toast} onDismiss={dismissToast} /> : null}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>When & where</Text>
        {when ? <Text style={styles.line}>{when}</Text> : null}
        {programme.venue ? <Text style={styles.line}>{programme.venue}</Text> : null}
      </View>
      {error ? <Notice message={error} /> : null}
      <Button label="Add event" loading={busy} onPress={() => void add()} disabled={!programme.startsAt} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.primarySoft, gap: 6 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, marginBottom: 4 },
  line: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
});
