const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse form data
        const formData = new URLSearchParams(event.body);
        const name = formData.get('name');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const projectType = formData.get('projectType');
        const message = formData.get('message');

        // Validate required fields
        if (!name || !email || !phone || !projectType || !message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
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

        // Send email using Resend Node.js SDK
        const { data, error } = await resend.emails.send({
            from: 'DNA Contracting <noreply@dnacontracting.com>',
            to: ['vvalencia@dnacontracting-services.com'],
            subject: `New Contact Form Submission from ${name}`,
            html: emailHtml,
            replyTo: email
        });

        if (error) {
            console.error('Resend error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Failed to send email',
                    details: error.message 
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Email sent successfully',
                emailId: data.id 
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};
