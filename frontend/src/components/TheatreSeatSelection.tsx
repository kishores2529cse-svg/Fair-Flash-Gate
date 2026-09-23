import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, ShieldAlert, Lock, Sparkles, Ticket } from 'lucide-react';
import CheckoutFlow from './CheckoutFlow';

interface Seat {
  id: string;
  row: string;
  number: number;
  tier: 'Diamond' | 'Platinum' | 'Gold';
  price: number;
  status: 'available' | 'locked_by_me' | 'locked_by_others' | 'locking';
}

const MOVIE_NAV = [
  {
    title: 'THE BATMAN',
    poster: 'https://image.tmdb.org/t/p/original/74xTEgt7R36Fpooo50r9T25onhq.jpg',
  },
  {
    title: 'OPPENHEIMER',
    poster: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  },
  {
    title: 'SPIDER-MAN: ACROSS THE SPIDER-VERSE',
    poster: 'https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  },
  {
    title: 'DUNE: PART TWO',
    poster: 'https://sfrareview.org/wp-content/uploads/2024/07/dune-part-two.jpg',
  },
];

interface TheatreSeatSelectionProps {
  movieTitle: string;
  onBack: () => void;
  onMovieSwitch: (movieTitle: string) => void;
}

export default function TheatreSeatSelection({ movieTitle, onBack, onMovieSwitch }: TheatreSeatSelectionProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [showCheckoutFlow, setShowCheckoutFlow] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const myClientIdRef = useRef<string>(`user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
  const myLocksRef = useRef<Record<string, number>>({});
  const seatsRef = useRef<Seat[]>([]);
  seatsRef.current = seats;

  // Scrollytelling hooks
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollContainerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  const rabbitParallaxY = useTransform(scrollYProgress, [0, 1], [0, -32]);

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

  // BroadcastChannel for cross-tab multi-user synchronization & conflict detection
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('fair_flash_gate_seat_sync');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || data.clientId === myClientIdRef.current) return;

        if (data.action === 'broadcast_lock') {
          setSeats((prev) => {
            const target = prev.find((s) => s.id === data.seat);
            if (target && target.status === 'locked_by_me') {
              const myTimestamp = myLocksRef.current[data.seat] || Infinity;
              // If the other user clicked earlier, this tab lost the race condition!
              if (data.timestamp < myTimestamp) {
                delete myLocksRef.current[data.seat];
                setErrorModal(`Seat Conflict! Seat ${data.seat} was just taken by another user!`);
                return prev.map((s) => (s.id === data.seat ? { ...s, status: 'locked_by_others' } : s));
              }
              // If we locked first, inform the other client that we won the seat
              channel.postMessage({
                action: 'broadcast_lock',
                seat: data.seat,
                timestamp: myTimestamp,
                clientId: myClientIdRef.current,
              });
              return prev;
            }
            return prev.map((s) => (s.id === data.seat ? { ...s, status: 'locked_by_others' } : s));
          });
        } else if (data.action === 'broadcast_sold') {
          setSeats((prev) =>
            prev.map((s) => (s.id === data.seat ? { ...s, status: 'locked_by_others' } : s))
          );
        } else if (data.action === 'broadcast_release') {
          setSeats((prev) =>
            prev.map((s) => (s.id === data.seat && s.status !== 'locked_by_me' ? { ...s, status: 'available' } : s))
          );
        } else if (data.action === 'query_state') {
          const held = seatsRef.current.filter((s) => s.status === 'locked_by_me').map((s) => s.id);
          if (held.length > 0) {
            channel.postMessage({
              action: 'state_response',
              lockedSeats: held,
              clientId: myClientIdRef.current,
            });
          }
        } else if (data.action === 'state_response') {
          if (Array.isArray(data.lockedSeats)) {
            setSeats((prev) =>
              prev.map((s) =>
                data.lockedSeats.includes(s.id) && s.status !== 'locked_by_me'
                  ? { ...s, status: 'locked_by_others' }
                  : s
              )
            );
          }
        }
      };

      channel.postMessage({
        action: 'query_state',
        clientId: myClientIdRef.current,
      });

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }
  }, []);

  // WebSocket connection to Go Backend
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:8080/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Go WebSocket Backend');
        setWsConnected(true);
        ws?.send(JSON.stringify({ action: 'sync' }));
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
              delete myLocksRef.current[data.seat];
              setSeats((prev) =>
                prev.map((s) => (s.id === data.seat ? { ...s, status: 'locked_by_others' } : s))
              );
              setErrorModal(data.message || 'Seat Conflict! This seat was just taken by another user!');
            }
          } else if (data.action === 'broadcast_lock') {
            if (data.client_id === myClientIdRef.current) return;
            setSeats((prev) =>
              prev.map((s) => {
                if (s.id === data.seat) {
                  if (s.status === 'locked_by_me') {
                    delete myLocksRef.current[data.seat];
                    setErrorModal('Seat Conflict! This seat was just taken by another user!');
                  }
                  return { ...s, status: 'locked_by_others' };
                }
                return s;
              })
            );
          } else if (data.action === 'broadcast_sold') {
            if (data.client_id === myClientIdRef.current) return;
            setSeats((prev) =>
              prev.map((s) => (s.id === data.seat ? { ...s, status: 'locked_by_others' } : s))
            );
          } else if (data.action === 'sync_response') {
            if (Array.isArray(data.locked_seats) || Array.isArray(data.sold_seats)) {
              const allTaken = [...(data.locked_seats || []), ...(data.sold_seats || [])];
              setSeats((prev) =>
                prev.map((s) =>
                  allTaken.includes(s.id) && s.status !== 'locked_by_me'
                    ? { ...s, status: 'locked_by_others' }
                    : s
                )
              );
            }
          } else if (data.action === 'broadcast_release') {
            if (data.client_id === myClientIdRef.current) return;
            setSeats((prev) =>
              prev.map((s) => (s.id === data.seat && s.status !== 'locked_by_me' ? { ...s, status: 'available' } : s))
            );
          } else if (data.type === 'seat_locked') {
            setSeats((prev) =>
              prev.map((s) => (s.id === data.seat ? { ...s, status: data.by_me ? 'locked_by_me' : 'locked_by_others' } : s))
            );
          } else if (data.type === 'seat_unlocked') {
            setSeats((prev) =>
              prev.map((s) => (s.id === data.seat ? { ...s, status: 'available' } : s))
            );
          } else if (data.type === 'error') {
            setErrorModal(data.message || 'This seat was just taken by another user!');
            setSeats((prev) =>
              prev.map((s) => (s.id === data.seat ? { ...s, status: 'available' } : s))
            );
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.warn('WS Init failed', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'locked_by_others' || seat.status === 'locking') return;

    if (seat.status === 'locked_by_me') {
      delete myLocksRef.current[seat.id];
      setSeats((prev) => prev.map((s) => (s.id === seat.id ? { ...s, status: 'available' } : s)));

      if (wsConnected && wsRef.current) {
        wsRef.current.send(JSON.stringify({ action: 'unlock', user_id: myClientIdRef.current, seat: seat.id }));
      }
      channelRef.current?.postMessage({
        action: 'broadcast_release',
        seat: seat.id,
        clientId: myClientIdRef.current,
      });
      return;
    }

    const now = Date.now();
    myLocksRef.current[seat.id] = now;
    setSeats((prev) => prev.map((s) => (s.id === seat.id ? { ...s, status: 'locked_by_me' } : s)));

    if (wsConnected && wsRef.current) {
      wsRef.current.send(JSON.stringify({ action: 'lock', user_id: myClientIdRef.current, seat: seat.id }));
    }

    channelRef.current?.postMessage({
      action: 'broadcast_lock',
      seat: seat.id,
      timestamp: now,
      clientId: myClientIdRef.current,
    });
  };

  const mySelectedSeats = seats.filter((s) => s.status === 'locked_by_me');
  const totalPrice = mySelectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleCancelPayment = () => {
    mySelectedSeats.forEach((s) => {
      delete myLocksRef.current[s.id];
      if (wsConnected && wsRef.current) {
        wsRef.current.send(JSON.stringify({ action: 'unlock', user_id: myClientIdRef.current, seat: s.id }));
      }
      channelRef.current?.postMessage({
        action: 'broadcast_release',
        seat: s.id,
        clientId: myClientIdRef.current,
      });
    });
    setSeats((prev) => prev.map((s) => (s.status === 'locked_by_me' ? { ...s, status: 'available' } : s)));
    setShowCheckoutFlow(false);
  };

  const handlePaymentSuccess = () => {
    mySelectedSeats.forEach((s) => {
      if (wsConnected && wsRef.current) {
        wsRef.current.send(JSON.stringify({ action: 'purchase', user_id: myClientIdRef.current, seat: s.id }));
      }
      channelRef.current?.postMessage({
        action: 'broadcast_sold',
        seat: s.id,
        clientId: myClientIdRef.current,
      });
      delete myLocksRef.current[s.id];
    });
    setSeats((prev) => prev.map((s) => (s.status === 'locked_by_me' ? { ...s, status: 'locked_by_others' } : s)));
    setShowCheckoutFlow(false);

    // Slight delay so user can see they are locked or we just navigate back
    setTimeout(() => {
      onBack();
    }, 500);
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
    <div
      ref={scrollContainerRef}
      className="relative min-h-screen w-full bg-zinc-950 text-white flex flex-col items-center p-3 md:p-6 font-inter select-none pb-28 overflow-y-auto pl-3 md:pl-[230px]"
    >
      {/* Interactive Scrollytelling Top Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-300 z-50 origin-left shadow-[0_0_12px_rgba(245,158,11,0.6)] pointer-events-none"
      />

      {/* Video Background with Parallax Depth */}
      <motion.div
        style={{ y: rabbitParallaxY }}
        className="fixed inset-0 w-full h-[110%] -top-[5%] z-0 pointer-events-none"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-right-top"
          src="https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/cloudinarry%20to%20cloudflare/202606021731-e_hqa6sn.mp4"
        />
        <div className="absolute inset-0 bg-black/70" />
      </motion.div>

      {/* Movie Nav Sidebar (Desktop Fixed, responsive fallback) */}
      <div className="hidden md:flex fixed left-0 top-0 h-full z-20 flex-col border-r border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md shadow-2xl" style={{ width: '210px' }}>
        {MOVIE_NAV.map((movie) => {
          const isActive = movieTitle === movie.title;
          return (
            <button
              key={movie.title}
              onClick={() => onMovieSwitch(movie.title)}
              title={movie.title}
              style={{ height: '25vh' }}
              className={`relative w-full flex-shrink-0 overflow-hidden transition-all duration-300 group cursor-pointer border-r-4 ${isActive
                ? 'border-amber-400 brightness-100 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]'
                : 'border-transparent brightness-60 hover:brightness-100 hover:border-amber-400/50'
                }`}
            >
              <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5 text-left">
                <span className={`text-xs font-bold truncate ${isActive ? 'text-amber-400 drop-shadow' : 'text-zinc-200 group-hover:text-white'}`}>
                  {movie.title}
                </span>
                {isActive && (
                  <span className="text-[10px] text-amber-400/90 font-semibold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Now Viewing
                  </span>
                )}
              </div>
              {isActive && <div className="absolute left-0 top-0 w-1.5 h-full bg-amber-400" />}
            </button>
          );
        })}
      </div>

      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-xl flex items-center justify-between z-20 mb-3 self-start"
      >
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800 cursor-pointer text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold">Back</span>
        </button>
        <div className="text-center">
          <h1 className="font-anton text-xl md:text-2xl tracking-wide uppercase text-amber-400 drop-shadow">
            {movieTitle || 'FAIR-FLASH-GATE'}
          </h1>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">Real-Time Seat Selection Engine</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800 text-[11px]">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-zinc-300 font-mono">{wsConnected ? 'WS LIVE' : 'DEMO ENGINE'}</span>
        </div>
      </motion.div>

      {/* Screen Curved Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-xl flex flex-col items-center mb-4 self-start"
      >
        <div className="w-full h-7 bg-gradient-to-b from-amber-500/20 to-transparent border-t-2 border-amber-400/60 rounded-t-[100%] shadow-[0_-15px_30px_rgba(245,158,11,0.2)] flex items-center justify-center">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-bold opacity-80">CINEMA SCREEN THIS WAY</span>
        </div>
      </motion.div>

      {/* Seat Grid with Scroll Reveal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl bg-zinc-900/40 p-4 md:p-5 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl mb-6 self-start"
      >
        {['Diamond', 'Platinum', 'Gold'].map((tierName, tierIdx) => {
          const tierSeats = seats.filter((s) => s.tier === tierName);
          const rowNames = Array.from(new Set(tierSeats.map((s) => s.row)));
          const price = tierSeats[0]?.price || 0;
          return (
            <motion.div
              key={tierName}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: tierIdx * 0.08, ease: 'easeOut' }}
              className="mb-4 last:mb-0"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />{tierName} Tier
                </span>
                <span className="text-[11px] font-mono text-zinc-400">&#8377; {price} / ticket</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {rowNames.map((rowName, rIdx) => (
                  <motion.div
                    key={rowName}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.3, delay: rIdx * 0.03 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <span className="w-5 text-xs font-bold text-zinc-500 text-center font-mono">{rowName}</span>
                    <div className="flex gap-1.5">
                      {seats.filter((s) => s.row === rowName).map((seat) => {
                        const isMine = seat.status === 'locked_by_me';
                        const isOthers = seat.status === 'locked_by_others';
                        return (
                          <motion.button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={isOthers}
                            title={`${seat.id} - Rs.${seat.price}`}
                            whileHover={isOthers ? {} : { scale: 1.15 }}
                            whileTap={isOthers ? {} : { scale: 0.92 }}
                            className={`w-7 h-7 md:w-8 md:h-8 rounded-lg font-mono text-xs font-semibold flex items-center justify-center transition-all duration-200 shadow-md ${isMine
                              ? 'bg-emerald-500 text-black shadow-emerald-500/40 shadow-lg scale-110 ring-2 ring-emerald-300'
                              : isOthers
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800 opacity-60'
                                : 'bg-zinc-900 text-zinc-300 hover:bg-amber-500 hover:text-black hover:scale-105 border border-zinc-700/60'
                              }`}
                          >
                            {isOthers ? <Lock className="w-3 h-3" /> : seat.number}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400"
        >
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
        </motion.div>
      </motion.div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
        {mySelectedSeats.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900/95 border border-zinc-800 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-300 font-mono">
              Seats: <span className="font-bold text-white">{mySelectedSeats.map((s) => s.id).join(', ')}</span>
            </span>
          </div>
        )}
        <button
          onClick={() => setShowCheckoutFlow(true)}
          disabled={mySelectedSeats.length === 0}
          className={`px-10 py-3.5 rounded-2xl font-medium text-lg text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-2xl border border-rose-400/30 ${mySelectedSeats.length > 0
            ? 'bg-[#eb4d5e] hover:bg-[#d93b4d] active:scale-95 shadow-[0_8px_25px_rgba(235,77,94,0.45)] cursor-pointer'
            : 'bg-[#eb4d5e]/50 text-white/70 cursor-not-allowed'
            }`}
        >
          <span>Pay &#8377; {totalPrice > 0 ? totalPrice : 190}</span>
        </button>
      </div>

      {/* Error Modal */}
      <AnimatePresence>
        {errorModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 border border-red-500/50 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="font-anton text-2xl text-white uppercase tracking-wide mb-2">Seat Conflict!</h2>
              <p className="text-sm text-zinc-300 mb-6">{errorModal}</p>
              <button onClick={() => setErrorModal(null)} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer">
                Choose Another Seat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}