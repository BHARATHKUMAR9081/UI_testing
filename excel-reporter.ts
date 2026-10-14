import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import ExcelJS from 'exceljs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createEvidenceViewer } from './evidence-viewer.ts';

interface TestItem {
  id: number;
  testKey: string;
  tcId: string;
  module: string;
  feature: string;
  scenario: string;
  testType: string;
  preconditions: string;
  testSteps: string;
  testData: string;
  expectedResult: string;
  actualResult: string;
  status: string;
  priority: string;
  defectDesc: string;
  screenshotLink: string;
  videoLink: string;
  errorDetails: string;
  execDateTime: string;
  duration: string;
  browserViewport: string;
  specPath: string;
  rawAttachments: Array<{ name: string; path?: string }>;
}

class ExcelReporter implements Reporter {
  private results: TestItem[] = [];

  private deriveMetadata(file: string, title: string, status: string, error?: string) {
    const lowerFile = file.toLowerCase();
    const lowerTitle = title.toLowerCase();

    let module = 'General';
    let tcPrefix = 'TC_GEN';
    let feature = 'General Functionality';
    let testType = 'UI Behavior';
    let priority = 'P2 - Medium';
    let preconditions = 'Browser launched, application accessible';
    let testSteps = `1. Navigate to target view\n2. Perform UI interaction\n3. Validate state`;
    let testData = 'Standard workspace data';
    let expectedResult = 'UI action completed and validated with expected state';

    // Module Mapping
    if (lowerFile.includes('login')) {
      module = 'Authentication & Session';
      tcPrefix = 'TC_AUTH';
      priority = 'P1 - High';
      if (lowerFile.includes('negative') || lowerTitle.includes('negative') || lowerTitle.includes('invalid')) {
        feature = 'Login Validation & Error Handling';
        testType = 'Negative';
        preconditions = 'User on Rapid24 Sign-in landing screen';
        testSteps = '1. Open landing page\n2. Click Continue\n3. Input invalid/empty credentials\n4. Submit and observe validation';
        testData = 'invalid_user@rapid24.ai, WrongPassword!';
        expectedResult = 'Application displays validation message "Email or password is incorrect." or "Enter your password."';
      } else {
        feature = 'Work Email Authentication';
        testType = 'Positive';
        preconditions = 'Valid registered credentials available';
        testSteps = '1. Open landing page\n2. Click Continue\n3. Enter email & password\n4. Sign in\n5. Verify dashboard';
        testData = 'WORK_EMAIL, WORK_PASSWORD';
        expectedResult = 'User is authenticated and redirected to /client/dashboard';
      }
    } else if (lowerFile.includes('integrations')) {
      module = 'Tools & Integrations';
      tcPrefix = 'TC_INT';
      priority = 'P1 - High';
      if (lowerFile.includes('negative') || lowerTitle.includes('negative')) {
        feature = 'Integration Error Handling';
        testType = 'Negative';
        preconditions = 'User authenticated in Integrations module';
        testSteps = '1. Search target integration\n2. Trigger modal\n3. Supply invalid format or cancel\n4. Verify recovery';
        testData = 'Mismatched URI / cancelled popup';
        expectedResult = 'Graceful rejection or error indicator shown without crashing workspace';
      } else if (lowerFile.includes('category')) {
        feature = 'Integration Category Filtering';
        testType = 'UI Behavior';
        preconditions = 'User on Integrations view';
        testSteps = '1. Click category tabs (Databases, Version control, etc.)\n2. Validate filtered grid count';
        testData = 'Category tab selectors';
        expectedResult = 'Grid updates dynamically to show only tools matching selected category';
      } else {
        feature = title.replace(/integration test/i, '').trim() + ' Integration';
        testType = 'Positive';
        preconditions = 'Rapid24 Integrations grid loaded';
        testSteps = `1. Filter for ${feature}\n2. Open card modal\n3. Enter credentials/tokens\n4. Validate modal presence and save`;
        testData = 'Configured environment token / connection string';
        expectedResult = `Integration modal for ${feature} renders cleanly and accepts configuration`;
      }
    } else if (lowerFile.includes('chat')) {
      module = 'Chats & Conversations';
      tcPrefix = 'TC_CHAT';
      priority = 'P1 - High';
      if (lowerFile.includes('negative') || lowerTitle.includes('negative') || lowerTitle.includes('boundary')) {
        feature = 'Chat Input Boundaries';
        testType = 'Boundary';
        preconditions = 'User on Rapid24 Chats dashboard';
        testSteps = '1. Test whitespace and empty submission\n2. Test special character / long prompt input\n3. Validate UI handling';
        testData = 'Whitespace, emojis, 1000+ char strings';
        expectedResult = 'Chat input retains stability and does not crash or submit empty prompts';
      } else {
        feature = 'Ask Rapid24 & Conversations';
        testType = 'Positive';
        preconditions = 'User authenticated on Chats view';
        testSteps = '1. Input Ask Rapid24 prompt\n2. Send message\n3. Navigate to Conversations\n4. Verify message history';
        testData = '"hii rapid24"';
        expectedResult = 'Prompt accepted, conversation created and conversation region rendered';
      }
    } else if (lowerFile.includes('home')) {
      module = 'Workspace Overview & Dashboard';
      tcPrefix = 'TC_HOME';
      priority = 'P2 - Medium';
      if (lowerFile.includes('sidebar')) {
        feature = 'Workspace Sidebar Modules';
        testType = 'Navigation';
        preconditions = 'User authenticated in the workspace';
        testSteps = '1. Sign in\n2. Confirm each sidebar module button is visible\n3. Capture the signed-in sidebar';
        testData = 'Insights, Knowledge, Chats, Agents, Skills, Models, Integrations, Automations, Tickets';
        expectedResult = 'Every workspace module is available from the signed-in sidebar';
      } else if (lowerFile.includes('responsive')) {
        feature = 'Multi-Viewport Responsiveness';
        testType = 'UI Behavior';
        preconditions = 'User authenticated on dashboard';
        testSteps = '1. Set viewport to Desktop (1280x720)\n2. Resize to Tablet (768x1024)\n3. Resize to Mobile (390x844)\n4. Assert layouts';
        testData = 'Viewport dimensions: 1280, 768, 390';
        expectedResult = 'Layout reflows correctly with visible navigation and controls across all screen sizes';
      } else if (lowerFile.includes('knowledge')) {
        feature = 'Knowledge Base & Data Tabs';
        testType = 'UI Behavior';
        preconditions = 'User on Knowledge dashboard';
        testSteps = '1. Navigate tabs (Sources, Facts, Relationships, Update History)\n2. Click Refresh action';
        testData = 'Knowledge sub-tabs';
        expectedResult = 'Active tab indicator updates and table contents render without errors';
      } else if (lowerFile.includes('activity')) {
        feature = 'Activity Log & Search';
        testType = 'UI Behavior';
        preconditions = 'User on dashboard';
        testSteps = '1. Open Activity drawer\n2. Type search query\n3. Validate filtered activity list';
        testData = '"scan"';
        expectedResult = 'Activity drawer opens and filters items based on query';
      } else {
        feature = 'Workspace Overview Metrics';
        testType = 'Positive';
        preconditions = 'User on Workspace Overview';
        testSteps = '1. Inspect overview metric cards\n2. Click cards to navigate to sub-modules\n3. Return to Insights';
        testData = 'Overview metric cards';
        expectedResult = 'Overview metric cards are interactive and route to correct sections';
      }
    } else if (lowerFile.includes('agents')) {
      module = 'AI Agents';
      tcPrefix = 'TC_AGENT';
      feature = 'Agent Roster & Roster Filter';
      testType = 'Positive';
      priority = 'P2 - Medium';
      preconditions = 'User on Agents module';
      testSteps = '1. Open Agents view\n2. Search agent roster\n3. Validate matching agent cards';
      testData = '"deploy"';
      expectedResult = 'Agent roster filters dynamically and displays agent cards';
    } else if (lowerFile.includes('skills')) {
      module = 'Skill Library';
      tcPrefix = 'TC_SKILL';
      feature = 'Skill Library & Connectors';
      testType = 'Positive';
      priority = 'P2 - Medium';
      preconditions = 'User on Skills module';
      testSteps = '1. Open Skill Library\n2. Search skills\n3. Validate skill cards and category headings';
      testData = '"Docker"';
      expectedResult = 'Skill library renders categories and matching skill cards';
    } else if (lowerFile.includes('models')) {
      module = 'AI Models';
      tcPrefix = 'TC_MODEL';
      feature = 'Model Catalog';
      testType = 'Positive';
      priority = 'P2 - Medium';
      preconditions = 'User on Models module';
      testSteps = '1. Open Model Catalog\n2. Validate model configuration fields and catalog display';
      testData = 'Base URL, API Key placeholders';
      expectedResult = 'Model catalog renders model list and provider endpoint controls';
    } else if (lowerFile.includes('automations') || lowerFile.includes('tickets')) {
      module = 'Automations & Tickets';
      tcPrefix = 'TC_AUTO';
      feature = 'Automations & Tickets Navigation';
      testType = 'Navigation & UI';
      priority = 'P2 - Medium';
      preconditions = 'User authenticated in workspace';
      testSteps = '1. Open Automations/Tickets view\n2. Verify layout and containers\n3. Return to Insights';
      testData = 'Sidebar navigation icons';
      expectedResult = 'Automations and Tickets modules render cleanly and support navigation';
    } else if (lowerFile.includes('settings')) {
      module = 'Settings & Session Management';
      tcPrefix = 'TC_SETT';
      feature = 'User Profile & Sign Out';
      testType = 'Security / Session';
      priority = 'P1 - High';
      preconditions = 'User currently authenticated';
      testSteps = '1. Open profile popover (BJ)\n2. Verify user email\n3. Click Sign out\n4. Verify redirect to landing';
      testData = 'Profile avatar';
      expectedResult = 'Session is invalidated and user is redirected to Sign in screen with Continue button';
    }

    return {
      module,
      tcPrefix,
      feature,
      testType,
      priority,
      preconditions,
      testSteps,
      testData,
      expectedResult
    };
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const filePath = path.relative(process.cwd(), test.location.file);
    const title = test.title;
    const status = result.status.toUpperCase();
    const duration = `${(result.duration / 1000).toFixed(2)}s`;
    const errorMessage = result.error ? (result.error.message || String(result.error)) : '';
    const now = new Date();
    const execDateTime = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const meta = this.deriveMetadata(filePath, title, status, errorMessage);
    const index = this.results.length + 1;
    const titleMatch = title.match(/^(TC_[A-Z0-9_]+):?\s*(.*)$/i);
    const tcId = titleMatch ? titleMatch[1] : `${meta.tcPrefix}_${String(index).padStart(3, '0')}`;
    const scenario = titleMatch ? titleMatch[2] : title;

    const attachments = result.attachments.map(a => ({
      name: a.name,
      path: a.path
    }));

    const videoAttachment = attachments.find(a => a.name === 'video' || (a.path && a.path.endsWith('.webm')));
    const screenshotAttachments = attachments.filter(a => a.path && (a.path.endsWith('.png') || a.path.endsWith('.jpg')));
    const isAutomaticShot = (shot: { name: string; path?: string }) => {
      const name = (shot.name || '').toLowerCase();
      const filePath = (shot.path || '').toLowerCase();
      return name === 'screenshot' || filePath.includes('test-finished');
    };
    const scriptShots = screenshotAttachments.filter(shot => !isAutomaticShot(shot));
    const validationShot = [...scriptShots].reverse().find(shot => (shot.name || '').toLowerCase() === 'validation');
    const targetScreenshot = validationShot || scriptShots[scriptShots.length - 1] || screenshotAttachments[screenshotAttachments.length - 1];
    const evidenceViewer = targetScreenshot?.path || videoAttachment?.path
      ? pathToFileURL(createEvidenceViewer(targetScreenshot?.path, videoAttachment?.path)).href
      : '';

    const item: TestItem = {
      id: index,
      testKey: test.id,
      tcId,
      module: meta.module,
      feature: meta.feature,
      scenario,
      testType: meta.testType,
      preconditions: meta.preconditions,
      testSteps: meta.testSteps,
      testData: meta.testData,
      expectedResult: meta.expectedResult,
      actualResult: status === 'PASSED' ? 'As expected - all assertions verified' : (errorMessage.split('\n')[0] || 'Failed'),
      status,
      priority: meta.priority,
      defectDesc: status === 'FAILED' ? (errorMessage.split('\n')[0] || 'Defect detected') : 'N/A',
      screenshotLink: targetScreenshot?.path ? evidenceViewer : '',
      videoLink: videoAttachment?.path ? evidenceViewer : '',
      errorDetails: errorMessage || 'None',
      execDateTime,
      duration,
      browserViewport: 'Chromium 1280x720',
      specPath: filePath,
      rawAttachments: attachments
    };

    const previous = this.results.findIndex(row => row.testKey === test.id);
    if (previous >= 0) {
      item.id = this.results[previous].id;
      this.results[previous] = item;
    } else {
      this.results.push(item);
    }
  }

