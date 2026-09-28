import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileCheck2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { performLocalInvoiceOCR, type ExtractedGSTInvoice } from '../services/ocrService';
import confetti from 'canvas-confetti';

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onInvoiceSaved: (tableId: string) => void;
}

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onInvoiceSaved,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedGSTInvoice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setExtractedData(null);
    }
  };

  // Generate an authentic sample GST invoice canvas image for immediate 1-click test
  const loadSampleGSTInvoice = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 840, 1040);

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAX INVOICE', 450, 75);

    // Vendor details
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('RAJASTHAN TEXTILES & FURNISHINGS PVT LTD', 50, 125);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText('Plot 42, Industrial Area Phase II, Jaipur, Rajasthan', 50, 155);
    ctx.fillText('GSTIN: 08AAACR4921C1ZO', 50, 185);
    ctx.fillText('State: Rajasthan | Code: 08', 50, 215);

    // Invoice Meta
    ctx.strokeRect(50, 240, 800, 70);
    ctx.fillText('Invoice No: RJ/2026/8941', 70, 275);
    ctx.fillText(`Date: ${new Date().toISOString().split('T')[0]}`, 70, 295);
    ctx.fillText('Buyer: Premier Home Stores', 500, 275);
    ctx.fillText('GSTIN: 07AABCP1234F1ZX', 500, 295);

    // Table Header
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(50, 330, 800, 40);
    ctx.strokeRect(50, 330, 800, 40);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('SN', 65, 355);
    ctx.fillText('Description of Goods', 120, 355);
    ctx.fillText('HSN Code', 420, 355);
    ctx.fillText('Qty', 550, 355);
    ctx.fillText('Rate (₹)', 630, 355);
    ctx.fillText('Amount (₹)', 730, 355);

    // Table Rows
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText('1', 65, 410);
    ctx.fillText('Premium Velvet Sofa Fabric (Blue)', 120, 410);
    ctx.fillText('5407', 420, 410);
    ctx.fillText('20 Mtrs', 550, 410);
    ctx.fillText('850.00', 630, 410);
    ctx.fillText('17,000.00', 730, 410);

    ctx.fillText('2', 65, 460);
    ctx.fillText('Cotton Jacquard Cloth Bundles', 120, 460);
    ctx.fillText('5208', 420, 460);
    ctx.fillText('5 Bundles', 550, 460);
    ctx.fillText('1,600.00', 630, 460);
    ctx.fillText('8,000.00', 730, 460);

    // Calculations Box
    ctx.strokeRect(450, 520, 400, 200);
    ctx.fillText('Taxable Value:', 470, 555);
    ctx.fillText('₹ 25,000.00', 730, 555);

    ctx.fillText('CGST @ 6%:', 470, 595);
    ctx.fillText('₹ 1,500.00', 730, 595);

    ctx.fillText('SGST @ 6%:', 470, 635);
    ctx.fillText('₹ 1,500.00', 730, 635);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText('Grand Total:', 470, 685);
    ctx.fillText('₹ 28,000.00', 730, 685);

    // Authorized Signature
    ctx.font = 'italic 15px sans-serif';
    ctx.fillText('Authorized Signatory for Rajasthan Textiles', 500, 950);

    const dataUrl = canvas.toDataURL('image/png');
    setImagePreview(dataUrl);
    setFile(null);
    setExtractedData(null);
  };

  // Run the 100% Offline OCR
  const handleStartOCR = async () => {
    if (!imagePreview && !file) return;

    try {
      setIsProcessing(true);
      setProgress(5);
      setStatusMessage('Preparing image...');

      const target = file || imagePreview!;
      const result = await performLocalInvoiceOCR(target, (p, msg) => {
        setProgress(p);
        setStatusMessage(msg);
      });

      setExtractedData(result.extracted);
      setIsProcessing(false);

      // Trigger celebration confetti!
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('OCR Error:', err);
      setStatusMessage('Failed to scan invoice: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    onInvoiceSaved('gst_invoices');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base">GST Bill OCR Scanner</h3>
              <p className="text-xs text-zinc-400">100% Offline • In-Browser Tesseract Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Upload / Try Sample Box */}
          {!imagePreview ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  darkMode
                    ? 'border-zinc-800 hover:border-indigo-500/60 bg-zinc-900/30'
                    : 'border-zinc-300 hover:border-indigo-500 bg-zinc-50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-medium text-sm">Upload GST Invoice Image</h4>
                <p className="text-xs text-zinc-400 text-center max-w-sm mt-1">
                  Supports JPG, PNG, WebP bills. Extracted offline using local machine vision.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-center">
                <span className="text-xs text-zinc-500 px-3">OR</span>
              </div>

              {/* Sample Bill Generator Button */}
              <button
                type="button"
                onClick={loadSampleGSTInvoice}
                className={`w-full py-3 px-4 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  darkMode
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Try Instant Demo with Sample GST Purchase Bill</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview image */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 max-h-56 bg-zinc-900 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Bill Preview"
                  className="max-h-56 w-auto object-contain"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setFile(null);
                    setExtractedData(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar when processing */}
              {isProcessing && (
                <div className="space-y-2 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-400 font-medium flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {statusMessage}
                    </span>
                    <span className="font-mono text-indigo-300">{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Extracted Data Card */}
              {extractedData && (
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    darkMode ? 'bg-zinc-900/80 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Successfully Extracted & Stored in GST Purchase Bills</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Vendor / Firm</span>
                      <span className="font-semibold">{extractedData.vendorName}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">GSTIN</span>
                      <span className="font-mono text-indigo-400">{extractedData.gstin}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Invoice # & Date</span>
                      <span>
                        {extractedData.invoiceNumber} • {extractedData.date}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Total Amount</span>
                      <span className="font-semibold text-emerald-400 text-sm">
                        ₹{extractedData.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {!extractedData ? (
                  <button
                    onClick={handleStartOCR}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl font-medium text-xs bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 text-white hover:opacity-95 shadow-md flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing OCR Locally...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Scan & Extract Bill Now</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDone}
                    className="w-full py-3 rounded-xl font-medium text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-2"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>View in GST Purchase Bills Table</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
