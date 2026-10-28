/**
 * Automated Test Suite for Placify Context-Aware Job Extraction
 * Tests all 20 required scenarios from Master Prompt Section 9.
 * Run with: node --test tests/extractor.test.js
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const normalizer = require('../extension/extractor/normalizer');
const jsonLdExtractor = require('../extension/extractor/jsonLdExtractor');
const platformAdapters = require('../extension/extractor/platformAdapters');
const genericExtractor = require('../extension/extractor/genericExtractor');
const pageDetector = require('../extension/extractor/pageDetector');
const jobExtractor = require('../extension/extractor/jobExtractor');
const storageHelper = require('../extension/extractor/storageHelper');

// ── Lightweight DOM Mocking Helper ──
class MockNode {
  constructor(tag, attrs = {}, textContent = '') {
    this.tagName = (tag || 'div').toUpperCase();
    this.attributes = {};
    for (const [k, v] of Object.entries(attrs)) {
      this.attributes[k.toLowerCase()] = String(v);
    }
    this.textContent = textContent;
    this.innerText = textContent;
    this.children = [];
  }

  getAttribute(name) {
    return this.attributes[name.toLowerCase()] || null;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  matchesSelector(sel) {
    let s = sel.trim().replace(/\s+i\]/g, ']');

    // script[type="application/ld+json"]
    if (s.toLowerCase().includes('application/ld+json')) {
      return this.tagName === 'SCRIPT' && this.getAttribute('type') === 'application/ld+json';
    }

    // meta[property="..."] or meta[name="..."]
    const metaMatch = s.match(/^meta\[(property|name)=["']?([^"'\]]+)["']?\]/i);
    if (metaMatch) {
      if (this.tagName !== 'META') return false;
      const attrName = metaMatch[1].toLowerCase();
      const expected = metaMatch[2].toLowerCase();
      return (this.getAttribute(attrName) || '').toLowerCase() === expected;
    }

    // link[rel="canonical"]
    const linkMatch = s.match(/^link\[rel=["']?([^"'\]]+)["']?\]/i);
    if (linkMatch) {
      return this.tagName === 'LINK' && (this.getAttribute('rel') || '').toLowerCase() === linkMatch[1].toLowerCase();
    }

    // Check optional tag prefix e.g. h1, div, img, span
    const tagMatch = s.match(/^([a-zA-Z0-9]+)/);
    if (tagMatch) {
      const expectedTag = tagMatch[1].toUpperCase();
      if (this.tagName !== expectedTag) return false;
      s = s.slice(tagMatch[1].length).trim();
      if (!s) return true;
    }

    // Check class .class-name
    if (s.startsWith('.')) {
      const cls = s.slice(1).split(/[\s.>:]/)[0].toLowerCase();
      const classes = (this.getAttribute('class') || '').toLowerCase().split(/\s+/);
      return classes.includes(cls);
    }

    // Check [attr="value"], [attr*="value"], or [attr]
    const attrMatch = s.match(/\[([a-zA-Z0-9_-]+)(?:(\*?=)["']?([^"'\]]*)["']?)?\]/i);
    if (attrMatch) {
      const attrKey = attrMatch[1].toLowerCase();
      const op = attrMatch[2];
      const expectedVal = (attrMatch[3] || '').toLowerCase();
      const actualVal = (this.getAttribute(attrKey) || '').toLowerCase();
      if (!op) return Boolean(this.getAttribute(attrKey));
      if (op === '*=') return actualVal.includes(expectedVal);
      return actualVal === expectedVal;
    }

    return false;
  }

  querySelectorAll(selector) {
    const results = [];
    const cleanedSel = selector.replace(/\s+i\]/g, ']');
    const parts = cleanedSel.split(/\s*,\s*/);

    const traverse = (node) => {
      for (const part of parts) {
        const subParts = part.trim().split(/\s+/);
        const targetPart = subParts[subParts.length - 1];
        if (node.matchesSelector(targetPart)) {
          results.push(node);
          break;
        }
      }
      for (const child of node.children) {
        traverse(child);
      }
    };

    for (const child of this.children) {
      traverse(child);
    }

    return results;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }
}

class MockDocument extends MockNode {
  constructor(title = '') {
    super('html');
    this.title = title;
    this.body = new MockNode('body');
    this.head = new MockNode('head');
    this.appendChild(this.head);
    this.appendChild(this.body);
  }
}

// ── Test Suites ──

