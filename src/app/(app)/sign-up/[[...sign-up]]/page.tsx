import { SignUpForm } from "@/lib/auth-kit/components";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header variant="minimal" showAuth={false} />
      <main className="flex-1 flex items-center justify-center py-12">
        <SignUpForm redirectUrl="/dashboard" providers={["google"]} />
      </main>
      <Footer />
    </div>
  );
}
