import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid({
  title: 'ts-seedwork',
  description: 'DDD and CQRS building blocks for TypeScript/Node applications.',
  base: '/ts-seedwork/',

  // Links to the examples/ directory point to TypeScript source files, not Markdown pages.
  ignoreDeadLinks: [/\/examples\//],

  vite: {
    // esbuild does not recognise ES2024; suppress the warning from the project tsconfig.
    esbuild: { target: 'es2022' },
  },

  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      {
        text: 'Guides',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Best Practices', link: '/best-practices' },
          { text: 'Coding Standards', link: '/coding-standards' },
        ],
      },
      { text: 'Reference', link: '/component-reference' },
    ],

    sidebar: [
      { text: 'Getting Started', link: '/getting-started' },
      {
        text: 'Guides',
        collapsed: false,
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Best Practices', link: '/best-practices' },
          { text: 'Coding Standards', link: '/coding-standards' },
        ],
      },
      { text: 'Component Reference', link: '/component-reference' },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/aseguragonzalez/ts-seedwork' }],

    footer: {
      message: 'Released under the MIT License.',
    },
  },
});