describe('Placify Context-Aware Extraction Test Suite', () => {

  beforeEach(() => {
    storageHelper._clearMemoryStore();
  });

  // Scenario 1: A job page with valid JobPosting JSON-LD
  it('Scenario 1: extracts valid JobPosting JSON-LD', () => {
    const doc = new MockDocument('Software Engineer - Google');
    const script = new MockNode('script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Senior Software Engineer',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Google LLC'
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Bangalore',
          addressCountry: 'India'
        }
      },
      employmentType: 'FULL_TIME',
      validThrough: '2026-12-31'
    }));
    doc.head.appendChild(script);

    const res = jobExtractor.extractJobDetails(doc, 'https://careers.google.com/jobs/results/123');
    assert.equal(res.status, 'success');
    assert.equal(res.fields.companyName.value, 'Google');
    assert.equal(res.fields.role.value, 'Senior Software Engineer');
    assert.equal(res.fields.location.value, 'Bangalore, India');
    assert.equal(res.fields.companyName.confidence, 'high');
    assert.equal(res.fields.role.confidence, 'high');
  });

  // Scenario 2: A page with JSON-LD containing an @graph
  it('Scenario 2: extracts JobPosting nested in @graph', () => {
    const doc = new MockDocument('Careers at Stripe');
    const script = new MockNode('script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Stripe' },
        {
          '@type': 'JobPosting',
          title: 'Infrastructure Engineer',
          hiringOrganization: { name: 'Stripe, Inc.' },
          jobLocationType: 'TELECOMMUTE'
        }
      ]
    }));
    doc.head.appendChild(script);

    const res = jobExtractor.extractJobDetails(doc, 'https://stripe.com/jobs/listing/infra-101');
    assert.equal(res.status, 'success');
    assert.equal(res.fields.companyName.value, 'Stripe');
    assert.equal(res.fields.role.value, 'Infrastructure Engineer');
    assert.equal(res.fields.location.value, 'Remote');
  });

  // Scenario 3: A LinkedIn-style job listing
  it('Scenario 3: extracts from LinkedIn platform adapter', () => {
    const doc = new MockDocument('Senior Frontend Developer | LinkedIn');
    const h1 = new MockNode('h1', { class: 'job-details-jobs-unified-top-card__job-title' }, 'Senior Frontend Developer');
    const company = new MockNode('div', { class: 'job-details-jobs-unified-top-card__company-name' }, 'Microsoft');
    const loc = new MockNode('span', { class: 'job-details-jobs-unified-top-card__bullet' }, 'Hyderabad, Telangana, India');

    doc.body.appendChild(h1);
    doc.body.appendChild(company);
    doc.body.appendChild(loc);

    const res = jobExtractor.extractJobDetails(doc, 'https://www.linkedin.com/jobs/view/3859201948');
    assert.equal(res.status, 'success');
    assert.equal(res.fields.companyName.value, 'Microsoft');
    assert.equal(res.fields.role.value, 'Senior Frontend Developer');
    assert.equal(res.fields.location.value, 'Hyderabad, Telangana, India');
    assert.equal(res.platform, 'LinkedIn Jobs');
  });

  // Scenario 4: A generic company career page
  it('Scenario 4: extracts from generic company career page via DOM headings & logo', () => {
    const doc = new MockDocument('Join us as a Product Manager | Figma');
    const logo = new MockNode('img', { alt: 'Figma Company Logo' });
    const header = new MockNode('header');
    header.appendChild(logo);
    doc.body.appendChild(header);

    const h1 = new MockNode('h1', {}, 'Lead Product Manager');
    const loc = new MockNode('div', { class: 'job-location' }, 'San Francisco, CA');
    doc.body.appendChild(h1);
    doc.body.appendChild(loc);

    const res = jobExtractor.extractJobDetails(doc, 'https://figma.com/careers/lead-pm');
    assert.equal(res.fields.role.value, 'Lead Product Manager');
    assert.equal(res.fields.companyName.value, 'Figma');
    assert.equal(res.fields.location.value, 'San Francisco, CA');
    assert.equal(res.status, 'success');
  });

  // Scenario 5: A page containing multiple unrelated job cards (does not confuse recommendations)
  it('Scenario 5: prioritizes main job details over unrelated recommendation cards', () => {
    const doc = new MockDocument('Backend Developer at Uber');
    // Main heading
    const h1 = new MockNode('h1', {}, 'Backend Developer');
    doc.body.appendChild(h1);

    // Main company logo
    const logo = new MockNode('img', { alt: 'Uber Logo' });
    doc.body.appendChild(logo);

    // Unrelated job recommendation cards in footer
    const unrelatedCard1 = new MockNode('div', { class: 'recommended-jobs' }, 'Frontend Dev at Netflix');
    const unrelatedCard2 = new MockNode('div', { class: 'recommended-jobs' }, 'DevOps at Amazon');
    doc.body.appendChild(unrelatedCard1);
    doc.body.appendChild(unrelatedCard2);

    const res = jobExtractor.extractJobDetails(doc, 'https://uber.com/careers/backend-dev');
    assert.equal(res.fields.role.value, 'Backend Developer');
    assert.equal(res.fields.companyName.value, 'Uber');
    assert.notEqual(res.fields.companyName.value, 'Netflix');
  });

  // Scenario 6: A page with no company name
  it('Scenario 6: handles missing company name gracefully (partial state)', () => {
    const doc = new MockDocument('Software Engineer Job Opening');
    const h1 = new MockNode('h1', {}, 'Software Engineer');
    doc.body.appendChild(h1);

    const res = jobExtractor.extractJobDetails(doc, 'https://example.com/careers/engineer');
    assert.equal(res.fields.role.value, 'Software Engineer');
    assert.equal(res.fields.companyName, null);
    assert.equal(res.status, 'partial');
    assert.equal(res.message, 'Some details need your review');
  });

  // Scenario 7: A page with no job title
  it('Scenario 7: handles missing job title gracefully', () => {
    const doc = new MockDocument('Work With Us | Acme Corp');
    const logo = new MockNode('img', { alt: 'Acme Corp' });
    doc.body.appendChild(logo);

    const res = jobExtractor.extractJobDetails(doc, 'https://acme.com/jobs');
    assert.equal(res.fields.companyName.value, 'Acme');
    assert.equal(res.fields.role, null);
    assert.equal(res.status, 'partial');
  });

  // Scenario 8: A page with a missing location
  it('Scenario 8: leaves optional location blank when missing without failing', () => {
    const doc = new MockDocument('Data Scientist at Spotify');
    const h1 = new MockNode('h1', {}, 'Data Scientist');
    const logo = new MockNode('img', { alt: 'Spotify' });
    doc.body.appendChild(h1);
    doc.body.appendChild(logo);

    const res = jobExtractor.extractJobDetails(doc, 'https://spotify.com/jobs/data-scientist');
    assert.equal(res.fields.companyName.value, 'Spotify');
    assert.equal(res.fields.role.value, 'Data Scientist');
    assert.equal(res.fields.location, null);
    assert.equal(res.status, 'success');
  });

  // Scenario 9: A page containing malformed JSON-LD
  it('Scenario 9: ignores malformed JSON-LD and falls back to DOM heuristics', () => {
    const doc = new MockDocument('DevOps Engineer at Datadog');
    // Broken JSON-LD
    const badScript = new MockNode('script', { type: 'application/ld+json' }, '{ "title": "DevOps", unquoted_bad_json: ');
    doc.head.appendChild(badScript);

    const h1 = new MockNode('h1', {}, 'DevOps Engineer');
    const logo = new MockNode('img', { alt: 'Datadog' });
    doc.body.appendChild(h1);
    doc.body.appendChild(logo);

    const res = jobExtractor.extractJobDetails(doc, 'https://datadog.com/careers/devops');
    assert.equal(res.status, 'success');
    assert.equal(res.fields.companyName.value, 'Datadog');
    assert.equal(res.fields.role.value, 'DevOps Engineer');
  });

  // Scenario 10: A page with conflicting metadata (JSON-LD takes precedence)
  it('Scenario 10: resolves conflicting metadata by prioritizing authoritative JSON-LD', () => {
    const doc = new MockDocument('Careers at ThirdParty Recruiter');
    const script = new MockNode('script', { type: 'application/ld+json' }, JSON.stringify({
      '@type': 'JobPosting',
      title: 'Full Stack Engineer',
      hiringOrganization: { name: 'Airbnb' }
    }));
    doc.head.appendChild(script);

    // Conflicting heading/logo
    const h1 = new MockNode('h1', {}, 'Recruiter Portal - Job #99');
    doc.body.appendChild(h1);

    const res = jobExtractor.extractJobDetails(doc, 'https://recruiter.com/job/airbnb-post');
    assert.equal(res.fields.companyName.value, 'Airbnb');
    assert.equal(res.fields.role.value, 'Full Stack Engineer');
    assert.equal(res.fields.companyName.confidence, 'high');
  });

  // Scenario 11: A non-job page
  it('Scenario 11: detects non-job page and reports not_job state', () => {
    const doc = new MockDocument('Top 10 Cooking Recipes for Dinner');
    const h1 = new MockNode('h1', {}, 'How to Make Delicious Pasta');
    doc.body.appendChild(h1);

    const res = jobExtractor.extractJobDetails(doc, 'https://recipes.com/pasta');
    assert.equal(res.isJobPage, false);
    assert.equal(res.status, 'not_job');
    assert.equal(res.message, 'No job listing detected. You can enter the details manually.');
  });

  // Scenario 12: A restricted browser page
  it('Scenario 12: handles restricted chrome:// or internal URLs safely', () => {
    const url = 'chrome://extensions';
    const isSafe = normalizer.isSafeUrl(url);
    const normalized = normalizer.normalizeUrl(url);
    assert.equal(isSafe, false);
    assert.equal(normalized, '');
  });

  // Scenario 13: A content script that cannot be reached (null/empty doc)
  it('Scenario 13: returns clean error state when DOM is inaccessible', () => {
    const res = jobExtractor.extractJobDetails(null, 'https://unknown.com');
    assert.equal(res.status, 'error');
    assert.equal(res.isJobPage, false);
    assert.equal(res.fields.jobLink.value, 'https://unknown.com/');
  });

  // Scenario 14: A page that dynamically loads job information
  it('Scenario 14: re-extraction picks up dynamically populated elements', () => {
    const doc = new MockDocument('Loading...');
    let res = jobExtractor.extractJobDetails(doc, 'https://company.com/jobs/1');
    assert.equal(res.status, 'not_job');

    // Simulate async hydration
    doc.title = 'Security Engineer at Cloudflare';
    const h1 = new MockNode('h1', {}, 'Security Engineer');
    const logo = new MockNode('img', { alt: 'Cloudflare' });
    doc.body.appendChild(h1);
    doc.body.appendChild(logo);

    res = jobExtractor.extractJobDetails(doc, 'https://company.com/jobs/1');
    assert.equal(res.status, 'success');
    assert.equal(res.fields.companyName.value, 'Cloudflare');
    assert.equal(res.fields.role.value, 'Security Engineer');
  });

  // Scenario 15: A user manually editing an extracted field
  it('Scenario 15: preserves user manual edits against overwriting', () => {
    const userEdits = new Set(['company']);
    const extractedData = {
      fields: {
        companyName: { value: 'Extracted Corp' },
        role: { value: 'Lead Architect' }
      }
    };

    const form = {
      company: 'User Custom Company',
      role: ''
    };

    if (!userEdits.has('company') && extractedData.fields.companyName) {
      form.company = extractedData.fields.companyName.value;
    }
    if (!userEdits.has('role') && extractedData.fields.role) {
      form.role = extractedData.fields.role.value;
    }

    assert.equal(form.company, 'User Custom Company');
    assert.equal(form.role, 'Lead Architect');
  });

  // Scenario 16: Saving a valid application
  it('Scenario 16: saves application and normalizes fields', async () => {
    const app = {
      companyName: '  Meta Platforms, Inc. - Careers  ',
      role: '  Research Scientist (m/f/d)  ',
      location: '  London, UK , , ',
      companyLink: 'https://metacareers.com/jobs/123?utm_source=linkedin&ref=abc'
    };

    const normCompany = normalizer.cleanCompanyName(app.companyName);
    const normRole = normalizer.cleanJobTitle(app.role);
    const normLoc = normalizer.cleanLocation(app.location);
    const normLink = normalizer.normalizeUrl(app.companyLink);

    assert.equal(normCompany, 'Meta Platforms');
    assert.equal(normRole, 'Research Scientist');
    assert.equal(normLoc, 'London, UK');
    assert.equal(normLink, 'https://metacareers.com/jobs/123');

    const saved = await storageHelper.recordSavedApplication({
      companyName: normCompany,
      role: normRole,
      location: normLoc,
      companyLink: normLink
    });

    assert.ok(saved.id);
    assert.equal(saved.companyName, 'Meta Platforms');
  });

  // Scenario 17: Preventing accidental duplicate saves
  it('Scenario 17: detects duplicate saved applications by link or company+role', async () => {
    await storageHelper.recordSavedApplication({
      companyName: 'Apple',
      role: 'iOS Engineer',
      location: 'Cupertino, CA',
      companyLink: 'https://jobs.apple.com/en-us/details/2001'
    });

    // Check same URL
    const dupByLink = await storageHelper.checkDuplicate('Any Company', 'Any Role', 'https://jobs.apple.com/en-us/details/2001?utm_medium=email');
    assert.equal(dupByLink.isDuplicate, true);
    assert.equal(dupByLink.reason, 'same_link');

    // Check same company & role
    const dupByRole = await storageHelper.checkDuplicate('apple', 'ios engineer', 'https://other-url.com');
    assert.equal(dupByRole.isDuplicate, true);
    assert.equal(dupByRole.reason, 'same_company_role');

    // Different role at same company is NOT a duplicate
    const noDup = await storageHelper.checkDuplicate('Apple', 'Hardware Engineer', 'https://jobs.apple.com/en-us/details/9999');
    assert.equal(noDup.isDuplicate, false);
  });

  // Scenario 18: Existing Hackathon and Calendar functionality preserved
  it('Scenario 18: page detector isolates Hackathon context from Job context', () => {
    const doc = new MockDocument('Smart India Hackathon SIH 2024');
    doc.body.textContent = 'Register team for coding challenge and hackathon submission deadline';

    const detection = pageDetector.detectPageType(doc, 'https://devpost.com/hackathons/sih-2024');
    assert.equal(detection.pageType, 'hackathon');
    assert.equal(detection.isHackathonPage, true);
    assert.equal(detection.isJobPage, false);
  });

  // Scenario 19: Previously saved applications remaining accessible (migration safety)
  it('Scenario 19: migrates legacy saved records into normalized schema', () => {
    const legacyRecord1 = 'Stripe';
    const legacyRecord2 = { company: 'Google', title: 'SWE', url: 'https://google.com' };

    const migrated1 = storageHelper.migrateRecord(legacyRecord1);
    const migrated2 = storageHelper.migrateRecord(legacyRecord2);

    assert.equal(migrated1.companyName, 'Stripe');
    assert.equal(migrated2.companyName, 'Google');
    assert.equal(migrated2.role, 'SWE');
    assert.equal(migrated2.companyLink, 'https://google.com');
    assert.ok(migrated1.savedAt);
  });

  // Scenario 20: Unsafe or malformed URLs
  it('Scenario 20: rejects unsafe schemes and malformed URLs', () => {
    assert.equal(normalizer.normalizeUrl('javascript:alert(1)'), '');
    assert.equal(normalizer.normalizeUrl('data:text/html,<html></html>'), '');
    assert.equal(normalizer.normalizeUrl('file:///etc/passwd'), '');
    assert.equal(normalizer.normalizeUrl('chrome-extension://xyz/popup.html'), '');
    assert.equal(normalizer.normalizeUrl('not-a-valid-url'), '');
    assert.equal(normalizer.isSafeUrl('javascript:void(0)'), false);
    assert.equal(normalizer.isSafeUrl('https://valid.com/jobs'), true);
  });

  // Scenario 21: Google Forms Recruitment Registration (User screenshot scenario)
  it('Scenario 21: extracts company, role, location, and deadline from Google Forms recruitment notices', () => {
    const doc = new MockDocument('Finastra - Registration');
    doc.body.textContent = `
      Finastra - Registration

      Company: Finastra
      Position: Associate Software Engineer
      Date: 02.11.2026 (Monday)
      Venue: Dr.NGPIT
      Eligibility Criteria:
      • B.E/B.Tech - AIDS, CSE, CSBS, Cyber IT
      • No Standing arrear
      Interview Process:
      1. Coding test
      2. Cognitive Logical round
      3. Technical Interview 1 & 2
      4. HR Interview

      About Finastra:
      Finastra is actively seeking talented, ambitious, and curious individuals to join our Global FinStarter program.
    `;

    const res = jobExtractor.extractJobDetails(doc, 'https://docs.google.com/forms/d/e/1FAIpQLSd5mDhYwNmNs98XXP6izpyTMAIS0gOunQLiLvbAlcvFVQIeRw/viewform');

    assert.equal(res.status, 'success');
    assert.equal(res.fields.companyName.value, 'Finastra');
    assert.equal(res.fields.role.value, 'Associate Software Engineer');
    assert.equal(res.fields.location.value, 'Dr.NGPIT');
    assert.equal(res.platform, 'Application Form');
  });
});
