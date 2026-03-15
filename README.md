# インフラ学習ログ

> Azure / Docker / Nginx / GitHub Pages  
> ポートフォリオサイト構築を通じて学んだこと

---

## プロジェクト概要

このプロジェクトは「ポートフォリオをブラウザで表示させる」という目標のもと、  
**クラウド・コンテナ・Webサーバー・デプロイ** という4つの技術領域を実践的に体験したものです。

| 環境 | 構成技術 | 目的 |
|------|----------|------|
| 学習環境 | Docker + Nginx（ローカル / Azure VM） | Webサーバーの仕組みを理解する |
| 本番環境 | GitHub Pages | 静的サイトをHTTPSで安全に公開する |

---

## 使用技術と各技術の役割

### ① Azure VM（仮想マシン）

**役割：** クラウド上に自分専用のLinuxサーバーを用意する

**実施した手順：**

1. Azure Portal で Linux VM を作成
2. SSH キーペアを生成し、秘密鍵をローカルに保存
3. VS Code の Remote SSH 拡張機能で VM に接続
4. VM 内に Docker をインストール
5. Nginx コンテナを起動して `index.html` を配信できる状態にした

**学んだこと：**
- Azure Portal の操作（VM作成・設定）
- SSH キーによる安全なリモート接続の仕組み
- VS Code Remote SSH を使ったクラウドサーバー上での開発方法
- ローカルPCとクラウドサーバーの環境の違い

### ② Docker / Docker Compose

**役割：** Nginxを「コンテナ」という独立した箱の中で動かす

**実施した手順：**

1. `docker-compose.yml` を作成
2. `conf/default.conf` を作成（Nginxの設定ファイル）
3. volumes を使ってホスト側（自分のPC）のファイルをコンテナ内に反映
4. `docker compose up -d` でバックグラウンド起動
5. `http://localhost:8080` で動作確認

```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "8080:80"        # PC側の8080番 → コンテナの80番に転送（80番競合のため8080を使用）
    volumes:
      - ./html:/usr/share/nginx/html   # htmlフォルダをコンテナ内と同期
      - ./conf:/etc/nginx/conf.d       # 設定ファイルも同様に同期
    restart: always      # 落ちたら自動で再起動
```

**学んだこと：**
- コンテナという概念（独立した実行環境）
- ポートマッピングの仕組み（外部ポート:内部ポート）
- volumes によるホスト-コンテナ間のファイル共有
- `restart: always` による自動復旧の設定

### ③ Nginx（Webサーバー）

**役割：** HTMLファイルをブラウザに届けるWebサーバー

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;   # HTMLファイルの置き場所
    index index.html;

    location / {
        try_files $uri $uri/ =404;
        # アクセスされたURLのファイルを探す → なければ404
    }

    add_header X-Frame-Options DENY;              # iframe埋め込みを禁止
    add_header X-Content-Type-Options nosniff;    # ファイル種別の偽装を防ぐ
    add_header X-XSS-Protection "1; mode=block";  # XSS攻撃をブロック
}
```

**学んだこと：**
- `root` 設定でNginxがファイルを探す場所を指定できること
- `try_files` の動作（順番にファイルを探し、なければ404）
- セキュリティヘッダーの種類と各ヘッダーが防ぐ攻撃の種類

### ④ GitHub Pages

**役割：** GitHubが無料で提供するWebホスティング

**実施した手順：**

1. GitHub に `my-portfolio` リポジトリを作成
2. VS Code でローカルにクローン
3. `index.html` / `style.css` / `script.js` を作成
4. `README.md` を追加
5. GitHub Pages の設定（ブランチ: `main` / フォルダ: root）
6. 公開 URL を確認し、ブラウザで動作確認

```
git push → GitHubが自動ビルド → https://ユーザー名.github.io/ で公開
```

**学んだこと：**
- 静的サイトの公開方法
- git push によるデプロイ（CI/CDの入り口）
- HTTPSが自動で適用される仕組みの存在

---

## 実際に詰まったこと・解決策

> ここが最も重要な学習記録です。エラーと向き合い、解決した経験は実務でも直接活かせるスキルです。

### トラブル① 80番ポートの競合エラー

| | 内容 |
|---|---|
| **状況** | DockerでNginxを起動しようとしたが、Azure VMですでに80番ポートが使われていてエラーが発生した |
| **原因** | VMのOS側が80番を占有していた。1つのポートは1つのプロセスしか使えないため競合が発生する |
| **解決** | `docker-compose.yml` のポートマッピングを `"80:80"` から `"8080:80"` に変更し競合を回避した |

**このトラブルで理解したこと：**
- ポート番号はサービスの「入口」。同じ番号を2つのサービスは使えない
- HTTP=80番、HTTPS=443番という基本的なポート割り当ての知識
- 8080など別番号へ変更することで競合を回避できること
- `ss -tlnp` コマンドでポートの使用状況を確認できること
- ⚠️ 8080は開発・テスト用途。本番でAzure VMを外部公開する場合はNSG（ネットワークセキュリティグループ）の設定も必要

### トラブル② HTMLファイルの格納場所とNginxのrootパスのズレ

| | 内容 |
|---|---|
| **状況** | ブラウザでアクセスしてもHTMLが表示されなかった（404エラーまたは空白） |
| **原因** | Nginxの `root` 設定が指しているパスと、実際にHTMLを置いた場所が一致していなかった |
| **解決** | `docker-compose.yml` の volumes でHTMLフォルダのパスを正しく指定し直した |

**このトラブルで理解したこと：**
- Nginxは `root` で指定したディレクトリ以下しかファイルを探しに行かない
- Docker の volumes は「ホスト側のパス:コンテナ内のパス」の対応関係を定義するもの
- パスがずれると、コンテナ内のNginxはHTMLファイルの存在を認識できない

### トラブル③ 404エラーが正しく返らない（try_files の設定漏れ）

| | 内容 |
|---|---|
| **状況** | 存在しないURLにアクセスしても、404エラーページが正しく返されなかった |
| **原因** | `default.conf` の `location` ブロックに `try_files` の記述がなかった。Nginxはデフォルトではファイルが見つからない場合の動作が不定になる |
| **解決** | `location /` ブロック内に `try_files $uri $uri/ =404;` を追加した |

```nginx
# 修正前（try_files なし）
location / {
    # 何も書いていない → ファイルが無くても404が返らない
}

