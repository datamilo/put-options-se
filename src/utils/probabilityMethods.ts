/**
 * Utility functions for handling probability method names.
 * Supports both old "PoW - " format and new format (effective January 2026).
 */

/**
 * Maps old probability method names to new names
 * Old format: "PoW - Method Name"
 * New format: "Method Name"
 */
const OLD_TO_NEW_METHOD_NAMES: Record<string, string> = {
  'PoW - Weighted Average': 'Weighted Average',
  'PoW - Bayesian Calibrated': 'Bayesian Calibrated',
  'PoW - Original Black-Scholes': 'Original Black-Scholes',
  'PoW - Bias Corrected': 'Bias Corrected',
  'PoW - Historical IV': 'Historical IV',
};

/**
 * Normalizes a probability method name to the new format.
 * Handles both old "PoW - " format and already-normalized names.
 *
 * Effective January 2026: CSV files changed from "PoW - Method Name"
 * format to just "Method Name". This function ensures backward compatibility
 * by converting old format names to the new normalized format.
 *
 * @param methodName - The method name to normalize (from CSV data)
 * @returns The normalized method name (without "PoW - " prefix)
 */
export const normalizeProbMethod = (methodName: string | undefined | null): string => {
  if (!methodName) return '';

  const trimmed = methodName.trim();

  // If it's in the old format, convert to new
  if (trimmed in OLD_TO_NEW_METHOD_NAMES) {
    return OLD_TO_NEW_METHOD_NAMES[trimmed];
  }

  // If it's already in new format or unknown, return as-is
  return trimmed;
};