  async onEnd(result: FullResult) {
    if (this.results.length === 0) {
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Playwright Automated Framework';
    workbook.lastModifiedBy = 'Senior QA Lead';
    workbook.created = new Date();

    const NAVY_HEADER = '1F4E78';
    const LIGHT_GREEN = 'C6EFCE';
    const DARK_GREEN = '006100';
    const LIGHT_RED = 'FFC7CE';
    const DARK_RED = '9C0006';
    const LINK_BLUE = '0563C1';
    const projectDir = process.cwd();

    // -------------------------------------------------------------
    // SHEET 1: Summary Dashboard
    // -------------------------------------------------------------
    const dashSheet = workbook.addWorksheet('Summary Dashboard');
    dashSheet.views = [{ showGridLines: true }];

    dashSheet.columns = [
      { header: 'Metric', key: 'metric', width: 32 },
      { header: 'Value', key: 'value', width: 22 },
      { header: 'Percentage / Details', key: 'details', width: 30 }
    ];

    const dHeader = dashSheet.getRow(1);
    dHeader.height = 28;
    dHeader.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    dHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_HEADER } };
    dHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASSED').length;
    const failedTests = this.results.filter(r => r.status === 'FAILED').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIPPED').length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) + '%' : '0%';

    dashSheet.addRow({ metric: 'Total Executed Test Cases', value: totalTests, details: 'Full Test Suite' });
    dashSheet.addRow({ metric: 'Passed Test Cases', value: passedTests, details: `Pass Rate: ${passRate}` });
    dashSheet.addRow({ metric: 'Failed Test Cases', value: failedTests, details: failedTests > 0 ? 'Requires attention' : 'None' });
    dashSheet.addRow({ metric: 'Skipped / Blocked Test Cases', value: skippedTests, details: 'N/A' });
    dashSheet.addRow({ metric: 'Overall Suite Pass Rate', value: passRate, details: 'Automated Playwright Suite' });
    dashSheet.addRow({ metric: 'Execution Environment', value: 'Chromium / Linux', details: 'Headless CI/CD Mode' });

