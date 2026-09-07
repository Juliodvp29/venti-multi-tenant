export interface MockProductItem {
  name: string;
  price: number;
  original_price: number | null;
  image: string;
  secondaryImage?: string | null;
  stock: number;
  isNew: boolean;
}

export const TECH_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Auriculares Noise-Cancelling Pro',
    price: 199,
    original_price: 249,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=600',
    stock: 14,
    isNew: true,
  },
  {
    name: 'Smartwatch Ultra Titanium',
    price: 299,
    original_price: 349,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600',
    stock: 8,
    isNew: true,
  },
  {
    name: 'Laptop Slim Pro 14"',
    price: 899,
    original_price: 999,
    image:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600',
    stock: 5,
    isNew: false,
  },
  {
    name: 'Teclado Mecánico Wireless RGB',
    price: 129,
    original_price: 159,
    image:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=600',
    stock: 12,
    isNew: true,
  },
  {
    name: 'Drone Compact 4K HDR',
    price: 450,
    original_price: 520,
    image:
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=600',
    stock: 6,
    isNew: true,
  },
  {
    name: 'Altavoz Inteligente Hi-Fi 360°',
    price: 89,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=600',
    stock: 20,
    isNew: false,
  },
];

export const FASHION_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Chaqueta Denim Vintage',
    price: 79,
    original_price: 99,
    image:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    isNew: true,
  },
  {
    name: 'Camiseta Algodón Orgánico',
    price: 29,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    stock: 40,
    isNew: false,
  },
  {
    name: 'Vestido Midi Lino Natural',
    price: 89,
    original_price: 120,
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600',
    stock: 10,
    isNew: true,
  },
  {
    name: 'Pantalón Chino Relaxed Fit',
    price: 59,
    original_price: 75,
    image:
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=600',
    stock: 18,
    isNew: false,
  },
  {
    name: 'Blazer Estructurado Casual',
    price: 119,
    original_price: 149,
    image:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600',
    stock: 7,
    isNew: true,
  },
  {
    name: 'Suéter Tejido Cuello Redondo',
    price: 69,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=600',
    stock: 22,
    isNew: false,
  },
];

export const FOOTWEAR_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Sneakers Urban Runner Retro',
    price: 110,
    original_price: 140,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
    secondaryImage:
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600',
    stock: 16,
    isNew: true,
  },
  {
    name: 'Zapatillas Canvas Classic Low',
    price: 65,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=600',
    stock: 28,
    isNew: false,
  },
  {
    name: 'Botas de Cuero Chelsea Heritage',
    price: 160,
    original_price: 195,
    image:
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=600',
    stock: 8,
    isNew: true,
  },
  {
    name: 'Sneakers Deportivas Pro Air',
    price: 135,
    original_price: 160,
    image:
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600',
    stock: 12,
    isNew: true,
  },
  {
    name: 'Mocasines Elegantes de Piel',
    price: 120,
    original_price: 150,
    image:
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=600',
    stock: 9,
    isNew: false,
  },
  {
    name: 'Sandalias Slide Minimalistas',
    price: 39,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&q=80&w=600',
    stock: 35,
    isNew: false,
  },
];

export const FOOD_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Café Grano Especialidad Etiopía 500g',
    price: 18,
    original_price: 22,
    image:
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&q=80&w=600',
    stock: 30,
    isNew: true,
  },
  {
    name: 'Cafetera Prensa Francesa Acero',
    price: 34,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    isNew: false,
  },
  {
    name: 'Blend Espresso Italiano Tueste Medio',
    price: 16,
    original_price: 20,
    image:
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=600',
    stock: 45,
    isNew: true,
  },
  {
    name: 'Taza Cerámica Artesanal Handmade',
    price: 14,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&q=80&w=600',
    stock: 24,
    isNew: true,
  },
  {
    name: 'Molinillo Manual Cónico Premium',
    price: 48,
    original_price: 60,
    image:
      'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&q=80&w=600',
    stock: 10,
    isNew: false,
  },
  {
    name: 'Té Matcha Orgánico Ceremonial 100g',
    price: 26,
    original_price: 32,
    image:
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
    stock: 18,
    isNew: true,
  },
];

