export function Skel({ w = "100%", h = 16, r = 5, style }) {
  return (
    <div
      className="skel"
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

export function SkeletonRows({ rows = 5, cols = 4 }) {
  return (
    <div className="skel-rows">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-row">
          {Array.from({ length: cols }).map((_, j) => (
            <Skel key={j} w={j === 0 ? "80px" : j === cols - 1 ? "60px" : "100%"} h={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skel-card">
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Skel w={36} h={36} r={18} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Skel w="60%" h={14} />
          <Skel w="40%" h={12} />
        </div>
      </div>
      <Skel w="90%" h={12} style={{ marginTop: 10 }} />
    </div>
  );
}