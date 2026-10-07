/** @type {{ source: string; destination: string; permanent: boolean }[]} */
export const redirects = [
  { source: '/sangguniang_bayan', destination: '/sangguniang-bayan', permanent: true },
  { source: '/deparments', destination: '/departments', permanent: true },
  { source: '/deparments/:slug', destination: '/departments/:slug', permanent: true },
  {
    source: '/destination/:type(waterfalls|restaurants|resorts|hotels|entertainments)',
    destination: '/destinations/:type',
    permanent: true,
  },
  { source: '/person/:slug', destination: '/officials/:slug', permanent: true },
]
