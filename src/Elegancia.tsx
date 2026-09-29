import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// 3 photos in 10s at 30fps: each scene is 4s long and overlaps the next by
// 1s for the crossfade, so every photo is on screen for about 3 seconds.
export const FPS = 30;
export const SCENE_FRAMES = 120;
export const FADE_FRAMES = 30;
export const TOTAL_FRAMES = 3 * SCENE_FRAMES - 2 * FADE_FRAMES; // 300

const BEIGE = "#F3EADF";
const TAUPE = "#5B4636";
const FONT = '"Cormorant Garamond", Georgia, serif';

export type EleganciaProps = {
  readonly images: string[];
  readonly text: string;
};

// Each photo drifts in a different direction so the sequence doesn't repeat.
const MOTIONS = [
  { scale: [1.04, 1.14], x: [0, -20], y: [0, -30] },
  { scale: [1.14, 1.04], x: [-25, 15], y: [10, 0] },
  { scale: [1.04, 1.12], x: [15, -10], y: [-20, 20] },
];

const Photo: React.FC<{ src: string; index: number; isLast: boolean }> = ({
  src,
  index,
  isLast,
}) => {
  const frame = useCurrentFrame();
  const m = MOTIONS[index % MOTIONS.length];
  const progress = interpolate(frame, [0, SCENE_FRAMES], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  const scale = interpolate(progress, [0, 1], m.scale);
  const x = interpolate(progress, [0, 1], m.x);
  const y = interpolate(progress, [0, 1], m.y);

  // Fade in over the previous photo; the first photo is already visible.
  const fadeIn =
    index === 0
      ? 1
      : interpolate(frame, [0, FADE_FRAMES], [0, 1], {
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.ease),
        });
  // The last photo fades softly into beige at the very end.
  const fadeOut = isLast
    ? interpolate(frame, [SCENE_FRAMES - 20, SCENE_FRAMES], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut, overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};

const Title: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [15, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const disappear = interpolate(
    frame,
    [TOTAL_FRAMES - 25, TOTAL_FRAMES - 5],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const line = interpolate(frame, [35, 75], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: appear * disappear,
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - appear) * 24}px)`,
          backgroundColor: "rgba(247, 240, 231, 0.84)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(160, 128, 98, 0.35)",
          borderRadius: 6,
          padding: "56px 72px",
          maxWidth: 820,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
          boxShadow: "0 20px 60px rgba(91, 70, 54, 0.12)",
        }}
      >
        <div style={{ width: line, height: 1.5, backgroundColor: TAUPE }} />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: 100,
            textWrap: "balance",
            lineHeight: 1.1,
            color: TAUPE,
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          {text}
        </div>
        <div style={{ width: line, height: 1.5, backgroundColor: TAUPE }} />
      </div>
    </AbsoluteFill>
  );
};

export const Elegancia: React.FC<EleganciaProps> = ({ images, text }) => {
  // Wait for the serif font so no frame renders with a fallback font.
  const [handle] = useState(() => delayRender("Loading font"));
  useEffect(() => {
    document.fonts
      .load(`italic 500 100px "Cormorant Garamond"`)
      .then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: BEIGE }}>
      {images.map((src, i) => (
        <Sequence
          key={src}
          from={i * (SCENE_FRAMES - FADE_FRAMES)}
          durationInFrames={SCENE_FRAMES}
        >
          <Photo src={src} index={i} isLast={i === images.length - 1} />
        </Sequence>
      ))}
      {/* Soft beige wash to keep the photos in one warm, muted palette. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(243,234,223,0.28) 0%, rgba(243,234,223,0.08) 45%, rgba(214,194,170,0.25) 100%)",
          mixBlendMode: "soft-light",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: "rgba(243,234,223,0.12)" }} />
      <Title text={text} />
    </AbsoluteFill>
  );
};
