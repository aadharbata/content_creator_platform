import { Client } from '@elastic/elasticsearch';
import 'dotenv/config';

// Use environment variables for connection details
// For local Docker setup:
const node = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

const client = new Client({
  node,
})

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  type: string; // ProductType enum
  thumbnail?: string;
  images: string[]; // Array of image URLs
  status: string; // ProductStatus enum (DRAFT, PUBLISHED, etc.)
  creatorId: string;
  creatorName: string;
}

// A simple function to check the connection
export async function checkConnection() {
  try {
    const info = await client.info();
    console.log('Successfully connected to Elasticsearch!', info);
  } catch (error) {
    console.error('Connection to Elasticsearch failed:', error);
  }
}
export async function createProductIndex() {
  const indexName = 'products';
  const exists = await client.indices.exists({ index: indexName });

  if (!exists) {
    await client.indices.create({
      index: indexName,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0, // For development
        analysis: {
          analyzer: {
            custom_text_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'snowball']
            }
          }
        }
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { 
            type: 'text',
            analyzer: 'custom_text_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              suggest: {
                type: 'completion',
                analyzer: 'simple'
              }
            }
          },
          description: { 
            type: 'text',
            analyzer: 'custom_text_analyzer'
          },
          price: { type: 'float' },
          type: { 
            type: 'keyword',
            fields: {
              text: { type: 'text' }
            }
          },
          thumbnail: { type: 'keyword' },
          images: { type: 'keyword' }, // Array of image URLs
          status: { type: 'keyword' },
          creatorId: { type: 'keyword' },
          creatorName: { 
            type: 'text',
            analyzer: 'custom_text_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              suggest: {
                type: 'completion',
                analyzer: 'simple'
              }
            }
          },
          created_at: { 
            type: 'date',
            format: 'strict_date_optional_time||epoch_millis'
          },
          updated_at: { 
            type: 'date',
            format: 'strict_date_optional_time||epoch_millis'
          }
        },
      },
    });
    console.log(`Index '${indexName}' created successfully.`);
  } else {
    console.log(`Index '${indexName}' already exists.`);
  }
}

// A function to index a single product
export async function indexProduct(product: Product) {
  const result = await client.index({
    index: 'products',
    id: product.id,
    document: product,
  });
  
  // Refresh the index to make the document immediately searchable
  await client.indices.refresh({ index: 'products' });
  
  return result;
}

// Simple search function - query on title and description with optional type filtering
export async function searchProducts(
  query: string, 
  types?: string[]
) {
  const filters = [];
  
  // Type filter - if types array is provided and not empty
  if (types && types.length > 0) {
    filters.push({
      terms: { 'type.keyword': types }  // Use the keyword subfield for exact matching
    });
  }

  // Build query
  let searchQuery: any;
  
  if (!query || query.trim() === '') {
    // Empty query - match all
    searchQuery = { match_all: {} };
  } else {
    // Multi-match query on title, description, and creator name
    searchQuery = {
      multi_match: {
        query: query,
        fields: [
          'title^2',      // Boost title matches
          'description',  // Search in description
          'creatorName'   // Search in creator name
        ],
        fuzziness: 'AUTO'
      }
    };
  }

  const searchBody: any = {
    index: 'products',
    size: 100, // Default size
  };

  // Build the query
  if (!query || query.trim() === '') {
    if (filters.length > 0) {
      // Empty query with filters - use filtered query
      searchBody.query = {
        bool: {
          filter: filters
        }
      };
    } else {
      // Empty query, no filters - match all
      searchBody.query = { match_all: {} };
    }
  } else {
    if (filters.length > 0) {
      // Query with filters
      searchBody.query = {
        bool: {
          must: searchQuery,
          filter: filters
        }
      };
    } else {
      // Query without filters
      searchBody.query = searchQuery;
    }
  }

  const response = await client.search<Product>(searchBody);
  const { hits } = response;

  return {
    products: hits.hits.map(hit => hit._source),
    total: typeof hits.total === 'number' ? hits.total : hits.total?.value || 0,
  };
}

// Bulk indexing for production
export async function bulkIndexProducts(products: Product[]) {
  const body = products.flatMap(product => [
    { index: { _index: 'products', _id: product.id } },
    product
  ]);

  const result = await client.bulk({ body });
  
  if (result.errors) {
    const errors = result.items
      .filter((item: any) => item.index?.error)
      .map((item: any) => item.index.error);
    throw new Error(`Bulk indexing failed: ${JSON.stringify(errors)}`);
  }

  // Refresh index after bulk operation
  await client.indices.refresh({ index: 'products' });
  
  return result;
}

// Clear all products (for testing)
export async function clearAllProducts() {
  await client.deleteByQuery({
    index: 'products',
    query: { match_all: {} },
  });
  
  await client.indices.refresh({ index: 'products' });
}

// Function to get all products for debugging
export async function getAllProducts() {
  const { hits } = await client.search<Product>({
    index: 'products',
    query: {
      match_all: {}
    },
    size: 100
  });

  console.log('All products in index:', hits.hits.length);
  hits.hits.forEach(hit => {
    console.log('Product:', JSON.stringify(hit._source, null, 2));
  });

  return hits.hits.map(hit => hit._source);
}