import React, { useState } from 'react';
import { Gender } from '../../game/models/types';
import { getPortraitUrl } from '../../game/utils/portraits';

interface IdolPortraitProps {
  gender: Gender;
  filename: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<IdolPortraitProps['size']>, string> = {
  xs: 'w-10 h-10',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-28 h-28',
};

export const IdolPortrait: React.FC<IdolPortraitProps> = ({
  gender,
  filename,
  alt,
  size = 'sm',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const src = getPortraitUrl(gender, filename);

  return (
    <div
      className={`${SIZE_CLASSES[size]} shrink-0 rounded-lg overflow-hidden border border-purple-300/30 bg-purple-950 flex items-center justify-center ${className}`}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover pixelated"
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="w-3/4 h-3/4 text-purple-300"
          aria-label={alt}
        >
          <rect x="7" y="4" width="10" height="9" rx="2" fill="currentColor" opacity="0.85" />
          <path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" fill="currentColor" opacity="0.6" />
        </svg>
      )}
    </div>
  );
};
