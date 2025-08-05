import { db, ref, onValue, push, update, auth, set, remove } from "./firebase.js";

let allFeedbacks = [];
let currentFeedbackId = null;

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

window.info = function() {
  const popup = document.getElementById("accountPopup");
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");

  const user = getCurrentUser();
  if (user) {
    nameEl.textContent = user.displayName || "Ẩn danh";
    emailEl.textContent = user.email || "Không có email";
  } else {
    nameEl.textContent = "Chưa đăng nhập";
    emailEl.textContent = "";
  }
  popup.style.display = "block";
}

window.closePopup = function() {
  document.getElementById("accountPopup").style.display = "none";
}

// Hàm format ngày tháng
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

// Hàm render danh sách phản hồi
function renderFeedbacks(feedbacks) {
  const container = document.getElementById("feedbackList");
  container.innerHTML = "";

  if (!feedbacks || feedbacks.length === 0) {
    container.innerHTML = `<div class="no-feedback-message"><i class="fas fa-inbox"></i><p>Chưa có phản hồi nào.</p></div>`;
    return;
  }

  feedbacks.forEach((feedback) => {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "feedback-item";
    feedbackDiv.dataset.id = feedback.id;

    const displayTitle = (feedback.content && feedback.content.length > 50) ? `${feedback.content.substring(0, 50)}...` : feedback.content;
    const displayContent = (feedback.content && feedback.content.length > 200) ? `${feedback.content.substring(0, 200)}...` : feedback.content;
    const commentCount = feedback.comments ? Object.keys(feedback.comments).length : 0;

    feedbackDiv.innerHTML = `
      <div class="feedback-item-header">
        <div>
          <div class="feedback-title">${displayTitle || 'Không có tiêu đề'}</div>
          <div class="feedback-meta">
            <span class="feedback-author">${feedback.userName || 'Ẩn danh'}</span>
            <span class="feedback-date">${formatDate(feedback.timestamp)}</span>
          </div>
        </div>
      </div>
      <div class="feedback-content">${displayContent || ''}</div>
      <div class="feedback-stats">
        <span><i class="fas fa-comment"></i> ${commentCount} bình luận</span>
      </div>
    `;
    container.appendChild(feedbackDiv);
  });
}

// Hàm mở popup chi tiết phản hồi
function openFeedbackDetail(feedbackId) {
  const feedback = allFeedbacks.find(f => f.id === feedbackId);
  if (!feedback) return;

  const displayTitle = (feedback.content && feedback.content.length > 50) ? `${feedback.content.substring(0, 50)}...` : feedback.content;

  document.getElementById("popupTitle").textContent = displayTitle || 'Không có tiêu đề';
  document.getElementById("popupAuthor").textContent = `Bởi: ${feedback.userName || 'Ẩn danh'}`;
  document.getElementById("popupDate").textContent = formatDate(feedback.timestamp);
  document.getElementById("popupContent").textContent = feedback.content || '';

  currentFeedbackId = feedbackId;
  loadComments(feedbackId);

  document.getElementById("feedbackPopup").style.display = "flex";
}

// Hàm đóng popup
window.closeFeedbackPopup = function() {
  const popup = document.getElementById("feedbackPopup");
  const box = popup.querySelector(".popup-box");

  box.style.animation = "popupZoomOut 0.3s ease forwards";
  setTimeout(() => {
    popup.style.display = "none";
    box.style.animation = "";
  }, 300);
}

