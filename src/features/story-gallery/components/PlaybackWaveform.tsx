import React, { useEffect, useState, useMemo } from 'react';
import { View, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { ExpoAudioStreamModule, AudioAnalysis } from '@siteed/expo-audio-studio';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';

interface PlaybackWaveformProps {
    uri: string;
    positionMillis: number;
    durationMillis: number;
    barWidth?: number;
    barGap?: number;
    height?: number;
    color?: string;
    progressColor?: string;
}

type AudioAnalysisExtractor = {
    extractAudioAnalysis?: (options: { fileUri: string }) => Promise<AudioAnalysis>;
};

async function extractAudioAnalysis(fileUri: string): Promise<AudioAnalysis> {
    const module = ExpoAudioStreamModule as AudioAnalysisExtractor;
    if (typeof module.extractAudioAnalysis !== 'function') {
        throw new Error('Audio analysis extraction is unavailable in this build.');
    }
    return module.extractAudioAnalysis({ fileUri });
}

/**
 * PlaybackWaveform
 *
 * Renders a full-file waveform using extracted audio analysis data.
 * Features:
 * - Asynchronous extraction using @siteed/expo-audio-studio
 * - Efficient drawing with Skia
 * - Progress coloring using Group clipping
 * - Resampling to fit available width
 */
export function PlaybackWaveform({
    uri,
    positionMillis,
    durationMillis,
    barWidth = 3,
    barGap = 2,
    height = 44,
    color,
    progressColor,
}: PlaybackWaveformProps): JSX.Element {
    const theme = useHeritageTheme();
    const window = useWindowDimensions();
    const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
    const [width, setWidth] = useState(0);
    const [paintReady, setPaintReady] = useState(false);
    const fallbackWidth = Math.max(140, Math.floor(window.width - 64));
    const drawWidth = width > 0 ? width : fallbackWidth;

    const activeColor = progressColor || theme.colors.primary;
    const inactiveColor = color || `${theme.colors.primary}55`;

    const getAnalysisPath = (fileUri: string) => {
        if (fileUri.endsWith('.wav')) {
            return fileUri.replace(/\.wav$/i, '.analysis.json');
        }
        return `${fileUri}.analysis.json`;
    };

    useEffect(() => {
        const timer = setTimeout(() => setPaintReady(true), 90);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadAnalysis() {
            if (!uri) return;

            try {
                const analysisPath = getAnalysisPath(uri);

                // 1) Try cache first
                try {
                    const info = await FileSystem.getInfoAsync(analysisPath);
                    if (info.exists) {
                        const cached = await FileSystem.readAsStringAsync(analysisPath);
                        const parsed = JSON.parse(cached) as AudioAnalysis;
                        if (isMounted) {
                            setAnalysis(parsed);
                        }
                        return;
                    }
                } catch (cacheError) {
                    devLog.warn('[PlaybackWaveform] Cache read failed, falling back to extraction:', cacheError);
                }

                // 2) Extract analysis from file
                const result = await extractAudioAnalysis(uri);

                if (isMounted) {
                    setAnalysis(result);
                }

                // 3) Cache analysis for next time
                try {
                    await FileSystem.writeAsStringAsync(analysisPath, JSON.stringify(result));
                } catch (writeError) {
                    devLog.warn('[PlaybackWaveform] Cache write failed:', writeError);
                }
            } catch (error) {
                devLog.error('[PlaybackWaveform] Failed to load analysis:', error);
            } finally {
                // no-op; component keeps fallback waveform while analysis loads
            }
        }

        loadAnalysis();

        return () => {
            isMounted = false;
        };
    }, [uri]);

    const handleLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
    };

    const path = useMemo(() => {
        if (!analysis || drawWidth === 0) return null;

        const dataPoints = analysis.dataPoints;
        if (dataPoints.length === 0) return null;

        const totalBars = Math.floor(drawWidth / (barWidth + barGap));
        const samplesPerBar = Math.floor(dataPoints.length / totalBars);

        // Safety check
        if (samplesPerBar <= 0) {
            // Not enough resolution or too few points, just draw what we can
            return null;
        }

        const skPath = Skia.Path.Make();

        for (let i = 0; i < totalBars; i++) {
            let sum = 0;
            const startIdx = i * samplesPerBar;
            const endIdx = Math.min(startIdx + samplesPerBar, dataPoints.length);

            let count = 0;
            for (let j = startIdx; j < endIdx; j++) {
                // Use amplitude if available, otherwise fallback to dB converted to linear
                // @siteed/expo-audio-studio typically provides `amplitude` (0-1) or `dB`
                // We'll check the type at runtime or assume standard AudioAnalysis structure
                const point = dataPoints[j];
                const amp = typeof point.amplitude === 'number' ? point.amplitude : Math.pow(10, point.dB / 20);
                sum += amp;
                count++;
            }

            const avgAmp = count > 0 ? sum / count : 0;

            // Visual scaling (gamma correction-ish) to make waveform look better
            const visualAmp = Math.pow(avgAmp, 0.7);

            const barHeight = Math.max(2, visualAmp * height * 0.9); // 90% max height
            const x = i * (barWidth + barGap);
            const y = (height - barHeight) / 2;

            skPath.addRRect(
                Skia.RRectXY(
                    Skia.XYWHRect(x, y, barWidth, barHeight),
                    barWidth / 2,
                    barWidth / 2
                )
            );
        }

        return skPath;
    }, [analysis, drawWidth, barWidth, barGap, height]);

    const fallbackPath = useMemo(() => {
        if (drawWidth <= 0) return null;

        const skPath = Skia.Path.Make();
        const totalBars = Math.max(28, Math.floor(drawWidth / (barWidth + barGap)));
        const centerY = height / 2;

        // Deterministic pseudo-wave: always visible even when native analysis is unavailable.
        for (let i = 0; i < totalBars; i++) {
            const x = i * (barWidth + barGap);
            const wave =
                Math.sin(i * 0.48) * 0.45 +
                Math.cos(i * 0.18) * 0.35 +
                Math.sin(i * 0.09) * 0.2;
            const normalized = Math.min(1, Math.max(0, Math.abs(wave)));
            const barHeight = Math.max(2, normalized * height * 0.58);
            const y = centerY - barHeight / 2;

            skPath.addRRect(
                Skia.RRectXY(
                    Skia.XYWHRect(x, y, barWidth, barHeight),
                    barWidth / 2,
                    barWidth / 2
                )
            );
        }

        return skPath;
    }, [drawWidth, height, barWidth, barGap]);

    const drawPath = path ?? fallbackPath;

    const progressRect = useMemo(() => {
        if (drawWidth === 0 || !durationMillis || durationMillis <= 0) return { x: 0, y: 0, width: 0, height };

        const progress = Math.min(1, Math.max(0, positionMillis / durationMillis));
        return {
            x: 0,
            y: 0,
            width: drawWidth * progress,
            height
        };
    }, [drawWidth, positionMillis, durationMillis, height]);

    return (
        <View
            style={{ height, width: '100%', overflow: 'hidden', backgroundColor: 'transparent' }}
            onLayout={handleLayout}>
            {paintReady && drawPath && (
                <Canvas style={{ width: '100%', height, backgroundColor: 'transparent' }}>
                    {/* Layer 1: Inactive Color (Background) */}
                    <Path path={drawPath} color={inactiveColor} />

                    {/* Layer 2: Active Color (Foreground), clipped to progress */}
                    <Group>
                        {/* Clip the active group to the progress rectangle */}
                        {/* Note: Skia declarative API uses `clip` prop on Group or nested shapes. 
                 Or use `<Rect clip />` which is deprecated/removed in some versions.
                 Safe bet: Group with clip prop.
             */}
                        <Group clip={Skia.XYWHRect(progressRect.x, progressRect.y, progressRect.width, progressRect.height)}>
                            <Path path={drawPath} color={activeColor} />
                        </Group>
                    </Group>
                </Canvas>
            )}
        </View>
    );
}
