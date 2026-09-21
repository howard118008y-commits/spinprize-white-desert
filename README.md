# 旋賞數位展示網站

旋賞數位有限公司的靜態展示頁，使用公開公司內容與既有作品素材。HTML、原生 CSS 與少量原生 JavaScript，無框架、網站無執行時套件或 CDN、無分析追蹤程式；開發套件僅供交付驗收使用。

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

axe-core 以 Chromium 檢查桌機 1440×1000、手機 390×844 的作品、服務、方案、關於、聯絡共五個頁面狀態，以及聯絡／作品預覽對話框，共 14 次。本站沒有資料輸入表單；未來加入表單時，須增加開啟及錯誤提示狀態。本工具不點擊外部聯絡連結、不送出資料；不載入內部網站或作品原站。

完整結果寫入已忽略的 `.qa/a11y/report.json`、`.qa/a11y/report.md`，包括時間、URL、引擎版本、違規與待人工確認項目；每次覆寫，交付前請另存當次報告。可用 `A11Y_URL=http://127.0.0.1:5181/` 指定網站位置，`A11Y_OUTPUT=/path/to/report` 指定輸出目錄。

退出碼 `1` 表示任何規則找到違規，`2` 表示頁面／對話框未成功檢查或執行出錯，兩者均不可當作交付通過。退出碼 `0` 只表示這 14 個狀態沒有自動偵測到違規；`incomplete` 仍須人工確認，另保留鍵盤、螢幕閱讀器與實機觸控驗收，**不代表 WCAG 合規**。使用 axe-core 預設規則，沒有忽略規則或既有違規基準線；既有問題照實列入結果。依賴只在檢查時注入，不修改正式頁面或設計。

API 與結果欄位依據：[axe-core 官方文件](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)。

## GitHub Pages

預定公開網址：https://howard118008y-commits.github.io/spinprize-white-desert/

將此目錄的靜態檔部署到 GitHub Pages。資產使用相對路徑，無建置步驟；`.nojekyll` 保留原始靜態檔。若變更公開網址，請同步更新 `index.html` 內的 canonical、Open Graph 與 Twitter 圖片網址。

## 內容來源

- 公開公司資料、服務與五級含稅報價：https://howard118008y-commits.github.io/spinprize/ ，核對日期 2026-09-11。
- 作品連結：山遇民宿 https://shanyu2015.com 、鋮馨租賃 https://cx468.com.tw 、Go Shoot https://goshoot.com.tw 、線上一番賞平台 https://goshoot-ichiban.vercel.app 、台北建安宮 https://taipeijianantemple.com.tw 、永貞豆腐店 https://yongzhen-tofu.com.tw 。
- 圖片沿用既有公開官網素材，轉換為 WebP 降低傳輸量。出處見 `assets/CREDITS.md`。
- 電話與 Email 直接使用 `tel:`、`mailto:`；Email 連結開啟使用者郵件程式，網站不收集或儲存表單資料。
- 頁面所列 GA4 是建置方案包含項目，本展示頁並未加入 GA4 或其他追蹤程式。

## 版型來源與調整

以使用者選定的 Awwwards／White Desert 頁面截圖，透過開源工具 `abi/screenshot-to-code` 產生 HTML + Tailwind 第一版，保留其銀灰底、超大標題、寬幅深灰框主視覺、桌機雙欄作品格與留白節奏，再套入旋賞公開內容。

原版執行時 Tailwind CDN 已移除，其主要視覺本來即使用原生 CSS，現以 `assets/styles.css` 實作並補齊響應式版面、鍵盤焦點與手機選單。字型使用系統字型，無外部字型請求。原版的南極人物、旅遊文案、作者署名、獎項分數與無功能控制項均已移除；沒有保留原站商標、照片或獎項宣稱。本頁與 Awwwards、White Desert 或原設計作者無隸屬關係。

原始截圖、原始生成稿、對話內容與 API key 不屬公開網站檔案。

## 維護

- 文字、價格與 URL：`index.html`
- 視覺、桌機與手機版：`assets/styles.css`
- 手機選單：`assets/main.js`
- 公開素材出處：`assets/CREDITS.md`

維運、第三方服務與 API 費用請按頁面說明及實際專案約定確認。
