---
# 学習ログ全体構成図
---

## 1. システム全体構成図

```mermaid
graph TB
    subgraph DEV["👨‍💻 開発者（VS Code）"]
        VSCODE["VS Code\nRemote SSH / ローカル編集"]
    end

    subgraph AZURE["☁️ Azure VM（学習環境）"]
        SSH["🔑 SSH接続\n（キーペア認証）"]
        subgraph DOCKER["🐳 Docker"]
            DC["docker-compose.yml\nports: 8080:80"]
            NGINX["📦 Nginxコンテナ\nlisten: 80"]
            HTML["📁 html/index.html\n（volumes マウント）"]
            CONF["📁 conf/default.conf\n（volumes マウント）"]
        end
    end

    subgraph GITHUB["☁️ GitHub（本番環境）"]
        REPO["📂 my-portfolio\nリポジトリ"]
        PAGES["🌍 GitHub Pages\nhttps://ユーザー名.github.io/"]
    end

    VSCODE -->|"SSH接続"| SSH
    SSH --> DOCKER
    VSCODE -->|"git push"| REPO
    REPO -->|"自動デプロイ\n（HTTPS自動適用）"| PAGES

    BROWSER1["🌐 ブラウザ（学習確認）"] -->|"http://localhost:8080"| DC
    DC -->|"ポートマッピング 8080→80"| NGINX
    NGINX -->|"root設定で参照"| HTML
    NGINX -->|"設定読み込み"| CONF

    BROWSER2["🌐 ブラウザ（外部公開）"] -->|"https://..."| PAGES
```

---

## 2. トラブル① ポート競合の解決フロー

```mermaid
flowchart TD
    A["🚀 docker compose up -d 実行"] --> B{"80番ポートは\n空いているか？"}
    B -->|"❌ 競合（VMが占有中）"| C["Error: port is already allocated"]
    B -->|"✅ 空いている"| G["正常起動"]

    C --> D["原因調査\nss -tlnp で確認"]
    D --> E["docker-compose.yml を編集\n&quot;80:80&quot; → &quot;8080:80&quot;"]
    E --> F["docker compose up -d 再実行"]
    F --> G

    G --> H["ブラウザで\nhttp://localhost:8080 にアクセス"]

    style C fill:#fee2e2,stroke:#dc2626
    style G fill:#dcfce7,stroke:#16a34a
    style H fill:#dbeafe,stroke:#2563eb
```

---

## 3. トラブル② HTMLが表示されない問題の解決フロー

```mermaid
flowchart TD
    A["🌐 ブラウザでアクセス"] --> B{"HTMLは\n表示されたか？"}
    B -->|"❌ 404 / 空白"| C["Nginxがファイルを見つけられない"]
    B -->|"✅ 表示された"| Z["✅ 完了"]

    C --> D["原因調査"]
    D --> D1["default.conf の\nroot パスを確認"]
    D --> D2["docker-compose.yml の\nvolumes パスを確認"]

    D1 --> E{"パスは\n一致しているか？"}
    D2 --> E

    E -->|"❌ ズレている"| F["パスを修正\nvolumes / root を揃える"]
    E -->|"✅ 一致"| G["コンテナ再起動\ndocker restart nginx"]

    F --> H["docker compose down && up -d"]
    H --> B
    G --> B

    style C fill:#fee2e2,stroke:#dc2626
    style Z fill:#dcfce7,stroke:#16a34a
```

---

## 4. トラブル③ 404エラーが正しく返らない（try_files 設定漏れ）

```mermaid
flowchart TD
    A["🌐 存在しないURLにアクセス"] --> B{"404エラーは\n正しく返ったか？"}
    B -->|"❌ 返らない・挙動が不定"| C["default.conf を確認"]
    B -->|"✅ 正しく返った"| Z["✅ 完了"]

    C --> D{"location ブロックに\ntry_files はあるか？"}
    D -->|"❌ 記述なし"| E["try_files $uri $uri/ =404 を追加"]
    D -->|"✅ ある"| F["末尾に =404 があるか確認"]

    E --> G["docker restart nginx\n設定を再読み込み"]
    F --> G
    G --> B

    style C fill:#fff7ed,stroke:#ea580c
    style Z fill:#dcfce7,stroke:#16a34a
    style E fill:#fef9c3,stroke:#ca8a04
```

---

## 5. デプロイ・公開フロー

```mermaid
sequenceDiagram
    participant Dev as 👨‍💻 開発者
    participant VSCode as 💻 VS Code
    participant Docker as 📦 Docker/Nginx
    participant GitHub as 📂 GitHub
    participant Pages as 🌍 GitHub Pages

    Dev->>VSCode: index.html / style.css / script.js を作成
    Dev->>Docker: docker compose up -d
    Docker-->>VSCode: localhost:8080 で確認可能
    VSCode-->>Dev: ブラウザで動作確認（学習環境）

    Note over Dev,Docker: ✅ ローカル確認 OK

    Dev->>GitHub: git add / commit / push
    GitHub->>Pages: 自動デプロイ（数十秒）
    Pages-->>Dev: HTTPS で公開完了

    Note over GitHub,Pages: ✅ 本番公開 OK
```

---

## 6. 学習ロードマップ

```mermaid
timeline
    title インフラ学習の流れ
    section Azure VM 構築
        クラウド環境の準備  : Azure Portal で Linux VM 作成
                           : SSH キーペアを生成
                           : VS Code Remote SSH で接続
                           : VM 内に Docker をインストール
    section Docker 環境構築
        コンテナの立ち上げ  : docker-compose.yml を作成
                           : default.conf を作成
                           : volumes でホストファイルを反映
                           : docker compose up -d で起動
                           : localhost:8080 で動作確認
    section トラブル解決
        エラー対応          : 80番ポート競合 → 8080に変更
                           : HTMLパスのズレ → volumes修正
                           : try_files 漏れ → 404が正常化
    section Nginx 設定理解
        Webサーバーの仕組み : root / index / location の理解
                           : try_files の動作確認
                           : セキュリティヘッダーの設定
    section 本番公開
        GitHub Pages        : my-portfolio リポジトリを作成
                           : index.html / style.css / script.js を作成
                           : GitHub Pages 設定（main / root）
                           : HTTPS の自動適用を確認
    section 今後の課題
        発展学習            : HTTPS詳細（Let's Encrypt）
                           : GitHub Actions（CI/CD）
                           : Nginxリバースプロキシ
```
