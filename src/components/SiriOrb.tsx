import { motion } from "framer-motion";

interface SiriOrbProps {
  isListening?: boolean;
  isThinking?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export const SiriOrb = ({ isListening = false, isThinking = false, size = "lg", onClick }: SiriOrbProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  const scale = size === "lg" ? 1 : size === "md" ? 0.625 : 0.375;

  return (
    <motion.div
      onClick={onClick}
      className={`${sizeClasses[size]} relative cursor-pointer`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Soft outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--foreground) / 0.15) 0%, transparent 60%)",
          filter: "blur(12px)",
        }}
        animate={{
          scale: [1, 1.3, 1.1, 1.25, 1],
          opacity: isThinking ? [0.3, 0.5, 0.3] : [0.15, 0.25, 0.2, 0.15],
        }}
        transition={{
          duration: isThinking ? 2 : 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ethereal mist layers */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`mist-${i}`}
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(ellipse ${60 + i * 15}% ${40 + i * 10}% at ${30 + i * 12}% ${25 + i * 15}%, hsl(var(--foreground) / ${0.08 - i * 0.015}) 0%, transparent 70%)`,
            filter: `blur(${4 + i * 2}px)`,
          }}
          animate={{
            rotate: i % 2 === 0 ? [0, 360] : [360, 0],
            scale: [1, 1.05 + i * 0.02, 1],
          }}
          transition={{
            rotate: {
              duration: 20 + i * 8,
              repeat: Infinity,
              ease: "linear",
            },
            scale: {
              duration: 4 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
      ))}

      {/* Core sphere with soft edges */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `${12 * scale}px`,
          background: "radial-gradient(circle at 35% 35%, hsl(var(--foreground) / 0.9), hsl(var(--foreground) / 0.6) 50%, hsl(var(--muted-foreground) / 0.4) 100%)",
          boxShadow: "inset 0 0 20px hsl(var(--background) / 0.3)",
        }}
        animate={{
          scale: isThinking ? [1, 0.97, 1.02, 0.98, 1] : [1, 1.01, 0.99, 1],
        }}
        transition={{
          duration: isThinking ? 1.5 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Flowing orbital wisps */}
      {[...Array(5)].map((_, i) => {
        const angle = (i * 72) + 15;
        return (
          <motion.div
            key={`wisp-${i}`}
            className="absolute inset-0"
            style={{
              transform: `rotate(${angle}deg)`,
            }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{
                width: `${100 + i * 8}%`,
                height: `${30 + i * 5}%`,
                left: `${-i * 4}%`,
                top: "35%",
                background: `linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / ${0.15 - i * 0.02}) 30%, hsl(var(--foreground) / ${0.2 - i * 0.03}) 50%, hsl(var(--foreground) / ${0.15 - i * 0.02}) 70%, transparent 100%)`,
                filter: `blur(${2 + i}px)`,
                borderRadius: "50%",
              }}
              animate={{
                rotate: [0, 360],
                scaleX: [1, 1.1, 0.95, 1.05, 1],
              }}
              transition={{
                rotate: {
                  duration: isThinking ? 8 + i * 2 : 15 + i * 4,
                  repeat: Infinity,
                  ease: "linear",
                },
                scaleX: {
                  duration: 5 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />
          </motion.div>
        );
      })}

      {/* Drifting particles */}
      {[...Array(6)].map((_, i) => {
        const startAngle = i * 60;
        const radius = 35 + (i % 3) * 12;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-foreground/60"
            style={{
              width: `${(3 - (i % 2)) * scale}px`,
              height: `${(3 - (i % 2)) * scale}px`,
              left: "50%",
              top: "50%",
              filter: "blur(0.5px)",
            }}
            animate={{
              x: [
                Math.cos((startAngle * Math.PI) / 180) * radius * scale,
                Math.cos(((startAngle + 120) * Math.PI) / 180) * radius * scale,
                Math.cos(((startAngle + 240) * Math.PI) / 180) * radius * scale,
                Math.cos((startAngle * Math.PI) / 180) * radius * scale,
              ],
              y: [
                Math.sin((startAngle * Math.PI) / 180) * radius * scale,
                Math.sin(((startAngle + 120) * Math.PI) / 180) * radius * scale,
                Math.sin(((startAngle + 240) * Math.PI) / 180) * radius * scale,
                Math.sin((startAngle * Math.PI) / 180) * radius * scale,
              ],
              opacity: [0.3, 0.7, 0.4, 0.6, 0.3],
            }}
            transition={{
              duration: isThinking ? 4 + i : 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Soft inner glow pulse */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `${20 * scale}px`,
          background: "radial-gradient(circle at 40% 40%, hsl(var(--background) / 0.4) 0%, transparent 60%)",
        }}
        animate={{
          opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
          scale: [1, 1.05, 0.98, 1.02, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Thinking ripples */}
      {isThinking && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute inset-0 rounded-full"
              style={{
                border: "1px solid hsl(var(--foreground) / 0.2)",
                filter: "blur(1px)",
              }}
              animate={{
                scale: [1, 1.6],
                opacity: [0.3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Listening gentle waves */}
      {isListening && (
        <>
          {[0, 1].map((i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute inset-2 rounded-full"
              style={{
                border: "1px solid hsl(var(--foreground) / 0.15)",
                filter: "blur(2px)",
              }}
              animate={{
                scale: [1, 1.3],
                opacity: [0.2, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};