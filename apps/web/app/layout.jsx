import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "INNO Desk",
  description:
    "Webudgave af INNO – få overblik over kundeservice og integrationer direkte i browseren.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="da">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
