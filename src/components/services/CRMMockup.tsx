import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  status: "lead" | "prospect" | "customer";
  location: string;
}

const contacts: Contact[] = [
  { id: 1, name: "John Appleseed", email: "john@appleseedplumbing.com.au", company: "Appleseed Plumbing", status: "customer", location: "Geelong, VIC" },
  { id: 2, name: "Katie Morrison", email: "katie@katieshandmade.com.au", company: "Katie's Handmade", status: "prospect", location: "Byron Bay, NSW" },
  { id: 3, name: "Gil Santos", email: "gil@thecornercafe.com.au", company: "The Corner Cafe", status: "customer", location: "Fremantle, WA" },
];

const statusColors = {
  lead: "bg-muted text-muted-foreground",
  prospect: "bg-accent/20 text-accent-foreground",
  customer: "bg-foreground text-background",
};

const CRMMockup = () => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Only show first 3 contacts on mobile for cleaner display
  const displayContacts = contacts.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
    >
      <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Contacts</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-foreground text-background rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add</span> Contact
            </motion.button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-muted/50 border border-border/50 rounded-lg sm:rounded-xl text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>
        </div>

        {/* Simplified Card Layout for Mobile, Table for Desktop */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Company</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Location</th>
              </tr>
            </thead>
            <tbody>
              {displayContacts.map((contact) => (
                <motion.tr
                  key={contact.id}
                  onHoverStart={() => setHoveredRow(contact.id)}
                  onHoverEnd={() => setHoveredRow(null)}
                  className={`
                    border-b border-border/30 transition-colors
                    ${hoveredRow === contact.id ? "bg-muted/50" : ""}
                  `}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center text-sm font-semibold shrink-0">
                        {contact.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{contact.company}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[contact.status]}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-muted-foreground">{contact.location}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="sm:hidden divide-y divide-border/30">
          {displayContacts.map((contact) => (
            <div key={contact.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center text-xs font-semibold shrink-0">
                    {contact.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.company}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{contact.location}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[contact.status]}`}>
                  {contact.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CRMMockup;
