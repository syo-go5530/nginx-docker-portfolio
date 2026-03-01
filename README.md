# Portfolio Infrastructure  
Azure VM / Docker / Nginx / HTTPS / GitHub Actions CI/CD

本リポジトリは、ポートフォリオサイトを Azure VM 上の Docker + Nginx で運用し、GitHub Actions による自動デプロイと Let's Encrypt による HTTPS 化を実現した構成です。本番運用を想定したシンプルかつ再現性の高い構成を採用しています。

---

## 1. 概要

### 目的
- 独自ドメインで HTTPS 化されたポートフォリオサイトを公開する  
- Azure VM 上で Docker + Nginx による本番構成を構築する  
- GitHub Actions による自動デプロイパイプラインを整備する  
- インフラエンジニアとしての基礎スキルを証明する  

### 技術スタック
- Azure Virtual Machine（Ubuntu 22.04）
- Docker / Docker Compose
- Nginx（ホスト側 + コンテナ側）
- Let's Encrypt（Certbot）
- GitHub Actions（CI/CD）
- 独自ドメイン（お名前.com）

---

## 2. アーキテクチャ

GitHub → GitHub Actions → Azure VM → Docker (nginx:latest) → ホストNginx(443) → HTTPS公開

- GitHub に push すると Actions が Azure VM にデプロイ  
- Docker コンテナは 8080 番で稼働  
- ホスト側 Nginx が HTTPS を終端し、Docker にリバースプロキシ  
- Let's Encrypt により証明書を自動管理  

---

## 3. Azure 構築〜公開までの流れ

### 3-1. Azure VM の準備
- Ubuntu 22.04 LTS  
- NSG で 22 / 80 / 443 を許可  
- SSH キーでログイン  

### 3-2. Docker / Docker Compose のインストール

```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
```

### 3-3. GitHub Actions のデプロイ先
Actions は Azure VM の以下にデプロイ：

```
~/nginx-docker
```

### 3-4. Docker コンテナ構成

```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
      - ./conf:/etc/nginx/conf.d
    restart: always
```

### 3-5. ホスト側 Nginx のインストール

```bash
sudo apt install nginx -y
```

### 3-6. HTTPS（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d kamata-portfolio.com
```

### 3-7. ホスト側 Nginx の設定

```nginx
server {
    listen 80;
    server_name kamata-portfolio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name kamata-portfolio.com;

    ssl_certificate /etc/letsencrypt/live/kamata-portfolio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kamata-portfolio.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3-8. Docker 起動

```bash
cd ~/nginx-docker
docker compose up -d
```

### 3-9. 動作確認

```bash
docker ps
sudo systemctl status nginx
```

---

## 4. CI/CD（GitHub Actions）

- GitHub に push すると Azure VM に自動デプロイされる構成を採用  
- デプロイ先は `~/nginx-docker`  
- デプロイ後に Docker コンテナを自動再起動し、サイトが即時更新される  

---

## 5. トラブルシューティング（実際に発生した問題）

### 5-1. Nginx が起動しない  
原因：Docker の nginx が 80/443 を占有  
対応：Docker 停止 → systemctl で再起動

### 5-2. GitHub の index.html が反映されない  
原因：Actions のデプロイ先が `~/nginx-docker`  
対応：正しいディレクトリで Docker を起動

### 5-3. Docker コンテナが 0 個  
原因：プロジェクトフォルダが存在しない  
対応：Actions のログからデプロイ先を確認

---

## 6. 成果

- HTTPS 化された本番環境の構築  
- Docker + Nginx の本番構成  
- GitHub Actions による自動デプロイ  
- Azure VM の運用  
- DNS / NSG / 証明書管理  
- 実務レベルのトラブルシューティング経験  

本構成は、クラウド・コンテナ・Web サーバ・CI/CD を横断的に扱うため、インフラエンジニアとしての基礎スキルを証明する内容となっています。
a