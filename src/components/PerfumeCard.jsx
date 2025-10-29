import { Heart, Star } from "lucide-react";

export default function PerfumeCard({ perfume, isFavourite, onToggleFavourite }) {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars
              ? "fill-lime-400 text-lime-400 drop-shadow-[0_0_5px_rgba(0,255,0,0.6)]"
              : "text-gray-700"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="group relative bg-black border-2 border-cyan-500/30 rounded-2xl overflow-hidden hover:border-fuchsia-500/60 hover:shadow-[0_0_30px_rgba(0,255,255,0.3),0_0_50px_rgba(255,0,255,0.2)] transition-all duration-300 p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-cyan-100 text-xl mb-1 font-semibold">{perfume.name}</h3>
          <p className="text-cyan-400/70 text-sm">{perfume.gender}</p>
        </div>
        <button
          onClick={onToggleFavourite}
          className="w-9 h-9 rounded-lg bg-black border-2 border-fuchsia-500/50 flex items-center justify-center hover:bg-fuchsia-500/20 hover:border-fuchsia-500 transition-all hover:shadow-[0_0_15px_rgba(255,0,255,0.6)] ml-3"
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isFavourite
                ? "fill-fuchsia-500 text-fuchsia-500 drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]"
                : "text-fuchsia-400"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {renderStars(perfume.rating)}
        <span className="text-sm text-cyan-400/70 ml-1">({perfume.rating || 0})</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {perfume.notes?.slice(0, 6).map((note, i) => (
          <span
            key={i}
            className="text-xs px-2.5 py-1 bg-black border border-fuchsia-500/30 text-fuchsia-300 rounded-lg hover:border-fuchsia-500/60 hover:shadow-[0_0_10px_rgba(255,0,255,0.3)] transition-all"
          >
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}