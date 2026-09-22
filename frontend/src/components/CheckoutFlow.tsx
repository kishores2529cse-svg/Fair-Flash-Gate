import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, QrCode, CreditCard, Wallet, Building2, CheckCircle2, XCircle, Timer } from 'lucide-react';

interface Seat {
  id: string;
  tier: string;
  price: number;
}

interface FoodItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  qty: number;
}

interface CheckoutFlowProps {
  movieTitle: string;
  selectedSeats: Seat[];
  onCancelPayment: () => void;
  onPaymentSuccess: () => void;
}

export default function CheckoutFlow({
  movieTitle,
  selectedSeats,
  onCancelPayment,
  onPaymentSuccess,
}: CheckoutFlowProps) {
  // Step state: 'food' | 'summary' | 'processing' | 'confirmed'
  const [step, setStep] = useState<'food' | 'summary' | 'processing' | 'confirmed'>('food');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5-minute countdown (300 seconds)
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbank' | 'wallet'>('upi');

  // Food items state
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    {
      id: 'f1',
      name: 'Medium Popcorn',
      desc: 'Salted / Buttered Medium Popcorn',
      price: 250,
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f2',
      name: 'Caramel Popcorn',
      desc: 'Sweet & Crunchy Caramel Popcorn',
      price: 160,
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f3',
      name: 'Gold Combo',
      desc: 'Medium Popcorn + 2 Regular Cokes',
      price: 390,
      image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281313?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f4',
      name: 'Chicken Feast Combo',
      desc: 'Chicken Burger + French Fries + Coke',
      price: 390,
      image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
  ]);

  // Handle 5-minute countdown timer during processing step
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'processing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onCancelPayment(); // Time expired -> cancel and release seats!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft, onCancelPayment]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculations
  const ticketsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const foodTotal = foodItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const convenienceFee = 41.3;
  const orderTotal = ticketsTotal + foodTotal + convenienceFee;

  const handleFoodQty = (id: string, delta: number) => {
    setFoodItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      )
    );
  };

  const handleConfirmPayment = () => {
    setStep('confirmed');
    setTimeout(() => {
      onPaymentSuccess();
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f6f8] text-zinc-900 font-inter select-none flex flex-col">
      {/* GLOBAL TOP HEADER BAR WITH CANCEL BUTTON ACROSS ALL STEPS */}
      {step !== 'confirmed' && (
        <div className="w-full bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCancelModal(true)}
                className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors cursor-pointer"
                title="Cancel Booking"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base md:text-lg font-bold text-zinc-800 leading-none mb-1">
                  {movieTitle}
                </h1>
                <p className="text-xs text-zinc-500 font-medium">
                  {selectedSeats.length} Seat(s) Locked: <span className="font-bold text-zinc-800">{selectedSeats.map((s) => s.id).join(', ')}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Seat Hold Lock Badge */}
              <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
                <Timer className="w-3.5 h-3.5 text-amber-600" />
                <span>Seats Locked Temporarily</span>
              </div>

              {/* TOP CANCEL BUTTON (IMMEDIATELY UNLOCKS SEATS IF CLICKED!) */}
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span>CANCEL BOOKING</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: FOOD & BEVERAGES (Grab a Bite!) */}
      {step === 'food' && (
        <div className="max-w-6xl mx-auto p-4 md:p-8 flex-1">
          <div className="flex items-center justify-between mb-6 border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-zinc-800">Grab a Bite!</h2>
              <p className="text-xs text-zinc-500 font-medium">
                Add snacks & drinks to your movie experience
              </p>
            </div>
            <button
              onClick={() => setStep('summary')}
              className="bg-[#eb4d5e] hover:bg-[#d93b4d] text-white px-7 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer"
            >
              Skip
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foodItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-zinc-200 rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-800 text-sm">{item.name}</h3>
                      <p className="text-xs text-zinc-500 mb-2">{item.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 text-sm">₹{item.price}</span>
                        {item.qty === 0 ? (
                          <button
                            onClick={() => handleFoodQty(item.id, 1)}
                            className="border border-[#eb4d5e] text-[#eb4d5e] hover:bg-rose-50 px-4 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-2 py-0.5">
                            <button
                              onClick={() => handleFoodQty(item.id, -1)}
                              className="text-[#eb4d5e] font-bold text-sm px-1 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-zinc-800">{item.qty}</span>
                            <button
                              onClick={() => handleFoodQty(item.id, 1)}
                              className="text-[#eb4d5e] font-bold text-sm px-1 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary Side Column */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <span className="text-xs text-zinc-500 font-semibold uppercase">Ticket(s) Price</span>
                <span className="text-lg font-bold text-zinc-900">₹{ticketsTotal.toFixed(2)}</span>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Your Cart</h4>
                {foodTotal > 0 ? (
                  foodItems
                    .filter((f) => f.qty > 0)
                    .map((f) => (
                      <div key={f.id} className="flex justify-between text-xs py-1 text-zinc-700">
                        <span>{f.name} x {f.qty}</span>
                        <span className="font-semibold">₹{f.price * f.qty}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">No food items added yet</p>
                )}
              </div>

              <button
                onClick={() => setStep('summary')}
                className="w-full bg-[#eb4d5e] hover:bg-[#d93b4d] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Proceed to Payment (₹{orderTotal.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT OPTIONS & ORDER SUMMARY */}
      {step === 'summary' && (
        <div className="max-w-6xl mx-auto p-4 md:p-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-fit">
              <div className="w-full md:w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col">
                <button
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-4 text-left font-semibold text-xs flex items-center gap-3 border-b border-zinc-200 transition-colors ${
                    selectedMethod === 'upi' ? 'bg-rose-50 text-[#eb4d5e] border-l-4 border-l-[#eb4d5e]' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Pay by any UPI App
                </button>
                <button
                  onClick={() => setSelectedMethod('card')}
                  className={`p-4 text-left font-semibold text-xs flex items-center gap-3 border-b border-zinc-200 transition-colors ${
                    selectedMethod === 'card' ? 'bg-rose-50 text-[#eb4d5e] border-l-4 border-l-[#eb4d5e]' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Debit/Credit Card
                </button>
                <button
                  onClick={() => setSelectedMethod('netbank')}
                  className={`p-4 text-left font-semibold text-xs flex items-center gap-3 border-b border-zinc-200 transition-colors ${
                    selectedMethod === 'netbank' ? 'bg-rose-50 text-[#eb4d5e] border-l-4 border-l-[#eb4d5e]' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Net Banking
                </button>
                <button
                  onClick={() => setSelectedMethod('wallet')}
                  className={`p-4 text-left font-semibold text-xs flex items-center gap-3 transition-colors ${
                    selectedMethod === 'wallet' ? 'bg-rose-50 text-[#eb4d5e] border-l-4 border-l-[#eb4d5e]' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Mobile Wallets
                </button>
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-zinc-800 text-sm mb-4">
                    {selectedMethod === 'upi' && 'Scan QR Code via GPay / PhonePe / Paytm'}
                    {selectedMethod === 'card' && 'Enter Card Details'}
                    {selectedMethod === 'netbank' && 'Select Your Bank'}
                    {selectedMethod === 'wallet' && 'Select Wallet'}
                  </h3>
                  <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl text-center">
                    <p className="text-xs text-zinc-500 mb-4">Fast & Secure instant payment</p>
                    <button
                      onClick={() => setStep('processing')}
                      className="bg-[#eb4d5e] hover:bg-[#d93b4d] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md cursor-pointer transition-all"
                    >
                      Generate Payment QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="font-bold text-zinc-800 text-base mb-1">{movieTitle}</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Seats: <span className="font-bold text-zinc-800">{selectedSeats.map((s) => s.id).join(', ')}</span>
              </p>

              <div className="space-y-2 border-t border-b border-zinc-100 py-3 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Ticket(s) Price</span>
                  <span className="font-semibold text-zinc-800">₹{ticketsTotal.toFixed(2)}</span>
                </div>
                {foodTotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Food & Beverages</span>
                    <span className="font-semibold text-zinc-800">₹{foodTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>Convenience Fees</span>
                  <span className="font-semibold text-zinc-800">₹{convenienceFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center my-4">
                <span className="font-bold text-sm text-zinc-800">Order Total</span>
                <span className="font-bold text-xl text-[#eb4d5e]">₹{orderTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setStep('processing')}
                className="w-full bg-[#eb4d5e] hover:bg-[#d93b4d] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Pay ₹{orderTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PROCESSING PAYMENT WITH TIMER & QR CODE (Matching Screenshot 3) */}
      {step === 'processing' && (
        <div className="flex-1 flex items-center justify-center p-4 bg-[#f5f6f8]">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
            <h2 className="text-lg font-bold text-zinc-800 mb-1">Processing Payment</h2>
            <p className="text-xs text-zinc-500 mb-6">
              Please wait while your payment is being processed
            </p>

            {/* QR Code Block */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-6 flex flex-col items-center">
              <p className="text-xs font-semibold text-zinc-700 mb-3">
                Scan the QR code on Pay by any UPI App for a successful transaction.
              </p>

              <div className="w-48 h-48 bg-white border-2 border-zinc-900 p-3 rounded-2xl shadow-inner flex items-center justify-center my-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=fairflash@upi&pn=FairFlashGate&am=${orderTotal}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                <span>Time Remaining</span>
                <p className="font-mono text-xl font-bold text-amber-600">
                  {formatTimer(timeLeft)}
                </p>
              </div>
            </div>

            {/* Simulate Successful Payment Trigger */}
            <button
              onClick={handleConfirmPayment}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer mb-3"
            >
              Simulate UPI Payment Success ✓
            </button>

            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs text-red-500 hover:text-red-700 font-semibold underline cursor-pointer"
            >
              Cancel Payment & Release Seats
            </button>
          </div>
        </div>
      )}

      {/* CANCEL PAYMENT MODAL (Matching Screenshot 5) */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Cancel Payment?</h2>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                We are in the process of payment, Going back will cancel this payment and <span className="font-bold text-red-600">unlock your seats ({selectedSeats.map(s => s.id).join(', ')})</span> for other users. Are you sure?
              </p>

              <div className="space-y-3">
                {/* No, don't cancel */}
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full bg-[#eb4d5e] hover:bg-[#d93b4d] text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  No, don't cancel
                </button>

                {/* Yes, cancel -> UNLOCKS SEATS IMMEDIATELY OVER WEBSOCKET AND RETURNS */}
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    onCancelPayment(); // UNLOCKS SEATS IMMEDIATELY OVER WEBSOCKET
                  }}
                  className="w-full bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  Yes, cancel & release seats
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMED STEP */}
      {step === 'confirmed' && (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-900 text-white flex-1">
          <div className="bg-zinc-800 border border-emerald-500/40 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-anton text-3xl uppercase tracking-wide text-white mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-sm text-zinc-300 mb-4">
              Your M-Ticket for <span className="font-bold text-white">{movieTitle}</span> has been generated!
            </p>
            <div className="bg-zinc-900 p-4 rounded-xl text-xs font-mono text-emerald-400 border border-zinc-700">
              Seats: {selectedSeats.map((s) => s.id).join(', ')} | Total Paid: ₹{orderTotal.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
