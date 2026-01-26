/**
 * Mock Data for Help & Support Features
 */

export const HELP_STRINGS = {
  headerTitle: 'Help & FAQ',
  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: '1',
        question: 'How do I start recording a story?',
        answer:
          'Go to the Home tab and tap the large red Record button. You can either choose a topic first or start recording right away. The app will guide you with questions.',
      },
      {
        id: '2',
        question: 'Can I record without internet?',
        answer:
          'Yes! TimeLog works completely offline. Your recordings are saved locally and will sync to the cloud automatically when you have internet connection.',
      },
      {
        id: '3',
        question: 'How does my family listen to my stories?',
        answer:
          'Your family members can link their devices using the Connection Code or QR code in your Settings. Once linked, they can listen to all your stories and leave comments.',
      },
      {
        id: '4',
        question: 'What happens if I delete a story?',
        answer:
          'Deleted stories are moved to the "Deleted Items" folder where they stay for 30 days. You can restore them anytime during this period from Settings > Deleted Items.',
      },
      {
        id: '5',
        question: 'How do I turn off cloud features?',
        answer:
          'Go to Settings > Privacy & Sharing and toggle off "Cloud AI & Sharing". Your local recordings will continue to work, but stories won\'t sync to the cloud.',
      },
      {
        id: '6',
        question: 'How can my family ask me questions?',
        answer:
          'Family members can submit questions from their app. These questions will appear in your Topics tab with a "From Family" tag, so you can record answers directly.',
      },
    ],
  },
  contact: {
    title: 'Still need help?',
    subtitle: 'Our support team is here to assist you.',
    button: 'Contact Support',
    email: 'support@timelog.app',
    subject: 'Help Request',
  },
} as const;

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};
