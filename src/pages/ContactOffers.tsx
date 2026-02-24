import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/usePageSEO";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";

type BusinessCategory = "service" | "retail" | "professional" | null;

interface QuestionOption {
  label: string;
  description: string;
  color?: string;
}

interface QuestionConfig {
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

// --- Service questions ---
const SERVICE_QUESTIONS: QuestionConfig[] = [
  {
    title: "How many services do you offer?",
    subtitle: "This helps us build the right number of service pages",
    options: [
      { label: "1-3", description: "Specialising in a few core offers" },
      { label: "4-6", description: "I offer a good range of services" },
      { label: "7+", description: "Comprehensive offerings, full service" },
    ],
  },
  {
    title: "How many suburbs do you service?",
    subtitle: "We'll create local SEO pages so you dominate search in the area",
    options: [
      { label: "1-2", description: "I focus locally" },
      { label: "3-5", description: "I cover my region" },
      { label: "6+", description: "I service a wide region" },
    ],
  },
  {
    title: "Do you have your own images?",
    subtitle: "We have a high standard for websites we create, using professional imagery to create the perfect website for you.",
    options: [
      { label: "Yes", description: "I have a good variety of photos of my work & team" },
      { label: "Some", description: "A few photos / videos, not many" },
      { label: "No — Stock", description: "Use stock images" },
      { label: "No — Photoshoot", description: "Organise a photoshoot/videographer" },
    ],
  },
  {
    title: "How soon do you need your website?",
    options: [
      { label: "ASAP", description: "Prioritise my website" },
      { label: "1-2 Weeks", description: "Average delivery" },
      { label: "3-4 Weeks", description: "No heavy time constraints" },
    ],
  },
];

// --- Retail questions ---
const RETAIL_QUESTIONS: QuestionConfig[] = [
  {
    title: "How many locations do you have?",
    subtitle: "We'll build location pages for each store",
    options: [
      { label: "1", description: "A single storefront" },
      { label: "2-4", description: "A few locations across the area" },
      { label: "5+", description: "Multi-location business" },
    ],
  },
  {
    title: "Do you sell online?",
    subtitle: "Helps us determine if you need e-commerce functionality",
    options: [
      { label: "Yes", description: "I sell products online already" },
      { label: "Not yet", description: "I want to start selling online" },
      { label: "No", description: "In-store only, no online sales needed" },
    ],
  },
  {
    title: "Do you have your own product images?",
    subtitle: "High-quality imagery is critical for retail websites",
    options: [
      { label: "Yes", description: "Professional product photography ready" },
      { label: "Some", description: "A few product photos, not comprehensive" },
      { label: "No — Stock", description: "Use stock / supplier images" },
      { label: "No — Photoshoot", description: "Organise a product photoshoot" },
    ],
  },
  {
    title: "How soon do you need your website?",
    options: [
      { label: "ASAP", description: "Prioritise my website" },
      { label: "1-2 Weeks", description: "Average delivery" },
      { label: "3-4 Weeks", description: "No heavy time constraints" },
    ],
  },
];

// --- Professional questions ---
const PROFESSIONAL_QUESTIONS: QuestionConfig[] = [
  {
    title: "What best describes your practice?",
    subtitle: "We'll tailor the site structure to your industry",
    options: [
      { label: "Solo practitioner", description: "Just me — personal brand focused" },
      { label: "Small firm", description: "2-10 team members" },
      { label: "Established firm", description: "10+ staff, multiple departments" },
    ],
  },
  {
    title: "How many service areas do you cover?",
    subtitle: "We'll create targeted pages for each area of expertise",
    options: [
      { label: "1-3", description: "Niche specialist" },
      { label: "4-6", description: "Broad range of expertise" },
      { label: "7+", description: "Full-service firm" },
    ],
  },
  {
    title: "Do you have professional headshots & images?",
    subtitle: "Trust is everything for professional services — imagery matters",
    options: [
      { label: "Yes", description: "Professional headshots & office photos ready" },
      { label: "Some", description: "A few photos, could use more" },
      { label: "No — Stock", description: "Use stock images for now" },
      { label: "No — Photoshoot", description: "Organise professional photography" },
    ],
  },
  {
    title: "How soon do you need your website?",
    options: [
      { label: "ASAP", description: "Prioritise my website" },
      { label: "1-2 Weeks", description: "Average delivery" },
      { label: "3-4 Weeks", description: "No heavy time constraints" },
    ],
  },
];

// Trick question (final for all categories)
const TRICK_QUESTION: QuestionConfig = {
  title: "Are you ready to see your offer?",
  options: [
    { label: "Yes! — I can't wait!", description: "", color: "blue" },
    { label: "Yes! — I can't wait!", description: "", color: "red" },
  ],
};

function getQuestionsForCategory(cat: BusinessCategory): QuestionConfig[] {
  if (cat === "service") return SERVICE_QUESTIONS;
  if (cat === "retail") return RETAIL_QUESTIONS;
  if (cat === "professional") return PROFESSIONAL_QUESTIONS;
  return [];
}

const ContactOffers = () => {
  usePageSEO({
    title: "Tell Us About Your Business | Sited",
    description: "Answer a few quick questions so we can match you with the right solution.",
  });

  const navigate = useNavigate();
  const [category, setCategory] = useState<BusinessCategory>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showTrick, setShowTrick] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  // Gate: require lead capture popup to have been completed first
  useEffect(() => {
    const leadCaptured = sessionStorage.getItem("lead_captured");
    if (!leadCaptured) {
      setShowLeadCapture(true);
    }
  }, []);

