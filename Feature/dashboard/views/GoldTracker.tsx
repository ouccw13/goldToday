'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Calculator, 
  Clock, 
  DollarSign, 
  BarChart2, 
  Bell, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Types
interface ChartDataPoint {
  time: string;
  goldBar: number;
  spotGold: number;
}

interface PriceLog {
  id: number;
  time: string;
  round: string;
  barBuy: number;
  barSell: number;
  change: number;
  dir: 'up' | 'down';
}

interface ToastNotification {
  title: string;
  message: string;
  type: 'up' | 'down' | 'info';
}

interface MarketData {
  goldBarBuy: number;
  goldBarSell: number;
  goldJewelryBuy: number;
  goldJewelrySell: number;
  spotGold: number;
  usdThb: number;
  lastUpdated: Date;
  changeFromYesterday: number;
  changePercent: number;
}

// Conversion constants
const GRAMS_PER_BAHT = 15.244;
const SALUNG_PER_BAHT = 4;

// Initial Mock Market Data based on typical Thai Gold Association standard levels
const INITIAL_MARKET: MarketData = {
  goldBarBuy: 43800,
  goldBarSell: 43900,
  goldJewelryBuy: 43010,
  goldJewelrySell: 44400,
  spotGold: 2735.50,
  usdThb: 33.85,
  lastUpdated: new Date(),
  changeFromYesterday: 150,
  changePercent: 0.34
};

// Historical Mock Data Generator
const generateChartData = (timeframe: string): ChartDataPoint[] => {
  const basePrice = 43900;
  let points = 24;
  let labelFormat = (i: number): string => `${i}:00`;
  
  if (timeframe === '1W') {
    points = 7;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    labelFormat = (i: number): string => days[i % 7];
  } else if (timeframe === '1M') {
    points = 30;
    labelFormat = (i: number): string => `Day ${i + 1}`;
  } else if (timeframe === '1Y') {
    points = 12;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    labelFormat = (i: number): string => months[i];
  }

  const data: ChartDataPoint[] = [];
  let currentPrice = basePrice - (points * 15);
  for (let i = 0; i < points; i++) {
    const randomVariation = (Math.random() - 0.48) * 120;
    currentPrice += randomVariation;
    data.push({
      time: labelFormat(i),
      goldBar: Math.round(currentPrice),
      spotGold: Number((currentPrice / 16.02).toFixed(1))
    });
  }
  return data;
};

// Initial Price History Log
const INITIAL_LOGS: PriceLog[] = [
  { id: 1, time: '15:30 น.', round: 'ครั้งที่ 3', barBuy: 43800, barSell: 43900, change: 50, dir: 'up' },
  { id: 2, time: '11:15 น.', round: 'ครั้งที่ 2', barBuy: 43750, barSell: 43850, change: -100, dir: 'down' },
  { id: 3, time: '09:05 น.', round: 'ครั้งที่ 1', barBuy: 43850, barSell: 43950, change: 200, dir: 'up' },
];

