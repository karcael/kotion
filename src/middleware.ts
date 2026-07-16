import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { getJwtSecret } from "@/lib/jwt-secret"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("kotion-token")?.value
  const isApiRoute = pathname.startsWith("/api")

  // Genel sayfalar - kimlik doğrulama gerekmez
  if (pathname === "/") {
    if (token) {
      try {
        await jwtVerify(token, getJwtSecret())
        return NextResponse.redirect(new URL("/documents", request.url))
      } catch {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Auth sayfaları - giriş yapmış kullanıcıları yönlendir
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      try {
        await jwtVerify(token, getJwtSecret())
        return NextResponse.redirect(new URL("/documents", request.url))
      } catch {
        // Token geçersiz, auth sayfasına devam et
      }
    }
    return NextResponse.next()
  }

  // Auth API rotaları - herkese açık
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Korunan rotalar - kimlik doğrulama gerekli.
  // API rotalarında yönlendirme yerine 401 döndür; aksi halde fetch redirect'i
  // izleyip HTML aldığından istemcideki oturum kontrolü (401) hiç tetiklenmez.
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    await jwtVerify(token, getJwtSecret())
    return NextResponse.next()
  } catch {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Oturum süresi doldu." },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/files).*)"],
}
