/* eslint-disable */
// DI Digital Studio — Logo components (isotipo A1 + logotipo)
// Isotipo: D outline + i minúscula donde el orb brillante es el punto (tittle) de la i.

function DILogoMark({ size = 32, animated = false, className = "", style = {}, decorative = true, label = "DI Digital Studio" }) {
  // useId está disponible en React 18+; este componente se monta dentro de React.
  const rawId = React.useId();
  const id = rawId.replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={!decorative ? label : undefined}
    >
      {!decorative && <title>{label}</title>}
      {!decorative && <desc>Logo del estudio de software DI Digital Studio</desc>}
      {/* soft inner glow */}
      <circle cx="100" cy="100" r="64" fill={`url(#di-glow-${id})`} />
      {/* D — outlined */}
      <path
        d="M52 48 H92 C118 48 138 71 138 100 C138 129 118 152 92 152 H52 Z"
        stroke={`url(#di-stroke-${id})`}
        strokeWidth="8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* i stem */}
      <rect x="152" y="84" width="10" height="68" rx="3" fill={`url(#di-stroke-${id})`} />
      {/* i tittle — the glowing orb, now with orbit rings */}
      <circle cx="157" cy="62" r="8" fill={`url(#di-dot-${id})`}>
        {animated && (
          <animate
            attributeName="r"
            values="7;9;7"
            dur="2.4s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <circle cx="157" cy="62" r="14" stroke={`url(#di-stroke-${id})`} strokeWidth="0.8" opacity="0.5" fill="none">
        {animated && (
          <animate
            attributeName="r"
            values="13;16;13"
            dur="3.6s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <circle cx="157" cy="62" r="20" stroke={`url(#di-stroke-${id})`} strokeWidth="0.6" opacity="0.25" fill="none" />
      <defs>
        <linearGradient id={`di-stroke-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#A78BFA" />
          <stop offset="0.55" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
        <radialGradient id={`di-dot-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#7C3AED" />
        </radialGradient>
        <radialGradient id={`di-glow-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#7C3AED" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#22D3EE" stopOpacity="0.12" />
          <stop offset="1" stopColor="#07070B" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function DILogo({ size = 32, animated = false, showTagline = false, inverted = false }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <DILogoMark size={size} animated={animated} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--di-sans)",
            fontWeight: 700,
            fontSize: size * 0.55,
            letterSpacing: "-0.02em",
            color: inverted ? "#07070B" : "#F5F5F7",
          }}
        >
          DI{" "}
          <span style={{ fontWeight: 400, color: inverted ? "#404049" : "#A1A1AA" }}>
            Digital Studio
          </span>
        </span>
        {showTagline && (
          <span
            style={{
              fontFamily: "var(--di-mono)",
              fontSize: size * 0.28,
              color: "#71717A",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: size * 0.12,
            }}
          >
            software · saas · ia
          </span>
        )}
      </div>
    </div>
  );
}

window.DILogoMark = DILogoMark;
window.DILogo = DILogo;
