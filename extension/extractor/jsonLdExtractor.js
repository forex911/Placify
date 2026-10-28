/**
 * Placify Extension — Strategy A: Structured Metadata & JSON-LD Extractor
 * Universal module (works in Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const normalizer = require('./normalizer');
    module.exports = factory(normalizer);
  } else {
    root.PlacifyJsonLdExtractor = factory(root.PlacifyNormalizer);
  }
})(typeof self !== 'undefined' ? self : this, function (normalizer) {
  'use strict';

  const {
    cleanCompanyName,
    cleanJobTitle,
    cleanLocation,
    normalizeText,
    normalizeUrl,
    detectWorkMode
  } = normalizer || {};

  // Check if @type represents a JobPosting
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

  // Flatten and recursively find all JobPosting objects in any structure (object, array, @graph)
  function findJobPostings(data, found = []) {
    if (!data) return found;

    if (Array.isArray(data)) {
      for (const item of data) {
        findJobPostings(item, found);
      }
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

  // Format jobLocation from Schema.org representation
  function formatJobLocation(jobLocation, jobLocationType) {
    if (!jobLocation && !jobLocationType) return '';

    // Handle jobLocationType (e.g. TELECOMMUTE)
    const isTelecommute = typeof jobLocationType === 'string' &&
      (jobLocationType.toUpperCase().includes('TELECOMMUTE') || jobLocationType.toUpperCase().includes('REMOTE'));

    if (!jobLocation) {
      return isTelecommute ? 'Remote' : '';
    }

    // If array of locations, take the first one or primary
    const loc = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation;
    if (!loc) return isTelecommute ? 'Remote' : '';

    if (typeof loc === 'string') {
      const cleaned = cleanLocation(loc);
      return isTelecommute && !cleaned.toLowerCase().includes('remote') ? `${cleaned} (Remote)` : cleaned;
    }

    if (typeof loc === 'object') {
      // Could be PostalAddress directly or Place with address
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

      // If place name is specified
      if (loc.name && typeof loc.name === 'string') {
        return cleanLocation(loc.name);
      }
    }

    return isTelecommute ? 'Remote' : '';
  }

  // Extract hiring organization name
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

  // Parse Open Graph & meta tags from DOM document
  function extractMetaTags(doc, currentUrl) {
    if (!doc) return {};
    const meta = {};

    const getMetaContent = (nameOrProp) => {
      const el = doc.querySelector(`meta[property="${nameOrProp}" i], meta[name="${nameOrProp}" i]`);
      return el ? el.getAttribute('content') : null;
    };

    const ogTitle = getMetaContent('og:title') || getMetaContent('twitter:title');
    const ogSiteName = getMetaContent('og:site_name');
    const ogUrl = getMetaContent('og:url');
    const ogDesc = getMetaContent('og:description') || getMetaContent('description');
    const author = getMetaContent('author');

    const canonicalEl = doc.querySelector('link[rel="canonical" i]');
    const canonicalUrl = canonicalEl ? canonicalEl.getAttribute('href') : null;

    if (ogTitle) meta.ogTitle = normalizeText(ogTitle);
    if (ogSiteName) meta.siteName = cleanCompanyName(ogSiteName);
    if (author) meta.author = cleanCompanyName(author);
    if (ogDesc) meta.description = normalizeText(ogDesc);
    if (canonicalUrl || ogUrl) {
      meta.canonicalUrl = normalizeUrl(canonicalUrl || ogUrl, currentUrl);
    }

    return meta;
  }

  /**
   * Main Strategy A Extractor
   * @param {Document|Object} docOrRoot - DOM Document or simulated root with querySelectorAll
   * @param {string} pageUrl - The current tab's URL
   */
  function extractStructuredData(docOrRoot, pageUrl) {
    if (!docOrRoot) return null;

    const scripts = docOrRoot.querySelectorAll ? docOrRoot.querySelectorAll('script[type="application/ld+json"]') : [];
    const allJobPostings = [];

    for (let i = 0; i < scripts.length; i++) {
      const text = (scripts[i].textContent || scripts[i].innerText || '').trim();
      if (!text) continue;

      try {
        const parsed = JSON.parse(text);
        findJobPostings(parsed, allJobPostings);
      } catch (_) {
        // Gracefully ignore malformed JSON-LD scripts
      }
    }

    const metaTags = extractMetaTags(docOrRoot, pageUrl);

    if (allJobPostings.length === 0) {
      // No valid JobPosting found, return meta tags if any
      return {
        hasJobPosting: false,
        metaTags,
        jobPosting: null
      };
    }

    // Select the best JobPosting (most complete)
    let bestPosting = allJobPostings[0];
    for (const posting of allJobPostings) {
      const currentScore = (posting.title ? 2 : 0) + (posting.hiringOrganization ? 2 : 0) + (posting.jobLocation ? 1 : 0);
      const bestScore = (bestPosting.title ? 2 : 0) + (bestPosting.hiringOrganization ? 2 : 0) + (bestPosting.jobLocation ? 1 : 0);
      if (currentScore > bestScore) {
        bestPosting = posting;
      }
    }

    // Extract fields
    const rawRole = bestPosting.title || bestPosting.jobTitle || bestPosting.name || '';
    const role = cleanJobTitle(rawRole);

    const rawCompany = extractOrganizationName(bestPosting.hiringOrganization) ||
      extractOrganizationName(bestPosting.publisher) ||
      metaTags.siteName || '';
    const company = cleanCompanyName(rawCompany);

    const location = formatJobLocation(bestPosting.jobLocation, bestPosting.jobLocationType);

    const jobUrl = normalizeUrl(bestPosting.url || metaTags.canonicalUrl || pageUrl, pageUrl);

    // Additional optional metadata
    let employmentType = null;
    if (bestPosting.employmentType) {
      const emp = Array.isArray(bestPosting.employmentType) ? bestPosting.employmentType[0] : bestPosting.employmentType;
      if (typeof emp === 'string') {
        employmentType = normalizeText(emp.replace(/_/g, ' '));
      }
    }

    let deadline = null;
    if (bestPosting.validThrough && typeof bestPosting.validThrough === 'string') {
      try {
        const d = new Date(bestPosting.validThrough);
        if (!isNaN(d.getTime())) {
          deadline = d.toISOString().split('T')[0];
        }
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

  return {
    extractStructuredData,
    formatJobLocation,
    extractOrganizationName,
    extractMetaTags,
    isJobPostingType,
    findJobPostings
  };
});
