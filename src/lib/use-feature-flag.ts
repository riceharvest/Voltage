import { useState, useEffect } from 'react';
import { isFeatureEnabled, FeatureFlagContext, FeatureFlag } from './feature-flags';

/**
 * React hook for checking feature flag status
 */
export function useFeatureFlag(flagName: string, context?: FeatureFlagContext) {
  const [isEnabled, setIsEnabled] = useState(() => isFeatureEnabled(flagName, context));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check server-side feature flag status
    const checkFlag = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          name: flagName,
          ...(context?.userId && { userId: context.userId }),
          ...(context?.environment && { environment: context.environment })
        });

        const response = await fetch(`/api/feature-flags?${params}`);
        const data = await response.json();

        if (response.ok) {
          setIsEnabled(data.enabled);
        } else {
          console.warn(`Failed to check feature flag ${flagName}:`, data.error);
        }
      } catch (error) {
        console.warn(`Error checking feature flag ${flagName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    // Only check server-side if we have dynamic context
    if (context?.userId || context?.environment) {
      checkFlag();
    }
  }, [flagName, context?.userId, context?.environment]);

  return { isEnabled, loading };
}

/**
 * Hook for managing feature flags (admin functionality)
 */
export function useFeatureFlagManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/feature-flags');
      const data = await response.json();

      if (response.ok) {
        setFlags(data.flags);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateFlag = async (flag: FeatureFlag) => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flag),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchFlags(); // Refresh the list
        return { success: true, flag: data.flag };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const deleteFlag = async (flagName: string) => {
    try {
      const response = await fetch(`/api/feature-flags?name=${encodeURIComponent(flagName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await fetchFlags(); // Refresh the list
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  return {
    flags,
    loading,
    error,
    fetchFlags,
    createOrUpdateFlag,
    deleteFlag,
  };
}