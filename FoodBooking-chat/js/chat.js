import { database as db, auth, ref, set, get, onValue, push, update } from './firebase.js';

let currentUser = null;
let currentChatId = null;
let allChats = [];
let chatFilter = 'all';
let chatMetaListener = null; 

function getCurrentUser() {
    const local = localStorage.getItem('currentUser');
    if (local) return JSON.parse(local);
    if (auth.currentUser) {
        return {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL
        };
    }
    return null;
}

auth.onAuthStateChanged(user => {
    currentUser = getCurrentUser();
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.displayName || 'Ẩn danh';
        document.getElementById('userEmail').textContent = currentUser.email || '';
        handleOpenChatFromProduct();
        loadChatList();
    } else {
        window.location.href = '/FoodBooking-login/login.html';
    }
});

function handleOpenChatFromProduct() {
    const chatInfo = JSON.parse(localStorage.getItem('currentChat'));
    if (chatInfo && chatInfo.chatId && currentUser) {
        const chatRef = ref(db, 'chats/' + chatInfo.chatId);
        get(chatRef).then(snap => {
            if (!snap.exists()) {
                set(chatRef, {
                    id: chatInfo.chatId,
                    members: [chatInfo.userId, chatInfo.sellerId],
                    sellerId: chatInfo.sellerId,
                    sellerName: chatInfo.sellerName,
                    sellerEmail: chatInfo.sellerEmail,
                    buyerId: chatInfo.userId,
                    buyerName: chatInfo.userName,
                    buyerEmail: chatInfo.userEmail,
                    productId: chatInfo.productId,
                    productName: chatInfo.productName,
                    productImage: chatInfo.productImage,
                    lastMessage: '',
                    lastMessageTime: Date.now()
                });
            }
            openChat(chatInfo.chatId);
        });
        localStorage.removeItem('currentChat');
    }
}

// --- Popup tài khoản ---
window.info = function() {
    document.getElementById('accountPopup').style.display = 'block';
};
window.closePopup = function() {
    document.getElementById('accountPopup').style.display = 'none';
};

document.querySelector('.btn-logout').onclick = function() {
    auth.signOut();
};

document.addEventListener("DOMContentLoaded", () => {
    const accPopup = document.getElementById("accountPopup");
    if (accPopup) {
        accPopup.addEventListener("mousedown", function(e) {
            if (e.target === accPopup) {
                closePopup();
            }
        });
    }
});

// --- Kiểm tra người dùng có bị chặn không ---
async function isUserBlocked(otherUserId) {
    const currentUid = getCurrentUser().uid;
    const blockedRef = ref(db, `users/${currentUid}/blocked/${otherUserId}`);
    const snapshot = await get(blockedRef);
    return snapshot.exists();
}

// --- Kiểm tra người dùng có bị chặn bởi ai khác không ---
async function isUserBlockedBy(otherUserId) {
    const currentUid = getCurrentUser().uid;
    const blockedRef = ref(db, `users/${otherUserId}/blocked/${currentUid}`);
    const snapshot = await get(blockedRef);
    return snapshot.exists();
}

// --- Lọc danh sách chat để ẩn người bị chặn ---
function filterBlockedUsers(chats) {
    return chats.filter(async (chat) => {
        const currentUid = getCurrentUser().uid;
        const otherUserId = currentUid === chat.sellerId ? chat.buyerId : chat.sellerId;
        
        // Kiểm tra xem có bị chặn không
        const isBlocked = await isUserBlocked(otherUserId);
        const isBlockedBy = await isUserBlockedBy(otherUserId);
        
        return !isBlocked && !isBlockedBy;
    });
}

// --- Load danh sách chat ---
function loadChatList() {
    const chatListRef = ref(db, 'chats');
    onValue(chatListRef, async snap => {
        const chats = [];
        snap.forEach(child => {
            const chat = child.val();
            chat.id = child.key;
            if (chat.members && chat.members.includes(getCurrentUser().uid)) {
                chats.push(chat);
            }
        });
        
        // Lọc người bị chặn
        const filteredChats = await filterBlockedUsers(chats);
        allChats = filteredChats.reverse();
        renderChatList();
    });
}