export const BEAUTY_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Sérum Facial Ácido Hialurónico + Vit C',
    price: 38,
    original_price: 48,
    image:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
    stock: 25,
    isNew: true,
  },
  {
    name: 'Crema Hidratante Botánica 24h',
    price: 32,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600',
    stock: 30,
    isNew: false,
  },
  {
    name: 'Aceite Puro de Argán Marroquí',
    price: 26,
    original_price: 34,
    image:
      'https://images.unsplash.com/photo-1608248597359-0099478f72eb?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    isNew: true,
  },
  {
    name: 'Limpiador Facial Espumoso Suave',
    price: 22,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=600',
    stock: 40,
    isNew: false,
  },
  {
    name: 'Mascarilla de Arcilla Detoxificante',
    price: 24,
    original_price: 29,
    image:
      'https://images.unsplash.com/photo-1567928815104-b798b67119e7?auto=format&fit=crop&q=80&w=600',
    stock: 18,
    isNew: false,
  },
  {
    name: 'Bálsamo Labial Reparador Karité',
    price: 12,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=600',
    stock: 50,
    isNew: true,
  },
];

export const HOME_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Lámpara Nórdica de Madera Minimalista',
    price: 85,
    original_price: 110,
    image:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600',
    stock: 12,
    isNew: true,
  },
  {
    name: 'Florero Cerámico Escultórico',
    price: 39,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=600',
    stock: 20,
    isNew: true,
  },
  {
    name: 'Manta Tejida Lana Merino Beige',
    price: 65,
    original_price: 80,
    image:
      'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&q=80&w=600',
    stock: 14,
    isNew: false,
  },
  {
    name: 'Vela Aromática de Soja Vainilla',
    price: 24,
    original_price: 28,
    image:
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600',
    stock: 35,
    isNew: false,
  },
  {
    name: 'Cojín Lino Natural con Relieve',
    price: 28,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=600',
    stock: 25,
    isNew: true,
  },
  {
    name: 'Espejo Redondo con Borde Dorado',
    price: 115,
    original_price: 140,
    image:
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600',
    stock: 7,
    isNew: false,
  },
];

export const FITNESS_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Mancuernas Ajustables 20kg Set',
    price: 149,
    original_price: 189,
    image:
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=600',
    stock: 9,
    isNew: true,
  },
  {
    name: 'Mat de Yoga Antideslizante Pro Eco',
    price: 42,
    original_price: 55,
    image:
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=600',
    stock: 25,
    isNew: true,
  },
  {
    name: 'Botella Térmica Inox 1L Aislada',
    price: 28,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600',
    stock: 40,
    isNew: false,
  },
  {
    name: 'Set Bandas de Resistencia Látex',
    price: 22,
    original_price: 30,
    image:
      'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&q=80&w=600',
    stock: 32,
    isNew: false,
  },
  {
    name: 'Cuerda de Salto Velocidad Pro',
    price: 18,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600',
    stock: 30,
    isNew: true,
  },
  {
    name: 'Rodillo de Espuma Foam Roller Masaje',
    price: 26,
    original_price: 35,
    image:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    stock: 18,
    isNew: false,
  },
];

export const JEWELRY_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Collar Plata 925 Colgante Luna',
    price: 65,
    original_price: 85,
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    isNew: true,
  },
  {
    name: 'Anillo Dorado Minimalista Chapa Oro 18k',
    price: 45,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
    stock: 22,
    isNew: true,
  },
  {
    name: 'Reloj Clásico Zafiro Cuero Italiano',
    price: 179,
    original_price: 220,
    image:
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=600',
    stock: 8,
    isNew: false,
  },
  {
    name: 'Pulsera Cadena Eslabones Plata',
    price: 52,
    original_price: 68,
    image:
      'https://images.unsplash.com/photo-1611591475819-79b8b7384662?auto=format&fit=crop&q=80&w=600',
    stock: 18,
    isNew: false,
  },
  {
    name: 'Pendientes Aro Geométricos Oro',
    price: 38,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=600',
    stock: 28,
    isNew: true,
  },
  {
    name: 'Gafas de Sol Carey Polarizadas',
    price: 89,
    original_price: 120,
    image:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600',
    stock: 14,
    isNew: false,
  },
];

export const HEALTH_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Difusor Ultrasónico Aromaterapia LED',
    price: 42,
    original_price: 55,
    image:
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600',
    stock: 20,
    isNew: true,
  },
  {
    name: 'Set Aceites Esenciales Puros 100% (6u)',
    price: 29,
    original_price: 38,
    image:
      'https://images.unsplash.com/photo-1608571424266-edeb9bbefdec?auto=format&fit=crop&q=80&w=600',
    stock: 35,
    isNew: true,
  },
  {
    name: 'Suplemento Magnesio Citrato Vegano',
    price: 24,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    stock: 40,
    isNew: false,
  },
  {
    name: 'Té Herbal Relajante Valeriana & Melisa',
    price: 15,
    original_price: 19,
    image:
      'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=600',
    stock: 50,
    isNew: false,
  },
  {
    name: 'Proteína Vegetal Orgánica Vainilla 1kg',
    price: 48,
    original_price: 60,
    image:
      'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    isNew: true,
  },
  {
    name: 'Almohadilla Térmica Semillas Lavanda',
    price: 21,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
    stock: 25,
    isNew: false,
  },
];

