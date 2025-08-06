import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '../../../elasticsearch/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  // Optionally support type filtering via ?types=type1,type2
  const typesParam = searchParams.get('types');
  const types = typesParam ? typesParam.split(',').map(t => t.trim()).filter(Boolean) : undefined;

  // Allow search if we have either a query or type filters
  if (!q.trim() && (!types || types.length === 0)) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { products } = await searchProducts(q, types);
    // Format results for the client
    const results = (products || [])
      .filter((product): product is NonNullable<typeof product> => !!product)
      .map(product => ({
        id: product.id,
        title: product.title,
        snippet: product.description ? product.description.slice(0, 180) : '',
        url: `/store/${product.id}`,
        price: product.price,
        type: product.type,
        thumbnail: product.thumbnail,
        creatorName: product.creatorName,
        status: product.status,
      }));
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ results: [], error: 'Server error' }, { status: 500 });
  }
}
