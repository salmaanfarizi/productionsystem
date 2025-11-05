/**
 * useSettings Hook - React hook for accessing dynamic settings from Google Sheets
 * This hook loads settings once and provides them to all components
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchSettings, clearSettingsCache, getDefaultSettings } from '../utils/settingsLoader';

/**
 * Custom hook to fetch and manage settings
 * @param {string} spreadsheetId - Google Sheets spreadsheet ID
 * @param {string} apiKey - Google Sheets API key (optional)
 * @returns {Object} - Settings object with loading and error states
 */
export function useSettings(spreadsheetId, apiKey = null) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    if (!spreadsheetId) {
      setError('No spreadsheet ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchSettings(spreadsheetId, apiKey);
      setSettings(data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message);
      // Use default settings on error
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId, apiKey]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Refresh settings (clear cache and reload)
   */
  const refreshSettings = useCallback(async () => {
    clearSettingsCache();
    await loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    refreshSettings
  };
}

/**
 * Get product types array for dropdown
 * @param {Object} settings - Settings object
 * @returns {Array<string>} - Array of product type names
 */
export function useProductTypes(settings) {
  if (!settings) return [];
  return settings.products.map(p => p.name);
}

/**
 * Get seed varieties for a product
 * @param {Object} settings - Settings object
 * @param {string} productType - Product type name
 * @returns {Array<string>} - Array of variety names
 */
export function useSeedVarieties(settings, productType) {
  if (!settings || !productType) return [];
  return settings.seedVarieties[productType] || [];
}

/**
 * Get sunflower sizes
 * @param {Object} settings - Settings object
 * @returns {Array<string>} - Array of size ranges
 */
export function useSunflowerSizes(settings) {
  if (!settings) return [];
  return settings.sunflowerSizes || [];
}

/**
 * Get regions for dropdown
 * @param {Object} settings - Settings object
 * @returns {Array<string>} - Array of region names
 */
export function useRegions(settings) {
  if (!settings) return [];
  return settings.regions.map(r => r.name);
}

/**
 * Get employees for dropdown
 * @param {Object} settings - Settings object
 * @returns {Array<string>} - Array of employee names
 */
export function useEmployees(settings) {
  if (!settings) return [];
  return settings.employees || [];
}

/**
 * Get bag types object
 * @param {Object} settings - Settings object
 * @returns {Object} - Bag types configuration
 */
export function useBagTypes(settings) {
  if (!settings) return {};
  return settings.bagTypes || {};
}

/**
 * Get diesel trucks
 * @param {Object} settings - Settings object
 * @returns {Array<Object>} - Array of truck configurations
 */
export function useDieselTrucks(settings) {
  if (!settings) return [];
  return settings.dieselTrucks || [];
}

/**
 * Get wastewater trucks
 * @param {Object} settings - Settings object
 * @returns {Array<Object>} - Array of truck configurations
 */
export function useWastewaterTrucks(settings) {
  if (!settings) return [];
  return settings.wastewaterTrucks || [];
}

/**
 * Get delivery routes
 * @param {Object} settings - Settings object
 * @returns {Array<Object>} - Array of route objects
 */
export function useRoutes(settings) {
  if (!settings) return [];
  return settings.routes || [];
}

/**
 * Get system configuration value
 * @param {Object} settings - Settings object
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value
 * @returns {*} - Configuration value
 */
export function useSystemConfig(settings, key, defaultValue = null) {
  if (!settings || !settings.systemConfig) return defaultValue;
  return settings.systemConfig[key] !== undefined
    ? settings.systemConfig[key]
    : defaultValue;
}

export default useSettings;