export const DEFAULT_MOCK_PRODUCTS: MockProductItem[] = [
  {
    name: 'Classic Chrono',
    price: 129,
    original_price: 169,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
    secondaryImage:
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&q=80&w=400',
    stock: 12,
    isNew: true,
  },
  {
    name: 'Sport Runner',
    price: 85,
    original_price: 110,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    secondaryImage:
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400',
    stock: 4,
    isNew: false,
  },
  {
    name: 'Leather Wallet',
    price: 45,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400',
    secondaryImage: null,
    stock: 25,
    isNew: true,
  },
  {
    name: 'Wireless Pods',
    price: 199,
    original_price: 249,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    secondaryImage:
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=400',
    stock: 0,
    isNew: false,
  },
  {
    name: 'Minimal Backpack',
    price: 120,
    original_price: null,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    secondaryImage:
      'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&q=80&w=400',
    stock: 8,
    isNew: false,
  },
  {
    name: 'Smart Glasses',
    price: 250,
    original_price: 320,
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400',
    secondaryImage: null,
    stock: 15,
    isNew: true,
  },
];

export function getMockProductsForIndustry(industry?: string | null): MockProductItem[] {
  if (!industry) return TECH_MOCK_PRODUCTS;
  const lower = industry
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    lower.includes('tecno') ||
    lower.includes('gadget') ||
    lower.includes('electro') ||
    lower.includes('comput') ||
    lower.includes('movil') ||
    lower.includes('celular') ||
    lower.includes('audio') ||
    lower.includes('gamer') ||
    lower.includes('gaming')
  ) {
    return TECH_MOCK_PRODUCTS;
  }
  if (
    lower.includes('calzad') ||
    lower.includes('sneaker') ||
    lower.includes('zapato') ||
    lower.includes('tenis')
  ) {
    return FOOTWEAR_MOCK_PRODUCTS;
  }
  if (
    lower.includes('moda') ||
    lower.includes('ropa') ||
    lower.includes('textil') ||
    lower.includes('vestir') ||
    lower.includes('boutique')
  ) {
    return FASHION_MOCK_PRODUCTS;
  }
  if (
    lower.includes('cafe') ||
    lower.includes('comida') ||
    lower.includes('alimento') ||
    lower.includes('gourmet') ||
    lower.includes('restauran') ||
    lower.includes('bebida') ||
    lower.includes('panad')
  ) {
    return FOOD_MOCK_PRODUCTS;
  }
  if (
    lower.includes('belleza') ||
    lower.includes('cosmetic') ||
    lower.includes('skin') ||
    lower.includes('maquillaje') ||
    lower.includes('estetica')
  ) {
    return BEAUTY_MOCK_PRODUCTS;
  }
  if (
    lower.includes('hogar') ||
    lower.includes('decor') ||
    lower.includes('mueble') ||
    lower.includes('interior')
  ) {
    return HOME_MOCK_PRODUCTS;
  }
  if (
    lower.includes('deport') ||
    lower.includes('fit') ||
    lower.includes('gym') ||
    lower.includes('entrena')
  ) {
    return FITNESS_MOCK_PRODUCTS;
  }
  if (
    lower.includes('joy') ||
    lower.includes('accesorio') ||
    lower.includes('reloj') ||
    lower.includes('plata') ||
    lower.includes('oro')
  ) {
    return JEWELRY_MOCK_PRODUCTS;
  }
  if (
    lower.includes('salud') ||
    lower.includes('bienestar') ||
    lower.includes('suplement') ||
    lower.includes('natural') ||
    lower.includes('bio')
  ) {
    return HEALTH_MOCK_PRODUCTS;
  }

  return DEFAULT_MOCK_PRODUCTS;
}

export function getIndustryHeroBanner(industry?: string | null): string {
  if (!industry) {
    return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1600';
  }
  const lower = industry
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    lower.includes('tecno') ||
    lower.includes('gadget') ||
    lower.includes('electro') ||
    lower.includes('comput')
  ) {
    return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('calzad') || lower.includes('sneaker') || lower.includes('zapato')) {
    return 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('moda') || lower.includes('ropa') || lower.includes('textil')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('cafe') || lower.includes('comida') || lower.includes('gourmet')) {
    return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('belleza') || lower.includes('cosmetic') || lower.includes('skin')) {
    return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('hogar') || lower.includes('decor') || lower.includes('mueble')) {
    return 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('deport') || lower.includes('fit') || lower.includes('gym')) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('joy') || lower.includes('accesorio') || lower.includes('reloj')) {
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1600';
  }
  if (lower.includes('salud') || lower.includes('bienestar')) {
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1600';
  }

  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600';
}
