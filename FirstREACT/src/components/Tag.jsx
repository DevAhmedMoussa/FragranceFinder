export default function Tag({ note, onRemove }) {
  return (
    <div className="bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full flex items-center gap-2 border border-cyan-500/30">
      <span className="text-sm">{note}</span>
      <button
        onClick={onRemove}
        className="text-cyan-400 hover:text-cyan-200 font-bold text-lg transition-colors hover:scale-110"
      >
        ×
      </button>
    </div>
  );
}