// --- Render danh sách chat ---
function renderChatList() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    let filtered = allChats;
    if (chatFilter === 'unread') {
        filtered = filtered.filter(chat => chat.lastMessage && !chat.lastRead || (chat.lastRead && chat.lastRead[getCurrentUser().uid] < chat.lastMessageTime));
    } else if (chatFilter === 'recent') {
        filtered = filtered.slice(0, 10);
    }
    const search = document.getElementById('chatSearchInput').value.trim().toLowerCase();
    if (search) {
        filtered = filtered.filter(chat => {
            const name = getChatDisplayName(chat);
            return name.toLowerCase().includes(search);
        });
    }
    if (filtered.length === 0) {
        document.getElementById('noChats').style.display = 'block';
        return;
    } else {
        document.getElementById('noChats').style.display = 'none';
    }
    filtered.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'chat-item' + (currentChatId === chat.id ? ' active' : '');
        div.onclick = () => openChat(chat.id);
        div.innerHTML = `
            <div class="chat-avatar"><i class='fa-solid fa-circle-user' style='font-size: 36px; color: #222;'></i></div>
            <div class="chat-info">
                <div class="chat-title">${getChatDisplayName(chat)}</div>
                <div class="chat-last">${chat.lastMessage ? chat.lastMessage.slice(0, 32) : ''}</div>
            </div>
            <div class="chat-meta">
                <span class="chat-time">${chat.lastMessageTime ? timeAgo(chat.lastMessageTime) : ''}</span>
                ${chat.lastRead && chat.lastRead[getCurrentUser().uid] < chat.lastMessageTime ? '<span class="badge-unread"></span>' : ''}
            </div>
        `;
        chatList.appendChild(div);
    });
}

// --- Hàm lấy tên hiển thị cho chat ---
function getChatDisplayName(chat) {
    const currentUid = getCurrentUser().uid;
    
    if (currentUid === chat.sellerId) {
        return chat.buyerName || 'Người mua';
    }
    else if (currentUid === chat.buyerId) {
        return chat.sellerName || 'Người bán';
    }
    else {
        return chat.sellerName || chat.buyerName || 'Ẩn danh';
    }
}

window.filterChats = function(type) {
    chatFilter = type;
    document.querySelectorAll('.chat-tab').forEach(btn => btn.classList.remove('active'));
    if (type === 'all') document.querySelector('.chat-tab').classList.add('active');
    else if (type === 'unread') document.querySelectorAll('.chat-tab')[1].classList.add('active');
    else document.querySelectorAll('.chat-tab')[2].classList.add('active');
    renderChatList();
};

document.getElementById('chatSearchInput').oninput = renderChatList;

function openChat(chatId) {
    currentChatId = chatId;
    renderChatList();
    document.getElementById('chatRoomHeader').style.display = '';
    document.getElementById('chatInputContainer').style.display = '';
    loadChatRoom(chatId);
}

let chatRoomListener = null;
function loadChatRoom(chatId) {
    if (chatRoomListener) chatRoomListener();
    if (chatMetaListener) chatMetaListener();

    const chatRef = ref(db, 'chats/' + chatId);
    const messagesRef = ref(db, 'messages/' + chatId);

    let currentChatObject = null;
    let currentMessages = [];

    const rerender = () => {
        if (currentChatObject && currentMessages.length > 0) {
            renderMessages(currentMessages, currentChatObject);
            scrollToBottom();
        }
    };

    chatMetaListener = onValue(chatRef, (snap) => {
        currentChatObject = snap.val();
        if (currentChatObject) {
            renderChatHeader(currentChatObject);
            rerender();
        }
    });

    chatRoomListener = onValue(messagesRef, (snap) => {
        const messages = [];
        snap.forEach(childSnap => {
            const msg = childSnap.val();
            msg.id = childSnap.key; 
            messages.push(msg);
        });
        currentMessages = messages;
        rerender();
    });

    const lastReadRef = ref(db, 'chats/' + chatId + '/lastRead/' + getCurrentUser().uid);
    set(lastReadRef, Date.now());
}

