import express from "express";
import { Redis } from "ioredis";
import { Worker } from "bullmq";
import nodemailer from "nodemailer";

import "dotenv/config";
// console.log(process.env.UPSTASH_REDIS_URL);
export const connection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
});

const worker = new Worker(
  "sendReminder",
  async (job) => {
    const { email, task } = job.data;
    await sendEmail({ email, task });
    console.log(`Email sent to ${email} for task ${task.id || task._id}`);
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

export const sendEmail = async (data) => {
  const { email, task } = data;
  try {
    console.log(task);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // your gmail email
        pass: process.env.GMAIL_PASS, // your gmail app password
      },
    });

    const mailOptions = {
      from: `"" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Task Due Date Reminder",
      text: `Reminder: Your task "${task.title}" is due at ${new Date(
        task.dueDate
      ).toLocaleString("en-IN")}.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const app = express();

app.listen(3000, () => {
  console.log("server is running on 3000");
});
