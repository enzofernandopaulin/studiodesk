import React, { useEffect, useState } from 'react';
import { createSignedStorageUrl } from '../../lib/storageRepository';

interface StorageAssetProps {
  reference?: string;
  children: (url: string | null, loading: boolean) => React.ReactNode;
  expiresIn?: number;
}

export const StorageAsset: React.FC<StorageAssetProps> = ({ reference, children, expiresIn = 3600 }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!reference) { setUrl(null); return; }
    setLoading(true);
    createSignedStorageUrl(reference, expiresIn)
      .then(value => { if (active) setUrl(value); })
      .catch(() => { if (active) setUrl(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reference, expiresIn]);

  return <>{children(url, loading)}</>;
};