function renderMessages(messages, chat) {
    const box = document.getElementById('chatMessages');
    box.innerHTML = ''; 
    const currentUid = getCurrentUser().uid;

    const sellerId = chat.sellerId;
    const buyerId = chat.buyerId;

    messages.forEach((msg, index) => {
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        const isGroupedWithPrevious = prevMsg && prevMsg.senderId === msg.senderId;
        
        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
        
        const div = document.createElement('div');
        const isMe = msg.senderId === currentUid;
        
        div.className = 'message' + (isMe ? ' me' : '') + (isGroupedWithPrevious ? ' grouped' : '');

        let label = '';
        if (!isGroupedWithPrevious) {
            if (isMe) {
                label = `<span class="msg-label" style="color:#fcb69f;font-weight:600;">Bạn:</span>`;
            } else {
                if (currentUid === sellerId) {
                    label = `<span class="msg-label" style="color:#888;font-weight:600;">Người mua:</span>`;
                } else if (currentUid === buyerId) {
                    label = `<span class="msg-label" style="color:#888;font-weight:600;">Người bán:</span>`;
                } else {
                    label = `<span class="msg-label" style="color:#888;font-weight:600;">Đối phương:</span>`;
                }
            }
        }

        div.innerHTML = `
            <div class="message-content">
                ${label ? `<div class="message-label">${label}</div>` : ''}
                <div class="message-text">${escapeHTML(msg.text)}</div>
                ${isLastInGroup ? `<div class="message-time">${formatTime(msg.time)}</div>` : ''}
            </div>
        `;
        box.appendChild(div);
    });
}

// --- Render header chat room ---
function renderChatHeader(chat) {
    const el = document.getElementById('chatRoomHeader');
    el.innerHTML = `
        <div class="room-avatar"><i class='fa-solid fa-circle-user' style='font-size: 40px; color: #222;'></i></div>
        <div class="room-info">
            <div class="room-title">${getChatDisplayName(chat)}</div>
            <div class="room-product">${chat.productName ? `<i class='bx bx-purchase-tag'></i> ${chat.productName}` : ''}</div>
        </div>
        <button class="room-more" onclick="showRoomMenu()"><i class='bx bx-dots-vertical-rounded'></i></button>
    `;
}

// --- Gửi tin nhắn ---
window.sendMessage = async function() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !currentChatId) return;
    
    // Kiểm tra xem có bị chặn không
    const currentUid = getCurrentUser().uid;
    const chatRef = ref(db, 'chats/' + currentChatId);
    const chatSnap = await get(chatRef);
    
    if (chatSnap.exists()) {
        const chat = chatSnap.val();
        const otherUserId = currentUid === chat.sellerId ? chat.buyerId : chat.sellerId;
        
        const isBlocked = await isUserBlocked(otherUserId);
        const isBlockedBy = await isUserBlockedBy(otherUserId);
        
        if (isBlocked) {
            alert('Bạn đã chặn người này. Không thể gửi tin nhắn.');
            return;
        }
        
        if (isBlockedBy) {
            alert('Bạn đã bị chặn bởi người này. Không thể gửi tin nhắn.');
            return;
        }
    }
    
    const msg = {
        senderId: getCurrentUser().uid,
        senderName: getCurrentUser().displayName || 'Ẩn danh',
        senderAvatar: getCurrentUser().photoURL || '',
        text,
        time: Date.now()
    };
    const msgRef = push(ref(db, 'messages/' + currentChatId));
    set(msgRef, msg);
    // Cập nhật lastMessage
    update(ref(db, 'chats/' + currentChatId), {
        lastMessage: text,
        lastMessageTime: msg.time
    });
    input.value = '';
};

