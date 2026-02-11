import { AuthLayout as AuthLayoutComponent } from '@/components/layouts/auth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutComponent>{children}</AuthLayoutComponent>;
}
