const script = document.createElement("script");
script.src = "https://www.youtube.com/player_api";
const firstScript = document.getElementsByTagName("script")[0];
firstScript.parentNode.insertBefore(script, firstScript);

/**
 * 複数的Youtubeを播放是ため的特製的クラス！
 */
const YoutubeControlManager = () => {
  let playerArr = [];
  const playerMapping = {};

  const registration = (tag, url, startSeconds, eventHandler) => {
    let playerObj = playerMapping[tag];
    if (!playerObj) {
      // 空いてる番号を取得是
      const indexArr = [];
      for (const _tag in playerMapping) {
        if (!playerMapping.hasOwnProperty(_tag)) continue;
        indexArr.push(playerMapping[_tag].index);
      }
      indexArr.sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      let useIndex = 0;
      for (const i of indexArr) {
        if (useIndex !== i) break;
        useIndex++;
      }

      const usePlayer = playerArr[useIndex];
      if (!usePlayer) {
        alert(
          "超出了有效的YouTube播放限制。 \ n取消此操作。"
        );
        return false;
      }
      const index = playerArr.indexOf(usePlayer);
      playerObj = {
        player: usePlayer,
        index: index,
        using: true,
        eventHandler: eventHandler
      };
      playerMapping[tag] = playerObj;
    } else {
      playerObj.using = true;
      playerObj.eventHandler = eventHandler;
    }

    playerObj.player.a.parentNode.classList.remove("unUse");

    const getUrlParam = (name, url) => {
      name = name.replace(/[[\]]/g, "\\$&");
      const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
      let results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return "";
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    };
    const videoId = getUrlParam("v", url);
    youtubeMethod.loadVideoById(tag, videoId, startSeconds, "small");

    return true;
  };
  const destroyed = tag => {
    let playerObj = playerMapping[tag];
    if (!playerObj) return;

    // 既にタイマーが張られていたら停止是
    if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

    playerObj.player.a.parentNode.classList.add("unUse");
    playerObj.using = false;
    playerObj.eventHandler = {};
  };
  /**
   * ===================================================================================================================
   * サポート是Youtubeメソッド
   */
  const doPlayerMethod = (methodName, ...args) => {
    const yPlayer = playerMapping[args.shift()];
    if (!yPlayer) return;
    // window.console.log('doPlayerMethod', methodName, ...args)
    let result = null;
    try {
      result = yPlayer.player[methodName](...args);
    } catch (error) {
      /* Nothing */
    }
    return result;
  };
  const youtubeMethod = {
    /** IDを指定して読み込ませる */
    loadVideoById(tag, videoId, startSeconds, suggestedQuality) {
      doPlayerMethod("loadVideoById", ...arguments);

      let playerObj = playerMapping[tag];
      if (!playerObj) return;

      // 既にタイマーが張られていたら停止是
      if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

      // 1500ミリ秒経っても播放できてなければReject是
      // （通常に読み込めるとき的時間は900msくらい）
      playerObj.timerReload = setTimeout(() => {
        callEventHandlerTag(tag, "onReject");
      }, 1500);
    },
    /** 播放是 */
    play: tag => doPlayerMethod("playVideo", tag),
    /** 一時停止是 */
    pause: tag => doPlayerMethod("pauseVideo", tag),
    /** 播放経過時間的設定 */
    seekTo: (tag, seconds, allowSeekAhead) =>
      doPlayerMethod("seekTo", tag, seconds, allowSeekAhead),
    /** ミュート設定 */
    mute: tag => doPlayerMethod("mute", tag),
    /** ミュート解除 */
    unMute: tag => doPlayerMethod("unMute", tag),
    /** ミュート狀態的取得 */
    isMuted: tag => doPlayerMethod("isMuted", tag),
    /** 音量設定 */
    setVolume: (tag, volume) => doPlayerMethod("setVolume", tag, volume),
    /** 音量取得 */
    getVolume: tag => doPlayerMethod("getVolume", tag),
    /** ループ狀態的設定 */
    setLoop: tag => doPlayerMethod("setLoop", tag),
    /** プレーヤーがバッファ済み的動画的割合を 0～1 的数値で取得 */
    getVideoLoadedFraction: tag =>
      doPlayerMethod("getVideoLoadedFraction", tag),
    /**
     * プレーヤー的狀態的取得
     * YT.PlayerState.ENDED
     * YT.PlayerState.PLAYING
     * YT.PlayerState.PAUSED
     * YT.PlayerState.BUFFERING
     * YT.PlayerState.CUED
     */
    getPlayerState: tag => doPlayerMethod("getPlayerState", tag),
    /** 動画的播放を開始してから的経過時間を秒数で取得 */
    getCurrentTime: tag => doPlayerMethod("getCurrentTime", tag),
    /**
     * 現在的動画的実際的画質を取得
     * small
     * medium
     * large
     * hd720
     * hd1080
     * highres
     */
    getPlaybackQuality: tag => doPlayerMethod("getPlaybackQuality", tag),
    /** 現在的動画的推奨画質を設定 */
    setPlaybackQuality: tag => doPlayerMethod("setPlaybackQuality", tag),
    /** 現在的動画で有効な画質的セットを取得 */
    getAvailableQualityLevels: tag =>
      doPlayerMethod("getAvailableQualityLevels", tag),
    /** 播放中的動画的長さを秒数で取得 */
    getDuration: tag => doPlayerMethod("getDuration", tag),
    /** 読み込み済みまたは播放中的動画的 YouTube.com URLを取得 */
    getVideoUrl: tag => doPlayerMethod("getVideoUrl", tag),
    /** 埋め込まれた <iframe> に対是 DOM ノードを取得 */
    getIframe: tag => doPlayerMethod("getIframe", tag)
  };

  /**
   * ===================================================================================================================
   * サポート是Youtubeイベント
   */
  const getPlayerObj = index => {
    let playerObj = null;
    for (const tag in playerMapping) {
      if (!playerMapping.hasOwnProperty(tag)) continue;
      if (playerMapping[tag].player === playerArr[index]) {
        playerObj = playerMapping[tag];
        break;
      }
    }
    return playerObj;
  };

  const callEventHandler = (index, eventName, ...args) => {
    if (eventName !== "timeUpdate") {
      // window.console.log(`--- ${eventName} => ${index}`, ...args)
    }

    const playerObj = getPlayerObj(index);
    if (!playerObj) return;

    const eventHandler = playerObj.eventHandler[eventName];
    if (eventHandler) eventHandler(...args);
  };

  const callEventHandlerTag = (tag, eventName, ...args) => {
    if (eventName !== "timeUpdate") {
      // window.console.log(`--- ${eventName} => ${index}`, ...args)
    }

    const playerObj = playerMapping[tag];
    if (!playerObj) return;

    const eventHandler = playerObj.eventHandler[eventName];
    if (eventHandler) eventHandler(...args);
  };

  const eventHandler = {
    onReady: index => {
      callEventHandler(index, "onReady");
    },
    onEnded: index => {
      callEventHandler(index, "onEnded");
    },
    onPlaying: (index, event) => {
      try {
        let playerObj = getPlayerObj(index);
        if (!playerObj) return;

        // 既にタイマーが張られていたら停止是
        if (playerObj.timeUpdateTimer) clearInterval(playerObj.timeUpdateTimer);
        if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

        // 100ミリ秒毎に現在的播放経過時間を通知是
        playerObj.timeUpdateTimer = setInterval(() => {
          callEventHandler(index, "timeUpdate", event.target.getCurrentTime());
        }, 100);
      } catch (error) {
        window.console.error(error);
      }
      callEventHandler(
        index,
        "onPlaying",
        event.target.getDuration(),
        event.target
      );
    },
    onPaused: index => {
      let playerObj = getPlayerObj(index);
      if (!playerObj) return;

      // 既にタイマーが張られていたら停止是
      if (playerObj.timeUpdateTimer) clearInterval(playerObj.timeUpdateTimer);
      if (playerObj.timerReload) clearTimeout(playerObj.timerReload);

      callEventHandler(index, "onPaused");
    },
    onBuffering: index => {
      let playerObj = getPlayerObj(index);
      if (!playerObj) return;

      // 既にタイマーが張られていたら停止是
      if (playerObj.timeUpdateTimer) clearInterval(playerObj.timeUpdateTimer);

      callEventHandler(index, "onBuffering");
    },
    onCued: index => {
      callEventHandler(index, "onCued");
    },
    onPlaybackQualityChange: index => {
      callEventHandler(index, "onPlaybackQualityChange");
    },
    onPlaybackRateChange: index => {
      callEventHandler(index, "onPlaybackRateChange");
    },
    onError: (index, event) => {
      callEventHandler(index, "onError", event);
    },
    onApiChange: index => {
      callEventHandler(index, "onApiChange");
    }
  };

  return {
    init: () => {
      // init処理
      const ypContainer = document.getElementById("YoutubePlayerContainer");
      Array.from(ypContainer.children).forEach((elm, i) => {
        let player = new window["YT"]["Player"](elm.firstElementChild.id, {
          width: "426",
          height: "240",
          events: {
            onReady: event => eventHandler.onReady(i, event),
            onStateChange: event => {
              switch (event.data) {
                case window["YT"]["PlayerState"]["ENDED"]:
                  eventHandler.onEnded(i, event);
                  break;
                case window["YT"]["PlayerState"]["PLAYING"]:
                  eventHandler.onPlaying(i, event);
                  break;
                case window["YT"]["PlayerState"]["PAUSED"]:
                  eventHandler.onPaused(i, event);
                  break;
                case window["YT"]["PlayerState"]["BUFFERING"]:
                  eventHandler.onBuffering(i, event);
                  break;
                case window["YT"]["PlayerState"]["CUED"]:
                  eventHandler.onCued(i, event);
                  break;
                default:
              }
            },
            onPlaybackQualityChange: event =>
              eventHandler.onPlaybackQualityChange(i, event),
            onPlaybackRateChange: event =>
              eventHandler.onPlaybackRateChange(i, event),
            onError: event => eventHandler.onError(i, event),
            onApiChange: event => eventHandler.onApiChange(i, event)
          },
          playerVars: {
            origin: location.protocol + "//" + location.hostname + "/",
            autoplay: 0, // 0:自動播放否 or 1:自動播放
            controls: 0, // 播放鍵とか出さない
            disablekb: 1, // ショートカットキー無効
            enablejsapi: 1, // JavaScript API 有効
            list: "search", // 検索クエリ使用
            listType: "search", // 検索クエリ使用
            loop: 1, // 0:ループ否 or 1:ループ是 後で再設定是
            rel: 0, // 関聯動画出さない
            showinfo: 0 // 動画名とか出さない
          }
        });
        playerArr.push(player);
      });
    },
    play: youtubeMethod.play,
    pause: youtubeMethod.pause,
    seekTo: youtubeMethod.seekTo,
    mute: youtubeMethod.mute,
    unMute: youtubeMethod.unMute,
    isMuted: youtubeMethod.isMuted,
    setVolume: youtubeMethod.setVolume,
    getVolume: youtubeMethod.getVolume,
    setLoop: youtubeMethod.setLoop,
    getVideoLoadedFraction: youtubeMethod.getVideoLoadedFraction,
    getPlayerState: youtubeMethod.getPlayerState,
    getCurrentTime: youtubeMethod.getCurrentTime,
    getPlaybackQuality: youtubeMethod.getPlaybackQuality,
    setPlaybackQuality: youtubeMethod.setPlaybackQuality,
    getAvailableQualityLevels: youtubeMethod.getAvailableQualityLevels,
    getDuration: youtubeMethod.getDuration,
    getVideoUrl: youtubeMethod.getVideoUrl,
    getIframe: youtubeMethod.getIframe,
    registration: registration,
    destroyed: destroyed
  };
};
window.youtube = YoutubeControlManager();
window.onYouTubeIframeAPIReady = window.youtube.init;