window.showRoomMenu = function() {
    const dropdown = document.getElementById('roomMenuDropdown');
    const isVisible = dropdown.classList.contains('show');
    
    document.querySelectorAll('.room-menu-dropdown.show').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('show');
        }
    });
    
    dropdown.classList.toggle('show');
    
    if (!isVisible) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!e.target.closest('.room-more') && !e.target.closest('.room-menu-dropdown')) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }
};

window.deleteChat = function() {
    if (!currentChatId) return;
    
    if (confirm('Bạn có chắc chắn muốn xóa đoạn chat này? Hành động này không thể hoàn tác.')) {
        const chatRef = ref(db, 'chats/' + currentChatId);
        const messagesRef = ref(db, 'messages/' + currentChatId);
        
        set(messagesRef, null).then(() => {
            set(chatRef, null).then(() => {
                alert('Đã xóa đoạn chat thành công!');
                currentChatId = null;
                document.getElementById('chatRoomHeader').style.display = 'none';
                document.getElementById('chatInputContainer').style.display = 'none';
                document.getElementById('chatMessages').innerHTML = '';
                document.getElementById('roomMenuDropdown').classList.remove('show');
            }).catch(error => {
                console.error('Lỗi khi xóa chat:', error);
                alert('Có lỗi xảy ra khi xóa đoạn chat!');
            });
        }).catch(error => {
            console.error('Lỗi khi xóa messages:', error);
            alert('Có lỗi xảy ra khi xóa tin nhắn!');
        });
    }
};

// --- Cải thiện hàm blockUser với tùy chọn bỏ chặn ---
window.blockUser = function() {
    if (!currentChatId) return;
    
    const currentUid = getCurrentUser().uid;
    const chatRef = ref(db, 'chats/' + currentChatId);
    
    get(chatRef).then(snap => {
        if (snap.exists()) {
            const chat = snap.val();
            const otherUserId = currentUid === chat.sellerId ? chat.buyerId : chat.sellerId;
            const otherUserName = currentUid === chat.sellerId ? chat.buyerName : chat.sellerName;
            
            // Kiểm tra xem đã chặn chưa
            isUserBlocked(otherUserId).then(alreadyBlocked => {
                if (alreadyBlocked) {
                    // Nếu đã chặn rồi, hỏi có muốn bỏ chặn không
                    if (confirm(`${otherUserName || 'Người này'} đã bị chặn.\n\nBạn có muốn bỏ chặn không?`)) {
                        unblockUser(otherUserId);
                    }
                } else {
                    // Nếu chưa chặn, hỏi có muốn chặn không
                    if (confirm(`Bạn có chắc chắn muốn chặn ${otherUserName || 'người này'}?\n\nSau khi chặn:\n• Không thể nhận/gửi tin nhắn\n• Chat sẽ bị xóa\n• Không thể tạo chat mới\n\nBạn có thể bỏ chặn sau trong "Quản lý danh sách chặn"`)) {
                        // Thêm vào danh sách blocked users
                        const blockedRef = ref(db, `users/${currentUid}/blocked/${otherUserId}`);
                        set(blockedRef, {
                            userId: otherUserId,
                            userName: otherUserName,
                            blockedAt: Date.now(),
                            chatId: currentChatId
                        }).then(() => {
                            alert(`Đã chặn ${otherUserName || 'người này'} thành công!\n\nĐể bỏ chặn:\n• Click vào icon tài khoản\n• Chọn "Quản lý danh sách chặn"\n• Click "Bỏ chặn" bên cạnh tên người đó`);
                            document.getElementById('roomMenuDropdown').classList.remove('show');
                            
                            // Tự động xóa chat sau khi chặn
                            deleteChat();
                        }).catch(error => {
                            console.error('Lỗi khi chặn người dùng:', error);
                            alert('Có lỗi xảy ra khi chặn người dùng!');
                        });
                    }
                }
            });
        }
    });
};

