import fs from 'fs';
import path from 'path';

function relativeFileUrl(fromDirectory: string, filePath: string): string {
  return path.relative(fromDirectory, filePath)
    .split(path.sep)
    .map(encodeURIComponent)
    .join('/');
}

export function createEvidenceViewer(screenshotPath?: string, videoPath?: string): string {
  const evidencePath = screenshotPath || videoPath;
  if (!evidencePath) {
    throw new Error('Cannot create an evidence viewer without a screenshot or video.');
  }

  const viewerDirectory = path.dirname(evidencePath);
  const viewerPath = path.join(viewerDirectory, 'evidence-viewer.html');
  const screenshot = screenshotPath
    ? `<img src="${relativeFileUrl(viewerDirectory, screenshotPath)}" alt="Test screenshot">`
    : '';
  const video = videoPath
    ? `<video controls preload="metadata"><source src="${relativeFileUrl(viewerDirectory, videoPath)}" type="video/webm">Your browser cannot play this video.</video>`
    : '';

  fs.writeFileSync(viewerPath, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Test Evidence</title>
  <style>
    body { font: 16px sans-serif; margin: 24px; background: #f5f7fa; color: #172033; }
    main { max-width: 1280px; margin: auto; }
    section { margin: 20px 0; padding: 16px; background: white; border: 1px solid #d5dbe5; border-radius: 8px; }
    img, video { display: block; width: 100%; max-width: 100%; height: auto; background: #000; }
  </style>
</head>
<body>
  <main>
    <h1>Test Evidence</h1>
    ${screenshot ? `<section><h2>Screenshot</h2>${screenshot}</section>` : ''}
    ${video ? `<section><h2>Video recording</h2>${video}</section>` : ''}
  </main>
</body>
</html>
`, 'utf8');

  return viewerPath;
}
