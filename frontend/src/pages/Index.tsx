import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, ArrowRight, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Clock,
      title: 'Timed Examinations',
      description: 'Server-tracked timers with automatic submission when time expires',
    },
    {
      icon: Shield,
      title: 'Secure & Auditable',
      description: 'Role-based access control with immutable result storage',
    },
    {
      icon: CheckCircle,
      title: 'Auto-Evaluation',
      description: 'Instant grading for objective questions with detailed results',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track performance with comprehensive analytics dashboard',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <nav className="absolute top-0 left-0 right-0 flex items-center justify-between py-6 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                <GraduationCap className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold text-primary-foreground">ExamPro</span>
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Sign In
            </Button>
          </nav>

          <div className="max-w-3xl mx-auto text-center pt-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-6">
              <span className="text-sm font-medium text-primary-foreground/80">Industry-Grade Assessment Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
              Online Examination
              <span className="block text-gradient mt-2">Made Professional</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
              A production-ready examination system with timed exams, secure authentication, 
              auto-evaluation, and comprehensive result tracking.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-accent border-0 text-accent-foreground h-12 px-8"
                onClick={() => navigate('/auth')}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8"
                onClick={() => navigate('/auth')}
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Built for Scale & Security
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed with real-world assessment requirements in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl border bg-card shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to Transform Your Assessments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join educators and institutions using ExamPro for secure, scalable online examinations.
          </p>
          <Button 
            size="lg" 
            className="gradient-accent border-0 text-accent-foreground h-12 px-8"
            onClick={() => navigate('/auth')}
          >
            Start Free Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-accent" />
            <span className="font-semibold">ExamPro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ExamPro. Industry-grade examination platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
