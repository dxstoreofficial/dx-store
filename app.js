
/* =========================================
   DX STORE - PERBAIKAN FINAL
   BAGIAN 1 DARI 5
   INISIALISASI DAN FUNGSI DASAR
========================================= */

const DX_CONFIG = window.DX_CONFIG || {};

if (
  !window.supabase ||
  !DX_CONFIG.supabaseUrl ||
  !DX_CONFIG.supabaseKey
) {
  console.error("DX STORE: Konfigurasi Supabase tidak tersedia.");
}

const dxSupabase = window.supabase
  ? window.supabase.createClient(
      DX_CONFIG.supabaseUrl,
      DX_CONFIG.supabaseKey
    )
  : null;

let currentUser = null;
let currentProfile = null;
let dxAuthMode = "login";
let dxAdminType = "products";
let dxAuthReady = false;

const $ = (id) => document.getElementById(id);

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function safeImageUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value, window.location.origin);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

const DX_COUNTRIES = {
  ID: { name: "Indonesia", language: "id-ID", currency: "IDR", locale: "id-ID", timezone: "Asia/Jakarta" },
  MY: { name: "Malaysia", language: "ms-MY", currency: "MYR", locale: "ms-MY", timezone: "Asia/Kuala_Lumpur" },
  SG: { name: "Singapore", language: "en-SG", currency: "SGD", locale: "en-SG", timezone: "Asia/Singapore" },
  US: { name: "United States", language: "en-US", currency: "USD", locale: "en-US", timezone: "America/New_York" },
  JP: { name: "Japan", language: "ja-JP", currency: "JPY", locale: "ja-JP", timezone: "Asia/Tokyo" },
  TH: { name: "Thailand", language: "th-TH", currency: "THB", locale: "th-TH", timezone: "Asia/Bangkok" },
  PH: { name: "Philippines", language: "en-PH", currency: "PHP", locale: "en-PH", timezone: "Asia/Manila" },
  AU: { name: "Australia", language: "en-AU", currency: "AUD", locale: "en-AU", timezone: "Australia/Sydney" },
  GB: { name: "United Kingdom", language: "en-GB", currency: "GBP", locale: "en-GB", timezone: "Europe/London" },
  DE: { name: "Germany", language: "de-DE", currency: "EUR", locale: "de-DE", timezone: "Europe/Berlin" },
  FR: { name: "France", language: "fr-FR", currency: "EUR", locale: "fr-FR", timezone: "Europe/Paris" },
  IN: { name: "India", language: "hi-IN", currency: "INR", locale: "en-IN", timezone: "Asia/Kolkata" },
  KR: { name: "South Korea", language: "ko-KR", currency: "KRW", locale: "ko-KR", timezone: "Asia/Seoul" },
  BR: { name: "Brazil", language: "pt-BR", currency: "BRL", locale: "pt-BR", timezone: "America/Sao_Paulo" },
  CA: { name: "Canada", language: "en-CA", currency: "CAD", locale: "en-CA", timezone: "America/Toronto" },
  CN: { name: "China", language: "zh-CN", currency: "CNY", locale: "zh-CN", timezone: "Asia/Shanghai" }
};

const DX_COUNTRY_FLAGS = { ID:"🇮🇩", MY:"🇲🇾", SG:"🇸🇬", US:"🇺🇸", JP:"🇯🇵", TH:"🇹🇭", PH:"🇵🇭", AU:"🇦🇺", GB:"🇬🇧", DE:"🇩🇪", FR:"🇫🇷", IN:"🇮🇳", KR:"🇰🇷", BR:"🇧🇷", CA:"🇨🇦", CN:"🇨🇳" };

let dxExchangeRates = { IDR: 1 };
let dxExchangeRateReady = false;
let dxExchangeRatePromise = null;

const DX_TRANSLATIONS = {
  en: {
    "Beranda":"Home","Produk Digital":"Digital Products","Akun Game":"Game Accounts",
    "Masuk / Daftar":"Sign in / Register","Keluar":"Sign out","Jelajahi Produk":"Explore Products",
    "Lihat Akun Game":"Browse Game Accounts","READY TO LEVEL UP?":"READY TO LEVEL UP?",
    "Temukan berbagai produk digital dan akun game pilihan dengan pengalaman marketplace yang mudah dan nyaman.":"Discover selected digital products and game accounts in one easy marketplace.",
    "Jelajahi berbagai produk digital pilihan dari DX STORE.":"Explore selected digital products from DX STORE.",
    "Jelajahi pilihan akun game yang tersedia.":"Explore available game accounts.",
    "Cari produk atau akun game...":"Search products or game accounts...",
    "Marketplace Akun Game":"Game Account Marketplace","Produk digital akan ditampilkan di sini.":"Digital products will appear here.",
    "Akun game akan ditampilkan di sini.":"Game accounts will appear here.","Memuat produk...":"Loading products...",
    "Memuat akun game...":"Loading game accounts...","Lihat Produk":"View Product","Lihat Akun":"View Account",
    "Sedang Dipesan":"Pending","Habis Terjual":"Sold Out","Sampai jumpa!":"See you again!"
  },
  ms: {
    "Beranda":"Laman Utama","Produk Digital":"Produk Digital","Akun Game":"Akaun Permainan",
    "Masuk / Daftar":"Log masuk / Daftar","Keluar":"Log keluar","Jelajahi Produk":"Terokai Produk",
    "Lihat Akun Game":"Lihat Akaun Permainan","Temukan berbagai produk digital dan akun game pilihan dengan pengalaman marketplace yang mudah dan nyaman.":"Temui produk digital dan akaun permainan pilihan dalam satu pasaran yang mudah digunakan.",
    "Jelajahi berbagai produk digital pilihan dari DX STORE.":"Terokai pelbagai produk digital pilihan daripada DX STORE.",
    "Jelajahi pilihan akun game yang tersedia.":"Terokai pilihan akaun permainan yang tersedia.",
    "Cari produk atau akun game...":"Cari produk atau akaun permainan...",
    "Marketplace Akun Game":"Pasaran Akaun Permainan","Produk digital akan ditampilkan di sini.":"Produk digital akan dipaparkan di sini.",
    "Akun game akan ditampilkan di sini.":"Akaun permainan akan dipaparkan di sini.","Memuat produk...":"Memuatkan produk...",
    "Memuat akun game...":"Memuatkan akaun permainan...","Lihat Produk":"Lihat Produk","Lihat Akun":"Lihat Akaun",
    "Sedang Dipesan":"Dalam Tempahan","Habis Terjual":"Habis Dijual"
  },
  ja: {
    "Beranda":"ホーム","Produk Digital":"デジタル商品","Akun Game":"ゲームアカウント",
    "Masuk / Daftar":"ログイン / 登録","Keluar":"ログアウト","Jelajahi Produk":"商品を見る",
    "Lihat Akun Game":"ゲームアカウントを見る","Marketplace Akun Game":"ゲームアカウントマーケット",
    "Cari produk atau akun game...":"商品またはゲームアカウントを検索...",
    "Jelajahi berbagai produk digital pilihan dari DX STORE.":"DX STOREの厳選デジタル商品をご覧ください。",
    "Jelajahi pilihan akun game yang tersedia.":"利用可能なゲームアカウントをご覧ください。",
    "Lihat Produk":"商品を見る","Lihat Akun":"アカウントを見る","Sedang Dipesan":"予約中","Habis Terjual":"売り切れ"
  },
  de: {"Beranda":"Startseite","Produk Digital":"Digitale Produkte","Akun Game":"Spielkonten","Masuk / Daftar":"Anmelden / Registrieren","Keluar":"Abmelden","Jelajahi Produk":"Produkte entdecken","Lihat Akun Game":"Spielkonten ansehen","Marketplace Akun Game":"Marktplatz für Spielkonten","Cari produk atau akun game...":"Produkte oder Spielkonten suchen...","Lihat Produk":"Produkt ansehen","Lihat Akun":"Konto ansehen","Sedang Dipesan":"Ausstehend","Habis Terjual":"Ausverkauft"},
  fr: {"Beranda":"Accueil","Produk Digital":"Produits numériques","Akun Game":"Comptes de jeu","Masuk / Daftar":"Connexion / Inscription","Keluar":"Déconnexion","Jelajahi Produk":"Explorer les produits","Lihat Akun Game":"Voir les comptes de jeu","Marketplace Akun Game":"Marché des comptes de jeu","Cari produk atau akun game...":"Rechercher des produits ou comptes de jeu...","Lihat Produk":"Voir le produit","Lihat Akun":"Voir le compte","Sedang Dipesan":"En attente","Habis Terjual":"Épuisé"},
  zh: {"Beranda":"首页","Produk Digital":"数字商品","Akun Game":"游戏账号","Masuk / Daftar":"登录 / 注册","Keluar":"退出登录","Jelajahi Produk":"浏览商品","Lihat Akun Game":"浏览游戏账号","Marketplace Akun Game":"游戏账号市场","Cari produk atau akun game...":"搜索商品或游戏账号...","Lihat Produk":"查看商品","Lihat Akun":"查看账号","Sedang Dipesan":"预订中","Habis Terjual":"已售罄"},
  ko: {"Beranda":"홈","Produk Digital":"디지털 상품","Akun Game":"게임 계정","Masuk / Daftar":"로그인 / 가입","Keluar":"로그아웃","Jelajahi Produk":"상품 둘러보기","Lihat Akun Game":"게임 계정 보기","Marketplace Akun Game":"게임 계정 마켓","Cari produk atau akun game...":"상품 또는 게임 계정 검색...","Lihat Produk":"상품 보기","Lihat Akun":"계정 보기","Sedang Dipesan":"예약 중","Habis Terjual":"품절"},
  th: {"Beranda":"หน้าหลัก","Produk Digital":"สินค้าดิจิทัล","Akun Game":"บัญชีเกม","Masuk / Daftar":"เข้าสู่ระบบ / สมัครสมาชิก","Keluar":"ออกจากระบบ","Jelajahi Produk":"เลือกชมสินค้า","Lihat Akun Game":"ดูบัญชีเกม","Marketplace Akun Game":"ตลาดบัญชีเกม","Cari produk atau akun game...":"ค้นหาสินค้าหรือบัญชีเกม...","Lihat Produk":"ดูสินค้า","Lihat Akun":"ดูบัญชี","Sedang Dipesan":"รอดำเนินการ","Habis Terjual":"ขายหมดแล้ว"},
  pt: {"Beranda":"Início","Produk Digital":"Produtos digitais","Akun Game":"Contas de jogos","Masuk / Daftar":"Entrar / Cadastrar","Keluar":"Sair","Jelajahi Produk":"Explorar produtos","Lihat Akun Game":"Ver contas de jogos","Marketplace Akun Game":"Mercado de contas de jogos","Cari produk atau akun game...":"Buscar produtos ou contas de jogos...","Lihat Produk":"Ver produto","Lihat Akun":"Ver conta","Sedang Dipesan":"Pendente","Habis Terjual":"Esgotado"},
  hi: {"Beranda":"होम","Produk Digital":"डिजिटल उत्पाद","Akun Game":"गेम खाते","Masuk / Daftar":"लॉगिन / रजिस्टर","Keluar":"लॉग आउट","Jelajahi Produk":"उत्पाद देखें","Lihat Akun Game":"गेम खाते देखें","Marketplace Akun Game":"गेम अकाउंट मार्केटप्लेस","Cari produk atau akun game...":"उत्पाद या गेम खाता खोजें...","Lihat Produk":"उत्पाद देखें","Lihat Akun":"खाता देखें","Sedang Dipesan":"लंबित","Habis Terjual":"बिक गया"}
};


Object.assign(DX_TRANSLATIONS.en, {
  "Halo,":"Hello,","Semua kebutuhan digitalmu dalam satu tempat.":"All your digital needs in one place.",
  "NEGARA":"COUNTRY & CURRENCY","Marketplace Digital":"Digital Marketplace",
  "Jelajahi layanan":"Explore services","Produk":"Products","Cari":"Search","Jual Akun":"Sell Account","Akun":"Account",
  "Pengaturan Akun":"Account Settings","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Change your country and currency using the selector above.",
  "Belum ada produk digital.":"No digital products yet.","Belum ada akun game.":"No game accounts yet.",
  "Produk gagal dimuat.":"Could not load products.","Akun game gagal dimuat.":"Could not load game accounts.",
  "Memuat akun game...":"Loading game accounts...","Memuat produk...":"Loading products...",
  "Lanjutkan":"Continue","Tutup":"Close","Deskripsi":"Description","Harga":"Price",
  "Menunggu pembayaran":"Awaiting payment","Menunggu pemeriksaan admin":"Awaiting admin review",
  "Kirim Bukti Pembayaran":"Submit Payment Proof","Buat Pesanan":"Create Order",
  "Membuat pesanan...":"Creating order...","Pesanan Dibuat":"Order Created",
  "Pilih bukti JPG/PNG dengan ukuran maksimal 4 MB.":"Choose a JPG/PNG proof file up to 4 MB.",
  "Bukti diterima. Pesanan belum lunas sampai admin memeriksa dana masuk.":"Proof received. The order is not paid until the admin verifies the incoming payment.",
  "Bayar tepat":"Pay exactly","Tidak berlaku sebagai QRIS dinamis":"This is not a dynamic QRIS payment",
  "Belum punya akun? Daftar":"Don't have an account? Register","Masuk":"Sign in","Daftar":"Register",
  "Memproses...":"Processing...","Keluar...":"Signing out...","Menyimpan...":"Saving...",
  "Belum ada pesanan.":"No orders yet.","Memuat pesanan...":"Loading orders...",
  "Data gagal dimuat:":"Could not load data:","Belum ada data.":"No data yet.",
  "Nama produk":"Product name","Deskripsi produk atau akun":"Product or account description",
  "Harga (Rupiah)":"Price (IDR)","Simpan Produk":"Save Product","Pilih gambar":"Choose image"
});
Object.assign(DX_TRANSLATIONS.ms, {
  "Halo,":"Helo,","Semua kebutuhan digitalmu dalam satu tempat.":"Semua keperluan digital anda di satu tempat.",
  "NEGARA":"NEGARA & MATA WANG","Marketplace Digital":"Pasaran Digital",
  "Jelajahi layanan":"Terokai perkhidmatan","Produk":"Produk","Cari":"Cari","Jual Akun":"Jual Akaun","Akun":"Akaun",
  "Pengaturan Akun":"Tetapan Akaun","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Tukar negara dan mata wang melalui pilihan di atas.",
  "Belum ada produk digital.":"Belum ada produk digital.","Belum ada akun game.":"Belum ada akaun permainan.",
  "Produk gagal dimuat.":"Produk gagal dimuatkan.","Akun game gagal dimuat.":"Akaun permainan gagal dimuatkan.",
  "Lanjutkan":"Teruskan","Tutup":"Tutup","Deskripsi":"Penerangan","Harga":"Harga",
  "Menunggu pembayaran":"Menunggu pembayaran","Kirim Bukti Pembayaran":"Hantar Bukti Pembayaran",
  "Buat Pesanan":"Buat Tempahan","Memproses...":"Sedang diproses...","Menyimpan...":"Menyimpan..."
});
Object.assign(DX_TRANSLATIONS.ja, {
  "Halo,":"こんにちは、","Semua kebutuhan digitalmu dalam satu tempat.":"デジタルに必要なものをすべてここで。",
  "NEGARA":"国と言語・通貨","Marketplace Digital":"デジタルマーケット",
  "Jelajahi layanan":"サービスを見る","Produk":"商品","Cari":"検索","Jual Akun":"アカウントを販売","Akun":"アカウント",
  "Pengaturan Akun":"アカウント設定","Belum ada produk digital.":"デジタル商品はまだありません。",
  "Belum ada akun game.":"ゲームアカウントはまだありません。","Lanjutkan":"続行","Tutup":"閉じる",
  "Deskripsi":"説明","Harga":"価格","Menunggu pembayaran":"支払い待ち","Kirim Bukti Pembayaran":"支払い証明を送信",
  "Buat Pesanan":"注文する","Memproses...":"処理中...","Menyimpan...":"保存中..."
});


Object.assign(DX_TRANSLATIONS.de, {
  "Halo,":"Hallo,","Semua kebutuhan digitalmu dalam satu tempat.":"Alle digitalen Bedürfnisse an einem Ort.",
  "NEGARA":"LAND & WÄHRUNG","Marketplace Digital":"Digitaler Marktplatz","Jelajahi layanan":"Dienste entdecken",
  "Produk":"Produkte","Cari":"Suchen","Jual Akun":"Konto verkaufen","Akun":"Konto",
  "Pengaturan Akun":"Kontoeinstellungen","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Land und Währung über die Auswahl oben ändern.",
  "Belum ada produk digital.":"Noch keine digitalen Produkte.","Belum ada akun game.":"Noch keine Spielkonten.",
  "Produk gagal dimuat.":"Produkte konnten nicht geladen werden.","Akun game gagal dimuat.":"Spielkonten konnten nicht geladen werden.",
  "Lanjutkan":"Weiter","Tutup":"Schließen","Deskripsi":"Beschreibung","Harga":"Preis","Menunggu pembayaran":"Zahlung ausstehend",
  "Menunggu pemeriksaan admin":"Warten auf Admin-Prüfung","Kirim Bukti Pembayaran":"Zahlungsnachweis senden",
  "Buat Pesanan":"Bestellung erstellen","Memproses...":"Wird verarbeitet...","Menyimpan...":"Wird gespeichert...",
  "Belum ada pesanan.":"Noch keine Bestellungen.","Memuat pesanan...":"Bestellungen werden geladen..."
});
Object.assign(DX_TRANSLATIONS.fr, {
  "Halo,":"Bonjour,","Semua kebutuhan digitalmu dalam satu tempat.":"Tous vos besoins numériques au même endroit.",
  "NEGARA":"PAYS ET DEVISE","Marketplace Digital":"Marché numérique","Jelajahi layanan":"Découvrir les services",
  "Produk":"Produits","Cari":"Rechercher","Jual Akun":"Vendre un compte","Akun":"Compte",
  "Pengaturan Akun":"Paramètres du compte","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Modifiez le pays et la devise avec le sélecteur ci-dessus.",
  "Belum ada produk digital.":"Aucun produit numérique pour le moment.","Belum ada akun game.":"Aucun compte de jeu pour le moment.",
  "Produk gagal dimuat.":"Échec du chargement des produits.","Akun game gagal dimuat.":"Échec du chargement des comptes de jeu.",
  "Lanjutkan":"Continuer","Tutup":"Fermer","Deskripsi":"Description","Harga":"Prix","Menunggu pembayaran":"En attente de paiement",
  "Menunggu pemeriksaan admin":"En attente de vérification","Kirim Bukti Pembayaran":"Envoyer la preuve de paiement",
  "Buat Pesanan":"Créer une commande","Memproses...":"Traitement...","Menyimpan...":"Enregistrement...",
  "Belum ada pesanan.":"Aucune commande pour le moment.","Memuat pesanan...":"Chargement des commandes..."
});
Object.assign(DX_TRANSLATIONS.zh, {
  "Halo,":"你好，","Semua kebutuhan digitalmu dalam satu tempat.":"您的数字需求，一站满足。",
  "NEGARA":"国家与货币","Marketplace Digital":"数字商品市场","Jelajahi layanan":"探索服务",
  "Produk":"商品","Cari":"搜索","Jual Akun":"出售账号","Akun":"账号",
  "Pengaturan Akun":"账号设置","Ubah negara dan mata uang melalui pilihan di bagian atas.":"使用上方选项更改国家和货币。",
  "Belum ada produk digital.":"暂无数字商品。","Belum ada akun game.":"暂无游戏账号。",
  "Produk gagal dimuat.":"商品加载失败。","Akun game gagal dimuat.":"游戏账号加载失败。",
  "Lanjutkan":"继续","Tutup":"关闭","Deskripsi":"描述","Harga":"价格","Menunggu pembayaran":"等待付款",
  "Menunggu pemeriksaan admin":"等待管理员审核","Kirim Bukti Pembayaran":"提交付款凭证",
  "Buat Pesanan":"创建订单","Memproses...":"处理中...","Menyimpan...":"保存中...",
  "Belum ada pesanan.":"暂无订单。","Memuat pesanan...":"正在加载订单..."
});
Object.assign(DX_TRANSLATIONS.ko, {
  "Halo,":"안녕하세요,","Semua kebutuhan digitalmu dalam satu tempat.":"모든 디지털 서비스를 한곳에서 만나보세요.",
  "NEGARA":"국가 및 통화","Marketplace Digital":"디지털 마켓플레이스","Jelajahi layanan":"서비스 둘러보기",
  "Produk":"상품","Cari":"검색","Jual Akun":"계정 판매","Akun":"계정",
  "Pengaturan Akun":"계정 설정","Ubah negara dan mata uang melalui pilihan di bagian atas.":"위 선택 메뉴에서 국가와 통화를 변경하세요.",
  "Belum ada produk digital.":"아직 디지털 상품이 없습니다.","Belum ada akun game.":"아직 게임 계정이 없습니다.",
  "Produk gagal dimuat.":"상품을 불러오지 못했습니다.","Akun game gagal dimuat.":"게임 계정을 불러오지 못했습니다.",
  "Lanjutkan":"계속","Tutup":"닫기","Deskripsi":"설명","Harga":"가격","Menunggu pembayaran":"결제 대기 중",
  "Menunggu pemeriksaan admin":"관리자 확인 대기 중","Kirim Bukti Pembayaran":"결제 증빙 제출",
  "Buat Pesanan":"주문하기","Memproses...":"처리 중...","Menyimpan...":"저장 중...",
  "Belum ada pesanan.":"주문이 없습니다.","Memuat pesanan...":"주문 불러오는 중..."
});
Object.assign(DX_TRANSLATIONS.th, {
  "Halo,":"สวัสดี,","Semua kebutuhan digitalmu dalam satu tempat.":"ทุกสิ่งที่คุณต้องการด้านดิจิทัลในที่เดียว",
  "NEGARA":"ประเทศและสกุลเงิน","Marketplace Digital":"ตลาดสินค้าดิจิทัล","Jelajahi layanan":"สำรวจบริการ",
  "Produk":"สินค้า","Cari":"ค้นหา","Jual Akun":"ขายบัญชี","Akun":"บัญชี",
  "Pengaturan Akun":"ตั้งค่าบัญชี","Ubah negara dan mata uang melalui pilihan di bagian atas.":"เปลี่ยนประเทศและสกุลเงินจากเมนูด้านบน",
  "Belum ada produk digital.":"ยังไม่มีสินค้าดิจิทัล","Belum ada akun game.":"ยังไม่มีบัญชีเกม",
  "Produk gagal dimuat.":"โหลดสินค้าไม่สำเร็จ","Akun game gagal dimuat.":"โหลดบัญชีเกมไม่สำเร็จ",
  "Lanjutkan":"ดำเนินการต่อ","Tutup":"ปิด","Deskripsi":"คำอธิบาย","Harga":"ราคา","Menunggu pembayaran":"รอการชำระเงิน",
  "Menunggu pemeriksaan admin":"รอผู้ดูแลตรวจสอบ","Kirim Bukti Pembayaran":"ส่งหลักฐานการชำระเงิน",
  "Buat Pesanan":"สร้างคำสั่งซื้อ","Memproses...":"กำลังดำเนินการ...","Menyimpan...":"กำลังบันทึก...",
  "Belum ada pesanan.":"ยังไม่มีคำสั่งซื้อ","Memuat pesanan...":"กำลังโหลดคำสั่งซื้อ..."
});
Object.assign(DX_TRANSLATIONS.pt, {
  "Halo,":"Olá,","Semua kebutuhan digitalmu dalam satu tempat.":"Todas as suas necessidades digitais em um só lugar.",
  "NEGARA":"PAÍS E MOEDA","Marketplace Digital":"Mercado digital","Jelajahi layanan":"Explorar serviços",
  "Produk":"Produtos","Cari":"Pesquisar","Jual Akun":"Vender conta","Akun":"Conta",
  "Pengaturan Akun":"Configurações da conta","Ubah negara dan mata uang melalui pilihan di bagian atas.":"Altere o país e a moeda usando a opção acima.",
  "Belum ada produk digital.":"Ainda não há produtos digitais.","Belum ada akun game.":"Ainda não há contas de jogos.",
  "Produk gagal dimuat.":"Falha ao carregar produtos.","Akun game gagal dimuat.":"Falha ao carregar contas de jogos.",
  "Lanjutkan":"Continuar","Tutup":"Fechar","Deskripsi":"Descrição","Harga":"Preço","Menunggu pembayaran":"Aguardando pagamento",
  "Menunggu pemeriksaan admin":"Aguardando análise do administrador","Kirim Bukti Pembayaran":"Enviar comprovante de pagamento",
  "Buat Pesanan":"Criar pedido","Memproses...":"Processando...","Menyimpan...":"Salvando...",
  "Belum ada pesanan.":"Ainda não há pedidos.","Memuat pesanan...":"Carregando pedidos..."
});
Object.assign(DX_TRANSLATIONS.hi, {
  "Halo,":"नमस्ते,","Semua kebutuhan digitalmu dalam satu tempat.":"आपकी सभी डिजिटल ज़रूरतें एक ही जगह।",
  "NEGARA":"देश और मुद्रा","Marketplace Digital":"डिजिटल मार्केटप्लेस","Jelajahi layanan":"सेवाएँ देखें",
  "Produk":"उत्पाद","Cari":"खोजें","Jual Akun":"खाता बेचें","Akun":"खाता",
  "Pengaturan Akun":"खाता सेटिंग","Ubah negara dan mata uang melalui pilihan di bagian atas.":"ऊपर दिए विकल्प से देश और मुद्रा बदलें।",
  "Belum ada produk digital.":"अभी कोई डिजिटल उत्पाद नहीं है।","Belum ada akun game.":"अभी कोई गेम खाता नहीं है।",
  "Produk gagal dimuat.":"उत्पाद लोड नहीं हो सके।","Akun game gagal dimuat.":"गेम खाते लोड नहीं हो सके।",
  "Lanjutkan":"जारी रखें","Tutup":"बंद करें","Deskripsi":"विवरण","Harga":"कीमत","Menunggu pembayaran":"भुगतान की प्रतीक्षा",
  "Menunggu pemeriksaan admin":"व्यवस्थापक की जाँच की प्रतीक्षा","Kirim Bukti Pembayaran":"भुगतान प्रमाण भेजें",
  "Buat Pesanan":"ऑर्डर बनाएँ","Memproses...":"प्रक्रिया जारी...","Menyimpan...":"सहेजा जा रहा है...",
  "Belum ada pesanan.":"अभी कोई ऑर्डर नहीं है।","Memuat pesanan...":"ऑर्डर लोड हो रहे हैं..."
});

