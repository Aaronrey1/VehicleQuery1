import nodemailer from 'nodemailer';

// Create email transporter using environment variables
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.warn('Email configuration incomplete. Email notifications will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

interface ApprovalEmailData {
  userName: string;
  userEmail: string;
  make: string;
  model: string;
  year: number;
  portType: string;
  deviceType: string;
  confidence: number;
}

export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email transporter not configured, skipping email notification');
    return false;
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Your Vehicle Data Request Has Been Approved!</h2>
      
      <p>Hi ${data.userName},</p>
      
      <p>Great news! Your request for vehicle compatibility data has been approved by our admin team.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Vehicle Information</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Make:</strong></td>
            <td style="padding: 8px 0;">${data.make}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Model:</strong></td>
            <td style="padding: 8px 0;">${data.model}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Year:</strong></td>
            <td style="padding: 8px 0;">${data.year}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Port Type:</strong></td>
            <td style="padding: 8px 0;">${data.portType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Device Type:</strong></td>
            <td style="padding: 8px 0;">${data.deviceType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Confidence:</strong></td>
            <td style="padding: 8px 0;">${data.confidence}%</td>
          </tr>
        </table>
      </div>
      
      <p>This data is now available in our database and can be accessed through VehicleDB Pro.</p>
      
      <p style="margin-top: 30px;">Best regards,<br>
      <strong>VehicleDB Pro Team</strong></p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #6b7280;">
        This is an automated notification from VehicleDB Pro. Please do not reply to this email.
      </p>
    </div>
  `;

  const emailText = `
Your Vehicle Data Request Has Been Approved!

Hi ${data.userName},

Great news! Your request for vehicle compatibility data has been approved by our admin team.

Vehicle Information:
- Make: ${data.make}
- Model: ${data.model}
- Year: ${data.year}
- Port Type: ${data.portType}
- Device Type: ${data.deviceType}
- Confidence: ${data.confidence}%

This data is now available in our database and can be accessed through VehicleDB Pro.

Best regards,
VehicleDB Pro Team

---
This is an automated notification from VehicleDB Pro. Please do not reply to this email.
  `;

  try {
    await transporter.sendMail({
      from: `"VehicleDB Pro" <${fromEmail}>`,
      to: data.userEmail,
      subject: `Vehicle Data Approved - ${data.make} ${data.model} ${data.year}`,
      text: emailText,
      html: emailHtml,
    });
    
    console.log(`Approval email sent successfully to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending approval email:', error);
    return false;
  }
}
