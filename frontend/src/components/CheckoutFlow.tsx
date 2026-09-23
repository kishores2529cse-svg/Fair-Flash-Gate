import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, QrCode, CreditCard, Wallet, Building2, CheckCircle2, XCircle, Timer, Search } from 'lucide-react';

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
  originalPrice?: number;
  discount?: string;
  isVeg?: boolean;
  category: 'Popcorn' | 'Combos' | 'Snacks' | 'Beverages' | 'Desserts';
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

  // Scrollytelling progress for Grab a Bite!
  const { scrollYProgress: foodScrollProgress } = useScroll();
  const foodScrollScale = useSpring(foodScrollProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Food filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Food items state
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    // Popcorn
    {
      id: 'f1',
      name: 'Medium Popcorn',
      desc: 'Salted / Buttered Medium Popcorn',
      price: 250,
      isVeg: true,
      category: 'Popcorn',
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f2',
      name: 'Caramel Pop Corn',
      desc: 'Sweet Caramel Popcorn',
      price: 160,
      isVeg: true,
      category: 'Popcorn',
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f3',
      name: 'Half & Half Medium Popcorn',
      desc: 'Half & Half Medium Popcorn',
      price: 300,
      isVeg: true,
      category: 'Popcorn',
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f4',
      name: 'Butter Toffee Popcorn',
      desc: 'Butter Toffee Popcorn',
      price: 180,
      isVeg: true,
      category: 'Popcorn',
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f5',
      name: 'Lemon Pataka Popcorn',
      desc: 'Lemon Pataka Popcorn',
      price: 180,
      isVeg: true,
      category: 'Popcorn',
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },

    // Combos
    {
      id: 'f6',
      name: 'Gold Combo',
      desc: 'Medium Popcorn + 2 Regular Cokes',
      price: 390,
      originalPrice: 490,
      discount: '20% OFF',
      isVeg: true,
      category: 'Combos',
      image: '/gold_combo.jpg',
      qty: 0,
    },
    {
      id: 'f7',
      name: 'Silver Combo',
      desc: 'Regular Popcorn + Regular Coke',
      price: 290,
      originalPrice: 350,
      discount: '17% OFF',
      isVeg: true,
      category: 'Combos',
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f8',
      name: 'Chicken Feast Combo',
      desc: 'Chicken Burger + French Fries + Regular Coke',
      price: 390,
      originalPrice: 580,
      discount: '32% OFF',
      isVeg: false,
      category: 'Combos',
      image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f9',
      name: 'Veg Feast Combo',
      desc: 'Veg Burger + French Fries + Regular Coke',
      price: 390,
      originalPrice: 520,
      discount: '25% OFF',
      isVeg: true,
      category: 'Combos',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f10',
      name: 'Cream Donut Combo',
      desc: 'Cream Donut + Cold Coffee',
      price: 250,
      originalPrice: 370,
      discount: '32% OFF',
      isVeg: true,
      category: 'Combos',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f11',
      name: 'Cheese Donut Combo',
      desc: 'Cheese Donut + Cold Coffee',
      price: 250,
      originalPrice: 370,
      discount: '32% OFF',
      isVeg: true,
      category: 'Combos',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f12',
      name: 'Nachos Combo',
      desc: 'Nachos + Regular Coke',
      price: 250,
      originalPrice: 370,
      discount: '32% OFF',
      isVeg: true,
      category: 'Combos',
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f13',
      name: 'Combo 1',
      desc: 'Small Popcorn + Small Coke',
      price: 260,
      isVeg: true,
      category: 'Combos',
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },

    // Snacks
    {
      id: 'f14',
      name: 'French Fries',
      desc: 'French Fries',
      price: 160,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f15',
      name: 'French Fries with Toppings',
      desc: 'French Fries with Toppings',
      price: 200,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f16',
      name: 'Sweet Corn',
      desc: 'Sweet Corn',
      price: 120,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f17',
      name: 'Pepper Corn',
      desc: 'Pepper Corn',
      price: 120,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f18',
      name: 'Popcorn Chicken',
      desc: 'Popcorn Chicken',
      price: 230,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f19',
      name: 'Veg Burger',
      desc: 'Veg Burger',
      price: 190,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f20',
      name: 'Chicken Burger',
      desc: 'Chicken Burger',
      price: 230,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f21',
      name: 'Chicken Momos',
      desc: 'Chicken Momos',
      price: 210,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f22',
      name: 'Veg Momos',
      desc: 'Veg Momos',
      price: 170,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f23',
      name: 'Crunchy Veg Momos',
      desc: 'Crunchy Veg Momos',
      price: 170,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f24',
      name: 'Bhel Puri',
      desc: 'Bhel Puri',
      price: 120,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f25',
      name: 'Peri Peri French Fries',
      desc: 'Peri Peri French Fries',
      price: 190,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f26',
      name: 'Veg Sandwich',
      desc: 'Veg Sandwich',
      price: 150,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f27',
      name: 'Mexican Veg Sandwich',
      desc: 'Mexican Veg Sandwich',
      price: 180,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f28',
      name: 'Chicken Frankie',
      desc: 'Chicken Frankie',
      price: 200,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f29',
      name: 'Paneer Frankies',
      desc: 'Paneer Frankies',
      price: 190,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f30',
      name: 'Samosa Chaat',
      desc: 'Samosa Chaat',
      price: 120,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f31',
      name: 'Chicken Tikka Sandwich',
      desc: 'Chicken Tikka Sandwich',
      price: 190,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f32',
      name: 'Corn Cheese Nuggets',
      desc: 'Corn Cheese Nuggets',
      price: 220,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f33',
      name: 'Egg Sandwich',
      desc: 'Egg Sandwich',
      price: 160,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f34',
      name: 'Nachos Chips',
      desc: 'Nachos Chips',
      price: 170,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f35',
      name: 'Alfredo Veg Pasta',
      desc: 'Alfredo Veg Pasta',
      price: 180,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f36',
      name: 'Chicken Fries Loaded',
      desc: 'Chicken Fries Loaded',
      price: 260,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },

    // Beverages
    {
      id: 'f37',
      name: 'Regular Coke',
      desc: 'Regular Coke',
      price: 150,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f38',
      name: 'Coke Large',
      desc: 'Coke Large',
      price: 180,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f39',
      name: 'Cold Coffee',
      desc: 'Cold Coffee',
      price: 180,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f40',
      name: 'Cappuccino',
      desc: 'Cappuccino',
      price: 120,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f41',
      name: 'Cardamom Tea',
      desc: 'Cardamom Tea',
      price: 120,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f42',
      name: 'Chef Special Hot Chocolate',
      desc: 'Chef Special Hot Chocolate',
      price: 150,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },

    // Desserts
    {
      id: 'f43',
      name: 'Cream Donut',
      desc: 'Cream Donut',
      price: 120,
      isVeg: true,
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f25',
      name: 'Peri Peri French Fries',
      desc: 'Peri Peri French Fries',
      price: 190,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f26',
      name: 'Veg Sandwich',
      desc: 'Veg Sandwich',
      price: 150,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f27',
      name: 'Mexican Veg Sandwich',
      desc: 'Mexican Veg Sandwich',
      price: 180,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f28',
      name: 'Chicken Frankie',
      desc: 'Chicken Frankie',
      price: 200,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f29',
      name: 'Paneer Frankies',
      desc: 'Paneer Frankies',
      price: 190,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f30',
      name: 'Samosa Chaat',
      desc: 'Samosa Chaat',
      price: 120,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f31',
      name: 'Chicken Tikka Sandwich',
      desc: 'Chicken Tikka Sandwich',
      price: 190,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f32',
      name: 'Corn Cheese Nuggets',
      desc: 'Corn Cheese Nuggets',
      price: 220,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f33',
      name: 'Egg Sandwich',
      desc: 'Egg Sandwich',
      price: 160,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f34',
      name: 'Nachos Chips',
      desc: 'Nachos Chips',
      price: 170,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f35',
      name: 'Alfredo Veg Pasta',
      desc: 'Alfredo Veg Pasta',
      price: 180,
      isVeg: true,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f36',
      name: 'Chicken Fries Loaded',
      desc: 'Chicken Fries Loaded',
      price: 260,
      isVeg: false,
      category: 'Snacks',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },

    // Beverages
    {
      id: 'f37',
      name: 'Regular Coke',
      desc: 'Regular Coke',
      price: 150,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f38',
      name: 'Coke Large',
      desc: 'Coke Large',
      price: 180,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f39',
      name: 'Cold Coffee',
      desc: 'Cold Coffee',
      price: 180,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f40',
      name: 'Cappuccino',
      desc: 'Cappuccino',
      price: 120,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f41',
      name: 'Cardamom Tea',
      desc: 'Cardamom Tea',
      price: 120,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f42',
      name: 'Chef Special Hot Chocolate',
      desc: 'Chef Special Hot Chocolate',
      price: 150,
      isVeg: true,
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },

    // Desserts
    {
      id: 'f43',
      name: 'Cream Donut',
      desc: 'Cream Donut',
      price: 140,
      isVeg: true,
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
    {
      id: 'f44',
      name: 'Chocolate Brownie Fudge Ice Cream',
      desc: 'Chocolate Brownie Fudge Ice Cream',
      price: 180,
      isVeg: true,
      category: 'Desserts',
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=300',
      qty: 0,
    },
  ]);

  // Handle 5-minute countdown timer during processing step
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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

  const handleConfirmPayment = async () => {
    // Generate a random checkout_id for idempotency
    const checkoutId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiBase}/checkout?checkout_id=${checkoutId}`);
      if (!res.ok) {
        console.error('Checkout failed');
      }
    } catch (e) {
      console.warn('Failed to call /checkout API, proceeding anyway for demo', e);
    }
    
    setStep('confirmed');
    setTimeout(() => {
      onPaymentSuccess();
    }, 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f6f8] text-zinc-900 font-inter select-none flex flex-col">
      {/* GLOBAL TOP HEADER BAR WITH CANCEL BUTTON ACROSS ALL STEPS */}
      {step !== 'confirmed' && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm"
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCancelModal(true)}
                className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors cursor-pointer"
                title="Cancel Booking"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
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
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span>CANCEL BOOKING</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 1: FOOD & BEVERAGES (Grab a Bite!) */}
      {step === 'food' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full p-4 md:p-8 flex-1 max-w-6xl mx-auto relative"
        >
          {/* Interactive Scrollytelling Dining Progress Bar */}
          <motion.div
            style={{ scaleX: foodScrollScale }}
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#eb4d5e] via-amber-400 to-[#eb4d5e] z-50 origin-left shadow-[0_0_12px_rgba(235,77,94,0.6)] pointer-events-none"
          />

          {/* Header Row */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-zinc-200 pb-4"
          >
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-zinc-800">Grab a Bite!</h2>
              <p className="text-xs text-zinc-500 font-medium">
                Add snacks & drinks to your movie experience
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search for F&B items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#eb4d5e] transition-colors"
                />
              </div>

              {/* Skip Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('summary')}
                className="bg-[#eb4d5e] hover:bg-[#d93b4d] text-white px-7 py-2 rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer shrink-0"
              >
                Skip
              </motion.button>
            </div>
          </motion.div>

          {/* Sticky Interactive Category Navigation Bar */}
          <div className="sticky top-[65px] z-30 bg-[#f5f6f8]/95 backdrop-blur-md py-2.5 flex items-center gap-2 overflow-x-auto mb-6 scrollbar-none border-b border-zinc-200 shadow-xs">
            {['All', 'Popcorn', 'Combos', 'Snacks', 'Beverages', 'Desserts'].map((cat) => {
              const isActive = selectedCategory === cat;
              const count = cat === 'All'
                ? foodItems.length
                : foodItems.filter(f => f.category === cat).length;

              return (
                <motion.button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                    isActive ? 'text-[#eb4d5e]' : 'text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute inset-0 bg-rose-50 border border-[#eb4d5e] rounded-full shadow-xs"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-[#eb4d5e] text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {foodItems.filter((item) => {
                const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
                const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCat && matchesSearch;
              }).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400"
                >
                  <p className="text-sm font-semibold">No food items found matching "{searchQuery}"</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedCategory + searchQuery}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {['Popcorn', 'Combos', 'Snacks', 'Beverages', 'Desserts']
                    .filter((cat) => selectedCategory === 'All' || selectedCategory === cat)
                    .map((catName) => {
                      const categoryItems = foodItems.filter((item) => {
                        const matchesCat = item.category === catName;
                        const matchesSearch =
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchesCat && matchesSearch;
                      });

                      if (categoryItems.length === 0) return null;

                      return (
                        <motion.div
                          key={catName}
                          initial={{ opacity: 0, y: 26 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.08 }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                          className="space-y-3"
                        >
                          {/* Category Header */}
                          <motion.div
                            initial={{ opacity: 0, x: -16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.35 }}
                            className="flex items-center gap-2 border-b border-zinc-200/80 pb-2 pt-2"
                          >
                            <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                              {catName === 'Popcorn' && '🍿'}
                              {catName === 'Combos' && '✨'}
                              {catName === 'Snacks' && '🍔'}
                              {catName === 'Beverages' && '🥤'}
                              {catName === 'Desserts' && '🍨'}
                              {catName}
                            </h3>
                            <span className="text-xs text-zinc-400 font-medium">({categoryItems.length})</span>
                          </motion.div>

                          {/* Category Items Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryItems.map((item, itemIdx) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{ 
                                  duration: 0.4, 
                                  delay: (itemIdx % 2) * 0.06,
                                  ease: [0.25, 0.1, 0.25, 1]
                                }}
                                whileHover={{ 
                                  y: -4, 
                                  boxShadow: '0 12px 25px -4px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                                  transition: { duration: 0.2 } 
                                }}
                                className="bg-white border border-zinc-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm transition-all relative overflow-hidden group cursor-pointer"
                              >
                                <div className="relative shrink-0 overflow-hidden rounded-xl">
                                  {/* Veg / Non-Veg Tag */}
                                  <div className="absolute top-1 left-1 z-10 bg-white/90 p-0.5 rounded shadow-sm">
                                    {item.isVeg !== false ? (
                                      <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-0.5 rounded-xs">
                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                      </div>
                                    ) : (
                                      <div className="w-3.5 h-3.5 border border-red-600 flex items-center justify-center p-0.5 rounded-xs">
                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                      </div>
                                    )}
                                  </div>
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-zinc-800 text-sm leading-tight mb-1 truncate">{item.name}</h3>
                                  <p className="text-[11px] text-zinc-500 mb-2 line-clamp-2 leading-relaxed">{item.desc}</p>
                                  
                                  <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                      <span className="font-bold text-zinc-900 text-sm">₹{item.price}</span>
                                      {item.originalPrice && (
                                        <span className="text-[11px] text-zinc-400 line-through">₹{item.originalPrice}</span>
                                      )}
                                      {item.discount && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                          {item.discount}
                                        </span>
                                      )}
                                    </div>

                                    {item.qty === 0 ? (
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleFoodQty(item.id, 1)}
                                        className="border border-[#eb4d5e] text-[#eb4d5e] hover:bg-rose-50 px-4 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Add
                                      </motion.button>
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
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                </motion.div>
              )}
            </div>

            {/* Cart Summary Side Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-fit sticky top-24"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <span className="text-xs text-zinc-500 font-semibold uppercase">Ticket(s) price</span>
                <span className="text-lg font-bold text-zinc-900">₹{ticketsTotal.toFixed(2)}</span>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Your Cart</h4>
                {foodTotal > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {foodItems
                      .filter((f) => f.qty > 0)
                      .map((f) => (
                        <div key={f.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-50 text-zinc-700">
                          <div className="flex items-center gap-2">
                            {f.isVeg !== false ? (
                              <div className="w-2.5 h-2.5 border border-emerald-600 flex items-center justify-center p-0.5 rounded-xs shrink-0">
                                <div className="w-1 h-1 bg-emerald-600 rounded-full" />
                              </div>
                            ) : (
                              <div className="w-2.5 h-2.5 border border-red-600 flex items-center justify-center p-0.5 rounded-xs shrink-0">
                                <div className="w-1 h-1 bg-red-600 rounded-full" />
                              </div>
                            )}
                            <span>{f.name} x {f.qty}</span>
                          </div>
                          <span className="font-semibold text-zinc-900">₹{f.price * f.qty}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    <div className="w-12 h-12 bg-rose-50 text-[#eb4d5e] rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                      🍿
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                      Fill this cart with your favorite food combos!
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep('summary')}
                className="w-full bg-[#eb4d5e] hover:bg-[#d93b4d] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Proceed to Payment (₹{orderTotal.toFixed(2)})
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: PAYMENT OPTIONS & ORDER SUMMARY */}
      {step === 'summary' && (
        <div className="w-full p-4 md:p-8 flex-1 max-w-6xl mx-auto">
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
        <div className="flex-1 flex items-center justify-center p-4 bg-[#f5f6f8] w-full">
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
              Simulate UPI Payment Success  ✅
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

      {/* CANCEL PAYMENT MODAL */}
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

