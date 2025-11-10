/**
 * Configuration for ARS Inventory System v2.0
 * Update GOOGLE_SCRIPT_URL with your deployed Apps Script URL
 */

const CONFIG = {
  // Google Apps Script Web App URL
  // Get this from: Extensions > Apps Script > Deploy > New deployment
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby69Ngv7yflRCqkOOtRznWOtzcJDMLltSFGkdWMZmTyYYiYvBNZrIkmffXpcdQTrVqk/exec',

  // Heartbeat interval (ms) - how often to check if user is still active
  HEARTBEAT_INTERVAL: 15000, // 15 seconds

  // Polling interval (ms) - how often to check for updates from other users
  POLLING_INTERVAL: 5000, // 5 seconds

  // User ID for this session
  USER_ID: localStorage.getItem('userId') || generateUserId(),

  // Enable debug mode
  DEBUG: false
};

/**
 * Generate a unique user ID
 */
function generateUserId() {
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('userId', id);
  return id;
}

/**
 * Log debug messages
 */
function debugLog(...args) {
  if (CONFIG.DEBUG) {
    console.log('[ARS Inventory]', ...args);
  }
}
