const express = require("express");
const axios = require("axios");
const { body, validationResult } = require("express-validator");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { sendNotificationEmail } = require("../utils/emailService");

const router = express.Router();

const LOAN_SERVICE_URL =
  process.env.LOAN_SERVICE_URL || "http://localhost:3003";
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3001";

// POST / - Create a notification (inter-service communication, no auth)
router.post(
  "/",
  [
    body("userId").notEmpty().withMessage("userId is required"),
    body("type")
      .isIn([
        "borrow_confirmation",
        "return_confirmation",
        "due_reminder",
        "overdue_alert",
      ])
      .withMessage("Invalid notification type"),
    body("message").notEmpty().withMessage("message is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, type, message, bookTitle } = req.body;

      const notification = new Notification({
        userId,
        type,
        message,
        bookTitle,
      });

      await notification.save();

      // Emit real-time notification via Socket.IO
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");
      if (io && connectedUsers && connectedUsers.has(userId)) {
        for (const socketId of connectedUsers.get(userId)) {
          io.to(socketId).emit("new-notification", notification);
        }
      }

      // Send email notification (fire and forget)
      try {
        const userResponse = await axios.get(
          `${USER_SERVICE_URL}/api/users/${userId}`
        );
        const userEmail = userResponse.data.email;
        const userName = userResponse.data.name || "User";
        // Extract due date from message if present
        const dueDateMatch = message.match(/Due date:\s*(.+)/i);
        const dueDate = dueDateMatch ? dueDateMatch[1] : null;
        if (userEmail) {
          sendNotificationEmail(userEmail, type, bookTitle || "a book", dueDate, userName);
        }
      } catch (err) {
        console.error("Failed to fetch user for email:", err.message);
      }

      res.status(201).json({
        message: "Notification created successfully",
        notification,
      });
    } catch (error) {
      console.error("Error creating notification:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /user/:userId - Get all notifications for a user (protected)
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /:id/read - Mark notification as read (protected)
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /:id - Delete a notification (protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /user/:userId/read-all - Mark all notifications as read (protected)
router.patch("/user/:userId/read-all", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.status(200).json({
      message: `${result.modifiedCount} notification(s) marked as read`,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /user/:userId/unread-count - Get unread notification count (protected)
router.get("/user/:userId/unread-count", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Notification.countDocuments({ userId, read: false });

    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /check-overdue - Trigger overdue check (no auth, for cron/scheduled tasks)
router.post("/check-overdue", async (req, res) => {
  try {
    // Fetch overdue loans from Loan Service
    const loansResponse = await axios.get(
      `${LOAN_SERVICE_URL}/api/loans/overdue`
    );
    const overdueLoans = loansResponse.data;

    const notifications = [];

    for (const loan of overdueLoans) {
      // Skip if notification already sent for this loan
      const existing = await Notification.findOne({
        loanId: loan._id,
        type: "overdue_alert",
      });
      if (existing) continue;

      // Fetch user info from User Service
      let userName = "User";
      let userEmail = null;
      try {
        const userResponse = await axios.get(
          `${USER_SERVICE_URL}/api/users/${loan.userId}`
        );
        userName = userResponse.data.name || "User";
        userEmail = userResponse.data.email;
      } catch (err) {
        console.error(
          `Error fetching user ${loan.userId}:`,
          err.message
        );
      }

      // Create overdue alert notification
      const notification = new Notification({
        userId: loan.userId,
        type: "overdue_alert",
        message: `Dear ${userName}, the book "${loan.bookTitle}" is overdue. Please return it as soon as possible.`,
        bookTitle: loan.bookTitle,
        loanId: loan._id,
      });

      await notification.save();
      notifications.push(notification);

      // Emit real-time notification
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");
      if (io && connectedUsers && connectedUsers.has(loan.userId)) {
        for (const socketId of connectedUsers.get(loan.userId)) {
          io.to(socketId).emit("new-notification", notification);
        }
      }

      // Send email notification
      if (userEmail) {
        sendNotificationEmail(userEmail, "overdue_alert", loan.bookTitle, null, userName);
      }
    }

    res.status(200).json({
      message: `Overdue check completed. ${notifications.length} notification(s) created.`,
      notifications,
    });
  } catch (error) {
    console.error("Error during overdue check:", error.message);
    res.status(500).json({ message: "Server error during overdue check" });
  }
});

// POST /check-due-reminders - Trigger due date reminder check (no auth, for cron/scheduled tasks)
router.post("/check-due-reminders", async (req, res) => {
  try {
    // Fetch loans due within 2 days from Loan Service
    const loansResponse = await axios.get(
      `${LOAN_SERVICE_URL}/api/loans/due-soon`
    );
    const dueSoonLoans = loansResponse.data;

    const notifications = [];

    for (const loan of dueSoonLoans) {
      // Skip if due reminder already sent for this loan
      const existing = await Notification.findOne({
        loanId: loan._id,
        type: "due_reminder",
      });
      if (existing) continue;

      // Fetch user info from User Service
      let userName = "User";
      let userEmail = null;
      try {
        const userResponse = await axios.get(
          `${USER_SERVICE_URL}/api/users/${loan.userId}`
        );
        userName = userResponse.data.name || "User";
        userEmail = userResponse.data.email;
      } catch (err) {
        console.error(
          `Error fetching user ${loan.userId}:`,
          err.message
        );
      }

      const dueDate = new Date(loan.dueDate).toDateString();

      // Create due reminder notification
      const notification = new Notification({
        userId: loan.userId,
        type: "due_reminder",
        message: `Dear ${userName}, the book "${loan.bookTitle}" is due on ${dueDate}. Please return it on time.`,
        bookTitle: loan.bookTitle,
        loanId: loan._id,
      });

      await notification.save();
      notifications.push(notification);

      // Emit real-time notification
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");
      if (io && connectedUsers && connectedUsers.has(loan.userId)) {
        for (const socketId of connectedUsers.get(loan.userId)) {
          io.to(socketId).emit("new-notification", notification);
        }
      }

      // Send email notification
      if (userEmail) {
        sendNotificationEmail(userEmail, "due_reminder", loan.bookTitle, dueDate, userName);
      }
    }

    res.status(200).json({
      message: `Due reminder check completed. ${notifications.length} notification(s) created.`,
      notifications,
    });
  } catch (error) {
    console.error("Error during due reminder check:", error.message);
    res.status(500).json({ message: "Server error during due reminder check" });
  }
});

module.exports = router;
