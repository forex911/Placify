/**
 * Placify Extension — Strategy D: Unified Context-Aware Job Extraction Engine
 * Universal module (works in Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const normalizer = require('./normalizer');
    const jsonLdExtractor = require('./jsonLdExtractor');
    const platformAdapters = require('./platformAdapters');
    const genericExtractor = require('./genericExtractor');
    const pageDetector = require('./pageDetector');
    module.exports = factory(normalizer, jsonLdExtractor, platformAdapters, genericExtractor, pageDetector);
  } else {
    root.PlacifyJobExtractor = factory(
      root.PlacifyNormalizer,
      root.PlacifyJsonLdExtractor,
      root.PlacifyPlatformAdapters,
      root.PlacifyGenericExtractor,
      root.PlacifyPageDetector
    );
  }
})(typeof self !== 'undefined' ? self : this, function (
  normalizer,
  jsonLdExtractor,
  platformAdapters,
  genericExtractor,
  pageDetector
) {
  'use strict';

  const {
    cleanCompanyName,
    cleanJobTitle,
    cleanLocation,
    normalizeUrl
  } = normalizer || {};

  /**
   * Main Context-Aware Page Extraction Function
   * @param {Document|Object} doc - Current page DOM document
   * @param {string} url - Current page URL
   */
  function extractJobDetails(doc, url) {
    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    // Check if page can be accessed or is null/empty
    if (!doc) {
      return {
        isJobPage: false,
        status: 'error',
        message: 'Could not access page DOM',
        fields: {
          jobLink: {
            value: normalizeUrl(pageUrl),
            confidence: 'high',
            source: 'Tab URL'
          }
        }
      };
    }

    // Step 1: Detect page intent and likelihood
    const pageTypeInfo = pageDetector ? pageDetector.detectPageType(doc, pageUrl) : { isJobPage: true };

    // Step 2: Strategy A — Structured Metadata (JSON-LD & Open Graph)
    let structuredResult = null;
    if (jsonLdExtractor) {
      structuredResult = jsonLdExtractor.extractStructuredData(doc, pageUrl);
    }

    // Step 3: Strategy B — Platform-Specific Adapters
    let platformResult = null;
    if (platformAdapters) {
      platformResult = platformAdapters.extractPlatformData(doc, pageUrl);
    }

    // Step 4: Strategy C — Generic DOM Heuristics
    let genericResult = null;
    if (genericExtractor) {
      genericResult = genericExtractor.extractGenericData(doc, pageUrl);
    }

    // Canonical / sanitized page URL
    const canonicalUrl = (structuredResult && structuredResult.metaTags && structuredResult.metaTags.canonicalUrl)
      ? structuredResult.metaTags.canonicalUrl
      : normalizeUrl(pageUrl);

    // Step 5: Synthesize fields with precedence Strategy A > Strategy B > Strategy C
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

    // ── Field: Role ──
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

    // ── Field: Company Name ──
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

    // ── Field: Location ──
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

    // ── Extra metadata (WorkMode, EmploymentType, Deadline, Description) ──
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

    // Step 6: Determine overall extraction state (States A-E)
    const hasCompany = Boolean(fields.companyName && fields.companyName.value);
    const hasRole = Boolean(fields.role && fields.role.value);
    const hasLocation = Boolean(fields.location && fields.location.value);
    const hasJobPosting = Boolean(structuredResult && structuredResult.hasJobPosting);
    const isJobPage = Boolean(
      hasJobPosting ||
      platformResult ||
      (pageTypeInfo && pageTypeInfo.isJobPage) ||
      (hasCompany && hasRole)
    );

    let status = 'not_job';
    let message = 'No job listing detected. You can enter the details manually.';

    if (!isJobPage) {
      // Rule: Do not populate the form with unrelated page content on non-job pages
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

  return {
    extractJobDetails
  };
});