# 修正後
location / {
    try_files $uri $uri/ =404;
    # $uri        → アクセスされたパスのファイルを探す
    # $uri/       → ディレクトリとして探す
    # =404        → どちらも無ければ404を返す
}
```

**このトラブルで理解したこと：**
- `try_files` はNginxが「どの順番でファイルを探し、見つからなければ何をするか」を定義するディレクティブ
- 記述がないとNginxの挙動が意図しない動作になる可能性がある
- 設定ファイルは「書いていないこと＝デフォルト動作に任せる」であり、意図を明示的に書くことが重要

---

### 本番公開用（my-portfolio）

```
my-portfolio/
├── index.html      # ポートフォリオ本体のHTML
├── style.css       # デザイン・レイアウト
├── script.js       # 表示するリポジトリの制御
└── README.md
```

### 学習用（nginx-docker-portfolio）

```
nginx-docker-portfolio/
├── docker-compose.yml    # Dockerの設定（何をどう動かすか）
├── conf/
│   └── default.conf      # Nginxの設定（どこのファイルを返すか）
├── html/
│   └── index.html        # Nginxが配信するHTML
└── README.md
```

---

## 環境構築手順

### Step 1　リポジトリをクローン

```bash
git clone https://github.com/ユーザー名/nginx-docker-portfolio.git
cd nginx-docker-portfolio
```

### Step 2　コンテナを起動

```bash
docker compose up -d
```

### Step 3　ブラウザで確認

```
http://localhost:8080
```

### よく使うコマンド

```bash
# Docker
docker compose up -d        # バックグラウンドで起動
docker compose down         # コンテナを停止・削除
docker exec -it nginx bash  # コンテナ内に入る
docker restart nginx        # コンテナを再起動

# Git
git add .
git commit -m "update"
git push
```

---

## トラブルシューティング

| 症状 | 確認箇所 |
|------|----------|
| ページが表示されない | `default.conf` の `root` パスと volumes のパスが一致しているか確認 |
| 404エラーが正しく返らない | `location /` ブロックに `try_files $uri $uri/ =404;` があるか確認 |
| CSS / JS が反映されない | ブラウザキャッシュを削除 / 相対パスを確認 |
| GitHub Pages が更新されない | `main` ブランチ・root の設定を確認 / 数十秒待つ |
| ポートエラー | `ss -tlnp` で使用中のポートを確認し、別ポートに変更 |

---

## 学習全体の振り返り

| 技術領域 | 理解できたこと |
|----------|---------------|
| クラウド（Azure） | VMとはクラウド上の仮想PC。SSHで接続してサーバー操作できる |
| コンテナ（Docker） | アプリを隔離された環境で動かす仕組み。環境の再現性が高い |
| Webサーバー（Nginx） | rootとlocationの設定でリクエストとファイルを対応づける方法 |
| ポート | サービスの入口番号。競合が起きる理由と回避方法を理解 |
| デプロイ（GitHub Pages） | git pushで自動公開される仕組み。CI/CDの概念の入り口 |
| セキュリティ | HTTPSの必要性、セキュリティヘッダーの役割（XSS・クリックジャッキング対策） |

### 今後の課題・発展学習

- [ ] HTTPS化の詳細（SSL証明書の仕組み・Let's Encrypt）
- [ ] CI/CDパイプラインの構築（GitHub Actions）
- [ ] Nginxのリバースプロキシ設定
- [ ] Dockerネットワークの理解（複数コンテナ間の通信）
- [ ] Azure上での本番運用（ファイアウォール・NSG設定）
