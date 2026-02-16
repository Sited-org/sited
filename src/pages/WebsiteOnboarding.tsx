import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Globe, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSecureLeadSubmission } from "@/hooks/useSecureLeadSubmission";

const steps = [
  { id: 1, title: "Contact Info" },
  { id: 2, title: "Business Details" },
  { id: 3, title: "Goals & Design" },
  { id: 4, title: "Technical & Content" },
  { id: 5, title: "Timeline & Budget" },
];

const WebsiteOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { isSubmitting, savePartialLead, updatePartialLead, submitLead } = useSecureLeadSubmission();
  const [formData, setFormData] = useState({
    // Step 1: Contact Info
    fullName: "",
    email: "",
    phone: "",
    preferredContact: "",

    // Step 2: Business Details
    businessName: "",
    industry: "",
    businessDescription: "",
    targetAudience: "",
    averageCustomerValue: "",

    // Step 3: Goals & Design (consolidated from old steps 3+4)
    primaryGoal: "",
    secondaryGoals: [] as string[],
    desiredActions: "",
    successMetrics: "",
    existingBranding: "",
    brandColors: "",
    brandFonts: "",
    brandLogoFile: null as File | null,
    brandLogoFileName: "",
    designStyle: "",
    inspirationSites: "",

    // Step 4: Technical & Content (consolidated from old steps 4+5)
    contentReady: "",
    contentHelp: [] as string[],
    requiredPages: [] as string[],
    customPages: "",
    domainOwned: "",
    currentWebsite: "",
    domainName: "",
    domainRegistrar: "",
    domainRegistrarOther: "",
    integrations: [] as string[],
    otherIntegrations: "",
    features: [] as string[],
    otherFeatures: "",

    // Step 5: Timeline & Budget
    budget: "",
    timeline: "",
    launchDate: "",
    howDidYouHear: "",
    additionalNotes: "",
  });

  // Pre-fill from chatbot data (legacy)
  useEffect(() => {
    const chatbotData = sessionStorage.getItem("chatbotInfo");
    if (chatbotData) {
      try {
        const info = JSON.parse(chatbotData);
        setFormData(prev => ({
          ...prev,
          fullName: info.name || prev.fullName,
          email: info.email || prev.email,
          phone: info.phone || prev.phone,
          businessName: info.businessName || prev.businessName,
          industry: info.industry || prev.industry,
          businessDescription: info.description || prev.businessDescription,
          budget: info.budget || prev.budget,
          timeline: info.timeline || prev.timeline,
        }));
        sessionStorage.removeItem("chatbotInfo");
      } catch (e) {
        console.error("Failed to parse chatbot info", e);
      }
    }
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation errors when user updates a field
    setValidationErrors([]);
  };

  const toggleArrayItem = (field: string, item: string) => {
    setFormData((prev) => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      if (currentArray.includes(item)) {
        return { ...prev, [field]: currentArray.filter((i) => i !== item) };
      }
      return { ...prev, [field]: [...currentArray, item] };
    });
    setValidationErrors([]);
  };

  const validateStep = (): string[] => {
    const errors: string[] = [];
    switch (currentStep) {
      case 1:
        if (!formData.fullName.trim()) errors.push("fullName");
        if (!formData.email.trim()) errors.push("email");
        if (!formData.phone.trim()) errors.push("phone");
        if (!formData.preferredContact) errors.push("preferredContact");
        break;
      case 2:
        if (!formData.businessName.trim()) errors.push("businessName");
        if (!formData.industry) errors.push("industry");
        if (!formData.businessDescription.trim()) errors.push("businessDescription");
        if (!formData.targetAudience.trim()) errors.push("targetAudience");
        if (!formData.averageCustomerValue.trim()) errors.push("averageCustomerValue");
        break;
      case 3:
        if (!formData.primaryGoal) errors.push("primaryGoal");
        if (!formData.desiredActions.trim()) errors.push("desiredActions");
        if (!formData.successMetrics.trim()) errors.push("successMetrics");
        if (!formData.existingBranding) errors.push("existingBranding");
        if (!formData.designStyle) errors.push("designStyle");
        break;
      case 4:
        if (!formData.contentReady) errors.push("contentReady");
        if (formData.requiredPages.length === 0) errors.push("requiredPages");
        if (!formData.domainOwned) errors.push("domainOwned");
        break;
      case 5:
        if (!formData.budget) errors.push("budget");
        if (!formData.timeline) errors.push("timeline");
        if (!formData.howDidYouHear) errors.push("howDidYouHear");
        break;
    }
    return errors;
  };

  const hasError = (field: string) => validationErrors.includes(field);

  const nextStep = async () => {
    const errors = validateStep();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Please complete all required fields before continuing.");
      return;
    }

    if (currentStep === 1 && formData.fullName && formData.email) {
      await savePartialLead({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        project_type: 'website',
      });
    } else if (currentStep > 1 && currentStep < steps.length) {
      await updatePartialLead({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        business_name: formData.businessName || null,
        form_data: formData,
      });
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setValidationErrors([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationErrors([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    const errors = validateStep();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Please complete all required fields before submitting.");
      return;
    }

    const success = await submitLead({
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone || null,
      business_name: formData.businessName || null,
      project_type: "website",
      form_data: formData,
    });

    if (success) {
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const errorRing = "ring-2 ring-destructive/50";

  if (isSubmitted) {
    return (
      <Layout hideFooter>
        <div className="min-h-screen bg-gradient-to-b from-surface-elevated to-background pt-24 pb-16">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold mb-4">
                Project Request Submitted!
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                Thanks {formData.fullName.split(' ')[0]}! We've received your project details and our team will be in touch within 24 hours.
              </p>
              <div className="bg-muted/50 rounded-xl p-4 mb-8 text-left">
                <p className="text-sm text-muted-foreground mb-2">What happens next:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-medium">1.</span>
                    <span>We'll review your project requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-medium">2.</span>
                    <span>A team member will reach out to schedule a discovery call</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-medium">3.</span>
                    <span>We'll provide a custom proposal tailored to your needs</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link to="/work">View Our Work</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-gradient-to-b from-surface-elevated to-background pt-24 pb-16">
        <div className="container-tight">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              Back to Contact
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Globe size={24} className="text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">Website Project Onboarding</h1>
                <p className="text-muted-foreground">Tell us everything about your website project</p>
              </div>
            </div>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep > step.id
                        ? "bg-foreground text-background"
                        : currentStep === step.id
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? <Check size={16} /> : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden sm:block w-16 md:w-24 lg:w-32 h-0.5 mx-2 transition-colors ${
                        currentStep > step.id ? "bg-foreground" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
              {steps.map((step) => (
                <span
                  key={step.id}
                  className={`hidden sm:block ${currentStep === step.id ? "text-foreground font-medium" : ""}`}
                >
                  {step.title}
                </span>
              ))}
            </div>
            <p className="sm:hidden text-sm font-medium mt-2">
              Step {currentStep}: {steps[currentStep - 1].title}
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-10"
          >
            {/* Step 1: Contact Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
                  <p className="text-muted-foreground">How can we reach you?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                      placeholder="John Smith"
                      className={`h-12 ${hasError("fullName") ? errorRing : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="john@company.com"
                      className={`h-12 ${hasError("email") ? errorRing : ""}`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="0400 000 000"
                    className={`h-12 ${hasError("phone") ? errorRing : ""}`}
                  />
                </div>
                <div className={`space-y-3 ${hasError("preferredContact") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Preferred Contact Method *</Label>
                  <RadioGroup
                    value={formData.preferredContact}
                    onValueChange={(v) => updateFormData("preferredContact", v)}
                    className="flex flex-wrap gap-4"
                  >
                    {["Email", "Phone", "Video Call"].map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <RadioGroupItem value={method.toLowerCase().replace(" ", "-")} id={`contact-${method}`} />
                        <Label htmlFor={`contact-${method}`} className="font-normal cursor-pointer">
                          {method}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Business Details</h2>
                  <p className="text-muted-foreground">Tell us about your business</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateFormData("businessName", e.target.value)}
                      placeholder="Your Company Name"
                      className={`h-12 ${hasError("businessName") ? errorRing : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select value={formData.industry} onValueChange={(v) => updateFormData("industry", v)}>
                      <SelectTrigger className={`h-12 ${hasError("industry") ? errorRing : ""}`}>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="retail">Retail / E-commerce</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance / Insurance</SelectItem>
                        <SelectItem value="realestate">Real Estate</SelectItem>
                        <SelectItem value="hospitality">Hospitality / Food Service</SelectItem>
                        <SelectItem value="professional">Professional Services</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                        <SelectItem value="creative">Creative / Arts</SelectItem>
                        <SelectItem value="construction">Construction / Home Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">What does your business do? *</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => updateFormData("businessDescription", e.target.value)}
                    placeholder="Describe your products/services and what makes you unique..."
                    className={`min-h-[120px] ${hasError("businessDescription") ? errorRing : ""}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Who is your ideal customer? *</Label>
                  <Textarea
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => updateFormData("targetAudience", e.target.value)}
                    placeholder="Demographics, interests, pain points..."
                    className={`min-h-[100px] ${hasError("targetAudience") ? errorRing : ""}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageCustomerValue">Average Customer Value (Approximate) *</Label>
                  <Input
                    id="averageCustomerValue"
                    value={formData.averageCustomerValue}
                    onChange={(e) => updateFormData("averageCustomerValue", e.target.value)}
                    placeholder="E.g., $500, $1,000, $50,000"
                    className={`h-12 ${hasError("averageCustomerValue") ? errorRing : ""}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    If the business has not launched, provide an estimate
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Goals & Design (consolidated) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Goals & Design</h2>
                  <p className="text-muted-foreground">What do you want to achieve and how should it look?</p>
                </div>

                <div className={`space-y-3 ${hasError("primaryGoal") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Primary Goal for the Website *</Label>
                  <RadioGroup
                    value={formData.primaryGoal}
                    onValueChange={(v) => updateFormData("primaryGoal", v)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "generate-leads", label: "Generate leads / inquiries" },
                      { value: "sell-products", label: "Sell products online" },
                      { value: "brand-awareness", label: "Build brand awareness" },
                      { value: "provide-info", label: "Provide information to customers" },
                      { value: "showcase-portfolio", label: "Showcase work / portfolio" },
                      { value: "booking-scheduling", label: "Enable bookings / scheduling" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="font-normal cursor-pointer flex-1">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Secondary Goals (Select all that apply)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Improve SEO / search rankings",
                      "Build email list",
                      "Integrate with social media",
                      "Provide customer support",
                      "Share blog / news content",
                      "Build community / membership",
                    ].map((goal) => (
                      <div
                        key={goal}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={`goal-${goal}`}
                          checked={formData.secondaryGoals.includes(goal)}
                          onCheckedChange={() => toggleArrayItem("secondaryGoals", goal)}
                        />
                        <Label htmlFor={`goal-${goal}`} className="font-normal cursor-pointer flex-1">
                          {goal}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desiredActions">What actions should visitors take on your site? *</Label>
                  <Textarea
                    id="desiredActions"
                    value={formData.desiredActions}
                    onChange={(e) => updateFormData("desiredActions", e.target.value)}
                    placeholder="E.g., fill out a contact form, make a purchase, book an appointment..."
                    className={`min-h-[80px] ${hasError("desiredActions") ? errorRing : ""}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="successMetrics">How will you measure success? *</Label>
                  <div className="flex flex-col gap-2">
                    <Textarea
                      id="successMetrics"
                      value={formData.successMetrics}
                      onChange={(e) => {
                        updateFormData("successMetrics", e.target.value);
                      }}
                      placeholder="E.g., number of inquiries per month, conversion rate, traffic increase..."
                      className={`min-h-[80px] ${hasError("successMetrics") && formData.successMetrics !== "Not sure yet" ? errorRing : ""}`}
                      disabled={formData.successMetrics === "Not sure yet"}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="success-not-sure"
                        checked={formData.successMetrics === "Not sure yet"}
                        onCheckedChange={(checked) =>
                          updateFormData("successMetrics", checked ? "Not sure yet" : "")
                        }
                      />
                      <Label htmlFor="success-not-sure" className="font-normal text-sm cursor-pointer text-muted-foreground">
                        Not sure yet
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Design Preferences</h3>
                </div>

                <div className={`space-y-3 ${hasError("existingBranding") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Do you have existing branding (logo, colors, fonts)? *</Label>
                  <RadioGroup
                    value={formData.existingBranding}
                    onValueChange={(v) => updateFormData("existingBranding", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes-complete" id="branding-complete" />
                      <Label htmlFor="branding-complete" className="font-normal cursor-pointer">
                        Yes, complete brand kit
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes-partial" id="branding-partial" />
                      <Label htmlFor="branding-partial" className="font-normal cursor-pointer">
                        Yes, but incomplete
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="branding-no" />
                      <Label htmlFor="branding-no" className="font-normal cursor-pointer">
                        No, need branding help
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Conditional: Brand details expand when they have branding */}
                <AnimatePresence>
                  {(formData.existingBranding === "yes-complete" || formData.existingBranding === "yes-partial") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-6 p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="brandColors">Brand Colors</Label>
                            <Input
                              id="brandColors"
                              value={formData.brandColors}
                              onChange={(e) => updateFormData("brandColors", e.target.value)}
                              placeholder="E.g., #FF5733, Navy Blue"
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="brandFonts">Brand Fonts</Label>
                            <Input
                              id="brandFonts"
                              value={formData.brandFonts}
                              onChange={(e) => updateFormData("brandFonts", e.target.value)}
                              placeholder="E.g., Helvetica, Open Sans"
                              className="h-12"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brandLogo">Upload Your Logo</Label>
                          <div className="flex items-center gap-4">
                            <label
                              htmlFor="brandLogo"
                              className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg cursor-pointer hover:border-foreground/30 transition-colors flex-1"
                            >
                              <Upload size={20} className="text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {formData.brandLogoFileName || "Choose a file (PNG, JPG, SVG)"}
                              </span>
                            </label>
                            <Input
                              id="brandLogo"
                              type="file"
                              accept=".png,.jpg,.jpeg,.svg,.webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                updateFormData("brandLogoFile", file);
                                updateFormData("brandLogoFileName", file?.name || "");
                              }}
                              className="hidden"
                            />
                            {formData.brandLogoFileName && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  updateFormData("brandLogoFile", null);
                                  updateFormData("brandLogoFileName", "");
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`space-y-3 ${hasError("designStyle") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Design Style Preference *</Label>
                  <RadioGroup
                    value={formData.designStyle}
                    onValueChange={(v) => updateFormData("designStyle", v)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {[
                      "Minimal & Clean",
                      "Bold & Modern",
                      "Professional & Corporate",
                      "Playful & Creative",
                      "Elegant & Luxurious",
                      "Warm & Friendly",
                    ].map((style) => (
                      <div
                        key={style}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <RadioGroupItem value={style.toLowerCase().replace(/ & /g, "-")} id={`style-${style}`} />
                        <Label htmlFor={`style-${style}`} className="font-normal cursor-pointer text-sm">
                          {style}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspirationSites">Websites you admire (for inspiration)</Label>
                  <Input
                    id="inspirationSites"
                    value={formData.inspirationSites}
                    onChange={(e) => updateFormData("inspirationSites", e.target.value)}
                    placeholder="Paste URLs separated by commas"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Share any websites that inspire you — optional but helpful
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Technical & Content (consolidated) */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Technical & Content</h2>
                  <p className="text-muted-foreground">Pages, content, domain, and integrations</p>
                </div>

                <div className={`space-y-3 ${hasError("contentReady") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Do you have content ready (text, images, videos)? *</Label>
                  <RadioGroup
                    value={formData.contentReady}
                    onValueChange={(v) => updateFormData("contentReady", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="content-yes" />
                      <Label htmlFor="content-yes" className="font-normal cursor-pointer">Yes, all ready</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="content-partial" />
                      <Label htmlFor="content-partial" className="font-normal cursor-pointer">Partially ready</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="content-no" />
                      <Label htmlFor="content-no" className="font-normal cursor-pointer">No, need help</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Conditional: content help expands when not ready */}
                <AnimatePresence>
                  {formData.contentReady && formData.contentReady !== "yes" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                        <Label>What content help do you need?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "Copywriting / Text",
                            "Professional Photography",
                            "Stock Images",
                            "Video Production",
                            "Graphics / Illustrations",
                          ].map((help) => (
                            <div
                              key={help}
                              className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors bg-card"
                            >
                              <Checkbox
                                id={`help-${help}`}
                                checked={formData.contentHelp.includes(help)}
                                onCheckedChange={() => toggleArrayItem("contentHelp", help)}
                              />
                              <Label htmlFor={`help-${help}`} className="font-normal cursor-pointer flex-1 text-sm">
                                {help}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`space-y-3 ${hasError("requiredPages") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Required Pages (Select at least one) *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Home",
                      "About",
                      "Services",
                      "Products / Shop",
                      "Portfolio / Gallery",
                      "Blog",
                      "Contact",
                      "FAQ",
                      "Testimonials",
                      "Pricing",
                      "Team",
                      "Booking / Calendar",
                    ].map((page) => (
                      <div
                        key={page}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={`page-${page}`}
                          checked={formData.requiredPages.includes(page)}
                          onCheckedChange={() => toggleArrayItem("requiredPages", page)}
                        />
                        <Label htmlFor={`page-${page}`} className="font-normal cursor-pointer text-sm flex-1">
                          {page}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPages">Other pages needed?</Label>
                  <Input
                    id="customPages"
                    value={formData.customPages}
                    onChange={(e) => updateFormData("customPages", e.target.value)}
                    placeholder="List any additional pages..."
                    className="h-12"
                  />
                </div>

                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Domain & Integrations</h3>
                </div>

                <div className={`space-y-3 ${hasError("domainOwned") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Do you own a domain name? *</Label>
                  <RadioGroup
                    value={formData.domainOwned}
                    onValueChange={(v) => updateFormData("domainOwned", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="domain-yes" />
                      <Label htmlFor="domain-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="domain-no" />
                      <Label htmlFor="domain-no" className="font-normal cursor-pointer">No, need to purchase</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not-sure" id="domain-not-sure" />
                      <Label htmlFor="domain-not-sure" className="font-normal cursor-pointer">Not sure</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Conditional: Domain details expand when they own one */}
                <AnimatePresence>
                  {formData.domainOwned === "yes" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-6 p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="space-y-2">
                          <Label htmlFor="currentWebsite">Current Website URL (if any)</Label>
                          <Input
                            id="currentWebsite"
                            value={formData.currentWebsite}
                            onChange={(e) => updateFormData("currentWebsite", e.target.value)}
                            placeholder="https://www.example.com"
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="domainName">Domain Name</Label>
                          <Input
                            id="domainName"
                            value={formData.domainName}
                            onChange={(e) => updateFormData("domainName", e.target.value)}
                            placeholder="example.com"
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="domainRegistrar">Registered through?</Label>
                          <Select value={formData.domainRegistrar} onValueChange={(v) => updateFormData("domainRegistrar", v)}>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select registrar" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="godaddy">GoDaddy</SelectItem>
                              <SelectItem value="namecheap">Namecheap</SelectItem>
                              <SelectItem value="not-sure">Not sure</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <AnimatePresence>
                          {formData.domainRegistrar === "other" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="domainRegistrarOther">Please specify</Label>
                                <Input
                                  id="domainRegistrarOther"
                                  value={formData.domainRegistrarOther}
                                  onChange={(e) => updateFormData("domainRegistrarOther", e.target.value)}
                                  placeholder="E.g., Google Domains, Cloudflare..."
                                  className="h-12"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <Label>Required Integrations</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Payment processing",
                      "Email marketing",
                      "CRM system",
                      "Social media",
                      "Analytics",
                      "Live chat",
                      "Booking / Calendar",
                      "Inventory management",
                      "Shipping / Logistics",
                    ].map((integration) => (
                      <div
                        key={integration}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={`int-${integration}`}
                          checked={formData.integrations.includes(integration)}
                          onCheckedChange={() => toggleArrayItem("integrations", integration)}
                        />
                        <Label htmlFor={`int-${integration}`} className="font-normal cursor-pointer text-sm flex-1">
                          {integration}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherIntegrations">Other integrations?</Label>
                  <Input
                    id="otherIntegrations"
                    value={formData.otherIntegrations}
                    onChange={(e) => updateFormData("otherIntegrations", e.target.value)}
                    placeholder="E.g., Specific software, APIs..."
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Special Features Needed</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "User accounts / Login",
                      "Search functionality",
                      "Multi-language",
                      "Blog / News section",
                      "E-commerce / Store",
                      "Forms / Surveys",
                      "Maps / Location",
                      "Video / Media gallery",
                      "Members-only area",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={`feat-${feature}`}
                          checked={formData.features.includes(feature)}
                          onCheckedChange={() => toggleArrayItem("features", feature)}
                        />
                        <Label htmlFor={`feat-${feature}`} className="font-normal cursor-pointer text-sm flex-1">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherFeatures">Other features?</Label>
                  <Input
                    id="otherFeatures"
                    value={formData.otherFeatures}
                    onChange={(e) => updateFormData("otherFeatures", e.target.value)}
                    placeholder="Describe any other features..."
                    className="h-12"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Timeline & Budget */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Timeline & Budget</h2>
                  <p className="text-muted-foreground">Project scope and investment</p>
                </div>
                <div className={`space-y-3 ${hasError("budget") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Budget Range *</Label>
                  <RadioGroup
                    value={formData.budget}
                    onValueChange={(v) => updateFormData("budget", v)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "not-sure", label: "Not sure yet" },
                      { value: "0-500", label: "$0 - $500" },
                      { value: "500-1000", label: "$500 - $1,000" },
                      { value: "1000-2500", label: "$1,000 - $2,500" },
                      { value: "2500+", label: "$2,500+" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <RadioGroupItem value={option.value} id={`budget-${option.value}`} />
                        <Label htmlFor={`budget-${option.value}`} className="font-normal cursor-pointer flex-1">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className={`space-y-3 ${hasError("timeline") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label>Desired Timeline *</Label>
                  <RadioGroup
                    value={formData.timeline}
                    onValueChange={(v) => updateFormData("timeline", v)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "asap", label: "ASAP (Rush project)" },
                      { value: "1-2-weeks", label: "1-2 weeks" },
                      { value: "2-4-weeks", label: "2-4 weeks" },
                      { value: "1-2-months", label: "1-2 months" },
                      { value: "2-3-months", label: "2-3 months" },
                      { value: "flexible", label: "Flexible / No rush" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <RadioGroupItem value={option.value} id={`timeline-${option.value}`} />
                        <Label htmlFor={`timeline-${option.value}`} className="font-normal cursor-pointer flex-1">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="launchDate">Target Launch Date</Label>
                  <div className="flex flex-col gap-2">
                    <Input
                      id="launchDate"
                      type="date"
                      value={formData.launchDate === "Not sure yet" ? "" : formData.launchDate}
                      onChange={(e) => updateFormData("launchDate", e.target.value)}
                      className="h-12"
                      disabled={formData.launchDate === "Not sure yet"}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="launch-not-sure"
                        checked={formData.launchDate === "Not sure yet"}
                        onCheckedChange={(checked) =>
                          updateFormData("launchDate", checked ? "Not sure yet" : "")
                        }
                      />
                      <Label htmlFor="launch-not-sure" className="font-normal text-sm cursor-pointer text-muted-foreground">
                        Not sure yet
                      </Label>
                    </div>
                  </div>
                </div>
                <div className={`space-y-2 ${hasError("howDidYouHear") ? "ring-2 ring-destructive/50 rounded-lg p-3 -m-3" : ""}`}>
                  <Label htmlFor="howDidYouHear">How did you hear about us? *</Label>
                  <Select value={formData.howDidYouHear} onValueChange={(v) => updateFormData("howDidYouHear", v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="google">Google Search</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="portfolio">Saw our work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Anything else we should know?</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => updateFormData("additionalNotes", e.target.value)}
                    placeholder="Special requirements, concerns, questions..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft size={18} />
                Previous
              </Button>
              {currentStep < steps.length ? (
                <Button variant="hero" onClick={nextStep} className="gap-2">
                  Next Step
                  <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? "Submitting..." : "Submit Project Request"}
                  <Check size={18} />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default WebsiteOnboarding;
