import nodemailer from 'nodemailer';


const transpoter =nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASSWORD
    }
})
export async function sendForgotPasswordEmail(userEmail, resetToken) {
    const htmlTemplate = `
    <div style="font-family: sans-serif; background-color: #0B0E14; padding: 40px; color: #fff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0F1219; border: 1px solid #333; border-radius: 16px; padding: 30px;">
        <h2 style="color: #10b981; margin-bottom: 20px;">SiloKrate Password Reset</h2>
        <p style="color: #a1a1aa; font-size: 16px;">We received a request to reset the password for your SiloKrate account.</p>
        <div style="margin: 30px 0;">
        <a href="localhost:5173/reset-password/${resetToken}" 
            style="background-color: #10b981; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">
            Reset Password
        </a>
        </div>
        <p style="color: #71717a; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
    </div>
    `;
    try{
        await transpoter.sendMail({
            from:process.env.EMAIL_USER,
            to:userEmail,
            subject:"Reset Password",
            html:htmlTemplate
        })
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}