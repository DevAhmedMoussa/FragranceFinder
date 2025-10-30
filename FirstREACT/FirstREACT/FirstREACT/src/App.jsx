import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "./firebase";
import SearchBar from "./components/SearchBar";
import PerfumeCard from "./components/PerfumeCard";
import Spinner from "./components/Spinner";

export default function App() {
  const [perfumes, setPerfumes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [viewFavourites, setViewFavourites] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [itemsPerPage] = useState(20);

  const [favourites, setFavourites] = useState(() => {
    return JSON.parse(localStorage.getItem("favourites")) || [];
  });


  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("favourites", JSON.stringify(favourites));
  }, [favourites]);


  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const perfumesRef = collection(db, "perfumes");
        const q = query(perfumesRef, orderBy("uploadedAt"), limit(50));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPerfumes(data);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(!snapshot.empty);
      } catch (err) {
        console.error("Failed to load initial perfumes:", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitial();
  }, []);


  useEffect(() => {
    if (!lastDoc || !hasMore) return;

    let cancelled = false;

    const fetchBackground = async () => {
      try {
        let currentLastDoc = lastDoc;
        while (!cancelled && hasMore) {
          const perfumesRef = collection(db, "perfumes");
          const q = query(perfumesRef, orderBy("uploadedAt"), startAfter(currentLastDoc), limit(2000));
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            setHasMore(false);
            break;
          }

          const newData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setPerfumes((prev) => [...prev, ...newData]);
          currentLastDoc = snapshot.docs[snapshot.docs.length - 1];


          await new Promise((r) => setTimeout(r, 100));
        }
      } catch (err) {
        console.error("Background loading failed:", err);
      }
    };

    fetchBackground();
    return () => {
      cancelled = true;
    };
  }, [lastDoc, hasMore]);

  const toggleFavourite = (perfumeId) => {
    setFavourites((prev) =>
      prev.includes(perfumeId)
        ? prev.filter((id) => id !== perfumeId)
        : [...prev, perfumeId]
    );
  };


  const combinedFiltered = useMemo(() => {
    let results = perfumes;

    if (notes.length > 0) {
      results = results.filter((p) =>
        notes.every((note) =>
          p.notes?.some((n) => n.toLowerCase().includes(note.toLowerCase()))
        )
      );
    }

    results = results.filter((p) => {
      const gender = (p.gender || "").toLowerCase();
      if (genderFilter === "all") return true;
      if (genderFilter === "men")
        return gender.includes("for men") && !gender.includes("for women");
      if (genderFilter === "women")
        return gender.includes("for women") && !gender.includes("for men");
      if (genderFilter === "unisex")
        return (
          gender.includes("for men and women") ||
          gender.includes("for women and men")
        );
      return true;
    });

    if (viewFavourites) {
      results = results.filter((p) => favourites.includes(p.id));
    }

    return results;
  }, [perfumes, notes, genderFilter, viewFavourites, favourites]);

  const sortedPerfumes = useMemo(() => {
    const sorted = [...combinedFiltered];
    if (sortOption === "highToLow")
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortOption === "lowToHigh")
      sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    return sorted;
  }, [combinedFiltered, sortOption]);

  const totalPages = Math.ceil(sortedPerfumes.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedPerfumes.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPerfumes, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen overflow-auto flex items-center justify-center p-8 bg-black">

      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url("/bg.png")`
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>


      <div className="relative w-full max-w-[1400px] h-[85vh] bg-black rounded-3xl overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(0,255,255,0.3),0_0_100px_rgba(255,0,255,0.2)] my-8">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent blur-2xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-fuchsia-500/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-lime-500/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-pink-500/20 to-transparent blur-2xl"></div>


        <div className="relative border-b-2 border-cyan-500/30 px-6 md:px-10 py-3 shadow-[0_4px_20px_rgba(0,255,255,0.1)]">
          <div className="flex items-center gap-6 mb-3">
            <div className="flex-shrink-0">
              <img src="/logoo.png" alt="Logo" width="75" height="75" />
            </div>
            <div className="flex-1">
              <SearchBar notes={notes} setNotes={setNotes} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center items-center">
            {["all", "men", "women", "unisex"].map((filter) => (
              <button
                key={filter}
                onClick={() => setGenderFilter(filter)}
                className={`px-3 py-1.5 rounded-xl transition-all border-2 text-xs ${
                  genderFilter === filter
                    ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(255,0,255,0.6)]'
                    : 'bg-black border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:text-cyan-200'
                }`}
              >
                {filter === "all" ? "All" : filter === "men" ? "For Men" : filter === "women" ? "For Women" : "Unisex"}
              </button>
            ))}
            <button
              onClick={() => setViewFavourites((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl transition-all border-2 text-xs ${
                viewFavourites 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-400 shadow-[0_0_15px_rgba(255,0,0,0.6)]'
                  : 'bg-black border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:text-cyan-200'
              }`}
            >
              {viewFavourites ? "Viewing Favourites" : "View Favourites"}
            </button>
            <select
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black border-2 border-cyan-500/30 text-cyan-300 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] text-xs"
            >
              <option value="default">Sort by Rating</option>
              <option value="highToLow">Rating: High → Low</option>
              <option value="lowToHigh">Rating: Low → High</option>
            </select>
          </div>
        </div>


        <div className="flex flex-col h-[calc(85vh-120px)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-4">
            {loadingInitial ? (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((perfume) => (
                      <PerfumeCard
                        key={perfume.id}
                        perfume={perfume}
                        isFavourite={favourites.includes(perfume.id)}
                        onToggleFavourite={() => toggleFavourite(perfume.id)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16">
                      <div className="inline-block p-6 bg-black border-2 border-cyan-500/30 rounded-2xl mb-4 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                        <p className="text-cyan-400 text-4xl">💫</p>
                      </div>
                      <h3 className="text-cyan-100 text-xl mb-2">No fragrances found</h3>
                      <p className="text-cyan-400/70 text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-6 pt-4 border-t-2 border-cyan-500/20">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all border-2 border-cyan-400/50 text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-cyan-300 px-4 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-xl disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all border-2 border-fuchsia-400/50 text-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>


   <footer
  style={{
    textAlign: "center",
    fontSize: "12px", 
    color: "#aaa",
    padding: "10px 20px",
    lineHeight: "1.4",
    maxWidth: "800px", 
    margin: "20px auto", 
    wordWrap: "break-word",
  }}
>
  © 2025 <strong>SCENTD</strong>. All rights reserved. <br />
  This project uses publicly available data from{" "}
  <a
    href="https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#0ff", textDecoration: "underline" }}
  >
    Fragrantica.com fragrance dataset on Kaggle
  </a>
  , licensed under{" "}
  <a
    href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#0ff", textDecoration: "underline" }}
  >
    CC BY-NC-SA 4.0
  </a>
  . <br />
  <span style={{ color: "#888" }}>
    This work is for educational and portfolio purposes only. All trademarks and
    data belong to their respective owners.
  </span>
</footer>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 255, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4));
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 255, 0.3);
          box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(0, 255, 255, 0.6), rgba(255, 0, 255, 0.6));
          box-shadow: 0 0 12px rgba(0, 255, 255, 0.5);
        }
        body {
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}