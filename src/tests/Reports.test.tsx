import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Reports from '../pages/admin/Reports';
import { dbApi } from '../lib/api';

// Mock the dbApi
vi.mock('../lib/api', () => ({
  dbApi: {
    getReports: vi.fn(),
  },
}));

describe('Reports Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('displays loading state initially', () => {
    (dbApi.getReports as any).mockResolvedValueOnce([]);
    render(<Reports />);
    expect(screen.getByText('Security Reports')).toBeInTheDocument();
  });

  it('renders reports data successfully', async () => {
    const mockReports = [
      {
        id: '1',
        title: 'Weekly Threat Assessment',
        report_type: 'weekly',
        status: 'ready',
        summary: 'Test summary',
        metrics: {},
        date_from: '2026-03-01T00:00:00.000Z',
        date_to: '2026-03-07T00:00:00.000Z',
      }
    ];

    (dbApi.getReports as any).mockResolvedValueOnce(mockReports);

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Threat Assessment')).toBeInTheDocument();
      expect(screen.getByText('Test summary')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument(); 
    });
  });

  it('renders empty state when no reports', async () => {
    (dbApi.getReports as any).mockResolvedValueOnce([]);

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('No reports generated yet.')).toBeInTheDocument();
    });
  });
});
