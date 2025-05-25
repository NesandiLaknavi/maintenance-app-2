import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL_USER,
    pass: process.env.NEXT_PUBLIC_EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Enable debug logging
  logger: true, // Enable logger
  connectionTimeout: 10000, // 10 seconds timeout
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
    console.error('Email configuration:', {
      user: process.env.NEXT_PUBLIC_EMAIL_USER,
      pass: process.env.NEXT_PUBLIC_EMAIL_PASSWORD ? '***' : 'not set'
    });
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!process.env.NEXT_PUBLIC_EMAIL_USER || !process.env.NEXT_PUBLIC_EMAIL_PASSWORD) {
      throw new Error('Email configuration is missing. Please check your environment variables.');
    }

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to,
      subject,
      html
    };

    console.log('Attempting to send email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 