    dashSheet.addRow({});
    const modHeader = dashSheet.addRow({ metric: 'Module Name', value: 'Tests Executed', details: 'Pass Rate' });
    modHeader.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    modHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F5597' } };

    const modules = [...new Set(this.results.map(r => r.module))];
    modules.forEach(mod => {
      const modItems = this.results.filter(r => r.module === mod);
      const modPassed = modItems.filter(r => r.status === 'PASSED').length;
      const modRate = ((modPassed / modItems.length) * 100).toFixed(0) + '%';
      dashSheet.addRow({ metric: mod, value: modItems.length, details: `${modPassed}/${modItems.length} (${modRate})` });
    });

    // -------------------------------------------------------------
    // SHEET 2: Execution Details (All 20 Columns)
    // -------------------------------------------------------------
    const detailSheet = workbook.addWorksheet('Execution Details');
    detailSheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

    detailSheet.columns = [
      { header: '1. Test Case ID', key: 'tcId', width: 16 },
      { header: '2. Module', key: 'module', width: 26 },
      { header: '3. Feature', key: 'feature', width: 28 },
      { header: '4. Test Scenario', key: 'scenario', width: 45 },
      { header: '5. Test Type', key: 'testType', width: 15 },
      { header: '6. Preconditions', key: 'preconditions', width: 32 },
      { header: '7. Test Steps', key: 'testSteps', width: 42 },
      { header: '8. Test Data', key: 'testData', width: 25 },
      { header: '9. Expected Result', key: 'expectedResult', width: 40 },
      { header: '10. Actual Result', key: 'actualResult', width: 35 },
      { header: '11. Status', key: 'status', width: 14 },
      { header: '12. Priority', key: 'priority', width: 14 },
      { header: '13. Defect Description', key: 'defectDesc', width: 30 },
      { header: '14. Screenshot Link', key: 'screenshotLink', width: 25 },
      { header: '15. Video Link', key: 'videoLink', width: 25 },
      { header: '16. Error Details', key: 'errorDetails', width: 35 },
      { header: '17. Execution Date/Time', key: 'execDateTime', width: 22 },
      { header: '18. Duration', key: 'duration', width: 12 },
      { header: '19. Browser / Viewport', key: 'browserViewport', width: 22 },
      { header: '20. Automation Script Path', key: 'specPath', width: 35 }
    ];

