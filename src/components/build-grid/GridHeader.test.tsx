// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridHeader } from './GridHeader';
import type { GridField } from './useGridState';

const sampleFields: GridField[] = [
  {
    id: 'sf_1',
    ref: 'r1',
    name: 'Date',
    type: 'date',
    config: { fieldType: 'date' },
    sortOrder: 0,
  },
  {
    id: 'sf_2',
    ref: 'r2',
    name: 'Notes',
    type: 'text',
    config: { fieldType: 'text', maxLength: 200 },
    sortOrder: 1,
  },
];

function renderHeader(overrides: Partial<React.ComponentProps<typeof GridHeader>> = {}) {
  return render(
    <GridHeader
      fields={sampleFields}
      onEditField={vi.fn()}
      onAddField={vi.fn()}
      onMoveField={vi.fn()}
      onResize={vi.fn()}
      onResetWidth={vi.fn()}
      {...overrides}
    />,
  );
}

describe('<GridHeader />', () => {
  it('renders exactly one "Add field" entry point in the trailing cell', () => {
    renderHeader();
    const addButtons = screen.getAllByRole('button', { name: /^add field$/i });
    expect(addButtons).toHaveLength(1);
    expect(addButtons[0]).toHaveTextContent(/Add field/i);
  });

  it('does not render an "Add column" button anywhere', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: /add column/i })).toBeNull();
  });

  it('fires onAddField when the trailing link is clicked', () => {
    const onAddField = vi.fn();
    renderHeader({ onAddField });
    screen.getByRole('button', { name: /^add field$/i }).click();
    expect(onAddField).toHaveBeenCalledTimes(1);
  });

  it('renders an inline pencil edit button per field with the field name in the aria-label', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /edit field "Date"/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit field "Notes"/i })).toBeInTheDocument();
  });

  it('fires onEditField with the matching field when the pencil is clicked', () => {
    const onEditField = vi.fn();
    renderHeader({ onEditField });
    screen.getByRole('button', { name: /edit field "Notes"/i }).click();
    expect(onEditField).toHaveBeenCalledTimes(1);
    expect(onEditField).toHaveBeenCalledWith(sampleFields[1]);
  });

  it('does NOT render the old chevron column-header menu (replaced by inline pencil)', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: /move to start/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /move to end/i })).toBeNull();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Cmd/Ctrl + ArrowRight on the focused pencil moves the field right (fromIdx, toIdx)', () => {
    const onMoveField = vi.fn();
    renderHeader({ onMoveField });
    const dateEdit = screen.getByRole('button', { name: /edit field "Date"/i });
    fireEvent.keyDown(dateEdit, { key: 'ArrowRight', metaKey: true });
    expect(onMoveField).toHaveBeenCalledTimes(1);
    expect(onMoveField).toHaveBeenCalledWith(0, 1);
  });

  it('Cmd/Ctrl + ArrowLeft on the focused pencil moves the field left (fromIdx, toIdx)', () => {
    const onMoveField = vi.fn();
    renderHeader({ onMoveField });
    const notesEdit = screen.getByRole('button', { name: /edit field "Notes"/i });
    fireEvent.keyDown(notesEdit, { key: 'ArrowLeft', ctrlKey: true });
    expect(onMoveField).toHaveBeenCalledTimes(1);
    expect(onMoveField).toHaveBeenCalledWith(1, 0);
  });

  it('Cmd/Ctrl + ArrowLeft on the first field is a no-op', () => {
    const onMoveField = vi.fn();
    renderHeader({ onMoveField });
    const dateEdit = screen.getByRole('button', { name: /edit field "Date"/i });
    fireEvent.keyDown(dateEdit, { key: 'ArrowLeft', metaKey: true });
    expect(onMoveField).not.toHaveBeenCalled();
  });

  it('Cmd/Ctrl + ArrowRight on the last field is a no-op', () => {
    const onMoveField = vi.fn();
    renderHeader({ onMoveField });
    const notesEdit = screen.getByRole('button', { name: /edit field "Notes"/i });
    fireEvent.keyDown(notesEdit, { key: 'ArrowRight', metaKey: true });
    expect(onMoveField).not.toHaveBeenCalled();
  });

  it('plain ArrowRight (no modifier) on the pencil does not move the field', () => {
    const onMoveField = vi.fn();
    renderHeader({ onMoveField });
    fireEvent.keyDown(screen.getByRole('button', { name: /edit field "Date"/i }), { key: 'ArrowRight' });
    expect(onMoveField).not.toHaveBeenCalled();
  });

  it('renders a drag-source span (draggable) per field with descriptive aria-label', () => {
    renderHeader();
    expect(screen.getByLabelText(/drag to reorder field "Date"/i)).toHaveAttribute('draggable', 'true');
    expect(screen.getByLabelText(/drag to reorder field "Notes"/i)).toHaveAttribute('draggable', 'true');
  });

  it('calls onAnnounce when a keyboard reorder fires', () => {
    const onAnnounce = vi.fn();
    renderHeader({ onAnnounce });
    fireEvent.keyDown(screen.getByRole('button', { name: /edit field "Date"/i }), {
      key: 'ArrowRight',
      metaKey: true,
    });
    expect(onAnnounce).toHaveBeenCalledTimes(1);
    expect(onAnnounce).toHaveBeenCalledWith(expect.stringMatching(/Moved field "Date" to position 2 of 2/));
  });
});