// --- Cải thiện hàm unblockUser với thông báo chi tiết ---
window.unblockUser = function(userId) {
    const currentUid = getCurrentUser().uid;
    const blockedRef = ref(db, `users/${currentUid}/blocked/${userId}`);
    
    // Lấy thông tin người bị chặn trước khi xóa
    get(blockedRef).then(snap => {
        if (snap.exists()) {
            const blockedUser = snap.val();
            
            set(blockedRef, null).then(() => {
                alert(`Đã bỏ chặn ${blockedUser.userName || 'người dùng'} thành công!\n\nBây giờ bạn có thể:\n• Nhận tin nhắn từ họ\n• Gửi tin nhắn cho họ\n• Tạo chat mới với họ`);
                loadBlockedUsers(); // Reload danh sách
                
                // Nếu đang ở trong modal, đóng nó sau 2 giây
                setTimeout(() => {
                    if (document.getElementById('blockedUsersModal').style.display === 'block') {
                        closeBlockedUsersModal();
                    }
                }, 2000);
            }).catch(error => {
                console.error('Lỗi khi bỏ chặn:', error);
                alert('Có lỗi xảy ra khi bỏ chặn!');
            });
        }
    });
};

// --- Thêm hàm bỏ chặn tất cả ---
window.unblockAllUsers = function() {
    if (confirm('Bạn có chắc chắn muốn bỏ chặn tất cả người dùng?\n\nHành động này không thể hoàn tác.')) {
        const currentUid = getCurrentUser().uid;
        const blockedRef = ref(db, `users/${currentUid}/blocked`);
        
        set(blockedRef, null).then(() => {
            alert('Đã bỏ chặn tất cả người dùng thành công!');
            loadBlockedUsers();
        }).catch(error => {
            console.error('Lỗi khi bỏ chặn tất cả:', error);
            alert('Có lỗi xảy ra khi bỏ chặn tất cả!');
        });
    }
};

window.reportUser = function() {
    if (!currentChatId) return;
    
    const currentUid = getCurrentUser().uid;
    const chatRef = ref(db, 'chats/' + currentChatId);
    
    get(chatRef).then(snap => {
        if (snap.exists()) {
            const chat = snap.val();
            const otherUserId = currentUid === chat.sellerId ? chat.buyerId : chat.sellerId;
            const otherUserName = currentUid === chat.sellerId ? chat.buyerName : chat.sellerName;
            
            const reportReason = prompt(
                `Báo cáo ${otherUserName || 'người này'}:\n\n` +
                'Vui lòng chọn lý do báo cáo:\n' +
                '1. Spam hoặc quảng cáo không mong muốn\n' +
                '2. Nội dung không phù hợp\n' +
                '3. Hành vi lừa đảo\n' +
                '4. Quấy rối hoặc đe dọa\n' +
                '5. Lý do khác\n\n' +
                'Nhập số tương ứng với lý do báo cáo:'
            );
            
            if (reportReason && reportReason.trim()) {
                const reasons = [
                    'Spam hoặc quảng cáo không mong muốn',
                    'Nội dung không phù hợp', 
                    'Hành vi lừa đảo',
                    'Quấy rối hoặc đe dọa',
                    'Lý do khác'
                ];
                
                const reasonText = reasons[parseInt(reportReason) - 1] || 'Lý do khác';
                
                const reportRef = ref(db, 'reports');
                const newReportRef = push(reportRef);
                set(newReportRef, {
                    reporterId: currentUid,
                    reporterName: getCurrentUser().displayName || 'Ẩn danh',
                    reportedUserId: otherUserId,
                    reportedUserName: otherUserName,
                    chatId: currentChatId,
                    reason: reasonText,
                    reportedAt: Date.now(),
                    status: 'pending'
                }).then(() => {
                    alert('Báo cáo đã được gửi thành công! Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
                    document.getElementById('roomMenuDropdown').classList.remove('show');
                }).catch(error => {
                    console.error('Lỗi khi gửi báo cáo:', error);
                    alert('Có lỗi xảy ra khi gửi báo cáo!');
                });
            }
        }
    });
};

function timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return Math.floor(diff/60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff/3600) + ' giờ trước';
    return new Date(ts).toLocaleDateString('vi-VN');
}
function formatTime(ts) {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
}
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]));
}
function scrollToBottom() {
    const box = document.getElementById('chatMessages');
    box.scrollTop = box.scrollHeight;
}

