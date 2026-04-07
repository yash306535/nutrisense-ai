import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProductByBarcode, initBarcodeScanner, stopBarcodeScanner } from '../services/barcodeService';
import { aiAPI, mealAPI } from '../services/api';
import Button from '../components/atoms/Button';
import Spinner from '../components/atoms/Spinner';
import NutritionBadge from '../components/molecules/NutritionBadge';

export default function FoodScanner() {
  const [mode, setMode] = useState('choice'); // choice | camera | upload | result
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    return () => { stopBarcodeScanner(); };
  }, []);

  const startCamera = async () => {
    setMode('camera');
    setScanning(true);
    setTimeout(async () => {
      try {
        await initBarcodeScanner(cameraRef.current, async (barcode) => {
          setScanning(false);
          await stopBarcodeScanner();
          toast.loading('Looking up product...', { id: 'barcode' });
          const data = await fetchProductByBarcode(barcode);
          toast.dismiss('barcode');
          if (data) {
            setProduct(data);
            setMode('result');
          } else {
            toast.error('Product not found in database');
            setMode('choice');
          }
        });
      } catch (err) {
        toast.error('Camera not available');
        setMode('choice');
        setScanning(false);
      }
    }, 300);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMode('upload');
    setOcrLoading(true);

    try {
      // Use Tesseract.js for OCR
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.default.recognize(file, 'eng');

      // Send OCR text to LLM
      const res = await aiAPI.analyzeMeal({ mealInput: `Nutrition label text: ${text.slice(0, 500)}` });
      const analyzed = res.data.data;

      setProduct({
        product_name: analyzed.name,
        serving_size: '100g',
        calories: analyzed.calories,
        protein_g: analyzed.protein_g,
        carbs_g: analyzed.carbs_g,
        fat_g: analyzed.fat_g,
        fiber_g: analyzed.fiber_g,
        sugar_g: analyzed.sugar_g,
        sodium_mg: analyzed.sodium_mg,
        allergens: analyzed.allergens || [],
        health_score: analyzed.health_score,
      });
      setMode('result');
    } catch (err) {
      toast.error('Failed to read label. Please try again.');
      setMode('choice');
    } finally {
      setOcrLoading(false);
    }
  };

  const logMutation = useMutation({
    mutationFn: () =>
      mealAPI.logMeal({
        name: product.product_name,
        mealCategory: 'snack',
        calories: product.calories,
        protein: product.protein_g,
        carbs: product.carbs_g,
        fat: product.fat_g,
        fiber: product.fiber_g || 0,
        sugar: product.sugar_g || 0,
        sodium: product.sodium_mg || 0,
        source: 'barcode',
        allergens: product.allergens || [],
        healthScore: product.health_score || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-meals'] });
      toast.success('Product logged!');
      setMode('choice');
      setProduct(null);
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Food Scanner</h1>
        <p className="text-text-muted text-sm">Scan barcodes or upload nutrition labels</p>
      </div>

      <AnimatePresence mode="wait">
        {/* Choice */}
        {mode === 'choice' && (
          <motion.div key="choice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Camera size={40} className="text-primary" />
                <div>
                  <p className="font-bold text-text-primary">Scan Barcode</p>
                  <p className="text-xs text-text-muted">Use your camera</p>
                </div>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-secondary hover:bg-secondary/5 transition-all"
              >
                <Upload size={40} className="text-secondary" />
                <div>
                  <p className="font-bold text-text-primary">Upload Label</p>
                  <p className="text-xs text-text-muted">AI reads the label</p>
                </div>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
              <p className="text-sm text-text-primary font-semibold mb-1">🤖 AI-Powered Label Reading</p>
              <p className="text-xs text-text-muted">
                Upload any nutrition label photo — our AI will extract all the nutritional information automatically.
              </p>
            </div>
          </motion.div>
        )}

        {/* Camera */}
        {mode === 'camera' && (
          <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              <div ref={cameraRef} className="w-full h-full" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary w-64 h-40 rounded-xl">
                    <div className="w-full h-0.5 bg-primary animate-bounce" />
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Scanning...
              </div>
              <button
                onClick={() => { stopBarcodeScanner(); setMode('choice'); setScanning(false); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-center text-text-muted text-sm">Point your camera at a product barcode</p>
          </motion.div>
        )}

        {/* OCR Loading */}
        {mode === 'upload' && ocrLoading && (
          <motion.div key="ocr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-4 font-semibold text-text-primary">Reading nutrition label...</p>
            <p className="text-text-muted text-sm mt-1">AI is analyzing your image</p>
          </motion.div>
        )}

        {/* Result */}
        {mode === 'result' && product && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Product header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-text-primary text-lg">{product.product_name}</h2>
                  {product.brands && <p className="text-sm text-text-muted">{product.brands}</p>}
                  <p className="text-xs text-text-muted mt-1">Per {product.serving_size}</p>
                </div>
                {product.health_score > 0 && <NutritionBadge score={product.health_score} />}
              </div>

              {/* Nutrition Facts Panel */}
              <div className="border-2 border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-2">
                  <p className="font-black text-xl" style={{ fontFamily: 'serif' }}>Nutrition Facts</p>
                  <p className="text-xs opacity-75">Serving Size {product.serving_size}</p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="border-b-4 border-slate-800 pb-2 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-600">Calories</p>
                      <p className="text-4xl font-black font-mono">{product.calories}</p>
                    </div>
                  </div>
                  {[
                    { label: 'Total Fat', value: product.fat_g, unit: 'g' },
                    { label: 'Total Carbohydrate', value: product.carbs_g, unit: 'g' },
                    { label: 'Dietary Fiber', value: product.fiber_g, unit: 'g', indent: true },
                    { label: 'Total Sugars', value: product.sugar_g, unit: 'g', indent: true },
                    { label: 'Protein', value: product.protein_g, unit: 'g' },
                    { label: 'Sodium', value: product.sodium_mg, unit: 'mg' },
                  ].map((row) => (
                    <div key={row.label} className={`flex justify-between text-sm border-b border-slate-200 pb-1 ${row.indent ? 'pl-4 text-xs text-slate-600' : ''}`}>
                      <span className={row.indent ? '' : 'font-semibold'}>{row.label}</span>
                      <span className="font-mono">{Math.round(row.value || 0)}{row.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {product.allergens?.length > 0 && (
                <div className="mt-3 p-3 bg-warning/10 rounded-xl">
                  <p className="text-xs font-bold text-warning">Contains: {product.allergens.join(', ')}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setMode('choice'); setProduct(null); }}>Back</Button>
              <Button fullWidth icon={Plus} onClick={() => logMutation.mutate()} loading={logMutation.isPending}>
                Add to Today's Log
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
