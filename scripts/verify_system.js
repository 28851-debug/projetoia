const createApp = require('../backend/src/app');
const { getDatabase } = require('../backend/src/config/database');

async function runEndToEndVerification() {
  console.log('=== Starting End-to-End System Verification ===\n');

  const app = createApp();
  const PORT = 3001; // test verification port

  const server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => {
      console.log(`[OK] Server started on http://localhost:${PORT}`);
      resolve(s);
    });
  });

  const baseUrl = `http://localhost:${PORT}`;

  try {
    // 1. Verify frontend index.html loads
    console.log('\n--- 1. Testing Frontend Static Delivery ---');
    const indexRes = await fetch(`${baseUrl}/`);
    console.log(`GET / -> HTTP ${indexRes.status}`);
    const indexText = await indexRes.text();
    if (!indexText.includes('StockMaster Varejo') || !indexText.includes('product-tbody')) {
      throw new Error('Index HTML content verification failed');
    }
    console.log('[OK] Frontend index.html served correctly.');

    const cssRes = await fetch(`${baseUrl}/css/styles.css`);
    console.log(`GET /css/styles.css -> HTTP ${cssRes.status}`);
    if (cssRes.status !== 200) throw new Error('CSS static delivery failed');
    console.log('[OK] CSS served correctly.');

    const jsRes = await fetch(`${baseUrl}/js/app.js`);
    console.log(`GET /js/app.js -> HTTP ${jsRes.status}`);
    if (jsRes.status !== 200) throw new Error('JS static delivery failed');
    console.log('[OK] JavaScript served correctly.');

    // 2. Clear products if any (for clean verification)
    console.log('\n--- 2. Testing API Product Creation (Keyboard, $50.00, 200 units) ---');
    const createRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Keyboard',
        price: 50.00,
        quantity: 200
      })
    });
    console.log(`POST /api/products -> HTTP ${createRes.status}`);
    const createdProduct = await createRes.json();
    console.log('Response:', JSON.stringify(createdProduct, null, 2));

    if (createdProduct.quantity !== 200 || createdProduct.name !== 'Keyboard') {
      throw new Error('Product creation verification failed');
    }
    const productId = createdProduct.id;
    console.log(`[OK] Product created with ID ${productId}. Initial stock: ${createdProduct.quantity}`);

    // 3. User adds 20 units -> stock must become 220
    console.log('\n--- 3. Testing Stock Addition (+20 units) ---');
    const addRes = await fetch(`${baseUrl}/api/products/${productId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: 20,
        reason: 'Purchased 20 additional units'
      })
    });
    console.log(`POST /api/products/${productId}/stock -> HTTP ${addRes.status}`);
    const addedData = await addRes.json();
    console.log('Response:', JSON.stringify(addedData, null, 2));
    if (addedData.quantity !== 220) {
      throw new Error(`Expected quantity 220, got ${addedData.quantity}`);
    }
    console.log(`[OK] Stock successfully increased to ${addedData.quantity} (Previous: ${addedData.previousQuantity}, Added: ${addedData.added})`);

    // 4. User removes 15 units -> stock must become 205
    console.log('\n--- 4. Testing Stock Removal (-15 units) ---');
    const removeRes = await fetch(`${baseUrl}/api/products/${productId}/stock/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: 15,
        reason: 'Sold 15 units to retail customer'
      })
    });
    console.log(`POST /api/products/${productId}/stock/remove -> HTTP ${removeRes.status}`);
    const removedData = await removeRes.json();
    console.log('Response:', JSON.stringify(removedData, null, 2));
    if (removedData.quantity !== 205) {
      throw new Error(`Expected quantity 205, got ${removedData.quantity}`);
    }
    console.log(`[OK] Stock successfully decreased to ${removedData.quantity} (Previous: ${removedData.previousQuantity}, Removed: ${removedData.removed})`);

    // 5. User attempts to remove 300 units -> must be rejected with 409 Conflict, stock stays 205
    console.log('\n--- 5. Testing Negative Inventory Protection (Attempt to remove 300 units) ---');
    const invalidRemoveRes = await fetch(`${baseUrl}/api/products/${productId}/stock/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: 300,
        reason: 'Attempt invalid withdrawal exceeding stock'
      })
    });
    console.log(`POST /api/products/${productId}/stock/remove -> HTTP ${invalidRemoveRes.status}`);
    const invalidRemoveData = await invalidRemoveRes.json();
    console.log('Error Response:', JSON.stringify(invalidRemoveData, null, 2));

    if (invalidRemoveRes.status !== 409) {
      throw new Error(`Expected HTTP 409 Conflict, got ${invalidRemoveRes.status}`);
    }
    console.log('[OK] Request rejected with 409 Conflict.');

    // Verify stock is still 205
    const verifyStockRes = await fetch(`${baseUrl}/api/products/${productId}`);
    const verifyStockData = await verifyStockRes.json();
    console.log(`Verification: Product quantity is currently ${verifyStockData.quantity}`);
    if (verifyStockData.quantity !== 205) {
      throw new Error(`Stock was altered on rejected transaction! Expected 205, got ${verifyStockData.quantity}`);
    }
    console.log('[OK] Stock was preserved at 205 units.');

    // 6. Inspect Movement Audit History
    console.log('\n--- 6. Testing Audit Log / Movement History ---');
    const movementsRes = await fetch(`${baseUrl}/api/products/${productId}/movements`);
    console.log(`GET /api/products/${productId}/movements -> HTTP ${movementsRes.status}`);
    const movements = await movementsRes.json();
    console.log(`Found ${movements.length} logged movements:`);
    movements.forEach((m) => {
      console.log(`  - [${m.type}] Qty: ${m.quantity} | Prev: ${m.previousQuantity} -> New: ${m.newQuantity} | Reason: "${m.reason || ''}"`);
    });

    if (movements.length < 3) {
      throw new Error('Expected at least 3 movement entries (INITIAL, ADD, REMOVE)');
    }
    console.log('[OK] Audit trail correctly logged all lifecycle events.');

    // 7. Inspect Dashboard Summary Stats
    console.log('\n--- 7. Testing Dashboard Stats ---');
    const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`);
    console.log(`GET /api/dashboard/stats -> HTTP ${statsRes.status}`);
    const stats = await statsRes.json();
    console.log('Dashboard Stats:', JSON.stringify(stats, null, 2));
    if (stats.totalStockUnits < 205) {
      throw new Error('Stats totalStockUnits incorrect');
    }
    console.log('[OK] Dashboard stats calculated correctly.');

    console.log('\n=== ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log('[OK] Server closed cleanly.');
  }
}

runEndToEndVerification().catch((err) => {
  console.error('[ERROR] Verification failed:', err);
  process.exit(1);
});
