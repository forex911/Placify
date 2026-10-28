/**
 * Placify Extension — Storage & Duplicate Detection Helper
 * Universal module (works in Browser & Node.js)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const normalizer = require('./normalizer');
    module.exports = factory(normalizer);
  } else {
    root.PlacifyStorageHelper = factory(root.PlacifyNormalizer);
  }
})(typeof self !== 'undefined' ? self : this, function (normalizer) {
  'use strict';

  const { normalizeUrl } = normalizer || {};
  const STORAGE_KEY = 'saved_applications';
  const MAX_HISTORY = 100;

  // In-memory fallback storage for environments without chrome.storage (e.g. testing)
  const memoryStore = {};

  async function getStorageItem(key) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (res) => {
          resolve(res ? res[key] : null);
        });
      });
    }
    return memoryStore[key] || null;
  }

  async function setStorageItem(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve(true));
      });
    }
    memoryStore[key] = value;
    return true;
  }

  // Backward-compatible migration logic for existing saved applications
  function migrateRecord(record) {
    if (!record) return null;
    // Legacy format might be just strings or different keys
    if (typeof record === 'string') {
      return {
        companyName: record,
        role: '',
        location: '',
        companyLink: '',
        savedAt: Date.now()
      };
    }

    return {
      id: record.id || `app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      companyName: record.companyName || record.company || '',
      role: record.role || record.title || '',
      location: record.location || '',
      companyLink: record.companyLink || record.link || record.url || '',
      canonicalUrl: normalizeUrl ? normalizeUrl(record.companyLink || record.link || record.url || '') : (record.companyLink || ''),
      savedAt: record.savedAt || record.date || Date.now()
    };
  }

  // Get list of saved applications
  async function getSavedApplications() {
    const raw = await getStorageItem(STORAGE_KEY);
    if (!raw) return [];
    if (!Array.isArray(raw)) return [];
    return raw.map(migrateRecord).filter(Boolean);
  }

  // Record an application save
  async function recordSavedApplication(app) {
    if (!app || !app.companyName || !app.role) return false;
    const history = await getSavedApplications();

    const newRecord = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      companyName: app.companyName.trim(),
      role: app.role.trim(),
      location: (app.location || '').trim(),
      companyLink: (app.companyLink || '').trim(),
      canonicalUrl: normalizeUrl ? normalizeUrl(app.companyLink || '') : (app.companyLink || '').trim(),
      savedAt: Date.now()
    };

    // Prepend to list
    const updated = [newRecord, ...history].slice(0, MAX_HISTORY);
    await setStorageItem(STORAGE_KEY, updated);
    return newRecord;
  }

  // Check if this application was already saved
  async function checkDuplicate(companyName, role, companyLink) {
    const history = await getSavedApplications();
    if (!history || history.length === 0) {
      return { isDuplicate: false, matchedRecord: null };
    }

    const normCompany = (companyName || '').trim().toLowerCase();
    const normRole = (role || '').trim().toLowerCase();
    const normLink = normalizeUrl ? normalizeUrl(companyLink || '') : (companyLink || '').trim().toLowerCase();

    for (const item of history) {
      const itemCompany = (item.companyName || '').trim().toLowerCase();
      const itemRole = (item.role || '').trim().toLowerCase();
      const itemLink = item.canonicalUrl || (normalizeUrl ? normalizeUrl(item.companyLink || '') : (item.companyLink || '').trim().toLowerCase());

      // Case 1: Exact canonical job URL match
      if (normLink && itemLink && normLink === itemLink) {
        return {
          isDuplicate: true,
          reason: 'same_link',
          matchedRecord: item
        };
      }

      // Case 2: Matching company and role
      if (normCompany && normRole && itemCompany === normCompany && itemRole === normRole) {
        return {
          isDuplicate: true,
          reason: 'same_company_role',
          matchedRecord: item
        };
      }
    }

    return { isDuplicate: false, matchedRecord: null };
  }

  // Reset or clear store (for testing)
  function _clearMemoryStore() {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  }

  return {
    getSavedApplications,
    recordSavedApplication,
    checkDuplicate,
    migrateRecord,
    _clearMemoryStore
  };
});
