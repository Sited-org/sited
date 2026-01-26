import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Calendar, TrendingUp, FileText, DollarSign } from "lucide-react";

const ClientProfileMockup = () => {
  const stats = [
    { label: "Total Spent", value: "$24,500", icon: DollarSign },
    { label: "Projects", value: "3", icon: FileText },
    { label: "Since", value: "Jan 2024", icon: Calendar },
  ];

  const activities = [
    { action: "Blocked drain reported", date: "2 days ago", detail: "Problem" },
    { action: "Emergency callout dispatched", date: "2 days ago", detail: "Action" },
    { action: "Issue fixed, customer satisfied", date: "1 day ago", detail: "Resolved" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
    >
      <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Profile Header */}
        <div className="p-5 sm:p-8 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center shrink-0"
            >
              <User size={28} className="text-muted-foreground sm:w-9 sm:h-9" />
            </motion.div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold">John Appleseed</h3>
                  <p className="text-sm text-muted-foreground">Residential Customer</p>
                </div>
                <span className="inline-flex self-start px-3 py-1 rounded-full text-xs font-medium bg-foreground text-background">
                  Active Client
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  john.a@email.com.au
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={14} />
                  0412 345 678
                </span>
                <span className="flex items-center gap-1.5 hidden sm:flex">
                  <MapPin size={14} />
                  Geelong, VIC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-4 sm:p-6 text-center"
            >
              <div className="flex justify-center mb-2">
                <stat.icon size={18} className="text-muted-foreground" />
              </div>
              <p className="text-lg sm:text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-muted-foreground" />
              <h4 className="text-sm font-medium">Recent Communication</h4>
            </div>
            <span className="text-xs text-muted-foreground">Every detail at your fingertips</span>
          </div>
          
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-foreground/60" />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  activity.detail === "Problem" ? "bg-red-500/20 text-red-600" :
                  activity.detail === "Action" ? "bg-amber-500/20 text-amber-600" :
                  "bg-green-500/20 text-green-600"
                }`}>
                  {activity.detail}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientProfileMockup;