function getDXCountry() {
  const code = localStorage.getItem("dx-country") || "ID";
  return DX_COUNTRIES[code] ? { code, ...DX_COUNTRIES[code] } : { code: "ID", ...DX_COUNTRIES.ID };
}

function applyDXLanguage() {
  const country = getDXCountry();
  const language = country.language.split("-")[0];
  const dictionary = language === "id" ? {} : (DX_TRANSLATIONS[language] || DX_TRANSLATIONS.en || {});
  const translateTree = root => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement?.closest("script,style,noscript,code,pre")) return;
      if (node.__dxOriginalText === undefined) node.__dxOriginalText = node.nodeValue;
      const raw = node.__dxOriginalText;
      const trimmed = raw.trim();
      const translated = dictionary[trimmed];
      const next = translated ? raw.replace(trimmed, translated) : raw;
      if (node.nodeValue !== next) node.nodeValue = next;
    });
    if (root.querySelectorAll) root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el => {
      ["placeholder","aria-label","title"].forEach(attribute => {
        if (!el.hasAttribute(attribute)) return;
        const key = "dxOriginal" + attribute.replace(/(^|-)([a-z])/g, (_, dash, ch) => ch.toUpperCase());
        if (el.dataset[key] === undefined) el.dataset[key] = el.getAttribute(attribute);
        const original = el.dataset[key];
        const translated = dictionary[original] || original;
        if (el.getAttribute(attribute) !== translated) el.setAttribute(attribute, translated);
      });
    });
  };
  translateTree(document.body);
  const titles = {en:"DX STORE — Digital Marketplace",ms:"DX STORE — Pasaran Digital",ja:"DX STORE — デジタルマーケット",de:"DX STORE — Digitaler Marktplatz",fr:"DX STORE — Marché numérique",zh:"DX STORE — 数字市场",ko:"DX STORE — 디지털 마켓",th:"DX STORE — ตลาดดิจิทัล",pt:"DX STORE — Mercado Digital",hi:"DX STORE — डिजिटल मार्केटप्लेस"};
  const nextTitle = language === "id" ? "DX STORE — Marketplace Digital" : (titles[language] || titles.en);
  if (document.title !== nextTitle) document.title = nextTitle;
  if (!window.dxLanguageObserver && document.body) {
    window.dxLanguageObserver = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes?.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) translateTree(node.parentElement || document.body);
          else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        });
        if (record.type === "characterData" && record.target.parentElement) translateTree(record.target.parentElement);
      });
    });
    window.dxLanguageObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
}
async function loadDXExchangeRates() {
  if (dxExchangeRatePromise) return dxExchangeRatePromise;
  dxExchangeRatePromise = (async () => {
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/IDR", { cache: "no-store" });
      if (!response.ok) throw new Error("Kurs mata uang tidak tersedia");
      const data = await response.json();
      if (data.result !== "success" || !data.rates || !Number.isFinite(data.rates.USD)) throw new Error("Data kurs tidak valid");
      dxExchangeRates = data.rates;
      dxExchangeRateReady = true;
      document.dispatchEvent(new CustomEvent("dx-exchange-rates-ready"));
      return true;
    } catch (error) {
      console.warn("DX STORE: kurs mata uang belum dapat dimuat.", error);
      dxExchangeRatePromise = null;
      return false;
    }
  })();
  return dxExchangeRatePromise;
}

function setDXCountry(code) {
  if (!DX_COUNTRIES[code]) return;
  localStorage.setItem("dx-country", code);
  document.documentElement.lang = DX_COUNTRIES[code].language;
  const selector = $("dxCountry");
  if (selector && selector.value !== code) selector.value = code;
  const dashboardCurrency = $("dxDashboardCurrency");
  if (dashboardCurrency) dashboardCurrency.textContent = (DX_COUNTRY_FLAGS[code] || "🌐") + " " + code;
  applyDXLanguage();
  document.dispatchEvent(new CustomEvent("dx-country-change", { detail: { code, ...DX_COUNTRIES[code] } }));
  // Katalog tidak boleh bergantung pada layanan kurs eksternal.
  // Muat data segera; jika kurs tersedia, perbarui tampilan harga setelahnya.
  loadProducts();
  loadAccountListings();
  loadDXExchangeRates().then(() => {
    if (dxExchangeRateReady) {
      loadProducts();
      loadAccountListings();
      const amount = $("dxCheckoutAmount");
      if (amount && $("dxCheckoutModal")?.classList.contains("active")) {
        const item = $("dxCheckoutModal").dataset.itemAmount;
        if (item) amount.textContent = formatPrice(Number(item));
      }
    }
  });
}

function formatPrice(value) {
  const country = getDXCountry();
  const baseAmount = Number(value) || 0;
  if (country.currency !== "IDR" && !dxExchangeRateReady) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(baseAmount) + " · kurs memuat";
  }
  const rate = Number(dxExchangeRates[country.currency] || (country.currency === "IDR" ? 1 : 0));
  if (!rate) return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(baseAmount) + " · kurs tidak tersedia";
  const converted = baseAmount * rate;
  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    maximumFractionDigits: ["IDR","JPY","KRW"].includes(country.currency) ? 0 : 2
  }).format(converted);
}

function formatDXRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseDXRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function installDXRupiahInput(input) {
  if (!input || input.dataset.dxRupiahReady === "1") return;
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.addEventListener("input", () => {
    const before = input.value;
    const cursor = input.selectionStart ?? before.length;
    const digitsBeforeCursor = before.slice(0, cursor).replace(/\D/g, "").length;
    const digits = before.replace(/\D/g, "");
    const formatted = formatDXRupiahInput(digits);
    input.value = formatted;
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < digitsBeforeCursor) {
      if (/\d/.test(formatted[position])) seen++;
      position++;
    }
    input.setSelectionRange(position, position);
  });
  input.value = formatDXRupiahInput(input.value);
  input.dataset.dxRupiahReady = "1";
}

