const fs = require('fs');
const path = require('path');

const photosPath = path.join(__dirname, '../data/photos.json');
const existing = JSON.parse(fs.readFileSync(photosPath, 'utf8'));

const newPhotos = [];
const unsplashIds = [
  '1449824913935-59a10b8d2000', '1502602898657-3e91760cbb34', '1501594907352-04cda38ebc29',
  '1501785888041-af3ef285b470', '1472214103451-9374bd1c798e', '1485470733090-0aae1788d5af',
  '1446034295857-c39f8844fad4', '1464822759023-fed622ff2c3b', '1433838552652-f9a46b332c40',
  '1426604966848-d7adac402bff', '1470770903676-69b98201ea1c', '1472396961693-142e6e269027',
  '1501630834273-4b5604d2ee31', '1506318137071-a8e063b4bec0', '1501436513145-30f24e19fcc8',
  '1500534314209-a25ddb2bd429', '1518173946687-a4c8892bbd9f', '1511884642898-4c92249e20b6',
  '1529626455594-4ff0802cfb7e', '1510414842594-a61c69b5ae57', '1523438097201-512ae7d59c44',
  '1502899576159-f224dc2349fa', '1496147539180-68b33a6593c3', '1501250987900-211872d97eaa',
  '1505765050516-f72dcac9c60e', '1511988617509-a57c8a288659', '1520016642626-51772e69d20a',
  '1507003211169-0a1dd7228f2d', '1524504388940-b1c1722653e1', '1517849845537-4d257902454a',
  '1517423440428-a5a00ad493e8', '1494790108377-be9c29b29330', '1517841905240-472988babdf9',
  '1524504388940-b1c1722653e1', '1502489019804-54e3f2b4e6fd'
];

const titles = [
  'Golden Hour Architecture', 'Urban Reflections', 'Mountain Vista',
  'Beach Sunrise', 'Forest Path', 'Desert Landscape',
  'Ocean Waves', 'Autumn Colors', 'Coastal Cliffs',
  'Winter Wonderland', 'Cherry Blossoms', 'Urban Jungle',
  'Industrial Beauty', 'Street Art', 'City Lights',
  'Rainy Day', 'Market Street', 'Rooftop View',
  'Subway Station', 'Cafe Culture', 'Artistic Expression',
  'Night Photography', 'Architectural Detail', 'Nature Close-up',
  'Street Musician', 'Cultural Festival', 'Urban Wildlife',
  'Environmental Portrait', 'Fashion Street Style', 'Abstract Composition',
  'Geometric Patterns', 'Light and Shadow', 'Silhouette',
  'Moody Portrait', 'Candid Street'
];

const locations = [
  'Tokyo, Japan', 'New York, USA', 'Paris, France', 'London, UK', 'Sydney, Australia',
  'Berlin, Germany', 'Amsterdam, Netherlands', 'Barcelona, Spain', 'Seoul, South Korea',
  'Bangkok, Thailand', 'Rome, Italy', 'Istanbul, Turkey', 'Dubai, UAE', 'Singapore',
  'Hong Kong', 'Toronto, Canada', 'Stockholm, Sweden', 'Prague, Czech Republic',
  'Vienna, Austria', 'Copenhagen, Denmark', 'Melbourne, Australia', 'Lisbon, Portugal',
  'Athens, Greece', 'Budapest, Hungary', 'Oslo, Norway', 'Helsinki, Finland',
  'Reykjavik, Iceland', 'Edinburgh, Scotland', 'Dublin, Ireland', 'Zurich, Switzerland',
  'Brussels, Belgium', 'Warsaw, Poland', 'Kyoto, Japan', 'Mumbai, India', 'Shanghai, China'
];

const collectionsMap = [
  ['architecture'], ['architecture'], ['landscapes'], ['landscapes'], ['landscapes'],
  ['landscapes'], ['landscapes'], ['landscapes'], ['landscapes'], ['landscapes'],
  ['tokyo-streets'], ['architecture'], ['architecture'], ['tokyo-streets'], ['architecture'],
  ['tokyo-streets'], ['tokyo-streets'], ['architecture'], ['tokyo-streets'], ['portraits'],
  ['architecture'], ['tokyo-streets'], ['architecture'], ['landscapes'], ['portraits'],
  ['tokyo-streets'], ['landscapes'], ['portraits'], ['portraits'], ['architecture'],
  ['architecture'], ['tokyo-streets'], ['portraits'], ['portraits'], ['tokyo-streets']
];

for (let i = 0; i < 35; i++) {
  const id = (16 + i).toString();
  const photoId = unsplashIds[i];
  const aspectRatios = [1.5, 1.33, 0.67, 0.75, 0.8, 1.2, 1.4, 1.6, 1.77, 0.9];
  const aspectRatio = aspectRatios[i % aspectRatios.length];
  const cameras = ['Sony A7R IV', 'Canon EOS R5', 'Nikon Z9', 'Fujifilm X-T5', 'Leica Q2'];
  const lenses = [
    'Sony FE 24-70mm f/2.8 GM',
    'Canon RF 50mm f/1.2L',
    'Nikkor Z 14-24mm f/2.8 S',
    'XF 16-55mm f/2.8',
    'Summilux 28mm f/1.7'
  ];

  newPhotos.push({
    id: id,
    src: {
      thumbnail: `https://images.unsplash.com/photo-${photoId}?w=400`,
      medium: `https://images.unsplash.com/photo-${photoId}?w=1200`,
      full: `https://images.unsplash.com/photo-${photoId}?w=2400`
    },
    aspectRatio: aspectRatio,
    title: titles[i],
    description: `A stunning capture of ${titles[i].toLowerCase()}`,
    location: locations[i],
    tags: ['photography', 'art', 'creative'],
    collections: collectionsMap[i],
    featured: i % 7 === 0,
    capturedAt: `2024-0${(i % 3) + 1}-${String((i % 28) + 1).padStart(2, '0')}T12:00:00Z`,
    exif: {
      camera: cameras[i % cameras.length],
      lens: lenses[i % lenses.length],
      aperture: `f/${2.8 + (i % 4) * 0.4}`,
      shutter: `1/${125 * (i % 4 + 1)}s`,
      iso: 100 + (i % 8) * 200
    },
    createdAt: `2024-0${(i % 3) + 1}-${String((i % 28) + 2).padStart(2, '0')}T10:00:00Z`
  });
}

const allPhotos = [...existing, ...newPhotos];
fs.writeFileSync(photosPath, JSON.stringify(allPhotos, null, 2));
console.log(`Added 35 photos. Total: ${allPhotos.length} photos`);
