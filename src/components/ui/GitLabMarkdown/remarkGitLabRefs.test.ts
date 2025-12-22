import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkGitLabRefs } from './remarkGitLabRefs';

const GITLAB_URL = 'https://gitlab.example.com';
const PROJECT_PATH = 'mygroup/myproject';

async function processMarkdown(
  input: string,
  options: { projectPath?: string | null } = {}
): Promise<string> {
  // Use 'in' check to differentiate between "not provided" and "explicitly null"
  const projectPath =
    'projectPath' in options ? options.projectPath : PROJECT_PATH;

  const result = await unified()
    .use(remarkParse)
    .use(remarkGitLabRefs, {
      gitlabInstanceUrl: GITLAB_URL,
      projectPath,
    })
    .use(remarkStringify)
    .process(input);
  return String(result);
}

describe('remarkGitLabRefs', () => {
  describe('Issue references (#123)', () => {
    it('transforms #123 to issue link', async () => {
      const result = await processMarkdown('Fixed #123');
      expect(result).toContain(
        '[#123](https://gitlab.example.com/mygroup/myproject/-/issues/123)'
      );
    });

    it('handles multiple issue refs', async () => {
      const result = await processMarkdown('Fixed #1, #2 and #3');
      expect(result).toContain('/-/issues/1)');
      expect(result).toContain('/-/issues/2)');
      expect(result).toContain('/-/issues/3)');
    });

    it('does not transform #123 without projectPath', async () => {
      const result = await processMarkdown('See #123', { projectPath: null });
      expect(result).not.toContain('/-/issues/');
      expect(result).toContain('#123');
    });

    it('handles issue ref at start of line', async () => {
      const result = await processMarkdown('#42 is the answer');
      expect(result).toContain('[#42]');
      expect(result).toContain('/-/issues/42)');
    });

    it('handles issue ref at end of line', async () => {
      const result = await processMarkdown('See issue #99');
      expect(result).toContain('[#99]');
    });
  });

  describe('Merge request references (!456)', () => {
    it('transforms !456 to MR link', async () => {
      const result = await processMarkdown('See !456');
      expect(result).toContain(
        '[!456](https://gitlab.example.com/mygroup/myproject/-/merge_requests/456)'
      );
    });

    it('handles MR ref at start of text', async () => {
      const result = await processMarkdown('!100 merged');
      expect(result).toContain('[!100]');
      expect(result).toContain('/-/merge_requests/100)');
    });

    it('does not transform !456 without projectPath', async () => {
      const result = await processMarkdown('See !456', { projectPath: null });
      expect(result).not.toContain('/-/merge_requests/');
      expect(result).toContain('!456');
    });
  });

  describe('User mentions (@username)', () => {
    it('transforms @username to profile link', async () => {
      const result = await processMarkdown('Thanks @johndoe');
      expect(result).toContain(
        '[@johndoe](https://gitlab.example.com/johndoe)'
      );
    });

    it('handles usernames with dots and hyphens', async () => {
      const result = await processMarkdown('CC @john.doe-123');
      expect(result).toContain(
        '[@john.doe-123](https://gitlab.example.com/john.doe-123)'
      );
    });

    it('does not match email addresses', async () => {
      const result = await processMarkdown('Email user@example.com');
      expect(result).not.toContain('[@example.com]');
      expect(result).toContain('user@example.com');
    });

    it('works even without projectPath', async () => {
      const result = await processMarkdown('Thanks @alice', {
        projectPath: null,
      });
      expect(result).toContain('[@alice](https://gitlab.example.com/alice)');
    });

    it('handles mention at start of text', async () => {
      const result = await processMarkdown('@admin please review');
      expect(result).toContain('[@admin]');
    });

    it('handles multiple mentions', async () => {
      const result = await processMarkdown('@alice and @bob');
      expect(result).toContain('[@alice]');
      expect(result).toContain('[@bob]');
    });
  });

  describe('Cross-project references', () => {
    it('transforms group/project#123', async () => {
      const result = await processMarkdown('See other/repo#99');
      expect(result).toContain(
        '[other/repo#99](https://gitlab.example.com/other/repo/-/issues/99)'
      );
    });

    it('transforms nested group/sub/project#123', async () => {
      const result = await processMarkdown('See org/team/project#42');
      expect(result).toContain(
        '[org/team/project#42](https://gitlab.example.com/org/team/project/-/issues/42)'
      );
    });

    it('transforms deeply nested a/b/c/d/project#123', async () => {
      const result = await processMarkdown('See a/b/c/d/project#1');
      expect(result).toContain(
        '[a/b/c/d/project#1](https://gitlab.example.com/a/b/c/d/project/-/issues/1)'
      );
    });

    it('transforms cross-project MR group/project!456', async () => {
      const result = await processMarkdown('See other/repo!88');
      expect(result).toContain(
        '[other/repo!88](https://gitlab.example.com/other/repo/-/merge_requests/88)'
      );
    });

    it('works without projectPath for cross-project refs', async () => {
      const result = await processMarkdown('See other/repo#5', {
        projectPath: null,
      });
      expect(result).toContain('[other/repo#5]');
      expect(result).toContain('/-/issues/5)');
    });
  });

  describe('Edge cases - false positives to avoid', () => {
    it('does not transform color codes #fff', async () => {
      const result = await processMarkdown('Color is #fff');
      expect(result).not.toContain('/-/issues/');
      expect(result).toContain('#fff');
    });

    it('does not transform #abc123 (hex color)', async () => {
      const result = await processMarkdown('Color #abc123');
      expect(result).not.toContain('/-/issues/');
      expect(result).toContain('#abc123');
    });

    it('does not transform #L123 line references', async () => {
      const result = await processMarkdown('See file.ts#L123');
      expect(result).not.toContain('/-/issues/');
    });

    it('preserves URLs with anchors', async () => {
      const result = await processMarkdown('See page#section');
      // This shouldn't be transformed as it looks like an anchor
      expect(result).not.toContain('/-/issues/');
    });
  });

  describe('Mixed content', () => {
    it('handles multiple ref types in one line', async () => {
      const result = await processMarkdown('Fixed #1 by @dev in !2');
      expect(result).toContain('/-/issues/1)');
      expect(result).toContain('/dev)');
      expect(result).toContain('/-/merge_requests/2)');
    });

    it('preserves surrounding text', async () => {
      const result = await processMarkdown('Before #123 after');
      expect(result).toContain('Before');
      expect(result).toContain('after');
    });

    it('handles refs at start and end', async () => {
      const result = await processMarkdown('#1 text !2');
      expect(result).toContain('[#1]');
      expect(result).toContain('[!2]');
    });

    it('handles refs with punctuation', async () => {
      const result = await processMarkdown('See #1, #2.');
      expect(result).toContain('[#1]');
      expect(result).toContain('[#2]');
    });
  });

  describe('Empty and invalid input', () => {
    it('handles empty content', async () => {
      const result = await processMarkdown('');
      expect(result.trim()).toBe('');
    });

    it('handles content with no refs', async () => {
      const result = await processMarkdown('Just plain text');
      expect(result.trim()).toBe('Just plain text');
    });

    it('handles whitespace-only content', async () => {
      const result = await processMarkdown('   \n   ');
      expect(result.trim()).toBe('');
    });
  });

  describe('URL normalization', () => {
    it('handles trailing slash in gitlabInstanceUrl', async () => {
      const result = await unified()
        .use(remarkParse)
        .use(remarkGitLabRefs, {
          gitlabInstanceUrl: 'https://gitlab.com/',
          projectPath: 'test/project',
        })
        .use(remarkStringify)
        .process('See #1');

      // Should not have double slashes
      expect(String(result)).toContain('https://gitlab.com/test/project');
      expect(String(result)).not.toContain('https://gitlab.com//');
    });
  });
});
