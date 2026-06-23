import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DocImageProps {
  src: string;
  alt: string;
}

export default function DocImage({ src, alt }: DocImageProps) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="my-4 flex items-center justify-center rounded-lg border border-dashed border-border bg-card-shield px-4 py-8 text-sm text-muted-foreground">
        {t('help.screenshotPending')}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="my-4 w-full rounded-lg border border-border"
    />
  );
}
