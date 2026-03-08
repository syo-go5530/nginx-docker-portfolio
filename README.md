# ポートフォリオサイト

本リポジトリは、HTML / CSS / JavaScript を用いて作成した  
静的ポートフォリオサイトを GitHub Pages 上で公開する構成です。

私の学習記録をシンプルかつ安全に閲覧できるよう設計しています。

---

## 使用している主な技術

- HTML  
- CSS  
- JavaScript  
- GitHub Pages（静的ホスティング）  
- Git / GitHub  

※ ローカル開発では Docker + Nginx を使用しましたが、本番公開では使用していません。

---

## プロジェクトの概要

- 自己紹介・スキル・制作物をまとめた静的ポートフォリオサイト  
- スマホ・タブレット対応（レスポンシブデザイン）  
- GitHub Pages による安定したホスティング  
- シンプルで読みやすい UI を意識した構成  

---

## ディレクトリ構成

```
my-portfolio/
├── index.html
├── style.css
├── script.js
```

---

## 開発環境の構築方法

- ローカルでは Docker + Nginx を使用して動作確認  
- 本番環境は GitHub Pages のため追加セットアップ不要  
- main ブランチに push すると自動で公開されます  

---

## 公開方法（GitHub Pages）

- GitHub リポジトリ → Settings → Pages  
- Source: Deploy from a branch  
- Branch: main  
- Folder: /(root)  
- HTTPS は GitHub Pages により自動適用  

---

---

## 補足

Azure VM / Docker / Nginx / GitHub Actions / CI/CD などの  
インフラ構築・自動デプロイの学習内容は **本番公開には使用していません**。

これらの技術的な取り組みは、別途まとめた  
技術学習ログに記載しています。
