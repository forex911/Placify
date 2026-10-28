/**
 * Placify Extension — Content Script
 * Runs in the context of web pages to extract job, hackathon, and event details.
 */
(function () {
  'use strict';

  // Prevent multiple duplicate listeners
  if (window.__PLACIFY_CONTENT_SCRIPT_LOADED__) {
    return;
  }
  window.__PLACIFY_CONTENT_SCRIPT_LOADED__ = true;

  // ═══════════════════════════════════════════════════════════════════════
  // 1. NORMALIZATION UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  function decodeHtmlEntities(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, dec) => {
        try { return String.fromCharCode(parseInt(dec, 10)); } catch (_) { return ''; }
      });
  }

  function stripHtmlTags(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, ' ');
  }

  function normalizeText(str) {
    if (!str || typeof str !== 'string') return '';
    const stripped = stripHtmlTags(str);
    const decoded = decodeHtmlEntities(stripped);
    return decoded
      .replace(/[\r\n\t\f\v]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  const TRACKING_PARAMS = new Set([
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'ref', 'refid', 'trackingid', 'trk', 'trkcampaign', 'fbclid', 'gclid',
    'msclkid', 'zanpid', 'origin', 'context', 'position', 'pagenum', 'searchid', 'jobhash'
  ]);

  function normalizeUrl(urlStr, baseUrl) {
    if (!urlStr || typeof urlStr !== 'string') return '';
    const trimmed = urlStr.trim();
    if (!trimmed) return '';

    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('file:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('chrome:') ||
      lower.startsWith('chrome-extension:')
    ) {
      return '';
    }

    try {
      const parsed = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }

      const searchParams = new URLSearchParams(parsed.search);
      const keysToDelete = [];
      for (const key of searchParams.keys()) {
        if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(k => searchParams.delete(k));
      parsed.search = searchParams.toString();
      if (parsed.hash === '#' || parsed.hash === '#top') {
        parsed.hash = '';
      }
      return parsed.toString();
    } catch (_) {
      return '';
    }
  }

  function cleanCompanyName(name) {
    if (!name || typeof name !== 'string') return '';
    let cleaned = normalizeText(name);

    cleaned = cleaned
      .replace(/\s*[-|–—•]\s*(Careers|Jobs|Job Board|Recruitment|Work With Us|LinkedIn|Indeed|Glassdoor|Wellfound|Lever|Greenhouse).*$/i, '')
      .replace(/^(Careers|Jobs|Job Opening|Working) at\s+/i, '')
      .replace(/\s+(Careers|Jobs|Recruitment)$/i, '')
      .replace(/\s*(?:,\s*)?(?:Inc\.?|LLC\.?|Ltd\.?|Corp\.?|Corporation|Co\.|GmbH|Pvt\.?\s*Ltd\.?)\s*$/i, '')
      .replace(/\s*Logo$/i, '')
      .replace(/\s*Company Logo$/i, '')
      .trim();

    if (/^(https?:\/\/|[a-z0-9.-]+\.[a-z]{2,})/i.test(cleaned)) {
      try {
        const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
        cleaned = url.hostname.replace(/^www\./i, '').split('.')[0];
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      } catch (_) {}
    }

    return cleaned;
  }

  function cleanJobTitle(title) {
    if (!title || typeof title !== 'string') return '';
    let cleaned = normalizeText(title);

    cleaned = cleaned
      .replace(/\s*\((?:m\/f\/d|m\/w\/d|f\/m\/d|m\/f\/x|all genders?)\)/gi, '')
      .replace(/\s*\[(?:urgent|hiring|remote|hybrid|onsite|new)\]/gi, '')
      .replace(/\s*-\s*Job ID:?\s*[\w\d-]+/gi, '')
      .replace(/\s*Req(?:uisition)?\s*(?:ID)?:?\s*[\w\d-]+/gi, '')
      .replace(/\s*[-|–—•]\s*(?:Apply Now|Full[\s-]time|Part[\s-]time|Contract|Remote|Hybrid).*$/i, '')
      .trim();

    return cleaned;
  }

  function cleanLocation(loc) {
    if (!loc || typeof loc !== 'string') return '';
    let cleaned = normalizeText(loc);

    if (/^telecommute$/i.test(cleaned) || /^remote$/i.test(cleaned)) {
      return 'Remote';
    }

    cleaned = cleaned
      .replace(/,\s*,+/g, ',')
      .replace(/^[,\s-]+|[,\s-]+$/g, '')
      .trim();

    return cleaned;
  }

  function detectWorkMode(text) {
    if (!text || typeof text !== 'string') return null;
    const lower = text.toLowerCase();
    if (lower.includes('remote') || lower.includes('telecommute') || lower.includes('work from home') || lower.includes('wfh')) {
      return 'Remote';
    }
    if (lower.includes('hybrid')) {
      return 'Hybrid';
    }
    if (lower.includes('on-site') || lower.includes('onsite') || lower.includes('in-office')) {
      return 'On-site';
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. STRATEGY A: STRUCTURED DATA & JSON-LD
  // ═══════════════════════════════════════════════════════════════════════

  function isJobPostingType(type) {
    if (!type) return false;
    if (typeof type === 'string') {
      const lower = type.toLowerCase();
      return lower === 'jobposting' || lower.endsWith('/jobposting');
    }
    if (Array.isArray(type)) {
      return type.some(t => isJobPostingType(t));
    }
    return false;
  }

  function findJobPostings(data, found = []) {
    if (!data) return found;
    if (Array.isArray(data)) {
      for (const item of data) findJobPostings(item, found);
      return found;
    }
    if (typeof data === 'object') {
      if (isJobPostingType(data['@type'])) {
        found.push(data);
      }
      if (data['@graph'] && (Array.isArray(data['@graph']) || typeof data['@graph'] === 'object')) {
        findJobPostings(data['@graph'], found);
      }
    }
    return found;
  }

  function formatJobLocation(jobLocation, jobLocationType) {
    if (!jobLocation && !jobLocationType) return '';
    const isTelecommute = typeof jobLocationType === 'string' &&
      (jobLocationType.toUpperCase().includes('TELECOMMUTE') || jobLocationType.toUpperCase().includes('REMOTE'));

    if (!jobLocation) return isTelecommute ? 'Remote' : '';

    const loc = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation;
    if (!loc) return isTelecommute ? 'Remote' : '';

    if (typeof loc === 'string') {
      const cleaned = cleanLocation(loc);
      return isTelecommute && !cleaned.toLowerCase().includes('remote') ? `${cleaned} (Remote)` : cleaned;
    }

    if (typeof loc === 'object') {
      const address = loc.address || (loc['@type'] === 'PostalAddress' ? loc : null);
      if (typeof address === 'string') {
        const cleaned = cleanLocation(address);
        return isTelecommute && !cleaned.toLowerCase().includes('remote') ? `${cleaned} (Remote)` : cleaned;
      }
      if (address && typeof address === 'object') {
        const parts = [];
        if (address.streetAddress) parts.push(address.streetAddress);
        if (address.addressLocality) parts.push(address.addressLocality);
        if (address.addressRegion) parts.push(address.addressRegion);
        if (address.postalCode && !address.addressRegion) parts.push(address.postalCode);
        if (address.addressCountry) {
          const country = typeof address.addressCountry === 'object'
            ? (address.addressCountry.name || address.addressCountry.identifier || '')
            : address.addressCountry;
          if (country) parts.push(country);
        }
        const formatted = cleanLocation(parts.join(', '));
        if (formatted) {
          return isTelecommute && !formatted.toLowerCase().includes('remote') ? `${formatted} (Remote)` : formatted;
        }
      }
      if (loc.name && typeof loc.name === 'string') {
        return cleanLocation(loc.name);
      }
    }

    return isTelecommute ? 'Remote' : '';
  }

  function extractOrganizationName(org) {
    if (!org) return '';
    if (typeof org === 'string') return cleanCompanyName(org);
    if (Array.isArray(org) && org.length > 0) return extractOrganizationName(org[0]);
    if (typeof org === 'object') {
      if (org.name && typeof org.name === 'string') return cleanCompanyName(org.name);
      if (org.legalName && typeof org.legalName === 'string') return cleanCompanyName(org.legalName);
    }
    return '';
  }

  function extractMetaTags(doc, currentUrl) {
    if (!doc) return {};
    const meta = {};

    const getMeta = (prop) => {
      const el = doc.querySelector(`meta[property="${prop}" i], meta[name="${prop}" i]`);
      return el ? el.getAttribute('content') : null;
    };

    const ogTitle = getMeta('og:title') || getMeta('twitter:title');
    const ogSiteName = getMeta('og:site_name');
    const ogUrl = getMeta('og:url');
    const ogDesc = getMeta('og:description') || getMeta('description');
    const canonicalEl = doc.querySelector('link[rel="canonical" i]');
    const canonicalUrl = canonicalEl ? canonicalEl.getAttribute('href') : null;

    if (ogTitle) meta.ogTitle = normalizeText(ogTitle);
    if (ogSiteName) meta.siteName = cleanCompanyName(ogSiteName);
    if (ogDesc) meta.description = normalizeText(ogDesc);
    if (canonicalUrl || ogUrl) {
      meta.canonicalUrl = normalizeUrl(canonicalUrl || ogUrl, currentUrl);
    }

    return meta;
  }

  function extractStructuredData(doc, pageUrl) {
    if (!doc) return null;
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const allJobPostings = [];

    for (let i = 0; i < scripts.length; i++) {
      const text = (scripts[i].textContent || '').trim();
      if (!text) continue;
      try {
        const parsed = JSON.parse(text);
        findJobPostings(parsed, allJobPostings);
      } catch (_) {}
    }

    const metaTags = extractMetaTags(doc, pageUrl);

    if (allJobPostings.length === 0) {
      return { hasJobPosting: false, metaTags, jobPosting: null };
    }

    let bestPosting = allJobPostings[0];
    for (const posting of allJobPostings) {
      const currentScore = (posting.title ? 2 : 0) + (posting.hiringOrganization ? 2 : 0) + (posting.jobLocation ? 1 : 0);
      const bestScore = (bestPosting.title ? 2 : 0) + (bestPosting.hiringOrganization ? 2 : 0) + (bestPosting.jobLocation ? 1 : 0);
      if (currentScore > bestScore) bestPosting = posting;
    }

    const rawRole = bestPosting.title || bestPosting.jobTitle || bestPosting.name || '';
    const role = cleanJobTitle(rawRole);

    const rawCompany = extractOrganizationName(bestPosting.hiringOrganization) ||
      extractOrganizationName(bestPosting.publisher) ||
      metaTags.siteName || '';
    const company = cleanCompanyName(rawCompany);

    const location = formatJobLocation(bestPosting.jobLocation, bestPosting.jobLocationType);
    const jobUrl = normalizeUrl(bestPosting.url || metaTags.canonicalUrl || pageUrl, pageUrl);

    let employmentType = null;
    if (bestPosting.employmentType) {
      const emp = Array.isArray(bestPosting.employmentType) ? bestPosting.employmentType[0] : bestPosting.employmentType;
      if (typeof emp === 'string') employmentType = normalizeText(emp.replace(/_/g, ' '));
    }

    let deadline = null;
    if (bestPosting.validThrough && typeof bestPosting.validThrough === 'string') {
      try {
        const d = new Date(bestPosting.validThrough);
        if (!isNaN(d.getTime())) deadline = d.toISOString().split('T')[0];
      } catch (_) {
        deadline = bestPosting.validThrough.split('T')[0];
      }
    }

    const description = bestPosting.description ? normalizeText(bestPosting.description).slice(0, 500) : (metaTags.description || null);

    const workMode = detectWorkMode(
      (bestPosting.jobLocationType || '') + ' ' + (typeof bestPosting.jobLocation === 'string' ? bestPosting.jobLocation : '') + ' ' + (role || '')
    );

    return {
      hasJobPosting: true,
      jobPosting: bestPosting,
      metaTags,
      fields: {
        companyName: company ? {
          value: company,
          confidence: 'high',
          source: 'JobPosting JSON-LD (hiringOrganization.name)'
        } : null,
        role: role ? {
          value: role,
          confidence: 'high',
          source: 'JobPosting JSON-LD (title)'
        } : null,
        location: location ? {
          value: location,
          confidence: 'high',
          source: 'JobPosting JSON-LD (jobLocation)'
        } : null,
        jobLink: jobUrl ? {
          value: jobUrl,
          confidence: 'high',
          source: 'Canonical / JobPosting URL'
        } : null,
        employmentType: employmentType ? {
          value: employmentType,
          confidence: 'high',
          source: 'JobPosting JSON-LD (employmentType)'
        } : null,
        deadline: deadline ? {
          value: deadline,
          confidence: 'high',
          source: 'JobPosting JSON-LD (validThrough)'
        } : null,
        description: description ? {
          value: description,
          confidence: 'medium',
          source: 'JobPosting JSON-LD (description)'
        } : null,
        workMode: workMode ? {
          value: workMode,
          confidence: 'medium',
          source: 'JobPosting JSON-LD (jobLocationType)'
        } : null
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. STRATEGY B: PLATFORM ADAPTERS
  // ═══════════════════════════════════════════════════════════════════════

  function queryText(root, selector) {
    if (!root || !root.querySelector) return '';
    try {
      const el = root.querySelector(selector);
      return el ? (el.textContent || el.innerText || '').trim() : '';
    } catch (_) { return ''; }
  }

  function queryFirstValid(root, selectors) {
    for (const sel of selectors) {
      const txt = queryText(root, sel);
      if (txt) return txt;
    }
    return '';
  }

  const platformAdapters = [
    // LinkedIn
    {
      id: 'linkedin',
      name: 'LinkedIn Jobs',
      matches: (u) => u.hostname.includes('linkedin.com') && (u.pathname.includes('/jobs') || u.pathname.includes('/job/')),
      extract: (doc) => {
        const role = cleanJobTitle(queryFirstValid(doc, [
          '.job-details-jobs-unified-top-card__job-title',
          '.jobs-unified-top-card__job-title',
          '.topcard__title',
          'h1.t-24',
          'h1'
        ]));
        const company = cleanCompanyName(queryFirstValid(doc, [
          '.job-details-jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__company-name',
          '.jobs-unified-top-card__company-name a',
          '.jobs-unified-top-card__company-name',
          '.topcard__org-name-link'
        ]));
        const location = cleanLocation(queryFirstValid(doc, [
          '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
          '.job-details-jobs-unified-top-card__bullet',
          '.job-details-jobs-unified-top-card__workplace-type',
          '.topcard__flavor--bullet'
        ]));
        const workMode = detectWorkMode(queryFirstValid(doc, [
          '.job-details-jobs-unified-top-card__workplace-type',
          '.jobs-unified-top-card__workplace-type'
        ]) || location || role);

        return { company, role, location, workMode, confidence: (company && role) ? 'high' : 'medium' };
      }
    },
    // Indeed
    {
      id: 'indeed',
      name: 'Indeed',
      matches: (u) => u.hostname.includes('indeed.') && (u.pathname.includes('/viewjob') || u.pathname.includes('/cmp/') || u.pathname.includes('/jobs') || u.searchParams.has('jk')),
      extract: (doc) => {
        const role = cleanJobTitle(queryFirstValid(doc, [
          '[data-testid="jobsearch-JobInfoHeader-title"]',
          '.jobsearch-JobInfoHeader-title',
          'h1[data-testid="simpler-jobTitle"]',
          'h1'
        ]));
        const company = cleanCompanyName(queryFirstValid(doc, [
          '[data-company-name="true"]',
          '[data-testid="inlineHeader-companyName"] a',
          '[data-testid="inlineHeader-companyName"]',
          '.jobsearch-CompanyInfoContainer a'
        ]));
        const location = cleanLocation(queryFirstValid(doc, [
          '[data-testid="job-location"]',
          '[data-testid="inlineHeader-companyLocation"]',
          '.jobsearch-JobInfoHeader-companyLocation',
          '#jobLocationText'
        ]));
        return { company, role, location, workMode: detectWorkMode(location || role), confidence: (company && role) ? 'high' : 'medium' };
      }
    },
    // Glassdoor
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      matches: (u) => u.hostname.includes('glassdoor.') && (u.pathname.includes('/Job/') || u.pathname.includes('/job-listing/')),
      extract: (doc) => {
        const role = cleanJobTitle(queryFirstValid(doc, [
          '[data-test="job-title"]',
          '[class*="JobDetails_jobTitle"]',
          'h1'
        ]));
        const company = cleanCompanyName(queryFirstValid(doc, [
          '[data-test="employer-name"]',
          '[class*="JobDetails_employerName"]'
        ]));
        const location = cleanLocation(queryFirstValid(doc, [
          '[data-test="location"]',
          '[class*="JobDetails_location"]'
        ]));
        return { company, role, location, workMode: detectWorkMode(location || role), confidence: (company && role) ? 'high' : 'medium' };
      }
    },
    // Wellfound
    {
      id: 'wellfound',
      name: 'Wellfound',
      matches: (u) => u.hostname.includes('wellfound.com') || u.hostname.includes('angel.co'),
      extract: (doc) => {
        const role = cleanJobTitle(queryFirstValid(doc, [
          'h1[class*="styles_title"]',
          '[data-test="JobTitle"]',
          'h1'
        ]));
        const company = cleanCompanyName(queryFirstValid(doc, [
          '[data-test="StartupName"]',
          'a[href^="/company/"][class*="styles_startup"]',
          '.startup-name'
        ]));
        const location = cleanLocation(queryFirstValid(doc, [
          '[data-test="Location"]',
          'span[class*="location"]'
        ]));
        return { company, role, location, workMode: detectWorkMode(location || role), confidence: (company && role) ? 'high' : 'medium' };
      }
    },
    // Greenhouse
    {
      id: 'greenhouse',
      name: 'Greenhouse',
      matches: (u) => u.hostname.includes('greenhouse.io'),
      extract: (doc, u) => {
        const role = cleanJobTitle(queryFirstValid(doc, ['h1.app-title', '.job-name', 'h1']));
        let rawCompany = queryFirstValid(doc, ['.company-name', 'span.company-name']);
        if (!rawCompany && u) {
          const parts = u.pathname.split('/').filter(Boolean);
          if (parts.length >= 1 && parts[0] !== 'jobs') rawCompany = parts[0].replace(/-/g, ' ');
        }
        const company = cleanCompanyName(rawCompany);
        const location = cleanLocation(queryFirstValid(doc, ['.location', '[class*="location"]']));
        return { company, role, location, workMode: detectWorkMode(location || role), confidence: (company && role) ? 'high' : 'medium' };
      }
    },
    // Lever
    {
      id: 'lever',
      name: 'Lever',
      matches: (u) => u.hostname.includes('jobs.lever.co'),
      extract: (doc, u) => {
        const role = cleanJobTitle(queryFirstValid(doc, ['.posting-headline h2', 'h2']));
        let rawCompany = '';
        const logoEl = doc.querySelector('.main-header-logo img, .main-header img');
        if (logoEl && logoEl.getAttribute('alt')) rawCompany = logoEl.getAttribute('alt');
        if (!rawCompany && u) {
          const parts = u.pathname.split('/').filter(Boolean);
          if (parts.length >= 1) rawCompany = parts[0].replace(/-/g, ' ');
        }
        const company = cleanCompanyName(rawCompany);
        const location = cleanLocation(queryFirstValid(doc, ['.posting-categories .location', '.location']));
        return { company, role, location, workMode: detectWorkMode(location || role), confidence: (company && role) ? 'high' : 'medium' };
      }
    },
    // Workday
    {
      id: 'workday',
      name: 'Workday',
      matches: (u) => u.hostname.includes('myworkdayjobs.com'),
      extract: (doc, u) => {
        const role = cleanJobTitle(queryFirstValid(doc, ['[data-automation-id="jobPostingHeader"]', 'h1']));
        let rawCompany = '';
        const logoImg = doc.querySelector('header img[alt], [data-automation-id="companyLogo"]');
        if (logoImg && logoImg.getAttribute('alt')) rawCompany = logoImg.getAttribute('alt');
        if (!rawCompany && u) {
          const hostParts = u.hostname.split('.');
          if (hostParts.length >= 3) rawCompany = hostParts[0].replace(/-/g, ' ');
        }
        const company = cleanCompanyName(rawCompany);
        const location = cleanLocation(queryFirstValid(doc, ['[data-automation-id="locations"]', '[data-automation-id="location"]']));
        return { company, role, location, workMode: detectWorkMode(location || role), confidence: (company && role) ? 'high' : 'medium' };
      }
    },
    // Application Forms (Google Forms, Microsoft Forms, Typeform)
    {
      id: 'application_form',
      name: 'Application Form',
      matches: (u) => (
        (u.hostname.includes('docs.google.com') && u.pathname.includes('/forms')) ||
        u.hostname === 'forms.gle' ||
        u.hostname.includes('forms.office.com') ||
        u.hostname.includes('forms.microsoft.com') ||
        u.hostname.includes('typeform.com')
      ),
      extract: (doc, u) => {
        const fullText = (doc && doc.body) ? (doc.body.innerText || doc.body.textContent || '') : (doc ? (doc.innerText || doc.textContent || '') : '');
        const docTitle = doc ? (doc.title || '') : '';
        const headingText = queryFirstValid(doc, [
          '[role="heading"]',
          'h1',
          '.freebirdFormviewerViewHeaderTitle',
          '.F9vQvd',
          'div[dir="auto"]'
        ]);

        const compMatch = fullText.match(/(?:^|\n|\r)\s*(?:Company(?:\s+Name)?|Organization|Employer|Firm|Hiring\s+Company)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
        const roleMatch = fullText.match(/(?:^|\n|\r)\s*(?:Position|Role|Job\s*Title|Designation|Job\s*Role|Profile|Opening\s*for)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
        const locMatch = fullText.match(/(?:^|\n|\r)\s*(?:Location|Job\s*Location|Work\s*Location|Place\s*of\s*Posting|Venue|Base\s*Location|Office\s*Location)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
        const dateMatch = fullText.match(/(?:^|\n|\r)\s*(?:Date|Drive\s*Date|Interview\s*Date|Deadline|Application\s*Deadline|Last\s*Date(?:\s*to\s*apply)?)\s*[:\-–—]\s*([^\n\r\t•]+)/i);

        let company = compMatch ? cleanCompanyName(compMatch[1]) : '';
        let role = roleMatch ? cleanJobTitle(roleMatch[1]) : '';
        let location = locMatch ? cleanLocation(locMatch[1]) : '';

        const candidateHeading = headingText || docTitle;
        if (candidateHeading) {
          const parts = candidateHeading.split(/\s*[-|–—•·]\s*/);
          if (!company && parts.length >= 2) {
            const first = cleanCompanyName(parts[0]);
            const second = parts[1].trim();
            if (/registration|application|recruitment|drive|hiring/i.test(second)) {
              company = first;
            }
          }
          if (!role && parts.length >= 2) {
            const second = cleanJobTitle(parts[1]);
            if (!/registration|application|recruitment|drive|hiring/i.test(second)) {
              role = second;
            }
          }
        }

        return {
          company,
          role,
          location,
          deadline: dateMatch ? dateMatch[1].trim() : null,
          workMode: detectWorkMode(location || fullText),
          confidence: (company && role) ? 'high' : (company || role ? 'medium' : 'low')
        };
      }
    }
  ];

  function extractPlatformData(doc, urlStr) {
    try {
      const u = new URL(urlStr);
      for (const adapter of platformAdapters) {
        if (adapter.matches(u)) {
          const res = adapter.extract(doc, u);
          return { platform: adapter.id, platformName: adapter.name, result: res };
        }
      }
    } catch (_) {}
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. STRATEGY C: GENERIC DOM HEURISTICS
  // ═══════════════════════════════════════════════════════════════════════

  const NOISE_WORDS = new Set([
    'home', 'about', 'contact', 'login', 'sign in', 'sign up', 'register',
    'search', 'browse jobs', 'all jobs', 'open positions', 'careers',
    'privacy policy', 'terms of service', 'apply now', 'apply', 'share'
  ]);

  function isNoise(text) {
    if (!text) return true;
    const lower = text.trim().toLowerCase();
    return NOISE_WORDS.has(lower) || lower.length < 2;
  }

  function parseTitleHeuristics(title) {
    if (!title || typeof title !== 'string') return {};
    const cleaned = normalizeText(title);

    const atMatch = cleaned.match(/^(.*?)\s+(?:at|@)\s+(.*?)(?:\s*[-|–—•·]\s*(.*))?$/i);
    if (atMatch) {
      const r = cleanJobTitle(atMatch[1]);
      let c = atMatch[2];
      let l = atMatch[3] || '';
      if (c.includes('-') || c.includes('|')) {
        const parts = c.split(/\s*[-|–—•·]\s*/);
        c = parts[0];
        if (!l && parts[1]) l = parts[1];
      }
      c = cleanCompanyName(c);
      l = cleanLocation(l);
      if (r && c && !isNoise(r) && !isNoise(c)) {
        return { role: r, company: c, location: l };
      }
    }

    const parts = cleaned.split(/\s*[-|–—•·]\s*/).map(p => p.trim()).filter(p => !isNoise(p));
    if (parts.length >= 2) {
      const jobKeywordRegex = /\b(engineer|developer|designer|manager|lead|director|vp|head|analyst|associate|intern|specialist|consultant|architect)\b/i;
      if (jobKeywordRegex.test(parts[0])) {
        return { role: cleanJobTitle(parts[0]), company: cleanCompanyName(parts[1]), location: parts[2] ? cleanLocation(parts[2]) : '' };
      } else if (jobKeywordRegex.test(parts[1])) {
        return { company: cleanCompanyName(parts[0]), role: cleanJobTitle(parts[1]), location: parts[2] ? cleanLocation(parts[2]) : '' };
      }
    }

    return {};
  }

  function extractLogoAlt(doc) {
    const selectors = [
      'header a img[alt]', 'nav a img[alt]', 'a[class*="logo" i] img[alt]',
      'img[class*="logo" i][alt]', 'header img[alt]', 'nav img[alt]'
    ];
    for (const sel of selectors) {
      try {
        const imgs = doc.querySelectorAll(sel);
        for (let i = 0; i < imgs.length; i++) {
          const alt = imgs[i].getAttribute('alt');
          if (alt) {
            const cleaned = cleanCompanyName(alt);
            if (cleaned && !isNoise(cleaned) && cleaned.length > 1 && cleaned.length < 50) return cleaned;
          }
        }
      } catch (_) {}
    }
    return '';
  }

  function extractPrimaryHeading(doc) {
    const h1s = doc.querySelectorAll('h1');
    for (let i = 0; i < h1s.length; i++) {
      const txt = (h1s[i].textContent || '').trim();
      const cleaned = cleanJobTitle(txt);
      if (cleaned && !isNoise(cleaned) && cleaned.length > 2 && cleaned.length < 120) return cleaned;
    }
    return '';
  }

  function extractGenericLocation(doc) {
    const selectors = [
      '[class*="job-location" i]', '[class*="jobLocation" i]', '[class*="posting-location" i]',
      '[data-testid*="location" i]', '[class*="location" i]', '[id*="location" i]'
    ];
    for (const sel of selectors) {
      try {
        const elements = doc.querySelectorAll(sel);
        for (let i = 0; i < elements.length; i++) {
          const txt = (elements[i].textContent || '').trim();
          if (txt && txt.length > 2 && txt.length < 80) {
            const cleaned = cleanLocation(txt);
            if (cleaned && !isNoise(cleaned) && !/^(location|job location)$/i.test(cleaned)) return cleaned;
          }
        }
      } catch (_) {}
    }
    return '';
  }

  function extractKeyValuePairs(text) {
    if (!text || typeof text !== 'string') return {};
    const res = {};
    const compMatch = text.match(/(?:^|\n|\r)\s*(?:Company(?:\s+Name)?|Organization|Employer|Firm|Hiring\s+Company)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (compMatch) res.company = cleanCompanyName(compMatch[1]);

    const roleMatch = text.match(/(?:^|\n|\r)\s*(?:Position|Role|Job\s*Title|Designation|Job\s*Role|Profile|Opening\s*for)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (roleMatch) res.role = cleanJobTitle(roleMatch[1]);

    const locMatch = text.match(/(?:^|\n|\r)\s*(?:Location|Job\s*Location|Work\s*Location|Place\s*of\s*Posting|Venue|Base\s*Location|Office\s*Location)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (locMatch) res.location = cleanLocation(locMatch[1]);

    const dateMatch = text.match(/(?:^|\n|\r)\s*(?:Date|Drive\s*Date|Interview\s*Date|Deadline|Application\s*Deadline|Last\s*Date(?:\s*to\s*apply)?)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (dateMatch) res.deadline = dateMatch[1].trim();

    return res;
  }

  function extractGenericData(doc, url) {
    const docTitle = doc ? doc.title : '';
    const fullText = (doc && doc.body) ? (doc.body.innerText || doc.body.textContent || '') : (doc ? (doc.innerText || doc.textContent || '') : '');

    const kvPairs = extractKeyValuePairs(fullText);
    const titleParsed = parseTitleHeuristics(docTitle);
    const headingRole = extractPrimaryHeading(doc);
    const logoCompany = extractLogoAlt(doc);
    const genericLocation = extractGenericLocation(doc);

    const role = kvPairs.role || headingRole || titleParsed.role || '';
    const company = kvPairs.company || titleParsed.company || logoCompany || '';
    const location = kvPairs.location || genericLocation || titleParsed.location || '';
    const workMode = detectWorkMode((location || '') + ' ' + (role || '') + ' ' + (docTitle || '') + ' ' + (fullText.slice(0, 500)));

    let confidence = 'low';
    if (kvPairs.company && kvPairs.role) {
      confidence = 'high';
    } else if (role && company) {
      confidence = 'medium';
    }

    return {
      company,
      role,
      location,
      workMode,
      deadline: kvPairs.deadline || null,
      confidence,
      source: kvPairs.company || kvPairs.role ? 'Structured Page Text' : 'Generic DOM Heuristics'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. PAGE INTENT DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  const JOB_URL_PATTERNS = [
    /\/jobs?(?:$|\/|\?|#)/i, /\/careers?(?:$|\/|\?|#)/i, /\/viewjob/i, /\/job-listing/i,
    /\/positions?\//i, /\/openings?\//i, /\/vacanc(?:y|ies)\//i,
    /\/boards\.greenhouse\.io/i, /\/jobs\.lever\.co/i, /\/myworkdayjobs\.com/i,
    /\/wellfound\.com\/jobs/i, /\/indeed\.[a-z.]+\/(viewjob|jobs)/i,
    /\/linkedin\.com\/jobs/i, /\/glassdoor\.[a-z.]+\/job/i,
    /docs\.google\.com\/forms/i, /forms\.gle/i, /forms\.office\.com/i, /typeform\.com/i
  ];

  const JOB_CONTENT_KEYWORDS = [
    'apply now', 'job description', 'responsibilities', 'qualifications',
    'requirements', 'about the role', 'what you\'ll do', 'who you are',
    'years of experience', 'eligibility criteria', 'interview process',
    'campus recruitment', 'placement drive', 'coding test', 'stipend', 'ctc'
  ];

  function detectIsJobPage(doc, pageUrl) {
    let score = 0;
    if (JOB_URL_PATTERNS.some(p => p.test(pageUrl))) score += 35;
    const title = (doc && doc.title) ? doc.title.toLowerCase() : '';
    if (/job|career|hiring|position|vacancy|opening|work with us|recruitment|registration/i.test(title)) score += 15;

    const bodyText = (doc && (doc.body || doc)) ? ((doc.body ? (doc.body.innerText || doc.body.textContent) : '') || '').toLowerCase() : '';
    const sampledBody = bodyText.slice(0, 4000);
    let matched = 0;
    for (const kw of JOB_CONTENT_KEYWORDS) {
      if (sampledBody.includes(kw)) matched++;
    }
    score += Math.min(matched * 8, 35);

    const hasCompanyLabel = /(?:^|\n|\r)\s*(?:company(?:\s+name)?|organization|employer|firm)\s*[:\-–—]/i.test(sampledBody);
    const hasRoleLabel = /(?:^|\n|\r)\s*(?:position|role|job\s*title|designation|profile)\s*[:\-–—]/i.test(sampledBody);
    if (hasCompanyLabel && hasRoleLabel) {
      score += 50;
    }

    return score >= 25;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. MASTER ENGINE (STRATEGY D)
  // ═══════════════════════════════════════════════════════════════════════

  function extractJobDetails(doc, url) {
    const pageUrl = url || window.location.href;
    const isJobLikely = detectIsJobPage(doc, pageUrl);

    const structuredResult = extractStructuredData(doc, pageUrl);
    const platformResult = extractPlatformData(doc, pageUrl);
    const genericResult = extractGenericData(doc, pageUrl);

    const canonicalUrl = (structuredResult && structuredResult.metaTags && structuredResult.metaTags.canonicalUrl)
      ? structuredResult.metaTags.canonicalUrl
      : normalizeUrl(pageUrl);

    const fields = {
      companyName: null,
      role: null,
      location: null,
      jobLink: {
        value: canonicalUrl,
        confidence: 'high',
        source: 'Page URL'
      },
      workMode: null,
      employmentType: null,
      deadline: null,
      description: null
    };

    let detectedPlatform = platformResult ? platformResult.platformName : 'Generic Webpage';

    // Role precedence: A > B > C
    if (structuredResult && structuredResult.fields && structuredResult.fields.role && structuredResult.fields.role.value) {
      fields.role = structuredResult.fields.role;
    } else if (platformResult && platformResult.result && platformResult.result.role) {
      fields.role = {
        value: platformResult.result.role,
        confidence: platformResult.result.confidence || 'high',
        source: `${platformResult.platformName} Adapter`
      };
    } else if (genericResult && genericResult.role) {
      fields.role = {
        value: genericResult.role,
        confidence: genericResult.confidence || 'medium',
        source: genericResult.source || 'Generic DOM'
      };
    }

    // Company precedence: A > B > C
    if (structuredResult && structuredResult.fields && structuredResult.fields.companyName && structuredResult.fields.companyName.value) {
      fields.companyName = structuredResult.fields.companyName;
    } else if (platformResult && platformResult.result && platformResult.result.company) {
      fields.companyName = {
        value: platformResult.result.company,
        confidence: platformResult.result.confidence || 'high',
        source: `${platformResult.platformName} Adapter`
      };
    } else if (genericResult && genericResult.company) {
      fields.companyName = {
        value: genericResult.company,
        confidence: genericResult.confidence || 'medium',
        source: genericResult.source || 'Generic DOM'
      };
    }

    // Location precedence: A > B > C
    if (structuredResult && structuredResult.fields && structuredResult.fields.location && structuredResult.fields.location.value) {
      fields.location = structuredResult.fields.location;
    } else if (platformResult && platformResult.result && platformResult.result.location) {
      fields.location = {
        value: platformResult.result.location,
        confidence: 'medium',
        source: `${platformResult.platformName} Adapter`
      };
    } else if (genericResult && genericResult.location) {
      fields.location = {
        value: genericResult.location,
        confidence: 'low',
        source: 'DOM heuristics'
      };
    }

    // Optional metadata
    if (structuredResult && structuredResult.fields) {
      if (structuredResult.fields.workMode) fields.workMode = structuredResult.fields.workMode;
      if (structuredResult.fields.employmentType) fields.employmentType = structuredResult.fields.employmentType;
      if (structuredResult.fields.deadline) fields.deadline = structuredResult.fields.deadline;
      if (structuredResult.fields.description) fields.description = structuredResult.fields.description;
    }

    if (!fields.workMode && platformResult && platformResult.result && platformResult.result.workMode) {
      fields.workMode = {
        value: platformResult.result.workMode,
        confidence: 'medium',
        source: `${platformResult.platformName} Adapter`
      };
    } else if (!fields.workMode && genericResult && genericResult.workMode) {
      fields.workMode = {
        value: genericResult.workMode,
        confidence: 'low',
        source: 'Page text'
      };
    }

    if (!fields.deadline && platformResult && platformResult.result && platformResult.result.deadline) {
      fields.deadline = {
        value: platformResult.result.deadline,
        confidence: 'medium',
        source: `${platformResult.platformName} Adapter`
      };
    } else if (!fields.deadline && genericResult && genericResult.deadline) {
      fields.deadline = {
        value: genericResult.deadline,
        confidence: 'medium',
        source: 'Page text'
      };
    }

    const hasCompany = Boolean(fields.companyName && fields.companyName.value);
    const hasRole = Boolean(fields.role && fields.role.value);
    const hasLocation = Boolean(fields.location && fields.location.value);
    const hasJobPosting = Boolean(structuredResult && structuredResult.hasJobPosting);
    const isJobPage = Boolean(
      hasJobPosting ||
      platformResult ||
      isJobLikely ||
      (hasCompany && hasRole)
    );

    let status = 'not_job';
    let message = 'No job listing detected. You can enter the details manually.';

    if (!isJobPage) {
      fields.companyName = null;
      fields.role = null;
      fields.location = null;
      status = 'not_job';
      message = 'No job listing detected. You can enter the details manually.';
    } else if (hasCompany && hasRole) {
      status = 'success';
      message = 'Job details detected';
    } else if (hasCompany || hasRole || hasLocation) {
      status = 'partial';
      message = 'Some details need your review';
    } else {
      status = 'not_job';
      message = 'No job listing detected. You can enter the details manually.';
    }

    return {
      isJobPage,
      status,
      message,
      platform: detectedPlatform,
      fields
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. MESSAGE LISTENER
  // ═══════════════════════════════════════════════════════════════════════

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'ping') {
        sendResponse({ ok: true });
        return true;
      }

      if (request.action === 'extractPageDetails') {
        try {
          const result = extractJobDetails(document, window.location.href);
          sendResponse({ ok: true, data: result });
        } catch (err) {
          sendResponse({ ok: false, error: err.message });
        }
        return true;
      }

      return false;
    });
  }

  // Expose on window for direct access if needed
  window.PlacifyContentScript = {
    extractJobDetails
  };
})();
