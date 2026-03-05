import "@/app/styles/normalize.css";
import "@/app/styles/app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Main from "@/app/components/Main";
import { AuthProvider } from "@/app/providers/AuthProvider";

export const metadata = {
  title: "Next.js 메인 앱",
  description: "Next.js로 만든 앱의 기본 설명입니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script
          src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          defer
        ></script>
      </head>
      <body>
        <AuthProvider>
          <div className="App">
            {/* Header → useAuth 가능 */}
            <Header />

            <main>{children}</main>

            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
