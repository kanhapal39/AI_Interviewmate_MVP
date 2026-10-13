import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-6 py-24">
        <div className="container-main max-w-4xl text-center">
          <div className="stack-lg">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              AI-Powered Career Preparation
            </div>

            <h1 className="text-display-lg font-bold tracking-tight text-on-surface">
              Your AI Career Copilot
              <br />
              <span className="text-primary">for Interview Readiness</span>
            </h1>

            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Upload your resume, paste a job description, and get a complete
              analysis with compatibility scoring, gap identification, resume
              optimization, and personalized mock interviews.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/auth/signup"
                className="btn-primary w-full sm:w-auto"
              >
                Start Free Analysis
              </Link>
              <Link
                href="/auth/signin"
                className="btn-secondary w-full sm:w-auto"
              >
                Sign In
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-on-surface-variant pt-8">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                14-day free trial
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-surface-container-low">
        <div className="container-main">
          <div className="text-center stack-md mb-16">
            <h2 className="text-headline-lg">Complete Interview Preparation Loop</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              From resume analysis to mock interviews — everything you need to
              land your target role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "📄",
                title: "Resume & JD Analysis",
                description:
                  "Upload your resume and job description. Get structured extraction with evidence-linked matching.",
              },
              {
                icon: "📊",
                title: "ATS Compatibility Score",
                description:
                  "Estimated match score with methodology version, component breakdown, and matched evidence.",
              },
              {
                icon: "🔍",
                title: "Gap Analysis & Optimization",
                description:
                  "Identify missing skills, keywords, and experience. Get AI suggestions with accept/reject/edit controls.",
              },
              {
                icon: "🎯",
                title: "Mock Interviews",
                description:
                  "Personalized questions, text-based mock interviews with server-side state machine, and detailed feedback.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 stack-md hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-shadow"
              >
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="text-title-md font-medium">{feature.title}</h3>
                <p className="text-body-md text-on-surface-variant">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="container-main">
          <div className="text-center stack-md mb-16">
            <h2 className="text-headline-lg">How It Works</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Three steps to interview confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload & Parse",
                description:
                  "Upload your resume (PDF/DOCX) and paste or upload a job description. Our AI extracts structured data with source references.",
              },
              {
                step: "02",
                title: "Analyze & Optimize",
                description:
                  "Get an estimated ATS compatibility score, detailed gap analysis, and AI-powered resume suggestions — all with evidence you can verify.",
              },
              {
                step: "03",
                title: "Practice & Improve",
                description:
                  "Generate personalized interview questions, run text mock interviews, and receive rubric-based feedback with STAR assessment.",
              },
            ].map((step, index) => (
              <div key={index} className="glass-card p-8 stack-md relative">
                <div className="absolute top-6 right-6 text-5xl font-bold text-primary/10">
                  {step.step}
                </div>
                <h3 className="text-title-md font-medium relative z-10">
                  {step.title}
                </h3>
                <p className="text-body-md text-on-surface-variant relative z-10">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-primary text-on-primary">
        <div className="container-main text-center max-w-2xl mx-auto">
          <h2 className="text-headline-lg mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-body-lg opacity-90 mb-8">
            Join thousands of candidates using InterviewMate to prepare with
            confidence.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-primary rounded-xl hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">InterviewMate</h4>
              <p className="text-body-md text-on-surface-variant">
                AI-powered career preparation platform helping candidates
                land their dream roles.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-body-md text-on-surface-variant">
                <li>Resume Analysis</li>
                <li>JD Matching</li>
                <li>Gap Analysis</li>
                <li>Mock Interviews</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-body-md text-on-surface-variant">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Blog</li>
                <li>Career Guides</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-body-md text-on-surface-variant">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-body-sm text-on-surface-variant">
            © 2024 InterviewMate. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}