// Hàm load bình luận
function loadComments(feedbackId) {
  const commentsRef = ref(db, `feedback/${feedbackId}/comments`);
  onValue(commentsRef, (snapshot) => {
    const commentsList = document.getElementById("commentsList");
    commentsList.innerHTML = "";
    const commentsData = snapshot.val();

    if (!commentsData) {
      commentsList.innerHTML = `<div class="no-comments-message"><p>Chưa có bình luận nào. Hãy là người đầu tiên!</p></div>`;
      return;
    }

    const sortedComments = Object.entries(commentsData).map(([id, comment]) => ({ id, ...comment })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedComments.forEach(comment => {
      const commentDiv = renderComment(comment, feedbackId);
      commentsList.appendChild(commentDiv);
      loadReplies(feedbackId, comment.id, commentDiv.querySelector('.replies-list'));
    });
  });
}

function renderComment(comment, feedbackId, isReply = false) {
  const currentUser = getCurrentUser();
  const isOwner = currentUser && currentUser.uid === comment.authorId;
  const commentDiv = document.createElement("div");
  commentDiv.className = isReply ? "comment-item reply-item" : "comment-item";
  commentDiv.id = `comment-${comment.id}`;

  commentDiv.innerHTML = `
    <div class="comment-header">
      <span class="comment-author">${comment.authorName || 'Ẩn danh'}</span>
      <span class="comment-date">${formatDate(comment.timestamp)}</span>
    </div>
    <div class="comment-content">${comment.content}</div>
    <div class="comment-footer">
      <div class="comment-actions">
        ${renderReactionButtons(feedbackId, comment.id, comment.reactions, isReply)}
        <button class="btn-reply" onclick="toggleReplyForm('${comment.id}')"><i class="fas fa-reply"></i> Trả lời</button>
        ${isOwner ? `<button class="btn-delete-comment" onclick="deleteComment('${feedbackId}', '${comment.id}', ${isReply})"><i class="fas fa-trash"></i> Xóa</button>` : ''}
      </div>
    </div>
    <div class="replies-list"></div>
    <div class="reply-form-container" id="reply-form-${comment.id}"></div>
  `;
  return commentDiv;
}

function loadReplies(feedbackId, commentId, container) {
  const repliesRef = ref(db, `feedback/${feedbackId}/comments/${commentId}/replies`);
  onValue(repliesRef, (snapshot) => {
    container.innerHTML = "";
    const repliesData = snapshot.val();
    if (repliesData) {
      const sortedReplies = Object.entries(repliesData).map(([id, reply]) => ({ id, ...reply })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      sortedReplies.forEach(reply => {
        const replyDiv = renderComment(reply, feedbackId, true);
        container.appendChild(replyDiv);
      });
    }
  });
}

// --- Phản ứng (Reactions) ---
const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

function renderReactionButtons(feedbackId, commentId, reactions = {}, isReply) {
  let buttonsHtml = '<div class="reaction-buttons">';
  availableReactions.forEach(emoji => {
    const count = reactions[emoji] ? Object.keys(reactions[emoji]).length : 0;
    const userHasReacted = getCurrentUser() && reactions[emoji] && reactions[emoji][getCurrentUser().uid];
    buttonsHtml += `
      <button class="reaction-btn ${userHasReacted ? 'reacted' : ''}" onclick="handleReaction('${feedbackId}', '${commentId}', '${emoji}', ${isReply})">
        ${emoji} <span class="reaction-count">${count > 0 ? count : ''}</span>
      </button>
    `;
  });
  buttonsHtml += '</div>';
  return buttonsHtml;
}

async function handleReaction(feedbackId, commentId, emoji, isReply) {
  const user = getCurrentUser();
  if (!user) {
    customAlert("Bạn cần đăng nhập để thể hiện cảm xúc!");
    return;
  }
  const path = isReply 
    ? `feedback/${feedbackId}/comments/${commentId}/replies/${commentId}/reactions/${emoji}/${user.uid}`
    : `feedback/${feedbackId}/comments/${commentId}/reactions/${emoji}/${user.uid}`;
  
  const reactionRef = ref(db, path);

  onValue(reactionRef, async (snapshot) => {
    if (snapshot.exists()) {
      await remove(reactionRef);
    } else {
      await set(reactionRef, true);
    }
  }, { onlyOnce: true });
}

// --- Trả lời bình luận (Replies) ---
function toggleReplyForm(commentId) {
  const container = document.getElementById(`reply-form-${commentId}`);
  if (container.innerHTML) {
    container.innerHTML = "";
  } else {
    container.innerHTML = `
      <div class="comment-form reply-form">
        <textarea id="reply-input-${commentId}" placeholder="Viết câu trả lời của bạn..."></textarea>
        <button onclick="submitReply('${commentId}')">Gửi trả lời</button>
      </div>
    `;
    document.getElementById(`reply-input-${commentId}`).focus();
  }
}

async function submitReply(commentId) {
  const user = getCurrentUser();
  if (!user) {
    customAlert("Bạn cần đăng nhập để trả lời!");
    return;
  }

  const input = document.getElementById(`reply-input-${commentId}`);
  const content = input.value.trim();
  if (!content) return;

  const replyData = {
    content: content,
    authorId: user.uid,
    authorName: user.displayName || user.email || 'Ẩn danh',
    timestamp: new Date().toISOString()
  };

  const repliesRef = ref(db, `feedback/${currentFeedbackId}/comments/${commentId}/replies`);
  await push(repliesRef, replyData);
  toggleReplyForm(commentId); // Ẩn form sau khi gửi
}

// --- Gửi và xóa bình luận ---
async function submitComment() {
  const user = getCurrentUser();
  if (!user) { customAlert("Bạn cần đăng nhập để bình luận!"); return; }

  const input = document.getElementById("commentInput");
  const content = input.value.trim();
  if (!content) return;

  const commentData = {
    content,
    authorId: user.uid,
    authorName: user.displayName || user.email || 'Ẩn danh',
    timestamp: new Date().toISOString()
  };
  
  await push(ref(db, `feedback/${currentFeedbackId}/comments`), commentData);
  input.value = "";
}

async function deleteComment(feedbackId, commentId, isReply, parentCommentId) {
  if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
  const user = getCurrentUser();
  const path = isReply
    ? `feedback/${feedbackId}/comments/${parentCommentId}/replies/${commentId}`
    : `feedback/${feedbackId}/comments/${commentId}`;

  const commentRef = ref(db, path);
  onValue(commentRef, async (snapshot) => {
    const comment = snapshot.val();
    if (comment && comment.authorId === user?.uid) {
      await remove(commentRef);
    } else {
      customAlert("Bạn không có quyền xóa bình luận này.");
    }
  }, { onlyOnce: true });
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Click vào phản hồi để mở popup
  document.getElementById("feedbackList").addEventListener("click", function(event) {
    const feedbackItem = event.target.closest(".feedback-item");
    if (feedbackItem) {
      const feedbackId = feedbackItem.dataset.id;
      openFeedbackDetail(feedbackId);
    }
  });

  // Enter để gửi bình luận
  document.getElementById("submitComment").addEventListener("click", submitComment);
  document.getElementById("commentInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitComment();
    }
  });
});

