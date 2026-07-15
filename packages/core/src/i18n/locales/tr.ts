import type { en } from "./en";

// Turkish has no grammatical plural distinction, so the "One"/"Other" key
// pairs intentionally hold identical phrasing here (FEATURE_SPECS.md § i18n).
export const tr: Record<keyof typeof en, string> = {
  "common.cancel": "Vazgeç",
  "common.save": "Kaydet",
  "common.confirm": "Onayla",
  "common.restore": "Geri Yükle",

  "page.navAria": "Sayfalar",
  "page.addAria": "Sayfa ekle",
  "page.deleteAria": "{name} sil",

  "board.rename": "Yeniden adlandır",
  "board.delete": "Sil",
  "board.menuAria": "{name} menüsü",
  "board.dragAria": "{name} sürükle",
  "board.addAria": "Board ekle",
  "board.namePlaceholder": "Board adı",
  "board.typeAria": "Board tipi",
  "board.type.bookmarks": "Yer İmleri",
  "board.type.notes": "Notlar",
  "board.type.calendar": "Takvim",
  "board.type.pomodoro": "Pomodoro",
  "board.type.search": "Arama",

  "bookmark.open": "Aç",
  "bookmark.openIncognito": "Gizli Sekmede Aç",
  "bookmark.edit": "Düzenle",
  "bookmark.delete": "Sil",
  "bookmark.dragAria": "{title} sürükle",
  "bookmark.menuAria": "{title} menüsü",
  "bookmark.showMoreOne": "1 tane daha göster",
  "bookmark.showMoreOther": "{count} tane daha göster",
  "bookmark.add": "+ Yer imi ekle",
  "bookmark.url": "URL",
  "bookmark.title": "Başlık",
  "bookmark.description": "Açıklama",

  "placeholder.comingSoon": "{type} — yakında",

  "trash.title": "Çöp Kutusu",
  "trash.empty": "Çöp kutusunu boşalt",
  "trash.emptyConfirm": "Çöp kutusu boşaltılsın mı?",
  "trash.isEmpty": "Çöp kutusu boş.",
  "trash.bookmarkCountOne": "1 yer imi",
  "trash.bookmarkCountOther": "{count} yer imi",
  "trash.permanentlyDeleteAria": "{name} kalıcı olarak sil",

  "app.openTrash": "Çöp kutusunu aç",
  "app.closeTrash": "Çöp kutusunu kapat",
  "app.openStyleEditor": "Görünümü özelleştir",
  "app.language": "Dil",

  "style.title": "Stili Düzenle",
  "style.accentColor": "Vurgu Rengi",
  "style.boardColor": "Board Rengi",
  "style.boardOpacity": "Board Saydamlığı",
  "style.boardBlur": "Board Bulanıklığı",
  "style.textSize": "Metin Boyutu",
  "style.textWeight": "Metin Kalınlığı",
  "style.normal": "Normal",
  "style.bold": "Kalın",
  "style.reset": "Sıfırla",
  "style.close": "Kapat",
};
