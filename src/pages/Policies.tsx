import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollReveal } from "@/components/common/ScrollReveal";

const Policies = () => {
  return (
    <Layout>
      <section className="pt-32 pb-20">
        <div className="container-tight">
          <ScrollReveal>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Legal
            </h1>
            <p className="text-muted-foreground mb-8">
              Last updated: January 2025
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <Tabs defaultValue="privacy" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
              </TabsList>

              <TabsContent value="privacy" className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="space-y-8 text-muted-foreground">
                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
                    <p>
                      Sited ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
                      This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                      use our website development services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
                    <p className="mb-3">We may collect information that you provide directly to us, including:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Contact information (name, email address, phone number)</li>
                      <li>Business information (company name, industry, website requirements)</li>
                      <li>Payment information (processed securely through third-party providers)</li>
                      <li>Communications and correspondence with our team</li>
                      <li>Analytics data from websites we build and maintain on your behalf</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
                    <p className="mb-3">We use the information we collect to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Provide, maintain, and improve our services</li>
                      <li>Communicate with you about projects, updates, and support</li>
                      <li>Process payments and send related information</li>
                      <li>Analyse usage patterns to enhance our offerings</li>
                      <li>Comply with legal obligations</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">4. Third-Party Services</h2>
                    <p>
                      We may integrate with third-party services such as Google Analytics, payment processors, and hosting 
                      providers. These services have their own privacy policies, and we encourage you to review them. 
                      We are not responsible for the privacy practices of third-party services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">5. Data Security</h2>
                    <p>
                      We implement reasonable security measures to protect your personal information. However, no method 
                      of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute 
                      security of your data.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">6. Your Rights</h2>
                    <p>
                      Depending on your jurisdiction, you may have certain rights regarding your personal data, including 
                      the right to access, correct, delete, or port your data. To exercise these rights, please contact us 
                      directly.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">7. Changes to This Policy</h2>
                    <p>
                      We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                      the new policy on this page with an updated revision date.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">8. Contact Us</h2>
                    <p>
                      If you have questions about this Privacy Policy, please contact us through our website's contact page.
                    </p>
                  </section>

                  <div className="mt-12 p-4 bg-muted/50 rounded-lg text-sm">
                    <p className="italic">
                      Note: This is a preliminary privacy policy. A comprehensive, legally-reviewed version will be 
                      published in due course.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="terms" className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="space-y-8 text-muted-foreground">
                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
                    <p>
                      By accessing or using Sited's services, you agree to be bound by these Terms and Conditions. 
                      If you do not agree to these terms, please do not use our services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">2. Services</h2>
                    <p>
                      Sited provides website development and related digital services. The specific scope, deliverables, 
                      and timelines for each project will be agreed upon separately between Sited and the client.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">3. Client Responsibilities</h2>
                    <p className="mb-3">As a client, you agree to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Provide accurate and complete information for your project</li>
                      <li>Respond to communications in a timely manner</li>
                      <li>Ensure you have the rights to any content you provide</li>
                      <li>Pay for services as agreed upon</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">4. Intellectual Property</h2>
                    <p>
                      Upon full payment, clients receive ownership of custom work created specifically for their project. 
                      Sited retains the right to use general techniques, knowledge, and non-proprietary elements in future 
                      projects.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">5. Limitation of Liability</h2>
                    <p>
                      To the maximum extent permitted by law, Sited shall not be liable for any indirect, incidental, 
                      special, consequential, or punitive damages, including but not limited to loss of profits, data, 
                      business opportunities, or goodwill, arising out of or related to your use of our services.
                    </p>
                    <p className="mt-3">
                      Our total liability for any claims arising from these terms or our services shall not exceed the 
                      amount paid by you for the specific services giving rise to the claim.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">6. Disclaimer of Warranties</h2>
                    <p>
                      Our services are provided "as is" and "as available" without warranties of any kind, either express 
                      or implied. We do not guarantee that our services will be uninterrupted, error-free, or meet your 
                      specific requirements.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">7. Indemnification</h2>
                    <p>
                      You agree to indemnify and hold Sited harmless from any claims, damages, losses, or expenses 
                      arising from your use of our services, your violation of these terms, or your violation of any 
                      rights of a third party.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">8. Third-Party Services</h2>
                    <p>
                      Our services may integrate with or rely on third-party services (hosting, analytics, payment 
                      processing, etc.). We are not responsible for the availability, accuracy, or reliability of 
                      third-party services, and your use of such services is at your own risk.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">9. Termination</h2>
                    <p>
                      Either party may terminate the service agreement with written notice. Upon termination, you remain 
                      responsible for any outstanding payments for services already rendered.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">10. Governing Law</h2>
                    <p>
                      These terms shall be governed by and construed in accordance with the laws of Australia, without 
                      regard to its conflict of law provisions.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">11. Changes to Terms</h2>
                    <p>
                      We reserve the right to modify these terms at any time. Continued use of our services after changes 
                      constitutes acceptance of the modified terms.
                    </p>
                  </section>

                  <div className="mt-12 p-4 bg-muted/50 rounded-lg text-sm">
                    <p className="italic">
                      Note: These are preliminary terms and conditions. A comprehensive, legally-reviewed version will be 
                      published in due course.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Policies;
