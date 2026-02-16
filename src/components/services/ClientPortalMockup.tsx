import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, FileText, CreditCard, MessageSquare, 
  CheckCircle, Clock, AlertCircle, ChevronRight, 
  Download, Eye, User
} from "lucide-react";

const ClientPortalMockup = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "files">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "requests" as const, label: "Requests", icon: MessageSquare },
    { id: "files" as const, label: "Files", icon: FileText },
  ];

  const requests = [
    { title: "Update homepage banner", status: "completed", date: "2 days ago" },
    { title: "Add contact form to footer", status: "in_progress", date: "Today" },
    { title: "Fix mobile menu alignment", status: "pending", date: "Just now" },
  ];

  const files = [
    { name: "Brand Guidelines.pdf", size: "2.4 MB", date: "Jan 15" },
    { name: "Logo Pack.zip", size: "8.1 MB", date: "Jan 12" },
    { name: "Product Photos.zip", size: "24 MB", date: "Jan 10" },
  ];

  const statusConfig = {
    completed: { color: "text-green-500", bg: "bg-green-500/15", icon: CheckCircle, label: "Done" },
    in_progress: { color: "text-amber-500", bg: "bg-amber-500/15", icon: Clock, label: "In Progress" },
    pending: { color: "text-blue-500", bg: "bg-blue-500/15", icon: AlertCircle, label: "Pending" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto">
        {/* Portal Header */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center">
                <User size={16} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Sarah's Portal</h3>
                <p className="text-xs text-muted-foreground">Website Redesign</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">72% Complete</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "72%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-foreground rounded-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="portal-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full"
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[260px]">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Requests", value: "12" },
                    { label: "Completed", value: "9" },
                    { label: "Files", value: "6" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-lg font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-3">Recent Activity</p>
                  <div className="space-y-2.5">
                    {requests.map((req, i) => {
                      const config = statusConfig[req.status as keyof typeof statusConfig];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <config.icon size={14} className={config.color} />
                            <span className="text-sm truncate">{req.title}</span>
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "requests" && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {requests.map((req, i) => {
                  const config = statusConfig[req.status as keyof typeof statusConfig];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3.5 rounded-xl border border-border/40 hover:border-border transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium">{req.title}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{req.date}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {files.map((file, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:border-border transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size} · {file.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1.5 rounded-lg hover:bg-muted/80">
                        <Eye size={14} className="text-muted-foreground" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1.5 rounded-lg hover:bg-muted/80">
                        <Download size={14} className="text-muted-foreground" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientPortalMockup;
