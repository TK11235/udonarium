/* Generated by Opal 0.11.4 */
(function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy;

  Opal.add_stubs(['$setPrefixes', '$===', '$to_i', '$last_match', '$challenge', '$getStructureEncounter', '$times', '$roll', '$==', '$+', '$<<', '$join', '$getSuccessText', '$>=', '$first', '$last', '$get_table_by_number', '$debug', '$nil?', '$get_table_by_1d6', '$getPersonTable1', '$lambda', '$getPersonTable2', '$getPersonTable', '$getPersonTable3', '$getPersonTable4', '$getD66', '$bcdice']);
  return (function($base, $super, $parent_nesting) {
    function $WitchQuest(){};
    var self = $WitchQuest = $klass($base, $super, 'WitchQuest', $WitchQuest);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_WitchQuest_gameName_1, TMP_WitchQuest_gameType_2, TMP_WitchQuest_getHelpMessage_3, TMP_WitchQuest_changeText_4, TMP_WitchQuest_rollDiceCommand_5, TMP_WitchQuest_challenge_7, TMP_WitchQuest_getSuccessText_8, TMP_WitchQuest_getStructureEncounter_9, TMP_WitchQuest_getPersonTable1_11, TMP_WitchQuest_getPersonTable2_13, TMP_WitchQuest_getPersonTable3_15, TMP_WitchQuest_getPersonTable4_16, TMP_WitchQuest_getPersonTable_17;

    
    self.$setPrefixes(["WQ\\d+", "SET\\d+"]);
    
    Opal.defn(self, '$gameName', TMP_WitchQuest_gameName_1 = function $$gameName() {
      var self = this;

      return "ウィッチクエスト"
    }, TMP_WitchQuest_gameName_1.$$arity = 0);
    
    Opal.defn(self, '$gameType', TMP_WitchQuest_gameType_2 = function $$gameType() {
      var self = this;

      return "WitchQuest"
    }, TMP_WitchQuest_gameType_2.$$arity = 0);
    
    Opal.defn(self, '$getHelpMessage', TMP_WitchQuest_getHelpMessage_3 = function $$getHelpMessage() {
      var self = this;

      return "" + "・チャレンジ(成功判定)(WQn)\n" + "　n回2d6ダイスを振って判定を行います。\n" + "　例）WQ3\n" + "・SET（ストラクチャーカードの遭遇表(SETn)\n" + "　ストラクチャーカードの番号(n)の遭遇表結果を得ます。\n" + "　例）SET1　SET48\n"
    }, TMP_WitchQuest_getHelpMessage_3.$$arity = 0);
    
    Opal.defn(self, '$changeText', TMP_WitchQuest_changeText_4 = function $$changeText(string) {
      var self = this;

      return string
    }, TMP_WitchQuest_changeText_4.$$arity = 1);
    
    Opal.defn(self, '$rollDiceCommand', TMP_WitchQuest_rollDiceCommand_5 = function $$rollDiceCommand(command) {
      var self = this, $case = nil, number = nil;

      
      $case = command;
      if (/WQ(\d+)/['$===']($case)) {
      number = Opal.const_get_relative($nesting, 'Regexp').$last_match(1).$to_i();
      return self.$challenge(number);}
      else if (/SET(\d+)/['$===']($case)) {
      number = Opal.const_get_relative($nesting, 'Regexp').$last_match(1).$to_i();
      return self.$getStructureEncounter(number);};
      return nil;
    }, TMP_WitchQuest_rollDiceCommand_5.$$arity = 1);
    
    Opal.defn(self, '$challenge', TMP_WitchQuest_challenge_7 = function $$challenge(number) {
      var TMP_6, self = this, success = nil, results = nil, successText = nil;

      
      success = 0;
      results = [];
      $send(number, 'times', [], (TMP_6 = function(){var self = TMP_6.$$s || this, $a, $b, value1 = nil, value2 = nil;

      
        $b = self.$roll(1, 6), $a = Opal.to_ary($b), (value1 = ($a[0] == null ? nil : $a[0])), $b;
        $b = self.$roll(1, 6), $a = Opal.to_ary($b), (value2 = ($a[0] == null ? nil : $a[0])), $b;
        if (value1['$=='](value2)) {
          success = $rb_plus(success, 1)};
        return results['$<<']("" + (value1) + "," + (value2));}, TMP_6.$$s = self, TMP_6.$$arity = 0, TMP_6));
      successText = $rb_plus("" + "(" + (results.$join(" / ")) + ") ＞ ", self.$getSuccessText(success));
      return successText;
    }, TMP_WitchQuest_challenge_7.$$arity = 1);
    
    Opal.defn(self, '$getSuccessText', TMP_WitchQuest_getSuccessText_8 = function $$getSuccessText(success) {
      var self = this, table = nil;

      
      table = [[0, "失敗"], [1, "１レベル成功(成功)"], [2, "２レベル成功(大成功)"], [3, "３レベル成功(奇跡的大成功)"], [4, "４レベル成功(歴史的大成功)"], [5, "５レベル成功(伝説的大成功)"], [6, "６レベル成功(神話的大成功)"]];
      if ($truthy($rb_ge(success, table.$last().$first()))) {
        return table.$last().$last()};
      return self.$get_table_by_number(success, table);
    }, TMP_WitchQuest_getSuccessText_8.$$arity = 1);
    
    Opal.defn(self, '$getStructureEncounter', TMP_WitchQuest_getStructureEncounter_9 = function $$getStructureEncounter(number) {
      var $a, $b, self = this, tables = nil, table = nil, text = nil, index = nil, person = nil;

      
      self.$debug("getStructureEncounter number", number);
      tables = [[1, ["船から降りてきた", "魚を売っている", "仕事で忙しそうな", "異国から来た", "おもしろおかしい", "汗水流している"]], [2, ["おかしな格好をした", "歌を歌っている", "ステキな笑顔をした", "日なたぼっこをしている", "悩んでいる", "旅をしている"]], [3, ["待ちぼうけをしている", "壁に登っている", "タバコを吸っている", "踊りを踊っている", "幸せそうな", "向こうから走ってくる"]], [4, ["見張りをしている", "しゃべれない", "見張りをしている", "一輪車に乗った", "元気いっぱいの", "真面目な"]], [5, ["ウソつきな", "買い物をしている", "ギターを弾いている", "あなたのほうをじっと見ている", "ポップコーンを売っている", "屋台を出している"]], [6, ["子供を探している", "時計を直している", "物乞いをしている", "気象実験をしている", "飛び降りようとしている", "時間をきにしている"]], [7, ["目の見えない", "金持ちそうな", "一人歩きをしたことがない", "ふられてしまった", "待ち合わせをしている", "道に迷った"]], [8, ["お祈りをしている", "スケッチをしている", "勉強熱心な", "記念碑を壊そうとしている", "大きな声で文句をいっている", "記念撮影している"]], [9, ["隠れている", "はしごに登っている", "鐘を鳴らしている", "共通語の通じない", "記憶を失った", "あなたのほうにバタッと倒れた"]], [10, ["暇そうな", "笑ったことがない", "ぶくぶくと太った", "後継者を探している", "王様におつかえしている", "愛国心旺盛な"]], [11, ["閉じ込められた", "悲しそうな", "怒っている", "降りれなくなっている", "もの憂げな", "飛ぼうとしている"]], [12, ["釣りをしている", "泳いでいる", "川に物を落としてしまった", "砂金を掘っている", "川にゴミを捨てている", "カエルに化かされてしまった"]], [13, ["世間話をしている", "結婚を薦めたがる", "いやらしい話の好きな", "選択をしている", "水を汲んでいる", "井戸に落ちてしまった"]], [14, ["人におごりたがる", "踊り子をしている", "賭けをしている", "泣き上戸な", "飲み比べをしている", "自慢話をしている"]], [15, ["素朴そうな", "田舎者の", "あなたをだまそうとしている", "ケンカをしている", "泊まるお金のない", "あなたに依頼をしにきた"]], [16, ["悪い占いの結果しか言わない", "あなたに嫉妬している", "魅惑的な", "おしつけがましい", "いいかげんな占いしかしない", "変わった占いをしている"]], [17, ["かくれんぼをしている", "あまやどりをしている", "(ここにはだれもいません)", "家の掃除をしている", "取り壊しをしようとしている", "昔ここに住んでいた"]], [18, ["畑を耕している", "畑を荒らしている", "畑泥棒の", "収穫している", "日焼けして真っ黒な", "嫁いできた(婿にきた)"]], [19, ["粉をひいている", "馬に乗って風車に突進している", "風が吹かなくて困っている", "寝ている", "筋骨りゅうりゅうな", "遊んでいる"]], [20, ["パーティーをしている", "酔っ払っている", "酒を仕込んでいる", "即売会をしている", "笑っている", "太った"]], [21, ["ひとりたたずむ", "花から生まれた", "花が大好きな", "花粉症の", "花を買いにきた", "ラグビーをやって花をあらしてる"]], [22, ["几帳面な", "眼鏡をかけた", "なまいきな", "なわとびをしている", "困っている", "ませている"]], [23, ["本を読んでいる", "世間話をしたがる", "派手な格好をした", "勉強熱心な", "うるさい", "魔女のことについて調べている"]], [24, ["神父さんに相談をしている", "結婚式を挙げている", "物静かな", "片足の無い", "熱い視線を送ってくる", "挑発してくる"]], [25, ["頑固な", "刀の切れ味をためしたがる", "いいかげんな性格の", "スグに弟子にしたがる", "見せの前でウロウロしている", "道を尋ねている"]], [26, ["不機嫌な", "客の意見を聞かない", "物を売らない", "不幸な気前のいい", "発明家の"]], [27, ["恋人にプレゼントを探している", "香り中毒になった", "客に手伝わせる", "おまじないの好きな", "人好きのする", "いじめっこな"]], [28, ["騒がしい", "お菓子を食べて涙を流している", "笑いの止まらない", "甘い物に目がない", "別れ話をしている", "あなたをお茶に誘う"]], [29, ["フランスパンを盗んで走る", "しらけた顔をした", "店番をする", "あなたをバイトで使いたがる", "変なパンしか作らない", "朝が苦手な"]], [30, ["偏屈な", "威勢のいい", "ケンカっぱやい", "野次馬根性の強い", "肉が食べれない", "心優しく気前がいい"]], [31, ["夫婦ケンカをしている", "猫に魚を盗られた", "助けを求めている", "魚の種類がわからない", "『おいしい』としかいわない", "あやしい"]], [32, ["ヤンキー風の", "自分がかっこいいと思っている", "力自慢の", "元は王様だといいはる", "魔女のファンだという", "子沢山の"]], [33, ["わがままな", "かっこいい", "独り言を言っている", "変わった料理しかださない", "目茶苦茶辛い料理を食べている", "デートをしている"]], [34, ["仮病を使っている", "不治の病を持った", "”おめでた”の", "フケた顔した", "髪の毛を染めた", "(健康でも)病名をいいたがる"]], [35, ["実験をしたがる", "精力をつけたがっている", "惚れ薬を探している", "薬づけになっている", "この町まで薬を売りに来た", "睡眠薬で自殺をしようとしている"]], [36, ["服まで質に入れた", "値段にケチをつけている", "疲れている", "子供を質に入れようとしている", "涙もろい", "人間不信な"]], [37, ["着飾った", "おねだりしている", "退屈そうな", "見栄っぱりな", "高いものを薦める", "宝石など買うつもりのない"]], [38, ["だだをこねている", "ぬいぐるみを抱いている", "あなたを侵略者と考えている", "あなたの”おしり”にさわる", "幸せのおもちゃを売っている", "あなたを自分の子と間違えている"]], [39, ["人の話を聞かない", "気分屋な", "カリアゲしかできない", "うわさ話の好きな", "自動販売機を開発したという", "おせっかいな"]], [40, ["お風呂あがりの", "こきつかわれている", "シェイプアップしている", "人から追われている", "人の体をじろじろと見る", "この町を案内してほしいという"]], [41, ["サングラスをかけた", "みんな自分のファンと思っている", "あなたを役者と勘違いしている", "あなたはスターになれるという", "手品をしている", "『いそがしい』をいい続けている"]], [42, ["ギャンブルをしている", "競技に出場している", "全財産を賭けている", "勇敢な", "参加者を募っている", "情けない競技(闘技)をしてる"]], [43, ["ダンスを踊っている", "ブレイクダンスをして場違いな", "子供を背中におんぶしている", "あなたと踊りたがる", "踊ったことのない", "食べることに夢中な"]], [44, ["２階からお金をばらまいている", "窓の奥で涙をながしている", "窓から忍びこもう", "ピアノを弾いている", "ここに住んでいる", "家に招待したがる"]], [45, ["馬にブラシをかけている", "気性の激しい", "騎手を探している", "馬と話ができる", "馬の生まれ変わりという", "馬を安楽死させようか迷っている"]], [46, ["いたずら好きな", "ライバル意識の強い", "魔法の下手な", "魔法を信じない", "自分を神と思っている", "魔法を使って人を化かしたがる"]], [47, ["傷だらけな", "両手に宝物を持った", "かわいい", "地図を見ながら出てきている", "剣を持った", "ダンジョンの主といわれる"]], [48, ["墓参りをしている", "耳の遠い", "死んでしまった", "葬式をしている", "きもだめしをしている", "墓守をしている"]]];
      table = self.$get_table_by_number(number, tables, nil);
      if ($truthy(table['$nil?']())) {
        return nil};
      $b = self.$get_table_by_1d6(table), $a = Opal.to_ary($b), (text = ($a[0] == null ? nil : $a[0])), (index = ($a[1] == null ? nil : $a[1])), $b;
      person = self.$getPersonTable1();
      return "" + "SET" + (number) + " ＞ " + (index) + ":" + (text) + (person);
    }, TMP_WitchQuest_getStructureEncounter_9.$$arity = 1);
    
    Opal.defn(self, '$getPersonTable1', TMP_WitchQuest_getPersonTable1_11 = function $$getPersonTable1() {
      var TMP_10, self = this, gotoNextTable = nil, table = nil;

      
      gotoNextTable = $send(self, 'lambda', [], (TMP_10 = function(){var self = TMP_10.$$s || this;

      return $rb_plus("表２へ", self.$getPersonTable2())}, TMP_10.$$s = self, TMP_10.$$arity = 0, TMP_10));
      table = [[11, "おじさん"], [12, "おばさん"], [13, "おじいさん"], [14, "おばあさん"], [15, "男の子"], [16, "女の子"], [22, "美少女"], [23, "美少年"], [24, "青年"], [25, "少年"], [26, "男女(カップル)"], [33, "新婚さん"], [34, "お兄さん"], [35, "お姉さん"], [36, "店主(お店の人)"], [44, "王様"], [45, "衛兵"], [46, "魔女"], [55, "お姫様"], [56, gotoNextTable], [66, gotoNextTable]];
      return self.$getPersonTable(table);
    }, TMP_WitchQuest_getPersonTable1_11.$$arity = 0);
    
    Opal.defn(self, '$getPersonTable2', TMP_WitchQuest_getPersonTable2_13 = function $$getPersonTable2() {
      var TMP_12, self = this, gotoNextTable = nil, table = nil;

      
      gotoNextTable = $send(self, 'lambda', [], (TMP_12 = function(){var self = TMP_12.$$s || this;

      return $rb_plus("表３へ", self.$getPersonTable3())}, TMP_12.$$s = self, TMP_12.$$arity = 0, TMP_12));
      table = [[11, "魔法使い"], [12, "観光客"], [13, "先生"], [14, "探偵"], [15, "刷"], [16, "お嬢様"], [22, "お嬢様"], [23, "紳士"], [24, "ご婦人"], [25, "女王様"], [26, "職人さん"], [33, "女子高生"], [34, "学生"], [35, "剣闘士"], [36, "鳥"], [44, "猫"], [45, "犬"], [46, "カエル"], [55, "蛇"], [56, gotoNextTable], [66, gotoNextTable]];
      return self.$getPersonTable(table);
    }, TMP_WitchQuest_getPersonTable2_13.$$arity = 0);
    
    Opal.defn(self, '$getPersonTable3', TMP_WitchQuest_getPersonTable3_15 = function $$getPersonTable3() {
      var TMP_14, self = this, gotoNextTable = nil, table = nil;

      
      gotoNextTable = $send(self, 'lambda', [], (TMP_14 = function(){var self = TMP_14.$$s || this;

      return $rb_plus("表４へ", self.$getPersonTable4())}, TMP_14.$$s = self, TMP_14.$$arity = 0, TMP_14));
      table = [[11, "貴族"], [12, "いるか"], [13, "だいこん"], [14, "じゃがいも"], [15, "にんじん"], [16, "ドラゴン"], [22, "ゾンビ"], [23, "幽霊"], [24, "うさぎ"], [25, "天使"], [26, "悪魔"], [33, "赤ちゃん"], [34, "馬"], [35, "石"], [36, "お母さん"], [44, "妖精"], [45, "守護霊"], [46, "猫神様"], [55, "ロボット"], [56, "恐ろしい人"], [66, gotoNextTable]];
      return self.$getPersonTable(table);
    }, TMP_WitchQuest_getPersonTable3_15.$$arity = 0);
    
    Opal.defn(self, '$getPersonTable4', TMP_WitchQuest_getPersonTable4_16 = function $$getPersonTable4() {
      var self = this, table = nil;

      
      table = [[11, "魔女エディス"], [12, "魔女レーデルラン"], [13, "魔女キリル"], [14, "大魔女”ロロ”様"], [15, "エディスのお母さん”エリー”"], [16, "猫トンガリ"], [22, "猫ヒューベ"], [23, "猫ゆうのす"], [24, "猫集会の集団の一団"], [25, "岩"], [26, "PCの母"], [33, "PCの父"], [34, "PCの兄"], [35, "PCの姉"], [36, "PCの弟"], [44, "PCの妹"], [45, "PCの遠い親戚"], [46, "PCの死んだはずの両親"], [55, "初恋の人"], [56, "分かれた女(男)、不倫中の相手、または独身PCの場合、二股をかけている二人の両方"], [66, "宇宙人"]];
      return self.$getPersonTable(table);
    }, TMP_WitchQuest_getPersonTable4_16.$$arity = 0);
    return (Opal.defn(self, '$getPersonTable', TMP_WitchQuest_getPersonTable_17 = function $$getPersonTable(table) {
      var self = this, isSwap = nil, number = nil;

      
      isSwap = true;
      number = self.$bcdice().$getD66(isSwap);
      self.$debug("getPersonTable number", number);
      return $rb_plus("" + " ＞ " + (number) + ":", self.$get_table_by_number(number, table));
    }, TMP_WitchQuest_getPersonTable_17.$$arity = 1), nil) && 'getPersonTable';
  })($nesting[0], Opal.const_get_relative($nesting, 'DiceBot'), $nesting)
})(Opal);

/* Generated by Opal 0.11.4 */
(function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$exit']);
  return Opal.const_get_relative($nesting, 'Kernel').$exit()
})(Opal);
