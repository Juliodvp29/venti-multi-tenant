export const environment = {
  production: true,
  geminiApiKey: 'AIzaSyA7s-h_OvE7-EdJOZfrY6l3rZbd0xxyUxU',
  supabase: {
    url: 'https://msjkjymlvjaliaztlbls.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamtqeW1sdmphbGlhenRsYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjE3NjYsImV4cCI6MjA4Njc5Nzc2Nn0.kKSLKSENOdLC_jqvTDr1jpW-MG1HzRMlk322SAsHL0U',
  },
  storage: {
    buckets: {
      products: 'product-images',
      logos: 'tenant-logos',
      media: 'media-library',
      banners: 'tenant-banners',
    },
    maxFileSizeMb: 5,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  app: {
    name: 'Venti',
    version: '1.0.0',
    apiTimeout: 10000,
  },
};
