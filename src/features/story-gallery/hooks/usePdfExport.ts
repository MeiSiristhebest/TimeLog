import { useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { EN_COPY } from '@/features/app/copy/en';

export interface ExportStory {
  title: string;
  transcript: string;
  date: string;
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const generateHtml = (stories: ExportStory[]) => {
    const storyHtmlItems = stories.map((story) => `
      <div style="page-break-after: always; margin-bottom: 2rem;">
        <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 10px;">${story.title}</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">${story.date}</p>
        <div style="font-size: 16px; line-height: 1.8; color: #334155;">
          ${story.transcript.split('\n').map(p => `<p>${p}</p>`).join('')}
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${EN_COPY.timeCapsule.memories}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          h1 {
            text-align: center;
            font-size: 36px;
            margin-bottom: 60px;
            color: #0f172a;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>${EN_COPY.timeCapsule.label}</h1>
          <p style="text-align: center; color: #64748b; margin-bottom: 80px;">
            Export Date: ${new Date().toLocaleDateString('en-US')}
          </p>
        </div>
        ${storyHtmlItems}
      </body>
      </html>
    `;
  };

  const exportPdf = async (rawStories: ExportStory[], shouldPolish: boolean = true) => {
    setIsExporting(true);
    let storiesToExport = [...rawStories];

    try {
      // 1. Ask AI to polish if needed
      if (shouldPolish) {
        storiesToExport = await Promise.all(
          rawStories.map(async (story) => {
            if (!story.transcript) return story;

            try {
              const { data, error } = await supabase.functions.invoke('polish-text', {
                body: { text: story.transcript }
              });

              if (error) throw error;
              if (data?.polishedText) {
                return { ...story, transcript: data.polishedText };
              }
            } catch (err) {
              devLog.warn('[usePdfExport] Failed to polish text for story:', story.title, err);
            }
            return story; // Fallback to unpolished if it fails
          })
        );
      }

      // 2. Generate PDF
      const html = generateHtml(storiesToExport);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // 3. Share the PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: EN_COPY.timeCapsule.exportTitle,
          UTI: 'com.adobe.pdf' // iOS Uniform Type Identifier
        });
      } else {
        devLog.warn('[usePdfExport] Sharing not available on this device');
      }

    } catch (e) {
      devLog.error('[usePdfExport] Export failed:', e);
      throw e;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPdf, isExporting };
}