// Load dữ liệu phản hồi từ Firebase
const feedbacksRef = ref(db, "feedback");
onValue(feedbacksRef, (snapshot) => {
  const data = snapshot.val();
  allFeedbacks = data ? Object.entries(data).map(([id, fb]) => ({ id, ...fb })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];
  renderFeedbacks(allFeedbacks);
});

// --- Gán hàm vào window để HTML có thể gọi ---
window.info = info;
window.closePopup = closePopup;
window.closeFeedbackPopup = closeFeedbackPopup;
window.submitComment = submitComment;
window.deleteComment = deleteComment;
window.toggleReplyForm = toggleReplyForm;
window.submitReply = submitReply;
window.handleReaction = handleReaction;

// Hàm customAlert
function customAlert(message, callback) {
  const alertBox = document.getElementById('customAlert');
  const alertMessage = document.getElementById('customAlertMsg');
  const alertClose = document.getElementById('customAlertClose');
  if (!alertBox || !alertMessage || !alertClose) {
    console.error('Custom alert popup HTML chưa được thêm vào trang!');
    return;
  }
  alertMessage.textContent = message;
  alertBox.style.display = 'flex';
  alertBox.classList.remove('fadeOut');
  void alertBox.offsetWidth;
  alertBox.classList.add('fadeIn');
  alertClose.onclick = function() {
    alertBox.classList.remove('fadeIn');
    alertBox.classList.add('fadeOut');
    setTimeout(() => {
      alertBox.style.display = 'none';
      if (typeof callback === 'function') callback();
    }, 350);
  };
}

