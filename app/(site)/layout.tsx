import { redirect } from "next/navigation"
import { FavoritesProvider } from "@/components/favorites-provider"
import { Navbar } from "@/components/navbar"
import { hasSiteSession } from "@/lib/site-session"

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  if (!(await hasSiteSession())) redirect("/login")

  return (
    <FavoritesProvider>
      <Navbar />
      {children}
    </FavoritesProvider>
  )
}
