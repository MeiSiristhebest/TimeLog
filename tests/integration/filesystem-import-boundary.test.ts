import fs from 'node:fs';
import path from 'node:path';

const FEATURES_ROOT = path.resolve(__dirname, '../../src/features');
const DIRECT_FS_IMPORT_PATTERN = /from\s+['"]expo-file-system(?:\/legacy)?['"]/;

function collectFeatureUiFiles(dirPath: string, result: string[]): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFeatureUiFiles(fullPath, result);
      return;
    }

    if (!entry.isFile()) {
      return;
    }

    const isTsFile = fullPath.endsWith('.ts') || fullPath.endsWith('.tsx');
    const isUiLayer = fullPath.includes(`${path.sep}screens${path.sep}`) || fullPath.includes(`${path.sep}components${path.sep}`);

    if (isTsFile && isUiLayer) {
      result.push(fullPath);
    }
  });
}

describe('FileSystem import boundary', () => {
  it('disallows expo-file-system imports in feature screens/components', () => {
    const files: string[] = [];
    collectFeatureUiFiles(FEATURES_ROOT, files);

    const offenders = files.filter((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      return DIRECT_FS_IMPORT_PATTERN.test(content);
    });

    expect(offenders).toEqual([]);
  });
});
