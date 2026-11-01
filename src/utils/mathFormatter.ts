/**
 * Mathematical Formula Parser and Cleaner for Kurikulum Merdeka Exam Questions.
 * Converts LaTeX math expressions, markdown math symbols, and raw formula codes
 * into clean, standard, highly legible mathematical typography (Unicode & clean notation)
 * suitable for both Microsoft Word (.docx F4) and Web/PDF previews without confusing codes.
 */

// Mapping of single digits & characters to Unicode superscripts
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  'n': 'ⁿ',
  'i': 'ⁱ',
  'x': 'ˣ',
  'y': 'ʸ',
  'a': 'ᵃ',
  'b': 'ᵇ',
  'c': 'ᶜ',
  'm': 'ᵐ',
  't': 'ᵗ',
};

// Mapping of single digits & characters to Unicode subscripts
const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  'a': 'ₐ',
  'e': 'ₑ',
  'o': 'ₒ',
  'x': 'ₓ',
  'i': 'ᵢ',
  'j': 'ⱼ',
  'k': 'ₖ',
  'n': 'ₙ',
  'm': 'ₘ',
  'p': 'ₚ',
  't': 'ₜ',
};

// Standard Unicode vulgar fractions
const VULGAR_FRACTIONS: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
  '1/7': '⅐',
  '1/9': '⅑',
  '1/10': '⅒',
};

/**
 * Convert string to superscript if all characters are mappable,
 * otherwise return formatted as ^(expr)
 */
export function toSuperscript(str: string): string {
  const trimmed = str.trim();
  if (trimmed === 'circ' || trimmed === '\\circ' || trimmed === 'o') {
    return '°';
  }
  let result = '';
  for (const char of trimmed) {
    if (SUPERSCRIPT_MAP[char]) {
      result += SUPERSCRIPT_MAP[char];
    } else {
      // If any character cannot be mapped to superscript, fallback to clean ^(...) or original
      return `^(${trimmed})`;
    }
  }
  return result;
}

/**
 * Convert string to subscript if all characters are mappable,
 * otherwise return formatted as _(expr)
 */
export function toSubscript(str: string): string {
  const trimmed = str.trim();
  let result = '';
  for (const char of trimmed) {
    if (SUBSCRIPT_MAP[char]) {
      result += SUBSCRIPT_MAP[char];
    } else {
      return `_(${trimmed})`;
    }
  }
  return result;
}

/**
 * Convert a numerator and denominator pair into clean mathematical fraction
 */
export function formatFraction(numerator: string, denominator: string): string {
  const num = numerator.trim();
  const den = denominator.trim();

  // Check if it's a known vulgar fraction e.g. 1/2 -> ½
  const key = `${num}/${den}`;
  if (VULGAR_FRACTIONS[key]) {
    return VULGAR_FRACTIONS[key];
  }

  // Check if simple single-number fraction e.g. 5/2 -> ⁵/₂
  const isSimpleNum = /^[0-9]+$/.test(num) && num.length <= 2;
  const isSimpleDen = /^[0-9]+$/.test(den) && den.length <= 2;
  if (isSimpleNum && isSimpleDen) {
    const sup = num
      .split('')
      .map((c) => SUPERSCRIPT_MAP[c] || c)
      .join('');
    const sub = den
      .split('')
      .map((c) => SUBSCRIPT_MAP[c] || c)
      .join('');
    return `${sup}/${sub}`;
  }

  // If numerator or denominator contains complex expressions (operators), wrap in parentheses
  const wrapNum = /[+\-=<>]/.test(num) && !num.startsWith('(') ? `(${num})` : num;
  const wrapDen = /[+\-=<>]/.test(den) && !den.startsWith('(') ? `(${den})` : den;

  return `${wrapNum} / ${wrapDen}`;
}

/**
 * Master function: transforms raw LaTeX math strings and symbols
 * into clean, natural mathematical typography.
 */
