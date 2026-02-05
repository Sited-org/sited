import { motion } from "framer-motion";

const DeviceShowcaseMockup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full flex justify-center items-end py-8 sm:py-12 lg:py-16"
    >
      {/* Container for overlapping devices */}
      <div className="relative flex items-end justify-center w-full max-w-4xl mx-auto">
        
        {/* MacBook Pro - Center, largest */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          {/* MacBook Screen */}
          <div className="relative">
            {/* Screen bezel */}
            <div className="bg-[#1d1d1f] rounded-t-xl sm:rounded-t-2xl p-[3px] sm:p-1 lg:p-1.5">
              {/* Camera notch */}
              <div className="absolute top-1 sm:top-1.5 lg:top-2 left-1/2 -translate-x-1/2 w-1.5 sm:w-2 lg:w-2.5 h-1.5 sm:h-2 lg:h-2.5 rounded-full bg-[#0d0d0d]" />
              
              {/* Screen content */}
              <div className="w-[280px] sm:w-[400px] lg:w-[520px] h-[175px] sm:h-[250px] lg:h-[325px] bg-gradient-to-b from-background to-muted/30 rounded-lg sm:rounded-xl overflow-hidden">
                {/* Homepage content mockup */}
                <div className="w-full h-full flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-12">
                  {/* Nav bar */}
                  <div className="absolute top-2 sm:top-4 left-0 right-0 flex items-center justify-between px-3 sm:px-6">
                    <div className="text-[6px] sm:text-[10px] lg:text-xs font-semibold">Sited<span className="text-muted-foreground">.au</span></div>
                    <div className="flex gap-2 sm:gap-4">
                      <div className="w-6 sm:w-10 h-1 sm:h-1.5 bg-muted-foreground/30 rounded" />
                      <div className="w-6 sm:w-10 h-1 sm:h-1.5 bg-muted-foreground/30 rounded" />
                      <div className="w-6 sm:w-10 h-1 sm:h-1.5 bg-muted-foreground/30 rounded" />
                    </div>
                    <div className="w-12 sm:w-16 h-3 sm:h-4 bg-foreground rounded-sm sm:rounded" />
                  </div>
                  
                  {/* Hero content */}
                  <div className="text-center mt-4 sm:mt-8">
                    <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted/50 rounded-full mb-2 sm:mb-3">
                      <div className="w-2 sm:w-3 h-2 sm:h-3 bg-accent/50 rounded-full" />
                      <span className="text-[5px] sm:text-[7px] lg:text-[9px] text-muted-foreground">AI-Powered Design</span>
                    </div>
                    <h1 className="text-[10px] sm:text-base lg:text-xl font-semibold leading-tight">We build websites</h1>
                    <h1 className="text-[10px] sm:text-base lg:text-xl font-semibold text-muted-foreground leading-tight">that convert.</h1>
                    <p className="text-[5px] sm:text-[7px] lg:text-[9px] text-muted-foreground mt-1 sm:mt-2 max-w-[180px] sm:max-w-[280px] mx-auto">
                      Sited combines AI precision with creative excellence
                    </p>
                    <div className="flex gap-1.5 sm:gap-2 justify-center mt-2 sm:mt-4">
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-foreground text-background text-[5px] sm:text-[7px] lg:text-[9px] rounded-sm sm:rounded font-medium">Start Your Project</div>
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 border border-border text-[5px] sm:text-[7px] lg:text-[9px] rounded-sm sm:rounded">View Our Work</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* MacBook hinge/base */}
            <div className="relative">
              <div className="h-2 sm:h-3 lg:h-4 bg-gradient-to-b from-[#1d1d1f] to-[#2d2d2f] rounded-b-sm" />
              <div className="w-[300px] sm:w-[430px] lg:w-[560px] h-2 sm:h-3 lg:h-4 bg-gradient-to-b from-[#c4c4c6] to-[#a8a8aa] rounded-b-lg mx-auto -mt-0.5" />
              <div className="w-12 sm:w-16 lg:w-20 h-0.5 sm:h-1 bg-[#8a8a8c] rounded-full mx-auto -mt-1.5 sm:-mt-2" />
            </div>
          </div>
        </motion.div>

        {/* iPad Pro - Left side, overlapping */}
        <motion.div
          initial={{ opacity: 0, x: -30, y: 30 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 sm:left-4 lg:left-8 bottom-4 sm:bottom-6 lg:bottom-8 z-20 hidden sm:block"
        >
          <div className="bg-[#1d1d1f] rounded-xl sm:rounded-2xl lg:rounded-3xl p-[3px] sm:p-1 lg:p-1.5 shadow-2xl">
            {/* Camera */}
            <div className="absolute top-3 sm:top-4 lg:top-5 left-1/2 -translate-x-1/2 w-1 sm:w-1.5 lg:w-2 h-1 sm:h-1.5 lg:h-2 rounded-full bg-[#0d0d0d]" />
            
            {/* Screen content */}
            <div className="w-[100px] sm:w-[140px] lg:w-[180px] h-[140px] sm:h-[190px] lg:h-[240px] bg-gradient-to-b from-background to-muted/30 rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden">
              <div className="w-full h-full flex flex-col items-center justify-center px-2 sm:px-3 lg:px-4">
                {/* Nav */}
                <div className="absolute top-2 sm:top-3 left-0 right-0 flex items-center justify-between px-2 sm:px-3">
                  <div className="text-[4px] sm:text-[6px] lg:text-[8px] font-semibold">Sited<span className="text-muted-foreground">.au</span></div>
                  <div className="w-2 sm:w-3 h-2 sm:h-3 flex flex-col gap-0.5 justify-center">
                    <div className="w-full h-[1px] bg-foreground" />
                    <div className="w-full h-[1px] bg-foreground" />
                  </div>
                </div>
                
                {/* Hero */}
                <div className="text-center mt-3 sm:mt-4">
                  <div className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-muted/50 rounded-full mb-1.5 sm:mb-2">
                    <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-accent/50 rounded-full" />
                    <span className="text-[3px] sm:text-[4px] lg:text-[5px] text-muted-foreground">AI-Powered</span>
                  </div>
                  <h1 className="text-[6px] sm:text-[9px] lg:text-[11px] font-semibold leading-tight">We build websites</h1>
                  <h1 className="text-[6px] sm:text-[9px] lg:text-[11px] font-semibold text-muted-foreground leading-tight">that convert.</h1>
                  <div className="flex flex-col gap-1 mt-2 sm:mt-3">
                    <div className="px-2 py-0.5 sm:py-1 bg-foreground text-background text-[4px] sm:text-[5px] lg:text-[6px] rounded-sm font-medium">Start Your Project</div>
                    <div className="px-2 py-0.5 sm:py-1 border border-border text-[4px] sm:text-[5px] lg:text-[6px] rounded-sm">View Our Work</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* iPhone - Right side, overlapping */}
        <motion.div
          initial={{ opacity: 0, x: 30, y: 30 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-2 sm:right-8 lg:right-16 bottom-2 sm:bottom-4 lg:bottom-6 z-30"
        >
          <div className="bg-[#1d1d1f] rounded-[16px] sm:rounded-[24px] lg:rounded-[32px] p-[2px] sm:p-[3px] lg:p-1 shadow-2xl">
            {/* Dynamic Island */}
            <div className="absolute top-2 sm:top-3 lg:top-4 left-1/2 -translate-x-1/2 w-8 sm:w-12 lg:w-14 h-2 sm:h-3 lg:h-4 rounded-full bg-[#0d0d0d] z-10" />
            
            {/* Screen content */}
            <div className="w-[60px] sm:w-[85px] lg:w-[100px] h-[120px] sm:h-[170px] lg:h-[200px] bg-gradient-to-b from-background to-muted/30 rounded-[14px] sm:rounded-[20px] lg:rounded-[28px] overflow-hidden">
              <div className="w-full h-full flex flex-col items-center justify-center px-1.5 sm:px-2 pt-4 sm:pt-6 lg:pt-8">
                {/* Nav */}
                <div className="absolute top-4 sm:top-6 lg:top-8 left-0 right-0 flex items-center justify-between px-1.5 sm:px-2">
                  <div className="text-[3px] sm:text-[4px] lg:text-[5px] font-semibold">Sited<span className="text-muted-foreground">.au</span></div>
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 flex flex-col gap-[1px] justify-center">
                    <div className="w-full h-[0.5px] bg-foreground" />
                    <div className="w-full h-[0.5px] bg-foreground" />
                  </div>
                </div>
                
                {/* Hero */}
                <div className="text-center mt-2 sm:mt-4">
                  <div className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-muted/50 rounded-full mb-1 sm:mb-1.5">
                    <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-accent/50 rounded-full" />
                    <span className="text-[2px] sm:text-[3px] lg:text-[4px] text-muted-foreground">AI-Powered</span>
                  </div>
                  <h1 className="text-[5px] sm:text-[7px] lg:text-[8px] font-semibold leading-tight">We build websites</h1>
                  <h1 className="text-[5px] sm:text-[7px] lg:text-[8px] font-semibold text-muted-foreground leading-tight">that convert.</h1>
                  <div className="flex flex-col gap-0.5 sm:gap-1 mt-1.5 sm:mt-2 lg:mt-3">
                    <div className="px-1.5 py-0.5 bg-foreground text-background text-[3px] sm:text-[4px] lg:text-[5px] rounded-sm font-medium">Start Project</div>
                    <div className="px-1.5 py-0.5 border border-border text-[3px] sm:text-[4px] lg:text-[5px] rounded-sm">View Work</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Home indicator */}
            <div className="absolute bottom-1 sm:bottom-1.5 lg:bottom-2 left-1/2 -translate-x-1/2 w-6 sm:w-8 lg:w-10 h-0.5 sm:h-1 rounded-full bg-foreground/30" />
          </div>
        </motion.div>
        
      </div>
      
      {/* Subtle reflection/shadow underneath */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] max-w-3xl h-8 sm:h-12 lg:h-16 bg-gradient-to-t from-foreground/5 to-transparent rounded-full blur-xl" />
    </motion.div>
  );
};

export default DeviceShowcaseMockup;
