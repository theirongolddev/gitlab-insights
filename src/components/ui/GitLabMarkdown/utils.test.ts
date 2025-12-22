import { describe, it, expect } from 'vitest';
import { extractProjectPath, extractInstanceUrl } from './utils';

describe('extractProjectPath', () => {
  it('extracts from standard issue URL', () => {
    expect(
      extractProjectPath('https://gitlab.com/group/project/-/issues/123')
    ).toBe('group/project');
  });

  it('extracts from nested group URL', () => {
    expect(
      extractProjectPath(
        'https://gitlab.com/org/team/project/-/merge_requests/456'
      )
    ).toBe('org/team/project');
  });

  it('extracts from deeply nested URL', () => {
    expect(
      extractProjectPath('https://gitlab.com/a/b/c/d/project/-/issues/1')
    ).toBe('a/b/c/d/project');
  });

  it('handles commit URLs', () => {
    expect(
      extractProjectPath('https://gitlab.com/group/project/-/commit/abc123')
    ).toBe('group/project');
  });

  it('handles pipeline URLs', () => {
    expect(
      extractProjectPath('https://gitlab.com/group/project/-/pipelines/789')
    ).toBe('group/project');
  });

  it('returns null for empty string', () => {
    expect(extractProjectPath('')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(extractProjectPath('not-a-url')).toBeNull();
  });

  it('handles self-hosted GitLab', () => {
    expect(
      extractProjectPath('https://git.company.com/internal/tools/-/issues/42')
    ).toBe('internal/tools');
  });

  it('handles blob URLs', () => {
    expect(
      extractProjectPath(
        'https://gitlab.com/group/project/-/blob/main/README.md'
      )
    ).toBe('group/project');
  });

  it('handles tree URLs', () => {
    expect(
      extractProjectPath('https://gitlab.com/group/project/-/tree/main/src')
    ).toBe('group/project');
  });
});

describe('extractInstanceUrl', () => {
  it('extracts from gitlab.com URL', () => {
    expect(
      extractInstanceUrl('https://gitlab.com/group/project/-/issues/123')
    ).toBe('https://gitlab.com');
  });

  it('extracts from self-hosted URL', () => {
    expect(
      extractInstanceUrl('https://git.company.com/group/project/-/issues/123')
    ).toBe('https://git.company.com');
  });

  it('handles http URLs', () => {
    expect(
      extractInstanceUrl('http://localhost:3000/group/project/-/issues/123')
    ).toBe('http://localhost:3000');
  });

  it('returns null for empty string', () => {
    expect(extractInstanceUrl('')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(extractInstanceUrl('not-a-url')).toBeNull();
  });
});
