import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-rose-600" />
        </div>
        
        <h1 className="font-serif text-4xl font-bold text-slate-900 mb-3">
          Access Denied
        </h1>
        
        <p className="text-slate-600 text-lg mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
