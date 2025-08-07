import { 
  checkConnection, 
  createProductIndex, 
  indexProduct, 
  searchProducts, 
  clearAllProducts, 
  getAllProducts,
  bulkIndexProducts,
  Product 
} from './service';

// Sample products for testing
const sampleProducts: Product[] = [
  {
    id: '1',
    title: 'Digital Photography Course',
    description: 'Learn professional photography techniques with this comprehensive course',
    price: 99.99,
    type: 'COURSE',
    thumbnail: 'photography-thumb.jpg',
    images: ['photo1.jpg', 'photo2.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator1',
    creatorName: 'John Smith'
  },
  {
    id: '2',
    title: 'Web Development Templates',
    description: 'Modern responsive website templates for developers',
    price: 49.99,
    type: 'TEMPLATE',
    thumbnail: 'web-templates-thumb.jpg',
    images: ['template1.jpg', 'template2.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator2',
    creatorName: 'Jane Doe'
  },
  {
    id: '3',
    title: 'Nature Photo Pack',
    description: 'High-resolution nature photographs for commercial use',
    price: 29.99,
    type: 'IMAGE',
    thumbnail: 'nature-thumb.jpg',
    images: ['nature1.jpg', 'nature2.jpg', 'nature3.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator3',
    creatorName: 'Mike Johnson'
  },
  {
    id: '4',
    title: 'JavaScript Masterclass',
    description: 'Advanced JavaScript programming course for developers',
    price: 149.99,
    type: 'COURSE',
    thumbnail: 'js-course-thumb.jpg',
    images: ['js1.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator1',
    creatorName: 'John Smith'
  },
  {
    id: '5',
    title: 'Meditation Audio Series',
    description: 'Relaxing meditation sessions for stress relief',
    price: 19.99,
    type: 'AUDIO',
    thumbnail: 'meditation-thumb.jpg',
    images: ['meditation.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator4',
    creatorName: 'Sarah Wilson'
  },
  {
    id: '6',
    title: 'Video Editing Software',
    description: 'Professional video editing tool for content creators',
    price: 199.99,
    type: 'SOFTWARE',
    thumbnail: 'video-editor-thumb.jpg',
    images: ['software1.jpg', 'software2.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator5',
    creatorName: 'Alex Chen'
  },
  {
    id: '7',
    title: 'Cooking Recipe eBook',
    description: 'Delicious recipes from around the world',
    price: 15.99,
    type: 'EBOOK',
    thumbnail: 'cookbook-thumb.jpg',
    images: ['cookbook.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator6',
    creatorName: 'Maria Garcia'
  },
  {
    id: '8',
    title: 'Workout Training Videos',
    description: 'Home fitness training videos for all skill levels',
    price: 39.99,
    type: 'VIDEO',
    thumbnail: 'workout-thumb.jpg',
    images: ['workout1.jpg', 'workout2.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator4',
    creatorName: 'Sarah Wilson'
  },
  {
    id: '9',
    title: 'Business Plan Template',
    description: 'Professional business plan template for startups',
    price: 25.99,
    type: 'TEMPLATE',
    thumbnail: 'business-template-thumb.jpg',
    images: ['business-template.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator7',
    creatorName: 'Robert Brown'
  },
  {
    id: '10',
    title: 'Abstract Art Collection',
    description: 'Modern abstract artwork for digital and print use',
    price: 35.99,
    type: 'IMAGE',
    thumbnail: 'abstract-art-thumb.jpg',
    images: ['abstract1.jpg', 'abstract2.jpg', 'abstract3.jpg'],
    status: 'PUBLISHED',
    creatorId: 'creator8',
    creatorName: 'Emily Davis'
  }
];

async function runTests() {
  console.log('🚀 Starting Elasticsearch Search Tests...\n');

  try {
    // 1. Check connection
    console.log('1. Checking Elasticsearch connection...');
    await checkConnection();
    console.log('✅ Connection successful\n');

    // 2. Create index
    console.log('2. Creating product index...');
    await createProductIndex();
    console.log('✅ Index created/verified\n');

    // 3. Clear existing data
    console.log('3. Clearing existing products...');
    await clearAllProducts();
    console.log('✅ Products cleared\n');

    // 4. Index sample products
    console.log('4. Indexing sample products...');
    await bulkIndexProducts(sampleProducts);
    console.log('✅ Sample products indexed\n');

    // 5. Verify products are indexed
    console.log('5. Verifying indexed products...');
    const allProducts = await getAllProducts();
    console.log(`✅ Total products in index: ${allProducts.length}\n`);

    // 6. Test searches
    console.log('6. Running search tests...\n');

    // Test 1: Search without query (match all)
    console.log('--- Test 1: Empty query (match all) ---');
    const allResults = await searchProducts('');
    console.log(`Results: ${allResults.products.length} products found`);
    console.log('Titles:', allResults.products.filter(p => p).map(p => p!.title).join(', '));
    console.log('');

    // Test 2: Search by title
    console.log('--- Test 2: Search by title "photography" ---');
    const photoResults = await searchProducts('photography');
    console.log(`Results: ${photoResults.products.length} products found`);
    photoResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName}`);
    });
    console.log('');

    // Test 3: Search by creator name
    console.log('--- Test 3: Search by creator "John Smith" ---');
    const johnResults = await searchProducts('John Smith');
    console.log(`Results: ${johnResults.products.length} products found`);
    johnResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName}`);
    });
    console.log('');

    // Test 4: Search by description
    console.log('--- Test 4: Search by description "developers" ---');
    const devResults = await searchProducts('developers');
    console.log(`Results: ${devResults.products.length} products found`);
    devResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) - ${p!.description}`);
    });
    console.log('');

    // Test 5: Search with type filter - only COURSE
    console.log('--- Test 5: Search "course" with type filter [COURSE] ---');
    const courseResults = await searchProducts('course', ['COURSE']);
    console.log(`Results: ${courseResults.products.length} products found`);
    courseResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName} - $${p!.price}`);
    });
    console.log('');

    // Test 6: Search with multiple type filters
    console.log('--- Test 6: Search "template" with type filter [TEMPLATE, IMAGE] ---');
    const templateResults = await searchProducts('template', ['TEMPLATE', 'IMAGE']);
    console.log(`Results: ${templateResults.products.length} products found`);
    templateResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName} - $${p!.price}`);
    });
    console.log('');

    // Test 7: Search with no type filter (empty array)
    console.log('--- Test 7: Search "video" with empty type filter ---');
    const videoResults = await searchProducts('video', []);
    console.log(`Results: ${videoResults.products.length} products found`);
    videoResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName}`);
    });
    console.log('');

    // Test 8: Search with fuzzy matching
    console.log('--- Test 8: Fuzzy search "photgraphy" (misspelled) ---');
    const fuzzyResults = await searchProducts('photgraphy');
    console.log(`Results: ${fuzzyResults.products.length} products found`);
    fuzzyResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName}`);
    });
    console.log('');

    // Test 9: Search for specific product type only
    console.log('--- Test 9: Show only AUDIO products ---');
    const audioResults = await searchProducts('', ['AUDIO']);
    console.log(`Results: ${audioResults.products.length} products found`);
    audioResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName} - $${p!.price}`);
    });
    console.log('');

    // Test 10: Complex search combining title, description, and creator
    console.log('--- Test 10: Search "Sarah" (should match creator name) ---');
    const sarahResults = await searchProducts('Sarah');
    console.log(`Results: ${sarahResults.products.length} products found`);
    sarahResults.products.filter(p => p).forEach(p => {
      console.log(`- ${p!.title} (${p!.type}) by ${p!.creatorName}`);
    });
    console.log('');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests automatically when this file is executed directly
runTests();

export { runTests, sampleProducts };
