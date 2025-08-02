const tailwindcss = require('tailwindcss');

module.exports = {
  plugins: [
    // ✅ FIX: Add charset handling plugin first
    {
      postcssPlugin: 'fix-charset',
      Once(root) {
        // Remove all @charset rules to prevent conflicts
        root.walkAtRules('charset', (rule) => {
          rule.remove();
        });
        // Add a single @charset rule at the beginning
        root.prepend('@charset "UTF-8";');
      }
    },
    tailwindcss('./tailwind.config.js'),
    require('autoprefixer')
  ],
};
