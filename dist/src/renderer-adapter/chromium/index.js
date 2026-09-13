import { chromium } from 'playwright';
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const displayContent = (value) => typeof value === 'string' ? value : JSON.stringify(value) ?? '';
function renderableHtml(tree) {
    const nodes = tree.nodes.map((node) => {
        const slotId = typeof node.slot_reference === 'string' ? node.slot_reference : 'unknown';
        const visualRole = typeof node.visual_role === 'string' ? node.visual_role : slotId;
        const content = node.content ?? node.items;
        return `<section data-slot-id="${escapeHtml(slotId)}"><h2>${escapeHtml(visualRole)}</h2><div>${escapeHtml(displayContent(content))}</div></section>`;
    }).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,sans-serif;color:#111}main{width:680px;margin:0 auto}section{break-inside:avoid;margin:0 0 24px;padding:12px;border-bottom:1px solid #ddd}h2{font-size:18px;margin:0 0 8px}div{font-size:14px;white-space:pre-wrap}</style></head><body><main>${nodes}</main></body></html>`;
}
export class ChromiumBackend {
    configuration;
    constructor(configuration) {
        this.configuration = configuration;
    }
    async open() {
        const browser = await chromium.launch({
            headless: true,
            executablePath: this.configuration.executablePath,
            chromiumSandbox: true,
            args: ['--disable-background-networking', '--disable-component-update', '--font-render-hinting=none'],
        });
        try {
            const context = await browser.newContext({
                locale: this.configuration.locale,
                timezoneId: this.configuration.timezoneId,
                viewport: { width: this.configuration.width, height: this.configuration.height },
                deviceScaleFactor: this.configuration.deviceScaleFactor,
            });
            await context.route('**/*', async (route) => {
                const url = route.request().url();
                if (url.startsWith('data:') || url.startsWith('about:'))
                    await route.continue();
                else
                    await route.abort('blockedbyclient');
            });
            return new ChromiumSession(browser, context, this.configuration);
        }
        catch (error) {
            await browser.close();
            throw error;
        }
    }
}
class ChromiumSession {
    browser;
    context;
    configuration;
    pagePromise;
    constructor(browser, context, configuration) {
        this.browser = browser;
        this.context = context;
        this.configuration = configuration;
        this.pagePromise = context.newPage();
    }
    async render(input) {
        const page = await this.pagePromise;
        try {
            await page.setContent(renderableHtml(input.tree), { waitUntil: 'load', timeout: this.configuration.timeoutMs });
            const measurements = await page.evaluate(() => {
                const pageHeight = 1122.52;
                const sections = Array.from(document.querySelectorAll('[data-slot-id]'));
                const bodyBounds = document.body.getBoundingClientRect();
                return {
                    pageCount: Math.max(1, Math.ceil(document.body.scrollHeight / pageHeight)),
                    pageBounds: [{ x: bodyBounds.x, y: bodyBounds.y, width: bodyBounds.width, height: Math.min(document.body.scrollHeight, pageHeight) }],
                    contentBounds: { x: bodyBounds.x, y: bodyBounds.y, width: bodyBounds.width, height: document.body.scrollHeight },
                    slotBounds: sections.map((section) => { const bounds = section.getBoundingClientRect(); return { slot_id: section.dataset.slotId ?? 'unknown', bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } }; }),
                    overflowHeight: Math.max(0, document.body.scrollHeight - pageHeight),
                    overflowWidth: Math.max(0, document.body.scrollWidth - document.documentElement.clientWidth),
                    affectedRegions: sections.length > 0 && document.body.scrollHeight > pageHeight ? sections.map((section) => section.dataset.slotId ?? 'unknown') : [],
                    constraintMeasurements: [{ constraint_id: 'chromium-page-height', allowed_boundary: pageHeight, measured_value: document.body.scrollHeight }],
                };
            });
            const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
            return { artifact: { artifact_id: input.request_id, media_type: 'application/pdf', bytes: pdf }, measurements };
        }
        catch (error) {
            throw { code: 'CHROMIUM_RENDER_FAILED', stage: 'RENDER', retryable: true, message: error instanceof Error ? error.message : 'Chromium render failed' };
        }
    }
    async close() {
        await this.context.close();
        await this.browser.close();
    }
}
//# sourceMappingURL=index.js.map