    const detHeader = detailSheet.getRow(1);
    detHeader.height = 30;
    detHeader.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    detHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_HEADER } };
    detHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    this.results.forEach(item => {
      const row = detailSheet.addRow({
        tcId: item.tcId,
        module: item.module,
        feature: item.feature,
        scenario: item.scenario,
        testType: item.testType,
        preconditions: item.preconditions,
        testSteps: item.testSteps,
        testData: item.testData,
        expectedResult: item.expectedResult,
        actualResult: item.actualResult,
        status: item.status,
        priority: item.priority,
        defectDesc: item.defectDesc,
        screenshotLink: item.screenshotLink ? '📸 View Screenshot' : 'No Screenshot',
        videoLink: item.videoLink ? '🎥 Watch Video' : 'No Video',
        errorDetails: item.errorDetails,
        execDateTime: item.execDateTime,
        duration: item.duration,
        browserViewport: item.browserViewport,
        specPath: item.specPath
      });

      row.height = 35;
      row.alignment = { vertical: 'middle', wrapText: true };

      // Status cell styling
      const statusCell = row.getCell('status');
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (item.status === 'PASSED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREEN } };
        statusCell.font = { color: { argb: DARK_GREEN }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_RED } };
        statusCell.font = { color: { argb: DARK_RED }, bold: true };
      }

      // Spec link
      const specCell = row.getCell('specPath');
      specCell.value = {
        text: `📄 ${item.specPath}`,
        hyperlink: pathToFileURL(path.join(projectDir, item.specPath)).href,
        tooltip: 'Click to open spec file'
      };
      specCell.font = { color: { argb: LINK_BLUE }, underline: true };

      // Screenshot link
      if (item.screenshotLink) {
        const scCell = row.getCell('screenshotLink');
        scCell.value = {
          text: '📸 Ctrl+click to view',
          hyperlink: item.screenshotLink,
          tooltip: 'In LibreOffice Calc, hold Ctrl and click to open the screenshot and video'
        };
        scCell.font = { color: { argb: LINK_BLUE }, underline: true, bold: true };
        scCell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Video link
      if (item.videoLink) {
        const vidCell = row.getCell('videoLink');
        vidCell.value = {
          text: '🎥 Ctrl+click to play',
          hyperlink: item.videoLink,
          tooltip: 'In LibreOffice Calc, hold Ctrl and click to open the screenshot and video'
        };
        vidCell.font = { color: { argb: LINK_BLUE }, underline: true, bold: true };
        vidCell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    const outputPath = path.join(process.cwd(), 'test-results.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n📊 Professional QA Excel Report generated with all 20 columns: ${outputPath}\n`);
  }
}

export default ExcelReporter;
