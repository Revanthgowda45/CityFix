import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useReports } from '@/contexts/ReportContext';
import ReportList from '@/components/ReportList';
import { AlertTriangle, Map, BarChart2, ArrowRight } from 'lucide-react';

const Index = () => {
  const { reports } = useReports();
  
  // Get 3 most recent reports
  const recentReports = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-urban-500 py-16 md:py-24 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Report Urban Issues, Improve Your Community
            </h1>
            <p className="text-lg md:text-xl mb-8 text-urban-100">
              See a problem in your city? Report it in seconds and help make your community better.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-urban-800 hover:bg-urban-100">
                <Link to="/report">Report an Issue</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-urban-600 text-urban-600 hover:bg-urban-600 hover:text-white transition-colors">
                <Link to="/map">View Issues Map</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-urban-100 text-urban-600 mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Report Issues</h3>
              <p className="text-muted-foreground">
                Spotted a pothole, broken streetlight, or other issue? Report it with photo and location in seconds.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-urban-100 text-urban-600 mb-4">
                <Map size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track on Map</h3>
              <p className="text-muted-foreground">
                See all reported issues on an interactive map and follow updates as they're addressed.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-urban-100 text-urban-600 mb-4">
                <BarChart2 size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Updates</h3>
              <p className="text-muted-foreground">
                Receive notifications as issues are acknowledged, worked on, and resolved by local authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recent Reports</h2>
            <Button variant="ghost" asChild>
              <Link to="/map" className="flex items-center gap-2">
                View All <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <ReportList 
            reports={recentReports} 
            title="" 
            emptyMessage="No reports yet. Be the first to report an issue!"
          />
        </div>
      </section>
    </>
  );
};

export default Index;
