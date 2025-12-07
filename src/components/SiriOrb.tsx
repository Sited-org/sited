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

  const ringCount = size === "lg" ? 6 : size === "md" ? 4 : 3;

  return (
    <motion.div
      onClick={onClick}
      className={`${sizeClasses[size]} relative cursor-pointer`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--foreground) / 0.2) 0%, transparent 70%)",
        }}
        animate={{
          scale: isListening || isThinking ? [1, 1.4, 1] : [1, 1.15, 1],
          opacity: isListening || isThinking ? [0.4, 0.6, 0.4] : [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: isThinking ? 1.2 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Core sphere */}
      <motion.div
        className="absolute inset-2 rounded-full bg-gradient-to-br from-foreground/90 via-foreground/70 to-muted-foreground/50"
        animate={{
          scale: isThinking ? [1, 0.95, 1] : 1,
        }}
        transition={{
          duration: 0.8,
          repeat: isThinking ? Infinity : 0,
        }}
      />

      {/* Inner highlight */}
      <div 
        className="absolute rounded-full bg-gradient-to-br from-background/40 to-transparent"
        style={{
          top: "15%",
          left: "15%",
          width: "35%",
          height: "35%",
        }}
      />

      {/* Orbiting rings */}
      {[...Array(ringCount)].map((_, i) => {
        const rotationOffset = (i * 360) / ringCount;
        const tiltX = 60 + i * 8;
        const duration = isThinking ? 2 + i * 0.3 : 6 + i * 1.5;
        
        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              transform: `rotateX(${tiltX}deg) rotateY(${rotationOffset}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full border border-foreground/30"
              style={{
                borderWidth: size === "lg" ? "1.5px" : "1px",
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        );
      })}

      {/* Horizontal equator ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-foreground/50"
        style={{
          transform: "rotateX(75deg)",
        }}
        animate={{
          rotate: isThinking ? 360 : 0,
        }}
        transition={{
          duration: isThinking ? 3 : 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Diagonal accent ring */}
      <motion.div
        className="absolute inset-1 rounded-full border border-muted-foreground/40"
        style={{
          transform: "rotateX(45deg) rotateZ(25deg)",
        }}
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: isThinking ? 4 : 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Small orbiting dot */}
      <motion.div
        className="absolute"
        style={{
          width: size === "lg" ? "8px" : size === "md" ? "6px" : "4px",
          height: size === "lg" ? "8px" : size === "md" ? "6px" : "4px",
          top: "50%",
          left: "50%",
          marginTop: size === "lg" ? "-4px" : size === "md" ? "-3px" : "-2px",
          marginLeft: size === "lg" ? "-4px" : size === "md" ? "-3px" : "-2px",
        }}
        animate={{
          x: [0, 40, 0, -40, 0].map(v => v * (size === "lg" ? 1 : size === "md" ? 0.6 : 0.4)),
          y: [20, 0, -20, 0, 20].map(v => v * (size === "lg" ? 1 : size === "md" ? 0.6 : 0.4)),
        }}
        transition={{
          duration: isThinking ? 2 : 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full rounded-full bg-foreground shadow-lg" />
      </motion.div>

      {/* Thinking pulse effect */}
      {isThinking && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-foreground/40"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}

      {/* Listening wave rings */}
      {isListening && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-foreground/30"
              animate={{
                scale: [1, 1.5],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};