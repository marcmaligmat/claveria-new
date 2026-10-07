import { lexical } from './lexical'

const lorem = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    i % 2 === 0
      ? 'The Municipality of Claveria continues to serve its constituents through responsive programs in health, education, agriculture, and tourism.'
      : 'Residents are encouraged to coordinate with the concerned office for schedules, requirements, and further announcements.',
  )

export const departments = [
  { name: 'Office of the Mayor', icon: 'deprticon1.png', lists: ['Executive direction', 'Permits and licensing', 'Public information'] },
  { name: 'Municipal Health Office', icon: 'deprticon2.png', lists: ['Primary care', 'Immunization', 'Maternal and child health'] },
  { name: 'Municipal Agriculture Office', icon: 'deprticon3.png', lists: ['Farmer assistance', 'Seed distribution', 'Livestock programs'] },
  { name: 'Municipal Engineering Office', icon: 'deprticon4.png', lists: ['Infrastructure projects', 'Building permits', 'Road maintenance'] },
  { name: 'Municipal Social Welfare and Development Office', icon: 'deprticon5.png', lists: ['Senior citizen services', 'PWD services', 'Child protection'] },
  { name: 'Municipal Planning and Development Office', icon: 'deprticon6.png', lists: ['Land use planning', 'Project monitoring', 'Zoning'] },
  { name: 'Municipal Treasurer’s Office', icon: 'deprticon1.png', lists: ['Tax collection', 'Business tax', 'Real property tax'] },
  { name: 'Municipal Assessor’s Office', icon: 'deprticon2.png', lists: ['Property assessment', 'Tax declarations'] },
  { name: 'Municipal Civil Registrar', icon: 'deprticon3.png', lists: ['Birth, marriage, and death certificates', 'Late registration'] },
  { name: 'Municipal Tourism Office', icon: 'deprticon4.png', lists: ['Tourist assistance', 'Festival coordination', 'Destination promotion'] },
].map((d, i) => ({
  ...d,
  order: (i + 1) * 10,
  summary: lexical.bullets(d.lists),
  body: lexical.paragraphs(...lorem(3)),
}))

export const officials = [
  { name: 'Meraluna Salvaleon Abrogar', position: 'mayor', photo: 'mayer.jpg', short: 'Municipal Mayor' },
  { name: 'Juan Dela Cruz', position: 'vicemayor', photo: 'cteam1.jpg', short: 'Presiding Officer, Sangguniang Bayan' },
  { name: 'Maria Santos', position: 'councilor', photo: 'cteam2.jpg', short: 'Committee on Health' },
  { name: 'Pedro Reyes', position: 'councilor', photo: 'cteam3.jpg', short: 'Committee on Agriculture' },
  { name: 'Ana Lopez', position: 'councilor', photo: 'cteam4.jpg', short: 'Committee on Education' },
  { name: 'Jose Ramos', position: 'councilor', photo: 'fc1.jpg', short: 'Committee on Infrastructure' },
  { name: 'Luz Garcia', position: 'councilor', photo: 'fc2.jpg', short: 'Committee on Tourism' },
  { name: 'Carlos Mendoza', position: 'councilor', photo: 'fc3.jpg', short: 'Committee on Finance' },
  { name: 'Rosa Villanueva', position: 'councilor', photo: 'fc4.jpg', short: 'Committee on Social Services' },
  { name: 'Miguel Torres', position: 'councilor', photo: 'fc5.jpg', short: 'Committee on Peace and Order' },
  { name: 'Elena Cruz', position: 'head', photo: 'h3-team1.jpg', short: 'Municipal Health Officer', department: 'Municipal Health Office' },
  { name: 'Ramon Bautista', position: 'head', photo: 'h3-team2.jpg', short: 'Municipal Agriculturist', department: 'Municipal Agriculture Office' },
].map((o, i) => ({
  ...o,
  order: (i + 1) * 10,
  bio: lexical.paragraphs(...lorem(2)),
  politicalExperience: lexical.bullets(['Barangay Councilor, 2013–2016', 'Municipal Councilor, 2016–2022']),
  responsibilities: lexical.bullets(['Legislation and committee work', 'Constituent assistance']),
}))

export const news = [
  { title: 'Municipal Hall Opens Extended Service Hours', category: 'government', image: 'cityscape1.jpg' },
  { title: 'New Ordinance on Waste Segregation Takes Effect', category: 'policies', image: 'cityscape2.jpg' },
  { title: 'Free Medical Mission Scheduled in Poblacion', category: 'medical', image: 'cityscape3.jpg' },
  { title: 'Farmers Receive Hybrid Seed Assistance', category: 'economy', image: 'cityscape4.jpg' },
  { title: 'Scholarship Applications Now Open', category: 'education', image: 'cityscape5.jpg' },
  { title: 'Business Permit Renewal Deadline Reminder', category: 'business', image: 'cityscape6.jpg' },
  { title: 'Road Rehabilitation Begins on Provincial Highway', category: 'government', image: 'h3citynews-1.jpg' },
  { title: 'Tourism Office Launches Waterfalls Trail Map', category: 'economy', image: 'h3citynews-2.jpg' },
].map((n, i) => ({
  ...n,
  publishedAt: new Date(Date.UTC(2026, 8, 30 - i * 3, 2)).toISOString(),
  body: lexical.paragraphs(...lorem(4)),
}))

