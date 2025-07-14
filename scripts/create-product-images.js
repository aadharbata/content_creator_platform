const fs = require('fs');
const path = require('path');

const productImages = [
  {
    filename: 'nature-collection.jpg',
    title: 'Nature Collection',
    color: '#4CAF50',
    icon: '📸',
    description: 'Premium Photos'
  },
  {
    filename: 'web-dev-course.jpg',
    title: 'Web Development',
    color: '#2196F3',
    icon: '💻',
    description: 'Complete Course'
  },
  {
    filename: 'meditation-audio.jpg',
    title: 'Meditation Audio',
    color: '#9C27B0',
    icon: '🧘',
    description: 'Mindfulness Series'
  },
  {
    filename: 'social-templates.jpg',
    title: 'Social Templates',
    color: '#FF9800',
    icon: '📱',
    description: 'Template Bundle'
  },
  {
    filename: 'fitness-videos.jpg',
    title: 'Fitness Videos',
    color: '#F44336',
    icon: '💪',
    description: 'Workout Series'
  },
  {
    filename: 'digital-marketing-ebook.jpg',
    title: 'Digital Marketing',
    color: '#3F51B5',
    icon: '📚',
    description: 'Complete eBook'
  },
  {
    filename: 'photo-plugin.jpg',
    title: 'Photo Plugin',
    color: '#00BCD4',
    icon: '🔧',
    description: 'Pro Software'
  },
  {
    filename: 'ceramic-mugs.jpg',
    title: 'Ceramic Mugs',
    color: '#795548',
    icon: '☕',
    description: 'Handmade Set'
  },
  {
    filename: 'logo-design.jpg',
    title: 'Logo Design',
    color: '#607D8B',
    icon: '🎨',
    description: 'Design Package'
  },
  {
    filename: 'cooking-masterclass.jpg',
    title: 'Cooking Class',
    color: '#FF5722',
    icon: '👨‍🍳',
    description: 'Master Videos'
  }
];

function createSVGImage(imageData) {
  return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-${imageData.filename}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${imageData.color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${imageData.color}99;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="400" height="300" fill="url(#grad-${imageData.filename})" />
    
    <!-- Overlay pattern -->
    <rect width="400" height="300" fill="url(#grad-${imageData.filename})" opacity="0.1" />
    
    <!-- Icon -->
    <text x="200" y="120" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" fill="white" opacity="0.9">
      ${imageData.icon}
    </text>
    
    <!-- Title -->
    <text x="200" y="180" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">
      ${imageData.title}
    </text>
    
    <!-- Description -->
    <text x="200" y="210" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white" opacity="0.8">
      ${imageData.description}
    </text>
    
    <!-- Badge -->
    <rect x="300" y="20" width="80" height="30" rx="15" fill="white" opacity="0.2" />
    <text x="340" y="38" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="white" font-weight="bold">
      PREMIUM
    </text>
  </svg>`;
}

function main() {
  console.log('🎨 Creating product images...');
  
  const publicDir = path.join(process.cwd(), 'public');
  const productImagesDir = path.join(publicDir, 'product-images');
  
  // Create product-images directory if it doesn't exist
  if (!fs.existsSync(productImagesDir)) {
    fs.mkdirSync(productImagesDir, { recursive: true });
  }
  
  // Create SVG images
  productImages.forEach(imageData => {
    const svgContent = createSVGImage(imageData);
    const imagePath = path.join(productImagesDir, imageData.filename.replace('.jpg', '.svg'));
    
    fs.writeFileSync(imagePath, svgContent);
    console.log(`  • Created: ${imageData.filename.replace('.jpg', '.svg')}`);
  });
  
  console.log('✅ Product images created successfully!');
  console.log(`📍 Images saved to: ${productImagesDir}`);
}

main(); 