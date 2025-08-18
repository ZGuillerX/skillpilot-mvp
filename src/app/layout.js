import { Montserrat, Open_Sans } from "next/font/google";
import "./global.css";

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
        className={`${montserrat.variable} ${openSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
