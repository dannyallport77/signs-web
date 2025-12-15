import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/auth/forgot-password
 * Send password reset email using Resend
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link",
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send email with reset link using Resend
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@review-signs.co.uk",
        to: email,
        subject: "Signs NFC - Reset Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666;">You requested a password reset for your Signs NFC account.</p>
            <p style="color: #666;">Click the link below to reset your password (valid for 1 hour):</p>
            <div style="margin: 20px 0;">
              <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">Or copy this link: <br/><code>${resetLink}</code></p>
            <p style="color: #666;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px;">
            <p style="color: #999; font-size: 12px;">© 2025 Signs NFC Writer</p>
          </div>
        `,
      });
      console.log(`✓ Email sent successfully to ${email}`);
    } catch (emailError) {
      console.error("Resend email error:", emailError);
      console.error("Email error details:", {
        apiKey: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
        fromEmail: process.env.RESEND_FROM_EMAIL,
        toEmail: email,
        errorMessage: emailError instanceof Error ? emailError.message : String(emailError),
      });
      // Clear the reset token if email sending fails
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      throw emailError;
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset" },
      { status: 500 }
    );
  }
}
