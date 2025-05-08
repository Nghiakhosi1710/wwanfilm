// routes/notification.routes.js
import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();
const notificationController = new NotificationController();

router.get('/', authJwt.verifyToken, notificationController.getUnreadNotifications); // Lấy thông báo chưa đọc
router.put('/:id/read', authJwt.verifyToken, notificationController.markNotificationAsRead); // Đánh dấu 1 thông báo đã đọc
router.put('/read-all', authJwt.verifyToken, notificationController.markAllNotificationsAsRead); // Đánh dấu tất cả đã đọc

export default router;