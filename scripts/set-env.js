const fs = require('fs');
const path = require('path');

// Target paths
const envPath = path.join(__dirname, '../src/environments/environment.ts');
const envProdPath = path.join(__dirname, '../src/environments/environment.prod.ts');

// Environment variable names (set these in Vercel)
const supabaseUrl = process.env.SUPABASE_URL || 'https://msjkjymlvjaliaztlbls.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamtqeW1sdmphbGlhenRsYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjE3NjYsImV4cCI6MjA4Njc5Nzc2Nn0.kKSLKSENOdLC_jqvTDr1jpW-MG1HzRMlk322SAsHL0U';
const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyCY1rzzjZyRx98xXUUnrkIVHC1XWhh_dlc';

const envConfigFile = `export const environment = {
  production: false,
  geminiApiKey: '${geminiApiKey}',
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
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
`;

const envProdConfigFile = `export const environment = {
  production: true,
  geminiApiKey: '${geminiApiKey}',
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
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
`;

// Create directories if they don't exist
const envDir = path.dirname(envPath);
if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
}

// Write the files
fs.writeFileSync(envPath, envConfigFile);
fs.writeFileSync(envProdPath, envProdConfigFile);

console.log(`Environment files generated successfully at ${envDir}`);
