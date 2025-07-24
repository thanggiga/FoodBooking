import { initializeApp, getAuth, getDatabase, ref, push, set, onValue, remove, update } from "./firebase.js";

const firebaseConfig = {
  apiKey: "AIzaSyCisUCcjEU0DVZs0xkRVjBqgFykm0Ayl1M",
  authDomain: "foodbooking-dt2025.firebaseapp.com",
  databaseURL: "https://foodbooking-dt2025-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "foodbooking-dt2025",
  storageBucket: "foodbooking-dt2025.firebasestorage.app",
  messagingSenderId: "829019412638",
  appId: "1:829019412638:web:7ec978e55f9d769d3bc38f",
  measurementId: "G-P4MQBH2M1J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export const products = {
  p1: {
    id: "p1",
    name: "Bánh mì thập cẩm",
    description: "Bánh ngon - ăn đã",
    price: 15000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126020/banh_mi_nwusic.jpg",
    ownerID: "admin",
    category: "food"
  },
  p2: {
    id: "p2",
    name: "Bánh mì thịt nướng",
    description: "Phục vụ nhanh - nóng",
    price: 20000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126020/banh_mi_2_ghkxvh.jpg",
    ownerID: "admin",
    category: "food"
  },
  p3: {
    id: "p3",
    name: "Bún đậu mắm tôm",
    description: "Đậm chất bản sắc Việt Nam",
    price: 35000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/bun_dau_sjovti.jpg",
    ownerID: "admin",
    category: "food"
  },
  p4: {
    id: "p4",
    name: "Chè",
    description: "Inbox cho shop chọn loại",
    price: 20000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/che_idkrdv.jpg",
    ownerID: "admin",
    category: "dessert"
  },
  p5: {
    id: "p5",
    name: "Trà sữa",
    description: "Inbox shop chọn vị / size",
    price: 25000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/nuoc_dcrur4.jpg",
    ownerID: "admin",
    category: "drink"
  },
  p6: {
    id: "p6",
    name: "Cơm gà",
    description: "Nóng hổi nóng hổi! \nib shop nếu muốn thêm bớt món",
    price: 35000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/com_ga_nbgu9j.jpg",
    ownerID: "admin",
    category: "food"
  },
  p7: {
    id: "p7",
    name: "Combo gà cho 2 người",
    description: "Có ngay trong 10 phút!",
    price: 145000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/combo_ga_2ng_gljbvj.jpg",
    ownerID: "admin",
    category: "food"
  },
  p8: {
    id: "p8",
    name: "Combo premium",
    description: "From Kimsa \nib tư vấn kĩ hơn",
    price: 300000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/combo_trua_zdee3q.jpg",
    ownerID: "admin",
    category: "food"
  },
  p9: {
    id: "p9",
    name: "Dâu tằm thanh mát",
    description: "HIGHLANDS",
    price: 45000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/dautam_hailen_sddxkv.png",
    ownerID: "admin",
    category: "drink"
  },
  p10: {
    id: "p10",
    name: "Sinh tố",
    description: "Inbox cho shop chọn vị",
    price: 30000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126018/sinh_to_g9po1g.jpg",
    ownerID: "admin",
    category: "drink"
  },
  p11: {
    id: "p11",
    name: "Bánh hamburger",
    description: "Vỏ mềm - bánh nóng",
    price: 30000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/hamburger_hnyktl.jpg",
    ownerID: "admin",
    category: "food"
  },
  p12: {
    id: "p12",
    name: "Trà sữa Đài Loan",
    description: "Phục vụ nhanh, ib shop chọn vị khi order",
    price: 22000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/tra_sua_dai_loan_yyfpbi.jpg",
    ownerID: "admin",
    category: "drink"
  },
  p13: {
    id: "p13",
    name: "Trà sữa TocoToco - Nguyên bản",
    description: "Vị nguyên bản Toco, Inbox shop chọn vị / size",
    price: 35000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/tra_sua_toco_s38mpv.jpg",
    ownerID: "admin",
    category: "drink"
  },
  p14: {
    id: "p14",
    name: "Trà sữa Chago",
    description: "Inbox shop chọn vị / size",
    price: 32000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/chago_sbo0zf.jpg",
    ownerID: "admin",
    category: "drink"
  },
  p15: {
    id: "p15",
    name: "Trà sữa TocoToco",
    description: "Inbox shop chọn vị / size",
    price: 33000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/tra_sua_toco_2_y6tvts.jpg",
    ownerID: "admin",
    category: "drink"
  },
  p16: {
    id: "p16",
    name: "Sữa chua kem",
    description: "Mát siêu mát - mê siêu mê",
    price: 23000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/sua_chua_kuaseu.jpg",
    ownerID: "admin",
    category: "dessert"
  },
  p17: {
    id: "p17",
    name: "Combo hoa quả",
    description: "Nhớ ib shop chọn loại khi order nha ạ!",
    price: 24000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126020/trai_cay_t4lwom.jpg",
    ownerID: "admin",
    category: "dessert"
  },
  p18: {
    id: "p18",
    name: "Trà sữa TocoToco matcha",
    description: "ib chọn size nha ạ",
    price: 25000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/toco_matcha_a6hcbi.jpg",
    ownerID: "admin",
    category: "drink"
  },
  p19: {
    id: "p19",
    name: "TocoToco đào",
    description: "ib chọn size ạ",
    price: 25000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/toco_dao_nu7wta.png",
    ownerID: "admin",
    category: "drink"
  },
  p20: {
    id: "p20",
    name: "Combo thịt bò",
    description: "Lẩu / nướng",
    price: 99000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/thit_bo_ssucw9.jpg",
    ownerID: "admin",
    category: "food"
  },
  p21: {
    id: "p21",
    name: "Xôi chiên",
    description: "Xôi ngon - nóng hổi",
    price: 15000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126020/xoi_chien_szohxv.jpg",
    ownerID: "admin",
    category: "food"
  },
  p22: {
    id: "p22",
    name: "Chân gà rút xương sốt cay",
    description: "Phục vụ nhanh - nóng",
    price: 42000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/Chan_ga_sot_mfydjn.jpg",
    ownerID: "admin",
    category: "food"
  },
  p23: {
    id: "p23",
    name: "Gà rán quốc dân",
    description: "Gà ngon - bổ - rẻ cho mọi nhà",
    price: 20000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/ga_ran_sxfavc.jpg",
    ownerID: "admin",
    category: "food"
  },
  p24: {
    id: "p24",
    name: "Combo gà + hamburger",
    description: "Inbox shop tư vấn thêm",
    price: 190000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/combo_ga_fy7k1x.jpg",
    ownerID: "admin",
    category: "food"
  },
  p25: {
    id: "p25",
    name: "Cà phê HIGHLANDS",
    description: "HIGHLANDS",
    price: 35000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/ca_phe_wf03oh.jpg",
    ownerID: "admin",
    category: "drink"
  }
};

set(ref(db, "products"), products)
  .then(() => alert("Đã đẩy dữ liệu sản phẩm thành công lên Firebase!"))
  .catch((error) => console.error("Lỗi khi đẩy sản phẩm:", error));
