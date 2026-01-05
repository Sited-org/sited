import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Captcha } from "@/components/Captcha";
import { useSecureLeadSubmission } from "@/hooks/useSecureLeadSubmission";

const steps = [
  { id: 1, title: "Contact Info" },
  { id: 2, title: "Business Details" },
  { id: 3, title: "Current Systems" },
  { id: 4, title: "AI Goals" },
  { id: 5, title: "Budget & Timeline" },
];

const AIOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { isSubmitting, captchaVerified, handleCaptchaVerify, savePartialLead, updatePartialLead, submitLead } = useSecureLeadSubmission();
  const [formData, setFormData] = useState({
    // Contact Info
    fullName: "",
    email: "",
    phone: "",
    preferredContact: "email",
    timezone: "",
    role: "",

    // Business Details
    businessName: "",
    industry: "",
    companySize: "",
    businessDescription: "",
    currentChallenges: "",

    // Current Systems
    existingSoftware: "",
    dataManagement: "",
    currentAutomation: "",
    integrationNeeds: [] as string[],
    technicalTeam: "no",
    technicalDetails: "",

    // AI Goals
    primaryGoals: [] as string[],
    specificUseCases: "",
    aiFeatures: [] as string[],
    expectedOutcomes: "",

    // Budget & Timeline
    budget: "",
    timeline: "",
    priority: "",
    decisionMakers: "",
    previousAIExperience: "no",
    previousDetails: "",
    additionalNotes: "",
    howDidYouHear: "",
  });

  // Pre-fill from chatbot data
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
        }));
        sessionStorage.removeItem("chatbotInfo");
      } catch (e) {
        console.error("Failed to parse chatbot info", e);
      }
    }
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setFormData((prev) => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      if (currentArray.includes(item)) {
        return { ...prev, [field]: currentArray.filter((i) => i !== item) };
      }
      return { ...prev, [field]: [...currentArray, item] };
    });
  };

  const nextStep = async () => {
    // Save partial lead after contact info step
    if (currentStep === 1 && formData.fullName && formData.email) {
      await savePartialLead({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        project_type: 'ai',
      });
    } else if (currentStep > 1 && currentStep < steps.length) {
      // Update partial lead with accumulated form data at each subsequent step
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    const success = await submitLead({
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone || null,
      business_name: formData.businessName || null,
      project_type: "ai",
      form_data: formData,
    });

    if (success) {
      toast.success("Your AI integration request has been submitted! We'll be in touch within 24 hours.");
    }
  };

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
                <Sparkles size={24} className="text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">AI Integration Onboarding</h1>
                <p className="text-muted-foreground">Automate and enhance your business with AI</p>
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
                      className="h-12"
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
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Select value={formData.role} onValueChange={(v) => updateFormData("role", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="founder">Founder / CEO</SelectItem>
                        <SelectItem value="cto">CTO / Technical Lead</SelectItem>
                        <SelectItem value="operations">Operations Manager</SelectItem>
                        <SelectItem value="marketing">Marketing Director</SelectItem>
                        <SelectItem value="business">Business Owner</SelectItem>
                        <SelectItem value="it">IT Manager</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Your Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(v) => updateFormData("timezone", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                        <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                        <SelectItem value="cst">Central Time (CST)</SelectItem>
                        <SelectItem value="est">Eastern Time (EST)</SelectItem>
                        <SelectItem value="gmt">GMT (London)</SelectItem>
                        <SelectItem value="cet">Central European Time</SelectItem>
                        <SelectItem value="aest">Australian Eastern Time</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Preferred Contact Method *</Label>
                  <RadioGroup
                    value={formData.preferredContact}
                    onValueChange={(v) => updateFormData("preferredContact", v)}
                    className="flex flex-wrap gap-4"
                  >
                    {["Email", "Phone", "Video Call", "Slack/Discord"].map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <RadioGroupItem value={method.toLowerCase().replace("/", "-")} id={method} />
                        <Label htmlFor={method} className="font-normal cursor-pointer">
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
                  <p className="text-muted-foreground">Tell us about your company</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Company Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateFormData("businessName", e.target.value)}
                      placeholder="Your Company Name"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select value={formData.industry} onValueChange={(v) => updateFormData("industry", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail / E-commerce</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance / Insurance</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="professional">Professional Services</SelectItem>
                        <SelectItem value="hospitality">Hospitality / Food Service</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="logistics">Logistics / Transportation</SelectItem>
                        <SelectItem value="education">Education / Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size *</Label>
                    <Select value={formData.companySize} onValueChange={(v) => updateFormData("companySize", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description *</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => updateFormData("businessDescription", e.target.value)}
                    placeholder="Describe what your business does, your main products/services, and who your customers are..."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentChallenges">Current Business Challenges *</Label>
                  <Textarea
                    id="currentChallenges"
                    value={formData.currentChallenges}
                    onChange={(e) => updateFormData("currentChallenges", e.target.value)}
                    placeholder="What are the biggest operational challenges or bottlenecks in your business right now?"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Current Systems */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Current Systems & Technology</h2>
                  <p className="text-muted-foreground">Help us understand your current setup</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="existingSoftware">Existing Software & Tools *</Label>
                  <Textarea
                    id="existingSoftware"
                    value={formData.existingSoftware}
                    onChange={(e) => updateFormData("existingSoftware", e.target.value)}
                    placeholder="List the main software tools you currently use (CRM, accounting, communication, project management, etc.)"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataManagement">Data Management</Label>
                  <Textarea
                    id="dataManagement"
                    value={formData.dataManagement}
                    onChange={(e) => updateFormData("dataManagement", e.target.value)}
                    placeholder="How do you currently manage and store business data? (spreadsheets, databases, cloud storage, etc.)"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentAutomation">Current Automation</Label>
                  <Textarea
                    id="currentAutomation"
                    value={formData.currentAutomation}
                    onChange={(e) => updateFormData("currentAutomation", e.target.value)}
                    placeholder="Are there any processes you've already automated? If so, describe them."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Integration Requirements</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "CRM (Salesforce, HubSpot)",
                      "Email (Gmail, Outlook)",
                      "Slack / Teams",
                      "Website / E-commerce",
                      "Accounting Software",
                      "Custom Database",
                      "Social Media",
                      "Phone Systems",
                      "Other APIs",
                    ].map((integration) => (
                      <div key={integration} className="flex items-center space-x-2">
                        <Checkbox
                          id={integration}
                          checked={formData.integrationNeeds.includes(integration)}
                          onCheckedChange={() => toggleArrayItem("integrationNeeds", integration)}
                        />
                        <Label htmlFor={integration} className="font-normal cursor-pointer text-sm">
                          {integration}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Do you have in-house technical support?</Label>
                  <RadioGroup
                    value={formData.technicalTeam}
                    onValueChange={(v) => updateFormData("technicalTeam", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="tech-yes" />
                      <Label htmlFor="tech-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="tech-no" />
                      <Label htmlFor="tech-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="outsourced" id="tech-outsourced" />
                      <Label htmlFor="tech-outsourced" className="font-normal cursor-pointer">Outsourced IT</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 4: AI Goals */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">AI Integration Goals</h2>
                  <p className="text-muted-foreground">What do you want AI to help with?</p>
                </div>
                <div className="space-y-3">
                  <Label>Primary Goals (select all that apply) *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Reduce manual/repetitive tasks",
                      "Improve customer service",
                      "Faster response times",
                      "Better data insights",
                      "Cost reduction",
                      "Scale operations",
                      "Reduce human errors",
                      "24/7 availability",
                    ].map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={goal}
                          checked={formData.primaryGoals.includes(goal)}
                          onCheckedChange={() => toggleArrayItem("primaryGoals", goal)}
                        />
                        <Label htmlFor={goal} className="font-normal cursor-pointer">
                          {goal}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>AI Features You're Interested In *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "AI Chatbot for customers",
                      "Internal AI assistant",
                      "Email automation",
                      "Document processing",
                      "Data analysis & reporting",
                      "Lead qualification",
                      "Appointment scheduling",
                      "Inventory management",
                      "Content generation",
                      "Voice AI / Phone bots",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature}
                          checked={formData.aiFeatures.includes(feature)}
                          onCheckedChange={() => toggleArrayItem("aiFeatures", feature)}
                        />
                        <Label htmlFor={feature} className="font-normal cursor-pointer">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specificUseCases">Specific Use Cases *</Label>
                  <Textarea
                    id="specificUseCases"
                    value={formData.specificUseCases}
                    onChange={(e) => updateFormData("specificUseCases", e.target.value)}
                    placeholder="Describe specific tasks or processes you'd like AI to handle. Be as detailed as possible."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedOutcomes">Expected Outcomes</Label>
                  <Textarea
                    id="expectedOutcomes"
                    value={formData.expectedOutcomes}
                    onChange={(e) => updateFormData("expectedOutcomes", e.target.value)}
                    placeholder="What does success look like? (e.g., 'Handle 50% of customer inquiries automatically', 'Reduce data entry time by 80%')"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Budget & Timeline */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Budget & Timeline</h2>
                  <p className="text-muted-foreground">Help us understand your constraints</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget Range *</Label>
                    <Select value={formData.budget} onValueChange={(v) => updateFormData("budget", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                        <SelectItem value="10k-20k">$10,000 - $20,000</SelectItem>
                        <SelectItem value="20k-50k">$20,000 - $50,000</SelectItem>
                        <SelectItem value="50k+">$50,000+</SelectItem>
                        <SelectItem value="not-sure">Not sure yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Desired Timeline *</Label>
                    <Select value={formData.timeline} onValueChange={(v) => updateFormData("timeline", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asap">As soon as possible</SelectItem>
                        <SelectItem value="1-2-months">1-2 months</SelectItem>
                        <SelectItem value="3-6-months">3-6 months</SelectItem>
                        <SelectItem value="6-12-months">6-12 months</SelectItem>
                        <SelectItem value="planning">Just planning for now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={formData.priority} onValueChange={(v) => updateFormData("priority", v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical - Top business priority</SelectItem>
                        <SelectItem value="high">High - Important initiative</SelectItem>
                        <SelectItem value="medium">Medium - One of several projects</SelectItem>
                        <SelectItem value="exploratory">Exploratory - Researching options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="decisionMakers">Who are the decision makers?</Label>
                    <Input
                      id="decisionMakers"
                      value={formData.decisionMakers}
                      onChange={(e) => updateFormData("decisionMakers", e.target.value)}
                      placeholder="Titles/roles of people involved in the decision"
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Have you implemented AI solutions before?</Label>
                  <RadioGroup
                    value={formData.previousAIExperience}
                    onValueChange={(v) => updateFormData("previousAIExperience", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="ai-yes" />
                      <Label htmlFor="ai-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="ai-no" />
                      <Label htmlFor="ai-no" className="font-normal cursor-pointer">No, this is our first</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="basic" id="ai-basic" />
                      <Label htmlFor="ai-basic" className="font-normal cursor-pointer">Basic tools (ChatGPT, etc.)</Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.previousAIExperience === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="previousDetails">Tell us about your previous AI experience</Label>
                    <Textarea
                      id="previousDetails"
                      value={formData.previousDetails}
                      onChange={(e) => updateFormData("previousDetails", e.target.value)}
                      placeholder="What worked? What didn't? Any lessons learned?"
                      className="min-h-[80px]"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => updateFormData("additionalNotes", e.target.value)}
                    placeholder="Anything else we should know about your project or requirements?"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="howDidYouHear">How did you hear about us?</Label>
                  <Select value={formData.howDidYouHear} onValueChange={(v) => updateFormData("howDidYouHear", v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Search</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Captcha on last step */}
            {currentStep === steps.length && (
              <div className="mt-6">
                <Captcha onVerify={handleCaptchaVerify} />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              {currentStep < steps.length ? (
                <Button onClick={nextStep} className="gap-2">
                  Continue
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting || !captchaVerified} className="gap-2">
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                  {!isSubmitting && <Check size={16} />}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AIOnboarding;