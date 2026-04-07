/**
 * Fetch product nutrition data from Open Food Facts API.
 * @param {string} barcode - EAN/UPC barcode string
 * @returns {Promise<Object|null>} Normalized nutrition object or null if not found
 */
export async function fetchProductByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments || {};

  return {
    product_name: p.product_name || p.product_name_en || 'Unknown Product',
    brands: p.brands || '',
    serving_size: p.serving_size || '100g',
    image_url: p.image_url || null,
    calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
    protein_g: Math.round((n.proteins_100g || 0) * 10) / 10,
    carbs_g: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    fat_g: Math.round((n.fat_100g || 0) * 10) / 10,
    fiber_g: Math.round((n.fiber_100g || 0) * 10) / 10,
    sugar_g: Math.round((n.sugars_100g || 0) * 10) / 10,
    sodium_mg: Math.round((n.sodium_100g || 0) * 1000 * 10) / 10,
    nutriscore: p.nutriscore_grade || null,
    allergens: p.allergens_tags?.map((a) => a.replace('en:', '')) || [],
  };
}

/**
 * Initialize Quagga barcode scanner on a video element.
 * @param {HTMLElement} container - DOM element to mount camera feed
 * @param {Function} onDetected - Callback with decoded barcode string
 * @returns {Promise<void>}
 */
export async function initBarcodeScanner(container, onDetected) {
  const Quagga = (await import('@ericblade/quagga2')).default;

  return new Promise((resolve, reject) => {
    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: container,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        locator: { patchSize: 'medium', halfSample: true },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency: 10,
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader'],
        },
        locate: true,
      },
      (err) => {
        if (err) return reject(err);
        Quagga.start();
        resolve();
      },
    );

    let lastCode = null;
    let lastTime = 0;

    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      const now = Date.now();
      // Debounce — only fire if different code or 3s passed
      if (code !== lastCode || now - lastTime > 3000) {
        lastCode = code;
        lastTime = now;
        onDetected(code);
      }
    });
  });
}

/**
 * Stop the Quagga scanner.
 */
export async function stopBarcodeScanner() {
  try {
    const Quagga = (await import('@ericblade/quagga2')).default;
    Quagga.stop();
  } catch {
    // Scanner may not be running
  }
}
