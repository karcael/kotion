import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createToken, getAuthCookieOptions } from "@/lib/auth"

// Constant bcrypt hash used when no user is found so the response time does not
// reveal whether an email is registered (timing-based user enumeration).
const DUMMY_HASH =
  "$2b$12$K7DvwW522CXGcckgpuzsIOq5RIVL/Zq029kVm0P2tQB8QRLL1jiLW"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gereklidir." },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Run bcrypt.compare even when the user is missing to equalize timing.
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password ?? DUMMY_HASH
    )

    if (!user || !isPasswordValid) {
      return NextResponse.json(
        { error: "Geçersiz e-posta veya şifre." },
        { status: 401 }
      )
    }

    const token = await createToken(user.id, user.email)

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    })

    response.cookies.set(getAuthCookieOptions(token))
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Giriş sırasında bir hata oluştu." },
      { status: 500 }
    )
  }
}
