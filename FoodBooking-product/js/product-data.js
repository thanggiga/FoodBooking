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
    category: "food",
    ingredients: {
      i1: "Bánh mì",
      i2: "Chả lụa",
      i3: "Thịt nguội",
      i4: "Dưa leo",
      i5: "Nước sốt"
    },
    nutrition: {
      calo: 300,
      protein: 12,
      fat: 10,
      carb: 40,
      vitaminC: 2,
      canxi: 20,
      sat: 1.0,
      kẽm: 0.6
    }
  },
  p2: {
    id: "p2",
    name: "Bánh mì thịt nướng",
    description: "Phục vụ nhanh - nóng",
    price: 20000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126020/banh_mi_2_ghkxvh.jpg",
    ownerID: "admin",
    category: "food",
    ingredients: {
      i1: "Bánh mì",
      i2: "Thịt nướng",
      i3: "Rau thơm",
      i4: "Dưa chua",
      i5: "Sốt đặc biệt"
    },
    nutrition: {
      calo: 350,
      protein: 14,
      fat: 12,
      carb: 42,
      vitaminC: 3,
      canxi: 25,
      sat: 1.3,
      kẽm: 0.8
    }
  },
  p3: {
    id: "p3",
    name: "Bún đậu mắm tôm",
    description: "Đậm chất bản sắc Việt Nam",
    price: 35000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/bun_dau_sjovti.jpg",
    ownerID: "admin",
    category: "food",
    ingredients: {
      i1: "Bún",
      i2: "Đậu hũ",
      i3: "Chả cốm",
      i4: "Thịt luộc",
      i5: "Mắm tôm"
    },
    nutrition: {
      calo: 500,
      protein: 20,
      fat: 15,
      carb: 60,
      vitaminC: 6,
      canxi: 35,
      sat: 1.5,
      kẽm: 1.0
    }
  },
  p4: {
    id: "p4",
    name: "Chè",
    description: "Inbox cho shop chọn loại",
    price: 20000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/che_idkrdv.jpg",
    ownerID: "admin",
    category: "dessert",
    ingredients: {
      i1: "Đậu xanh",
      i2: "Nước cốt dừa",
      i3: "Đường",
      i4: "Bột báng",
      i5: "Thạch"
    },
    nutrition: {
      calo: 220,
      protein: 6,
      fat: 5,
      carb: 40,
      vitaminC: 1,
      canxi: 15,
      sat: 0.7,
      kẽm: 0.3
    }
  },
  p5: {
    id: "p5",
    name: "Trà sữa",
    description: "Inbox shop chọn vị / size",
    price: 25000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/nuoc_dcrur4.jpg",
    ownerID: "admin",
    category: "drink",
    ingredients: {
      i1: "Trà",
      i2: "Sữa",
      i3: "Đường",
      i4: "Trân châu",
      i5: "Đá viên"
    },
    nutrition: {
      calo: 320,
      protein: 4,
      fat: 7,
      carb: 58,
      vitaminC: 2,
      canxi: 45,
      sat: 0.6,
      kẽm: 0.4
    }
  },
  p6: {
    id: "p6",
    name: "Cơm gà",
    description: "Nóng hổi nóng hổi! \nib shop nếu muốn thêm bớt món",
    price: 35000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/com_ga_nbgu9j.jpg",
    ownerID: "admin",
    category: "food",
    ingredients: {
      i1: "Cơm",
      i2: "Gà",
      i3: "Dưa leo",
      i4: "Hành phi",
      i5: "Nước mắm"
    },
    nutrition: {
      calo: 600,
      protein: 28,
      fat: 18,
      carb: 65,
      vitaminC: 4,
      canxi: 30,
      sat: 1.6,
      kẽm: 1.0
    }
  },
  p7: {
    id: "p7",
    name: "Combo gà cho 2 người",
    description: "Có ngay trong 10 phút!",
    price: 145000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/combo_ga_2ng_gljbvj.jpg",
    ownerID: "admin",
    category: "food",
    ingredients: {
      i1: "Gà rán",
      i2: "Khoai tây chiên",
      i3: "Nước ngọt",
      i4: "Bánh mì",
      i5: "Sốt"
    },
    nutrition: {
      calo: 1100,
      protein: 45,
      fat: 55,
      carb: 95,
      vitaminC: 5,
      canxi: 60,
      sat: 3.5,
      kẽm: 2.2
    }
  },
  p8: {
    id: "p8",
    name: "Combo premium",
    description: "From Kimsa \nib tư vấn kĩ hơn",
    price: 300000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/combo_trua_zdee3q.jpg",
    ownerID: "admin",
    category: "food",
    ingredients: {
      i1: "Thịt bò",
      i2: "Gà",
      i3: "Rau củ",
      i4: "Tráng miệng",
      i5: "Nước uống"
    },
    nutrition: {
      calo: 1400,
      protein: 60,
      fat: 70,
      carb: 110,
      vitaminC: 18,
      canxi: 90,
      sat: 4.5,
      kẽm: 3.5
    }
  },
  p9: {
    id: "p9",
    name: "Dâu tằm thanh mát",
    description: "HIGHLANDS",
    price: 45000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/dautam_hailen_sddxkv.png",
    ownerID: "admin",
    category: "drink",
    ingredients: {
      i1: "Dâu tằm",
      i2: "Nước",
      i3: "Đường",
      i4: "Đá viên",
      i5: "Lá bạc hà"
    },
    nutrition: {
      calo: 180,
      protein: 1,
      fat: 0,
      carb: 45,
      vitaminC: 25,
      canxi: 15,
      sat: 0.1,
      kẽm: 0.3
    }
  },
  p10: {
    id: "p10",
    name: "Sinh tố",
    description: "Inbox cho shop chọn vị",
    price: 30000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126018/sinh_to_g9po1g.jpg",
    ownerID: "admin",
    category: "drink",
    ingredients: {
      i1: "Trái cây",
      i2: "Sữa",
      i3: "Đường",
      i4: "Đá xay",
      i5: "Siro"
    },
    nutrition: {
      calo: 280,
      protein: 3,
      fat: 2,
      carb: 60,
      vitaminC: 30,
      canxi: 40,
      sat: 0.2,
      kẽm: 0.3
    }
  },
  p11: {
    id: "p11",
    name: "Bánh hamburger",
    description: "Vỏ mềm - bánh nóng",
    price: 30000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/hamburger_hnyktl.jpg",
    ownerID: "admin",
    category: "food",
    ingredients: {
      i1: "Bánh mì",
      i2: "Thịt bò",
      i3: "Xà lách",
      i4: "Cà chua",
      i5: "Sốt"
    },
    nutrition: {
      calo: 520,
      protein: 25,
      fat: 22,
      carb: 55,
      vitaminC: 4,
      canxi: 35,
      sat: 1.8,
      kẽm: 1.6
    }
  },
  p12: {
    id: "p12",
    name: "Trà sữa Đài Loan",
    description: "Phục vụ nhanh, ib shop chọn vị khi order",
    price: 22000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/tra_sua_dai_loan_yyfpbi.jpg",
    ownerID: "admin",
    category: "drink",
    ingredients: {
      i1: "Trà",
      i2: "Sữa",
      i3: "Đường",
      i4: "Trân châu",
      i5: "Đá"
    },
    nutrition: {
      calo: 310,
      protein: 4,
      fat: 6,
      carb: 56,
      vitaminC: 1,
      canxi: 35,
      sat: 0.4,
      kẽm: 0.3
    }
  },
  p13: {
    id: "p13",
    name: "Trà sữa TocoToco - Nguyên bản",
    description: "Vị nguyên bản Toco, Inbox shop chọn vị / size",
    price: 35000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/tra_sua_toco_s38mpv.jpg",
    ownerID: "admin",
    category: "drink",
    ingredients: {
      i1: "Trà",
      i2: "Sữa",
      i3: "Đường",
      i4: "Trân châu",
      i5: "Đá"
    },
    nutrition: {
      calo: 340,
      protein: 5,
      fat: 8,
      carb: 60,
      vitaminC: 3,
      canxi: 40,
      sat: 0.5,
      kẽm: 0.4
    }
  },
  p14: {
    id: "p14",
    name: "Trà sữa Chago",
    description: "Inbox shop chọn vị / size",
    price: 32000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/chago_sbo0zf.jpg",
    ownerID: "admin",
    category: "drink",
    ingredients: {
      i1: "Trà",
      i2: "Sữa",
      i3: "Đường",
      i4: "Trân châu",
      i5: "Đá"
    },
    nutrition: {
      calo: 330,
      protein: 4,
      fat: 7,
      carb: 58,
      vitaminC: 2,
      canxi: 38,
      sat: 0.5,
      kẽm: 0.4
    }
  },
  p15: {
    id: "p15",
    name: "Trà sữa TocoToco",
    description: "Inbox shop chọn vị / size",
    price: 33000,
    imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/tra_sua_toco_2_y6tvts.jpg",
    ownerID: "admin",
    category: "drink",
    ingredients: {
      i1: "Trà",
      i2: "Sữa",
      i3: "Đường",
      i4: "Trân châu",
      i5: "Đá"
    },
    nutrition: {
      calo: 335,
      protein: 5,
      fat: 7,
      carb: 59,
      vitaminC: 2,
      canxi: 37,
      sat: 0.5,
      kẽm: 0.4
    }
  },
  p16: {
    id: "p16",
      name: "Sữa chua kem",
      description: "Mát siêu mát - mê siêu mê",
      price: 23000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/sua_chua_kuaseu.jpg",
      ownerID: "admin",
      category: "dessert",
      ingredients: {
        i1: "Sữa chua",
        i2: "Kem tươi",
        i3: "Đường",
        i4: "Trái cây",
        i5: "Thạch trái cây"
      },
      nutrition: {
        calo: 240,
        protein: 6,
        fat: 5,
        carb: 42,
        vitaminC: 8,
        canxi: 100,
        sat: 1.2,
        kẽm: 0.7
      }
    },
    p17: {
      id: "p17",
      name: "Combo hoa quả",
      description: "Nhớ ib shop chọn loại khi order nha ạ!",
      price: 24000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126020/trai_cay_t4lwom.jpg",
      ownerID: "admin",
      category: "dessert",
      ingredients: {
        i1: "Dưa hấu",
        i2: "Ổi",
        i3: "Xoài",
        i4: "Dứa",
        i5: "Nho"
      },
      nutrition: {
        calo: 180,
        protein: 2,
        fat: 0,
        carb: 45,
        vitaminC: 35,
        canxi: 30,
        sat: 0.4,
        kẽm: 0.2
      }
    },
    p18: {
      id: "p18",
      name: "Trà sữa TocoToco matcha",
      description: "ib chọn size nha ạ",
      price: 25000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/toco_matcha_a6hcbi.jpg",
      ownerID: "admin",
      category: "drink",
      ingredients: {
        i1: "Bột matcha",
        i2: "Sữa",
        i3: "Đường",
        i4: "Trân châu",
        i5: "Đá viên"
      },
      nutrition: {
        calo: 360,
        protein: 5,
        fat: 9,
        carb: 62,
        vitaminC: 4,
        canxi: 50,
        sat: 0.6,
        kẽm: 0.5
      }
    },
    p19: {
      id: "p19",
      name: "TocoToco đào",
      description: "ib chọn size ạ",
      price: 25000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/toco_dao_nu7wta.png",
      ownerID: "admin",
      category: "drink",
      ingredients: {
        i1: "Trà đào",
        i2: "Miếng đào",
        i3: "Đường",
        i4: "Đá viên",
        i5: "Thạch đào"
      },
      nutrition: {
        calo: 300,
        protein: 1,
        fat: 0,
        carb: 70,
        vitaminC: 12,
        canxi: 20,
        sat: 0.2,
        kẽm: 0.3
      }
    },
    p20: {
      id: "p20",
      name: "Combo thịt bò",
      description: "Lẩu / nướng",
      price: 99000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126019/thit_bo_ssucw9.jpg",
      ownerID: "admin",
      category: "food",
      ingredients: {
        i1: "Thịt bò",
        i2: "Rau xanh",
        i3: "Nấm",
        i4: "Mì",
        i5: "Sốt lẩu"
      },
      nutrition: {
        calo: 780,
        protein: 40,
        fat: 35,
        carb: 60,
        vitaminC: 15,
        canxi: 70,
        sat: 3.0,
        kẽm: 2.8
      }
    },
    p21: {
      id: "p21",
      name: "Xôi chiên",
      description: "Xôi ngon - nóng hổi",
      price: 15000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126020/xoi_chien_szohxv.jpg",
      ownerID: "admin",
      category: "food",
      ingredients: {
        i1: "Gạo nếp",
        i2: "Chả lụa",
        i3: "Dầu ăn",
        i4: "Hành phi",
        i5: "Tương ớt"
      },
      nutrition: {
        calo: 420,
        protein: 10,
        fat: 18,
        carb: 55,
        vitaminC: 2,
        canxi: 20,
        sat: 1.1,
        kẽm: 0.6
      }
    },
    p22: {
      id: "p22",
      name: "Chân gà rút xương sốt cay",
      description: "Phục vụ nhanh - nóng",
      price: 42000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/Chan_ga_sot_mfydjn.jpg",
      ownerID: "admin",
      category: "food",
      ingredients: {
        i1: "Chân gà",
        i2: "Sốt cay",
        i3: "Tỏi",
        i4: "Ớt",
        i5: "Dưa leo"
      },
      nutrition: {
        calo: 380,
        protein: 18,
        fat: 22,
        carb: 15,
        vitaminC: 3,
        canxi: 35,
        sat: 2.0,
        kẽm: 1.1
      }
    },
    p23: {
      id: "p23",
      name: "Gà rán quốc dân",
      description: "Gà ngon - bổ - rẻ cho mọi nhà",
      price: 20000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126022/ga_ran_sxfavc.jpg",
      ownerID: "admin",
      category: "food",
      ingredients: {
        i1: "Gà",
        i2: "Bột chiên",
        i3: "Gia vị",
        i4: "Dầu chiên",
        i5: "Tương ớt"
      },
      nutrition: {
        calo: 450,
        protein: 20,
        fat: 25,
        carb: 35,
        vitaminC: 1,
        canxi: 25,
        sat: 2.2,
        kẽm: 1.4
      }
    },
    p24: {
      id: "p24",
      name: "Combo gà + hamburger",
      description: "Inbox shop tư vấn thêm",
      price: 190000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/combo_ga_fy7k1x.jpg",
      ownerID: "admin",
      category: "food",
      ingredients: {
        i1: "Gà rán",
        i2: "Hamburger",
        i3: "Khoai tây chiên",
        i4: "Nước ngọt",
        i5: "Sốt"
      },
      nutrition: {
        calo: 1200,
        protein: 50,
        fat: 60,
        carb: 100,
        vitaminC: 10,
        canxi: 85,
        sat: 4.0,
        kẽm: 3.0
      }
    },
    p25: {
      id: "p25",
      name: "Cà phê HIGHLANDS",
      description: "HIGHLANDS",
      price: 35000,
      imageUrl: "https://res.cloudinary.com/dhxabc6as/image/upload/v1749126021/ca_phe_wf03oh.jpg",
      ownerID: "admin",
      category: "drink",
      ingredients: {
        i1: "Cà phê",
        i2: "Đường",
        i3: "Sữa đặc",
        i4: "Đá viên",
        i5: "Nước lọc"
      },
      nutrition: {
        calo: 160,
        protein: 2,
        fat: 4,
        carb: 28,
        vitaminC: 0,
        canxi: 20,
        sat: 0.3,
        kẽm: 0.2
      }
    }
};

set(ref(db, "products"), products)
  .then(() => alert("Đã đẩy dữ liệu sản phẩm thành công lên Firebase!"))
  .catch((error) => console.error("Lỗi khi đẩy sản phẩm:", error));
  