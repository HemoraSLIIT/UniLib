const express = require("express");
const axios = require("axios");
const { body, validationResult } = require("express-validator");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

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
      // Fetch user info from User Service
      let userName = "User";
      try {
        const userResponse = await axios.get(
          `${USER_SERVICE_URL}/api/users/${loan.userId}`
        );
        userName = userResponse.data.name || "User";
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
      });

      await notification.save();
      notifications.push(notification);
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

module.exports = router;
