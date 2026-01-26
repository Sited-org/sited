import { useState } from "react";
import { motion } from "framer-motion";
import { Check, CreditCard, Building, Send } from "lucide-react";

const InvoiceMockup = () => {
  const [isPaid, setIsPaid] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const lineItems = [
    { description: "Call out fee", quantity: 1, price: 120 },
    { description: "Materials", quantity: 1, price: 800 },
    { description: "Installation", quantity: 1, price: 650 },
  ];

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto">
        {/* Invoice Header */}
        <div className="p-8 border-b border-border/50">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Invoice #0042</h3>
              <p className="text-sm text-muted-foreground">Due January 30, 2025</p>
            </div>
            <motion.div
              animate={isPaid ? { scale: [1, 1.2, 1] } : {}}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                isPaid ? "bg-green-500/20 text-green-600" : "bg-accent/20 text-accent-foreground"
              }`}
            >
              {isPaid ? "Paid" : "Pending"}
            </motion.div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">From</p>
              <p className="font-medium">Your Business</p>
              <p className="text-muted-foreground">hi@appleseed.com</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Bill To</p>
              <p className="font-medium">Linda Carmine</p>
              <p className="text-muted-foreground">lincar.32@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-8">
          <div className="space-y-4 mb-8">
            {lineItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">${(item.quantity * item.price).toLocaleString()}</p>
              </motion.div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>${tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-4 border-t border-border/50">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Actions */}
          <div className="space-y-3">
            <motion.button
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              onClick={() => setIsPaid(!isPaid)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all duration-300 ${
                isPaid
                  ? "bg-green-500 text-white"
                  : "bg-foreground text-background"
              }`}
            >
              {isPaid ? (
                <>
                  <Check size={20} />
                  Payment Complete
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pay Now
                </>
              )}
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-4 rounded-xl border border-border/50 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <Building size={16} />
                Bank Transfer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-4 rounded-xl border border-border/50 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <Send size={16} />
                Send Reminder
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoiceMockup;
