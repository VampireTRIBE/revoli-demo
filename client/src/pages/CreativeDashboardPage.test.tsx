import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreativeSlot } from './CreativeDashboardPage';

describe('Creative slot runtime regression', () => {
  it('renders the Creative source context without a ReferenceError', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <CreativeSlot number={1} title="Output" subtitle="Eligible content" client="Union Coop" year={2026} month={8}>
          <p>Verified Creative content</p>
        </CreativeSlot>
      </QueryClientProvider>,
    );
    expect(markup).toContain('Output');
    expect(markup).toContain('What was published');
    expect(markup).toContain('Verified Creative content');
  });
});
