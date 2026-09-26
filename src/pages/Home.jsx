import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Truck } from 'lucide-react';

const regionals = [
  { name: 'Regional 1',     color: 'from-blue-500 to-blue-600' },
  { name: 'Regional 2',     color: 'from-pink-500 to-fuchsia-600' },
  { name: 'Regional 3',     color: 'from-orange-500 to-red-500' },
  { name: 'Regional 4',     color: 'from-violet-500 to-purple-700' },
  { name: 'Regional ES 01', color: 'from-emerald-500 to-teal-700' },
];

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center px-4 py-8">

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mb-8 rounded-3xl overflow-hidden shadow-2xl relative"
        style={{ minHeight: 220 }}
      >
        <img
          src="https://media.base44.com/images/public/69f3f13b0b4c2c47dddc138b/e5cd597db_Gemini_Generated_Image_4gc8ib4gc8ib4gc8.png"
          alt="Report Logístico"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-700/80 via-orange-600/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-8 flex flex-col justify-end h-full" style={{ minHeight: 220 }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary rounded-xl p-1.5">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/90 text-sm font-inter font-semibold tracking-widest uppercase">
              Shopee Logistics
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-inter font-extrabold text-white tracking-tight leading-none drop-shadow">
            Report Logístico
          </h1>
          <p className="text-white/80 font-inter mt-2 text-base">
            Sistema de relatório operacional
          </p>
        </div>
      </motion.div>

      {/* Subtitle */}
      <p className="text-muted-foreground font-inter text-base mb-6">
        Selecione uma regional para começar
      </p>

      {/* Regional list */}
      <div className="flex flex-col gap-3 w-full max-w-2xl">
        {regionals.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              to={`/regional/${encodeURIComponent(r.name)}`}
              className={`flex items-center gap-4 w-full bg-gradient-to-r ${r.color} text-white rounded-2xl px-6 py-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group`}
            >
              <div className="bg-white/20 rounded-full p-2">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="flex-1 text-xl font-inter font-bold">{r.name}</span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}