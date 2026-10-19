/* Hassan Fish Store — catalogue. Prices are in PKR; edit freely.
   `image` is the product photo; `credit` attributes photos used under a Creative Commons licence. */
window.KOI_CATEGORIES = [
  { id: 'all', label: 'All koi' },
  { id: 'gosanke', label: 'Gosanke' },
  { id: 'metallic', label: 'Ogon & metallic' },
  { id: 'classic', label: 'Classic varieties' },
  { id: 'butterfly', label: 'Butterfly' }
];

window.KOI_PRODUCTS = [
  {
    id: 'kohaku', name: 'Kohaku', jp: '紅白', image: 'assets/fish/kohaku.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/5848224648' }, category: 'gosanke', badge: 'Bestseller',
    desc: 'The classic koi: a snow-white body with bold crimson patterns. The first koi every collector falls for.',
    details: { Pattern: 'Red (hi) on white', Temperament: 'Calm, friendly', Lifespan: '25–35 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 3500 }, { label: '6"', price: 6500 }, { label: '10"', price: 14000 }]
  },
  {
    id: 'sanke', name: 'Taisho Sanke', jp: '大正三色', image: 'assets/fish/sanke.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/6303052929' }, category: 'gosanke',
    desc: 'Kohaku colours with crisp black (sumi) accents across the back. A three-colour classic.',
    details: { Pattern: 'Red and black on white', Temperament: 'Calm', Lifespan: '25–35 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 4000 }, { label: '6"', price: 7500 }, { label: '10"', price: 16000 }]
  },
  {
    id: 'showa', name: 'Showa Sanshoku', jp: '昭和三色', image: 'assets/fish/showa.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/6303053179' }, category: 'gosanke', badge: 'Collector pick',
    desc: 'A dramatic black koi wrapped in red and white, with black-rooted pectoral fins.',
    details: { Pattern: 'Red and white on black', Temperament: 'Active', Lifespan: '25–35 years', 'Ideal pond': '1,500+ litres' },
    sizes: [{ label: '4"', price: 4200 }, { label: '6"', price: 8000 }, { label: '10"', price: 17500 }]
  },
  {
    id: 'tancho', name: 'Tancho Kohaku', jp: '丹頂', image: 'assets/fish/tancho.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/5847667217' }, category: 'classic', badge: 'Rare',
    desc: 'A pure white koi with a single red circle on its head, like the Japanese flag. Highly prized.',
    details: { Pattern: 'Single red crown', Temperament: 'Calm', Lifespan: '25–35 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 5000 }, { label: '6"', price: 9500 }, { label: '10"', price: 22000 }]
  },
  {
    id: 'yamabuki', name: 'Yamabuki Ogon', jp: '山吹黄金', image: 'assets/fish/yamabuki.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/6317739221' }, category: 'metallic',
    desc: 'Solid metallic gold that glows in sunlight. Hardy, fast-growing and very tame.',
    details: { Pattern: 'Metallic gold', Temperament: 'Very friendly', Lifespan: '25–30 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 2800 }, { label: '6"', price: 5200 }, { label: '10"', price: 11000 }]
  },
  {
    id: 'shiro', name: 'Shiro Utsuri', jp: '白写り', image: 'assets/fish/shiro.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/8476150702' }, category: 'classic',
    desc: 'Ink-black koi with crisp snow-white patterns. A striking, elegant contrast in any pond.',
    details: { Pattern: 'White on black', Temperament: 'Calm', Lifespan: '25–35 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 3000 }, { label: '6"', price: 5500 }, { label: '10"', price: 12000 }]
  },
  {
    id: 'kujaku', name: 'Kujaku', jp: '孔雀', image: 'assets/fish/kujaku.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/6430117411' }, category: 'metallic',
    desc: 'The "peacock" koi: metallic white with orange patches and a net-like scale pattern.',
    details: { Pattern: 'Metallic, orange and net scales', Temperament: 'Friendly', Lifespan: '25–30 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 4500 }, { label: '6"', price: 8500 }, { label: '10"', price: 18000 }]
  },
  {
    id: 'asagi', name: 'Asagi', jp: '浅黄', image: 'assets/fish/asagi.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/6314019897' }, category: 'classic',
    desc: 'One of the oldest koi varieties: blue netted scales on the back, warm orange on the sides.',
    details: { Pattern: 'Blue net, orange sides', Temperament: 'Calm', Lifespan: '25–35 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 3200 }, { label: '6"', price: 6000 }, { label: '10"', price: 13000 }]
  },
  {
    id: 'shusui', name: 'Shusui', jp: '秋翠', image: 'assets/fish/shusui.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/8476150160' }, category: 'classic',
    desc: 'A scaleless (doitsu) Asagi with one row of large blue scales running down the back.',
    details: { Pattern: 'Doitsu blue line, red sides', Temperament: 'Calm', Lifespan: '25–30 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 3600 }, { label: '6"', price: 6800 }, { label: '10"', price: 14500 }]
  },
  {
    id: 'chagoi', name: 'Chagoi', jp: '茶鯉', image: 'assets/fish/chagoi.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/7157708349' }, category: 'classic', badge: 'Friendliest',
    desc: 'A gentle tea-brown giant. Often the first to eat from your hand, and it tames the whole pond.',
    details: { Pattern: 'Solid tea brown', Temperament: 'Extremely tame', Lifespan: '30+ years', 'Ideal pond': '1,500+ litres' },
    sizes: [{ label: '4"', price: 2500 }, { label: '6"', price: 4800 }, { label: '10"', price: 9500 }]
  },
  {
    id: 'hiutsuri', name: 'Hi Utsuri', jp: '緋写り', image: 'assets/fish/hiutsuri.jpg',
    credit: { author: "KoiQuestion", license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/54028598@N06/8475059241' }, category: 'classic',
    desc: 'Deep black koi with fiery red-orange patterns. A bold, high-contrast showpiece.',
    details: { Pattern: 'Red on black', Temperament: 'Active', Lifespan: '25–35 years', 'Ideal pond': '1,000+ litres' },
    sizes: [{ label: '4"', price: 3800 }, { label: '6"', price: 7200 }, { label: '10"', price: 15000 }]
  },
  {
    id: 'butterfly', name: 'Butterfly Koi', jp: '鰭長', image: 'assets/fish/butterfly.jpg',
    credit: { author: "RobBixbyPhotography", license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/14580956@N08/9443831458' }, category: 'butterfly', badge: 'Long fin',
    desc: 'Golden koi with long, flowing fins that trail through the water like silk.',
    details: { Pattern: 'Gold, long fins', Temperament: 'Graceful, calm', Lifespan: '20–30 years', 'Ideal pond': '800+ litres' },
    sizes: [{ label: '4"', price: 4500 }, { label: '6"', price: 8500 }, { label: '10"', price: 18500 }]
  }
];