export const destinations = [
  { title: 'Pamalihi Falls', type: 'waterfalls', location: 'Barangay Lanise', images: ['cul1.jpg', 'cul2.jpg', 'cul3.jpg'] },
  { title: 'Tubod Flower Garden Falls', type: 'waterfalls', location: 'Barangay Tubod', images: ['cul4.jpg', 'cul5.jpg'] },
  { title: 'Hilltop Grill', type: 'restaurants', location: 'Poblacion', images: ['cd1.jpg', 'cd2.jpg'] },
  { title: 'Kusina ni Nanay', type: 'restaurants', location: 'Barangay Minalwang', images: ['cd3.jpg'] },
  { title: 'Cold Spring Resort', type: 'resorts', location: 'Barangay Ani-e', images: ['cl1.jpg', 'cl2.jpg'] },
  { title: 'Mapawa Spring Resort', type: 'resorts', location: 'Barangay Mapawa', images: ['cl3.jpg', 'cl4.jpg'] },
  { title: 'Claveria Garden Inn', type: 'hotels', location: 'Poblacion', images: ['cd4.jpg'] },
  { title: 'Highland View Lodge', type: 'hotels', location: 'Barangay Patrocinio', images: ['cul6.jpg'] },
  { title: 'Plaza Night Market', type: 'entertainments', location: 'Municipal Plaza', images: ['cityscape1.jpg'] },
  { title: 'Riverside Music Lounge', type: 'entertainments', location: 'Barangay Poblacion', images: ['cityscape2.jpg'] },
].map((d) => ({ ...d, description: lexical.paragraphs(...lorem(2)) }))

export const localBoards = [
  'Local Health Board',
  'Local School Board',
  'Peace and Order Council',
  'Disaster Risk Reduction Council',
  'Tourism Council',
  'Agriculture and Fishery Council',
].map((title, i) => ({ title, image: `lbs${i + 1}.jpg`, order: (i + 1) * 10 }))

export const documents = [
  { title: 'Sangguniang Bayan Session Schedule 2026', category: 'sb' },
  { title: 'Municipal Ordinance No. 2026-01', category: 'sb' },
  { title: 'Annual Budget 2026', category: 'transparency' },
]

export const heroSlides = [
  { image: 'municipal-palace-at-night.jpg', heading: 'Discover Our Lovely Municipality', subheading: 'Claveria, Misamis Oriental', ctaLabel: 'Explore destinations', ctaHref: '/destinations/waterfalls' },
  { image: 'sun.jpg', heading: 'Portals & Directories', subheading: 'Departments, officials, and services in one place', ctaLabel: 'View departments', ctaHref: '/departments' },
  { image: 'viewdeck.jpg', heading: 'Serving Every Barangay', subheading: 'Latest news and programs from your local government', ctaLabel: 'Read the news', ctaHref: '/news' },
]

export const settings = {
  mayor: { name: 'Meraluna Salvaleon Abrogar', photo: 'mayer.jpg', message: lexical.paragraphs(...lorem(2)) },
  visionMission: {
    vision: lexical.paragraphs('A progressive, peaceful, and resilient agro-tourism municipality with empowered and God-loving citizens.'),
    mission: lexical.paragraphs('To deliver responsive, transparent, and sustainable public services through good governance and active community participation.'),
  },
  hotlines: {
    pnp: '0998 598 5471',
    responder: '0917 123 4567',
    bfp: '0917 765 4321',
    helplineGroups: [
      { title: 'Municipal Health Office', body: lexical.bullets(['Rural Health Unit: 0917 000 0101', 'Ambulance: 0917 000 0102']) },
      { title: 'Disaster Risk Reduction', body: lexical.bullets(['MDRRMO Operations Center: 0917 000 0201']) },
      { title: 'Water and Power', body: lexical.bullets(['Water District: 0917 000 0301', 'MORESCO: 0917 000 0302']) },
    ],
  },
  facts: { population: '52,478', areaKm2: '825', schools: '48', hospitals: '2', touristVisits: '15,000' },
  links: {
    facebookUrl: 'https://www.facebook.com/Claveria955/',
    email: 'info@claveriamisor.gov.ph',
    phone: '(088) 000 0000',
    address: 'Municipal Hall, Poblacion, Claveria, Misamis Oriental 9004',
    agencyLinks: [
      { name: 'Transparency Seal', url: 'https://www.dbm.gov.ph/', logo: 'agencies/transparency-seal.png' },
      { name: 'Office of the President', url: 'http://op-proper.gov.ph/', logo: 'agencies/president-office.png' },
      { name: 'DTI', url: 'https://dti.gov.ph/', logo: 'agencies/dti.png' },
      { name: 'DepEd', url: 'http://www.deped.gov.ph/', logo: 'agencies/deped.png' },
      { name: 'DILG', url: 'http://dilg.gov.ph/', logo: 'agencies/dilg.png' },
      { name: 'Department of Tourism', url: 'http://tourism.gov.ph/', logo: 'agencies/dept-tourism.png' },
    ],
  },
}
