import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import { createComment, createCommentOfEpiosde, deleteComment, getCommentById, getCommentOfEpiosdeById, getComments, getCommentsByEpisodeId, likeComment, updateComment } from '../controllers/comment.controller.js';
import Comment from '../models/Comment.js';

const router = express.Router();

router.post("/comments", createComment);
router.get("/comments", getComments);
router.get("/comments/:id", getCommentById);
router.put("/comments/:id", updateComment);
router.post("/comments/:id/like", likeComment);
router.get('/episodes/:episodeId/comments', getCommentsByEpisodeId);
router.post("/episodes/:episodeId/comments", createCommentOfEpiosde);
router.get("/episodes/:episodeId/comments/:commentId/replies", getCommentOfEpiosdeById);

// Bình luận
router.put('/episodes/:episodeId/comments/:commentId', async (req, res) => {
    const { episodeId, commentId } = req.params;
    const { content, userId } = req.body;
    try {
        const comment = await Comment.findOne({ where: { id: commentId, episodeId, userId } });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'You do not have permission to edit this comment.' });
        }

        comment.content = content;
        await comment.save();
        
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Phản hồi
router.put('/episodes/:episodeId/comments/:commentId/replies/:replyId', async (req, res) => {
    const { episodeId, commentId, replyId } = req.params;
    const { content, userId } = req.body;
    try {
        const comment = await Comment.findOne({ where: { id: replyId, episodeId, userId, parentId: commentId } });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'You do not have permission to edit this comment.' });
        }

        comment.content = content;
        await comment.save();
        
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Xóa bình luận
router.delete('/episodes/:episodeId/comments/:commentId', deleteComment);
export default router;
