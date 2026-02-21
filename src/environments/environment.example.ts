export const environment = {
    production: false,
    geminiApiKey: '',
    supabase: {
        url: '',
        anonKey: '',
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
