import { createLazyComponent } from '@/lib/lazyLoading';

export const LazyTimelineLayout = createLazyComponent(
  () => import('./TimelineLayout'),
  { fallback: 'skeleton' }
);
