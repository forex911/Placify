/**
 * Placify Extension — Strategy B: Platform-Specific Adapters
 * Universal module (works in Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const normalizer = require('./normalizer');
    module.exports = factory(normalizer);
  } else {
    root.PlacifyPlatformAdapters = factory(root.PlacifyNormalizer);
  }
})(typeof self !== 'undefined' ? self : this, function (normalizer) {
  'use strict';

  const {
    cleanCompanyName,
    cleanJobTitle,
    cleanLocation,
    normalizeText,
    detectWorkMode
  } = normalizer || {};

  // Safely query element text
  function queryText(root, selector) {
    if (!root || !root.querySelector) return '';
    try {
      const el = root.querySelector(selector);
      return el ? (el.textContent || el.innerText || '').trim() : '';
    } catch (_) {
      return '';
    }
  }

  // Safely query multiple elements and take the first valid non-empty
  function queryFirstValid(root, selectors) {
    for (const sel of selectors) {
      const txt = queryText(root, sel);
      if (txt) return txt;
    }
    return '';
  }

  // 1. LinkedIn Adapter
  const linkedInAdapter = {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    matches(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes('linkedin.com') && (u.pathname.includes('/jobs') || u.pathname.includes('/job/'));
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const role = cleanJobTitle(queryFirstValid(doc, [
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title',
        '.topcard__title',
        'h1.t-24',
        'h1[class*="job-title"]',
        '.jobs-search__job-details--container h1',
        'h1'
      ]));

      const rawCompany = queryFirstValid(doc, [
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name',
        '.topcard__org-name-link',
        'a[data-tracking-control-name*="company_name"]',
        '.jobs-search__job-details--container a[href*="/company/"]'
      ]);
      const company = cleanCompanyName(rawCompany);

      const location = cleanLocation(queryFirstValid(doc, [
        '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
        '.job-details-jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__workplace-type',
        '.topcard__flavor--bullet',
        '.jobs-unified-top-card__bullet'
      ]));

      const workMode = detectWorkMode(queryFirstValid(doc, [
        '.job-details-jobs-unified-top-card__workplace-type',
        '.jobs-unified-top-card__workplace-type',
        '.topcard__flavor--bullet'
      ]) || location || role);

      return {
        company,
        role,
        location,
        workMode,
        confidence: (company && role) ? 'high' : 'medium'
      };
    }
  };

  // 2. Indeed Adapter
  const indeedAdapter = {
    id: 'indeed',
    name: 'Indeed',
    matches(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes('indeed.') && (u.pathname.includes('/viewjob') || u.pathname.includes('/cmp/') || u.pathname.includes('/jobs') || u.searchParams.has('jk'));
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const role = cleanJobTitle(queryFirstValid(doc, [
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        '.jobsearch-JobInfoHeader-title',
        'h1[data-testid="simpler-jobTitle"]',
        'h1.jobsearch-JobInfoHeader-title',
        'h1'
      ]));

      const rawCompany = queryFirstValid(doc, [
        '[data-company-name="true"]',
        '[data-testid="inlineHeader-companyName"] a',
        '[data-testid="inlineHeader-companyName"]',
        '.jobsearch-CompanyInfoContainer a',
        '.jobsearch-InlineCompanyRating-companyHeader'
      ]);
      const company = cleanCompanyName(rawCompany);

      const location = cleanLocation(queryFirstValid(doc, [
        '[data-testid="job-location"]',
        '[data-testid="inlineHeader-companyLocation"]',
        '.jobsearch-JobInfoHeader-companyLocation',
        '#jobLocationText'
      ]));

      const workMode = detectWorkMode(location || role);

      return {
        company,
        role,
        location,
        workMode,
        confidence: (company && role) ? 'high' : 'medium'
      };
    }
  };

  // 3. Glassdoor Adapter
  const glassdoorAdapter = {
    id: 'glassdoor',
    name: 'Glassdoor',
    matches(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes('glassdoor.') && (u.pathname.includes('/Job/') || u.pathname.includes('/job-listing/'));
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const role = cleanJobTitle(queryFirstValid(doc, [
        '[data-test="job-title"]',
        '[class*="JobDetails_jobTitle"]',
        'h1.heading_Heading__',
        'h1'
      ]));

      const rawCompany = queryFirstValid(doc, [
        '[data-test="employer-name"]',
        '[class*="JobDetails_employerName"]',
        '[data-test="employer-short-name"]'
      ]);
      const company = cleanCompanyName(rawCompany);

      const location = cleanLocation(queryFirstValid(doc, [
        '[data-test="location"]',
        '[class*="JobDetails_location"]'
      ]));

      return {
        company,
        role,
        location,
        workMode: detectWorkMode(location || role),
        confidence: (company && role) ? 'high' : 'medium'
      };
    }
  };

  // 4. Wellfound (AngelList) Adapter
  const wellfoundAdapter = {
    id: 'wellfound',
    name: 'Wellfound',
    matches(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes('wellfound.com') || u.hostname.includes('angel.co');
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const role = cleanJobTitle(queryFirstValid(doc, [
        'h1[class*="styles_title"]',
        '[data-test="JobTitle"]',
        'h1'
      ]));

      const rawCompany = queryFirstValid(doc, [
        '[data-test="StartupName"]',
        'a[href^="/company/"][class*="styles_startup"]',
        '.startup-name',
        'h2[class*="styles_company"]'
      ]);
      const company = cleanCompanyName(rawCompany);

      const location = cleanLocation(queryFirstValid(doc, [
        '[data-test="Location"]',
        'span[class*="location"]',
        'span[class*="bullet"]'
      ]));

      return {
        company,
        role,
        location,
        workMode: detectWorkMode(location || role),
        confidence: (company && role) ? 'high' : 'medium'
      };
    }
  };

  // 5. Greenhouse Adapter
  const greenhouseAdapter = {
    id: 'greenhouse',
    name: 'Greenhouse',
    matches(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes('greenhouse.io');
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const role = cleanJobTitle(queryFirstValid(doc, [
        'h1.app-title',
        '.job-name',
        'h1'
      ]));

      let rawCompany = queryFirstValid(doc, [
        '.company-name',
        'span.company-name',
        '#header .company-name'
      ]);

      if (!rawCompany) {
        // Fallback: extract from URL path (e.g. boards.greenhouse.io/{company}/jobs/...)
        try {
          const u = new URL(url);
          const parts = u.pathname.split('/').filter(Boolean);
          if (parts.length >= 1 && parts[0] !== 'jobs') {
            rawCompany = parts[0].replace(/-/g, ' ');
          }
        } catch (_) {}
      }

      const company = cleanCompanyName(rawCompany);

      const location = cleanLocation(queryFirstValid(doc, [
        '.location',
        '[class*="location"]'
      ]));

      return {
        company,
        role,
        location,
        workMode: detectWorkMode(location || role),
        confidence: (company && role) ? 'high' : 'medium'
      };
    }
  };

  // 6. Lever Adapter
  const leverAdapter = {
    id: 'lever',
    name: 'Lever',
    matches(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes('jobs.lever.co');
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const role = cleanJobTitle(queryFirstValid(doc, [
        '.posting-headline h2',
        '.posting-headline h1',
        'h2'
      ]));

      let rawCompany = '';
      if (doc && doc.querySelector) {
        const logoEl = doc.querySelector('.main-header-logo img, .main-header img');
        if (logoEl && logoEl.getAttribute('alt')) {
          rawCompany = logoEl.getAttribute('alt');
        }
      }

      if (!rawCompany) {
        // Fallback: extract from URL path: jobs.lever.co/{company}/...
        try {
          const u = new URL(url);
          const parts = u.pathname.split('/').filter(Boolean);
          if (parts.length >= 1) {
            rawCompany = parts[0].replace(/-/g, ' ');
          }
        } catch (_) {}
      }

      const company = cleanCompanyName(rawCompany);

      const location = cleanLocation(queryFirstValid(doc, [
        '.posting-categories .location',
        '.posting-category.location',
        '.location'
      ]));

      return {
        company,
        role,
        location,
        workMode: detectWorkMode(location || role),
        confidence: (company && role) ? 'high' : 'medium'
      };
    }
  };

  // 7. Workday Adapter
  const workdayAdapter = {
    id: 'workday',
    name: 'Workday',
    matches(url) {
      try {
        const u = new URL(url);
        return u.hostname.includes('myworkdayjobs.com');
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const role = cleanJobTitle(queryFirstValid(doc, [
        '[data-automation-id="jobPostingHeader"]',
        'h1[data-automation-id="jobPostingHeader"]',
        'h2[data-automation-id="jobPostingHeader"]',
        'h1'
      ]));

      let rawCompany = '';
      if (doc && doc.querySelector) {
        const logoImg = doc.querySelector('header img[alt], [data-automation-id="companyLogo"]');
        if (logoImg && logoImg.getAttribute('alt')) {
          rawCompany = logoImg.getAttribute('alt');
        }
      }

      if (!rawCompany) {
        // Fallback: company subdomain: {company}.myworkdayjobs.com
        try {
          const u = new URL(url);
          const hostParts = u.hostname.split('.');
          if (hostParts.length >= 3) {
            rawCompany = hostParts[0].replace(/-/g, ' ');
          }
        } catch (_) {}
      }

      const company = cleanCompanyName(rawCompany);

      const location = cleanLocation(queryFirstValid(doc, [
        '[data-automation-id="locations"]',
        '[data-automation-id="location"]',
        '[data-automation-id="jobPostingLocations"]'
      ]));

      return {
        company,
        role,
        location,
        workMode: detectWorkMode(location || role),
        confidence: (company && role) ? 'high' : 'medium'
      };
    }
  };

  // 8. Application Form Adapter (Google Forms, Microsoft Forms, Typeform)
  const applicationFormAdapter = {
    id: 'application_form',
    name: 'Application Form',
    matches(url) {
      try {
        const u = new URL(url);
        return (
          (u.hostname.includes('docs.google.com') && u.pathname.includes('/forms')) ||
          u.hostname === 'forms.gle' ||
          u.hostname.includes('forms.office.com') ||
          u.hostname.includes('forms.microsoft.com') ||
          u.hostname.includes('typeform.com')
        );
      } catch (_) {
        return false;
      }
    },
    extract(doc, url) {
      const fullText = (doc && doc.body) ? (doc.body.innerText || doc.body.textContent || '') : (doc ? (doc.innerText || doc.textContent || '') : '');
      const docTitle = doc ? (doc.title || '') : '';

      // Look for form heading (Google Forms uses [role="heading"], .freebirdFormviewerViewHeaderTitle, h1)
      const headingText = queryFirstValid(doc, [
        '[role="heading"]',
        'h1',
        '.freebirdFormviewerViewHeaderTitle',
        '.F9vQvd',
        'div[dir="auto"]'
      ]);

      // 1. Key-value parsing from body text
      const compMatch = fullText.match(/(?:^|\n|\r)\s*(?:Company(?:\s+Name)?|Organization|Employer|Firm|Hiring\s+Company)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
      const roleMatch = fullText.match(/(?:^|\n|\r)\s*(?:Position|Role|Job\s*Title|Designation|Job\s*Role|Profile|Opening\s*for)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
      const locMatch = fullText.match(/(?:^|\n|\r)\s*(?:Location|Job\s*Location|Work\s*Location|Place\s*of\s*Posting|Venue|Base\s*Location|Office\s*Location)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
      const dateMatch = fullText.match(/(?:^|\n|\r)\s*(?:Date|Drive\s*Date|Interview\s*Date|Deadline|Application\s*Deadline|Last\s*Date(?:\s*to\s*apply)?)\s*[:\-–—]\s*([^\n\r\t•]+)/i);

      let company = compMatch ? cleanCompanyName(compMatch[1]) : '';
      let role = roleMatch ? cleanJobTitle(roleMatch[1]) : '';
      let location = locMatch ? cleanLocation(locMatch[1]) : '';

      // Fallback: parse heading or document title e.g. "Finastra - Registration"
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
  };

  const adapters = [
    linkedInAdapter,
    indeedAdapter,
    glassdoorAdapter,
    wellfoundAdapter,
    greenhouseAdapter,
    leverAdapter,
    workdayAdapter,
    applicationFormAdapter
  ];

  // Find adapter matching current page URL
  function getAdapter(url) {
    if (!url) return null;
    return adapters.find(a => a.matches(url)) || null;
  }

  // Run matching adapter extraction
  function extractPlatformData(doc, url) {
    const adapter = getAdapter(url);
    if (!adapter) return null;

    try {
      const result = adapter.extract(doc, url);
      return {
        platform: adapter.id,
        platformName: adapter.name,
        result
      };
    } catch (_) {
      return null;
    }
  }

  return {
    adapters,
    getAdapter,
    extractPlatformData,
    linkedInAdapter,
    indeedAdapter,
    glassdoorAdapter,
    wellfoundAdapter,
    greenhouseAdapter,
    leverAdapter,
    workdayAdapter,
    applicationFormAdapter
  };
});