export default function App() {
  const [marketData, setMarketData] = useState<MarketData>(INITIAL_MARKET);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdateSec, setLastUpdateSec] = useState(0);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [logs, setLogs] = useState<PriceLog[]>(INITIAL_LOGS);

  // Calculator State
  const [calcWeight, setCalcWeight] = useState<number | string>(1);
  const [calcUnit, setCalcUnit] = useState('baht'); // baht, salung, gram
  const [calcType, setCalcType] = useState('bar965'); // bar965, jewelry965, bar9999
  const [calcOperation, setCalcOperation] = useState('buy'); // buy (ร้านซื้อ/เราขาย), sell (ร้านขาย/เราซื้อ)

  // Initialize Chart
  useEffect(() => {
    setChartData(generateChartData(timeframe));
  }, [timeframe]);

  // Live Simulation Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdateSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulated Real-Time Price Fluctuations
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      // 30% chance to fluctuate price on tick
      if (Math.random() > 0.65) {
        const delta = (Math.random() > 0.5 ? 1 : -1) * 50;
        const spotDelta = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1.5);
        
        setMarketData(prev => {
          const newBarSell = Math.max(30000, prev.goldBarSell + delta);
          const newBarBuy = newBarSell - 100;
          const newJewelrySell = newBarSell + 500;
          const newJewelryBuy = Math.round(newBarSell * 0.9797); // standard fee offset

          // Trigger Toast Notification
          showToast(
            delta > 0 ? 'ราคาทองปรับขึ้น!' : 'ราคาทองปรับลดลง!',
            `ทองคำแท่งปรับ ${delta > 0 ? '+' : ''}${delta} บาท (${delta > 0 ? 'ขายออก ' + newBarSell.toLocaleString() : 'ขายออก ' + newBarSell.toLocaleString()})`,
            delta > 0 ? 'up' : 'down'
          );

          // Add to price log
          const newLog: PriceLog = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
            round: `ครั้งที่ ${logs.length + 1}`,
            barBuy: newBarBuy,
            barSell: newBarSell,
            change: delta,
            dir: delta > 0 ? 'up' : 'down'
          };
          setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 9)]);

          return {
            ...prev,
            goldBarBuy: newBarBuy,
            goldBarSell: newBarSell,
            goldJewelryBuy: newJewelryBuy,
            goldJewelrySell: newJewelrySell,
            spotGold: Number((prev.spotGold + spotDelta).toFixed(2)),
            lastUpdated: new Date()
          };
        });
        setLastUpdateSec(0);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, logs.length]);

  const showToast = (title: string, message: string, type: 'up' | 'down' | 'info') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleManualRefresh = () => {
    setMarketData(prev => ({
      ...prev,
      lastUpdated: new Date()
    }));
    setLastUpdateSec(0);
    showToast('อัปเดตข้อมูลสำเร็จ', 'ดึงข้อมูลราคาทองคำล่าสุดเรียบร้อยแล้ว', 'info');
  };

  // Calculator Logic
  const calculatedResult = useMemo(() => {
    let weightInBaht = typeof calcWeight === 'string' ? parseFloat(calcWeight) || 0 : Number(calcWeight) || 0;

    if (calcUnit === 'salung') {
      weightInBaht = weightInBaht / SALUNG_PER_BAHT;
    } else if (calcUnit === 'gram') {
      weightInBaht = weightInBaht / GRAMS_PER_BAHT;
    }

    let unitBasePrice = 0;

    if (calcType === 'bar965') {
      unitBasePrice = calcOperation === 'sell' ? marketData.goldBarSell : marketData.goldBarBuy;
    } else if (calcType === 'jewelry965') {
      unitBasePrice = calcOperation === 'sell' ? marketData.goldJewelrySell : marketData.goldJewelryBuy;
    } else if (calcType === 'bar9999') {
      // 99.99% standard is ~1.035x multiplier of 96.5% bar
      const base9999 = marketData.goldBarSell * 1.036;
      unitBasePrice = calcOperation === 'sell' ? base9999 : base9999 - 150;
    }

    const totalPrice = weightInBaht * unitBasePrice;
    const estGrams = weightInBaht * GRAMS_PER_BAHT;

    return {
      weightInBaht: weightInBaht.toFixed(3),
      totalPrice: Math.round(totalPrice),
      unitPrice: Math.round(unitBasePrice),
      estGrams: estGrams.toFixed(2)
    };
  }, [calcWeight, calcUnit, calcType, calcOperation, marketData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 pb-12">
      
      {/* Dynamic Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
          toast.type === 'up' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
            : toast.type === 'down'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
        }`}>
          <div className={`p-2 rounded-full ${
            toast.type === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
            toast.type === 'down' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="font-bold text-sm">{toast.title}</div>
            <div className="text-xs opacity-90">{toast.message}</div>
          </div>
        </div>
      )}

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-amber-500/20 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                  THAI GOLD REAL-TIME
                </h1>
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  96.5% Standard
                </span>
              </div>
              <p className="text-xs text-slate-400">ราคาทองคำวันนี้ตามประกาศสมาคมค้าทองคำ</p>
            </div>
          </div>

          {/* Quick Info & Live Indicators */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            
            {/* Live Indicator */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className={`relative flex h-2.5 w-2.5`}>
                {isAutoRefresh && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAutoRefresh ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-slate-300 font-medium">
                {isAutoRefresh ? 'อัปเดตอัตโนมัติ' : 'หยุดอัปเดต'}
              </span>
              <span className="text-slate-500">({lastUpdateSec}s)</span>
            </div>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1.5 ${
                isAutoRefresh 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {isAutoRefresh ? 'Live ON' : 'Paused'}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Time Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{marketData.lastUpdated.toLocaleTimeString('th-TH')}</span>
            </div>

          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 space-y-8">
        
        {/* BANNER SUMMARY TICKER */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-amber-500/20 shadow-xl">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">สมาคมค้าทองคำ</span>
            <div className="text-sm font-bold text-amber-400">ทองแท่ง 96.5%</div>
            <div className="text-lg font-black text-slate-100">
              ฿{marketData.goldBarSell.toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-0.5 border-l border-slate-800 pl-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">การเปลี่ยนแปลงวันนี้</span>
            <div className={`flex items-center gap-1 text-sm font-bold ${marketData.changeFromYesterday >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {marketData.changeFromYesterday >= 0 ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
              <span>{marketData.changeFromYesterday >= 0 ? '+' : ''}{marketData.changeFromYesterday} บาท</span>
            </div>
            <div className="text-xs text-slate-400">({marketData.changePercent}%)</div>
          </div>

          <div className="space-y-0.5 border-l border-slate-800 pl-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Spot Gold (XAU/USD)</span>
            <div className="text-sm font-bold text-slate-200">${marketData.spotGold} / oz</div>
            <div className="text-xs text-emerald-400 font-medium">+0.42% Today</div>
          </div>

          <div className="space-y-0.5 border-l border-slate-800 pl-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">อัตราแลกเปลี่ยน</span>
            <div className="text-sm font-bold text-slate-200">฿{marketData.usdThb} / USD</div>
            <div className="text-xs text-slate-400">บาทอ่อนค่าเล็กน้อย</div>
          </div>
        </div>

        {/* HERO / PRICE CARDS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* CARD 1: GOLD BAR */}
          <div className="relative group bg-slate-900 rounded-2xl p-5 border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ยอดนิยม
                </span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">ทองคำแท่ง 96.5%</h3>
              <p className="text-xs text-slate-400 mb-4">ราคามาตรฐานสมาคมฯ</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">รับซื้อ (บาทละ)</span>
                <span className="text-lg font-bold text-slate-100">
                  ฿{marketData.goldBarBuy.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-400 font-medium">ขายออก (บาทละ)</span>
                <span className="text-2xl font-black text-amber-400">
                  ฿{marketData.goldBarSell.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: GOLD JEWELRY */}
          <div className="relative group bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-lg flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  รูปพรรณ
                </span>
                <Sparkles className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">ทองรูปพรรณ 96.5%</h3>
              <p className="text-xs text-slate-400 mb-4">ไม่รวมค่ากำเหน็จโดยเฉลี่ย</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">ฐานภาษีรับซื้อ</span>
                <span className="text-lg font-bold text-slate-100">
                  ฿{marketData.goldJewelryBuy.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 font-medium">ขายออก (บาทละ)</span>
                <span className="text-2xl font-black text-slate-100">
                  ฿{marketData.goldJewelrySell.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: SPOT GOLD */}
          <div className="relative group bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-lg flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Global Spot
                </span>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">Gold Spot (XAU/USD)</h3>
              <p className="text-xs text-slate-400 mb-4">ราคาตลาดโลก Real-Time</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-100">
                  ${marketData.spotGold}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +0.42%
                </span>
              </div>
              <div className="text-xs text-slate-500">
                ราคาอ้างอิงสำหรับคำนวณทองไทย
              </div>
            </div>
          </div>

          {/* CARD 4: EXCHANGE RATE */}
          <div className="relative group bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-lg flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  FX Rate
                </span>
                <BarChart2 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">USD / THB</h3>
              <p className="text-xs text-slate-400 mb-4">อัตราแลกเปลี่ยนบาท/ดอลลาร์</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-100">
                  ฿{marketData.usdThb}
                </span>
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> -0.05
                </span>
              </div>
              <div className="text-xs text-slate-500">
                ค่าเงินบาทมีผลต่อราคาทองในประเทศ
              </div>
            </div>
          </div>

        </section>

        {/* MIDDLE SECTION: CHART & CALCULATOR GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PRICE CHART (2 COLUMNS) */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-amber-400" />
                    แนวโน้มราคาทองคำแท่ง
                  </h3>
                  <p className="text-xs text-slate-400">กราฟแสดงการความเคลื่อนไหวของราคาทองคำในประเทศ</p>
                </div>

                {/* Timeframe selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  {['1D', '1W', '1M', '1Y'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        timeframe === tf
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recharts Canvas Container */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 100', 'dataMax + 100']} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                      }}
                      formatter={(value) => [`฿${Number(value ?? 0).toLocaleString()}`, 'ราคาทองแท่ง (ขายออก)']}
                    />
                    <Area
                      type="monotone"
                      dataKey="goldBar"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#goldGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                ข้อมูลกราฟมีการปรับสมดุลตามเวลาจริง
              </span>
              <span className="text-slate-500">หน่วย: บาทละ (THB)</span>
            </div>
          </div>

          {/* CALCULATOR TOOL (1 COLUMN) */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-amber-500/30 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">คำนวณราคาทองคำ</h3>
                  <p className="text-xs text-slate-400">ประเมินมูลค่าซื้อ-ขายตามน้ำหนักจริง</p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                
                {/* Operation Selection (Buy/Sell) */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">ประเภทรายการ</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setCalcOperation('sell')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        calcOperation === 'sell'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ซื้อทอง (ร้านขายออก)
                    </button>
                    <button
                      onClick={() => setCalcOperation('buy')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        calcOperation === 'buy'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ขายทอง (ร้านรับซื้อ)
                    </button>
                  </div>
                </div>

                {/* Gold Type */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">ชนิดทองคำ</label>
                  <select
                    value={calcType}
                    onChange={(e) => setCalcType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="bar965">ทองคำแท่ง 96.5%</option>
                    <option value="jewelry965">ทองรูปพรรณ 96.5%</option>
                    <option value="bar9999">ทองคำแท่ง 99.99%</option>
                  </select>
                </div>

                {/* Weight Input & Unit */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1.5 block">น้ำหนักทอง</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
                      placeholder="ระบุน้ำหนัก"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">หน่วย</label>
                    <select
                      value={calcUnit}
                      onChange={(e) => setCalcUnit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2 py-2.5 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="baht">บาท</option>
                      <option value="salung">สลึง</option>
                      <option value="gram">กรัม</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* Calculation Result Display Box */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-4 rounded-xl border border-amber-500/20">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-slate-400">ประเมินมูลค่ารวม</span>
                <span className="text-xs text-slate-400">({calculatedResult.weightInBaht} บาททอง)</span>
              </div>
              <div className="text-2xl font-black text-amber-400 mb-2">
                ฿{calculatedResult.totalPrice.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>ราคาต่อหน่วย: ฿{calculatedResult.unitPrice.toLocaleString()}</span>
                <span>~ {calculatedResult.estGrams} กรัม</span>
              </div>
            </div>

          </div>

        </section>

        {/* HISTORICAL ANNOUNCEMENT LOGS TABLE */}
        <section className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">ประวัติการประกาศราคาประจำวัน</h3>
              <p className="text-xs text-slate-400">รายการปรับเปลี่ยนราคาทองคำแท่งตามประกาศสมาคมฯ ในรอบวัน</p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
              รวม {logs.length} ครั้ง
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">ครั้งที่ / เวลา</th>
                  <th className="py-3 px-4">ทองแท่ง รับซื้อ (บาทละ)</th>
                  <th className="py-3 px-4">ทองแท่ง ขายออก (บาทละ)</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">ส่วนต่างเทียบครั้งก่อน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      {log.round} <span className="text-slate-500 font-normal">({log.time})</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      ฿{log.barBuy.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-400">
                      ฿{log.barSell.toLocaleString()}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${log.dir === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <span className="inline-flex items-center gap-1">
                        {log.dir === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 lg:px-8 mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
        <p>
          ข้อมูลราคาทองคำอ้างอิงมาตรฐานทองคำ 96.5% และ Gold Spot Real-Time สำหรับวัตถุประสงค์ในการแสดงผลและประเมินราคาทั่วไป
        </p>
        <p>© 2026 THAI GOLD REAL-TIME TRACKER — Built with React & Tailwind CSS</p>
      </footer>

    </div>
  );
}
