import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ProjectList } from './ProjectList';
import { Project } from '../../types/project';

describe('ProjectList Component', () => {
  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Test Project 1',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      project_manager: 'John Doe',
      documentation_links: ['https://example.com/docs'],
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Test Project 2',
      start_date: '2025-02-01',
      end_date: '2025-11-30',
      project_manager: 'Jane Smith',
      documentation_links: ['https://example.com/docs2'],
      status: 'archived',
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z'
    }
  ];

  const defaultProps = {
    projects: mockProjects,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onArchive: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders project list with projects', () => {
    render(
      <ProjectList {...defaultProps} projects={mockProjects} />
    );

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    render(
      <ProjectList {...defaultProps} />
    );

    const editButtons = screen.getAllByRole('button', { name: /bearbeiten/i });
    fireEvent.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockProjects[0]);
  });

  test('calls onDelete when delete button is clicked', () => {
    render(
      <ProjectList {...defaultProps} />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /löschen/i });
    fireEvent.click(deleteButtons[0]);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockProjects[0].id);
  });

  test('calls onArchive when archive button is clicked', () => {
    render(
      <ProjectList {...defaultProps} />
    );

    const archiveButtons = screen.getAllByRole('button', { name: /archivieren/i });
    fireEvent.click(archiveButtons[0]);

    expect(defaultProps.onArchive).toHaveBeenCalledWith(mockProjects[0].id);
  });

  test('displays "No projects found" when projects array is empty', () => {
    render(
      <ProjectList {...defaultProps} projects={[]} />
    );

    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });
});
