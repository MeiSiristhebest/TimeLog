import { useMemo } from 'react';
import { asc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { transcriptSegments } from '@/db/schema';

export type TranscriptSpeaker = 'user' | 'agent' | 'unknown';

export type TranscriptEntry = {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
};

type UseStoryTranscriptResult = {
  transcript: string;
  entries: TranscriptEntry[];
  isLoading: boolean;
};

function parseEditedTranscript(raw: string): TranscriptEntry[] {
  return raw
    .split(/\n\s*\n/g)
    .map((chunk, index) => ({ chunk: chunk.trim(), index }))
    .filter((item) => item.chunk.length > 0)
    .map(({ chunk, index }) => {
      const match = chunk.match(/^(AI|Assistant|Agent|You|User|Human)\s*[:：]\s*(.+)$/i);
      if (!match) {
        return {
          id: `edited-${index}`,
          speaker: 'unknown' as const,
          text: chunk,
        };
      }

      const label = match[1].toLowerCase();
      const speaker =
        label === 'ai' || label === 'assistant' || label === 'agent' ? 'agent' : 'user';

      return {
        id: `edited-${index}`,
        speaker,
        text: match[2].trim(),
      };
    });
}

export function useStoryTranscript(
  storyId: string,
  editedTranscript?: string | null
): UseStoryTranscriptResult {
  const { data: segments } = useLiveQuery(
    db
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.storyId, storyId))
      .orderBy(asc(transcriptSegments.segmentIndex))
  );

  const entries = useMemo<TranscriptEntry[]>(() => {
    const edited = editedTranscript?.trim();
    if (edited) {
      const parsedEdited = parseEditedTranscript(edited);
      return parsedEdited.length > 0
        ? parsedEdited
        : [
            {
              id: 'edited-single',
              speaker: 'unknown',
              text: edited,
            },
          ];
    }

    if (!segments || segments.length === 0) {
      return [];
    }

    const finalSegments = segments.filter((segment) => segment.isFinal && segment.text.trim().length > 0);
    const source =
      finalSegments.length > 0
        ? finalSegments
        : segments.filter((segment) => segment.text.trim().length > 0);

    return source.map((segment) => ({
      id: segment.id,
      speaker: segment.speaker,
      text: segment.text.trim(),
    }));
  }, [editedTranscript, segments]);

  const transcript = useMemo(
    () => entries.map((entry) => entry.text).join('\n\n').trim(),
    [entries]
  );

  return {
    transcript,
    entries,
    isLoading: segments === undefined,
  };
}
