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
import { ArrowLeft, ArrowRight, Check, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { GoogleRecaptcha } from "@/components/GoogleRecaptcha";
import { useSecureLeadSubmission } from "@/hooks/useSecureLeadSubmission";

const steps = [
  { id: 1, title: "Contact Info" },
  { id: 2, title: "Business Details" },
  { id: 3, title: "App Concept" },
  { id: 4, title: "Features & Functionality" },
  { id: 5, title: "Design & UX" },
  { id: 6, title: "Technical & Budget" },
];

const AppOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { isSubmitting, captchaVerified, handleRecaptchaVerify, savePartialLead, updatePartialLead, submitLead } = useSecureLeadSubmission();
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
    businessDescription: "",
    targetAudience: "",
    competitorApps: "",

    // App Concept
    appName: "",
    appDescription: "",
    problemSolved: "",
    platforms: [] as string[],
    appType: "",
    targetUsers: "",
    userPersonas: "",

    // Features & Functionality
    coreFeatures: "",
    mustHaveFeatures: [] as string[],
    authMethods: [] as string[],
    userRoles: "",
    notifications: [] as string[],
    offlineMode: "no",
    dataSync: "",
    thirdPartyIntegrations: "",
    paymentFeatures: [] as string[],
    socialFeatures: [] as string[],

    // Design & UX
    existingBranding: "no",
    brandAssets: "",
    designStyle: "",
    colorPreferences: "",
    appInspirations: "",
    accessibilityRequirements: "",
    animationLevel: "",

    // Technical & Budget
    existingBackend: "no",
    backendDetails: "",
    dataStorage: "",
    securityRequirements: [] as string[],
    analyticsNeeds: "",
    scalabilityExpectations: "",
    maintenancePlan: "",
    budget: "",
    timeline: "",
    launchDate: "",
    mvpInterest: "yes",
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
        project_type: 'app',
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
      project_type: "app",
      form_data: formData,
    });

    if (success) {
      toast.success("Your app project request has been submitted! We'll be in touch within 24 hours.");
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
                <Smartphone size={24} className="text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">Mobile App Project Onboarding</h1>
                <p className="text-muted-foreground">Tell us everything about your app idea</p>
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
                      className={`hidden sm:block w-12 md:w-20 lg:w-28 h-0.5 mx-2 transition-colors ${
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
                        <SelectItem value="product">Product Manager</SelectItem>
                        <SelectItem value="technical">Technical Lead</SelectItem>
                        <SelectItem value="marketing">Marketing / Growth</SelectItem>
                        <SelectItem value="business">Business Owner</SelectItem>
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
                  <p className="text-muted-foreground">Tell us about your business</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Company / Business Name *</Label>
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
                        <SelectItem value="fintech">Fintech / Finance</SelectItem>
                        <SelectItem value="healthtech">Healthtech / Healthcare</SelectItem>
                        <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                        <SelectItem value="edtech">EdTech / Education</SelectItem>
                        <SelectItem value="foodtech">FoodTech / Delivery</SelectItem>
                        <SelectItem value="fitness">Fitness / Wellness</SelectItem>
                        <SelectItem value="travel">Travel / Hospitality</SelectItem>
                        <SelectItem value="social">Social / Entertainment</SelectItem>
                        <SelectItem value="productivity">Productivity / Business</SelectItem>
                        <SelectItem value="iot">IoT / Hardware</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                    placeholder="Describe what your business does and your current products/services..."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Textarea
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => updateFormData("targetAudience", e.target.value)}
                    placeholder="Who are your ideal users? Demographics, behaviors, pain points..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competitorApps">Competitor Apps</Label>
                  <Textarea
                    id="competitorApps"
                    value={formData.competitorApps}
                    onChange={(e) => updateFormData("competitorApps", e.target.value)}
                    placeholder="List similar apps in the market and what you like/dislike about them..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: App Concept */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">App Concept</h2>
                  <p className="text-muted-foreground">Describe your app idea</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="appName">App Name (if decided)</Label>
                    <Input
                      id="appName"
                      value={formData.appName}
                      onChange={(e) => updateFormData("appName", e.target.value)}
                      placeholder="Your App Name"
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appDescription">App Description *</Label>
                  <Textarea
                    id="appDescription"
                    value={formData.appDescription}
                    onChange={(e) => updateFormData("appDescription", e.target.value)}
                    placeholder="Describe your app in detail. What is it? What does it do? Explain as if to someone who knows nothing about it..."
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="problemSolved">What problem does it solve? *</Label>
                  <Textarea
                    id="problemSolved"
                    value={formData.problemSolved}
                    onChange={(e) => updateFormData("problemSolved", e.target.value)}
                    placeholder="What pain point or need does your app address? Why would users want it?"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Target Platforms *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["iOS (iPhone)", "iOS (iPad)", "Android Phone", "Android Tablet", "Web App", "Apple Watch", "Wear OS"].map((platform) => (
                      <div
                        key={platform}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={platform}
                          checked={formData.platforms.includes(platform)}
                          onCheckedChange={() => toggleArrayItem("platforms", platform)}
                        />
                        <Label htmlFor={platform} className="font-normal cursor-pointer text-sm flex-1">
                          {platform}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>App Type *</Label>
                  <RadioGroup
                    value={formData.appType}
                    onValueChange={(v) => updateFormData("appType", v)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "consumer", label: "Consumer (B2C)" },
                      { value: "business", label: "Business (B2B)" },
                      { value: "internal", label: "Internal / Enterprise" },
                      { value: "marketplace", label: "Marketplace (multi-sided)" },
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
                <div className="space-y-2">
                  <Label htmlFor="userPersonas">User Personas</Label>
                  <Textarea
                    id="userPersonas"
                    value={formData.userPersonas}
                    onChange={(e) => updateFormData("userPersonas", e.target.value)}
                    placeholder="Describe 2-3 typical users. Who are they? What's their day like? How would they use your app?"
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Features & Functionality */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Features & Functionality</h2>
                  <p className="text-muted-foreground">What should your app do?</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coreFeatures">Core Features *</Label>
                  <Textarea
                    id="coreFeatures"
                    value={formData.coreFeatures}
                    onChange={(e) => updateFormData("coreFeatures", e.target.value)}
                    placeholder="List the main features your app must have. Be as detailed as possible. What can users do? What are the key user flows?"
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Must-Have Features</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "User profiles",
                      "Search / Discovery",
                      "Messaging / Chat",
                      "Media upload (photos/videos)",
                      "Location / Maps",
                      "Calendar / Scheduling",
                      "Reviews / Ratings",
                      "Wishlist / Favorites",
                      "Activity feed / Timeline",
                      "Dashboard / Analytics",
                      "Settings / Preferences",
                      "Help / Support",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={feature}
                          checked={formData.mustHaveFeatures.includes(feature)}
                          onCheckedChange={() => toggleArrayItem("mustHaveFeatures", feature)}
                        />
                        <Label htmlFor={feature} className="font-normal cursor-pointer text-sm flex-1">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Authentication Methods *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Email & Password",
                      "Phone / SMS",
                      "Apple Sign-In",
                      "Google Sign-In",
                      "Facebook Login",
                      "Biometric (Face/Touch ID)",
                      "Magic Link",
                      "SSO / Enterprise",
                    ].map((auth) => (
                      <div
                        key={auth}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={auth}
                          checked={formData.authMethods.includes(auth)}
                          onCheckedChange={() => toggleArrayItem("authMethods", auth)}
                        />
                        <Label htmlFor={auth} className="font-normal cursor-pointer text-sm flex-1">
                          {auth}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRoles">User Roles / Types</Label>
                  <Textarea
                    id="userRoles"
                    value={formData.userRoles}
                    onChange={(e) => updateFormData("userRoles", e.target.value)}
                    placeholder="E.g., Admin, Regular User, Premium User, Vendor, Driver, etc. Describe what each role can do..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Notification Types</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Push notifications", "Email notifications", "SMS notifications", "In-app notifications", "Scheduled reminders"].map(
                      (notif) => (
                        <div
                          key={notif}
                          className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                        >
                          <Checkbox
                            id={notif}
                            checked={formData.notifications.includes(notif)}
                            onCheckedChange={() => toggleArrayItem("notifications", notif)}
                          />
                          <Label htmlFor={notif} className="font-normal cursor-pointer text-sm flex-1">
                            {notif}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Offline Mode Required?</Label>
                  <RadioGroup
                    value={formData.offlineMode}
                    onValueChange={(v) => updateFormData("offlineMode", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="offline-yes" />
                      <Label htmlFor="offline-yes" className="font-normal cursor-pointer">
                        Yes, must work offline
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="offline-partial" />
                      <Label htmlFor="offline-partial" className="font-normal cursor-pointer">
                        Partially (some features)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="offline-no" />
                      <Label htmlFor="offline-no" className="font-normal cursor-pointer">
                        No, always online
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdPartyIntegrations">Third-Party Integrations</Label>
                  <Textarea
                    id="thirdPartyIntegrations"
                    value={formData.thirdPartyIntegrations}
                    onChange={(e) => updateFormData("thirdPartyIntegrations", e.target.value)}
                    placeholder="E.g., Stripe, Twilio, Google Maps, Firebase, Zapier, specific CRMs, ERPs, etc."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Payment Features</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "In-app purchases",
                      "Subscriptions",
                      "One-time payments",
                      "Marketplace payments",
                      "Wallet / Credits",
                      "Tips / Donations",
                    ].map((payment) => (
                      <div
                        key={payment}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={payment}
                          checked={formData.paymentFeatures.includes(payment)}
                          onCheckedChange={() => toggleArrayItem("paymentFeatures", payment)}
                        />
                        <Label htmlFor={payment} className="font-normal cursor-pointer text-sm flex-1">
                          {payment}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Social Features</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Follow / Friends", "Likes / Reactions", "Comments", "Share to social", "Leaderboards", "Groups / Communities"].map(
                      (social) => (
                        <div
                          key={social}
                          className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                        >
                          <Checkbox
                            id={social}
                            checked={formData.socialFeatures.includes(social)}
                            onCheckedChange={() => toggleArrayItem("socialFeatures", social)}
                          />
                          <Label htmlFor={social} className="font-normal cursor-pointer text-sm flex-1">
                            {social}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Design & UX */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Design & User Experience</h2>
                  <p className="text-muted-foreground">Visual style and UX preferences</p>
                </div>
                <div className="space-y-3">
                  <Label>Do you have existing branding?</Label>
                  <RadioGroup
                    value={formData.existingBranding}
                    onValueChange={(v) => updateFormData("existingBranding", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes-complete" id="brand-complete" />
                      <Label htmlFor="brand-complete" className="font-normal cursor-pointer">
                        Yes, complete brand kit
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes-partial" id="brand-partial" />
                      <Label htmlFor="brand-partial" className="font-normal cursor-pointer">
                        Partially (logo only)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="brand-no" />
                      <Label htmlFor="brand-no" className="font-normal cursor-pointer">
                        No, need branding
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.existingBranding !== "no" && (
                  <div className="space-y-2">
                    <Label htmlFor="brandAssets">Brand Assets Details</Label>
                    <Textarea
                      id="brandAssets"
                      value={formData.brandAssets}
                      onChange={(e) => updateFormData("brandAssets", e.target.value)}
                      placeholder="Describe your brand colors, fonts, logo, and any style guides you have..."
                      className="min-h-[100px]"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <Label>Design Style Preference *</Label>
                  <RadioGroup
                    value={formData.designStyle}
                    onValueChange={(v) => updateFormData("designStyle", v)}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {[
                      "Minimal & Clean",
                      "Bold & Vibrant",
                      "Corporate & Professional",
                      "Playful & Fun",
                      "Premium & Luxurious",
                      "Dark Mode First",
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
                  <Label htmlFor="colorPreferences">Color Preferences</Label>
                  <Input
                    id="colorPreferences"
                    value={formData.colorPreferences}
                    onChange={(e) => updateFormData("colorPreferences", e.target.value)}
                    placeholder="E.g., Blues and whites, Earth tones, Neon accents..."
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appInspirations">Apps You Admire (for inspiration)</Label>
                  <Textarea
                    id="appInspirations"
                    value={formData.appInspirations}
                    onChange={(e) => updateFormData("appInspirations", e.target.value)}
                    placeholder="List 2-5 apps with great UX/UI that you like. What specifically do you admire about them?"
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Animation Level</Label>
                  <RadioGroup
                    value={formData.animationLevel}
                    onValueChange={(v) => updateFormData("animationLevel", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="minimal" id="anim-minimal" />
                      <Label htmlFor="anim-minimal" className="font-normal cursor-pointer">
                        Minimal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="anim-moderate" />
                      <Label htmlFor="anim-moderate" className="font-normal cursor-pointer">
                        Moderate (subtle transitions)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rich" id="anim-rich" />
                      <Label htmlFor="anim-rich" className="font-normal cursor-pointer">
                        Rich (delightful animations)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessibilityRequirements">Accessibility Requirements</Label>
                  <Textarea
                    id="accessibilityRequirements"
                    value={formData.accessibilityRequirements}
                    onChange={(e) => updateFormData("accessibilityRequirements", e.target.value)}
                    placeholder="Any specific accessibility needs? E.g., VoiceOver support, high contrast mode, larger text options..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Technical & Budget */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Technical Requirements & Budget</h2>
                  <p className="text-muted-foreground">Infrastructure and investment</p>
                </div>
                <div className="space-y-3">
                  <Label>Do you have an existing backend/API?</Label>
                  <RadioGroup
                    value={formData.existingBackend}
                    onValueChange={(v) => updateFormData("existingBackend", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="backend-yes" />
                      <Label htmlFor="backend-yes" className="font-normal cursor-pointer">
                        Yes, ready to use
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-progress" id="backend-progress" />
                      <Label htmlFor="backend-progress" className="font-normal cursor-pointer">
                        In development
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="backend-no" />
                      <Label htmlFor="backend-no" className="font-normal cursor-pointer">
                        No, need backend built
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {formData.existingBackend !== "no" && (
                  <div className="space-y-2">
                    <Label htmlFor="backendDetails">Backend Details</Label>
                    <Textarea
                      id="backendDetails"
                      value={formData.backendDetails}
                      onChange={(e) => updateFormData("backendDetails", e.target.value)}
                      placeholder="What technology stack? API documentation available? Any limitations we should know?"
                      className="min-h-[80px]"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <Label>Security Requirements</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "HIPAA compliance",
                      "GDPR compliance",
                      "PCI DSS (payments)",
                      "SOC 2 compliance",
                      "Data encryption",
                      "Two-factor auth",
                    ].map((security) => (
                      <div
                        key={security}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-foreground/30 transition-colors"
                      >
                        <Checkbox
                          id={security}
                          checked={formData.securityRequirements.includes(security)}
                          onCheckedChange={() => toggleArrayItem("securityRequirements", security)}
                        />
                        <Label htmlFor={security} className="font-normal cursor-pointer text-sm flex-1">
                          {security}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scalabilityExpectations">Scalability Expectations</Label>
                  <Textarea
                    id="scalabilityExpectations"
                    value={formData.scalabilityExpectations}
                    onChange={(e) => updateFormData("scalabilityExpectations", e.target.value)}
                    placeholder="Expected number of users at launch? Growth projections? Any peak usage patterns?"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Interested in MVP First?</Label>
                  <RadioGroup
                    value={formData.mvpInterest}
                    onValueChange={(v) => updateFormData("mvpInterest", v)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="mvp-yes" />
                      <Label htmlFor="mvp-yes" className="font-normal cursor-pointer">
                        Yes, MVP then iterate
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="mvp-no" />
                      <Label htmlFor="mvp-no" className="font-normal cursor-pointer">
                        No, full product from start
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="discuss" id="mvp-discuss" />
                      <Label htmlFor="mvp-discuss" className="font-normal cursor-pointer">
                        Let's discuss
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Budget Range *</Label>
                  <RadioGroup
                    value={formData.budget}
                    onValueChange={(v) => updateFormData("budget", v)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "10k-25k", label: "$10,000 - $25,000 (MVP)" },
                      { value: "25k-50k", label: "$25,000 - $50,000" },
                      { value: "50k-100k", label: "$50,000 - $100,000" },
                      { value: "100k-250k", label: "$100,000 - $250,000" },
                      { value: "250k+", label: "$250,000+" },
                      { value: "not-sure", label: "Not sure yet" },
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
                <div className="space-y-3">
                  <Label>Desired Timeline *</Label>
                  <RadioGroup
                    value={formData.timeline}
                    onValueChange={(v) => updateFormData("timeline", v)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "1-2-months", label: "1-2 months (MVP only)" },
                      { value: "2-4-months", label: "2-4 months" },
                      { value: "4-6-months", label: "4-6 months" },
                      { value: "6-12-months", label: "6-12 months" },
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
                  <Label htmlFor="launchDate">Target Launch Date (if specific)</Label>
                  <Input
                    id="launchDate"
                    type="date"
                    value={formData.launchDate}
                    onChange={(e) => updateFormData("launchDate", e.target.value)}
                    className="h-12"
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
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="portfolio">Saw our work</SelectItem>
                      <SelectItem value="app-store">App Store</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes or Questions</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => updateFormData("additionalNotes", e.target.value)}
                    placeholder="Anything else we should know? Technical constraints, special requirements, questions for us..."
                    className="min-h-[150px]"
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
                <>
                  <Button
                    variant="hero"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !captchaVerified}
                    className="gap-2"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Project Request"}
                    <Check size={18} />
                  </Button>
                </>
              )}
            </div>
            
            {/* Google reCAPTCHA on last step */}
            {currentStep === steps.length && (
              <div className="mt-6">
                <GoogleRecaptcha onVerify={handleRecaptchaVerify} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AppOnboarding;
