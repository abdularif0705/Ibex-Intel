import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignalsDashboard } from '@/components/SignalsDashboard';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: '1',
                company_name: 'Acme Corp',
                signal_type: 'erp_implementation',
                confidence_score: 0.85,
                source_type: 'linkedin',
                detected_at: new Date().toISOString(),
                keywords: ['SAP S/4HANA', 'cutover', 'go-live']
              }
            ],
            error: null
          }))
        }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { user: { id: 'test-user' } } },
        error: null
      }))
    }
  }
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('SignalsDashboard Component', () => {
  it('should render the dashboard without crashing', () => {
    const { container } = renderWithProviders(<SignalsDashboard />);
    expect(container).toBeTruthy();
  });

  it('should be in the document', () => {
    const { container } = renderWithProviders(<SignalsDashboard />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