window.attachFile = function() { alert('Tính năng gửi file sẽ cập nhật sau!'); };
window.toggleEmoji = function() { alert('Tính năng emoji sẽ cập nhật sau!'); };

window.onload = function() {
    document.getElementById('messageInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Đóng modal khi click ra ngoài
    window.addEventListener('click', function(e) {
        const blockedModal = document.getElementById('blockedUsersModal');
        if (e.target === blockedModal) {
            closeBlockedUsersModal();
        }
    });
};

// --- Hiển thị modal danh sách người bị chặn ---
window.showBlockedUsers = function() {
    document.getElementById('blockedUsersModal').style.display = 'block';
    loadBlockedUsers();
};

// --- Đóng modal danh sách người bị chặn ---
window.closeBlockedUsersModal = function() {
    document.getElementById('blockedUsersModal').style.display = 'none';
};

// --- Load danh sách người bị chặn ---
async function loadBlockedUsers() {
    const currentUid = getCurrentUser().uid;
    const blockedRef = ref(db, `users/${currentUid}/blocked`);
    const blockedList = document.getElementById('blockedUsersList');
    
    try {
        const snapshot = await get(blockedRef);
        const blockedUsers = [];
        
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const user = child.val();
                user.id = child.key;
                blockedUsers.push(user);
            });
        }
        
        if (blockedUsers.length === 0) {
            blockedList.innerHTML = `
                <div class="no-blocked-users">
                    <i class="bx bx-user-check"></i>
                    <h4>Chưa có ai bị chặn</h4>
                    <p>Danh sách người bị chặn sẽ hiển thị ở đây</p>
                </div>
            `;
        } else {
            // Thêm header với nút bỏ chặn tất cả
            const headerHtml = `
                <div class="blocked-users-actions">
                    <span class="blocked-count">${blockedUsers.length} người bị chặn</span>
                    <button class="btn-unblock-all" onclick="unblockAllUsers()">
                        <i class="bx bx-user-check"></i> Bỏ chặn tất cả
                    </button>
                </div>
            `;
            
            const usersHtml = blockedUsers.map(user => `
                <div class="blocked-user-item">
                    <div class="blocked-user-info">
                        <div class="blocked-user-avatar">
                            ${user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="blocked-user-details">
                            <h4>${user.userName || 'Người dùng'}</h4>
                            <p>Bị chặn từ ${formatBlockedDate(user.blockedAt)}</p>
                        </div>
                    </div>
                    <button class="btn-unblock" onclick="unblockUser('${user.id}')">
                        <i class="bx bx-user-check"></i> Bỏ chặn
                    </button>
                </div>
            `).join('');
            
            blockedList.innerHTML = headerHtml + usersHtml;
        }
    } catch (error) {
        console.error('Lỗi khi load danh sách chặn:', error);
        blockedList.innerHTML = `
            <div class="no-blocked-users">
                <i class="bx bx-error"></i>
                <h4>Có lỗi xảy ra</h4>
                <p>Không thể tải danh sách người bị chặn</p>
            </div>
        `;
    }
}

// --- Format ngày bị chặn ---
function formatBlockedDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'hôm qua';
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
} 