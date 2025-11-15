// PostCSS configuration for Tailwind (ESM)
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import discardEmpty from 'postcss-discard-empty';
import discardComments from 'postcss-discard-comments';
import normalizeWhitespace from 'postcss-normalize-whitespace';

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    discardEmpty(),
    discardComments(),
    normalizeWhitespace(),
  ],
};

