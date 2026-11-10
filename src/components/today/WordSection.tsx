import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatDuration, type Devotional, type Sermon } from '@/api/word-protocol';
import { colors, fonts } from '@/theme';

// Colours from the Today design ("Make room for the Word").
const CARD_BG = '#F3F1FD';
const CARD_BORDER = '#CFC8F3';
const THUMB_BG = '#E3DEFA';
const ACCENT = '#5B4BB7';
const CARD_WIDTH = 268;

type Props = {
  sermons: Sermon[];
  devotional: Devotional | null;
  onPlay: (sermon: Sermon) => void;
  onOpenDevotional: () => void;
};

/** Horizontal carousel: sermons (GET /media) then today's devotional (GET /word/today). */
export function WordSection({ sermons, devotional, onPlay, onOpenDevotional }: Props) {
  if (sermons.length === 0 && !devotional) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Bleed to the screen edges so the next card peeks in, as in the design.
      style={styles.bleed}
      contentContainerStyle={styles.row}
      snapToInterval={CARD_WIDTH + 14}
      decelerationRate="fast"
    >
      {sermons.map((s) => {
        const duration = formatDuration(s.durationSeconds);
        return (
          <Pressable
            key={s.slug}
            onPress={() => onPlay(s)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${s.title}${s.speaker ? ` by ${s.speaker}` : ''}${duration ? `, ${duration}` : ''}`}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            {s.coverImageUrl ? (
              <Image source={{ uri: s.coverImageUrl }} style={styles.thumb} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.thumb, styles.thumbFallback]}>
                <MaterialCommunityIcons name="microphone-variant" size={34} color={ACCENT} />
              </View>
            )}
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={2}>
                {s.title}
              </Text>
              {s.speaker ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {s.speaker}
                </Text>
              ) : null}
              {duration ? (
                <View style={styles.durationRow}>
                  <Ionicons name="time" size={15} color={colors.ink} />
                  <Text style={styles.duration}>{duration}</Text>
                </View>
              ) : null}
              <View style={styles.play}>
                <Ionicons name="play-circle" size={18} color={ACCENT} />
                <Text style={styles.playText}>Play</Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      {devotional ? (
        <Pressable
          onPress={onOpenDevotional}
          accessibilityRole="button"
          accessibilityLabel={`Daily devotion: ${devotional.title}`}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={[styles.thumb, styles.thumbFallback]}>
            <MaterialCommunityIcons name="book-open-outline" size={38} color={ACCENT} />
          </View>
          <View style={styles.body}>
            <Text style={styles.kicker}>Daily devotion</Text>
            <Text style={styles.title} numberOfLines={2}>
              {devotional.title}
            </Text>
            {devotional.excerpt ? (
              <Text style={styles.quote} numberOfLines={3}>
                “{devotional.excerpt}”
              </Text>
            ) : devotional.scriptureReference ? (
              <Text style={styles.meta}>{devotional.scriptureReference}</Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -20 },
  row: { paddingHorizontal: 20, gap: 14 },
  card: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  pressed: { opacity: 0.85 },
  thumb: { width: 82, height: 104, borderRadius: 10, backgroundColor: THUMB_BG },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 5, justifyContent: 'center' },
  kicker: { fontFamily: fonts.regular, fontStyle: 'italic', fontSize: 12.5, color: colors.text },
  title: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.text },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duration: { fontFamily: fonts.regular, fontStyle: 'italic', fontSize: 13, color: colors.ink },
  quote: { fontFamily: fonts.regular, fontStyle: 'italic', fontSize: 12.5, lineHeight: 17, color: colors.text },
  play: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  playText: { fontFamily: fonts.medium, fontSize: 15, color: ACCENT },
});
