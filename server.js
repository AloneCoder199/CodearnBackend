import express from "express";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cors from "cors";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// ============================
// ✅ Middlewares
// ============================
app.use(express.json());
app.use(cors());

// JSON file path
const EMAIL_JSON_PATH = path.join(process.cwd(), "subscribedEmails.json");

// ============================
// 🔹 Helper Functions
// ============================
const readEmails = () => {
  if (!fs.existsSync(EMAIL_JSON_PATH)) {
    fs.writeFileSync(EMAIL_JSON_PATH, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(EMAIL_JSON_PATH, "utf-8");
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveEmail = (email) => {
  const emails = readEmails();
  if (!emails.includes(email)) {
    emails.push(email);
    fs.writeFileSync(EMAIL_JSON_PATH, JSON.stringify(emails, null, 2));
  }
};

// ============================
// 📩 Contact Form Route
// ============================
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email to company inbox
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: subject || "New Contact Form Message",
      html: `
        <div style="font-family: Arial, sans-serif; color: #0D1B2A; background: #FFFFFF; padding: 20px; border-radius: 15px; border:1px solid #eee;">
          <h2 style="color: #00BCD4;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || "N/A"}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        </div>
      `,
    });

    // Auto-reply to user
    await transporter.sendMail({
      from: `"CodEarn Tech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Thanks for contacting CodEarn Tech",
      html: `
        <div style="font-family: Arial, sans-serif; color: #0D1B2A; background: #FFFFFF; padding: 25px; border-radius: 15px; border:1px solid #eee;">
          <h2 style="color: #00BCD4; text-align:center; transition: all 0.3s;">Hi ${name},</h2>
          <p style="text-align:center;">Thank you for reaching out to <strong>CodEarn Tech</strong>. 🙌</p>
          <p style="text-align:center;">We’ve received your message and our team will respond within <strong>24 hours</strong>.</p>
          <div style="text-align:center; margin: 30px 0;">
            <a href="https://codearntech.cloud" 
               style="background: #FF9800; color: white; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; display: inline-block; transition: all 0.3s;">
               🚀 Visit CodEarn Tech
            </a>
          </div>
          <p style="text-align:center;">Best Regards,<br/><strong>CodEarn Tech Team</strong></p>
          <hr style="margin:30px 0;"/>
          <p style="font-size:12px; color:gray; text-align:center;">
            You are receiving this email because you contacted CodEarn Tech.
          </p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("❌ Email Error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ============================
// 📧 Subscribe Route
// ============================
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    saveEmail(email);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"CodEarn Tech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Subscription Confirmed",
      html: `
        <div style="font-family: Arial, sans-serif; color: #0D1B2A; background: #FFFFFF; padding: 25px; border-radius: 15px; border:1px solid #eee;">
          <h2 style="color:#00BCD4; text-align:center;">Hi there!</h2>
          <p style="text-align:center;">Thanks for subscribing to <strong>CodEarn Tech</strong> daily updates. 🚀</p>
          <p style="text-align:center;">You will receive daily emails with the latest news and tutorials. 💡</p>
          <div style="text-align:center; margin-top:25px;">
            <a href="https://codearntech.cloud"
               style="background:#FF9800; color:white; text-decoration:none; padding:12px 25px; border-radius:8px; font-weight:bold; display:inline-block; transition:all 0.3s;">
               🚀 Visit CodEarn Tech
            </a>
          </div>
          <p style="text-align:center; margin-top:20px;">Best Regards,<br/><strong>CodEarn Tech Team</strong></p>
          <hr style="margin:30px 0;"/>
          <p style="font-size:12px; color:gray; text-align:center;">
            You are receiving this email because you subscribed to CodEarn Tech.
          </p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error("❌ Subscribe Error:", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// ============================
// 📅 Daily Update Mail Cron
// ============================
cron.schedule("0 9 * * *", async () => {
  console.log("🚀 Running daily email job...");

  try {
    const emails = readEmails();
    if (emails.length === 0) return console.log("No subscribed emails.");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const email of emails) {
<<<<<<< Updated upstream
      await transporter.sendMail({
        from: `"CodEarn Tech" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🌟 Daily Updates from CodEarn Tech",
        html: `
          <div style="font-family: Arial, sans-serif; color:#0D1B2A; background:#FFFFFF; padding:25px; border-radius:15px; border:1px solid #eee;">
            <h2 style="color:#00BCD4; text-align:center;">Hello Subscriber!</h2>
            <p style="text-align:center;">Here are your daily updates from <strong>CodEarn Tech</strong>. 🚀</p>
            <div style="margin:20px 0; padding:15px; background:#f9f9f9; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); transition:all 0.3s;">
              <ul style="margin-left:20px;">
                <li>💡 Latest MERN stack tutorials</li>
                <li>⚡ Rapid prototyping tips</li>
                <li>🌐 Web development insights</li>
              </ul>
              <div style="text-align:center; margin-top:15px;">
                <a href="https://codearntech.cloud"
                  style="background:#FF9800; color:white; text-decoration:none; padding:12px 25px; border-radius:8px; font-weight:bold; display:inline-block; transition:all 0.3s;">
                  🚀 Visit CodEarn Tech
                </a>
              </div>
            </div>
            <p style="text-align:center; margin-top:20px;">Best Regards,<br/><strong>CodEarn Tech Team</strong></p>
            <hr style="margin:30px 0;"/>
            <p style="font-size:12px; color:gray; text-align:center;">
              You are receiving this email because you subscribed to CodEarn Tech.
            </p>
=======
  await transporter.sendMail({
    from: `"CodEarn Tech" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "💼 Welcome to CodEarn Tech – Certified Developers You Can Trust!",
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; background:#F9FAFB; padding:30px; border-radius:16px; border:1px solid #E0E0E0; color:#0D1B2A;">
        <div style="text-align:center; margin-bottom:20px;">
          <img src="https://yourdomain.com/logo.png" alt="CodEarn Tech" width="120" style="border-radius:50%; margin-bottom:10px;" />
          <h2 style="color:#00BCD4;">👋 Welcome to CodEarn Tech!</h2>
          <p style="font-size:15px; color:#555;">Empowering your ideas with technology, precision, and guaranteed success.</p>
        </div>

        <div style="background:#FFFFFF; border-radius:14px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.08); margin-bottom:25px;">
          <p style="font-size:15px; line-height:1.6;">
            We are a <strong>Professional & Certified Development Team</strong> dedicated to creating
            <span style="color:#00BCD4;">high-quality, fully functional, and scalable projects</span> — built with passion and precision.
          </p>

          <p style="font-size:15px; line-height:1.6;">
            Every project comes with our <strong>Official Work Proof Certificate</strong> 🏅 and a
            <strong>100% Satisfaction Guarantee</strong> ✅ — because your success is our priority!
          </p>

          <div style="background:#F7FBFC; padding:15px; border-radius:12px; margin-top:20px;">
            <h3 style="color:#FF9800; text-align:center;">💡 Our Core Expertise</h3>
            <ul style="margin:15px 0 0 25px; color:#0D1B2A; font-size:14px; line-height:1.8;">
              <li>🌍 Modern & Responsive Website Development</li>
              <li>🛒 Complete Ecommerce Solutions</li>
              <li>📂 Portfolio & Personal Branding Websites</li>
              <li>💭 Custom Web Applications (Tailored to your Idea)</li>
            </ul>
>>>>>>> Stashed changes
          </div>

          <div style="text-align:center; margin-top:25px;">
            <a href="https://yourdomain.com" 
              style="background:linear-gradient(90deg,#00BCD4,#FF9800); color:white; text-decoration:none; padding:12px 28px; border-radius:30px; font-weight:600; box-shadow:0 3px 10px rgba(0,0,0,0.15); transition:all 0.3s;">
              🚀 Explore CodEarn Tech
            </a>
          </div>
        </div>

        <div style="text-align:center; font-size:13px; color:gray;">
          <p>Thanks for being part of our journey. Let's build something amazing together! 💻</p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />
          <p>You are receiving this email because you subscribed to <strong>CodEarn Tech</strong> updates.</p>
        </div>
      </div>
    `,
  });

      console.log(`✅ Sent daily email to: ${email}`);
    }
  } catch (err) {
    console.error("❌ Daily Email Error:", err);
  }
});

// ============================
// 🔗 GitHub Repos Route
// ============================
app.get("/api/repos", async (req, res) => {
  try {
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ GitHub API Error Response:", errText);
      return res.status(response.status).json({ error: "GitHub API error" });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("❌ GitHub API Error (Catch Block):", {
      message: err.message,
      code: err.code || null,
      errno: err.errno || null,
      syscall: err.syscall || null,
    });
    res.status(500).json({ error: "Failed to fetch GitHub repos", details: err.message });
  }
});


// ============================
// 🌐 Dynamic Sitemap Generator
// ============================
app.get("/sitemap.xml", (req, res) => {
  try {
    // Example: Tumhare static pages
    const pages = [
      { url: "/", priority: "1.0" },
      { url: "/about", priority: "0.9" },
      { url: "/services", priority: "0.9" },
      { url: "/articals", priority: "0.8" },
      { url: "/contact", priority: "0.8" },
      { url: "/privacy-policy", priority: "0.6" },
      { url: "/terms", priority: "0.6" },
    ];

    // Agar tumhare paas blog posts DB (MongoDB / JSON) me store hote hain
    // For demo: ek dummy array of posts
    const blogPosts = [
      { slug: "mern-stack-development", updated: "2025-09-25" },
      { slug: "web-hosting-guide", updated: "2025-09-25" },
      { slug: "future-of-ai", updated: "2025-09-25" },
    ];

    // Base domain
    const BASE_URL = "https://codearntech.cloud";

    // XML bana rahe hain
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages add karo
    pages.forEach((p) => {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${p.url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <priority>${p.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Blog posts add karo
    blogPosts.forEach((post) => {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${post.updated}</lastmod>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    // Response header
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("❌ Sitemap Error:", err);
    res.status(500).send("Error generating sitemap");
  }
});




// ============================
// 🚀 Start Server
// ============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

