# ユドナリウム

[ユドナリウム（Udonarium）](http://udon.webcrow.jp)は、Webアプリケーションとして構成された、ボードゲームオンラインセッション支援ツールです。

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/TK11235/udonarium/master/LICENSE)

[![Udonarium](docs/images/ss.jpg "スクリーンショット")](http://udon.webcrow.jp)

## 機能

- ルーム機能（WebRTCを利用したブラウザ間通信）
- マップ表示／マップマスク機能
- コマ／カード管理
- チャット送受信
- チャットパレット
- ダイスボット（[BCDice](https://github.com/torgtaitai/BCDice)を[Opal](http://opalrb.org/)でJavaScriptにトランスパイル）
- 画像ファイル共有
- BGM再生
- セーブデータ生成（ZIP形式）

ルーム管理、チャット送受信、ダイスボット、ファイル管理、データ保存。それら全てをサーバサイドの支援無しにブラウザ上で完結させることを目指しています。

## サーバへの設置

利用者自身がWebサーバを用意し、そのサーバにアプリケーションを設置して利用することができます。

リポジトリからダウンロードできるリリース版ファイル一式、または開発環境からビルドした成果物をWebサーバに配置してください。  
このアプリケーションはサーバーサイドの処理を持たないのでCGIやデータベースを準備する必要はありません。

唯一の準備として、外部サービスの[SkyWay](https://webrtc.ecl.ntt.com/)を利用するためのAPIキーが必要です。
APIキーの情報は`assets/config.yaml`に記述します。

***
__※重要※__  
__2017/9/7にSkyWay正式版が発表されました。__  
__正式版APIキーは以前のトライアル版APIキーとは別に扱われます。そのため、既にトライアル版APIキーを取得している場合でも、改めて正式版APIキーを取得する必要があります。__
***

後は、サーバに配置したアプリケーションの`index.html`にアクセスし、動作することを確認してみてください。

## 開発環境

[Node.js](https://nodejs.org/)と[npm](https://www.npmjs.com/)、および[Git](https://git-scm.com/)が必要です。

開発環境のインストール手順は[Angular日本ユーザーグループが作成したAngularのハンズオン教材](https://github.com/ng-japan/hands-on/tree/master/courses/tutorial)、または[Angular公式ページ](https://angular.io/)の[QuickStart](https://angular.io/guide/quickstart)が参考になります。

Windows環境でGitをインストールする場合、コマンドプロンプトからGitコマンドを実行可能に（インストーラーの画面で「Run Git from the Windows Command Prompt」を選択）することをお勧めします。

### Angular CLI

フロントエンドは[Angular](https://angular.io/)で実装されており、
CLIツールとして[Angular CLI](https://github.com/angular/angular-cli)を利用しています。

リポジトリのファイル一式をダウンロードした後の初回起動時のコマンドは以下の通りです。

```bash
cd ファイル一式のディレクトリの場所
npm install
ng serve
```

`ng serve`を実行すると`http://localhost:4200/`で開発用サーバが起動します。いずれかのソースファイルを変更すると、アプリケーションは自動的にリロードされます。

`ng build`でプロジェクトのビルドを実行します。ビルド成果物は`dist/`ディレクトリに格納されます。
`-prod`オプションを使用すると、本番環境向けビルドが生成されます。

### SkyWay

このアプリケーションは通信処理にWebRTCを使用しています。  
WebRTC向けのシグナリングサーバとして[SkyWay](https://webrtc.ecl.ntt.com/)を利用しているため、動作のためにはSkyWayのAPIキーが必要です。

取得したAPIキーの情報は`src/assets/config.yaml`に記述します。

## 今後の開発について

まだ未完成であり、作業すべき課題が残されています。

- v1.0に向けたリファクタリング、仕様の整理
- UIデザインおよび操作性の改善
- モバイル向け対応
- 機能追加
- ドキュメント整備

## License

MIT License
