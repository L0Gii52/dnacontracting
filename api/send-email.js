import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse form data
        const { name, email, phone, projectType, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !projectType || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create email content
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #111827; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                    New Contact Form Submission
                </h2>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">Contact Information</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>Project Type:</strong> ${projectType}</p>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">Project Details</h3>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                
                <div style="background: #3b82f6; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0;"><strong>DNA Contracting</strong></p>
                    <p style="margin: 5px 0 0 0;">Licensed General & Electrical Contractor</p>
                    <p style="margin: 5px 0 0 0;">Serving Visalia, Tulare & Hanford</p>
                </div>
            </div>
        `;

        // Send email using Resend
              const { data, error } = await resend.emails.send({
                  from: 'DNA Contracting <onboarding@resend.dev>',
                  to: ['vvalencia@dnacontracting-services.com'],
                  subject: `New Contact Form Submission from ${name}`,
                  html: emailHtml,
                  replyTo: email
              });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ 
                error: 'Failed to send email',
                details: error.message 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Email sent successfully',
            emailId: data.id 
        });

    } catch (error) {
        console.error('Function error:', error);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}
