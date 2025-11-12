import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFoundSimple() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
          <p className="text-xl text-slate-600 mb-6">Page not found</p>
          <p className="text-slate-500">
            The page you're looking for doesn't exist.
          </p>
        </div>
        
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
