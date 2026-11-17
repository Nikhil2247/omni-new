interface AuthLayoutProps {
  children: React.ReactNode
}

/** Auth pages sit on the shared paper background; each page renders its own centred card. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-[440px]">{children}</div>
    </main>
  )
}
