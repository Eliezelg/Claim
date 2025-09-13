import { MailService } from '@sendgrid/mail';
import { Claim, User, ClaimStatus } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  private readonly fromEmail = process.env.FROM_EMAIL || 'noreply@flightclaim.com';

  async sendClaimSubmittedEmail(user: User, claim: Claim): Promise<boolean> {
    const template = this.getClaimSubmittedTemplate(user, claim);
    return await this.sendEmail(user.email!, template);
  }

  async sendClaimStatusUpdateEmail(user: User, claim: Claim, status: ClaimStatus): Promise<boolean> {
    const template = this.getStatusUpdateTemplate(user, claim, status);
    return await this.sendEmail(user.email!, template);
  }

  async sendClaimApprovedEmail(user: User, claim: Claim, paymentDetails: { gross: number; fee: number; net: number }): Promise<boolean> {
    const template = this.getClaimApprovedTemplate(user, claim, paymentDetails);
    return await this.sendEmail(user.email!, template);
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      await mailService.send({
        to,
        from: this.fromEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  private getClaimSubmittedTemplate(user: User, claim: Claim): EmailTemplate {
    const subject = 'Your Claim Has Been Submitted Successfully';
    
    const text = `
Dear ${user.firstName || 'Valued Customer'},

Thank you for submitting your flight compensation claim. We have received your request and assigned it claim number ${claim.claimNumber}.

Claim Details:
- Flight: ${claim.flightNumber}
- Date: ${claim.flightDate.toLocaleDateString()}
- Estimated Compensation: €${claim.finalCompensationAmount || 'TBD'}
- Processing Time: 2-4 weeks

Our team will now review your documents and begin the process of claiming your compensation from the airline. You will receive regular updates on the progress.

Best regards,
FlightClaim Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .details { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Claim Has Been Submitted!</h1>
        </div>
        <div class="content">
            <p>Dear ${user.firstName || 'Valued Customer'},</p>
            
            <p>Thank you for submitting your flight compensation claim. We have received your request and assigned it claim number <strong>${claim.claimNumber}</strong>.</p>
            
            <div class="details">
                <h4>Claim Details:</h4>
                <ul>
                    <li><strong>Flight:</strong> ${claim.flightNumber}</li>
                    <li><strong>Date:</strong> ${claim.flightDate.toLocaleDateString()}</li>
                    <li><strong>Estimated Compensation:</strong> €${claim.finalCompensationAmount || 'TBD'}</li>
                    <li><strong>Processing Time:</strong> 2-4 weeks</li>
                </ul>
            </div>
            
            <p>Our team will now review your documents and begin the process of claiming your compensation from the airline. You will receive regular updates on the progress.</p>
            
            <a href="${process.env.APP_URL || 'https://flightclaim.com'}/dashboard" class="button">Track Your Claim</a>
            
            <p>Best regards,<br>FlightClaim Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  private getStatusUpdateTemplate(user: User, claim: Claim, status: ClaimStatus): EmailTemplate {
    const statusMessages = {
      UNDER_REVIEW: 'Under Review',
      DOCUMENTING: 'Awaiting Additional Documents',
      NEGOTIATING: 'Negotiating with Airline',
      APPROVED: 'Approved',
      REJECTED: 'Unfortunately Rejected',
      PAID: 'Payment Processed',
    };

    const subject = `Claim Update - ${statusMessages[status] || status}`;
    
    const text = `
Dear ${user.firstName || 'Valued Customer'},

We have an update on your flight compensation claim ${claim.claimNumber}.

Status: ${statusMessages[status] || status}

${this.getStatusDescription(status)}

No action is required from you at this time unless specified above. We will continue to pursue your claim and notify you of any developments.

Best regards,
FlightClaim Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .status-box { background-color: #fef3c7; border: 1px solid: #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Update on Your Claim</h1>
        </div>
        <div class="content">
            <p>Dear ${user.firstName || 'Valued Customer'},</p>
            
            <p>We have an update on your flight compensation claim <strong>${claim.claimNumber}</strong>.</p>
            
            <div class="status-box">
                <h4>Status: ${statusMessages[status] || status}</h4>
                <p>${this.getStatusDescription(status)}</p>
            </div>
            
            <p>No action is required from you at this time unless specified above. We will continue to pursue your claim and notify you of any developments.</p>
            
            <p>Best regards,<br>FlightClaim Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  private getClaimApprovedTemplate(user: User, claim: Claim, paymentDetails: { gross: number; fee: number; net: number }): EmailTemplate {
    const subject = '🎉 Congratulations! Your Claim Was Successful';
    
    const text = `
Dear ${user.firstName || 'Valued Customer'},

Excellent news! We have successfully negotiated your flight compensation claim with the airline.

Payment Details:
- Compensation Amount: €${paymentDetails.gross.toFixed(2)}
- Our Fee (25%): €${paymentDetails.fee.toFixed(2)}
- Your Payment: €${paymentDetails.net.toFixed(2)}
- Expected Transfer: 3-5 business days

The payment will be transferred to your registered bank account within 3-5 business days. You will receive a detailed receipt via email.

Best regards,
FlightClaim Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .payment-details { background-color: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .button-secondary { background-color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Congratulations! Your Claim Was Successful</h1>
        </div>
        <div class="content">
            <p>Dear ${user.firstName || 'Valued Customer'},</p>
            
            <p>Excellent news! We have successfully negotiated your flight compensation claim with the airline.</p>
            
            <div class="payment-details">
                <h4>Payment Details</h4>
                <ul>
                    <li><strong>Compensation Amount:</strong> €${paymentDetails.gross.toFixed(2)}</li>
                    <li><strong>Our Fee (25%):</strong> €${paymentDetails.fee.toFixed(2)}</li>
                    <li><strong>Your Payment:</strong> €${paymentDetails.net.toFixed(2)}</li>
                    <li><strong>Expected Transfer:</strong> 3-5 business days</li>
                </ul>
            </div>
            
            <p>The payment will be transferred to your registered bank account within 3-5 business days. You will receive a detailed receipt via email.</p>
            
            <a href="#" class="button">Download Receipt</a>
            <a href="#" class="button button-secondary">Rate Our Service</a>
            
            <p>Best regards,<br>FlightClaim Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  private getStatusDescription(status: ClaimStatus): string {
    const descriptions = {
      UNDER_REVIEW: 'Our team is reviewing your claim and documentation.',
      DOCUMENTING: 'We may need additional documents from you. Please check your dashboard for details.',
      NEGOTIATING: 'We are actively negotiating with the airline regarding your compensation. Airlines typically respond within 7-14 business days.',
      APPROVED: 'Your claim has been approved! Payment processing will begin shortly.',
      REJECTED: 'Unfortunately, your claim was not successful. You can contact our support team for more details.',
      PAID: 'Your compensation has been processed and should arrive in your account within 3-5 business days.',
    };
    
    return descriptions[status] || 'Your claim status has been updated.';
  }
}

export const emailService = new EmailService();
