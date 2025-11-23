import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseSheetData } from '../sheetsAPI.js';

// Note: readSheetData, writeSheetData, appendSheetData require environment variables
// and make actual API calls, so we test parseSheetData which is a pure function

describe('sheetsAPI', () => {
  describe('parseSheetData', () => {
    it('should convert sheet data to array of objects', () => {
      const rawData = [
        ['Name', 'Age', 'City'],
        ['Alice', '30', 'New York'],
        ['Bob', '25', 'Los Angeles']
      ];

      const result = parseSheetData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Name: 'Alice', Age: '30', City: 'New York' });
      expect(result[1]).toEqual({ Name: 'Bob', Age: '25', City: 'Los Angeles' });
    });

    it('should return empty array for empty data', () => {
      const result = parseSheetData([]);

      expect(result).toEqual([]);
    });

    it('should return empty array for null data', () => {
      const result = parseSheetData(null);

      expect(result).toEqual([]);
    });

    it('should return empty array for undefined data', () => {
      const result = parseSheetData(undefined);

      expect(result).toEqual([]);
    });

    it('should handle rows with missing values', () => {
      const rawData = [
        ['Name', 'Age', 'City'],
        ['Alice', '30'],  // Missing City
        ['Bob']           // Missing Age and City
      ];

      const result = parseSheetData(rawData);

      expect(result[0]).toEqual({ Name: 'Alice', Age: '30', City: '' });
      expect(result[1]).toEqual({ Name: 'Bob', Age: '', City: '' });
    });

    it('should handle single row (headers only)', () => {
      const rawData = [['Name', 'Age', 'City']];

      const result = parseSheetData(rawData);

      expect(result).toEqual([]);
    });

    it('should handle data with extra columns in rows', () => {
      const rawData = [
        ['Name', 'Age'],
        ['Alice', '30', 'Extra Value']  // Extra value should be ignored
      ];

      const result = parseSheetData(rawData);

      expect(result[0]).toEqual({ Name: 'Alice', Age: '30' });
      expect(result[0]).not.toHaveProperty('Extra Value');
    });

    it('should preserve numeric strings', () => {
      const rawData = [
        ['ID', 'Value'],
        ['001', '100.50']
      ];

      const result = parseSheetData(rawData);

      expect(result[0].ID).toBe('001');
      expect(result[0].Value).toBe('100.50');
    });

    it('should handle headers with special characters', () => {
      const rawData = [
        ['Product Name', 'Price ($)', 'Stock #'],
        ['Widget', '9.99', '100']
      ];

      const result = parseSheetData(rawData);

      expect(result[0]['Product Name']).toBe('Widget');
      expect(result[0]['Price ($)']).toBe('9.99');
      expect(result[0]['Stock #']).toBe('100');
    });

    it('should handle empty strings in data', () => {
      const rawData = [
        ['Name', 'Middle', 'Last'],
        ['John', '', 'Doe']
      ];

      const result = parseSheetData(rawData);

      expect(result[0].Middle).toBe('');
    });

    it('should handle large datasets', () => {
      const headers = ['Col1', 'Col2', 'Col3', 'Col4', 'Col5'];
      const rawData = [headers];

      // Add 100 rows
      for (let i = 0; i < 100; i++) {
        rawData.push([`R${i}C1`, `R${i}C2`, `R${i}C3`, `R${i}C4`, `R${i}C5`]);
      }

      const result = parseSheetData(rawData);

      expect(result).toHaveLength(100);
      expect(result[0].Col1).toBe('R0C1');
      expect(result[99].Col5).toBe('R99C5');
    });

    it('should handle unicode characters', () => {
      const rawData = [
        ['名前', '都市'],
        ['田中', '東京']
      ];

      const result = parseSheetData(rawData);

      expect(result[0]['名前']).toBe('田中');
      expect(result[0]['都市']).toBe('東京');
    });

    it('should handle date strings', () => {
      const rawData = [
        ['Date', 'Event'],
        ['2024-06-15', 'Meeting'],
        ['06/15/2024', 'Deadline']
      ];

      const result = parseSheetData(rawData);

      expect(result[0].Date).toBe('2024-06-15');
      expect(result[1].Date).toBe('06/15/2024');
    });
  });
});
