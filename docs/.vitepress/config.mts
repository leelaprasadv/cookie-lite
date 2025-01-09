import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "cookie-lite",
  description: "Super lightweight cookie parser and serializer",
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',
  base: '/cookie-lite',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/cookie-lite/favicon.svg' }]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Usage', link: '/guide/usage' }
        ]
      },
      {
        text: 'API',
        items: [
          { text: 'parse()', link: '/api/parse' },
          { text: 'serialize()', link: '/api/serialize' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/leelaprasadv/cookie-lite' }
    ],

    logo: '/logo.svg',

    // Footer configuration
    footer: {
      message: '',
      copyright: 'Copyright © 2024 Leela Prasad V'
    }
  }
})
