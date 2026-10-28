/**
 * Placify Extension — Page Intent & Type Detector
 * Universal module (works in Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PlacifyPageDetector = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Common URL patterns for job pages
  const JOB_URL_PATTERNS = [
    /\/jobs?(?:$|\/|\?|#)/i,
    /\/careers?(?:$|\/|\?|#)/i,
    /\/viewjob/i,
    /\/job-listing/i,
    /\/positions?(?:$|\/|\?|#)/i,
    /\/openings?(?:$|\/|\?|#)/i,
    /\/vacanc(?:y|ies)(?:$|\/|\?|#)/i,
    /\/work-with-us/i,
    /\/boards\.greenhouse\.io/i,
    /\/jobs\.lever\.co/i,
    /\/myworkdayjobs\.com/i,
    /\/wellfound\.com\/jobs/i,
    /\/indeed\.[a-z.]+\/(viewjob|jobs)/i,
    /\/linkedin\.com\/jobs/i,
    /\/glassdoor\.[a-z.]+\/job/i,
    /docs\.google\.com\/forms/i,
    /forms\.gle/i,
    /forms\.office\.com/i,
    /typeform\.com/i
  ];

  // Common keywords in job descriptions
  const JOB_CONTENT_KEYWORDS = [
    'apply now',
    'job description',
    'responsibilities',
    'qualifications',
    'requirements',
    'about the role',
    'what you\'ll do',
    'who you are',
    'benefits & perks',
    'equal opportunity employer',
    'years of experience',
    'eligibility criteria',
    'interview process',
    'campus recruitment',
    'placement drive',
    'coding test',
    'stipend',
    'ctc'
  ];

  // Hackathon indicators
  const HACKATHON_URL_PATTERNS = [
    /devpost\.com/i,
    /unstop\.com/i,
    /hackerearth\.com\/challenges/i,
    /mlh\.io/i,
    /hackathon/i
  ];

  /**
   * Assess page context and intent
   */
  function detectPageType(doc, url) {
    let jobScore = 0;
    let hackathonScore = 0;

    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const title = (doc && doc.title) ? doc.title.toLowerCase() : '';
    const bodyText = (doc && (doc.body || doc)) ? ((doc.body ? (doc.body.innerText || doc.body.textContent) : '') || '').toLowerCase() : '';

    // 1. URL pattern check
    if (JOB_URL_PATTERNS.some(p => p.test(pageUrl))) {
      jobScore += 35;
    }
    if (HACKATHON_URL_PATTERNS.some(p => p.test(pageUrl))) {
      hackathonScore += 45;
    }

    // 2. Title check
    if (/job|career|hiring|position|vacancy|opening|work with us|recruitment|registration/i.test(title)) {
      jobScore += 15;
    }
    if (/hackathon|coding challenge|hack/i.test(title)) {
      hackathonScore += 25;
    }

    // 3. Body text check
    const sampledBody = bodyText.slice(0, 4000);
    let matchedKeywords = 0;
    for (const kw of JOB_CONTENT_KEYWORDS) {
      if (sampledBody.includes(kw)) {
        matchedKeywords++;
      }
    }
    jobScore += Math.min(matchedKeywords * 8, 35);

    // 4. Structured key-value detection in body (e.g. "Company: X" and "Position: Y")
    const hasCompanyLabel = /(?:^|\n|\r)\s*(?:company(?:\s+name)?|organization|employer|firm)\s*[:\-–—]/i.test(sampledBody);
    const hasRoleLabel = /(?:^|\n|\r)\s*(?:position|role|job\s*title|designation|profile)\s*[:\-–—]/i.test(sampledBody);
    if (hasCompanyLabel && hasRoleLabel) {
      jobScore += 50;
    }

    if (sampledBody.includes('hackathon') || sampledBody.includes('register team') || sampledBody.includes('submission deadline')) {
      hackathonScore += 25;
    }

    const isJob = jobScore >= 25;
    const isHackathon = hackathonScore >= 35 && hackathonScore > jobScore;

    let pageType = 'unknown';
    if (isHackathon) pageType = 'hackathon';
    else if (isJob) pageType = 'job';

    return {
      pageType,
      isJobPage: isJob,
      isHackathonPage: isHackathon,
      jobScore,
      hackathonScore
    };
  }

  return {
    detectPageType,
    JOB_URL_PATTERNS,
    JOB_CONTENT_KEYWORDS
  };
});
