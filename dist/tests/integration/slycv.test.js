import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createCvFixture, renderSlyCvEndToEnd } from '../../src/integration/slycv/index.js';
const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const configuration = { executablePath, rendererId: 'chromium-headless', rendererVersion: '152.0.0', locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1, width: 794, height: 1123, timeoutMs: 15000 };
const expected = new Map([
    ['CV_SHORT', 'FIT'], ['CV_STANDARD', 'FIT'], ['CV_DENSE', 'FIT'], ['CV_OVERFLOW', 'OVERFLOW'], ['CV_UNICODE', 'FIT'], ['CV_CONSTRAINT_VIOLATION', 'CONSTRAINT_VIOLATION'],
]);
test('executes the six SlyCV producer-to-Chromium fixtures', { skip: !existsSync(executablePath) }, async () => {
    let unicodeSignature;
    for (const [fixtureId, expectedStatus] of expected) {
        const result = await renderSlyCvEndToEnd(createCvFixture(fixtureId), configuration);
        assert.equal(result.render.failure, null, fixtureId);
        assert.equal(result.render.artifact?.media_type, 'application/pdf', fixtureId);
        assert.equal(String.fromCharCode(...(result.render.artifact?.bytes.slice(0, 4) ?? [])), '%PDF', fixtureId);
        assert.equal(result.feedback.status, expectedStatus, fixtureId);
        assert.equal(result.feedback.request_id, result.request.request_id);
        assert.equal(result.feedback.traceId, result.request.traceId);
        assert.equal(result.feedback.contextId, result.request.contextId);
        assert.deepEqual(result.document.slots.experience?.items, result.input.experience, fixtureId);
        assert.equal(result.tree.document.document_id, result.document.document_id);
        if (fixtureId === 'CV_UNICODE')
            unicodeSignature = JSON.stringify({ status: result.feedback.status, pages: result.render.measurements?.page_count, measurements: result.render.measurements });
        if (fixtureId === 'CV_CONSTRAINT_VIOLATION') {
            const repeated = await renderSlyCvEndToEnd(createCvFixture('CV_UNICODE'), configuration);
            assert.equal(JSON.stringify({ status: repeated.feedback.status, pages: repeated.render.measurements?.page_count, measurements: repeated.render.measurements }), unicodeSignature);
        }
    }
});
//# sourceMappingURL=slycv.test.js.map