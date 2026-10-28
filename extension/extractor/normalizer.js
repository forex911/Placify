/**
 * Placify Extension — Normalization & Validation Utilities
 * Universal module (works in Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PlacifyNormalizer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Decode common HTML entities safely without DOM dependency
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
        try {
          return String.fromCharCode(parseInt(dec, 10));
        } catch (_) {
          return '';
        }
      });
  }

  // Strip any embedded HTML tags
  function stripHtmlTags(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, ' ');
  }

  // Generic text normalization (trim, collapse multi-whitespace & newlines)
  function normalizeText(str) {
    if (!str || typeof str !== 'string') return '';
    const stripped = stripHtmlTags(str);
    const decoded = decodeHtmlEntities(stripped);
    return decoded
      .replace(/[\r\n\t\f\v]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Common tracking query parameters to strip
  const TRACKING_PARAMS = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'ref',
    'refid',
    'trackingid',
    'trk',
    'trkcampaign',
    'fbclid',
    'gclid',
    'msclkid',
    'zanpid',
    'origin',
    'context',
    'position',
    'pagenum',
    'searchid',
    'jobhash'
  ]);

  // Safe and normalized URL
  function normalizeUrl(urlStr, baseUrl) {
    if (!urlStr || typeof urlStr !== 'string') return '';
    const trimmed = urlStr.trim();
    if (!trimmed) return '';

    // Reject dangerous or non-web schemes early
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

      // Remove tracking query parameters
      const searchParams = new URLSearchParams(parsed.search);
      const keysToDelete = [];
      for (const key of searchParams.keys()) {
        if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(k => searchParams.delete(k));

      parsed.search = searchParams.toString();
      // Remove trailing hash if empty or generic
      if (parsed.hash === '#' || parsed.hash === '#top') {
        parsed.hash = '';
      }

      return parsed.toString();
    } catch (_) {
      return '';
    }
  }

  function isSafeUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
      const parsed = new URL(urlStr);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // Clean company name
  function cleanCompanyName(name) {
    if (!name || typeof name !== 'string') return '';
    let cleaned = normalizeText(name);

    // Remove common branding artifacts and website suffixes
    cleaned = cleaned
      .replace(/\s*[-|–—•]\s*(Careers|Jobs|Job Board|Recruitment|Work With Us|LinkedIn|Indeed|Glassdoor|Wellfound|Lever|Greenhouse).*$/i, '')
      .replace(/^(Careers|Jobs|Job Opening|Working) at\s+/i, '')
      .replace(/\s+(Careers|Jobs|Recruitment)$/i, '')
      .replace(/\s*(?:,\s*)?(?:Inc\.?|LLC\.?|Ltd\.?|Corp\.?|Corporation|Co\.|GmbH|Pvt\.?\s*Ltd\.?)\s*$/i, '')
      .replace(/\s*Logo$/i, '')
      .replace(/\s*Company Logo$/i, '')
      .trim();

    // Check if cleaned name looks like a URL or email
    if (/^(https?:\/\/|[a-z0-9.-]+\.[a-z]{2,})/i.test(cleaned)) {
      try {
        const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
        cleaned = url.hostname.replace(/^www\./i, '').split('.')[0];
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      } catch (_) {
        // keep as is
      }
    }

    return cleaned;
  }

  // Clean job title / role
  function cleanJobTitle(title) {
    if (!title || typeof title !== 'string') return '';
    let cleaned = normalizeText(title);

    // Remove extraneous tags in title like "(m/f/d)", "(Remote)", "[Urgent]", "Job ID: 12345"
    cleaned = cleaned
      .replace(/\s*\((?:m\/f\/d|m\/w\/d|f\/m\/d|m\/f\/x|all genders?)\)/gi, '')
      .replace(/\s*\[(?:urgent|hiring|remote|hybrid|onsite|new)\]/gi, '')
      .replace(/\s*-\s*Job ID:?\s*[\w\d-]+/gi, '')
      .replace(/\s*Req(?:uisition)?\s*(?:ID)?:?\s*[\w\d-]+/gi, '')
      .replace(/\s*[-|–—•]\s*(?:Apply Now|Full[\s-]time|Part[\s-]time|Contract|Remote|Hybrid).*$/i, '')
      .trim();

    return cleaned;
  }

  // Clean location string
  function cleanLocation(loc) {
    if (!loc || typeof loc !== 'string') return '';
    let cleaned = normalizeText(loc);

    // Normalize telecommute / remote indicators
    if (/^telecommute$/i.test(cleaned) || /^remote$/i.test(cleaned)) {
      return 'Remote';
    }

    // Remove multiple consecutive commas or dangling punctuation
    cleaned = cleaned
      .replace(/,\s*,+/g, ',')
      .replace(/^[,\s-]+|[,\s-]+$/g, '')
      .trim();

    return cleaned;
  }

  // Determine work mode from text (Remote, Hybrid, On-site)
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

  return {
    normalizeText,
    cleanCompanyName,
    cleanJobTitle,
    cleanLocation,
    normalizeUrl,
    isSafeUrl,
    detectWorkMode,
    decodeHtmlEntities,
    stripHtmlTags
  };
});
