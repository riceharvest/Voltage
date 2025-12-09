const { ColorContrastChecker } = require('color-contrast-checker');

const ccc = new ColorContrastChecker();

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

function checkContrast(foreground, background, name) {
  const ratio = ccc.getContrastRatio(foreground, background);
  const aaNormal = ccc.isLevelAA(foreground, background, false); // normal text
  const aaLarge = ccc.isLevelAA(foreground, background, true);   // large text
  const aaaNormal = ccc.isLevelAAA(foreground, background, false);
  const aaaLarge = ccc.isLevelAAA(foreground, background, true);

  console.log(`${name}:`);
  console.log(`  Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`  AA Normal (4.5:1): ${aaNormal ? 'PASS' : 'FAIL'}`);
  console.log(`  AA Large (3:1): ${aaLarge ? 'PASS' : 'FAIL'}`);
  console.log(`  AAA Normal (7:1): ${aaaNormal ? 'PASS' : 'FAIL'}`);
  console.log(`  AAA Large (4.5:1): ${aaaLarge ? 'PASS' : 'FAIL'}\n`);
}

// Check main combinations
checkContrast(colors.foreground, colors.background, 'Main text on background');
checkContrast(colors.primary, colors.background, 'Primary on background');
checkContrast(colors.mutedForeground, colors.background, 'Muted text on background');
checkContrast(colors.destructive, colors.background, 'Destructive on background');
checkContrast(colors.foreground, colors.secondary, 'Text on secondary');
checkContrast(colors.primary, colors.secondary, 'Primary on secondary');