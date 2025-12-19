import { Montserrat, Open_Sans } from "next/font/google";
import "./global.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "SkillPilot MVP",
  description: "Tu plataforma de aprendizaje personalizado",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${openSans.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <main>
            <Navbar />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
