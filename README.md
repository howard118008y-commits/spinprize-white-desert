# 旋賞數位展示網站

旋賞數位有限公司的靜態展示頁，使用公開公司內容與既有作品素材。頁面、樣式與互動集中在單一 `index.html`：一個內嵌 `<style>` 與頁尾原生 JavaScript；圖片仍使用 `assets/` 本機素材。無框架、無建置步驟、無執行時套件或 CDN、無分析追蹤程式；開發套件僅供交付驗收使用。

## 本機啟動

在專案目錄執行：

```bash
python3 -m http.server 5180 --bind 127.0.0.1
```

開啟 http://localhost:5180 。停止時按 `Ctrl+C`。

## 無障礙交付驗收

需要 Node.js 22 以上；首次執行 `npm ci` 與 `npx playwright install chromium`。依上方指令啟動本機網站後，在另一個終端執行：

```bash
npm run audit:a11y
```

axe-core 以 Chromium 檢查桌機 1440×1000、手機 390×844，各含作品球體、服務、方案、關於、聯絡、全螢幕選單、作品一覽、作品全頁預覽、放大細節、加入主畫面說明共 10 種狀態，合計 20 次。作品預覽須等真正的全頁圖載入後才檢查；聯絡方式改為頁內入口，不再使用舊聯絡對話框。本站沒有資料輸入表單；未來加入表單時，須增加開啟及錯誤提示狀態。本工具不點擊外部聯絡連結、不送出資料；不載入內部網站或作品原站。

完整結果寫入已忽略的 `.qa/a11y/report.json`、`.qa/a11y/report.md`，包括時間、URL、引擎版本、違規與待人工確認項目；每次覆寫，交付前請另存當次報告。可用 `A11Y_URL=http://127.0.0.1:5181/` 指定網站位置，`A11Y_OUTPUT=/path/to/report` 指定輸出目錄。

退出碼 `1` 表示任何規則找到違規，`2` 表示頁面／對話框未成功檢查或執行出錯，兩者均不可當作交付通過。退出碼 `0` 只表示這 20 個狀態沒有自動偵測到違規；`incomplete` 仍須人工確認，另保留鍵盤、螢幕閱讀器與實機觸控驗收，**不代表 WCAG 合規**。使用 axe-core 預設規則，沒有忽略規則或既有違規基準線；既有問題照實列入結果。依賴只在檢查時注入，不修改正式頁面或設計。

API 與結果欄位依據：[axe-core 官方文件](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)。

## GitHub Pages

正式公開網址：https://heycheng.com.tw/

將此目錄的靜態檔部署到 GitHub Pages。資產使用相對路徑，無建置步驟；`.nojekyll` 保留原始靜態檔。若變更公開網址，請同步更新 `index.html` 內的 canonical、Open Graph 與 Twitter 圖片網址。

## 內容來源

- 公司資料、服務與五級含稅報價沿用改版前正式官網 https://heycheng.com.tw/ ，本次改版未調整價格；核對日期 2026-09-25。
- 作品連結：山遇民宿 https://shanyu2015.com 、鋮馨租賃 https://cx468.com.tw 、Go Shoot https://goshoot.com.tw 、線上一番賞平台 https://goshoot-ichiban.vercel.app 、台北建安宮 https://taipeijianantemple.com.tw 、永貞豆腐店 https://yongzhen-tofu.com.tw 。
- 2026-09-25 GitHub 作品擴充：junlin 織織怪 https://zhizhiguai-production.up.railway.app/ 、BTCUCC 費率雷達 https://btcucc.onrender.com/ 。
- 2026-09-25 上線連結更新：新增 Hey World https://howard118008y-commits.github.io/Hey-World/ 、TOONHUB 島嶼對決 https://howard118008y-commits.github.io/toonhub-island-duel/ ；test shirt 更新為公開網站 https://test-shirt.hoho0219.chatgpt.site 。展廳共 13 案，11 案標示「已上線」，Jev Talk 好好說話與 539 K 線分析保留「作品預覽」。
- 尚無公開網址的作品只展示實際介面截圖，不公開原始碼、帳號或內部資料。Jev Talk 使用預先編寫範例；539 使用專案內建樣本。
- 圖片沿用既有公開官網素材，轉換為 WebP 降低傳輸量。出處見 `assets/CREDITS.md`。
- 電話與 Email 直接使用 `tel:`、`mailto:`；Email 連結開啟使用者郵件程式，網站不收集或儲存表單資料。
- 頁面所列 GA4 是建置方案包含項目，本展示頁並未加入 GA4 或其他追蹤程式。

## 版型來源與調整

最初版本以使用者選定的 Awwwards／White Desert 頁面截圖，透過開源工具 `abi/screenshot-to-code` 產生第一版。2026-09-25 依使用者提供的單檔沉浸式框架，改為 Hey Cheng 黑色與 Tiffany 綠的 3D 作品球體、全螢幕選單及圖文內容頁。

球體圖層取自作品的真實首頁及內容區段；至少 21 個圖層，作品超過 21 件時每案仍至少有一層。作品一覽每案只列一次；點選後可捲動完整頁面，已公開上線的作品可前往原站。尚無公開網址的作品明確標示「作品預覽」，不提供虛構外連或私人儲存庫連結。開場使用既有作品截圖，不使用範例的野生動物素材或攝影師資料。字型使用系統字型，無外部字型請求。本頁與 Awwwards、White Desert 或原設計作者無隸屬關係。

原始截圖、原始生成稿、對話內容與 API key 不屬公開網站檔案。

## 維護

- 文字、價格、SEO、內嵌樣式與互動：`index.html`；作品資料位於頁尾 `projects` 陣列。每案需唯一 `id`、真實 `name`／`kind`／`note`、完整截圖 `width`／`height`；`capturedAt` 記錄實際截圖日期。`url` 僅填可公開驗證的網站；缺省時顯示「作品預覽」，可用 `status`／`previewLabel` 補充實際狀態。
- 每案圖片：`assets/case-<id>.webp`（首屏；既有作品 1440×900、新增作品 1280×720）、`assets/work-<id>-overview.webp`（約寬 960 的全頁縮圖）、`assets/work-<id>-full.webp`（完整頁面）。新增案須同步 `<noscript>` 的文字入口；已完成但尚無公開網站者提供本機作品全頁圖，不放私人專案 URL。
- 路由：`#works` 為球體、`#grid` 為作品一覽，`#services`／`#pricing`／`#about`／`#contact` 為四個內容頁；`#work-<id>` 可定位指定作品。
- 框架：`#world` 共用球心，`#orb` 放圖層，`#headline` 是同層元素；保留標題的負半寬 margin 與 `.inner` 垂直置中，避免修改後旋轉偏移。手機水平滑動旋轉、垂直滑動縮放；鍵盤方向鍵旋轉，Enter 開啟前方作品，也可直接使用作品一覽。
- 舊 `assets/styles.css`、`assets/app.css` 與 `assets/main.js` 仍保留於版本庫，最新版入口不再載入；新版樣式與互動請修改 `index.html`。
- App 安裝資訊與圖示：`manifest.webmanifest`、`assets/app-icon-*.png`；不提供離線快取，瀏覽作品仍需要網路。
- 無障礙驗收狀態與選擇器：`scripts/audit-a11y.mjs`，頁面結構調整時同步更新。
- 公開素材出處：`assets/CREDITS.md`

維運、第三方服務與 API 費用請按頁面說明及實際專案約定確認。
