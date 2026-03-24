import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testApiResponse() {
  console.log(`Testing API at: ${API_URL}`);

  try {
    const response = await fetch(`${API_URL}/api/v1/vendors/slug/omnicassion`);

    if (!response.ok) {
      console.log(`API returned status: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }

    const data = await response.json();

    console.log('\nVendor:', data.businessName);
    console.log('Portfolios count:', data.portfolios?.length || 0);

    if (data.portfolios?.length > 0) {
      console.log('\nPortfolios:');
      data.portfolios.forEach((p: any, idx: number) => {
        console.log(`  [${idx + 1}] ${p.title}`);
        console.log(`      isFeatured: ${p.isFeatured} (type: ${typeof p.isFeatured})`);
        console.log(`      mediaItems: ${p.mediaItems?.length || 0}`);
      });

      const featured = data.portfolios.filter((p: any) => p.isFeatured === true);
      const nonFeatured = data.portfolios.filter((p: any) => p.isFeatured !== true);

      console.log(`\nFeatured portfolios: ${featured.length}`);
      console.log(`Non-featured portfolios: ${nonFeatured.length}`);
    }
  } catch (error) {
    console.error('Error fetching API:', error);
  }
}

testApiResponse();
