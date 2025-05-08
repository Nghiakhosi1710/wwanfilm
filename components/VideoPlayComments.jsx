import { useSelector, useDispatch } from "react-redux";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useVideo } from "../pages/PlayMovie";
import { Bounce, toast } from "react-toastify";
import classNames from "../utils/classNames";
import { sendFriendRequest, cancelFriendRequest, getFriends } from "../features/friendSlice";
import "../assets/scss/comment.scss";

const BANNED_WORDS = new Set([
    "địt", "lồn", "cặc", "địt mẹ", "ngu", "đéo", "đm", "vcl", "vl", "cc", "cmm", "dm"
]);


function containsBannedWord(text) {
    const normalized = text.normalize("NFD").toLowerCase();
    for (const word of BANNED_WORDS) {
        if (normalized.includes(word.normalize("NFD").toLowerCase())) {
            return true;
        }
    }
    return false;
}

const VideoPlayComments = React.memo(() => {
    const { user: currentUser } = useSelector((state) => state.user);
    const { state } = useVideo();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState("");
    const [sendCommentLoading, setSendCommentLoading] = useState(false);
    const commentsWrapperRef = useRef(null);
    const dispatch = useDispatch();
    const [friends, setFriends] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);

    const getAvatarUrl = () => {
        if (!currentUser) return "";
        return currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name.split(' ').map(word => word[0].toUpperCase()).join('')}&background=20c997&color=fff`;
    };

    const fetchComments = useCallback(async () => {
        setContent("")
        setLoading(true);
        try {
            const response = await axios.get(`/api/episodes/${state.data.episode?.id}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error("Lỗi tải bình luận:", error);
        } finally {
            setLoading(false);
        }
    }, [state.data.episode?.id]);

    const commentsWithReplies = useMemo(() => {
        const commentMap = new Map();
        const rootComments = [];

        comments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        comments.forEach(comment => {
            if (comment.parentId === null) {
                rootComments.push(commentMap.get(comment.id));
            } else {
                const parent = commentMap.get(comment.parentId);
                if (parent) {
                    parent.replies.push(commentMap.get(comment.id));
                }
            }
        });

        return rootComments;
    }, [comments]);

    // Hàm xử lý gửi bình luận
    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        const commentForm = e.target;
        if (!commentForm) return;

        const input = commentForm.querySelector("textarea");
        if (!input) return;
        const value = input.value.trim();
        if (!value) return;

        const commentId = commentForm.dataset.commentIndex ? parseInt(commentForm.dataset.commentIndex) : null;

        if (containsBannedWord(value)) {
            toast.warn("Nội dung không hợp lệ");
            return;
        }

        const state = commentForm.getAttribute("state");

        if (state === "comment") {
            await submitNewComment(value);
        } else if (state === "edit" && commentId !== null && !isNaN(commentId)) {
            await editExistingComment(commentId, value, commentForm);
        }

        input.value = "";
        setContent("");
    };

    async function submitNewComment(value) {
        setSendCommentLoading(true);
        try {
            const response = await axios.post(`/api/episodes/${state.data.episode?.id}/comments`, {
                content: value,
                userId: currentUser.id
            });
            setComments((prevComments) => [...prevComments, response.data]);
        } catch (error) {
            console.error("Lỗi khi gửi bình luận:", error);
        } finally {
            setSendCommentLoading(false);
        }
    }

    async function editExistingComment(commentId, value, commentForm) {
        const commentElement = document.querySelector(`[data-id="${commentId}"]`);
        if (!commentElement) {
            console.error("Không tìm thấy bình luận để chỉnh sửa");
            return;
        }
    
        await editCommentOrReply(commentId, null, value);
    
        const contentTextElement = commentElement.querySelector(".comment__content-text");
        if (contentTextElement) {
            contentTextElement.textContent = value;
        }
    
        commentForm.setAttribute("state", "comment");
        document.querySelector(".force-edit")?.classList.remove("force-edit");
    }

    const submitReply = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!form) return;
    
        const input = form.querySelector(".reply-form__input");
        if (!input) return;
        const value = input.value.trim();
        if (!value) return;
    
        const commentId = parseInt(form.dataset.commentIndex);
        if (isNaN(commentId)) return;
    
        if (containsBannedWord(value)) {
            toast.warn("Nội dung không hợp lệ");
            return;
        }
    
        const state = form.getAttribute("state");
        const replyId = form.dataset.replyId ? parseInt(form.dataset.replyId) : null;
        const comment = comments.find(com => com.id === commentId);
        if (!comment) return;
    
        if (state === "reply") {
            await handleReplySubmit(comment, form, value);
        } else if (state === "edit" && replyId !== null) {
            await handleReplyEdit(comment, replyId, form, value);
        }
    };

    async function handleReplySubmit(comment, form, value) {
        const newReply = {
            content: value,
            replyingTo: form.dataset.commentAuthor || form.dataset.replyAuthor,
            userId: currentUser.id,
            parentId: comment.id,
        };
    
        try {
            const response = await axios.post(`/api/episodes/${state.data.episode?.id}/comments`, newReply);
            const savedReply = response.data;
            comment.replies.push(savedReply);
    
            updateUIAfterReply(comment, savedReply);
            form.querySelector(".reply-form__input").value = "";
        } catch (error) {
            console.error("Lỗi khi gửi reply:", error);
        }
    }

    async function handleReplyEdit(comment, replyId, form, value) {
        if (!replyId) return;
    
        const reply = comment.replies.find(rep => rep.id === replyId);
        if (!reply) {
            console.error("Không tìm thấy reply để chỉnh sửa");
            return;
        }
    
        reply.content = value;
        updateUIAfterEdit(replyId, reply);
        await editCommentOrReply(comment.id, replyId, reply.content);
    
        form.setAttribute("state", "reply");
        form.removeAttribute("data-reply-author");
        form.setAttribute("data-comment-author", comment.user.name);
        document.querySelector(".force-edit-reply")?.classList.remove("force-edit-reply");
    }

    function updateUIAfterReply(comment, savedReply) {
        const commentElement = document.querySelector(`[data-id="${comment.id}"]`);
        if (!commentElement) return;
        setComments((prevComments) => [...prevComments, savedReply]);

        updateRepliesCount(comment.id, comment.replies.filter(rep => !rep.is_hidden).length);
    }
    function updateUIAfterEdit(replyId, reply) {
        const replyElement = document.querySelector(`li[data-reply-id="${replyId}"]`);
        if (!replyElement) return;

        const contentTextElement = replyElement.querySelector("span.comment__content-text");
        contentTextElement.innerHTML = "";

        const mentionElement = document.createElement("a");
        mentionElement.className = "comment__mention";
        mentionElement.textContent = `@${reply.replyingTo}`;

        contentTextElement.appendChild(mentionElement);
        contentTextElement.appendChild(document.createTextNode(" " + reply.content));
    }

    function updateRepliesCount(commentId, count) {
        const repliesCountElement = document.querySelector(`[data-comment-index="${commentId}"] .comment__action--toggle-replies strong`);
        if (repliesCountElement) {
            repliesCountElement.textContent = `${count} phản hồi`;
        }
    }

    const replyComment = (e, commentId, commentAuthor) => {
        e.preventDefault();
        const btn = e.currentTarget;
        let liOfComment = btn.closest("li");
        scrollToReplyElement(liOfComment);
        let formOfComment = document.querySelector(`#formOfComment_${commentId} form`);
        if (formOfComment.hasAttribute("data-reply-author")) {
            formOfComment.removeAttribute("data-reply-author");
            formOfComment.removeAttribute("data-reply-id");
            formOfComment.setAttribute("data-comment-author", commentAuthor);
        }
        if (!formOfComment.hasAttribute("data-comment-author")) {
            formOfComment.setAttribute("data-comment-author", commentAuthor);
        }
    }

    const replyToReply = (e, commentId, replyId, replyAuthor) => {
        e.preventDefault();
        let liOfComment = document.querySelector(`[data-id="${commentId}"]`);
        scrollToReplyElement(liOfComment);
        let formOfComment = document.querySelector(`#formOfComment_${commentId} form`);
        if (formOfComment.hasAttribute("data-comment-author")) {
            formOfComment.removeAttribute("data-comment-author");
        }
        if (!formOfComment.hasAttribute("data-reply-author")) {
            formOfComment.setAttribute("data-reply-author", replyAuthor);
            formOfComment.setAttribute("data-reply-id", replyId);
        } else {
            formOfComment.setAttribute("data-reply-author", replyAuthor);
            formOfComment.setAttribute("data-reply-id", replyId);
        }
        formOfComment.setAttribute("state", "reply");
    }

    function scrollToReplyElement(element) {
        if (!element.classList.contains("reply-status")) {
            element.classList.add("reply-status");
        }
        let formOfComment = document.querySelector(`#formOfComment_${element.dataset.id}`);
        formOfComment.querySelector(".reply-form__input").focus();
        commentsWrapperRef.current.scroll({
            top: formOfComment.offsetTop - commentsWrapperRef.current.offsetTop,
            behavior: "smooth"
        });
    }

    function handleDeleteComment(commentIndex) {
        const comment = document.querySelector(`[data-id="${commentIndex}"]`);
        if (!comment) return;
        confirmDelete(comment);
    };

    function handleEditComment(e, commentIndex) {
        const clickedElement = e.currentTarget;
        const commentForm = document.querySelector(".comment-send__textarea");
        if (!commentForm) return;

        document.querySelectorAll(".force-edit").forEach((btn) => btn.classList.remove("force-edit"));

        clickedElement.classList.toggle("force-edit");

        const comment = document.querySelector(`[data-id="${commentIndex}"]`);
        if (!comment) return;

        const textarea = commentForm.querySelector("textarea");
        if (!textarea) return;

        if (clickedElement.classList.contains("force-edit")) {
            const text = comment.querySelector("span.comment__content-text")?.textContent.trim();

            if (text === "") return; // Bảo vệ dữ liệu đầu vào, không chỉnh sửa nếu nội dung rỗng
            commentForm.setAttribute("state", "edit");
            commentForm.dataset.commentIndex = commentIndex;
            textarea.value = text;
            textarea.focus();
        } else {
            commentForm.setAttribute("state", "reply");
            delete commentForm.dataset.commentIndex;
            const textarea = commentForm.querySelector("textarea");
            if (textarea) {
                textarea.value = "";
                textarea.focus();
            }
        }
    };

    function handleDeleteReply(commentIndex, replyId) {
        const reply = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!reply) return;
        confirmDeleteReply(commentIndex, reply);
    };

    function handleEditReply(e, commentIndex, replyId) {
        e.preventDefault();
        const clickedElement = e.currentTarget;
        const replyForm = document.querySelector(`#formOfComment_${commentIndex} form`);
        if (!replyForm) return;

        const comment = comments.find(com => com.id === parseInt(commentIndex));
        if (!comment) return;

        const reply = comment.replies.find(rep => rep.id === parseInt(replyId));
        if (!reply) return;

        const input = replyForm.querySelector(".reply-form__input");
        if (!input) return;

        const liOfComment = clickedElement.closest("ul").closest("li");

        if (!clickedElement.classList.contains("force-edit-reply")) {
            document.querySelectorAll(".force-edit-reply").forEach((btn) => {
                btn.classList.remove("force-edit-reply");
            });
            clickedElement.classList.add("force-edit-reply");

            scrollToReplyElement(liOfComment);
            let contentText = reply.content;
            if (reply.replyingTo) {
                contentText = contentText.replace(`@${reply.replyingTo}`, "");
            }

            if (contentText === "") return;

            replyForm.setAttribute("state", "edit");
            replyForm.setAttribute("data-reply-id", replyId);
            replyForm.setAttribute("data-reply-author", currentUser.name);
            input.value = contentText;
            input.focus();
            console.log(" Reply is being edited");

            if (replyForm.hasAttribute("data-comment-author")) {
                replyForm.removeAttribute("data-comment-author");
            }
        } else {
            clickedElement.classList.remove("force-edit-reply");

            replyForm.setAttribute("state", "reply");
            replyForm.removeAttribute("data-reply-id");
            const comment = comments.find(com => com.id === parseInt(commentIndex));
            replyForm.setAttribute("data-comment-author", comment.user.name);
            const input = replyForm.querySelector(".reply-form__input");
            input.value = "";
            input.focus();
            if (replyForm.hasAttribute("data-reply-author")) {
                replyForm.removeAttribute("data-reply-author");
            }
        }
    };

    const editCommentOrReply = useCallback(async (commentId, replyId, content) => {
        try {
            let url = `/api/episodes/${state.data.episode?.id}/comments/${commentId}`;
            if (replyId) {
                url += `/replies/${replyId}`;
            }
            await axios.put(url, {
                content,
                userId: currentUser?.id,
            });
            // Cập nhật nội dung bình luận hoặc phản hồi trong state
            if (replyId) {
                setComments((prevComments) => {
                    const newComments = [...prevComments];
                    const comment = newComments.find((comment) => comment.id === commentId);
                    const reply = comment.replies.find((reply) => reply.id === replyId);
                    reply.content = content;
                    return newComments;
                });
            } else {
                setComments((prevComments) => {
                    const newComments = [...prevComments];
                    const foundComment = newComments.find((comment) => comment.id === parseInt(commentId));

                    if (!foundComment) {
                        console.error(`Comment with ID ${commentId} not found in`, newComments);
                        return prevComments;
                    }
                    foundComment.content = content;
                    return newComments;
                });

            }
            setContent("");
        } catch (error) {
            console.error("Lỗi chỉnh sửa bình luận hoặc phản hồi:", error);
        }
    }, [currentUser?.id, state.data.episode?.id]);

    function confirmDelete(comment) {
        const popup = document.querySelector(".confirm-delete-popup");
        popup.classList.add("show");
        popup.addEventListener("click", function handlePopupClick(e) {
            e.preventDefault();
            if (e.target.classList.contains("confirm-delete-popup__yes")) {
                deleteComment(comment.dataset.id);
                popup.classList.remove("show");
            } else if (e.target.classList.contains("confirm-delete-popup__no")) {
                popup.classList.remove("show");
            }
            popup.removeEventListener("click", handlePopupClick);
        });
    }

    function confirmDeleteReply(commentIndex, reply) {
        const popup = document.querySelector(".confirm-delete-popup");
        popup.classList.add("show");
        popup.addEventListener("click", function handlePopupClick(e) {
            e.preventDefault();
            if (e.target.classList.contains("confirm-delete-popup__yes")) {
                deleteComment(reply.dataset.replyId, commentIndex);
                popup.classList.remove("show");
            } else if (e.target.classList.contains("confirm-delete-popup__no")) {
                popup.classList.remove("show");
            }
            popup.removeEventListener("click", handlePopupClick);
        });
    }

    const deleteComment = useCallback(async (commentId, commentIndex = null) => {
        try {
            await axios.delete(`/api/episodes/${state.data.episode?.id}/comments/${commentId}`, {
                data: { userId: currentUser?.id }
            });
            if (commentIndex) {
                const comment = comments.find(com => com.id === parseInt(commentIndex));
                comment.replies = comment.replies.filter(rep => rep.id !== parseInt(commentId) && !rep.is_hidden);
                setComments(prevComments => {
                    const newComments = prevComments.map(c => {
                        if (c.id === comment.id) {
                            return { ...c, replies: comment.replies };
                        }
                        return c;
                    });
                    return newComments;
                });
                setComments(prevComments => prevComments.filter(item => item.id !== parseInt(commentId)));
            } else {
                setComments(prevComments => prevComments.filter(item => item.id !== parseInt(commentId)));
            }

        } catch (error) {
            console.error("Error deleting comment:", error);
        } finally {
        }
    }, [comments, currentUser?.id, state.data.episode?.id]);

    const rerenderModalConfirmDelete = () => {
        return (
            <div className="confirm-delete-popup">
                <div className="confirm-delete-popup__container">
                    <div className="confirm-delete-popup__content">
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to delete this comment?</p>

                    </div>
                    <div className="confirm-delete-popup__footer">
                        <button className="confirm-delete-popup__no">Hủy</button>
                        <button className="confirm-delete-popup__yes">Đồng ý</button>
                    </div>
                </div>

            </div>
        );
    };

    const handleSendFriendRequest = (userId) => {
        dispatch(sendFriendRequest(userId)).then(() => {
            setSentFriendRequests((prev) => [...prev, userId]);
            toast.info("Đã gửi lời mời kết bạn", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce,
            });
        });
    };

    const handleCancelFriendRequest = (userId) => {
        dispatch(cancelFriendRequest(userId)).then(() => {
            setSentFriendRequests((prev) => prev.filter((id) => id !== userId));
            toast.info("Đã hủy lời mời kết bạn", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce,
            });
        });
    };

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    useEffect(() => {
        if (currentUser) {
            dispatch(getFriends(currentUser.id)).then((response) => {
                setFriends(response.payload.friends.map(friend => friend.id));
                setSentFriendRequests(response.payload.sentFriendRequests.map(request => request.id));
            });
        }
    }, [currentUser, dispatch]);

    const toggleRepliesBtn = (e, commentId) => {
        e.preventDefault();
        const btn = e.currentTarget;
        const commentElement = document.querySelector(`[data-id="${commentId}"]`);
        const commentChildsList = commentElement.querySelector(".comment-childs");
        if (commentChildsList) {
            commentChildsList.classList.toggle("hidden");
            if (commentChildsList.classList.contains("hidden")) {
                btn.querySelector("i").classList.remove("fa-caret-up");
                btn.querySelector("i").classList.add("fa-caret-down");
            } else {
                btn.querySelector("i").classList.remove("fa-caret-down");
                btn.querySelector("i").classList.add("fa-caret-up");
            }
        }
    }

    return (
        <div className="video-play__comments">
            <section className="comment-section">
                <div className="comment-section__send">
                    <div className="comment-send" style={{ '--def34f72': '3', '--f927034e': '3' }}>
                        <img className="comment-send__avatar" src={getAvatarUrl()} alt={currentUser ? currentUser.name : 'Use Avatar'} />
                        <form onSubmit={handleCommentSubmit} className="comment-send__textarea" state="comment">
                            <div className="comment-send__textarea__inner" data-message="">
                                <textarea maxLength="1500" rows="1" placeholder="Để lại bình luận thân thiện(°▽°)~"
                                    value={content}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value !== undefined) {
                                            setContent(value);
                                        }
                                    }}
                                ></textarea>
                            </div>
                            <button type="submit" className={`comment-send__btn ${content ? '' : 'comment-send__btn--disable'}`} disabled={!content} >
                                <i className="comment-send__btn--loading" style={sendCommentLoading ? { display: 'block' } : { display: 'none' }}></i>
                                <span >Gửi</span>
                            </button>
                        </form>
                    </div>
                </div>
                <ul
                    ref={commentsWrapperRef}
                    className="main-comments flexcol"
                >
                    {loading ? (
                        <div id="container-loader">
                            <div className="loader-box" id="loader1"></div>
                            <div className="loader-box" id="loader2"></div>
                            <div className="loader-box" id="loader3"></div>
                            <div className="loader-box" id="loader4"></div>
                            <div className="loader-box" id="loader5"></div>
                        </div>
                    ) : commentsWithReplies.filter(comment => !comment.is_hidden).map((comment, index) => (
                        <li
                            key={index}
                            className={classNames("comment", { "current-user": comment.user.id === currentUser?.id })}
                            data-id={comment.id}
                        >
                            <div className="comment__wrapper">
                                <div className="comment__avatar">
                                    <img src={comment.user && comment.user.avatar ? comment.user.avatar : `https://ui-avatars.com/api/?name=${comment.user.name.split(' ').map(word => word[0].toUpperCase()).join('')}&background=20c997&color=fff`} alt="Avatar" />
                                </div>
                                <div className="comment__body">
                                    <div className="comment__header justify-content-between">
                                        <div className="comment__user">
                                            <strong className="comment__user-name">{comment.user.name}</strong>
                                            {currentUser && (comment.user.name === currentUser.name) ? <span className='comment__user-badge'>Bạn</span> : ""}
                                            <p className="comment__timestamp">{comment.createdAt}</p>
                                        </div>
                                        <div className="comment__actions" data-comment-index={comment.id}>
                                            {currentUser && comment.user.name !== currentUser.name && !friends.includes(comment.user.id) && (
                                                <>
                                                    {sentFriendRequests.includes(comment.user.id) ? (
                                                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleCancelFriendRequest(comment.user.id)}>Hủy gửi lời mời</button>
                                                    ) : (
                                                        <button className="btn btn-sm btn-info me-2" onClick={() => handleSendFriendRequest(comment.user.id)}>Kết bạn</button>
                                                    )}
                                                </>
                                            )}
                                            
                                        </div>
                                    </div>
                                    <div className="comment__content">
                                        <span className="comment__content-text">{comment.content}</span>
                                    </div>
                                    <div className="comment__actions" data-comment-index={comment.id}>
                                        {comment.replies.length > 0 ?
                                            <span
                                                className="comment__action comment__action--toggle-replies"
                                                onClick={(e) => toggleRepliesBtn(e, comment.id)}
                                            >
                                                <span className="comment__action-icon"><i className="fa-solid fa-caret-down"></i></span>
                                                <strong>{comment.replies.filter(comment => !comment.is_hidden).length} phản hồi</strong>
                                            </span>
                                        : ""}
                                        {currentUser ? comment.user.name === currentUser.name ? <>
                                                <span
                                                    className="comment__action comment__action--edit edit"
                                                    onClick={(e) => handleEditComment(e, comment.id)}
                                                >
                                                    <span className="comment__action-icon"><i className="fa-regular fa-pen-to-square"></i></span>
                                                </span>
                                                <span
                                                    className="comment__action comment__action--delete delete"
                                                    onClick={(e) => handleDeleteComment(comment.id)}
                                                >
                                                    <span className="comment__action-icon"><i className="fa-regular fa-trash-xmark"></i></span>
                                                </span>
                                            </> :
                                                <a
                                                    href={`#formOfComment_${comment.id}`}
                                                    className="comment__action comment__action--reply"
                                                    onClick={(e) => replyComment(e, comment.id, comment.user.name)}
                                                >
                                                    <span className="comment__action-icon"><i className="fa-regular fa-reply"></i></span>
                                                    <strong>Phản hồi</strong>
                                                </a>
                                                : ""
                                            }
                                    </div>
                                </div>
                            </div>

                            <div className="reply-form" id={`formOfComment_${comment.id}`}>
                                <div className="comment__avatar"><img src={getAvatarUrl()} alt="" /></div>
                                <form onSubmit={submitReply} className="reply-form__form" data-comment-index={comment.id} state="reply">
                                    <input name="" className="reply-form__input" />
                                    <button type="submit" className="reply-form__button" ><i className="fa-regular fa-reply"></i></button>
                                </form>
                            </div>

                            <ul className="comment-childs hidden">
                                {comment.replies.filter(reply => !reply.is_hidden).map((reply, i) => (
                                    <li
                                        key={i}
                                        className={classNames("comment comment-reply", { "current-user": reply.user.id === currentUser?.id })}
                                        data-reply-id={reply.id}
                                    >
                                        <div className="comment__wrapper">
                                            <div className="comment__avatar">
                                                <img src={reply.user && reply.user.avatar ? reply.user.avatar : `https://ui-avatars.com/api/?name=${reply.user.name.split(' ').map(word => word[0].toUpperCase()).join('')}&background=20c997&color=fff`} alt="Avatar" />
                                            </div>
                                            <div className="comment__body">
                                                <div className="comment__header">
                                                    <div className="comment__user">
                                                        <strong className="comment__user-name">{reply.user.name}</strong>
                                                        {currentUser && (reply.user.name === currentUser.name) ? <span className='comment__user-badge'>Bạn</span> : ""}
                                                    </div>
                                                    <p className="comment__timestamp">{reply.createdAt}</p>
                                                </div>
                                                <div className="comment__content">
                                                    <span className="comment__content-text"><span className="comment__mention">@{reply.replyingTo}</span> {reply.content}</span>
                                                </div>
                                                <div className="comment__actions">
                                                    {currentUser ? reply.user.name === currentUser.name ? <>
                                                        <span
                                                            className="comment__action comment__action--edit edit-reply"
                                                            onClick={(e) => handleEditReply(e, comment.id, reply.id)}
                                                        >
                                                            <span className="comment__action-icon"><i className="fa-regular fa-pen-to-square"></i></span>
                                                        </span>
                                                        <span
                                                            className="comment__action comment__action--delete delete-reply"
                                                            onClick={() => handleDeleteReply(comment.id, reply.id)}
                                                        >
                                                            <span className="comment__action-icon"><i className="fa-regular fa-trash-xmark"></i></span>
                                                        </span>
                                                    </> :
                                                        <a
                                                            href={`#formOfComment_${comment.id}`}
                                                            className="comment__action comment__action--reply-to-reply"
                                                            data-reply-author={reply.user.name}
                                                            onClick={(e) => replyToReply(e, comment.id, reply.id, reply.user.name)}
                                                        >
                                                            <span className="comment__action-icon"><i className="fa-regular fa-reply"></i></span>
                                                            <strong>Phản hồi</strong>
                                                        </a>
                                                        : null
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </section>
            {rerenderModalConfirmDelete()}
        </div>
    )
})

export default VideoPlayComments;