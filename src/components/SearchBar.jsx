import Tag from "./Tag";
import { useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchBar({ notes, setNotes }) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim() !== "") {
      if (!notes.includes(input.trim())) {
        setNotes([...notes, input.trim()]);
      }
      setInput("");
    }
  };

  const removeNote = (note) => {
    setNotes(notes.filter((n) => n !== note));
  };

  return (
    <motion.div
      animate={{
        scale: focused ? 1.03 : 1,
        boxShadow: focused
          ? "0 0 20px rgba(34,211,238,0.4)"
          : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-black border-2 border-cyan-500/30 rounded-xl p-1 flex flex-wrap gap-2 items-center hover:border-cyan-500/60 transition-colors duration-300"
    >
      <motion.div
  animate={{
    scale: focused ? 1.03 : 1,
    boxShadow: focused
      ? "0 0 20px rgba(34,211,238,0.4)"
      : "0 0 0 rgba(0,0,0,0)",
  }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  className="bg-black border-2 border-cyan-500/30 rounded-xl p-2 sm:p-3 flex flex-wrap sm:flex-nowrap gap-2 items-center 
             hover:border-cyan-500/60 transition-colors duration-300 w-full min-h-[50px]"
>

        <Search className="w-5 h-5 text-cyan-400 ml-2" />
      </motion.div>

      <AnimatePresence>
        {notes.map((note, i) => (
          <motion.div
            key={note}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Tag note={note} onRemove={() => removeNote(note)} />
          </motion.div>
        ))}
      </AnimatePresence>

      <input
  type="text"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Enter a note (e.g., vanilla, amber)..."
  className="flex-1 min-w-[120px] outline-none p-2 text-cyan-100 bg-transparent 
             placeholder:text-cyan-600 text-sm sm:text-base"
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
/>

    </motion.div>
  );
}