function getDXError(error) {
  return error?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

function showDXMessage(message) {
  const element = $("authMessage");

  if (element) {
    element.textContent = message;
  } else {
    console.log(message);
  }
}

function showDXAdminMessage(message) {
  const element = $("dxAdminMessage");

  if (element) {
    element.textContent = message;
  }
}

/* MODAL LOGIN */

function openAuth() {
  window.location.href = "login.html?v=67";
}

function closeAuth() {
  const modal = $("authModal");

  if (modal) {
    modal.classList.remove("active");
  }
}

let dxActiveView = "home";
if (!window.dxViewNavigationBound) {
  window.dxViewNavigationBound = true;
  document.addEventListener("click", event => {
    const actionButton = event.target.closest("#dxDashboard [data-dx-action]");
    if (actionButton) {
      if (!currentUser) return;
      event.preventDefault();
      event.stopPropagation();
      if (actionButton.dataset.dxAction === "search") {
        showDXView("products");
        setTimeout(() => $("dxMarketplaceSearch")?.focus(), 0);
      } else if (actionButton.dataset.dxAction === "sell-account") {
        showDXView("accounts");
        setTimeout(() => $("dxSellerFormWrap")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
      return;
    }
    const viewButton = event.target.closest("#dxBottomNav [data-dx-view], #dxDashboard [data-dx-view]");
    if (viewButton) {
      // Navigasi katalog publik dapat digunakan tanpa login.
      event.preventDefault();
      event.stopPropagation();
      showDXView(viewButton.dataset.dxView);
      return;
    }
    const link = event.target.closest('a[href="#home"],a[href="#products"],a[href="#accounts"]');
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    const href = link.getAttribute("href");
    showDXView(href === "#products" ? "products" : href === "#accounts" ? "accounts" : "home");
    document.getElementById("dxNavLinks")?.classList.remove("open");
  }, true);
}
function showDXView(view) {
  if (!["home","products","accounts","profile"].includes(view)) return;
  // Pengunjung boleh menjelajahi katalog tanpa login; profil tetap memerlukan akun.
  if (view === "profile" && !currentUser) {
    openAuth();
    return;
  }
  dxActiveView = view;
  const dashboard = $("dxDashboard"), home = $("home"), products = $("products"), accounts = $("accounts");
  const cta = document.querySelector(".dx-cta");
  const signedIn = !!currentUser;
  if (dashboard) dashboard.hidden = !signedIn || !["home","profile"].includes(view);
  // Pengunjung melihat hero saat memilih Beranda; setelah masuk, beranda memakai dashboard.
  if (home) home.hidden = signedIn || view !== "home";
  if (products) products.hidden = view === "accounts" || view === "profile" || (!signedIn && view === "home");
  if (accounts) accounts.hidden = view !== "accounts";
  if (cta) cta.hidden = signedIn || view !== "home";
  const panel = $("dxProfilePanel"); if (panel) panel.hidden = view !== "profile";
  const adminPanel = $("dxAdminPanel");
  if (adminPanel && !window.dxAdminPanelExpanded) adminPanel.style.display = "none";
  const target = view === "products" ? products : view === "accounts" ? accounts : dashboard;
  if (target) window.scrollTo({ top: 0, behavior: "auto" });
  document.querySelectorAll("#dxBottomNav [data-dx-view]").forEach(el => {
    const active = el.dataset.dxView === view;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current","page"); else el.removeAttribute("aria-current");
  });
}
function updateDXDashboardVisibility() {
  const main = document.querySelector("main");
  const hero = $("home");
  const cta = document.querySelector(".dx-cta");
  if (!main || !hero) return;
  let dashboard = $("dxDashboard");
  if (!dashboard) {
    dashboard = document.createElement("section");
    dashboard.id = "dxDashboard";
    dashboard.innerHTML = `
      <div class="dx-dana-topline">
        <div><small>DX STORE · DIGITAL WALLET EXPERIENCE</small><h1>Halo, <span id="dxDashboardName">Pengguna</span> 👋</h1><p>Semua kebutuhan digitalmu dalam satu tempat.</p></div>
        <div class="dx-dana-avatar">DX</div>
      </div>
      <div id="dxStoreNoticeBanner" hidden role="status" style="margin:14px 0;padding:14px;border:1px solid #51e5ff55;border-radius:12px;background:#102543;color:#eaf5ff"></div>
      <div class="dx-dana-maincard">
        <div class="dx-dana-cardtop"><span>DX STORE</span><span>●●●●  DX-01</span></div>
        <div class="dx-dana-cardtitle">Marketplace Digital</div>
        <p>Temukan produk digital dan akun game pilihan dengan proses pemesanan yang mudah.</p>
        <div class="dx-dana-cardfoot"><span>NEGARA</span><strong id="dxDashboardCurrency">IDR · Indonesia</strong></div>
      </div>
      <div class="dx-dana-shortcuts">
        <button type="button" data-dx-view="products"><span>▣</span><strong>Produk</strong></button>
        <button type="button" data-dx-view="accounts"><span>🎮</span><strong>Akun Game</strong></button>
        <button type="button" data-dx-action="search"><span>⌕</span><strong>Cari</strong></button>
        <button type="button" data-dx-action="sell-account"><span>＋</span><strong>Jual Akun</strong></button>
      </div>
      <section id="dxProfilePanel" class="dx-profile-page" hidden>
        <div class="dx-wallet-profile-head">
          <div><small>DX STORE · AKUN SAYA</small><h2>Profil</h2><p>Kelola akun dan aktivitas digitalmu.</p></div>
          <div class="dx-profile-avatar" id="dxProfileAvatar">DX</div>
        </div>
        <article class="dx-wallet-member">
          <div class="dx-wallet-member-top"><span>MEMBER DX STORE</span><span class="dx-profile-verified">AKUN</span></div>
          <strong id="dxProfileName">Pengguna</strong>
          <span id="dxAccountEmail">Akun Anda</span>
          <small id="dxProfileMember">Anggota DX STORE</small>
        </article>
        <div class="dx-wallet-shortcuts">
          <button type="button" data-dx-profile-action="orders"><span>▤</span><strong>Pesanan</strong></button>
          <button type="button" data-dx-profile-action="messages"><span>✉</span><strong>Obrolan</strong></button>
          <button type="button" data-dx-profile-action="help"><span>♧</span><strong>Bantuan</strong></button>
          <button type="button" data-dx-profile-action="country"><span>◎</span><strong>Wilayah</strong></button>
          <button type="button" data-dx-profile-action="edit"><span>✎</span><strong>Edit profil</strong></button>
        </div>
        <details class="dx-profile-accordion" id="dxProfileEditAccordion"><summary><span><small>PROFIL</small><strong>Data Profil</strong><em>Nama tampilan dan email akun</em></span><b>⌄</b></summary><article class="dx-profile-card dx-wallet-settings" id="dxProfileEdit">
          <div class="dx-profile-card-head"><div><small>INFORMASI PRIBADI</small><h3>Data Profil</h3></div><span>✦</span></div>
          <label for="dxProfileNameInput">Nama tampilan</label>
          <input id="dxProfileNameInput" type="text" maxlength="40" autocomplete="nickname" placeholder="Masukkan nama tampilan">
          <label for="dxProfileEmailInput">Email akun</label>
          <input id="dxProfileEmailInput" type="email" readonly>
          <button type="button" id="dxSaveProfile" class="dx-profile-primary">Simpan perubahan</button>
          <p id="dxProfileMessage" class="dx-profile-message" role="status" aria-live="polite"></p>
        </article></details>
        <details class="dx-profile-accordion" id="dxProfileSettingsAccordion"><summary><span><small>PREFERENSI</small><strong>Pengaturan Akun</strong><em>Negara, mata uang dan bahasa</em></span><b>⌄</b></summary><article class="dx-profile-card dx-profile-menu">
          <div class="dx-profile-card-head"><div><small>PREFERENSI</small><h3>Pengaturan Akun</h3></div><span>⚙</span></div>
          <button type="button" data-dx-profile-action="country"><span class="dx-profile-menu-icon">◎</span><span><strong>Negara, Mata Uang & Bahasa</strong><small id="dxProfileCountry">Sesuaikan preferensi wilayah</small></span><b>›</b></button>
        </article></details>
        <details class="dx-profile-accordion" id="dxOrderAccordion"><summary><span><small>TRANSAKSI</small><strong>Riwayat Pesanan</strong><em>Lihat status dan detail pesanan</em></span><b>⌄</b></summary>
        <section id="dxOrderHistory" class="dx-profile-card"><div class="dx-profile-card-head"><div><small>TRANSAKSI</small><h3>Riwayat Pesanan</h3></div><button type="button" id="dxRefreshOrders">Muat ulang</button></div><div id="dxOrderHistoryList">Memuat pesanan...</div></section></details>
        <details class="dx-profile-accordion" id="dxChatAccordion"><summary><span><small>KOMUNIKASI</small><strong>Obrolan Penjual & Pembeli</strong><em>Diskusi langsung tentang produk dan pesanan</em></span><b>⌄</b></summary>
        <section class="dx-profile-card" id="dxChatCenter">
          <div class="dx-profile-card-head"><div><small>DX STORE MESSAGES</small><h3>Pesan Saya</h3></div><button type="button" id="dxChatRefresh">Muat ulang</button></div>
          <div id="dxChatConversationList" aria-live="polite">Memuat percakapan...</div>
          <div id="dxChatThread" hidden style="margin-top:14px;border-top:1px solid #385477;padding-top:14px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><strong id="dxChatThreadTitle">Percakapan</strong><button type="button" id="dxChatBack">Kembali</button></div>
            <div id="dxChatMessages" role="log" aria-live="polite" style="display:grid;gap:8px;max-height:360px;overflow:auto;padding:12px 0"></div>
            <form id="dxChatSendForm" style="display:grid;gap:8px"><label for="dxChatComposer">Tulis pesan</label><textarea id="dxChatComposer" rows="2" maxlength="2000" required placeholder="Tanyakan detail produk atau pesanan..."></textarea><button type="submit" class="dx-button" id="dxChatSend">Kirim Pesan</button></form>
            <p id="dxChatFeedback" role="status" aria-live="polite"></p>
          </div>
        </section></details>
        <details class="dx-profile-accordion" id="dxHelpAccordion"><summary><span><small>DUKUNGAN</small><strong>Pusat Bantuan & Laporan</strong><em>Kirim laporan dan cek balasan admin</em></span><b>⌄</b></summary>
        <section id="dxHelpCenter" class="dx-profile-card"><div class="dx-profile-card-head"><div><small>DUKUNGAN PELANGGAN</small><h3>Pusat Bantuan &amp; Laporan</h3></div><span>?</span></div>
          <form id="dxSupportForm"><label for="dxSupportCategory">Kategori masalah</label><select id="dxSupportCategory" required><option>Pembayaran</option><option>Pesanan</option><option>Garansi</option><option>Produk</option><option>Akun</option><option>Login</option><option>Lainnya</option></select>
          <label for="dxSupportOrder">Nomor pesanan (opsional)</label><input id="dxSupportOrder" type="text" placeholder="Tempel ID pesanan jika ada">
          <label for="dxSupportSubject">Judul laporan</label><input id="dxSupportSubject" type="text" minlength="4" maxlength="120" required placeholder="Ringkas masalah yang dialami">
          <label for="dxSupportMessage">Ceritakan masalah</label><textarea id="dxSupportMessage" minlength="10" maxlength="4000" rows="4" required placeholder="Jelaskan kronologi dan bantuan yang dibutuhkan"></textarea>
          <label for="dxSupportImage">Lampiran gambar (opsional, JPG/PNG/WEBP maks. 5 MB)</label><input id="dxSupportImage" type="file" accept="image/jpeg,image/png,image/webp">
          <button type="submit" id="dxSupportSubmit" class="dx-profile-primary">Kirim Laporan</button><p id="dxSupportFeedback" role="status" aria-live="polite"></p></form>
          <h4>Laporan Saya</h4><div id="dxMyTickets">Memuat laporan...</div></section></details>
        <section id="dxAdminAccessCard" class="dx-admin-access" hidden><div class="dx-admin-access-icon">⚙</div><div class="dx-admin-access-copy"><small>KHUSUS ADMINISTRATOR</small><strong>Pengaturan Website</strong><p>Kelola tampilan toko, produk, pesanan, pengguna, dan laporan dari satu tempat.</p></div><button type="button" id="dxOpenAdmin" hidden><span>⚙</span> Buka Pengaturan Website <b>›</b></button></section><div class="dx-profile-actions"><button type="button" id="dxAccountLogout">Keluar dari Akun</button></div>
        <p class="dx-profile-version">DX STORE · DIGITAL MARKETPLACE</p>
      </section>
      <div class="dx-dana-sectionhead"><div><small>DX MARKETPLACE</small><h2>Jelajahi layanan</h2></div><span>DX-01</span></div>
    `;
    main.insertBefore(dashboard, hero);
  }
  const storeBanner = $("dxStoreNoticeBanner");
  if (storeBanner && storeBanner.parentElement !== main) main.insertBefore(storeBanner, dashboard);
  const visible = !!currentUser;
  loadDXSellerApplicationState();
  loadDXStoreAvailability();
  dashboard.hidden = !visible;
  hero.hidden = visible;
  if (cta) cta.hidden = visible;
  const name = currentUser?.user_metadata?.display_name || currentUser?.email?.split("@")[0] || "Pengguna";
  const nameNode = $("dxDashboardName");
  if (nameNode) nameNode.textContent = name;
  const currencyNode = $("dxDashboardCurrency");
  if (currencyNode) currencyNode.textContent = (DX_COUNTRY_FLAGS[getDXCountry().code] || "🌐") + " " + getDXCountry().code;
  const accountEmail = $("dxAccountEmail");
  if (accountEmail) accountEmail.textContent = currentUser?.email || "Akun Anda";
  const profileName = currentUser?.user_metadata?.display_name || currentUser?.email?.split("@")[0] || "Pengguna";
  if ($("dxProfileName")) $("dxProfileName").textContent = profileName;
  if ($("dxProfileAvatar")) $("dxProfileAvatar").textContent = profileName.trim().slice(0, 2).toUpperCase() || "DX";
  const avatarUrl = safeImageUrl(currentUser?.user_metadata?.avatar_url);
  const avatarNodes = [$("dxProfileAvatar"), document.querySelector(".dx-dana-avatar")].filter(Boolean);
  avatarNodes.forEach(node => {
    node.style.position = "relative";
    node.style.overflow = "hidden";
    let photo = node.querySelector("img.dx-user-avatar-photo");
    if (avatarUrl) {
      if (!photo) {
        photo = document.createElement("img");
        photo.className = "dx-user-avatar-photo";
        photo.alt = "Foto profil";
        photo.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit";
        node.appendChild(photo);
      }
      if (photo.src !== avatarUrl) photo.src = avatarUrl;
      node.textContent = "";
      node.appendChild(photo);
    } else {
      photo?.remove();
      node.textContent = profileName.trim().slice(0, 2).toUpperCase() || "DX";
    }
  });
  const profileEdit = $("dxProfileEdit");
  if (profileEdit && !$("dxProfilePhotoInput")) {
    const photoBox = document.createElement("div");
    photoBox.id = "dxProfilePhotoControl";
    photoBox.style.cssText = "margin:14px 0;padding:14px;border:1px solid #29466f;border-radius:12px;background:#0b1426";
    photoBox.innerHTML = '<label for="dxProfilePhotoInput">Foto profil (JPG, PNG, WEBP · maks. 5 MB)</label><input id="dxProfilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:block;width:100%;margin-top:8px;color:white"><p id="dxProfilePhotoMessage" class="dx-profile-message" role="status" aria-live="polite">Foto akan tampil di profil dan beranda setelah berhasil disimpan.</p>';
    $("dxProfileEmailInput")?.insertAdjacentElement("afterend", photoBox);
    $("dxProfilePhotoInput")?.addEventListener("change", async event => {
      const file = event.target.files?.[0];
      const feedback = $("dxProfilePhotoMessage");
      if (!file) return;
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
        event.target.value = "";
        if (feedback) feedback.textContent = "Pilih JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.";
        return;
      }
      const uploadButton = $("dxSaveProfile");
      if (uploadButton) uploadButton.disabled = true;
      if (feedback) feedback.textContent = "Mengunggah dan menyimpan foto profil...";
      try {
        if (!currentUser || !dxSupabase) throw new Error("Silakan masuk kembali sebelum mengunggah foto.");
        const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
        const path = currentUser.id + "/profile/" + crypto.randomUUID() + "." + ext;
        const { data: stored, error: uploadError } = await dxSupabase.storage
          .from("marketplace-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const publicUrl = dxSupabase.storage.from("marketplace-images").getPublicUrl(stored.path).data.publicUrl;
        const { data, error } = await dxSupabase.auth.updateUser({ data: { avatar_url: publicUrl } });
        if (error) throw error;
        currentUser = data.user || { ...currentUser, user_metadata: { ...currentUser.user_metadata, avatar_url: publicUrl } };
        if (feedback) feedback.textContent = "Foto profil berhasil disimpan dan sudah diterapkan.";
        event.target.value = "";
        updateDXDashboardVisibility();
      } catch (error) {
        if (feedback) feedback.textContent = "Foto gagal disimpan: " + getDXError(error);
      } finally {
        if (uploadButton) uploadButton.disabled = false;
      }
    });
  }
  if ($("dxProfileNameInput") && document.activeElement !== $("dxProfileNameInput")) $("dxProfileNameInput").value = profileName;
  if ($("dxProfileEmailInput")) $("dxProfileEmailInput").value = currentUser?.email || "";
  if ($("dxProfileMember")) $("dxProfileMember").textContent = currentProfile?.created_at ? "Bergabung " + new Date(currentProfile.created_at).toLocaleDateString(getDXCountry().locale, {day:"numeric",month:"long",year:"numeric"}) : "Anggota DX STORE";
  if ($("dxProfileCountry")) $("dxProfileCountry").textContent = (DX_COUNTRY_FLAGS[getDXCountry().code] || "🌐") + " " + getDXCountry().code;
  const saveProfileButton = $("dxSaveProfile");
  if (saveProfileButton && !saveProfileButton.dataset.bound) {
    saveProfileButton.addEventListener("click", async () => {
      const nextName = $("dxProfileNameInput")?.value.trim() || "";
      const message = $("dxProfileMessage");
      if (!nextName) { if (message) message.textContent = "Nama tampilan tidak boleh kosong."; return; }
      saveProfileButton.disabled = true;
      saveProfileButton.textContent = "Menyimpan...";
      try {
        const { data, error } = await dxSupabase.auth.updateUser({ data: { display_name: nextName } });
        if (error) throw error;
        currentUser = data.user || { ...currentUser, user_metadata: { ...currentUser.user_metadata, display_name: nextName } };
        if (message) message.textContent = "Profil berhasil diperbarui.";
        updateDXDashboardVisibility();
      } catch (error) {
        if (message) message.textContent = "Gagal menyimpan: " + getDXError(error);
      } finally {
        saveProfileButton.disabled = false;
        saveProfileButton.textContent = "Simpan perubahan";
      }
    });
    saveProfileButton.dataset.bound = "1";
  }
  document.querySelectorAll("[data-dx-profile-action]").forEach(button => {
    if (button.dataset.bound) return;
    button.addEventListener("click", () => {
      const action = button.dataset.dxProfileAction;
      if (action === "country") { $("dxProfileSettingsAccordion").open = true; $("dxProfileSettingsAccordion")?.scrollIntoView({behavior:"smooth",block:"start"}); $("dxCountry")?.focus(); }
      if (action === "orders") { $("dxOrderAccordion").open = true; $("dxOrderHistory")?.scrollIntoView({behavior:"smooth",block:"start"}); loadDXOrderHistory(); }
      if (action === "messages") { $("dxChatAccordion").open = true; $("dxChatCenter")?.scrollIntoView({behavior:"smooth",block:"start"}); loadDXChatConversations(); }
      if (action === "help") { $("dxHelpAccordion").open = true; $("dxHelpCenter")?.scrollIntoView({behavior:"smooth",block:"start"}); }
      if (action === "edit") { $("dxProfileEditAccordion").open = true; $("dxProfileEdit")?.scrollIntoView({behavior:"smooth",block:"start"}); }
    });
    button.dataset.bound = "1";
  });
  if($("dxChatRefresh")&&!$("dxChatRefresh").dataset.bound){$("dxChatRefresh").addEventListener("click",loadDXChatConversations);$("dxChatRefresh").dataset.bound="1";}
  if($("dxChatBack")&&!$("dxChatBack").dataset.bound){$("dxChatBack").addEventListener("click",()=>{ $("dxChatThread").hidden=true; window.dxActiveChatId=null; if(window.dxChatChannel){dxSupabase.removeChannel(window.dxChatChannel);window.dxChatChannel=null;} });$("dxChatBack").dataset.bound="1";}
  if($("dxChatSendForm")&&!$("dxChatSendForm").dataset.bound){$("dxChatSendForm").addEventListener("submit",sendDXChatMessage);$("dxChatSendForm").dataset.bound="1";}
  if($("dxRefreshOrders")&&!$("dxRefreshOrders").dataset.bound){$("dxRefreshOrders").addEventListener("click",loadDXOrderHistory);$("dxRefreshOrders").dataset.bound="1";}
  if($("dxSellerApplicationForm")) loadDXSellerApplicationState();
  if($("dxSupportForm")&&!$("dxSupportForm").dataset.bound){$("dxSupportForm").addEventListener("submit",submitDXSupportTicket);$("dxSupportForm").dataset.bound="1";}
  if(currentUser){loadDXOrderHistory();loadDXMyTickets();}
  const accountLogout = $("dxAccountLogout");
  if (accountLogout && !accountLogout.dataset.bound) {
    accountLogout.addEventListener("click", handleDXLogout);
    accountLogout.dataset.bound = "1";
  }
  const accountPanel = $("dxProfilePanel");
  const adminPanel = $("dxAdminPanel");
  if (accountPanel && adminPanel && adminPanel.parentElement !== accountPanel) {
    accountPanel.appendChild(adminPanel);
  }
  const adminAccessButton = $("dxOpenAdmin");
  if (adminAccessButton && !adminAccessButton.dataset.bound) {
    adminAccessButton.addEventListener("click", async () => {
      if (!(await checkDXAdmin())) {
        window.dxAdminPanelExpanded = false;
        if (adminPanel) adminPanel.style.display = "none";
        adminAccessButton.hidden = true;
        const card = $("dxAdminAccessCard");
        if (card) card.hidden = true;
        return;
      }
      window.dxAdminPanelExpanded = !window.dxAdminPanelExpanded;
      if (adminPanel) adminPanel.style.display = window.dxAdminPanelExpanded ? "block" : "none";
      adminAccessButton.innerHTML = window.dxAdminPanelExpanded ? "<span>×</span> Tutup Pengaturan Website <b>⌃</b>" : "<span>⚙</span> Buka Pengaturan Website <b>›</b>";
      if (window.dxAdminPanelExpanded) {
        await Promise.all([loadDXAdminList(), loadDXPaymentOrders(), loadDXStoreSettings(), loadDXAdminTickets(), loadDXAdminOverview(), loadDXAdminUsers()]);
        adminPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    adminAccessButton.dataset.bound = "1";
  }
  let bottom = $("dxBottomNav");
  if (!bottom) {
    bottom = document.createElement("nav");
    bottom.id = "dxBottomNav";
    bottom.setAttribute("aria-label","Navigasi utama");
    bottom.innerHTML = '<button type="button" data-dx-view="home"><span>⌂</span><small>Beranda</small></button><button type="button" data-dx-view="products"><span>▣</span><small>Produk</small></button><button type="button" data-dx-view="accounts"><span>🎮</span><small>Akun Game</small></button><button type="button" data-dx-view="profile"><span>◎</span><small>Akun</small></button>';
    document.body.appendChild(bottom);
  }
  bottom.hidden = !visible;
  if (visible) showDXView(dxActiveView);
  applyDXLanguage();
}

/* STATUS TOMBOL HEADER */

function updateDXHeaderAuth() {
  const actions = document.querySelector(".dx-nav-actions");
  const button = actions?.querySelector(".dx-button");
  if (!actions || !button) return;

  button.textContent = currentUser ? "Akun" : "Masuk / Daftar";

  button.onclick = () => {
    if (currentUser) showDXView("profile");
    else openAuth();
  };

  let countrySelect = $("dxCountry");
  if (currentUser && !countrySelect) {
    countrySelect = document.createElement("select");
    countrySelect.id = "dxCountry";
    countrySelect.setAttribute("aria-label", "Pilih negara");
    countrySelect.title = "Ubah negara";
    countrySelect.style.cssText = "min-height:38px;width:82px;max-width:82px;padding:0 6px;border:1px solid rgba(81,229,255,.45);border-radius:10px;background:#101b32;color:#eaf5ff;font:700 12px Inter,sans-serif";
    const countryFlags = DX_COUNTRY_FLAGS;
    Object.entries(DX_COUNTRIES).forEach(([code]) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = (countryFlags[code] || "🌐") + " " + code;
      countrySelect.appendChild(option);
    });
    countrySelect.addEventListener("change", () => setDXCountry(countrySelect.value));
    actions.insertBefore(countrySelect, button);
  }

  if (countrySelect) {
    countrySelect.hidden = !currentUser;
    countrySelect.value = getDXCountry().code;
  }
  updateDXDashboardVisibility();
}

/* =========================================
   DX STORE - BAGIAN 2 DARI 5
   PRODUK DIGITAL DAN MARKETPLACE AKUN GAME
========================================= */


/* POPUP AKTIVITAS DX STORE — tampil hanya jika ada transaksi nyata */
let dxPurchaseToastRows = [];
let dxPurchaseToastIndex = 0;
let dxPurchaseToastTimer = null;
let dxPurchaseToastDismissed = false;

async function loadDXRecentPurchaseActivity() {
  const host = document.getElementById("dxPurchaseActivity");
  if (!host) return;

  let purchases = [];
  if (dxSupabase) {
    const { data, error } = await dxSupabase.rpc("dx_public_recent_purchase_activity", { p_limit: 12 });
    if (error) console.warn("Aktivitas pembelian belum dapat dimuat:", error);
    if (Array.isArray(data)) purchases = data;
  }

  // Jangan tampilkan pesan sambutan, data contoh, atau notifikasi palsu.
  // Area notifikasi benar-benar kosong sampai ada pembelian nyata.
  dxPurchaseToastRows = purchases
    .filter(row => row && row.buyer_name && row.item_name)
    .map(row => ({
      kind: "purchase",
      name: row.buyer_name,
      item: row.item_name,
      time: row.purchased_at
        ? new Date(row.purchased_at).toLocaleString(getDXCountry().locale || "id-ID", { dateStyle: "short", timeStyle: "short" })
        : "Baru saja"
    }));

  if (!dxPurchaseToastRows.length) {
    host.replaceChildren();
    host.hidden = true;
    return;
  }

  if (dxPurchaseToastIndex >= dxPurchaseToastRows.length) dxPurchaseToastIndex = 0;
  if (!dxPurchaseToastDismissed) {
    host.hidden = false;
    renderDXPurchaseToast();
  }

  if (!dxPurchaseToastTimer) {
    dxPurchaseToastTimer = setInterval(() => {
      const currentHost = document.getElementById("dxPurchaseActivity");
      if (!currentHost || currentHost.hidden || dxPurchaseToastDismissed || dxPurchaseToastRows.length < 2) return;
      dxPurchaseToastIndex = (dxPurchaseToastIndex + 1) % dxPurchaseToastRows.length;
      renderDXPurchaseToast();
    }, 4800);
  }
}

function renderDXPurchaseToast() {
  const host = document.getElementById("dxPurchaseActivity");
  const row = dxPurchaseToastRows[dxPurchaseToastIndex];
  if (!host || !row || row.kind !== "purchase" || dxPurchaseToastDismissed) return;

  // Satu kartu diganti dengan kartu berikutnya; tidak pernah menumpuk.
  host.innerHTML = `<div class="dx-toast-card" role="status" aria-live="polite">
    <span class="dx-toast-mark">DX</span>
    <div class="dx-toast-copy">
      <strong>${safeText(row.name)}</strong>
      <p>Baru membeli ${safeText(row.item)}</p>
      <small>${safeText(row.time)} · Pembelian tercatat</small>
    </div>
    <button class="dx-toast-close" type="button" aria-label="Tutup notifikasi">×</button>
  </div>`;
  host.querySelector(".dx-toast-close")?.addEventListener("click", () => {
    dxPurchaseToastDismissed = true;
    host.replaceChildren();
    host.hidden = true;
  });
}


function filterDXSoldOutListings(rows) {
  const tenMinutes = 10 * 60 * 1000;
  const now = Date.now();
  return rows.filter(item => {
    if (item.sale_status !== "sold_out") return true;
    const soldOutAt = Date.parse(item.sold_out_at || "");
    // If a legacy row has no timestamp, keep it visible rather than hiding it prematurely.
    return !Number.isFinite(soldOutAt) || now - soldOutAt < tenMinutes;
  });
}

async function fetchDXPublicRows(table) {
  if (!["products", "account_listings"].includes(table)) throw new Error("Tabel katalog tidak valid.");
  let sdkError = null;
  if (dxSupabase) {
    try {
      const { data, error } = await dxSupabase.from(table).select("*").eq("status", "active").order("created_at", { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) return filterDXSoldOutListings(data);
      sdkError = error;
    } catch (error) { sdkError = error; }
  }
  try {
    const response = await fetch(`${DX_CONFIG.supabaseUrl}/rest/v1/${table}?select=*&status=eq.active&order=created_at.desc`, {
      headers: { apikey: DX_CONFIG.supabaseKey, Authorization: `Bearer ${DX_CONFIG.supabaseKey}` },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`REST HTTP ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Format data katalog tidak valid.");
    return rows;
  } catch (restError) {
    console.error("Katalog gagal dimuat melalui SDK dan REST:", sdkError, restError);
    throw restError;
  }
}

async function loadProducts() {
  const grid = $("productGrid");
  if (!grid) return;
  grid.innerHTML = "<p>Memuat produk...</p>";
  try {
    const data = await fetchDXPublicRows("products");
    if (!data.length) { grid.innerHTML = "<p>Belum ada produk digital.</p>"; return; }
    grid.innerHTML = data.map(item => {
      const image = safeImageUrl(item.image_url);
      return `<article class="product-card">
        ${image ? `<img src="${safeText(image)}" alt="${safeText(item.name)}" loading="lazy" onerror="this.alt='Foto produk tidak dapat dimuat';this.removeAttribute('src');this.classList.add('dx-image-error')">` : '<div class="dx-product-image-placeholder">Foto produk belum tersedia</div>'}
        <div class="product-info">
          <h3>${safeText(item.name)}</h3><p>${safeText(item.description || "")}</p>
          <strong>${formatPrice(item.price)}</strong>
          ${Number(item.warranty_days ?? 7) > 0 ? `<p class="dx-product-warranty">🛡️ Garansi ${Number(item.warranty_days ?? 7)} hari</p>` : '<p class="dx-product-warranty">Tanpa garansi</p>'}
          ${item.sale_status === "pending" ? '<span class="dx-stock-status">PENDING — SEDANG DIPESAN</span>' : item.sale_status === "sold_out" ? '<span class="dx-stock-status dx-sold-out">SOLD OUT</span>' : ''}
          <button class="dx-button" type="button" ${item.sale_status !== "available" ? "disabled" : ""} onclick="selectItem('product','${safeText(item.id)}')">${item.sale_status === "pending" ? "Sedang Dipesan" : item.sale_status === "sold_out" ? "Habis Terjual" : "Lihat Produk"}</button>
        </div></article>`;
    }).join("");
    applyDXLanguage();
  } catch (error) {
    grid.innerHTML = "<p>Produk gagal dimuat. Silakan muat ulang halaman.</p>";
    console.error("Gagal memuat produk:", error);
  }
}

async function loadAccountListings() {
  const grid = $("accountGrid");
  if (!grid) return;
    grid.innerHTML = "<p>Memuat akun game...</p>";
  try {
    const data = await fetchDXPublicRows("account_listings");
    if (!data.length) { grid.innerHTML = "<p>Belum ada akun game yang disetujui admin.</p>"; return; }
    grid.innerHTML = data.map(item => {
      const image = safeImageUrl(item.image_url);
      return `<article class="product-card">
        ${image ? `<img src="${safeText(image)}" alt="${safeText(item.title)}" loading="lazy" onerror="this.alt='Foto akun tidak dapat dimuat';this.removeAttribute('src');this.classList.add('dx-image-error')">` : '<div class="dx-product-image-placeholder">Foto akun belum tersedia</div>'}
        <div class="product-info"><h3>${safeText(item.title)}</h3><p>${safeText(item.description || "")}</p>
          <strong>${formatPrice(item.price)}</strong>
          ${item.sale_status === "pending" ? '<span class="dx-stock-status">PENDING — SEDANG DIPESAN</span>' : item.sale_status === "sold_out" ? '<span class="dx-stock-status dx-sold-out">SOLD OUT</span>' : ''}
          <button class="dx-button" type="button" ${item.sale_status !== "available" ? "disabled" : ""} onclick="selectItem('account','${safeText(item.id)}')">${item.sale_status === "pending" ? "Sedang Dipesan" : item.sale_status === "sold_out" ? "Habis Terjual" : "Lihat Akun"}</button>
        </div></article>`;
    }).join("");
    applyDXLanguage();
  } catch (error) {
    grid.innerHTML = "<p>Akun game gagal dimuat. Silakan muat ulang halaman.</p>";
    console.error("Gagal memuat akun:", error);
  }
}

function selectItem(type, id) {
    const table = type === "account" ? "account_listings" : "products";
  if (!dxSupabase) return;

  dxSupabase.from(table).select("*").eq("id", id).maybeSingle()
    .then(({ data, error }) => {
      if (error || !data) {
        dxAlert("Data tidak ditemukan.");
        return;
      }

      let modal = document.getElementById("dxProductDetailModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "dxProductDetailModal";
        modal.className = "dx-detail-overlay";
        modal.innerHTML = '<section class="dx-detail-panel" role="dialog" aria-modal="true" aria-labelledby="dxDetailName"><button type="button" class="dx-detail-close" aria-label="Tutup">&times;</button><div id="dxDetailPhoto" class="dx-detail-photo"></div><div class="dx-detail-copy"><span id="dxDetailType" class="dx-detail-label"></span><h2 id="dxDetailName"></h2><p id="dxDetailDescription"></p><strong id="dxDetailPrice" class="dx-detail-price"></strong><div id="dxDetailWarranty" class="dx-detail-warranty"></div><button type="button" id="dxDetailChat" class="dx-button" style="margin:8px 8px 8px 0;background:#172b4d;border:1px solid #51e5ff;color:#51e5ff">Chat Penjual</button><button type="button" id="dxDetailOrder" class="dx-button">Lanjutkan</button></div></section>';
        document.body.appendChild(modal);
        modal.querySelector(".dx-detail-close").addEventListener("click", () => modal.classList.remove("active"));
        modal.addEventListener("click", event => { if (event.target === modal) modal.classList.remove("active"); });
        document.addEventListener("keydown", event => { if (event.key === "Escape") modal.classList.remove("active"); });
      }

      const name = data.name || data.title || "Item DX STORE";
      const image = safeImageUrl(data.image_url);
      modal.querySelector("#dxDetailName").textContent = name;
      modal.querySelector("#dxDetailType").textContent = type === "account" ? (data.game || "AKUN GAME") : (data.category || "PRODUK DIGITAL");
      modal.querySelector("#dxDetailDescription").textContent = data.description || "Belum ada deskripsi tambahan.";
      modal.querySelector("#dxDetailPrice").textContent = formatPrice(data.price);
      const warrantyBox = modal.querySelector("#dxDetailWarranty");
      if (type === "product") {
        const days = Number(data.warranty_days ?? 7);
        warrantyBox.innerHTML = days > 0
          ? '<strong>🛡️ Garansi resmi DX STORE · ' + days + ' hari</strong><p>' + safeText(data.warranty_terms || "Ajukan klaim melalui Pusat Bantuan dengan ID pesanan.") + '</p>'
          : '<strong>Produk ini tidak memiliki garansi.</strong>';
      } else {
        warrantyBox.innerHTML = '<p style="margin:8px 0;color:#b8c9e6">Keamanan: DX STORE tidak meminta kata sandi atau OTP. Proses serah terima harus mengikuti mekanisme resmi yang disediakan oleh game.</p>';
      }
      modal.querySelector("#dxDetailPhoto").innerHTML = image ? '<img src="' + safeText(image) + '" alt="' + safeText(name) + '">' : '<span>DX STORE</span>';
      const chatButton=modal.querySelector("#dxDetailChat"); chatButton.hidden=!data.seller_id||data.seller_id===currentUser?.id; chatButton.onclick=()=>startDXSellerChat(type,data);
      const unavailable = data.status !== "active" || (data.sale_status || "available") !== "available";
      modal.querySelector("#dxDetailOrder").disabled = unavailable;
      modal.querySelector("#dxDetailOrder").textContent = data.sale_status === "pending" ? "PENDING — SEDANG DIPESAN" : data.sale_status === "sold_out" ? "SOLD OUT" : "Lanjutkan";
      modal.querySelector("#dxDetailOrder").onclick = () => {
        if (unavailable) return;
        modal.classList.remove("active");
        if (!currentUser) {
          openAuth();
          showDXMessage("Masuk atau daftar untuk melanjutkan pemesanan.");
          return;
        }
        openDXCheckout(type, data);
      };
      modal.classList.add("active");
    });
}

/* CHECKOUT QRIS MANUAL DX STORE
   Nominal pesanan diambil dari backend; pembeli memasukkannya sendiri
   saat membayar melalui QRIS statis. Bukti diverifikasi admin.
*/
function createDXCheckoutModal() {
  let modal = $("dxCheckoutModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "dxCheckoutModal";
  modal.className = "dx-checkout-overlay";
  modal.innerHTML = `
    <section class="dx-checkout-panel" role="dialog" aria-modal="true" aria-labelledby="dxCheckoutTitle">
      <button type="button" class="dx-checkout-close" aria-label="Tutup">&times;</button>
      <header class="dx-checkout-brand">
        <div class="dx-checkout-logo">DX <span>STORE</span></div>
        <small>GAME TOP UP &amp; DIGITAL PRODUCT</small>
      </header>
      <div class="dx-checkout-banner">
        <span class="dx-checkout-qr-icon">▦</span>
        <div><h2 id="dxCheckoutTitle">Pembayaran QRIS Manual</h2><p>Scan QRIS, lalu masukkan nominal sesuai total pesanan</p></div>
      </div>
      <div class="dx-checkout-main">
        <div class="dx-checkout-qr" id="dxCheckoutQr">
          <div class="dx-checkout-qr-placeholder">QRIS<br>AKAN MUNCUL<br>SETELAH TRANSAKSI DIBUAT</div>
        </div>
        <div class="dx-checkout-details">
          <small>Barang yang dibeli</small>
          <strong id="dxCheckoutItem">-</strong>
          <small>Nominal Pembayaran</small>
          <strong class="dx-checkout-amount" id="dxCheckoutAmount">Rp0</strong>
          <small>Status Pembayaran</small>
          <div class="dx-checkout-status" id="dxCheckoutStatus">Menunggu pembuatan transaksi</div>
          <small>Metode Pembayaran</small>
          <strong id="dxCheckoutExpiry">-</strong>
        </div>
      </div>
      <p class="dx-checkout-note" id="dxCheckoutMessage" aria-live="polite">QRIS DANA Bisnis statis. Masukkan nominal yang tertera saat membayar; admin akan memeriksa pembayaran secara manual.</p>
      <div class="dx-checkout-proof" style="margin:16px 0;display:grid;gap:10px">
        <label for="dxPaymentProof">Unggah bukti pembayaran (JPG/PNG, maks. 4 MB)</label>
        <input id="dxPaymentProof" type="file" accept="image/jpeg,image/png" disabled>
        <button type="button" class="dx-button" id="dxSubmitProof" disabled>Kirim Bukti Pembayaran</button>
      </div>
      <div class="dx-checkout-actions">
        <button type="button" class="dx-button" id="dxCreatePayment">Buat Pesanan</button>
        <button type="button" class="dx-button dx-checkout-secondary" id="dxCheckPayment" disabled>↻ Cek Status Pesanan</button>
      </div>
      <div class="dx-checkout-instructions">
        <strong>Petunjuk Pembayaran</strong>
        <ol>
          <li>Periksa nominal total pesanan yang ditampilkan DX STORE.</li>
          <li>Buka aplikasi pembayaran yang mendukung QRIS.</li>
          <li>Scan QRIS DX STORE dan masukkan nominal tersebut secara manual dengan tepat.</li>
          <li>Unggah bukti pembayaran. Pesanan baru dinyatakan lunas setelah admin memeriksa dana masuk.</li>
        </ol>
      </div>
      <button type="button" class="dx-checkout-close-link">Tutup</button>
    </section>`;

  const style = document.createElement("style");
  style.id = "dxCheckoutStyles";
  style.textContent = `
    .dx-checkout-overlay{position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.9);backdrop-filter:blur(12px);overflow:auto}
    .dx-checkout-overlay.active{display:flex}
    .dx-checkout-panel{position:relative;width:min(900px,100%);max-height:94vh;overflow:auto;padding:25px;border:1px solid #278dff;border-radius:24px;background:radial-gradient(circle at 0 0,rgba(20,115,255,.18),transparent 35%),radial-gradient(circle at 100% 20%,rgba(128,45,255,.18),transparent 35%),#071126;color:#f5f7ff;box-shadow:0 0 45px rgba(20,130,255,.18)}
    .dx-checkout-close{position:absolute;top:14px;right:16px;width:38px;height:38px;border:1px solid #38527d;border-radius:12px;background:#111d39;color:#fff;font-size:25px}
    .dx-checkout-brand{display:flex;align-items:center;gap:18px;margin-bottom:22px}
    .dx-checkout-logo{font-size:28px;font-weight:900;font-style:italic;color:#28caff}.dx-checkout-logo span{color:#bd6cff}
    .dx-checkout-brand small{padding-left:18px;border-left:1px solid #7890bd;color:#dce6ff;font-size:12px}
    .dx-checkout-banner{display:flex;align-items:center;gap:18px;padding:18px 22px;border:1px solid #5e6dff;border-radius:17px;background:linear-gradient(105deg,#155eea,#7414db);margin-bottom:25px}
    .dx-checkout-qr-icon{font-size:38px}.dx-checkout-banner h2{font-size:25px;margin:0 0 5px}.dx-checkout-banner p{margin:0;color:#e5eaff;font-size:13px}
    .dx-checkout-main{display:grid;grid-template-columns:minmax(210px,1fr) minmax(220px,1fr);gap:28px;align-items:center}
    .dx-checkout-qr{min-height:260px;display:grid;place-items:center;padding:18px;border:2px dashed #526caa;border-radius:18px;background:#fff;color:#667085;text-align:center}
    .dx-checkout-qr img{width:min(100%,300px);max-height:300px;object-fit:contain}
    .dx-checkout-qr-placeholder{font-size:15px;font-weight:800;line-height:1.8}
    .dx-checkout-details{display:grid;gap:8px}.dx-checkout-details small{color:#9eb1d6;font-size:12px;margin-top:8px}.dx-checkout-details strong{overflow-wrap:anywhere}.dx-checkout-amount{font-size:clamp(30px,5vw,43px);color:#fff}.dx-checkout-status{padding:12px;border:1px solid #eab308;border-radius:12px;color:#facc15;background:rgba(120,75,0,.2);font-weight:700}
    .dx-checkout-note{margin:20px 0;padding:13px;border:1px solid #30466f;border-radius:12px;color:#c4d3ee;font-size:13px;line-height:1.6}
    .dx-checkout-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dx-checkout-actions button{min-height:48px;border:0;border-radius:12px;color:#fff;font-weight:800;background:linear-gradient(100deg,#087eea,#8618d5)}.dx-checkout-actions button:disabled{opacity:.45;cursor:not-allowed}.dx-checkout-actions .dx-checkout-secondary{background:#182747;border:1px solid #46618f}
    .dx-checkout-instructions{margin-top:22px;padding:18px;border:1px solid #344a75;border-radius:14px;color:#cbd8f1;font-size:13px;line-height:1.8}.dx-checkout-instructions strong{color:#36caff}.dx-checkout-instructions ol{padding-left:20px;margin-top:8px}
    .dx-checkout-close-link{display:block;margin:16px auto 0;border:0;background:transparent;color:#9bb7e8}
    @media(max-width:620px){.dx-checkout-panel{padding:18px}.dx-checkout-brand{display:block}.dx-checkout-brand small{display:block;margin-top:7px;padding:0;border:0}.dx-checkout-main{grid-template-columns:1fr}.dx-checkout-qr{min-height:220px}.dx-checkout-actions{grid-template-columns:1fr}.dx-checkout-banner{padding:14px}.dx-checkout-banner h2{font-size:20px}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(modal);

  const close = () => modal.classList.remove("active");
  modal.querySelector(".dx-checkout-close").addEventListener("click", close);
  modal.querySelector(".dx-checkout-close-link").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  return modal;
}

function openDXCheckout(type, item) {
  const modal = createDXCheckoutModal();
  const itemName = item.name || item.title || "Item DX STORE";
  const amount = Number(item.price);
  modal.dataset.itemType = type;
  modal.dataset.itemId = String(item.id);
  modal.dataset.itemAmount = String(Number(item.price) || 0);
  modal.dataset.orderId = "";
  $("dxCheckoutItem").textContent = itemName;
  $("dxCheckoutAmount").textContent = formatPrice(amount);
  $("dxCheckoutExpiry").textContent = "-";
  $("dxCheckoutStatus").textContent = "Menunggu pembuatan transaksi";
  $("dxCheckoutQr").innerHTML = '<div class="dx-checkout-qr-placeholder">QRIS DANA BISNIS<br>AKAN MUNCUL SETELAH PESANAN DIBUAT</div>';
  $("dxCheckoutMessage").textContent = "Pembayaran QRIS manual. Admin akan memeriksa bukti pembayaran.";
  $("dxCreatePayment").disabled = false;
  $("dxCheckPayment").disabled = true;
  $("dxPaymentProof").value = "";
  $("dxPaymentProof").disabled = true;
  $("dxSubmitProof").disabled = true;
  $("dxSubmitProof").textContent = "Kirim Bukti Pembayaran";
  $("dxCreatePayment").onclick = createDXPayment;
  $("dxCheckPayment").onclick = checkDXPaymentStatus;
  $("dxSubmitProof").onclick = submitDXPaymentProof;
  modal.classList.add("active");
}

async function createDXPayment() {
  const modal = $("dxCheckoutModal");
  const base = DX_CONFIG.paymentApiUrl;
  if (!base) { $("dxCheckoutMessage").textContent = "Server pesanan belum dikonfigurasi."; return; }
  const button = $("dxCreatePayment");
  button.disabled = true;
  button.textContent = "Membuat pesanan...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    if (!session?.access_token) throw new Error("Silakan masuk terlebih dahulu.");
    const response = await fetch(new URL("api/payments/create", base + "/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ itemType: modal.dataset.itemType, itemId: modal.dataset.itemId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal dibuat.");
    if (!result.orderId || !Number.isFinite(Number(result.amount))) throw new Error("Data pesanan dari server tidak lengkap.");
    modal.dataset.orderId = result.orderId;
    $("dxCheckoutAmount").textContent = formatPrice(result.amount);
    $("dxCheckoutStatus").textContent = "Menunggu pembayaran";
    $("dxCheckoutQr").innerHTML = '<img src="payment-qris.png" alt="QRIS resmi DANA Bisnis DX STORE">';
    $("dxCheckoutExpiry").textContent = "QRIS statis · pembayaran manual";
    $("dxCheckoutMessage").textContent = "Total pesanan: " + formatPrice(result.amount) + ". Scan QRIS statis DX STORE, masukkan nominal ini secara manual, lalu unggah bukti pembayaran. Admin akan memeriksa pembayaran sebelum pesanan dinyatakan lunas.";
    $("dxPaymentProof").disabled = false;
    $("dxSubmitProof").disabled = false;
    $("dxCheckPayment").disabled = false;
    button.disabled = true;
    button.textContent = "Pesanan Dibuat";
    window.dispatchEvent(new CustomEvent("dx:order-update", { detail: { status: "pending" } }));
  } catch (error) {
    $("dxCheckoutMessage").textContent = getDXError(error);
    button.disabled = false;
    button.textContent = "Buat Pesanan";
  }
}

async function submitDXPaymentProof() {
  const modal = $("dxCheckoutModal");
  const file = $("dxPaymentProof")?.files?.[0];
  const orderId = modal.dataset.orderId;
  if (!orderId) { $("dxCheckoutMessage").textContent = "Buat pesanan terlebih dahulu."; return; }
  if (!file || !["image/jpeg", "image/png"].includes(file.type) || file.size > 4 * 1024 * 1024) {
    $("dxCheckoutMessage").textContent = "Pilih bukti JPG/PNG dengan ukuran maksimal 4 MB.";
    return;
  }
  const button = $("dxSubmitProof");
  button.disabled = true; button.textContent = "Mengirim bukti...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    if (!session?.access_token) throw new Error("Sesi login berakhir. Silakan masuk kembali.");
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = currentUser.id + "/" + orderId + "." + ext;
    const upload = await dxSupabase.storage.from("payment-proofs").upload(path, file, { upsert: true, contentType: file.type });
    if (upload.error) throw upload.error;
    const response = await fetch(new URL("api/payments/submit-proof", DX_CONFIG.paymentApiUrl + "/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session.access_token },
      body: JSON.stringify({ orderId, proofPath: path })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Bukti pembayaran gagal dikirim.");
    $("dxCheckoutStatus").textContent = "Menunggu pemeriksaan admin";
    $("dxCheckoutMessage").textContent = "Bukti diterima. Pesanan belum lunas sampai admin memeriksa dana masuk.";
    $("dxPaymentProof").disabled = true;
    window.dispatchEvent(new CustomEvent("dx:order-update", { detail: { status: "proof" } }));
  } catch (error) {
    $("dxCheckoutMessage").textContent = getDXError(error);
    button.disabled = false;
  } finally {
    button.textContent = button.disabled ? "Bukti Terkirim" : "Kirim Bukti Pembayaran";
  }
}

async function checkDXPaymentStatus() {
  const modal = $("dxCheckoutModal");
  const base = DX_CONFIG?.paymentApiUrl;
  const orderId = modal?.dataset?.orderId;
  const button = $("dxCheckPayment");
  const message = $("dxCheckoutMessage");
  if (!base) { if (message) message.textContent = "Server pemeriksaan pesanan belum dikonfigurasi. Muat ulang halaman."; return; }
  if (!orderId) { if (message) message.textContent = "ID pesanan belum tersedia. Tekan Buat Pesanan terlebih dahulu."; return; }
  if (!button) return;
  button.disabled = true;
  button.textContent = "Memeriksa...";
  if (message) message.textContent = "Menghubungi server untuk mengambil status terbaru...";
  try {
    const { data, error: sessionError } = await dxSupabase.auth.getSession();
    if (sessionError) throw sessionError;
    const token = data?.session?.access_token;
    if (!token) throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");
    const url = new URL("api/payments/status", base.endsWith("/") ? base : base + "/");
    url.searchParams.set("orderId", orderId);
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      headers: { "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + token, "Accept": "application/json" }
    });
    const raw = await response.text();
    let result = {};
    try { result = raw ? JSON.parse(raw) : {}; } catch { throw new Error("Server mengirim jawaban yang tidak dapat dibaca (HTTP " + response.status + ")."); }
    if (!response.ok) throw new Error(result.message || "Pemeriksaan status gagal (HTTP " + response.status + ").");
    if (!result.status) throw new Error("Server tidak mengirim status pesanan. Coba muat ulang halaman.");
    const labels = { pending: "Menunggu pembayaran", review: "Menunggu pemeriksaan admin", paid: "LUNAS", rejected: "Bukti ditolak" };
    const statusText = labels[result.status] || result.status;
    $("dxCheckoutStatus").textContent = statusText;
    window.dispatchEvent(new CustomEvent("dx:order-update", { detail: { status: result.status, orderId } }));
    if (message) message.textContent = result.status === "paid"
      ? "Pembayaran telah diverifikasi oleh admin."
      : result.status === "rejected"
        ? "Bukti pembayaran ditolak. Hubungi admin DX STORE."
        : "Status terbaru berhasil dimuat: " + statusText + ".";
    // Setelah status berhasil diperiksa, arahkan pengguna langsung ke halaman Riwayat Pesanan.
    modal?.classList.remove("active");
    showDXView("profile");
    const orderAccordion = $("dxOrderAccordion");
    if (orderAccordion) orderAccordion.open = true;
    await loadDXOrderHistory();
    const orderCard = document.querySelector(`[data-dx-order-history-id="${CSS.escape(String(orderId))}"]`);
    (orderCard || $("dxOrderHistory"))?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (orderCard) {
      orderCard.style.outline = "2px solid #38bdf8";
      orderCard.style.outlineOffset = "4px";
    }
  } catch (error) {
    if (message) message.textContent = "Status belum berhasil diperiksa: " + getDXError(error);
  } finally {
    button.disabled = false;
    button.textContent = "↻ Cek Status Pesanan";
  }
}

function subscribeDXProductUpdates() {
  if (!dxSupabase || window.__dxProductRealtimeChannel) return;

  window.__dxProductRealtimeChannel = dxSupabase
    .channel("dx-public-product-catalog")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      () => loadProducts()
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("Pembaruan katalog realtime belum tersambung:", status);
      }
    });
}

async function loadDXStore() {
  subscribeDXProductUpdates();
  await Promise.all([
    loadProducts(),
    loadAccountListings()
  ]);
}



/* DX ACCOUNT SERVICES */

/* OBROLAN PENJUAL & PEMBELI */
window.dxActiveChatId = null;
window.dxChatChannel = null;

async function loadDXAdminChatConversations(){
 const box=$("dxAdminChatList");if(!box||!currentUser||!dxSupabase)return;
 const allowed=await checkDXAdmin();if(!allowed){box.textContent="Akses khusus admin.";return;}
 box.innerHTML='<div class="dx-chat-header"><div><h3>Kotak Masuk</h3><p>Percakapan antara pembeli dan penjual</p></div><button type="button" id="dxAdminChatReload" class="dx-chat-reload">↻ Muat ulang</button></div><div id="dxAdminChatRows" class="dx-chat-rows"><div class="dx-chat-empty">Memuat percakapan…</div></div><div id="dxAdminChatThread" class="dx-chat-thread" hidden><div class="dx-chat-thread-head"><strong id="dxAdminChatTitle">Percakapan</strong><span>Mode administrator</span></div><div id="dxAdminChatMessages" role="log" aria-live="polite" class="dx-chat-messages"></div><form id="dxAdminChatForm" class="dx-chat-form"><label for="dxAdminChatComposer">Balas sebagai admin</label><textarea id="dxAdminChatComposer" rows="3" maxlength="2000" placeholder="Tulis balasan…" required></textarea><div class="dx-chat-form-foot"><small>Maksimal 2.000 karakter</small><button type="submit" id="dxAdminChatSend">Kirim Balasan</button></div><p id="dxAdminChatFeedback" role="status"></p></form></div>';
 $("dxAdminChatReload").addEventListener("click",loadDXAdminChatConversations);
 const {data,error}=await dxSupabase.from("dx_conversations").select("id,buyer_id,seller_id,listing_title,listing_type,created_at,updated_at").order("created_at",{ascending:false}).limit(100);
 const rows=$("dxAdminChatRows");
 if(error){rows.textContent="Gagal memuat obrolan: "+getDXError(error);return;}
 if(!data?.length){rows.innerHTML='<div class="dx-chat-empty"><span class="dx-chat-empty-icon">✉</span><strong>Belum ada percakapan</strong><p>Pesan dari pembeli dan penjual akan muncul di sini.</p></div>';return;}
 rows.innerHTML=data.map(c=>'<button type="button" class="dx-chat-row" data-dx-admin-chat="'+safeText(c.id)+'"><span class="dx-chat-avatar">✉</span><span class="dx-chat-row-main"><strong>'+safeText(c.listing_title||"Listing tanpa judul")+'</strong><small>Pembeli · '+safeText(c.buyer_id.slice(0,8))+'　Penjual · '+safeText(c.seller_id.slice(0,8))+'</small></span><span class="dx-chat-type">'+(c.listing_type==="account"?"Akun game":"Market")+'</span><span class="dx-chat-chevron">›</span></button>').join("");
 rows.querySelectorAll("[data-dx-admin-chat]").forEach(b=>b.addEventListener("click",()=>openDXAdminChatThread(b.dataset.dxAdminChat)));
}
async function openDXAdminChatThread(id){
 if(!await checkDXAdmin())return;
 const {data:conv,error}=await dxSupabase.from("dx_conversations").select("id,listing_title,buyer_id,seller_id").eq("id",id).maybeSingle();
 if(error||!conv){dxAlert("Percakapan tidak dapat diakses.");return;}
 window.dxAdminActiveChatId=id;
 if(window.dxAdminChatChannel){dxSupabase.removeChannel(window.dxAdminChatChannel);window.dxAdminChatChannel=null;}
 $("dxAdminChatThread").hidden=false;
 $("dxAdminChatTitle").textContent=conv.listing_title+" · Admin";
 await loadDXAdminChatMessages(id);
 window.dxAdminChatChannel=dxSupabase.channel("dx-admin-chat-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"dx_messages",filter:"conversation_id=eq."+id},()=>loadDXAdminChatMessages(id)).subscribe();
 const form=$("dxAdminChatForm");
 if(!form.dataset.bound){form.addEventListener("submit",sendDXAdminChatMessage);form.dataset.bound="1";}
}
async function loadDXAdminChatMessages(id){
 const host=$("dxAdminChatMessages");if(!host)return;
 const {data,error}=await dxSupabase.from("dx_messages").select("id,sender_id,body,created_at").eq("conversation_id",id).order("created_at",{ascending:true}).limit(300);
 if(error){host.textContent="Pesan gagal dimuat: "+getDXError(error);return;}
 if(!data?.length){host.textContent="Belum ada pesan.";return;}
 host.innerHTML=data.map(m=>'<div style="justify-self:'+(m.sender_id===currentUser.id?"end":"start")+';max-width:88%;padding:10px 12px;border-radius:12px;background:'+(m.sender_id===currentUser.id?"#164e86":"#182844")+';color:#fff"><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+safeText(m.body)+'</p><small>'+ (m.sender_id===currentUser.id?"Admin":"Pengguna")+' · '+new Date(m.created_at).toLocaleString(getDXCountry().locale||"id-ID")+'</small></div>').join("");
 host.scrollTop=host.scrollHeight;
}
async function sendDXAdminChatMessage(event){
 event.preventDefault();if(!window.dxAdminActiveChatId||!await checkDXAdmin())return;
 const input=$("dxAdminChatComposer"),button=$("dxAdminChatSend"),feedback=$("dxAdminChatFeedback"),body=input.value.trim();
 if(!body)return;button.disabled=true;feedback.textContent="Mengirim balasan...";
 const {error}=await dxSupabase.from("dx_messages").insert({conversation_id:window.dxAdminActiveChatId,sender_id:currentUser.id,body});
 button.disabled=false;
 if(error){feedback.textContent="Balasan gagal dikirim: "+getDXError(error);return;}
 input.value="";feedback.textContent="Balasan terkirim.";await loadDXAdminChatMessages(window.dxAdminActiveChatId);
}

async function loadDXChatConversations(){
 const host=$("dxChatConversationList"); if(!host||!currentUser||!dxSupabase)return;
 host.textContent="Memuat percakapan...";
 const {data,error}=await dxSupabase.from("dx_conversations").select("id,buyer_id,seller_id,listing_title,listing_type,updated_at,created_at").or("buyer_id.eq."+currentUser.id+",seller_id.eq."+currentUser.id).order("updated_at",{ascending:false}).limit(50);
 if(error){host.textContent="Percakapan gagal dimuat: "+getDXError(error);return;}
 if(!data?.length){host.textContent="Belum ada percakapan. Buka produk dan pilih Chat Penjual untuk memulai.";return;}
 host.innerHTML=data.map(c=>{
  const other=c.buyer_id===currentUser.id?"Penjual":"Pembeli";
  return '<button type="button" data-dx-chat-open="'+safeText(c.id)+'" style="width:100%;display:flex;justify-content:space-between;gap:10px;text-align:left;padding:13px;margin:7px 0;border:1px solid #385477;border-radius:12px;background:#0b1426;color:#fff"><span><b>'+safeText(c.listing_title)+'</b><small style="display:block;color:#aab8d0;margin-top:4px">'+other+' · '+(c.listing_type==="account"?"Akun game":"Produk digital")+'</small></span><span>›</span></button>';
 }).join("");
 host.querySelectorAll("[data-dx-chat-open]").forEach(b=>b.addEventListener("click",()=>openDXChatThread(b.dataset.dxChatOpen)));
}
async function startDXSellerChat(type,item){
 if(!currentUser){openAuth();showDXMessage("Masuk terlebih dahulu untuk menghubungi penjual.");return;}
 if(!item?.seller_id||item.seller_id===currentUser.id){dxAlert("Obrolan hanya tersedia untuk menghubungi penjual lain.");return;}
 if(!dxSupabase)return;
 const payload={buyer_id:currentUser.id,seller_id:item.seller_id,listing_type:type,listing_id:item.id,listing_title:item.name||item.title||"Produk DX STORE"};
 const {data:existing,error:findError}=await dxSupabase.from("dx_conversations").select("id").eq("buyer_id",payload.buyer_id).eq("seller_id",payload.seller_id).eq("listing_type",payload.listing_type).eq("listing_id",payload.listing_id).maybeSingle();
 if(findError){dxAlert("Tidak dapat memeriksa percakapan: "+getDXError(findError));return;}
 let id=existing?.id;
 if(!id){const {data,error}=await dxSupabase.from("dx_conversations").insert(payload).select("id").single();if(error){dxAlert("Percakapan tidak dapat dibuat: "+getDXError(error));return;}id=data.id;}
 const modal=$("dxProductDetailModal");if(modal)modal.classList.remove("active");
 showDXView("profile");$("dxChatAccordion").open=true;$("dxChatCenter")?.scrollIntoView({behavior:"smooth",block:"start"});
 await openDXChatThread(id);
}
async function openDXChatThread(id){
 if(!currentUser||!dxSupabase)return;
 const {data:conversation,error}=await dxSupabase.from("dx_conversations").select("id,buyer_id,seller_id,listing_title").eq("id",id).maybeSingle();
 if(error||!conversation){dxAlert("Percakapan tidak ditemukan atau akses ditolak.");return;}
 window.dxActiveChatId=id;
 $("dxChatThread").hidden=false;
 $("dxChatThreadTitle").textContent=conversation.listing_title;
 await loadDXChatMessages(id);
 if(window.dxChatChannel)dxSupabase.removeChannel(window.dxChatChannel);
 window.dxChatChannel=dxSupabase.channel("dx-chat-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"dx_messages",filter:"conversation_id=eq."+id},()=>loadDXChatMessages(id)).subscribe();
}
async function loadDXChatMessages(id){
 const host=$("dxChatMessages");if(!host||!dxSupabase)return;
 const {data,error}=await dxSupabase.from("dx_messages").select("id,sender_id,body,created_at").eq("conversation_id",id).order("created_at",{ascending:true}).limit(300);
 if(error){host.textContent="Pesan gagal dimuat: "+getDXError(error);return;}
 if(!data?.length){host.textContent="Belum ada pesan. Mulai percakapan dengan sopan dan jangan kirim kata sandi atau kode OTP.";return;}
 host.innerHTML=data.map(m=>'<div style="justify-self:'+(m.sender_id===currentUser.id?"end":"start")+';max-width:88%;padding:10px 12px;border-radius:12px;background:'+(m.sender_id===currentUser.id?"#164e86":"#182844")+';color:#fff"><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+safeText(m.body)+'</p><small style="display:block;margin-top:5px;color:#c1d1e8;font-size:10px">'+(m.sender_id===currentUser.id?"Kamu":"Lawan bicara")+' · '+new Date(m.created_at).toLocaleString(getDXCountry().locale||"id-ID")+'</small></div>').join("");
 host.scrollTop=host.scrollHeight;
}
async function sendDXChatMessage(event){
 event.preventDefault();const input=$("dxChatComposer"),button=$("dxChatSend"),feedback=$("dxChatFeedback"),body=input?.value.trim();
 if(!currentUser||!window.dxActiveChatId||!body)return;
 button.disabled=true;feedback.textContent="Mengirim...";
 const {error}=await dxSupabase.from("dx_messages").insert({conversation_id:window.dxActiveChatId,sender_id:currentUser.id,body});
 button.disabled=false;
 if(error){feedback.textContent="Pesan gagal dikirim: "+getDXError(error);return;}
 input.value="";feedback.textContent="Pesan terkirim.";await loadDXChatMessages(window.dxActiveChatId);
}

async function loadDXOrderHistory(){
 const host=$("dxOrderHistoryList");if(!host||!dxSupabase||!currentUser)return;
 host.textContent="Memuat pesanan...";
 const {data,error}=await dxSupabase.from("orders").select("id,item_name,total_amount,status,created_at,item_type").eq("buyer_id",currentUser.id).order("created_at",{ascending:false}).limit(50);
 if(error){host.textContent="Riwayat gagal dimuat: "+getDXError(error);return;}
 if(!data?.length){host.textContent="Belum ada pesanan.";return;}
 const session=(await dxSupabase.auth.getSession()).data.session;
 const labels={pending:"Menunggu pembayaran",review:"Menunggu verifikasi pembayaran",paid:"Lunas · menunggu diproses",processing:"Sedang diproses",delivered:"Penyerahan selesai · konfirmasi penerimaan",completed:"Selesai",cancelled:"Dibatalkan",rejected:"Ditolak",disputed:"Dalam penanganan"};
 const cards=await Promise.all(data.map(async o=>{
  let deliveryHtml="";
  if(o.item_type==="product"&&["delivered","completed"].includes(o.status)&&session?.access_token){
   try{
    const response=await fetch(new URL("api/payments/delivery?orderId="+encodeURIComponent(o.id),DX_CONFIG.paymentApiUrl+"/"),{headers:{"apikey":DX_CONFIG.supabaseKey,"Authorization":"Bearer "+session.access_token}});
    if(response.ok){
     const result=await response.json(),delivery=result.delivery||{};
     deliveryHtml=`<section style="margin-top:12px;padding:12px;border:1px solid #2874a6;border-radius:12px;background:#0b1d32"><strong style="color:#8de4ff">Produk dari DX STORE</strong><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;line-height:1.6;margin:9px 0;color:#eef7ff">${safeText(delivery.content||"")}</pre>${delivery.buyer_note?`<p style="margin:8px 0;color:#b8cbe2">${safeText(delivery.buyer_note)}</p>`:""}<small style="color:#91a7c4">Dikirim: ${new Date(delivery.sent_at).toLocaleString(getDXCountry().locale||"id-ID")}</small></section>`;
    }
   }catch(e){console.warn("Delivery detail unavailable",e);}
  }
  return `<article class="dx-ticket-card" data-dx-order-history-id="${safeText(o.id)}"><b>${safeText(o.item_name||"Pesanan DX STORE")}</b><p>No. ${safeText(o.id)}</p><p>${formatPrice(o.total_amount)} · ${safeText(labels[o.status]||o.status)}</p><small>${new Date(o.created_at).toLocaleString(getDXCountry().locale||"id-ID")}</small>${deliveryHtml}${o.status==="delivered"?`<p><button type="button" data-dx-confirm-received="${safeText(o.id)}">Konfirmasi Penerimaan</button></p>`:""}</article>`;
 }));
 host.innerHTML=cards.join("");
 host.querySelectorAll("[data-dx-confirm-received]").forEach(b=>b.addEventListener("click",()=>confirmDXOrderReceived(b.dataset.dxConfirmReceived)));
}
async function submitDXSupportTicket(event){
 event.preventDefault();if(!currentUser||!dxSupabase)return;
 const btn=$("dxSupportSubmit"),feedback=$("dxSupportFeedback"),order=$("dxSupportOrder").value.trim();
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(order&&!uuid.test(order)){feedback.textContent="ID pesanan tidak valid.";return;}
 const category=$("dxSupportCategory").value;
 if(category==="Garansi"){
  if(!order){feedback.textContent="ID pesanan wajib diisi untuk klaim garansi.";return;}
  const {data:purchase,error:purchaseError}=await dxSupabase.from("orders").select("id,item_type,item_id,status,created_at").eq("id",order).eq("buyer_id",currentUser.id).maybeSingle();
  if(purchaseError||!purchase){feedback.textContent="Pesanan tidak ditemukan pada akun ini.";return;}
  if(!["paid","processing","delivered","completed"].includes(purchase.status)||purchase.item_type!=="product"||!purchase.item_id){feedback.textContent="Garansi hanya berlaku untuk produk resmi DX STORE dengan pembayaran terverifikasi.";return;}
  const {data:product,error:productError}=await dxSupabase.from("products").select("warranty_days").eq("id",purchase.item_id).maybeSingle();
  if(productError||!product||Number(product.warranty_days??7)<=0){feedback.textContent="Produk ini tidak memiliki garansi.";return;}
  const expiresAt=new Date(purchase.created_at).getTime()+Number(product.warranty_days??7)*86400000;
  if(Date.now()>expiresAt){feedback.textContent="Masa garansi pesanan ini sudah berakhir.";return;}
 }
 btn.disabled=true;
 try{
  const image=$("dxSupportImage")?.files?.[0];let imagePath=null;
  if(image){
   if(!["image/jpeg","image/png","image/webp"].includes(image.type)||image.size>5*1024*1024)throw new Error("Lampiran harus JPG, PNG, atau WEBP maksimal 5 MB.");
   const ext=image.type==="image/jpeg"?"jpg":image.type==="image/png"?"png":"webp";
   imagePath=currentUser.id+"/"+crypto.randomUUID()+"."+ext;
   const {error:uploadError}=await dxSupabase.storage.from("support-attachments").upload(imagePath,image,{contentType:image.type,upsert:false});
   if(uploadError)throw uploadError;
  }
  const payload={user_id:currentUser.id,category:$("dxSupportCategory").value,subject:$("dxSupportSubject").value.trim(),message:$("dxSupportMessage").value.trim(),order_id:order||null,image_path:imagePath};
  const {data,error}=await dxSupabase.from("support_tickets").insert(payload).select("id").single();
  if(error){if(imagePath)await dxSupabase.storage.from("support-attachments").remove([imagePath]);throw error;}
  $("dxSupportForm").reset();feedback.textContent="Laporan terkirim. Nomor tiket: "+data.id;await loadDXMyTickets();
 }catch(e){feedback.textContent="Gagal mengirim laporan: "+getDXError(e);}
 finally{btn.disabled=false;}
}
async function loadDXMyTickets(){
 const host=$("dxMyTickets");if(!host||!currentUser||!dxSupabase)return;
 host.textContent="Memuat laporan...";
 const {data,error}=await dxSupabase.from("support_tickets").select("id,category,subject,message,status,admin_reply,image_path,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(30);
 if(error){host.textContent="Laporan gagal dimuat: "+getDXError(error);return;}
 const cards=await Promise.all((data||[]).map(async t=>{let imageLink="";if(t.image_path){const {data:signed}=await dxSupabase.storage.from("support-attachments").createSignedUrl(t.image_path,300);if(signed?.signedUrl)imageLink=`<p><a href="${safeText(signed.signedUrl)}" target="_blank" rel="noopener">Lihat lampiran</a></p>`;}return `<article class="dx-ticket-card"><b>${safeText(t.subject)}</b><p>${safeText(t.category)} · ${safeText(t.status)}</p><small>No. tiket: ${safeText(t.id)}</small><p>${safeText(t.message)}</p>${imageLink}${t.admin_reply?`<p><b>Balasan admin:</b> ${safeText(t.admin_reply)}</p>`:"<p>Menunggu balasan admin.</p>"}</article>`;}));host.innerHTML=cards.join("")||"Belum ada laporan.";
}
async function loadDXAdminTickets(){
 const host=$("dxAdminTickets");if(!host||!currentUser||!(await checkDXAdmin()))return;
 host.textContent="Memuat laporan...";
 const {data,error}=await dxSupabase.from("support_tickets").select("id,user_id,order_id,category,subject,message,status,admin_reply,image_path,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Gagal memuat laporan: "+getDXError(error);return;}
 const cards=await Promise.all((data||[]).map(async t=>{let imageLink="";if(t.image_path){const {data:signed}=await dxSupabase.storage.from("support-attachments").createSignedUrl(t.image_path,300);if(signed?.signedUrl)imageLink=`<p><a href="${safeText(signed.signedUrl)}" target="_blank" rel="noopener">Lihat lampiran</a></p>`;}return `<article class="dx-ticket-card"><b>${safeText(t.subject)}</b><p>${safeText(t.category)} · ${safeText(t.status)}</p><small>${safeText(t.user_id)} · ${new Date(t.created_at).toLocaleString("id-ID")}</small>${t.order_id?`<p>Pesanan: ${safeText(t.order_id)}</p>`:""}<p>${safeText(t.message)}</p>${imageLink}<label>Balasan admin</label><textarea id="dxReply-${safeText(t.id)}" rows="3" maxlength="4000">${safeText(t.admin_reply||"")}</textarea><label>Status</label><select id="dxTicketStatus-${safeText(t.id)}"><option ${t.status==="Menunggu"?"selected":""}>Menunggu</option><option ${t.status==="Sedang Ditangani"?"selected":""}>Sedang Ditangani</option><option ${t.status==="Menunggu Informasi Pengguna"?"selected":""}>Menunggu Informasi Pengguna</option><option ${t.status==="Selesai"?"selected":""}>Selesai</option><option ${t.status==="Ditolak"?"selected":""}>Ditolak</option></select><button type="button" data-dx-ticket-save="${safeText(t.id)}">Simpan Balasan &amp; Status</button></article>`;}));host.innerHTML=cards.join("")||"Belum ada laporan.";
}
async function updateDXAdminTicket(id){
 if(!currentUser||!(await checkDXAdmin()))return;
 const patch={admin_reply:$("dxReply-"+id)?.value.trim()||null,status:$("dxTicketStatus-"+id)?.value,updated_at:new Date().toISOString()};
 const {error}=await dxSupabase.from("support_tickets").update(patch).eq("id",id);if(error){dxAlert(getDXError(error));return;}await loadDXAdminTickets();
}
async function loadDXStoreSettings(){
 if(!currentUser||!(await checkDXAdmin()))return;
 const {data,error}=await dxSupabase.from("store_settings").select("*").eq("id",true).single();
 if(error){$("dxStoreStatus").textContent=getDXError(error);return;}
 $("dxStoreOpen").checked=data.is_open;$("dxStoreMaintenance").checked=data.maintenance_mode;$("dxStoreOpening").value=String(data.opening_time).slice(0,5);$("dxStoreClosing").value=String(data.closing_time).slice(0,5);$("dxStoreTimezone").value=data.timezone||"Asia/Jakarta";$("dxStoreNotice").value=data.notice||"";
 $("dxStoreStatus").textContent=(data.is_open&&!data.maintenance_mode?"Toko menerima pesanan.":"Pesanan sedang ditutup.")+" Jadwal "+String(data.opening_time).slice(0,5)+"–"+String(data.closing_time).slice(0,5)+" "+data.timezone;
}
async function saveDXStoreSettings(event){
 event.preventDefault();if(!currentUser||!(await checkDXAdmin()))return;
 const btn=$("dxStoreSave"),feedback=$("dxStoreFeedback");btn.disabled=true;
 try{const patch={is_open:$("dxStoreOpen").checked,maintenance_mode:$("dxStoreMaintenance").checked,opening_time:$("dxStoreOpening").value,closing_time:$("dxStoreClosing").value,timezone:$("dxStoreTimezone").value,notice:$("dxStoreNotice").value.trim()||null,updated_by:currentUser.id,updated_at:new Date().toISOString()};
 const {error}=await dxSupabase.from("store_settings").update(patch).eq("id",true);if(error)throw error;feedback.textContent="Pengaturan tersimpan.";await loadDXStoreSettings();await loadDXStoreAvailability();
 }catch(e){feedback.textContent="Gagal menyimpan: "+getDXError(e);}finally{btn.disabled=false;}
}
async function loadDXStoreAvailability(){
 const banner=$("dxStoreNoticeBanner");if(!banner||!dxSupabase)return;
 const {data,error}=await dxSupabase.from("store_settings").select("is_open,maintenance_mode,opening_time,closing_time,timezone,notice").eq("id",true).maybeSingle();if(error||!data){banner.hidden=true;return;}
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:data.timezone||"Asia/Jakarta",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());const now=Number(parts.find(p=>p.type==="hour")?.value||0)*60+Number(parts.find(p=>p.type==="minute")?.value||0);const [oh,om]=String(data.opening_time).slice(0,5).split(":").map(Number);const [ch,cm]=String(data.closing_time).slice(0,5).split(":").map(Number);const open=oh*60+om,close=ch*60+cm;const inHours=open<=close?now>=open&&now<close:now>=open||now<close;const active=data.is_open&&!data.maintenance_mode&&inHours;banner.hidden=false;banner.textContent=(data.notice?data.notice+" · ":"")+(active?"Toko menerima pesanan.":"Toko sedang tidak menerima pesanan.")+" Jam operasional "+String(data.opening_time).slice(0,5)+"–"+String(data.closing_time).slice(0,5)+" ("+data.timezone+").";
}
async function loadDXAdminOverview(){
 const host=$("dxAdminOverview");if(!host||!currentUser||!(await checkDXAdmin()))return;
 const tables=[["profiles","Pengguna"],["orders","Pesanan"],["products","Produk"],["support_tickets","Laporan"]];
 const counts=await Promise.all(tables.map(async([table,label])=>{const {count,error}=await dxSupabase.from(table).select("*",{count:"exact",head:true});return {label,count,error};}));
 host.innerHTML=counts.map(x=>`<span class="dx-admin-stat"><b>${x.error?"—":x.count}</b><small>${x.label}</small></span>`).join("");
}
async function loadDXAdminUsers(){
 const host=$("dxAdminUsers");if(!host||!currentUser||!(await checkDXAdmin()))return;
 const {data,error}=await dxSupabase.from("profiles").select("id,display_name,role,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent=getDXError(error);return;}
 host.innerHTML=(data||[]).map(u=>`<article class="dx-ticket-card"><b>${safeText(u.display_name||"Pengguna")}</b><p>${safeText(u.role)}</p><small>${safeText(u.id)}</small></article>`).join("")||"Belum ada pengguna.";
}
/* =========================================
   DX STORE - BAGIAN 3 DARI 5
   LOGIN, REGISTRASI DAN CEK ADMIN
========================================= */

async function loadDXProfile(user) {
  if (!dxSupabase || !user) {
    currentProfile = null;
    return null;
  }

  const { data, error } = await dxSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Gagal memuat profil:", error);
    currentProfile = null;
    return null;
  }

  currentProfile = data || {
    id: user.id,
    role: "user"
  };

  return currentProfile;
}

/* CEK ADMIN MELALUI RPC SUPABASE */

async function checkDXAdmin() {
  if (!dxSupabase || !currentUser) {
    return false;
  }

  const { data, error } = await dxSupabase.rpc("is_admin");

  if (error) {
    console.error("Pengecekan admin gagal:", error);
    if (currentProfile) currentProfile.role = "user";
    return false;
  }

  if (data === true) {
    currentProfile = {
      ...(currentProfile || {}),
      id: currentUser.id,
      role: "admin"
    };

    return true;
  }

  if (currentProfile) {
    currentProfile.role = "user";
  }

  return false;
}

/* GANTI MODE LOGIN DAN DAFTAR */

/* Obsolete duplicate removed: setupDXAuthSwitch */

/* PROSES LOGIN DAN REGISTRASI */

/* PERBARUI STATUS LOGIN */

/* Audio dan seluruh sistem pesan otomatis maskot dinonaktifkan. */

/* KELUAR DARI AKUN */

/* NAVIGASI */

/* Obsolete duplicate removed: initDXNavigation */

/* =========================================
   DX STORE - BAGIAN 4 DARI 5
   PANEL ADMINISTRATOR
========================================= */

function createDXAdminPanel() {
  if ($("dxAdminPanel")) return;

  const main = document.querySelector("main");

  if (!main) {
    console.error("DX STORE: Elemen main tidak ditemukan.");
    return;
  }

  const panel = document.createElement("section");
  panel.id = "dxAdminPanel";
  panel.style.display = "none";
  panel.style.margin = "24px 0 0";
  panel.dataset.dxAdminPanel = "1";
  panel.style.padding = "24px";
  panel.style.maxWidth = "1100px";
  panel.style.background = "#101b32";
  panel.style.border = "1px solid #263c60";
  panel.style.borderRadius = "16px";
  panel.style.color = "#ffffff";

  panel.innerHTML = `
    <h2 style="color:#38bdf8;margin-top:0;">
      DX STORE - ADMINISTRATOR
    </h2>

    <p>Kelola verifikasi penjual, produk digital, dan akun game.</p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:20px 0;">
      <button type="button" id="dxAdminSellers">Pengajuan Penjual</button>
      <button type="button" id="dxAdminVerifyProducts">Verifikasi Produk</button>
      <button type="button" id="dxAdminVerifyAccounts">Verifikasi Akun Game</button>
      <button type="button" id="dxAdminProducts">Kelola Produk</button>
      <button type="button" id="dxAdminAccounts">Kelola Akun Game</button>
      <button type="button" id="dxAdminAccountOrders">Pesanan Akun Admin</button>
      <button type="button" id="dxAdminChats">Obrolan Pengguna</button>
      <button type="button" id="dxAdminWithdrawals">Pencairan Penjual</button>
    </div>

    <section id="dxAdminSellerApplications" style="display:none;margin:12px 0"></section>
    <section id="dxAdminVerificationList" style="display:none;margin:12px 0"></section>
    <section id="dxAdminChatList" style="display:none;margin:12px 0"></section>
    <section id="dxAdminWithdrawalsList" style="display:none;margin:12px 0"></section>
    <section id="dxAdminAccountOrdersList" style="display:none;margin:12px 0"></section>
    <form id="dxAdminForm">
      <input type="hidden" id="dxEditId">

      <div id="dxGameWrap" style="display:none;margin-bottom:12px;">
        <label for="dxGame">Nama game</label>
        <input
          id="dxGame"
          type="text"
          placeholder="Contoh: Mobile Legends"
        >
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxName" id="dxNameLabel">Nama produk</label>
        <input
          id="dxName"
          type="text"
          placeholder="Nama produk atau judul akun"
          required
        >
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxDescription">Deskripsi</label>
        <textarea
          id="dxDescription"
          rows="4"
          placeholder="Deskripsi produk atau akun"
        ></textarea>
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxPrice">Harga (Rupiah)</label>
        <input
          id="dxPrice"
          type="number"
          min="0"
          step="1"
          placeholder="Contoh: 50000"
          required
        >
      </div>

      <div id="dxProductWarrantyWrap" style="margin-bottom:12px;">
        <label for="dxWarrantyDays">Masa garansi produk DX STORE (hari, 0 = tanpa garansi)</label>
        <input id="dxWarrantyDays" type="number" min="0" max="3650" step="1" value="7" required>
        <label for="dxWarrantyTerms">Ketentuan garansi</label>
        <textarea id="dxWarrantyTerms" rows="3" maxlength="2000">Garansi berlaku untuk kendala pada produk sesuai ketentuan DX STORE. Ajukan melalui Pusat Bantuan dengan ID pesanan.</textarea>
      </div>

      <div style="margin-bottom:12px;">
        <label for="dxImageFile">Foto produk (JPG, PNG, WEBP · maks. 5 MB)</label>
        <input id="dxImageFile" type="file" accept="image/jpeg,image/png,image/webp">
        <div id="dxImagePreview" style="display:none;margin-top:10px;">
          <img id="dxImagePreviewImg" alt="Pratinjau foto" style="width:100%;max-width:240px;max-height:170px;object-fit:cover;border-radius:12px;border:1px solid #345276;">
        </div>
        <input id="dxImage" type="url" placeholder="URL gambar alternatif (opsional)" aria-label="URL gambar alternatif" style="margin-top:8px;">
        <small style="display:block;color:#9aa9c4;margin-top:5px;">Foto dari perangkat akan diunggah otomatis saat data disimpan.</small>
      </div>

      <button type="submit" id="dxSaveButton">
        Simpan Produk
      </button>

      <button type="button" id="dxCancelEdit" style="display:none;">
        Batal Edit
      </button>
    </form>

    <p id="dxAdminMessage" aria-live="polite"></p>

    <hr style="border-color:#263c60;margin:25px 0;">

    <h3>Daftar Data</h3>

    <div id="dxAdminList">
      Memuat data...
    </div>
    <hr style="border-color:#263c60;margin:25px 0;">
    <h3>Pesanan &amp; Verifikasi Pembayaran QRIS</h3>
    <button type="button" id="dxRefreshPaymentOrders">Muat Ulang Pesanan</button>
    <div id="dxPaymentOrders">Memuat pesanan...</div>
    <hr style="border-color:#263c60;margin:25px 0;"><h3>Operasional Toko</h3><div id="dxStoreStatus">Memuat pengaturan toko...</div>
    <form id="dxStoreSettingsForm">
      <label><input id="dxStoreOpen" type="checkbox" style="display:inline-block;width:auto;"> Toko menerima pesanan</label>
      <label><input id="dxStoreMaintenance" type="checkbox" style="display:inline-block;width:auto;"> Mode pemeliharaan</label>
      <label for="dxStoreOpening">Jam buka</label><input id="dxStoreOpening" type="time" value="08:00" required>
      <label for="dxStoreClosing">Jam tutup</label><input id="dxStoreClosing" type="time" value="22:00" required>
      <label for="dxStoreTimezone">Zona waktu</label><select id="dxStoreTimezone"><option value="Asia/Jakarta">WIB · Jakarta</option><option value="Asia/Kuala_Lumpur">Malaysia</option><option value="Asia/Singapore">Singapore</option><option value="Asia/Tokyo">Japan</option><option value="UTC">UTC</option></select>
      <label for="dxStoreNotice">Pengumuman toko</label><input id="dxStoreNotice" maxlength="240" placeholder="Pengumuman untuk pengunjung">
      <button type="submit" id="dxStoreSave">Simpan Pengaturan Toko</button><p id="dxStoreFeedback" role="status"></p>
    </form>
    <hr style="border-color:#263c60;margin:25px 0;"><h3>Pusat Laporan Pengguna</h3><button type="button" id="dxRefreshTickets">Muat Ulang Laporan</button><div id="dxAdminTickets">Memuat laporan...</div>
    <hr style="border-color:#263c60;margin:25px 0;"><h3>Ringkasan Admin</h3><div id="dxAdminOverview">Memuat statistik...</div><h3>Daftar Pengguna</h3><div id="dxAdminUsers">Memuat pengguna...</div>
  `;

  const accountPanel = $("dxProfilePanel");
  if (accountPanel) accountPanel.appendChild(panel);
  else main.appendChild(panel);
  installDXRupiahInput($("dxPrice"));

  const adminAccessCard = $("dxAdminAccessCard");
  if (adminAccessCard) adminAccessCard.hidden = currentProfile?.role !== "admin";

  if (!$("dxAdminStyles")) {
    const style = document.createElement("style");
    style.id = "dxAdminStyles";

    style.textContent = `
      #dxAdminPanel { width:100%; overflow:hidden; }
      #dxAdminPanel > h2 { font-size:clamp(20px,3vw,27px); letter-spacing:-.5px; }
      #dxAdminPanel > p { color:#9aa9c4; line-height:1.6; }
      #dxAdminPanel > div:first-of-type { display:grid !important; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:9px !important; }
      #dxAdminPanel > div:first-of-type button { min-height:48px; margin:0; border:1px solid rgba(81,229,255,.18); background:linear-gradient(145deg,#172b4d,#101a31); color:#dff7ff; font-size:12px; font-weight:700; }
      #dxAdminPanel > div:first-of-type button:hover { border-color:#51e5ff; background:#18365a; }
      #dxAdminVerificationList { min-width:0; }
      .dx-verify-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:4px 0 16px; }
      .dx-verify-heading h3 { margin:0 0 5px; color:#eaf6ff; font-size:19px; }
      .dx-verify-heading p { color:#9aa9c4; font-size:12px; }
      .dx-verify-count { flex:none; padding:7px 11px; border:1px solid rgba(81,229,255,.3); border-radius:999px; background:rgba(39,143,255,.12); color:#7deaff; font-size:12px; font-weight:800; }
      .dx-verify-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr)); gap:12px; }
      .dx-verify-card { display:grid; grid-template-columns:104px minmax(0,1fr); gap:13px; min-width:0; padding:13px; border:1px solid #263f62; border-radius:15px; background:linear-gradient(145deg,#111f38,#0b1426); box-shadow:0 8px 24px rgba(0,0,0,.16); }
      .dx-verify-image { width:104px; height:104px; object-fit:cover; border-radius:11px; background:#172844; }
      .dx-verify-no-image { display:grid; place-items:center; padding:8px; color:#91a4c2; font-size:11px; text-align:center; }
      .dx-verify-content { min-width:0; display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
      .dx-verify-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; width:100%; }
      .dx-verify-card-top strong { overflow-wrap:anywhere; color:#f3f8ff; }
      .dx-verify-pending { flex:none; padding:4px 7px; border-radius:999px; background:rgba(245,158,11,.13); color:#fbbf24; font-size:10px; font-weight:800; }
      .dx-verify-price { color:#67e8f9; font-size:15px; }
      .dx-verify-content p { margin:0; color:#b7c6dc; font-size:12px; line-height:1.5; }
      .dx-verify-description { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
      .dx-verify-content small { color:#8294b2; font-size:10px; }
      .dx-verify-actions { display:flex; flex-wrap:wrap; gap:7px; width:100%; margin-top:auto; padding-top:5px; }
      #dxAdminPanel .dx-verify-actions button { margin:0; min-height:38px; padding:8px 12px; font-size:11px; font-weight:800; }
      #dxAdminPanel .dx-verify-approve { background:linear-gradient(110deg,#087fbd,#2563eb); }
      #dxAdminPanel .dx-verify-reject { background:#3a2030; border:1px solid #85465a; color:#ffb7c6; }
      .dx-verify-empty { padding:22px 16px; border:1px dashed #385477; border-radius:14px; background:rgba(11,20,38,.65); text-align:center; }
      .dx-verify-empty strong { color:#eaf6ff; }
      .dx-verify-empty p { margin-top:7px; color:#9aa9c4; font-size:12px; line-height:1.6; }
      @media(max-width:560px) { #dxAdminPanel { padding:15px !important; } .dx-verify-card { grid-template-columns:76px minmax(0,1fr); gap:10px; padding:10px; } .dx-verify-image { width:76px; height:76px; } .dx-verify-card-top { flex-direction:column; gap:5px; } #dxAdminPanel .dx-verify-actions button { flex:1; } }
      #dxAdminPanel .dx-chat-header { display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 16px;padding-bottom:14px;border-bottom:1px solid #263d5d; }
      #dxAdminPanel .dx-chat-header h3 { margin:0 0 5px;color:#eaf6ff;font-size:20px; }
      #dxAdminPanel .dx-chat-header p { margin:0;color:#91a4c2;font-size:12px; }
      #dxAdminPanel .dx-chat-reload { flex:none;margin:0;padding:9px 13px;border:1px solid #36577d;background:#172b49;color:#d8f5ff;font-size:12px; }
      #dxAdminPanel .dx-chat-rows { display:grid;gap:9px; }
      #dxAdminPanel .dx-chat-row { display:flex;align-items:center;gap:11px;width:100%;margin:0;padding:13px;text-align:left;border:1px solid #294363;background:linear-gradient(120deg,#12213b,#0b172b);border-radius:13px; }
      #dxAdminPanel .dx-chat-row:hover { border-color:#38bdf8;background:#142a49; }
      .dx-chat-avatar { display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:12px;background:#15385b;color:#7deaff;font-size:18px; }
      .dx-chat-row-main { display:grid;gap:5px;min-width:0;flex:1; }
      .dx-chat-row-main strong { color:#f0f7ff;font-size:13px;overflow-wrap:anywhere; }
      .dx-chat-row-main small { color:#91a4c2;font-size:10px;overflow-wrap:anywhere; }
      .dx-chat-type { flex:none;padding:5px 8px;border-radius:999px;background:#1c3554;color:#9feaff;font-size:10px; }
      .dx-chat-chevron { color:#8ca7c8;font-size:22px; }
      .dx-chat-empty { display:grid;justify-items:center;gap:7px;padding:32px 16px;border:1px dashed #365273;border-radius:14px;background:#0c192d;text-align:center; }
      .dx-chat-empty-icon { display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#173453;color:#7deaff;font-size:22px; }
      .dx-chat-empty strong { color:#eaf6ff;font-size:14px; }
      .dx-chat-empty p { margin:0;color:#91a4c2;font-size:12px;line-height:1.5; }
      #dxAdminPanel .dx-chat-thread { margin-top:16px;padding:14px;border:1px solid #2b4567;border-radius:14px;background:#0b172a; }
      .dx-chat-thread-head { display:grid;gap:4px;padding-bottom:12px;border-bottom:1px solid #29415f; }
      .dx-chat-thread-head strong { color:#f0f7ff;font-size:14px; }
      .dx-chat-thread-head span { color:#8fa6c4;font-size:10px; }
      #dxAdminPanel .dx-chat-messages { display:grid;gap:9px;max-height:360px;overflow:auto;padding:14px 2px; }
      #dxAdminPanel .dx-chat-form { display:grid;gap:8px;padding-top:12px;border-top:1px solid #29415f; }
      .dx-chat-form-foot { display:flex;align-items:center;justify-content:space-between;gap:10px; }
      .dx-chat-form-foot small { color:#8297b5;font-size:10px; }
      #dxAdminPanel .dx-chat-form button { margin:0; }
      #dxAdminPanel #dxAdminChatFeedback { margin:0;font-size:12px;color:#9bdcf5; }
      @media(max-width:520px) { #dxAdminPanel .dx-chat-header { align-items:flex-start; } #dxAdminPanel .dx-chat-row { gap:8px;padding:10px; } .dx-chat-avatar { width:34px;height:34px; } .dx-chat-type { font-size:9px; } .dx-chat-form-foot { align-items:flex-start;flex-direction:column; } }
      #dxAdminPanel input,
      #dxAdminPanel textarea {
        display:block;
        box-sizing:border-box;
        width:100%;
        padding:12px;
        margin-top:6px;
        border:1px solid #334b70;
        border-radius:8px;
        background:#0b1426;
        color:#ffffff;
      }

      #dxAdminPanel label {
        display:block;
        color:#cbd5e1;
        font-size:14px;
      }

      #dxAdminPanel button {
        padding:11px 16px;
        border:0;
        border-radius:8px;
        background:#0879d1;
        color:#ffffff;
        cursor:pointer;
        margin:4px 4px 4px 0;
      }

      #dxAdminPanel button:disabled {
        opacity:.6;
        cursor:not-allowed;
      }

      #dxAdminList article {
        padding:14px;
        margin:12px 0;
        border:1px solid #334b70;
        border-radius:10px;
        background:#0b1426;
      }

      #dxAdminList article h4 {
        margin:0 0 8px;
        color:#7dd3fc;
      }
    `;

    document.head.appendChild(style);
  }

  const hideAdminListingAreas=()=>{ $("dxAdminSellerApplications").style.display="none"; $("dxAdminVerificationList").style.display="none"; $("dxAdminChatList").style.display="none"; $("dxAdminWithdrawalsList").style.display="none"; $("dxAdminAccountOrdersList").style.display="none"; $("dxAdminForm").style.display="none"; $("dxAdminList").style.display="none"; };
  $("dxAdminSellers")?.addEventListener("click", async () => { hideAdminListingAreas(); $("dxAdminSellerApplications").style.display="block"; await loadDXAdminSellerApplications(); });
  $("dxAdminChats")?.addEventListener("click", async () => { hideAdminListingAreas(); $("dxAdminChatList").style.display="block"; await loadDXAdminChatConversations(); });
  $("dxAdminWithdrawals")?.addEventListener("click", async () => { hideAdminListingAreas(); $("dxAdminWithdrawalsList").style.display="block"; await loadDXAdminWithdrawals(); });
  $("dxAdminAccountOrders")?.addEventListener("click", async () => { hideAdminListingAreas(); $("dxAdminAccountOrdersList").style.display="block"; await loadDXAdminAccountOrders(); });
  $("dxAdminVerifyProducts")?.addEventListener("click", async () => { hideAdminListingAreas(); $("dxAdminVerificationList").style.display="block"; await loadDXAdminVerificationList("products"); });
  $("dxAdminVerifyAccounts")?.addEventListener("click", async () => { hideAdminListingAreas(); $("dxAdminVerificationList").style.display="block"; await loadDXAdminVerificationList("account_listings"); });
  const showListingAdmin=(type)=>{
    // Pastikan halaman profil dan panel admin yang menjadi induk formulir terlihat.
    window.dxAdminPanelExpanded = true;
    showDXView("profile");
    const adminPanel = $("dxAdminPanel");
    if (adminPanel) adminPanel.style.display = "block";
    dxAdminType = type;
    $("dxAdminSellerApplications").style.display="none";
    $("dxAdminVerificationList").style.display="none";
    $("dxAdminChatList").style.display="none";
    $("dxAdminWithdrawalsList").style.display="none";
    $("dxAdminAccountOrdersList").style.display="none";
    $("dxAdminForm").style.display="block";
    $("dxAdminList").style.display="block";
    $("dxGameWrap").style.display = type === "account_listings" ? "block" : "none";
    $("dxProductWarrantyWrap").style.display = type === "account_listings" ? "none" : "block";
    updateDXAdminFormLabels();
    $("dxAdminForm").scrollIntoView({behavior:"smooth",block:"start"});
  };
  $("dxAdminProducts").addEventListener("click", () => {
    showListingAdmin("products");
    resetDXAdminForm();
    loadDXAdminList();
    updateDXAdminFormLabels();
  });

  $("dxAdminAccounts").addEventListener("click", () => {
    showListingAdmin("account_listings");
    resetDXAdminForm();
    loadDXAdminList();
    updateDXAdminFormLabels();
  });

  $("dxRefreshPaymentOrders").addEventListener("click", loadDXPaymentOrders);
  $("dxRefreshTickets")?.addEventListener("click", loadDXAdminTickets);
  $("dxStoreSettingsForm")?.addEventListener("submit", saveDXStoreSettings);
  $("dxAdminTickets")?.addEventListener("click", event => { const b=event.target.closest("[data-dx-ticket-save]"); if(b) updateDXAdminTicket(b.dataset.dxTicketSave); });
  $("dxPaymentOrders").addEventListener("click", event => {
    const button = event.target.closest("[data-dx-order][data-dx-decision]");
    if (button) reviewDXPayment(button.dataset.dxOrder, button.dataset.dxDecision, button.dataset.dxSourceStatus);
  });
  $("dxImageFile")?.addEventListener("change", () => {
    const file = $("dxImageFile").files?.[0];
    const preview = $("dxImagePreview");
    const previewImage = $("dxImagePreviewImg");
    if (!file || !preview || !previewImage) {
      if (preview) preview.style.display = "none";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      $("dxImageFile").value = "";
      preview.style.display = "none";
      showDXAdminMessage("Foto harus JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.");
      return;
    }
    if (previewImage.dataset.objectUrl) URL.revokeObjectURL(previewImage.dataset.objectUrl);
    previewImage.dataset.objectUrl = URL.createObjectURL(file);
    previewImage.src = previewImage.dataset.objectUrl;
    preview.style.display = "block";
  });
  $("dxCancelEdit").addEventListener("click", resetDXAdminForm);
  $("dxAdminForm").addEventListener("submit", saveDXAdminItem);

  updateDXAdminFormLabels();
}

function updateDXAdminFormLabels() {
  const isAccount = dxAdminType === "account_listings";

  if (!$("dxGameWrap")) return;

  $("dxGameWrap").style.display = isAccount ? "block" : "none";

  $("dxNameLabel").textContent = isAccount
    ? "Judul akun"
    : "Nama produk";

  $("dxName").placeholder = isAccount
    ? "Contoh: Akun Mobile Legends"
    : "Nama produk digital";
  const warrantyWrap = $("dxProductWarrantyWrap");
  if (warrantyWrap) warrantyWrap.style.display = isAccount ? "none" : "block";

  $("dxSaveButton").textContent = $("dxEditId").value
    ? "Perbarui Data"
    : isAccount
      ? "Simpan Akun"
      : "Simpan Produk";
}

function resetDXAdminForm() {
  const form = $("dxAdminForm");
  if (!form) return;

  form.reset();
  $("dxEditId").value = "";
  if ($("dxImagePreview")) $("dxImagePreview").style.display = "none";
  $("dxCancelEdit").style.display = "none";

  updateDXAdminFormLabels();

  $("dxAdminMessage").textContent = "";
}

/* =========================================
   DX STORE - BAGIAN 5 DARI 5
   SIMPAN, EDIT, HAPUS, DAN INISIALISASI
========================================= */


/* VERIFIKASI PENJUAL */
async function loadDXSellerApplicationState() {
 const area=$("dxSellerArea"),form=$("dxSellerApplicationForm"),state=$("dxSellerApplicationState"),listingPanel=$("dxSellerListingPanel"),listingForm=$("dxSellerListingForm");
 if(!area||!form||!state||!listingPanel||!listingForm)return;
 if(!currentUser){area.hidden=true;form.hidden=true;listingPanel.hidden=true;return;}
 if(await checkDXAdmin()){area.hidden=true;form.hidden=true;listingPanel.hidden=true;return;}
 area.hidden=false;
 if(!form.dataset.bound){form.addEventListener("submit",submitDXSellerApplication);form.dataset.bound="1";}
 if(!listingForm.dataset.bound){listingForm.addEventListener("submit",submitDXSellerListing);listingForm.dataset.bound="1";}
 const photo=$("dxSellerListingPhoto");
 if(photo&&!photo.dataset.bound){photo.addEventListener("change",()=>{const f=photo.files?.[0],preview=$("dxSellerListingPreview"),img=$("dxSellerListingPreviewImg");if(!f||!preview||!img)return;if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>5*1024*1024){photo.value="";preview.hidden=true;dxAlert("Foto harus JPG, PNG, atau WEBP maksimal 5 MB.");return;}img.src=URL.createObjectURL(f);preview.hidden=false;});photo.dataset.bound="1";}
 const type=$("dxSellerListingType"),gameWrap=$("dxSellerGameWrap");
  if(type&&!type.dataset.bound){type.value="product";type.disabled=true;type.dataset.bound="1";if(gameWrap)gameWrap.hidden=true;}
 form.hidden=true;listingPanel.hidden=true;state.textContent="Memeriksa status pengajuan...";
 const {data,error}=await dxSupabase.from("seller_applications").select("id,store_name,status,admin_note,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(error){state.textContent="Status pengajuan gagal dimuat: "+getDXError(error);return;}
 if(!data){state.textContent="Belum ada pengajuan. Isi formulir berikut untuk mulai berjualan.";form.hidden=false;return;}
 if(data.status==="approved"){const withdrawForm=$("dxSellerWithdrawForm");if(withdrawForm&&!withdrawForm.dataset.bound){withdrawForm.addEventListener("submit",submitDXSellerWithdrawal);withdrawForm.dataset.bound="1";}state.innerHTML='<strong style="color:#86efac">✓ Penjual disetujui: '+safeText(data.store_name)+'</strong><br>Untuk peluncuran awal, DX STORE hanya menerima produk digital. Semua listing tetap menunggu persetujuan admin.';listingPanel.hidden=false;await Promise.all([loadDXMySellerListings(),loadDXSellerOrders(),loadDXSellerWithdrawals()]);return;}
 if(data.status==="pending"){state.innerHTML='<strong style="color:#fde68a">Pengajuan sedang diperiksa admin.</strong><br>Nama toko: '+safeText(data.store_name)+'. Formulir jualan akan terbuka setelah disetujui.';return;}
 state.innerHTML='<strong style="color:#fca5a5">Pengajuan sebelumnya ditolak.</strong>'+(data.admin_note?'<br>Catatan admin: '+safeText(data.admin_note):'')+'<br>Kamu dapat mengajukan kembali.';form.hidden=false;
}
async function loadDXMySellerListings(){
 const host=$("dxMySellerListings");if(!host||!currentUser||!dxSupabase)return;
 host.textContent="Memuat listing kamu...";
 const [p,a]=await Promise.all([
  dxSupabase.from("products").select("id,name,price,status,image_url,created_at").eq("seller_id",currentUser.id).order("created_at",{ascending:false}),
  dxSupabase.from("account_listings").select("id,title,game,price,status,image_url,created_at").eq("seller_id",currentUser.id).order("created_at",{ascending:false})
 ]);
 if(p.error||a.error){host.textContent="Listing gagal dimuat: "+getDXError(p.error||a.error);return;}
 const rows=[...(p.data||[]).map(x=>({...x,label:x.name,kind:"Produk digital"})),...(a.data||[]).map(x=>({...x,label:x.title,kind:"Akun game"}))].sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));
 if(!rows.length){host.textContent="Belum ada produk atau akun yang kamu kirim.";return;}
 host.innerHTML=rows.map(x=>'<article style="display:flex;gap:10px;align-items:center;padding:10px;margin:8px 0;border:1px solid #334b70;border-radius:10px;background:#0b1426">'+(safeImageUrl(x.image_url)?'<img src="'+safeText(safeImageUrl(x.image_url))+'" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px">':'')+'<div><strong>'+safeText(x.label)+'</strong><p style="margin:3px 0">'+safeText(x.kind)+' · '+formatPrice(x.price)+'</p><small>Status: '+(x.status==="active"?"Disetujui dan tayang":x.status==="rejected"?"Ditolak":"Menunggu verifikasi")+'</small></div></article>').join("");
}
async function submitDXSellerListing(event){
 event.preventDefault();if(!currentUser||!dxSupabase){dxAlert("Silakan masuk terlebih dahulu.");return;}
 const button=$("dxSellerListingSubmit"),type=$("dxSellerListingType").value,title=$("dxSellerListingTitle").value.trim(),description=$("dxSellerListingDescription").value.trim(),price=Number($("dxSellerListingPrice").value),file=$("dxSellerListingPhoto").files?.[0];
  if(!title||!Number.isFinite(price)||price<=0||!file){dxAlert("Lengkapi nama produk, harga, dan foto.");return;}
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){dxAlert("Foto harus JPG, PNG, atau WEBP maksimal 5 MB.");return;}
 button.disabled=true;button.textContent="Mengirim...";
 let objectPath=null;
 try{
  const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp"})[file.type];
  objectPath=currentUser.id+"/seller/"+crypto.randomUUID()+"."+ext;
  const {error:uploadError}=await dxSupabase.storage.from("marketplace-images").upload(objectPath,file,{contentType:file.type,cacheControl:"3600",upsert:false});
  if(uploadError)throw uploadError;
  const {data:publicData}=dxSupabase.storage.from("marketplace-images").getPublicUrl(objectPath);
  if(!publicData?.publicUrl)throw new Error("URL foto tidak berhasil dibuat.");
  const common={seller_id:currentUser.id,description:description||null,price,image_url:publicData.publicUrl,status:"pending",sale_status:"available",updated_at:new Date().toISOString()};
  const payload=type==="account"?{...common,game,title}:{...common,name:title,warranty_days:0,warranty_terms:"Listing penjual pihak ketiga; tidak termasuk garansi resmi DX STORE."};
  const {error}=await dxSupabase.from(type==="account"?"account_listings":"products").insert(payload);
  if(error)throw error;
  $("dxSellerListingForm").reset();$("dxSellerListingPreview").hidden=true;$("dxSellerGameWrap").hidden=true;
  await loadDXMySellerListings();await loadDXStore();
  dxAlert("Listing berhasil dikirim. Status: Menunggu verifikasi admin.");
 }catch(error){if(objectPath)await dxSupabase.storage.from("marketplace-images").remove([objectPath]);dxAlert("Listing gagal dikirim: "+getDXError(error));}
 finally{button.disabled=false;button.textContent="Kirim untuk Verifikasi";}
}
async function submitDXSellerApplication(event){
 event.preventDefault();if(!currentUser||!dxSupabase){dxAlert("Silakan masuk terlebih dahulu.");return;}
 const button=$("dxSellerApplyButton"),payload={user_id:currentUser.id,store_name:$("dxSellerStoreName").value.trim(),whatsapp:$("dxSellerWhatsapp").value.trim(),reason:$("dxSellerReason").value.trim(),status:"pending"};
 if(payload.store_name.length<2||payload.whatsapp.length<8||payload.reason.length<10){dxAlert("Lengkapi nama toko, WhatsApp, dan alasan berjualan.");return;}
 button.disabled=true;button.textContent="Mengirim...";
 try{const {error}=await dxSupabase.from("seller_applications").insert(payload);if(error)throw error;$("dxSellerApplicationForm").reset();await loadDXSellerApplicationState();dxAlert("Pengajuan penjual berhasil dikirim dan menunggu pemeriksaan admin.");}
 catch(error){dxAlert("Pengajuan gagal dikirim: "+getDXError(error));}finally{button.disabled=false;button.textContent="Kirim Pengajuan Penjual";}
}
async function loadDXAdminSellerApplications(){
 const box=$("dxAdminSellerApplications");if(!box||!currentUser||!(await checkDXAdmin()))return;box.textContent="Memuat pengajuan penjual...";
 const {data,error}=await dxSupabase.from("seller_applications").select("*").order("created_at",{ascending:false});
 if(error){box.textContent="Pengajuan gagal dimuat: "+getDXError(error);return;}if(!data?.length){box.textContent="Belum ada pengajuan penjual.";return;}
 box.innerHTML=data.map(item=>{const status=item.status==="approved"?"Disetujui":item.status==="rejected"?"Ditolak":"Menunggu";
 return '<article style="padding:13px;margin:10px 0;border:1px solid #334b70;border-radius:12px;background:#0b1426"><strong>'+safeText(item.store_name)+'</strong><p>WhatsApp: '+safeText(item.whatsapp)+'</p><p>Alasan: '+safeText(item.reason)+'</p><small>Status: '+status+' · User: '+safeText(item.user_id.slice(0,8))+'</small>'+(item.admin_note?'<p>Catatan: '+safeText(item.admin_note)+'</p>':'')+(item.status==="pending"?'<div style="margin-top:9px"><input id="dxSellerNote-'+safeText(item.id)+'" maxlength="300" placeholder="Catatan admin (opsional)" style="width:100%;padding:9px;margin-bottom:6px"><button type="button" onclick="reviewDXSellerApplication(\''+safeText(item.id)+'\',\'approved\')">Setujui Penjual</button><button type="button" onclick="reviewDXSellerApplication(\''+safeText(item.id)+'\',\'rejected\')">Tolak</button></div>':'')+'</article>';}).join("");
}
async function reviewDXSellerApplication(id,status){
 if(!currentUser||!(await checkDXAdmin())||!["approved","rejected"].includes(status)){dxAlert("Akses admin diperlukan.");return;}
 const note=$("dxSellerNote-"+id)?.value.trim()||null;
 const {error}=await dxSupabase.from("seller_applications").update({status,admin_note:note,reviewed_at:new Date().toISOString(),reviewed_by:currentUser.id,updated_at:new Date().toISOString()}).eq("id",id).eq("status","pending");
 if(error){dxAlert("Gagal memverifikasi penjual: "+getDXError(error));return;}await loadDXAdminSellerApplications();dxAlert(status==="approved"?"Penjual berhasil diverifikasi.":"Pengajuan penjual ditolak.");
}

/* DAFTAR DATA ADMIN */

async function loadDXAdminVerificationList(table) {
  const box = $("dxAdminVerificationList");
  if (!box || !dxSupabase || !["products", "account_listings"].includes(table)) return;
  const isProduct = table === "products";
  const label = isProduct ? "produk digital" : "akun game";
  box.dataset.table = table;
  box.innerHTML = '<h3 style="margin:0 0 10px">Verifikasi ' + (isProduct ? "Produk Digital" : "Akun Game") + '</h3><p>Memuat pengajuan yang menunggu pemeriksaan...</p>';
  const { data, error } = await dxSupabase.from(table).select("*").eq("status", "pending").order("created_at", { ascending: false });
  if (error) { box.innerHTML = '<div class="dx-verify-empty"><strong>Daftar verifikasi gagal dimuat</strong><p>' + safeText(getDXError(error)) + '</p></div>'; return; }
  // Listing milik admin sendiri tidak masuk antrean pemeriksaan.
  const reviewQueue = (data || []).filter(item => item.seller_id !== currentUser.id);
  const ownPending = (data || []).filter(item => item.seller_id === currentUser.id).length;
  if (!reviewQueue.length) {
    box.innerHTML = '<header class="dx-verify-heading"><div><h3>Verifikasi ' + (isProduct ? "Produk Digital" : "Akun Game") + '</h3><p>Antrean pemeriksaan dari penjual lain</p></div><span class="dx-verify-count">0</span></header><div class="dx-verify-empty"><strong>Tidak ada pengajuan untuk diperiksa</strong><p>' + (ownPending ? "Ada " + ownPending + " listing milik akun admin. Listing tersebut tidak perlu diverifikasi oleh akun sendiri." : "Pengajuan penjual akan muncul di sini setelah dikirim.") + '</p></div>'; return;
  }
  box.innerHTML = '<header class="dx-verify-heading"><div><h3>Verifikasi ' + (isProduct ? "Produk Digital" : "Akun Game") + '</h3><p>Periksa detail sebelum menerbitkan listing</p></div><span class="dx-verify-count">' + reviewQueue.length + ' menunggu</span></header><div class="dx-verify-grid">' + reviewQueue.map(item => {
    const title = isProduct ? item.name : item.title;
    const imageUrl = safeImageUrl(item.image_url);
    return '<article class="dx-verify-card">' +
      (imageUrl ? '<img class="dx-verify-image" src="' + safeText(imageUrl) + '" alt="Foto listing" loading="lazy">' : '<div class="dx-verify-image dx-verify-no-image">Foto belum tersedia</div>') +
      '<div class="dx-verify-content"><div class="dx-verify-card-top"><strong>' + safeText(title || "Tanpa judul") + '</strong><span class="dx-verify-pending">Menunggu</span></div><strong class="dx-verify-price">' + formatPrice(item.price) + '</strong>' +
      (isProduct ? "" : '<p><b>Game:</b> ' + safeText(item.game || "-") + '</p>') +
      '<p class="dx-verify-description">' + safeText(item.description || "Tidak ada deskripsi") + '</p>' +
      '<small>Diajukan ' + (item.created_at ? new Date(item.created_at).toLocaleString(getDXCountry().locale || "id-ID") : "") + '</small><div class="dx-verify-actions"><button class="dx-verify-approve" type="button" onclick="reviewDXListing(\'' + table + '\',\'' + safeText(item.id) + '\',\'active\')">Setujui &amp; Terbitkan</button><button class="dx-verify-reject" type="button" onclick="reviewDXListing(\'' + table + '\',\'' + safeText(item.id) + '\',\'rejected\')">Tolak</button></div></div></article>';
  }).join("") + '</div>';
}

async function loadDXAdminList() {
  if (!dxSupabase) return;

  const container = $("dxAdminList");
  if (!container) return;

  container.textContent = "Memuat data...";

  const { data, error } = await dxSupabase
    .from(dxAdminType)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat data admin:", error);
    container.textContent = "Data gagal dimuat: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    container.textContent = "Belum ada data.";
    return;
  }

  container.innerHTML = data.map((item) => {
    const title = dxAdminType === "products" ? item.name : item.title;
    const moderation = item.status === "pending" && item.seller_id === currentUser?.id ? "admin_owned_pending" : (item.status || (dxAdminType === "products" ? "active" : "pending"));
    const sale = item.sale_status || "available";
    const saleLabel = sale === "sold_out" ? "Sold Out" : sale === "pending" ? "Dipesan" : sale === "available" ? "Tersedia" : sale;
    const moderationLabel = moderation === "active" ? "Aktif" : moderation === "pending" ? "Menunggu" : moderation === "rejected" ? "Ditolak" : moderation === "admin_owned_pending" ? "Listing admin · tidak perlu verifikasi" : moderation;

    return `
      <article class="dx-admin-data-card" style="padding:12px;margin:10px 0;border:1px solid rgba(148,163,184,.22);border-radius:12px">
        <strong>${safeText(title)}</strong>
        <p style="margin:5px 0"> ${formatPrice(item.price)} </p>
        ${dxAdminType === "account_listings" ? `<p style="margin:3px 0">Game: ${safeText(item.game)}</p>` : ""}
        ${dxAdminType === "products" ? `<p style="margin:3px 0">Garansi: ${Number(item.warranty_days ?? 7) > 0 ? Number(item.warranty_days ?? 7) + " hari" : "Tidak tersedia"}</p>` : ""}
        <small style="display:block;margin:5px 0;color:#94a3b8">Moderasi: ${safeText(moderationLabel)} · Penjualan: ${safeText(saleLabel)}</small>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:9px">
          ${sale !== "available" ? `<button type="button" onclick="setDXSaleStatus('${dxAdminType}', '${safeText(item.id)}', 'available')">Aktifkan</button>` : ""}
          ${moderation === "pending" ? `<button type="button" onclick="reviewDXListing('${dxAdminType}', '${safeText(item.id)}', 'active')">Setujui</button><button type="button" onclick="reviewDXListing('${dxAdminType}', '${safeText(item.id)}', 'rejected')">Tolak</button>` : ""}
          <button type="button" onclick="editDXAdminItem('${safeText(item.id)}')">Edit</button>
          <button type="button" onclick="deleteDXAdminItem('${safeText(item.id)}')">Hapus</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadDXPaymentOrders() {
  const container = $("dxPaymentOrders");
  if (!container || !currentUser || !(await checkDXAdmin())) return;
  container.textContent = "Memuat pesanan...";
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/admin/orders", DX_CONFIG.paymentApiUrl + "/"), {
      headers: { "apikey": DX_CONFIG.supabaseKey, "Authorization": "Bearer " + session?.access_token }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal dimuat.");
    const orders = Array.isArray(result.orders) ? result.orders : [];
    if (!orders.length) { container.innerHTML = '<div class="dx-order-empty">Belum ada pesanan.</div>'; return; }

    const statusLabels = {
      pending: "Menunggu pembayaran",
      review: "Perlu verifikasi",
      paid: "Lunas",
      rejected: "Ditolak",
      cancelled: "Dibatalkan",
      processing: "Sedang diproses",
      delivered: "Sudah diserahkan",
      completed: "Selesai"
    };
    const renderOrder = order => {
      const shortId = String(order.order_id || "").slice(-8);
      const status = String(order.status || "").toLowerCase();
      const statusLabel = statusLabels[status] || status;
      const created = order.created_at
        ? new Date(order.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
        : "";
      return `
        <article class="dx-admin-order-card" style="padding:14px;margin:10px 0;border:1px solid #294466;border-radius:14px;background:#101d33;color:#eaf2ff">
          <div style="display:flex;align-items:center;gap:11px;min-width:0">
            ${order.image_url ? `<button type="button" data-dx-product-image="${safeText(order.image_url)}" aria-label="Perbesar foto produk" style="flex:0 0 58px;width:58px;height:58px;padding:0;overflow:hidden;border:1px solid #36577e;border-radius:10px;background:#0b1528;cursor:zoom-in"><img src="${safeText(order.image_url)}" alt="Foto ${safeText(order.item_name || "produk")}" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover"></button>` : `<div aria-hidden="true" style="flex:0 0 58px;width:58px;height:58px;display:grid;place-items:center;border:1px solid #294466;border-radius:10px;background:#0b1528;color:#91a7c4;font-size:10px">Tanpa foto</div>`}
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex:1;min-width:0;flex-wrap:wrap">
              <strong style="font-size:15px;overflow-wrap:anywhere">${safeText(order.item_name || "Pesanan")}</strong>
              <strong style="font-size:14px;white-space:nowrap">${formatPrice(order.amount)}</strong>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
            <span style="font-size:12px;color:#a9bdd8">#${safeText(shortId)}</span>
            <span style="font-size:12px;font-weight:700;padding:4px 9px;border-radius:20px;background:#203957;color:#bfe8ff">${safeText(statusLabel)}</span>
          </div>
          ${created ? `<small style="display:block;margin-top:7px;color:#91a7c4">${safeText(created)}</small>` : ""}
          ${order.proof_url ? `<p style="margin:9px 0"><a href="${safeText(order.proof_url)}" target="_blank" rel="noopener">Lihat bukti pembayaran</a></p>` : ""}
          ${order.can_deliver && ["paid","processing"].includes(status) ? `
            <div style="margin-top:12px;padding:12px;border:1px solid #315b89;border-radius:12px;background:#0b172a">
              <strong style="display:block;margin-bottom:7px;color:#8de4ff">Kirim Produk ke Pembeli</strong>
              <textarea id="dxDeliveryContent-${safeText(order.order_id)}" maxlength="20000" rows="5" placeholder="Ketik isi produk yang dibeli. Contoh: kode digital, materi, atau instruksi produk." style="box-sizing:border-box;width:100%;padding:10px;border:1px solid #36577e;border-radius:9px;background:#081326;color:#fff;resize:vertical"></textarea>
              <input id="dxDeliveryNote-${safeText(order.order_id)}" maxlength="2000" placeholder="Catatan untuk pembeli (opsional)" style="box-sizing:border-box;width:100%;margin-top:8px;padding:10px;border:1px solid #36577e;border-radius:9px;background:#081326;color:#fff">
              <button type="button" onclick="sendDXAdminDelivery('${safeText(order.order_id)}')" style="margin-top:9px">Kirim Produk</button>
              <small style="display:block;margin-top:6px;color:#91a7c4">Hanya tampil di Pesanan Saya setelah admin mengirim. Pengiriman tidak dapat diulang.</small>
            </div>
          ` : ""}
          ${status === "review" ? `
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
              <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="paid" data-dx-source-status="review">Setujui</button>
              <button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="rejected" data-dx-source-status="review">Tolak</button>
            </div>
          ` : status === "pending" ? `
            <div style="margin-top:10px"><button type="button" data-dx-order="${safeText(order.order_id)}" data-dx-decision="rejected" data-dx-source-status="pending">Batalkan pesanan</button></div>
          ` : ""}
        </article>
      `;
    };

    const activeOrders = orders.filter(order => ["review", "pending"].includes(String(order.status || "").toLowerCase()));
    const paidOrders = orders.filter(order => String(order.status || "").toLowerCase() === "paid");
    const rejectedOrders = orders.filter(order => String(order.status || "").toLowerCase() === "rejected");
    const cancelledOrders = orders.filter(order => String(order.status || "").toLowerCase() === "cancelled");
    const section = (title, items, cls = "") => items.length
      ? `<section class="dx-order-section ${cls}" style="margin:0 0 14px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border:1px solid #294466;border-radius:11px;background:#142642">
            <strong style="color:#eaf2ff;font-size:13px">${title}</strong>
            <span style="font-size:11px;color:#9fc7ed">${items.length}</span>
          </div>
          <div class="dx-order-section-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:9px;margin-top:9px">${items.map(renderOrder).join("")}</div>
        </section>`
      : "";
    const historyCount = paidOrders.length + rejectedOrders.length + cancelledOrders.length;
    const history = [
      section("Disetujui · Lunas", paidOrders, "is-paid"),
      section("Ditolak", rejectedOrders, "is-rejected"),
      section("Dibatalkan", cancelledOrders, "is-cancelled")
    ].join("");
    const activeContent = section("Daftar yang perlu ditangani", activeOrders, "is-active")
      || '<div style="padding:14px;border:1px dashed #36577e;border-radius:12px;color:#9fb2cc;text-align:center">Tidak ada pesanan yang perlu ditinjau.</div>';
    container.innerHTML = `
      <div class="dx-order-tabs" style="display:flex;gap:8px;margin:0 0 12px;flex-wrap:wrap">
        <button type="button" data-dx-order-tab="active" aria-pressed="true" style="border:1px solid #3984c8;border-radius:10px;padding:9px 13px;background:#173b61;color:#eaf6ff;font-weight:700">Antrean (${activeOrders.length})</button>
        <button type="button" data-dx-order-tab="history" aria-pressed="false" style="border:1px solid #294466;border-radius:10px;padding:9px 13px;background:#101d33;color:#b7c9e2;font-weight:600">Riwayat (${historyCount})</button>
      </div>
      <div data-dx-order-panel="active">${activeContent}</div>
      <div data-dx-order-panel="history" hidden>${history || '<div style="padding:14px;color:#9fb2cc">Belum ada riwayat keputusan.</div>'}</div>
    `;
    container.querySelectorAll("[data-dx-order-tab]").forEach(tab => {
      tab.addEventListener("click", () => {
        const selected = tab.dataset.dxOrderTab;
        container.querySelectorAll("[data-dx-order-panel]").forEach(panel => {
          panel.hidden = panel.dataset.dxOrderPanel !== selected;
        });
        container.querySelectorAll("[data-dx-order-tab]").forEach(button => {
          const chosen = button === tab;
          button.setAttribute("aria-pressed", String(chosen));
          button.style.background = chosen ? "#173b61" : "#101d33";
          button.style.borderColor = chosen ? "#3984c8" : "#294466";
          button.style.color = chosen ? "#eaf6ff" : "#b7c9e2";
        });
      });
    });

    container.querySelectorAll("[data-dx-product-image]").forEach(button => {
      button.addEventListener("click", () => {
        const src = button.getAttribute("data-dx-product-image");
        if (!src) return;
        const overlay = document.createElement("div");
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Foto produk");
        overlay.style.cssText = "position:fixed;inset:0;z-index:100001;display:grid;place-items:center;padding:20px;background:rgba(2,7,18,.9);backdrop-filter:blur(7px);cursor:zoom-out";
        const image = document.createElement("img");
        image.src = src;
        image.alt = "Foto produk yang dibeli";
        image.style.cssText = "display:block;max-width:min(92vw,760px);max-height:86vh;object-fit:contain;border-radius:14px;box-shadow:0 20px 70px rgba(0,0,0,.55)";
        overlay.appendChild(image);
        overlay.addEventListener("click", () => overlay.remove());
        document.body.appendChild(overlay);
      });
    });
  } catch (error) { container.textContent = getDXError(error); }
}

/* DIALOG DX STORE — satu gaya untuk seluruh konfirmasi dan pesan */
function dxDialog(message, options = {}) {
  return new Promise(resolve => {
    const old = document.getElementById("dxUnifiedDialog");
    if (old) old.remove();
    const isConfirm = options.confirm === true;
    const overlay = document.createElement("div");
    overlay.id = "dxUnifiedDialog";
    overlay.setAttribute("role", "presentation");
    overlay.style.cssText = "position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:20px;background:rgba(3,8,22,.78);backdrop-filter:blur(8px);";
    const panel = document.createElement("section");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "dxUnifiedDialogTitle");
    panel.style.cssText = "width:min(100%,420px);padding:24px;border:1px solid #31527e;border-radius:20px;background:linear-gradient(145deg,#142746,#0b1428);color:#f5f8ff;box-shadow:0 24px 80px rgba(0,0,0,.48);";
    const title = document.createElement("h3");
    title.id = "dxUnifiedDialogTitle";
    title.textContent = options.title || (isConfirm ? "Konfirmasi DX STORE" : "Informasi DX STORE");
    title.style.cssText = "margin:0 0 12px;color:#7dd3fc;font-size:19px;";
    const body = document.createElement("p");
    body.textContent = String(message ?? "");
    body.style.cssText = "margin:0 0 22px;line-height:1.6;color:#dbe7fa;white-space:pre-wrap;overflow-wrap:anywhere;";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;";
    const finish = value => { overlay.remove(); resolve(value); };
    if (isConfirm) {
      const cancel = document.createElement("button");
      cancel.type = "button"; cancel.textContent = options.cancelText || "Batal";
      cancel.style.cssText = "padding:11px 17px;border:1px solid #496080;border-radius:11px;background:#172943;color:#e5efff;font-weight:700;";
      cancel.addEventListener("click", () => finish(false));
      actions.appendChild(cancel);
    }
    const ok = document.createElement("button");
    ok.type = "button"; ok.textContent = options.okText || (isConfirm ? "Lanjutkan" : "Mengerti");
    ok.style.cssText = "padding:11px 18px;border:0;border-radius:11px;background:linear-gradient(100deg,#168bd1,#6558dc);color:white;font-weight:800;";
    ok.addEventListener("click", () => finish(true));
    actions.appendChild(ok);
    overlay.addEventListener("click", event => { if (event.target === overlay) finish(false); });
    panel.append(title, body, actions); overlay.appendChild(panel); document.body.appendChild(overlay);
    ok.focus();
  });
}
function dxAlert(message, title) { return dxDialog(message, { title }); }
function dxConfirm(message, title, okText) { return dxDialog(message, { confirm: true, title, okText }); }

async function reviewDXPayment(orderId, status, sourceStatus) {
  if (!currentUser || !(await checkDXAdmin())) { dxAlert("Akses admin diperlukan."); return; }
  const isCancellation = status === "rejected" && sourceStatus === "pending";
  const message = status === "paid"
    ? "Pastikan dana benar-benar sudah masuk sebelum menyetujui pembayaran. Lanjutkan?"
    : isCancellation
      ? "Batalkan pesanan ini dan lepaskan barang dari reservasi?"
      : "Tolak bukti pembayaran ini?";
  const title = isCancellation ? "Batalkan pesanan" : "Verifikasi pembayaran";
  const okText = status === "paid" ? "Setujui" : isCancellation ? "Ya, batalkan" : "Tolak";
  if (!(await dxConfirm(message, title, okText))) return;
  try {
    const session = (await dxSupabase.auth.getSession()).data.session;
    const response = await fetch(new URL("api/admin/orders/" + encodeURIComponent(orderId), DX_CONFIG.paymentApiUrl + "/"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session?.access_token },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Status pesanan gagal diperbarui.");
    await loadDXPaymentOrders();
  } catch (error) { dxAlert(getDXError(error)); }
}
async function sendDXAdminDelivery(orderId){
 if(!currentUser||!(await checkDXAdmin())){dxAlert("Akses Owner diperlukan.");return;}
 const content=$("dxDeliveryContent-"+orderId)?.value.trim()||"";
 const buyerNote=$("dxDeliveryNote-"+orderId)?.value.trim()||"";
 if(!content){dxAlert("Isi produk untuk pembeli wajib diisi.");return;}
 if(content.length>20000||buyerNote.length>2000){dxAlert("Isi produk atau catatan melebihi batas karakter.");return;}
 if(!(await dxConfirm("Kirim isi produk ini kepada pembeli? Setelah dikirim, isi tidak dapat diganti melalui formulir ini.","Kirim Produk","Kirim Sekarang")))return;
 try{
  const session=(await dxSupabase.auth.getSession()).data.session;
  const response=await fetch(new URL("api/admin/orders/"+encodeURIComponent(orderId)+"/delivery",DX_CONFIG.paymentApiUrl+"/"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session?.access_token},body:JSON.stringify({content,buyerNote})});
  const result=await response.json();
  if(!response.ok)throw new Error(result.message||"Produk gagal dikirim.");
  await loadDXPaymentOrders();
  dxAlert("Produk berhasil dikirim. Pembeli dapat melihatnya di menu Pesanan Saya.");
 }catch(error){dxAlert(getDXError(error));}
}


/* SIMPAN DATA */

async function saveDXAdminItem(event) {
  event.preventDefault();

  if (!dxSupabase || !currentUser || !(await checkDXAdmin())) {
    showDXAdminMessage("Akses ditolak. Khusus administrator.");
    return;
  }

  const isAccount = dxAdminType === "account_listings";
  const editId = $("dxEditId").value;
  const name = $("dxName").value.trim();
  const description = $("dxDescription").value.trim();
  const price = parseDXRupiahInput($("dxPrice").value);
  let imageUrl = $("dxImage").value.trim();
  const imageFile = $("dxImageFile")?.files?.[0] || null;

  if (imageFile && (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024)) {
    showDXAdminMessage("Foto harus JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.");
    return;
  }

  if (!name || !Number.isFinite(price) || price <= 0) {
    showDXAdminMessage("Nama harus diisi dan harga harus lebih dari Rp0.");
    return;
  }

  if (isAccount && !$("dxGame").value.trim()) {
    showDXAdminMessage("Nama game wajib diisi.");
    return;
  }

  const payload = {
    description: description || null,
    price,
    image_url: imageUrl || null,
    updated_at: new Date().toISOString()
  };

  if (isAccount) {
    payload.game = $("dxGame").value.trim();
    payload.title = name;
  } else {
    const warrantyDays = Number($("dxWarrantyDays")?.value);
    if (!Number.isInteger(warrantyDays) || warrantyDays < 0 || warrantyDays > 3650) {
      showDXAdminMessage("Masa garansi harus 0 sampai 3650 hari.");
      return;
    }
    payload.name = name;
    payload.warranty_days = warrantyDays;
    payload.warranty_terms = $("dxWarrantyTerms")?.value.trim() || "Ajukan klaim melalui Pusat Bantuan dengan ID pesanan.";
  }

  const saveButton = $("dxSaveButton");
  saveButton.disabled = true;
  saveButton.textContent = "Menyimpan...";

  try {
    if (imageFile) {
      const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[imageFile.type];
      const objectPath = currentUser.id + "/admin/" + crypto.randomUUID() + "." + extension;
      const { error: uploadError } = await dxSupabase.storage
        .from("marketplace-images")
        .upload(objectPath, imageFile, { contentType: imageFile.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicData } = dxSupabase.storage.from("marketplace-images").getPublicUrl(objectPath);
      imageUrl = publicData?.publicUrl || "";
      if (!imageUrl) throw new Error("URL foto tidak berhasil dibuat.");
      $("dxImage").value = imageUrl;
      // Simpan URL hasil upload terbaru ke payload sebelum INSERT/UPDATE.
      payload.image_url = imageUrl;
    }

    let result;

    if (editId) {
      result = await dxSupabase
        .from(dxAdminType)
        .update(payload)
        .eq("id", editId);
    } else {
      // Data yang dibuat admin tetap langsung aktif; listing pengguna dikirim melalui formulir penjual dan selalu pending.
      payload.seller_id = currentUser.id;
      payload.status = "active";

      result = await dxSupabase
        .from(dxAdminType)
        .insert(payload);
    }

    if (result.error) throw result.error;

    showDXAdminMessage(
      editId
        ? "Data berhasil diperbarui!"
        : "Data berhasil disimpan!"
    );

    resetDXAdminForm();
    await loadDXAdminList();
    await loadDXStore();

  } catch (error) {
    console.error(error);
    showDXAdminMessage("Gagal menyimpan: " + getDXError(error));
  } finally {
    saveButton.disabled = false;
    updateDXAdminFormLabels();
  }
}

/* VERIFIKASI AKUN GAME OLEH ADMIN */

async function reviewDXListing(table, id, status) {
  if (!currentUser || !(await checkDXAdmin())) {
    dxAlert("Akses ditolak. Khusus administrator.");
    return;
  }

  if (!["products", "account_listings"].includes(table)) return;
  if (!["active", "rejected"].includes(status)) return;

  const label = status === "active" ? "menyetujui dan menerbitkan" : "menolak";
  const itemLabel = table === "products" ? "produk digital" : "akun game";
  if (!(await dxConfirm("Yakin ingin " + label + " " + itemLabel + " ini?", "Konfirmasi listing", "Ya, lanjutkan"))) return;

  const { error } = await dxSupabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    dxAlert("Gagal memverifikasi: " + getDXError(error));
    return;
  }

  showDXAdminMessage(status === "active"
    ? itemLabel + " berhasil disetujui dan diterbitkan."
    : "Pengajuan " + itemLabel + " ditolak.");
  await loadDXAdminList();
  if ($("dxAdminVerificationList")?.style.display !== "none") await loadDXAdminVerificationList(table);
  await loadDXStore();
}

async function setDXSaleStatus(table, id, status) {
  if (!currentUser || !(await checkDXAdmin())) { dxAlert("Akses admin diperlukan."); return; }
  if (!["products", "account_listings"].includes(table) || status !== "available") return;
  if (!(await dxConfirm("Aktifkan kembali barang ini agar bisa dipesan?", "Konfirmasi stok", "Aktifkan"))) return;
  const { error } = await dxSupabase.from(table)
    .update({ sale_status: "available", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { dxAlert("Gagal mengubah status: " + getDXError(error)); return; }
  await loadDXAdminList();
  await loadDXStore();
}

/* EDIT DATA */

async function editDXAdminItem(id) {
  if (!currentUser || !(await checkDXAdmin())) {
    dxAlert("Akses ditolak.");
    return;
  }

  const { data, error } = await dxSupabase
    .from(dxAdminType)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    dxAlert("Data tidak ditemukan.");
    return;
  }

  $("dxEditId").value = data.id;
  $("dxName").value = dxAdminType === "products"
    ? data.name
    : data.title;

  $("dxDescription").value = data.description || "";
  $("dxPrice").value = formatDXRupiahInput(data.price);
  $("dxImage").value = data.image_url || "";

  if (dxAdminType === "account_listings") {
    $("dxGame").value = data.game || "";
  } else {
    $("dxWarrantyDays").value = String(data.warranty_days ?? 7);
    $("dxWarrantyTerms").value = data.warranty_terms || "";
  }

  $("dxCancelEdit").style.display = "inline-block";
  updateDXAdminFormLabels();

  showDXAdminMessage("Mode edit aktif. Silakan ubah data.");

  $("dxAdminPanel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* HAPUS DATA */

async function deleteDXAdminItem(id) {
  if (!currentUser || !(await checkDXAdmin())) {
    dxAlert("Akses ditolak.");
    return;
  }

  if (!(await dxConfirm("Yakin ingin menghapus data ini?", "Konfirmasi penghapusan", "Hapus"))) return;

  const { error } = await dxSupabase
    .from(dxAdminType)
    .delete()
    .eq("id", id);

  if (error) {
    dxAlert("Gagal menghapus: " + getDXError(error));
    return;
  }

  showDXAdminMessage("Data berhasil dihapus.");

  resetDXAdminForm();
  await loadDXAdminList();
  await loadDXStore();
}

/* PERBAIKAN TOMBOL LOGIN / DAFTAR */

function switchAuthMode() {
  const form = $("authForm");
  if (!form) return;

  dxAuthMode = dxAuthMode === "login" ? "register" : "login";

  let nameInput = $("dxRegisterName");

  if (dxAuthMode === "register" && !nameInput) {
    nameInput = document.createElement("input");
    nameInput.id = "dxRegisterName";
    nameInput.type = "text";
    nameInput.placeholder = "Nama pengguna";
    nameInput.autocomplete = "name";
    nameInput.required = true;
    nameInput.style.cssText =
      "width:100%;margin-bottom:12px;padding:12px;border-radius:8px;";

    const emailInput = $("authEmail");
    if (emailInput) form.insertBefore(nameInput, emailInput);
  }

  if (dxAuthMode === "login" && nameInput) {
    nameInput.remove();
  }

  const submit = form.querySelector('button[type="submit"]');

  if (submit) {
    submit.textContent = dxAuthMode === "login" ? "Masuk" : "Daftar";
  }

  const switchButton = $("dxAuthSwitch");

  if (switchButton) {
    switchButton.textContent = dxAuthMode === "login"
      ? "Belum punya akun? Daftar"
      : "Sudah punya akun? Masuk";
  }

  showDXMessage("");
}

function setupDXAuthSwitch() {
  const form = $("authForm");
  if (!form || $("dxAuthSwitch")) return;

  const button = document.createElement("button");
  button.id = "dxAuthSwitch";
  button.type = "button";
  button.textContent = "Belum punya akun? Daftar";
  button.style.cssText =
    "display:block;width:100%;margin-top:14px;padding:10px;border:0;background:transparent;color:#38bdf8;cursor:pointer;";

  button.addEventListener("click", switchAuthMode);
  form.appendChild(button);
}

/* PROSES LOGIN DAN DAFTAR */

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!dxSupabase) {
    showDXMessage("Supabase belum terhubung.");
    return;
  }

  const email = $("authEmail")?.value.trim();
  const password = $("authPassword")?.value;
  const name = $("dxRegisterName")?.value.trim();

  if (!email || !password) {
    showDXMessage("Email dan password wajib diisi.");
    return;
  }

  if (password.length < 6) {
    showDXMessage("Password minimal 6 karakter.");
    return;
  }

  const submit = $("authForm")?.querySelector('button[type="submit"]');
  const originalText = submit?.textContent;

  if (submit) {
    submit.disabled = true;
    submit.textContent = "Memproses...";
  }

  try {
    let result;

    if (dxAuthMode === "register") {
      result = await dxSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name || email.split("@")[0]
          }
        }
      });

      if (result.error) throw result.error;

      if (!result.data.session) {
        showDXMessage(
          "Pendaftaran berhasil. Periksa email jika verifikasi diminta."
        );
        return;
      }
    } else {
      result = await dxSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (result.error) throw result.error;
    }

    currentUser = result.data.user;

    await loadDXProfile(currentUser);

    const isAdmin = await checkDXAdmin();

    updateDXHeaderAuth();

    const adminPanel = $("dxAdminPanel");
    const adminButton = $("dxOpenAdmin");
    const adminCard = $("dxAdminAccessCard");

    if (isAdmin) {
      createDXAdminPanel();
      window.dxAdminPanelExpanded = false;
      if (adminPanel) adminPanel.style.display = "none";
      if (adminButton) adminButton.hidden = false;
      if (adminCard) adminCard.hidden = false;
      await loadDXAdminList();
    } else {
      window.dxAdminPanelExpanded = false;
      if (adminPanel) adminPanel.style.display = "none";
      if (adminButton) adminButton.hidden = true;
      if (adminCard) adminCard.hidden = true;
    }

    if ($("authPassword")) $("authPassword").value = "";

    closeAuth();
    await loadDXStore();

  } catch (error) {
    console.error("Kesalahan autentikasi:", error);
    showDXMessage(getDXError(error));
  } finally {
    if (submit) {
      submit.disabled = false;
      submit.textContent = originalText || "Masuk";
    }
  }
}

/* PERBARUI STATUS PENGGUNA */

async function refreshDXUser() {
  if (!dxSupabase) return;

  const { data, error } = await dxSupabase.auth.getUser();

  if (error || !data?.user) {
    currentUser = null;
    currentProfile = null;

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";

    updateDXHeaderAuth();
    return;
  }

  currentUser = data.user;

  await loadDXProfile(currentUser);

  const isAdmin = await checkDXAdmin();

  updateDXHeaderAuth();

  const panel = $("dxAdminPanel");
  const adminButton = $("dxOpenAdmin");
  const adminCard = $("dxAdminAccessCard");

  if (isAdmin) {
    createDXAdminPanel();
    window.dxAdminPanelExpanded = false;
    if (panel) panel.style.display = "none";
    if (adminButton) adminButton.hidden = false;
    if (adminCard) adminCard.hidden = false;
    await loadDXAdminList();
  } else {
    window.dxAdminPanelExpanded = false;
    if (panel) panel.style.display = "none";
    if (adminButton) adminButton.hidden = true;
    if (adminCard) adminCard.hidden = true;
  }
}

/* KELUAR */

async function handleDXLogout() {
  if (!dxSupabase || window.dxLogoutInProgress) return;
  window.dxLogoutInProgress = true;

  const logoutButton = document.querySelector(".dx-nav-actions .dx-button");
  if (logoutButton) {
    logoutButton.disabled = true;
    logoutButton.textContent = "Keluar...";
  }

  try {
    const { error } = await dxSupabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    currentProfile = null;

    const panel = $("dxAdminPanel");
    if (panel) panel.style.display = "none";

    updateDXHeaderAuth();

    window.location.replace("login.html?v=67");
  } catch (error) {
    window.dxLogoutInProgress = false;
    if (logoutButton) {
      logoutButton.disabled = false;
      logoutButton.textContent = "Keluar";
    }
    dxAlert("Gagal keluar: " + getDXError(error));
  }
}

/* NAVIGASI */

function initDXNavigation() {
  const navigation = $("dxNavLinks");
  if (!navigation) return;

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
    });
  });
}

/* INISIALISASI APLIKASI */

async function initializeDXStore() {
  if (dxAuthReady) return;
  dxAuthReady = true;

  if (!dxSupabase) {
    console.error("Supabase JS SDK tidak tersedia; katalog memakai REST API publik.");
    loadProducts();
    loadAccountListings();
    return;
  }

  setupDXAuthSwitch();
  const countrySelect = $("dxCountry");
  if (countrySelect) {
    countrySelect.value = getDXCountry().code;
    countrySelect.addEventListener("change", () => setDXCountry(countrySelect.value));
  }
  setDXCountry(getDXCountry().code);
  // Tampilkan produk dan akun meskipun API kurs sedang gagal/tidak tersedia.
  loadProducts();
  loadAccountListings();
  loadDXExchangeRates().then(() => {
    if (dxExchangeRateReady) { loadProducts(); loadAccountListings(); }
  });
  applyDXLanguage();
  initDXNavigation();
  const searchInput = document.getElementById("dxMarketplaceSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLocaleLowerCase("id-ID");
      document.querySelectorAll("#productGrid .product-card, #accountGrid .product-card").forEach(card => {
        card.hidden = !card.textContent.toLocaleLowerCase("id-ID").includes(query);
      });
    });
  }

  const authForm = $("authForm");

  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }

  createDXAdminPanel();

  await refreshDXUser();
  await loadDXStore();
  await loadDXRecentPurchaseActivity();
  if (!window.dxPurchaseActivityRefresh) window.dxPurchaseActivityRefresh = setInterval(loadDXRecentPurchaseActivity, 60000);
  if (!window.dxSoldOutCatalogRefresh) window.dxSoldOutCatalogRefresh = setInterval(() => {
    if (!document.hidden) loadDXStore();
  }, 30000);

  dxSupabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;

    if (event === "SIGNED_OUT") {
      currentProfile = null;

      const panel = $("dxAdminPanel");
      if (panel) panel.style.display = "none";

      updateDXHeaderAuth();
      loadDXStore();
      return;
    }

    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      setTimeout(async () => {
        await refreshDXUser();
        await loadDXStore();
      }, 0);
    }
  });
}

/* JALANKAN DX STORE */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeDXStore
  );
} else {
  initializeDXStore();
}


/* SALDO DAN PENCAIRAN PENJUAL — transfer dilakukan manual oleh admin */
function dxWithdrawalDeadlineLabel(w){
 if(!w||!["pending","approved"].includes(w.status)||!w.created_at)return "";
 const due=new Date(new Date(w.created_at).getTime()+24*60*60*1000);
 if(Number.isNaN(due.getTime()))return "";
 const overdue=Date.now()>due.getTime();
 return '<p style="margin:8px 0;padding:8px;border-radius:8px;background:'+(overdue?'#3b1d25':'#142944')+'"><strong>'+(overdue?'Melewati target 24 jam':'Target pencairan maksimal 24 jam')+'</strong><br><small>'+due.toLocaleString("id-ID")+(overdue?' · Perlu tindak lanjut admin':' · Termasuk akhir pekan dan hari libur')+'</small></p>';
}
async function loadDXSellerWithdrawals(){
 const available=$("dxSellerAvailableBalance"),pending=$("dxSellerPendingBalance"),history=$("dxSellerWithdrawHistory");
 if(!currentUser||!dxSupabase||!available||!history)return;
 available.textContent="Memuat...";pending.textContent="Memuat...";history.textContent="Memuat riwayat...";
 const [summary,rows]=await Promise.all([dxSupabase.rpc("dx_seller_withdrawal_summary"),dxSupabase.from("seller_withdrawals").select("id,amount,payout_method,provider,status,admin_note,transfer_reference,created_at,paid_at").eq("seller_id",currentUser.id).order("created_at",{ascending:false}).limit(30)]);
 if(summary.error){available.textContent="Tidak tersedia";pending.textContent="—";history.textContent="Saldo gagal dimuat: "+getDXError(summary.error);return;}
 const s=Array.isArray(summary.data)?summary.data[0]:summary.data;
 available.textContent=formatPrice(s?.available_balance||0);pending.textContent=formatPrice(s?.pending_amount||0);
 if(rows.error){history.textContent="Riwayat gagal dimuat: "+getDXError(rows.error);return;}
 const labels={pending:"Menunggu pemeriksaan",approved:"Disetujui · menunggu transfer",paid:"Sudah ditransfer",rejected:"Ditolak"};
 history.innerHTML=(rows.data||[]).map(w=>'<article style="padding:10px;margin:8px 0;border:1px solid #334b70;border-radius:10px;background:#0b1426"><strong>'+formatPrice(w.amount)+'</strong><p style="margin:4px 0">'+safeText(w.provider)+' · '+(w.payout_method==="bank"?"Bank":"E-wallet")+'</p><small>Status: '+(labels[w.status]||safeText(w.status))+' · '+new Date(w.created_at).toLocaleString("id-ID")+'</small>'+dxWithdrawalDeadlineLabel(w)+(w.admin_note?'<p>Catatan admin: '+safeText(w.admin_note)+'</p>':'')+(w.transfer_reference?'<p>Referensi transfer: '+safeText(w.transfer_reference)+'</p>':'')+'</article>').join("")||"Belum ada permintaan pencairan.";
}
async function submitDXSellerWithdrawal(event){
 event.preventDefault();if(!currentUser||!dxSupabase)return;
 const button=$("dxSellerWithdrawSubmit"),feedback=$("dxSellerWithdrawFeedback");
 const amount=Number($("dxSellerWithdrawAmount").value),method=$("dxSellerWithdrawMethod").value,provider=$("dxSellerWithdrawProvider").value.trim(),accountName=$("dxSellerWithdrawAccountName").value.trim(),accountNumber=$("dxSellerWithdrawAccountNumber").value.trim();
 if(!Number.isSafeInteger(amount)||amount<=0||!provider||!accountName||accountNumber.length<5){feedback.textContent="Periksa kembali nominal dan detail rekening/e-wallet.";return;}
 button.disabled=true;feedback.textContent="Mengirim permintaan...";
 try{const {error}=await dxSupabase.rpc("dx_request_seller_withdrawal",{p_amount:amount,p_method:method,p_provider:provider,p_account_name:accountName,p_account_number:accountNumber});if(error)throw error;
  $("dxSellerWithdrawForm").reset();feedback.textContent="Permintaan pencairan terkirim. Admin akan memeriksa dan melakukan transfer manual.";await loadDXSellerWithdrawals();
 }catch(error){feedback.textContent="Permintaan gagal: "+getDXError(error);}finally{button.disabled=false;}
}
async function loadDXAdminWithdrawals(){
 const host=$("dxAdminWithdrawalsList");if(!host||!currentUser||!(await checkDXAdmin()))return;
 host.textContent="Memuat permintaan pencairan...";
 const {data,error}=await dxSupabase.from("seller_withdrawals").select("*").order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Permintaan pencairan gagal dimuat: "+getDXError(error);return;}
 if(!data?.length){host.textContent="Belum ada permintaan pencairan.";return;}
 const labels={pending:"Menunggu pemeriksaan",approved:"Disetujui · menunggu transfer",paid:"Sudah ditransfer",rejected:"Ditolak"};
 host.innerHTML=data.map(w=>'<article style="padding:14px;margin:10px 0;border:1px solid #334b70;border-radius:12px;background:#0b1426"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>'+formatPrice(w.amount)+'</strong><b>'+safeText(labels[w.status]||w.status)+'</b></div><p>Penjual: '+safeText(w.seller_id)+'</p><p>Tujuan: '+safeText(w.provider)+' · '+(w.payout_method==="bank"?"Bank":"E-wallet")+'</p><p>Nama pemilik: '+safeText(w.account_name)+'</p><p>Nomor rekening/akun: '+safeText(w.account_number)+'</p><small>Diajukan: '+new Date(w.created_at).toLocaleString("id-ID")+'</small>'+dxWithdrawalDeadlineLabel(w)+(w.admin_note?'<p>Catatan: '+safeText(w.admin_note)+'</p>':'')+(w.transfer_reference?'<p>Referensi transfer: '+safeText(w.transfer_reference)+'</p>':'')+(w.status==="pending"?'<div style="display:grid;gap:8px;margin-top:10px"><input id="dxWithdrawNote-'+safeText(w.id)+'" maxlength="300" placeholder="Catatan admin (opsional)" style="width:100%;padding:9px"><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-dx-withdraw-id="'+safeText(w.id)+'" data-dx-withdraw-status="approved">Setujui</button><button type="button" data-dx-withdraw-id="'+safeText(w.id)+'" data-dx-withdraw-status="rejected">Tolak</button></div></div>':w.status==="approved"?'<div style="margin-top:10px"><label>Referensi / nomor bukti transfer<input id="dxWithdrawRef-'+safeText(w.id)+'" maxlength="120" placeholder="Isi setelah transfer manual" style="display:block;width:100%;padding:9px;margin:6px 0"></label><button type="button" data-dx-withdraw-id="'+safeText(w.id)+'" data-dx-withdraw-status="paid">Tandai sudah ditransfer</button></div>':'')+'</article>').join("");
 host.querySelectorAll("[data-dx-withdraw-id]").forEach(button=>button.addEventListener("click",()=>reviewDXWithdrawal(button.dataset.dxWithdrawId,button.dataset.dxWithdrawStatus)));
}
async function reviewDXWithdrawal(id,status){
 if(!currentUser||!(await checkDXAdmin())||!["approved","rejected","paid"].includes(status)){dxAlert("Akses admin diperlukan.");return;}
 const {data:current,error:readError}=await dxSupabase.from("seller_withdrawals").select("status").eq("id",id).maybeSingle();
 if(readError||!current){dxAlert("Permintaan pencairan tidak ditemukan.");return;}
 if((status==="approved"||status==="rejected")&&current.status!=="pending"){dxAlert("Permintaan ini sudah diproses.");return;}
 if(status==="paid"&&current.status!=="approved"){dxAlert("Setujui permintaan dan lakukan transfer manual terlebih dahulu.");return;}
 const ref=status==="paid"?$("dxWithdrawRef-"+id)?.value.trim():"";
 if(status==="paid"&&!ref){dxAlert("Isi nomor referensi transfer setelah uang benar-benar dikirim.");return;}
 const patch={status,reviewed_by:currentUser.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
 if(status==="paid"){patch.paid_at=new Date().toISOString();patch.transfer_reference=ref;}
 if(status==="rejected")patch.admin_note=$("dxWithdrawNote-"+id)?.value.trim()||"Permintaan ditolak admin.";
 if(status==="approved")patch.admin_note=$("dxWithdrawNote-"+id)?.value.trim()||null;
 const {error}=await dxSupabase.from("seller_withdrawals").update(patch).eq("id",id).eq("status",current.status);
 if(error){dxAlert("Gagal memperbarui pencairan: "+getDXError(error));return;}
 await loadDXAdminWithdrawals();dxAlert(status==="paid"?"Pencairan ditandai sudah ditransfer.":"Status pencairan berhasil diperbarui.");
}


async function loadDXAdminAccountOrders(){
 const host=$("dxAdminAccountOrdersList");
 if(!host||!currentUser||!dxSupabase)return;
 host.textContent="Memuat pesanan akun milik admin...";
 const {data:listings,error:listError}=await dxSupabase.from("account_listings").select("id,title,game").eq("seller_id",currentUser.id);
 if(listError){host.textContent="Listing akun admin gagal dimuat: "+getDXError(listError);return;}
 const ids=(listings||[]).map(x=>x.id);
 if(!ids.length){host.textContent="Belum ada listing akun game milik admin.";return;}
 const {data:orders,error}=await dxSupabase.from("orders").select("id,item_id,item_name,total_amount,status,created_at,item_type").eq("item_type","account").in("item_id",ids).order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Pesanan akun admin gagal dimuat: "+getDXError(error);return;}
 if(!orders?.length){host.textContent="Belum ada pesanan untuk akun game milik admin.";return;}
 const labels={pending:"Menunggu pembayaran",review:"Menunggu verifikasi pembayaran",paid:"Lunas · siap diproses",processing:"Sedang diproses",delivered:"Menunggu konfirmasi pembeli",completed:"Selesai",rejected:"Ditolak",cancelled:"Dibatalkan",disputed:"Dalam penanganan"};
 host.innerHTML='<p style="padding:10px 12px;border:1px solid #36577e;border-radius:10px;color:#b8c9e6">Catat progres serah terima di sini. Jangan masukkan kata sandi, OTP, atau data login ke DX STORE; ikuti mekanisme resmi dari game.</p>'+orders.map(o=>{
  const actions=o.status==="paid"?'<button type="button" data-dx-admin-account-order="'+safeText(o.id)+'" data-dx-admin-next="processing">Mulai Penyerahan</button>':o.status==="processing"?'<button type="button" data-dx-admin-account-order="'+safeText(o.id)+'" data-dx-admin-next="delivered">Tandai Penyerahan Selesai</button>':o.status==="delivered"?'<small style="color:#86efac">Menunggu pembeli mengonfirmasi penerimaan</small>':"";
  return '<article style="padding:13px;margin:9px 0;border:1px solid #334b70;border-radius:12px;background:#0b1426"><strong>'+safeText(o.item_name||"Akun game")+'</strong><p style="margin:6px 0">'+formatPrice(o.total_amount)+' · '+safeText(labels[o.status]||o.status)+'</p><small>No. '+safeText(o.id)+' · '+new Date(o.created_at).toLocaleString("id-ID")+'</small><p style="margin:10px 0 0">'+actions+'</p></article>';
 }).join("");
 host.querySelectorAll("[data-dx-admin-account-order]").forEach(b=>b.addEventListener("click",async()=>{
  await updateDXSellerOrder(b.dataset.dxAdminAccountOrder,b.dataset.dxAdminNext);
  await loadDXAdminAccountOrders();
 }));
}
async function loadDXSellerOrders(){
 const host=$("dxSellerOrders");if(!host||!currentUser||!dxSupabase)return;
 host.textContent="Memuat pesanan masuk...";
 const {data,error}=await dxSupabase.from("orders").select("id,item_name,total_amount,status,created_at,item_type").order("created_at",{ascending:false}).limit(100);
 if(error){host.textContent="Pesanan masuk gagal dimuat: "+getDXError(error);return;}
 const rows=data||[];
 if(!rows.length){host.textContent="Belum ada pesanan untuk listing toko ini.";return;}
 const labels={paid:"Lunas · siap diproses",processing:"Sedang diproses",delivered:"Menunggu konfirmasi pembeli",completed:"Selesai"};
 host.innerHTML=rows.map(o=>'<article style="padding:12px;margin:8px 0;border:1px solid #334b70;border-radius:11px;background:#0b1426"><strong>'+safeText(o.item_name||"Pesanan")+'</strong><p style="margin:5px 0">'+formatPrice(o.total_amount)+' · '+safeText(labels[o.status]||o.status)+'</p><small>'+ (o.item_type==="account"?"Akun game":"Market") +' · '+new Date(o.created_at).toLocaleString("id-ID")+' · #'+safeText(o.id.slice(-8))+'</small>'+(o.status==="paid"?'<p><button type="button" data-dx-seller-order="'+safeText(o.id)+'" data-dx-next-status="processing">Mulai Proses Pesanan</button></p>':o.status==="processing"?'<p><button type="button" data-dx-seller-order="'+safeText(o.id)+'" data-dx-next-status="delivered">Tandai Sudah Diserahkan</button></p>':'')+'</article>').join("");
 host.querySelectorAll("[data-dx-seller-order]").forEach(b=>b.addEventListener("click",()=>updateDXSellerOrder(b.dataset.dxSellerOrder,b.dataset.dxNextStatus)));
}
async function updateDXSellerOrder(id,nextStatus){
 if(!currentUser||!["processing","delivered"].includes(nextStatus))return;
 const message=nextStatus==="processing"?"Mulai memproses pesanan ini?":"Pastikan produk sudah diserahkan kepada pembeli. Lanjutkan?";
 if(!await dxDialog(message,{confirm:true,title:"Konfirmasi pesanan"}))return;
 const {error}=await dxSupabase.rpc("dx_seller_update_order",{p_order_id:id,p_next_status:nextStatus});
 if(error){dxAlert("Status pesanan gagal diperbarui: "+getDXError(error));return;}
 await loadDXSellerOrders();dxAlert(nextStatus==="processing"?"Pesanan masuk ke tahap proses.":"Pesanan ditandai sudah diserahkan. Pembeli perlu mengonfirmasi penerimaan.");
}
async function confirmDXOrderReceived(id){
 if(!currentUser)return;
 if(!await dxDialog("Konfirmasi hanya jika barang digital sudah diterima dan sesuai pesanan. Setelah dikonfirmasi, pesanan selesai dan saldo penjual dapat dihitung.",{confirm:true,title:"Konfirmasi penerimaan"}))return;
 const {error}=await dxSupabase.rpc("dx_buyer_confirm_order",{p_order_id:id});
 if(error){dxAlert("Konfirmasi gagal: "+getDXError(error));return;}
 await loadDXOrderHistory();dxAlert("Pesanan dikonfirmasi selesai.");
}
