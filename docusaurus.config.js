const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: '?',
  tagline: 'Dinosaurs are cool',
  url: 'https://stavhaygn.tw',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'stavhaygn', // Usually your GitHub org/user name.
  projectName: 'stavhaygn.tw', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: '404 _<',
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Tutorial',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/stavhaygn',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: '404',
          items: [
            {
              label: '?',
              href: '#',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'CTFtime',
              href: 'https://ctftime.org/team/89275',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/stavhaygn',
            },
            {
              label: 'MacacaHub',
              href: 'https://www.facebook.com/MacacaHub-107811803945876',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} stavhaygn.tw. Built with Docusaurus.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
