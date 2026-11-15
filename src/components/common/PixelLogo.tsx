import React from 'react';
import { CompanyLogoStyle } from '../../game/models/types';

export const PixelCompanyLogo: React.FC<{
  style: CompanyLogoStyle;
  size?: number;
}> = ({ style, size = 34 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 rounded-lg bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 border border-purple-200/40 flex items-center justify-center shadow-md"
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="w-5 h-5 text-white fill-current">
        {style === 'Crown' && (
          <path d="M2 12h12v2H2v-2zm0-7l3 3 3-4 3 4 3-3v6H2V5z" />
        )}
        {style === 'Star' && (
          <path d="M8 1l2.1 4.6L15 6.3l-3.6 3.5.9 4.9L8 12.4 3.7 14.7l.9-4.9L1 6.3l4.9-.7L8 1z" />
        )}
        {style === 'Vinyl' && (
          <>
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="8" cy="8" r="2" />
          </>
        )}
        {style === 'Prism' && (
          <path d="M8 1L14 13H2L8 1zm0 4.2L5.3 11h5.4L8 5.2z" />
        )}
        {style === 'Spark' && (
          <path d="M8 1l1.5 5.5L15 8l-5.5 1.5L8 15l-1.5-5.5L1 8l5.5-1.5L8 1z" />
        )}
        {style === 'Wave' && (
          <path d="M2 10h2V6H2v4zm3 2h2V4H5v8zm3-1h2V5H8v6zm3 3h2V2h-2v12z" />
        )}
      </svg>
    </div>
  );
};
