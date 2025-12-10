// Simple WCAG Contrast Ratio Calculator
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(foreground, background) {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(foreground, background, name) {
  const ratio = contrastRatio(foreground, background);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;

  console.log(`${name}:`);
  console.log(`  Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`  AA Normal (4.5:1): ${aaNormal ? 'PASS' : 'FAIL'}`);
  console.log(`  AA Large (3:1): ${aaLarge ? 'PASS' : 'FAIL'}`);
  console.log(`  AAA Normal (7:1): ${aaaNormal ? 'PASS' : 'FAIL'}`);
  console.log(`  AAA Large (4.5:1): ${aaaLarge ? 'PASS' : 'FAIL'}\n`);
}

// Colors from globals.css
const colors = {
  background: '#09090b',
  foreground: '#fafafa',
  primary: '#ccff00',
  mutedForeground: '#a1a1aa',
  destructive: '#ff0055',
  secondary: '#27272a',
  border: '#27272a'
};

console.log('WCAG AA Contrast Ratio Check\n');

// Check main combinations
checkContrast(colors.foreground, colors.background, 'Main text on background');
checkContrast(colors.primary, colors.background, 'Primary on background');
checkContrast(colors.mutedForeground, colors.background, 'Muted text on background');
checkContrast(colors.destructive, colors.background, 'Destructive on background');
checkContrast(colors.foreground, colors.secondary, 'Text on secondary');
checkContrast(colors.primary, colors.secondary, 'Primary on secondary');