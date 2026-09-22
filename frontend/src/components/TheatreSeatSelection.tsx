import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldAlert, CheckCircle2, Lock, Sparkles, Ticket } from 'lucide-react';
import CheckoutFlow from './CheckoutFlow';

interface Seat {
  id: string; // e.g. "A1", "B4"
  row: string;
  number: number;
  tier: 'Diamond' | 'Platinum' | 'Gold';
  price: number;
  status: 'available' | 'locked_by_me' | 'locked_by_others' | 'locking';
}

interface TheatreSeatSelectionProps {
  movieTitle: string;
  onBack: () => void;
}

export default function TheatreSeatSelection({ movieTitle, onBack }: TheatreSeatSelectionProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [showCheckoutFlow, setShowCheckoutFlow] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Generate initial cinema grid
  useEffect(() => {
    const initialSeats: Seat[] = [];
    const rows = [
      { name: 'A', tier: 'Diamond' as const, price: 350 },
      { name: 'B', tier: 'Diamond' as const, price: 350 },
      { name: 'C', tier: 'Platinum' as const, price: 250 },
      { name: 'D', tier: 'Platinum' as const, price: 250 },
      { name: 'E', tier: 'Platinum' as const, price: 250 },
      { name: 'F', tier: 'Gold' as const, price: 190 },
      { name: 'G', tier: 'Gold' as const, price: 190 },
      { name: 'H', tier: 'Gold' as const, price: 190 },
    ];

    rows.forEach((rowInfo) => {
      for (let i = 1; i <= 10; i++) {
        const id = `${rowInfo.name}${i}`;
        const isPreTaken = ['A3', 'C5', 'D8'].includes(id);
        initialSeats.push({
          id,
          row: rowInfo.name,
          number: i,
          tier: rowInfo.tier,
          price: rowInfo.price,
          status: isPreTaken ? 'locked_by_others' : 'available',
        });
      }
    });

    setSeats(initialSeats);
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Go WebSocket Backend');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Signal Received:', data);

        if (data.action === 'lock_response') {
          if (data.status === 'success') {
            setSeats((prev) =>
              prev.map((s) => (s.id === data.seat ? { ...s, status: 'locked_by_me' } : s))
            );
          } else if (data.status === 'failed') {
            // Race condition lost!
            setSeats((prev) =>
              prev.map((s) => (s.id === data.seat ? { ...s, status: 'locked_by_others' } : s))
            );
            setErrorModal(data.message || 'Something went wrong! Seat already taken by another user.');
          }
        } else if (data.action === 'broadcast_lock') {
          // Global broadcast: another user locked a seat
          setSeats((prev) =>
            prev.map((s) =>
              s.id === data.seat && s.status !== 'locked_by_me'
                ? { ...s, status: 'locked_by_others' }
                : s
            )
          );
        } else if (data.action === 'broadcast_release') {
          // Seat released (hold expired)
          setSeats((prev) =>
            prev.map((s) => (s.id === data.seat ? { ...s, status: 'available' } : s))
          );
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    ws.onerror = (error) => {
      console.warn('WS error (Go backend may be offline):', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WS Connection closed');
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Handle seat click (supports MULTIPLE seat selections!)
  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'locked_by_others' || seat.status === 'locking') return;

    // Deselect if already selected by me
    if (seat.status === 'locked_by_me') {
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, status: 'available' } : s))
      );
      if (wsConnected && wsRef.current) {
        wsRef.current.send(JSON.stringify({ action: 'unlock', seat: seat.id }));
      }
      return;
    }

    // Mark seat as selected by me
    setSeats((prev) =>
      prev.map((s) => (s.id === seat.id ? { ...s, status: 'locked_by_me' } : s))
    );

    // Send payload to Go Backend over WS
    if (wsConnected && wsRef.current) {
      wsRef.current.send(JSON.stringify({ action: 'lock', seat: seat.id }));
    }
  };

  // Selected seats calculation
  const mySelectedSeats = seats.filter((s) => s.status === 'locked_by_me');
  const totalPrice = mySelectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  // Release all my locked seats if payment cancelled or timed out
  const handleCancelPayment = () => {
    mySelectedSeats.forEach((s) => {
      if (wsConnected && wsRef.current) {
        wsRef.current.send(JSON.stringify({ action: 'unlock', seat: s.id }));
      }
    });

    setSeats((prev) =>
      prev.map((s) => (s.status === 'locked_by_me' ? { ...s, status: 'available' } : s))
    );
    setShowCheckoutFlow(false);
  };

  const handlePaymentSuccess = () => {
    setShowCheckoutFlow(false);
    onBack();
  };

  if (showCheckoutFlow) {
    return (
      <CheckoutFlow
        movieTitle={movieTitle}
        selectedSeats={mySelectedSeats}
        onCancelPayment={handleCancelPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-white flex flex-col items-center p-4 md:p-8 font-inter select-none pb-28">
      {/* Header Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between z-20 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Back</span>
        </button>

        <div className="text-center">
          <h1 className="font-anton text-2xl md:text-3xl tracking-wide uppercase text-amber-400 drop-shadow">
            {movieTitle || 'FAIR-FLASH-GATE'}
          </h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">
            Real-Time Seat Selection Engine
          </p>
        </div>

        {/* WS Connection Status Badge */}
        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800 text-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-zinc-300 font-mono">
            {wsConnected ? 'WS LIVE' : 'DEMO ENGINE'}
          </span>
        </div>
      </div>

      {/* Screen Curved Banner */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-8">
        <div className="w-full h-8 bg-gradient-to-b from-amber-500/20 to-transparent border-t-2 border-amber-400/60 rounded-t-[100%] shadow-[0_-15px_30px_rgba(245,158,11,0.2)] flex items-center justify-center">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-bold opacity-80">
            CINEMA SCREEN THIS WAY
          </span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="w-full max-w-4xl bg-zinc-900/40 p-6 md:p-8 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl mb-8">
        {/* Tier Headers & Rows */}
        {['Diamond', 'Platinum', 'Gold'].map((tierName) => {
          const tierSeats = seats.filter((s) => s.tier === tierName);
          const rowNames = Array.from(new Set(tierSeats.map((s) => s.row)));
          const price = tierSeats[0]?.price || 0;

          return (
            <div key={tierName} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {tierName} Tier
                </span>
                <span className="text-xs font-mono text-zinc-400">₹ {price} / ticket</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {rowNames.map((rowName) => (
                  <div key={rowName} className="flex items-center justify-center gap-2">
                    <span className="w-6 text-xs font-bold text-zinc-500 text-center font-mono">
                      {rowName}
                    </span>

                    <div className="flex gap-2">
                      {seats
                        .filter((s) => s.row === rowName)
                        .map((seat) => {
                          const isMine = seat.status === 'locked_by_me';
                          const isOthers = seat.status === 'locked_by_others';

                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={isOthers}
                              title={`${seat.id} - ₹${seat.price}`}
                              className={`w-7 h-7 md:w-9 md:h-9 rounded-lg font-mono text-xs font-semibold flex items-center justify-center transition-all duration-200 shadow-md ${
                                isMine
                                  ? 'bg-emerald-500 text-black shadow-emerald-500/40 shadow-lg scale-110 ring-2 ring-emerald-300'
                                  : isOthers
                                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800 opacity-60'
                                  : 'bg-zinc-900 text-zinc-300 hover:bg-amber-500 hover:text-black hover:scale-105 border border-zinc-700/60'
                              }`}
                            >
                              {isOthers ? <Lock className="w-3 h-3" /> : seat.number}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-zinc-900 border border-zinc-700" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
            <span className="text-emerald-400 font-semibold">Your Seats ({mySelectedSeats.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-600">
              <Lock className="w-2.5 h-2.5" />
            </span>
            <span>Taken</span>
          </div>
        </div>
      </div>

      {/* FIXED FLOATING ACTION BAR IN BOTTOM RIGHT */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
        {/* Selected Seats Summary Badge */}
        {mySelectedSeats.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900/95 border border-zinc-800 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-300 font-mono">
              Seats: <span className="font-bold text-white">{mySelectedSeats.map((s) => s.id).join(', ')}</span>
            </span>
          </div>
        )}

        {/* RED PAY BUTTON */}
        <button
          onClick={() => setShowCheckoutFlow(true)}
          disabled={mySelectedSeats.length === 0}
          className={`px-10 py-3.5 rounded-2xl font-medium text-lg text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-2xl border border-rose-400/30 ${
            mySelectedSeats.length > 0
              ? 'bg-[#eb4d5e] hover:bg-[#d93b4d] active:scale-95 shadow-[0_8px_25px_rgba(235,77,94,0.45)] cursor-pointer'
              : 'bg-[#eb4d5e]/50 text-white/70 cursor-not-allowed'
          }`}
        >
          <span>Pay ₹ {totalPrice > 0 ? totalPrice : 190}</span>
        </button>
      </div>

      {/* Error Modal for Race Conditions */}
      <AnimatePresence>
        {errorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-red-500/50 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="font-anton text-2xl text-white uppercase tracking-wide mb-2">
                Seat Conflict!
              </h2>
              <p className="text-sm text-zinc-300 mb-6">{errorModal}</p>
              <button
                onClick={() => setErrorModal(null)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Choose Another Seat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
