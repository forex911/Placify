/**
 * Placify Extension — Strategy C: Generic DOM & Heuristic Extractor
 * Universal module (works in Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const normalizer = require('./normalizer');
    module.exports = factory(normalizer);
  } else {
    root.PlacifyGenericExtractor = factory(root.PlacifyNormalizer);
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

  // Words that indicate non-job or noise text
  const NOISE_WORDS = new Set([
    'home', 'about', 'contact', 'login', 'sign in', 'sign up', 'register',
    'search', 'browse jobs', 'all jobs', 'open positions', 'careers',
    'privacy policy', 'terms of service', 'cookie policy', 'apply now',
    'apply', 'share', 'save job', 'back to jobs', 'view all'
  ]);

  function isNoise(text) {
    if (!text) return true;
    const lower = text.trim().toLowerCase();
    return NOISE_WORDS.has(lower) || lower.length < 2;
  }

  // Parse document title using common patterns: "Role at Company - Location", "Company - Role", etc.
  function parseTitleHeuristics(title) {
    if (!title || typeof title !== 'string') return {};
    const cleaned = normalizeText(title);

    // Pattern 1: "Role at/at the Company - Location" or "Role at Company"
    const atMatch = cleaned.match(/^(.*?)\s+(?:at|@)\s+(.*?)(?:\s*[-|–—•·]\s*(.*))?$/i);
    if (atMatch) {
      const candidateRole = cleanJobTitle(atMatch[1]);
      let candidateCompany = atMatch[2];
      let candidateLoc = atMatch[3] || '';

      if (candidateCompany.includes('-') || candidateCompany.includes('|')) {
        const subParts = candidateCompany.split(/\s*[-|–—•·]\s*/);
        candidateCompany = subParts[0];
        if (!candidateLoc && subParts[1]) candidateLoc = subParts[1];
      }

      candidateCompany = cleanCompanyName(candidateCompany);
      candidateLoc = cleanLocation(candidateLoc);

      if (candidateRole && candidateCompany && !isNoise(candidateRole) && !isNoise(candidateCompany)) {
        return {
          role: candidateRole,
          company: candidateCompany,
          location: candidateLoc
        };
      }
    }

    // Pattern 2: "Company is hiring a/an Role in Location"
    const hiringMatch = cleaned.match(/^(.*?)\s+(?:is\s+hiring|hiring(?:\s+for)?)\s+(?:a|an)?\s*(.*?)(?:\s+in\s+(.*))?$/i);
    if (hiringMatch) {
      return {
        company: cleanCompanyName(hiringMatch[1]),
        role: cleanJobTitle(hiringMatch[2]),
        location: cleanLocation(hiringMatch[3] || '')
      };
    }

    // Pattern 3: Split by delimiters: " - ", " | ", " • ", " – ", " — "
    const parts = cleaned.split(/\s*[-|–—•·]\s*/).map(p => p.trim()).filter(p => !isNoise(p));
    if (parts.length >= 2) {
      // Typically: [Role, Company] or [Company, Role] or [Role, Company, Location]
      // Check if first or second contains common job keywords like Engineer, Developer, Manager, Lead, Analyst, etc.
      const jobKeywordRegex = /\b(engineer|developer|designer|manager|lead|director|vp|head|officer|analyst|associate|intern|specialist|consultant|architect|coordinator|technician|writer|scientist|administrator)\b/i;

      if (jobKeywordRegex.test(parts[0])) {
        return {
          role: cleanJobTitle(parts[0]),
          company: cleanCompanyName(parts[1]),
          location: parts[2] ? cleanLocation(parts[2]) : ''
        };
      } else if (jobKeywordRegex.test(parts[1])) {
        return {
          company: cleanCompanyName(parts[0]),
          role: cleanJobTitle(parts[1]),
          location: parts[2] ? cleanLocation(parts[2]) : ''
        };
      }
    }

    return {};
  }

  // Extract company name from logo alt text
  function extractLogoAlt(doc) {
    if (!doc || !doc.querySelectorAll) return '';
    const logoSelectors = [
      'header a img[alt]',
      'nav a img[alt]',
      'a[class*="logo" i] img[alt]',
      'img[class*="logo" i][alt]',
      'header img[alt]',
      'nav img[alt]',
      '[class*="brand" i] img[alt]'
    ];

    for (const sel of logoSelectors) {
      try {
        const imgs = doc.querySelectorAll(sel);
        for (let i = 0; i < imgs.length; i++) {
          const alt = imgs[i].getAttribute('alt');
          if (alt) {
            const cleaned = cleanCompanyName(alt);
            if (cleaned && !isNoise(cleaned) && cleaned.length > 1 && cleaned.length < 50) {
              return cleaned;
            }
          }
        }
      } catch (_) {}
    }
    return '';
  }

  // Find the primary role heading (h1)
  function extractPrimaryHeading(doc) {
    if (!doc || !doc.querySelectorAll) return '';
    const h1s = doc.querySelectorAll('h1');
    for (let i = 0; i < h1s.length; i++) {
      const txt = (h1s[i].textContent || h1s[i].innerText || '').trim();
      const cleaned = cleanJobTitle(txt);
      if (cleaned && !isNoise(cleaned) && cleaned.length > 2 && cleaned.length < 120) {
        return cleaned;
      }
    }
    return '';
  }

  // Extract location from common location selectors or classes
  function extractGenericLocation(doc) {
    if (!doc || !doc.querySelectorAll) return '';
    const locSelectors = [
      '[class*="job-location" i]',
      '[class*="jobLocation" i]',
      '[class*="posting-location" i]',
      '[data-testid*="location" i]',
      '[class*="location" i]',
      '[id*="location" i]',
      'span[class*="city" i]',
      'span[class*="workplace" i]'
    ];

    for (const sel of locSelectors) {
      try {
        const elements = doc.querySelectorAll(sel);
        for (let i = 0; i < elements.length; i++) {
          const txt = (elements[i].textContent || elements[i].innerText || '').trim();
          if (txt && txt.length > 2 && txt.length < 80) {
            const cleaned = cleanLocation(txt);
            if (cleaned && !isNoise(cleaned) && !/^(location|job location)$/i.test(cleaned)) {
              return cleaned;
            }
          }
        }
      } catch (_) {}
    }
    return '';
  }

  // Extract structured key-value pairs from page body text (e.g. "Company: ...", "Position: ...", "Venue: ...")
  function extractKeyValuePairs(text) {
    if (!text || typeof text !== 'string') return {};
    const res = {};

    const compMatch = text.match(/(?:^|\n|\r)\s*(?:Company(?:\s+Name)?|Organization|Employer|Firm|Hiring\s+Company)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (compMatch) {
      res.company = cleanCompanyName(compMatch[1]);
    }

    const roleMatch = text.match(/(?:^|\n|\r)\s*(?:Position|Role|Job\s*Title|Designation|Job\s*Role|Profile|Opening\s*for)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (roleMatch) {
      res.role = cleanJobTitle(roleMatch[1]);
    }

    const locMatch = text.match(/(?:^|\n|\r)\s*(?:Location|Job\s*Location|Work\s*Location|Place\s*of\s*Posting|Venue|Base\s*Location|Office\s*Location)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (locMatch) {
      res.location = cleanLocation(locMatch[1]);
    }

    const dateMatch = text.match(/(?:^|\n|\r)\s*(?:Date|Drive\s*Date|Interview\s*Date|Deadline|Application\s*Deadline|Last\s*Date(?:\s*to\s*apply)?)\s*[:\-–—]\s*([^\n\r\t•]+)/i);
    if (dateMatch) {
      res.deadline = dateMatch[1].trim();
    }

    return res;
  }

  // Main Strategy C Extractor
  function extractGenericData(doc, url) {
    const docTitle = (doc && doc.title) ? doc.title : '';
    const fullText = (doc && doc.body) ? (doc.body.innerText || doc.body.textContent || '') : (doc ? (doc.innerText || doc.textContent || '') : '');

    const kvPairs = extractKeyValuePairs(fullText);
    const titleParsed = parseTitleHeuristics(docTitle);
    const headingRole = extractPrimaryHeading(doc);
    const logoCompany = extractLogoAlt(doc);
    const genericLocation = extractGenericLocation(doc);

    // Prioritize explicit Key-Values from page text over guesses
    const role = kvPairs.role || headingRole || titleParsed.role || '';
    const company = kvPairs.company || titleParsed.company || logoCompany || '';
    const location = kvPairs.location || genericLocation || titleParsed.location || '';
    const workMode = detectWorkMode((location || '') + ' ' + (role || '') + ' ' + (docTitle || '') + ' ' + (fullText.slice(0, 500)));

    // Compute confidence
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

  return {
    parseTitleHeuristics,
    extractLogoAlt,
    extractPrimaryHeading,
    extractGenericLocation,
    extractGenericData,
    isNoise
  };
});
