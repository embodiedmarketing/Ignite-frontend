import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import ChatWithCoach from "./ChatWithCoach";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Sidebar - shown only on mobile */}
      <div className="lg:hidden">
        <MobileSidebar />
      </div>

      {/* Chat with Coach - Floating button in corner */}
      <ChatWithCoach />
    </div>
  );
}
