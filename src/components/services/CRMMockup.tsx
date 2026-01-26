import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, MoreHorizontal, Mail, Phone, Building2 } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  status: "lead" | "prospect" | "customer";
  value: string;
}

const contacts: Contact[] = [
  { id: 1, name: "Sarah Chen", email: "sarah@techcorp.io", company: "TechCorp", status: "customer", value: "$12,500" },
  { id: 2, name: "Marcus Rodriguez", email: "marcus@innovate.co", company: "Innovate Co", status: "prospect", value: "$8,200" },
  { id: 3, name: "Emma Thompson", email: "emma@startuplab.com", company: "StartupLab", status: "lead", value: "$5,000" },
  { id: 4, name: "James Wilson", email: "james@enterprise.io", company: "Enterprise Inc", status: "customer", value: "$24,000" },
];

const statusColors = {
  lead: "bg-muted text-muted-foreground",
  prospect: "bg-accent/20 text-accent-foreground",
  customer: "bg-foreground text-background",
};

const CRMMockup = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl overflow-hidden shadow-2xl max-w-3xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Contacts</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium"
            >
              <Plus size={16} />
              Add Contact
            </motion.button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Company</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <motion.tr
                  key={contact.id}
                  onHoverStart={() => setHoveredRow(contact.id)}
                  onHoverEnd={() => setHoveredRow(null)}
                  onClick={() => setSelectedContact(selectedContact?.id === contact.id ? null : contact)}
                  className={`
                    border-b border-border/30 cursor-pointer transition-colors
                    ${hoveredRow === contact.id ? "bg-muted/50" : ""}
                    ${selectedContact?.id === contact.id ? "bg-muted/80" : ""}
                  `}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center text-sm font-semibold">
                        {contact.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{contact.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-sm">{contact.company}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[contact.status]}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold">{contact.value}</span>
                  </td>
                  <td className="px-6 py-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal size={16} className="text-muted-foreground" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Contact Detail Panel */}
        <AnimatePresence>
          {selectedContact && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-border/50 overflow-hidden"
            >
              <div className="p-6 bg-muted/30">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{selectedContact.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[selectedContact.status]}`}>
                    {selectedContact.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-xl text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Mail size={14} />
                    Email
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-xl text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Phone size={14} />
                    Call
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-xl text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Building2 size={14} />
                    View Company
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CRMMockup;
