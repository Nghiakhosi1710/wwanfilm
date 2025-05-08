import db from '../models/index.js';
import { handleServerError } from "../utils/errorUtils.js";

const User = db.User;
const Notification = db.Notification;


export default class NotificationController {
    // Lấy tất cả thông báo chưa đọc của user (có thể thêm phân trang)
    async getUnreadNotifications(req, res) {
        const recipientId = req.userId;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10); // Số thông báo mỗi lần lấy
        const offset = (page - 1) * limit;

        try {
            const { count, rows: notifications } = await Notification.findAndCountAll({
                where: { recipientId, isRead: false },
                include: [{
                    model: User,
                    as: 'sender', // Dùng alias đã định nghĩa
                    attributes: ['id', 'name', 'avatar']
                }],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });
            const totalPages = Math.ceil(count / limit);
            res.status(200).json({
                 success: true,
                 notifications,
                 pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit }
            });
        } catch (error) {
            handleServerError(res, error, "Lấy thông báo chưa đọc");
        }
    }

    // Đánh dấu một thông báo là đã đọc
    async markNotificationAsRead(req, res) {
        const recipientId = req.userId;
        const notificationId = req.params.id;
        try {
            const notification = await Notification.findOne({ where: { id: notificationId, recipientId } });
            if (!notification) {
                return res.status(404).json({ success: false, message: "Thông báo không tồn tại hoặc bạn không có quyền." });
            }
            if (notification.isRead) {
                 return res.status(200).json({ success: true, message: "Thông báo đã được đọc trước đó." });
            }
            notification.isRead = true;
            await notification.save();
            res.status(200).json({ success: true, message: "Đã đánh dấu thông báo là đã đọc." });
        } catch (error) {
            handleServerError(res, error, "Đánh dấu đã đọc thông báo");
        }
    }

    // Đánh dấu tất cả thông báo là đã đọc
    async markAllNotificationsAsRead(req, res) {
        const recipientId = req.userId;
        try {
            await Notification.update({ isRead: true }, {
                where: { recipientId, isRead: false }
            });
            res.status(200).json({ success: true, message: "Đã đánh dấu tất cả thông báo là đã đọc." });
        } catch (error) {
            handleServerError(res, error, "Đánh dấu tất cả đã đọc");
        }
    }
}