  const questions = getQuestionsForCategory(category);
  const totalSteps = category ? questions.length + 2 : 1; // +1 category step, +1 trick question
  const currentStep = !category ? 1 : showTrick ? questions.length + 2 : questionIndex + 2;

  const handleCategorySelect = (cat: BusinessCategory) => {
    setCategory(cat);
    setQuestionIndex(0);
    setAnswers([]);
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setShowTrick(true);
    }
  };

  const handleTrickAnswer = async () => {
    setSubmitting(true);
    try {
      const leadName = sessionStorage.getItem("lead_name") || "";
      const leadEmail = sessionStorage.getItem("lead_email") || "";
      const leadPhone = sessionStorage.getItem("lead_phone") || "";
      
      // Update existing lead only — never create a new one
      await supabase.functions.invoke("save-partial-lead", {
        body: {
          name: leadName,
          email: leadEmail,
          phone: leadPhone || null,
          project_type: "website",
          form_data: {
            source: "offers_flow",
            business_category: category,
            questionnaire_answers: answers,
          },
          update_only: true,
        },
      });
    } catch (err) {
      console.error("Error saving questionnaire:", err);
    }
    setSubmitting(false);
    sessionStorage.setItem("questionnaire_complete", "true");
    navigate("/offer");
  };

  const goBack = () => {
    if (showTrick) {
      setShowTrick(false);
      setAnswers(answers.slice(0, -1));
    } else if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      setAnswers(answers.slice(0, -1));
    } else {
      setCategory(null);
      setAnswers([]);
    }
  };

  const canGoBack = category !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <motion.div
          className="h-full bg-sited-blue"
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5">
        {canGoBack ? (
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <div />
        )}
        <span className="text-xs text-muted-foreground font-medium">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 1: Category selection */}
            {!category && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">What type of business?</h1>
                  <p className="text-muted-foreground mt-2">Helps us tailor the right approach.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleCategorySelect("service")}
                    className="p-6 rounded-2xl border-2 border-border hover:border-sited-blue text-center transition-all hover:shadow-soft group"
                  >
                    <span className="text-4xl block mb-3">🔧</span>
                    <span className="font-semibold text-foreground group-hover:text-sited-blue transition-colors text-sm">Service</span>
                  </button>
                  <button
                    onClick={() => handleCategorySelect("retail")}
                    className="p-6 rounded-2xl border-2 border-border hover:border-sited-blue text-center transition-all hover:shadow-soft group"
                  >
                    <span className="text-4xl block mb-3">🏪</span>
                    <span className="font-semibold text-foreground group-hover:text-sited-blue transition-colors text-sm">Retail</span>
                  </button>
                  <button
                    onClick={() => handleCategorySelect("professional")}
                    className="p-6 rounded-2xl border-2 border-border hover:border-sited-blue text-center transition-all hover:shadow-soft group"
                  >
                    <span className="text-4xl block mb-3">💼</span>
                    <span className="font-semibold text-foreground group-hover:text-sited-blue transition-colors text-sm">Professional</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Category-specific questions */}
            {category && !showTrick && questions[questionIndex] && (
              <motion.div
                key={`q-${questionIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{questions[questionIndex].title}</h1>
                  {questions[questionIndex].subtitle && (
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">{questions[questionIndex].subtitle}</p>
                  )}
                </div>
                <div className="space-y-3">
                  {questions[questionIndex].options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleAnswer(opt.label)}
                      className="w-full p-5 rounded-2xl border-2 border-border hover:border-sited-blue text-left transition-all hover:shadow-soft flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-semibold text-foreground block">{opt.label}</span>
                        {opt.description && (
                          <span className="text-sm text-muted-foreground">{opt.description}</span>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-sited-blue transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Trick question */}
            {showTrick && (
              <motion.div
                key="trick"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{TRICK_QUESTION.title}</h1>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {TRICK_QUESTION.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={handleTrickAnswer}
                      disabled={submitting}
                      className={`p-6 rounded-2xl border-2 text-center transition-all hover:shadow-soft group disabled:opacity-60 ${
                        opt.color === "blue"
                          ? "border-sited-blue/40 bg-sited-blue/10 hover:bg-sited-blue/20 hover:border-sited-blue"
                          : "border-red-500/40 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500"
                      }`}
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      ) : (
                        <span className={`font-bold text-lg ${
                          opt.color === "blue" ? "text-sited-blue" : "text-red-500"
                        }`}>
                          {opt.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lead capture gate dialog */}
      <LeadCaptureDialog
        open={showLeadCapture}
        onOpenChange={(open) => {
          if (!open) {
            // If they close without completing, redirect home
            const captured = sessionStorage.getItem("lead_captured");
            if (!captured) {
              navigate("/");
            }
          }
          setShowLeadCapture(open);
        }}
      />
    </div>
  );
};

export default ContactOffers;
