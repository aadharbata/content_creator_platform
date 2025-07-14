const https = require('http');

async function testProductsAPI() {
  console.log('🧪 Testing Products API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/products?page=1&limit=10');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response successful!');
      console.log(`\n📊 API Status: ${response.status}`);
      console.log(`📦 Total Products: ${data.pagination.total}`);
      console.log(`📄 Current Page: ${data.pagination.page}`);
      console.log(`🔢 Per Page: ${data.pagination.limit}`);
      console.log(`📑 Total Pages: ${data.pagination.totalPages}`);
      
      console.log('\n🛍️ Products:');
      data.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   💰 Price: $${product.price}`);
        console.log(`   📱 Type: ${product.type}`);
        console.log(`   ⭐ Rating: ${product.rating}/5.0`);
        console.log(`   📈 Sales: ${product.sales}`);
        console.log(`   👤 Creator: ${product.creator.name}`);
        console.log(`   🏷️ Category: ${product.category || 'None'}`);
        console.log(`   🖼️ Image: ${product.thumbnail}`);
        console.log(`   📝 Description: ${product.description ? product.description.substring(0, 100) + '...' : 'No description'}`);
      });
      
      console.log('\n✅ All products loaded successfully!');
      console.log('🌐 You can now visit the product store at: http://localhost:3000/consumer-channel');
      
    } else {
      console.error('❌ API Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('💡 Make sure the dev server is running with: npm run dev');
  }
}

testProductsAPI(); 