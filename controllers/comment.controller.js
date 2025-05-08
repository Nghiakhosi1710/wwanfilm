import Comment from "../models/Comment.js";
import Episode from "../models/Episode.js";
import User from "../models/User.js";
import Role from "../models/Role.js";

export const createComment = async (req, res) => {
    try {
        const comment = await Comment.create(req.body);
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getComments = async (req, res) => {
    try {
        const comments = await Comment.findAll();
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCommentById = async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (comment) {
            res.status(200).json(comment);
        } else {
            res.status(404).json({ message: "Comment not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateComment = async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (comment) {
            await comment.update(req.body);
            res.status(200).json(comment);
        } else {
            res.status(404).json({ message: "Comment not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const likeComment = async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (comment) {
            const likes = comment.likes || [];
            if (!likes.includes(req.body.userId)) {
                likes.push(req.body.userId);
            } else {
                comment.likes = likes.filter(id => id !== req.body.userId);
            }
            await comment.update({ likes });
            res.status(200).json(comment);
        } else {
            res.status(404).json({ message: "Comment not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCommentsByEpisodeId = async (req, res) => {
    const episodeId = req.params.episodeId;
    try {
        const comments = await Comment.findAll({
            where: {
                episodeId
            },
            include: [
                { model: User, as: 'user' },
                { model: Episode, as: 'episode' },
                { model: Comment, as: 'replies', include: [{ model: User, as: 'user' }] }
            ]
        });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createCommentOfEpiosde = async (req, res) => {
    const { content, userId, parentId, replyingTo } = req.body;
    try {
        const episodeId = req.params.episodeId;
        const resp = await Comment.create({ content, userId, episodeId, parentId, replyingTo });
        const comment = await Comment.findOne({
            where: { id: resp.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'avatar'],
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: ['name'],
                    }],
                },
                { model: Comment, as: 'replies', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }] }
            ],
        });
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCommentOfEpiosdeById = async (req, res) => {
    const commentId = req.params.commentId;
    const episodeId = req.params.episodeId;
    try {
        const replies = await Comment.findAll({ where: { parentId: commentId, episodeId }, include: [{ model: User, as: 'user' }] });
        const comment = await Comment.findOne({ where: { id: commentId, episodeId }, include: [{ model: User, as: 'user' }] });
        res.status(200).json({ comment, replies });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải dữ liệu replies' });
    }
}

export const deleteComment = async (req, res) => {
    const { episodeId, commentId } = req.params;
    const { userId } = req.body;
    if (!commentId) {
        return res.status(400).json({ error: 'Comment ID is required' });
    }
    try {
        const comment = await Comment.findOne({ where: { id: commentId, episodeId, userId } });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
        }
        // Xóa tất cả các replies của comment
        const deleteReplies = async (commentId) => {
            const replies = await Comment.findAll({ where: { parentId: commentId } });
            for (const reply of replies) {
                // Đệ quy xóa các replies của reply (nếu có)
                await deleteReplies(reply.id);
                await reply.destroy();
            }
        };

        // Xóa tất cả các replies của comment hiện tại
        await deleteReplies(commentId);

        // Xóa comment chính
        await comment.destroy();

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting comment: ' + error.message });
    }
};