export function formatMathToCleanText(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Remove outer math delimiters e.g. $$...$$ or $...$
  // First handle display math $$...$$
  text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '$1');
  // Handle LaTeX bracket delimiters \[ ... \] and \( ... \)
  text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$1');
  text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$1');

  // Handle single $...$ inline math delimiters
  // We match $...$ where it does not look like currency (e.g. not followed by numbers only like $50)
  text = text.replace(/\$([^\$\n]+?)\$/g, '$1');

  // 2. Unescape common LaTeX text wrappers
  // e.g. \text{cm}, \mathrm{kg}, \mathbf{x}, \mathit{y}
  let prevText = '';
  while (prevText !== text) {
    prevText = text;
    text = text.replace(/\\(text|mathrm|mathbf|mathit|textbf|textit|operatorname)\{([^{}]*)\}/g, '$2');
  }

  // 3. Spacing LaTeX commands
  text = text.replace(/\\(quad|qquad)/g, '   ');
  text = text.replace(/\\[,;:!]/g, ' ');

  // 4. Fractions: \frac{a}{b} and \dfrac{a}{b} and \tfrac{a}{b}
  // Run repeatedly to handle nested fractions from inside out
  prevText = '';
  while (prevText !== text) {
    prevText = text;
    text = text.replace(/\\(d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, _type, num, den) => {
      return formatFraction(num, den);
    });
  }

  // 5. Roots: \sqrt[n]{x} and \sqrt{x}
  prevText = '';
  while (prevText !== text) {
    prevText = text;
    // N-th root e.g. \sqrt[3]{27} -> ∛27
    text = text.replace(/\\sqrt\[3\]\{([^{}]+)\}/g, '∛($1)');
    text = text.replace(/\\sqrt\[4\]\{([^{}]+)\}/g, '∜($1)');
    text = text.replace(/\\sqrt\[([0-9a-zA-Z]+)\]\{([^{}]+)\}/g, (_, n, val) => {
      const supN = toSuperscript(n);
      return `${supN}√(${val.trim()})`;
    });
    // Square root e.g. \sqrt{16} -> √16, \sqrt{x^2 + 1} -> √(x² + 1)
    text = text.replace(/\\sqrt\{([^{}]+)\}/g, (_, val) => {
      const trimmedVal = val.trim();
      // If single identifier/number without spaces or operators, display √16 or √x
      if (/^[0-9a-zA-Z]+$/.test(trimmedVal)) {
        return `√${trimmedVal}`;
      }
      return `√(${trimmedVal})`;
    });
  }

  // 6. Degree symbols
  text = text.replace(/\^\{\\circ\}/g, '°');
  text = text.replace(/\^\\circ\b/g, '°');
  text = text.replace(/\^\{circ\}/g, '°');
  text = text.replace(/\\degree\b/g, '°');

  // 7. Exponents / Superscripts
  // Handle grouped exponents e.g. x^{2}, 10^{-3}, (x+1)^{2}
  prevText = '';
  while (prevText !== text) {
    prevText = text;
    text = text.replace(/\^\{([^{}]+)\}/g, (_, exp) => {
      return toSuperscript(exp);
    });
  }
  // Handle single character exponents e.g. x^2, y^3, 10^5
  text = text.replace(/\^([0-9nixyabc+-=])/g, (_, char) => {
    return SUPERSCRIPT_MAP[char] || `^${char}`;
  });

  // 8. Subscripts
  // Handle grouped subscripts e.g. x_{1}, a_{ij}, H_{2}O
  prevText = '';
  while (prevText !== text) {
    prevText = text;
    text = text.replace(/_\{([^{}]+)\}/g, (_, sub) => {
      return toSubscript(sub);
    });
  }
  // Handle single character subscripts e.g. x_1, x_2, u_n
  text = text.replace(/_([0-9aeoxijk])/g, (_, char) => {
    return SUBSCRIPT_MAP[char] || `_${char}`;
  });

  // 9. Standard mathematical operators & relations
  text = text
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mp\b/g, '∓')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\bullet\b/g, '•')
    .replace(/\\le\b/g, '≤')
    .replace(/\\leq\b/g, '≤')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\geq\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\ne\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\equiv\b/g, '≡')
    .replace(/\\sim\b/g, '~')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\propto\b/g, '∝')
    .replace(/\\angle\b/g, '∠')
    .replace(/\\perp\b/g, '⊥')
    .replace(/\\parallel\b/g, '∥')
    .replace(/\\triangle\b/g, '∆');

  // 10. Greek letters
  text = text
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Gamma\b/g, 'Γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\Theta\b/g, 'Θ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\Pi\b/g, 'Π')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\Lambda\b/g, 'Λ')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\Sigma\b/g, 'Σ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Omega\b/g, 'Ω')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\Phi\b/g, 'Φ')
    .replace(/\\rho\b/g, 'ρ')
    .replace(/\\tau\b/g, 'τ')
    .replace(/\\eta\b/g, 'η')
    .replace(/\\epsilon\b/g, 'ε');

  // 11. Calculus, Sums, Integrals & Sets
  text = text
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\int\b/g, '∫')
    .replace(/\\partial\b/g, '∂')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\subseteq\b/g, '⊆')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\emptyset\b/g, '∅')
    .replace(/\\forall\b/g, '∀')
    .replace(/\\exists\b/g, '∃')
    .replace(/\\rightarrow\b/g, '→')
    .replace(/\\to\b/g, '→')
    .replace(/\\leftarrow\b/g, '←')
    .replace(/\\Rightarrow\b/g, '⇒')
    .replace(/\\Leftarrow\b/g, '⇐')
    .replace(/\\Leftrightarrow\b/g, '⇔')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\dots\b/g, '...')
    .replace(/\\cdots\b/g, '...')
    .replace(/\\ldots\b/g, '...');

  // 12. Brackets & function formatting
  text = text
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\\\{/g, '{')
    .replace(/\\right\\\}/g, '}')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\left\|/g, '|')
    .replace(/\\right\|/g, '|');

  // Common math functions without backslashes
  text = text.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lim|det|max|min)\b/g, '$1');

  // 13. Clean up common scientific units with powers (e.g. cm^2 -> cm², m^3 -> m³)
  text = text.replace(/\b(cm|mm|m|km|dm)\^2\b/g, '$1²');
  text = text.replace(/\b(cm|mm|m|km|dm)\^3\b/g, '$1³');

  // 14. Clean up any remaining isolated stray backslashes before alphanumeric words (e.g. \over -> /)
  text = text.replace(/\\over\b/g, '/');

  // Clean up excessive whitespace created during replacements
  text = text.replace(/[ \t]{2,}/g, ' ').trim();

  return text;
}
