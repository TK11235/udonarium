/* Generated by Opal 1.0.3 */
(function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $hash2 = Opal.hash2, $hash = Opal.hash, $send = Opal.send, $range = Opal.range;

  Opal.add_stubs(['$setPrefixes', '$===', '$last_match', '$resolute_action', '$to_i', '$fetchDeathChart', '$==', '$roll_d100', '$+', '$fetchResultFromRealNameChart', '$getRealNameChartByName', '$rollHeroNameTemplateChart', '$nil?', '$[]', '$freeze', '$parren_killer', '$format', '$<=', '$-', '$roll', '$*', '$fetchFromChart', '$getDeathChartByName', '$empty?', '$min', '$keys', '$max', '$<', '$>', '$key?', '$to_s', '$find', '$include?', '$size', '$first', '$each_with_index', '$<<', '$join', '$map', '$rollHeroNameBaseChart', '$getHeroNameElementText', '$sub', '$[]=', '$=~', '$rollHeroNameElementChart']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'DeadlineHeroes');

    var $nesting = [self].concat($parent_nesting), $DeadlineHeroes_rollDiceCommand$1, $DeadlineHeroes_resolute_action$2, $DeadlineHeroes_roll_d100$3, $DeadlineHeroes_fetchDeathChart$4, $DeadlineHeroes_fetchFromChart$5, $DeadlineHeroes_getDeathChartByName$6, $DeadlineHeroes_fetchResultFromRealNameChart$7, $DeadlineHeroes_getRealNameChartByName$10, $DeadlineHeroes_rollHeroNameTemplateChart$11, $DeadlineHeroes_getHeroNameElementText$15, $DeadlineHeroes_rollHeroNameBaseChart$16, $DeadlineHeroes_rollHeroNameElementChart$17;

    
    Opal.const_set($nesting[0], 'ID', "DeadlineHeroes");
    Opal.const_set($nesting[0], 'NAME', "デッドラインヒーローズ");
    Opal.const_set($nesting[0], 'SORT_KEY', "てつとらいんひいろおす");
    Opal.const_set($nesting[0], 'HELP_MESSAGE', "" + "・行為判定（DLHx）\n" + "　x：成功率\n" + "　例）DLH80\n" + "　クリティカル、ファンブルの自動的判定を行います。\n" + "　「DLH50+20-30」のように加減算記述も可能。\n" + "　成功率は上限100％、下限０％\n" + "・デスチャート(DCxY)\n" + "　x：チャートの種類。肉体：DCL、精神：DCS、環境：DCC\n" + "　Y=マイナス値\n" + "　例）DCL5：ライフが -5 の判定\n" + "　　　DCS3：サニティーが -3 の判定\n" + "　　　DCC0：クレジット 0 の判定\n" + "・ヒーローネームチャート（HNC）\n" + "・リアルネームチャート　日本（RNCJ）、海外（RNCO）\n");
    self.$setPrefixes(["DLH\\d+([\\+\\-]\\d+)*", "DC(L|S|C)\\d+", "RNC[JO]", "HNC"]);
    
    Opal.def(self, '$rollDiceCommand', $DeadlineHeroes_rollDiceCommand$1 = function $$rollDiceCommand(command) {
      var $a, $b, self = this, $case = nil, expressions = nil, type = nil, minusScore = nil, chartName = nil, roll_result = nil, dice10 = nil, dice01 = nil, text = nil, result = nil;

      
      $case = command;
      if (/^DLH(\d+([\+\-]\d+)*)/i['$===']($case)) {
      expressions = $$($nesting, 'Regexp').$last_match(1);
      return self.$resolute_action(expressions);}
      else if (/^DC(L||S|C)(\d+)/i['$===']($case)) {
      type = $$($nesting, 'Regexp').$last_match(1);
      minusScore = $$($nesting, 'Regexp').$last_match(2).$to_i();
      chartName = (function() {$case = type;
      if ("L"['$===']($case)) {return "肉体"}
      else if ("S"['$===']($case)) {return "精神"}
      else if ("C"['$===']($case)) {return "環境"}
      else { return nil }})();
      return self.$fetchDeathChart(chartName, minusScore);}
      else if (/^RNC([JO])/i['$===']($case)) {
      type = $$($nesting, 'Regexp').$last_match(1);
      chartName = (function() {if (type['$==']("J")) {
        return "日本"
      } else {
        return "海外"
      }; return nil; })();
      $b = self.$roll_d100(), $a = Opal.to_ary($b), (roll_result = ($a[0] == null ? nil : $a[0])), (dice10 = ($a[1] == null ? nil : $a[1])), (dice01 = ($a[2] == null ? nil : $a[2])), $b;
      text = "" + "リアルネームチャート（" + (chartName) + "）";
      text = $rb_plus(text, "" + ": 1D100[" + (dice10) + "," + (dice01) + "]=" + (roll_result));
      text = $rb_plus(text, $rb_plus(" ＞ ", self.$fetchResultFromRealNameChart(roll_result, self.$getRealNameChartByName(chartName))));
      return text;}
      else if (/^HNC/i['$===']($case)) {
      result = self.$rollHeroNameTemplateChart();
      if ($truthy(result['$nil?']())) {
      } else {
        return "" + "ヒーローネームチャート: 1D10[" + (result['$[]']("dice")) + "] ＞ " + (result['$[]']("result"))
      };};
      return nil;
    }, $DeadlineHeroes_rollDiceCommand$1.$$arity = 1);
    Opal.const_set($nesting[0], 'SUCCESS_STR', " ＞ 成功");
    Opal.const_set($nesting[0], 'FAILURE_STR', " ＞ 失敗");
    Opal.const_set($nesting[0], 'CRITICAL_STR', $rb_plus($$($nesting, 'SUCCESS_STR'), " ＞ クリティカル！ パワーの代償１／２").$freeze());
    Opal.const_set($nesting[0], 'FUMBLE_STR', $rb_plus($$($nesting, 'FAILURE_STR'), " ＞ ファンブル！ パワーの代償２倍＆振り直し不可").$freeze());
    
    Opal.def(self, '$resolute_action', $DeadlineHeroes_resolute_action$2 = function $$resolute_action(expressions) {
      var $a, $b, self = this, success_rate = nil, roll_result = nil, dice10 = nil, dice01 = nil, text = nil;

      
      success_rate = self.$parren_killer($rb_plus($rb_plus("(", expressions), ")")).$to_i();
      $b = self.$roll_d100(), $a = Opal.to_ary($b), (roll_result = ($a[0] == null ? nil : $a[0])), (dice10 = ($a[1] == null ? nil : $a[1])), (dice01 = ($a[2] == null ? nil : $a[2])), $b;
      text = "" + "行為判定(成功率:" + (success_rate) + "％)";
      text = $rb_plus(text, "" + " ＞ 1D100[" + (dice10) + "," + (dice01) + "]=" + (self.$format("%02d", roll_result)));
      text = $rb_plus(text, "" + " ＞ " + (self.$format("%02d", roll_result)));
      if ($truthy(($truthy($a = roll_result['$=='](100)) ? $a : $rb_le(success_rate, 0)))) {
        text = $rb_plus(text, $$($nesting, 'FUMBLE_STR'))
      } else if ($truthy($rb_le(roll_result, $rb_minus(success_rate, 100)))) {
        text = $rb_plus(text, $$($nesting, 'CRITICAL_STR'))
      } else if ($truthy($rb_le(roll_result, success_rate))) {
        text = $rb_plus(text, (function() {if (dice10['$=='](dice01)) {
          return $$($nesting, 'CRITICAL_STR')
        } else {
          return $$($nesting, 'SUCCESS_STR')
        }; return nil; })())
      } else {
        text = $rb_plus(text, (function() {if (dice10['$=='](dice01)) {
          return $$($nesting, 'FUMBLE_STR')
        } else {
          return $$($nesting, 'FAILURE_STR')
        }; return nil; })())
      };
      return text;
    }, $DeadlineHeroes_resolute_action$2.$$arity = 1);
    
    Opal.def(self, '$roll_d100', $DeadlineHeroes_roll_d100$3 = function $$roll_d100() {
      var $a, $b, self = this, dice10 = nil, dice01 = nil, roll_result = nil;

      
      $b = self.$roll(1, 10), $a = Opal.to_ary($b), (dice10 = ($a[0] == null ? nil : $a[0])), $b;
      if (dice10['$=='](10)) {
        dice10 = 0};
      $b = self.$roll(1, 10), $a = Opal.to_ary($b), (dice01 = ($a[0] == null ? nil : $a[0])), $b;
      if (dice01['$=='](10)) {
        dice01 = 0};
      roll_result = $rb_plus($rb_times(dice10, 10), dice01);
      if (roll_result['$=='](0)) {
        roll_result = 100};
      return [roll_result, dice10, dice01];
    }, $DeadlineHeroes_roll_d100$3.$$arity = 0);
    
    Opal.def(self, '$fetchDeathChart', $DeadlineHeroes_fetchDeathChart$4 = function $$fetchDeathChart(chartName, minusScore) {
      var $a, $b, self = this, dice = nil, keyNumber = nil, keyText = nil, resultText = nil;

      
      $b = self.$roll(1, 10), $a = Opal.to_ary($b), (dice = ($a[0] == null ? nil : $a[0])), $b;
      keyNumber = $rb_plus(dice, minusScore);
      $b = self.$fetchFromChart(keyNumber, self.$getDeathChartByName(chartName)), $a = Opal.to_ary($b), (keyText = ($a[0] == null ? nil : $a[0])), (resultText = ($a[1] == null ? nil : $a[1])), $b;
      return "" + "デスチャート（" + (chartName) + "）[マイナス値:" + (minusScore) + " + 1D10(->" + (dice) + ") = " + (keyNumber) + "] ＞ " + (keyText) + " ： " + (resultText);
    }, $DeadlineHeroes_fetchDeathChart$4.$$arity = 2);
    
    Opal.def(self, '$fetchFromChart', $DeadlineHeroes_fetchFromChart$5 = function $$fetchFromChart(keyNumber, chart) {
      var self = this, minKey = nil, maxKey = nil;

      
      if ($truthy(chart['$empty?']())) {
      } else {
        
        minKey = chart.$keys().$min();
        maxKey = chart.$keys().$max();
        if ($truthy($rb_lt(keyNumber, minKey))) {
          return ["" + (minKey) + "以下", chart['$[]'](minKey)]};
        if ($truthy($rb_gt(keyNumber, maxKey))) {
          return ["" + (maxKey) + "以上", chart['$[]'](maxKey)]};
        if ($truthy(chart['$key?'](keyNumber))) {
          return [keyNumber.$to_s(), chart['$[]'](keyNumber)]};
      };
      return ["未定義", "？？？"];
    }, $DeadlineHeroes_fetchFromChart$5.$$arity = 2);
    
    Opal.def(self, '$getDeathChartByName', $DeadlineHeroes_getDeathChartByName$6 = function $$getDeathChartByName(chartName) {
      var self = this;

      
      if ($truthy($$($nesting, 'DEATH_CHARTS')['$key?'](chartName))) {
      } else {
        return $hash2([], {})
      };
      return $$($nesting, 'DEATH_CHARTS')['$[]'](chartName);
    }, $DeadlineHeroes_getDeathChartByName$6.$$arity = 1);
    Opal.const_set($nesting[0], 'DEATH_CHARTS', $hash2(["肉体", "精神", "環境"], {"肉体": $hash(10, "何も無し。キミは奇跡的に一命を取り留めた。闘いは続く。", 11, "激痛が走る。以後、イベント終了時まで、全ての判定の成功率－10％。", 12, "キミは［硬直］ポイント２点を得る。［硬直］ポイントを所持している間、キミは「属性：妨害」のパワーを使用することができない。各ラウンド終了時、キミは所持している［硬直］ポイントを１点減らしてもよい。", 13, "渾身の一撃!!　キミは〈生存〉判定を行なう。失敗した場合、［死亡］する。", 14, "キミは［気絶］ポイント２点を得る。［気絶］ポイントを所持している間、キミはあらゆるパワーを使用できず、自身のターンを得ることもできない。各ラウンド終了時、キミは所持している［気絶］ポイントを１点減らしてもよい。", 15, "以後、イベント終了時まで、全ての判定の成功率－20％。", 16, "記録的一撃!!　キミは〈生存〉－20％の判定を行なう。失敗した場合、［死亡］する。", 17, "キミは［瀕死］ポイント２点を得る。［瀕死］ポイントを所持している間、キミはあらゆるパワーを使用できず、自身のターンを得ることもできない。各ラウンド終了時、キミは所持している［瀕死］ポイントを１点を失う。全ての［瀕死］ポイントを失う前に戦闘が終了しなかった場合、キミは［死亡］する。", 18, "叙事詩的一撃!!　キミは〈生存〉－30％の判定を行なう。失敗した場合、［死亡］する。", 19, "以後、イベント終了時まで、全ての判定の成功率－30％。", 20, "神話的一撃!!　キミは宙を舞って三回転ほどした後、地面に叩きつけられる。見るも無惨な姿。肉体は原型を留めていない（キミは［死亡］した）。"), "精神": $hash(10, "何も無し。キミは歯を食いしばってストレスに耐えた。", 11, "以後、イベント終了時まで、全ての判定の成功率－10％。", 12, "キミは［恐怖］ポイント２点を得る。［恐怖］ポイントを所持している間、キミは「属性：攻撃」のパワーを使用できない。各ラウンド終了時、キミは所持している［恐怖］ポイントを１点減らしてもよい。", 13, "とても傷ついた。キミは〈意志〉判定を行なう。失敗した場合、［絶望］してＮＰＣとなる。", 14, "キミは［気絶］ポイント２点を得る。［気絶］ポイントを所持している間、キミはあらゆるパワーを使用できず、自身のターンを得ることもできない。各ラウンド終了時、キミは所持している［気絶］ポイントを１点減らしてもよい。", 15, "以後、イベント終了時まで、全ての判定の成功率－20％。", 16, "信じるものに裏切られたような痛み。キミは〈意志〉－20％の判定を行なう。失敗した場合、［絶望］してＮＰＣとなる。", 17, "キミは［混乱］ポイント２点を得る。［混乱］ポイントを所持している間、キミは本来味方であったキャラクターに対して、可能な限り最大の被害を与える様、行動し続ける。各ラウンド終了時、キミは所持している［混乱］ポイントを１点減らしてもよい。", 18, "あまりに残酷な現実。キミは〈意志〉－30％の判定を行なう。失敗した場合、［絶望］してＮＰＣとなる。", 19, "以後、イベント終了時まで、全ての判定の成功率－30％。", 20, "宇宙開闢の理に触れるも、それは人類の認識限界を超える何かであった。キミは［絶望］し、以後ＮＰＣとなる。"), "環境": $hash(10, "何も無し。キミは黒い噂を握りつぶした。", 11, "以後、イベント終了時まで、全ての判定の成功率－10％。", 12, "ピンチ！　以後、イベント終了時まで、キミは《支援》を使用できない。", 13, "裏切り!!　キミは〈経済〉判定を行なう。失敗した場合、キミはヒーローとしての名声を失い、［汚名］を受ける。", 14, "以後、シナリオ終了時まで、代償にクレジットを消費するパワーを使用できない。", 15, "キミの悪評は大変なもののようだ。協力者からの支援が打ち切られる。以後、シナリオ終了時まで、全ての判定の成功率－20％。", 16, "信頼の失墜!!　キミは〈経済〉－20％の判定を行なう。失敗した場合、キミはヒーローとしての名声を失い、［汚名］を受ける。", 17, "以後、シナリオ終了時まで、【環境】系の技能のレベルがすべて０となる。", 18, "捏造報道!!　身の覚えのない犯罪への荷担が、スクープとして報道される。キミは〈経済〉－30％の判定を行なう。失敗した場合、キミはヒーローとしての名声を失い、［汚名］を受ける。", 19, "以後、イベント終了時まで、全ての判定の成功率－30％。", 20, "キミの名は史上最悪の汚点として永遠に歴史に刻まれる。もはやキミを信じる仲間はなく、キミを助ける社会もない。キミは［汚名］を受けた。")}).$freeze());
    
    Opal.def(self, '$fetchResultFromRealNameChart', $DeadlineHeroes_fetchResultFromRealNameChart$7 = function $$fetchResultFromRealNameChart(keyNumber, chartInfo) {
      var $a, $b, $$8, $$9, self = this, columns = nil, chart = nil, range = nil, elements = nil, result = nil, nameTextList = nil;

      
      $b = chartInfo, $a = Opal.to_ary($b), (columns = ($a[0] == null ? nil : $a[0])), (chart = ($a[1] == null ? nil : $a[1])), $b;
      $b = $send(chart, 'find', [], ($$8 = function(range, _elements){var self = $$8.$$s || this;

      
        
        if (range == null) {
          range = nil;
        };
        
        if (_elements == null) {
          _elements = nil;
        };
        return range['$include?'](keyNumber);}, $$8.$$s = self, $$8.$$arity = 2, $$8)), $a = Opal.to_ary($b), (range = ($a[0] == null ? nil : $a[0])), (elements = ($a[1] == null ? nil : $a[1])), $b;
      if ($truthy(range['$nil?']())) {
        return nil};
      result = "" + "(" + (range) + ") ＞ ";
      if ($truthy($rb_le(elements.$size(), 1))) {
        
        result = $rb_plus(result, elements.$first());
        return result;};
      nameTextList = [];
      $send(columns, 'each_with_index', [], ($$9 = function(title, i){var self = $$9.$$s || this, text = nil;

      
        
        if (title == null) {
          title = nil;
        };
        
        if (i == null) {
          i = nil;
        };
        text = elements['$[]'](i);
        if ($truthy(text['$nil?']())) {
          return nil;};
        return nameTextList['$<<']("" + (title) + ": " + (text));}, $$9.$$s = self, $$9.$$arity = 2, $$9));
      result = $rb_plus(result, nameTextList.$join("\n"));
      return result;
    }, $DeadlineHeroes_fetchResultFromRealNameChart$7.$$arity = 2);
    
    Opal.def(self, '$getRealNameChartByName', $DeadlineHeroes_getRealNameChartByName$10 = function $$getRealNameChartByName(chartName) {
      var self = this;

      
      if ($truthy($$($nesting, 'REAL_NAME_CHARTS')['$key?'](chartName))) {
      } else {
        return $hash2([], {})
      };
      return $$($nesting, 'REAL_NAME_CHARTS')['$[]'](chartName);
    }, $DeadlineHeroes_getRealNameChartByName$10.$$arity = 1);
    Opal.const_set($nesting[0], 'REAL_NAME_CHARTS', $hash2(["日本", "海外"], {"日本": [["姓", "名（男）", "名（女）"], [[$range(1, 6, false), ["アイカワ／相川、愛川", "アキラ／晶、章", "アン／杏"]], [$range(7, 12, false), ["アマミヤ／雨宮", "エイジ／映司、英治", "イノリ／祈鈴、祈"]], [$range(13, 18, false), ["イブキ／伊吹", "カズキ／和希、一輝", "エマ／英真、恵茉"]], [$range(19, 24, false), ["オガミ／尾上", "ギンガ／銀河", "カノン／花音、観音"]], [$range(25, 30, false), ["カイ／甲斐", "ケンイチロウ／健一郎", "サラ／沙羅"]], [$range(31, 36, false), ["サカキ／榊、阪木", "ゴウ／豪、剛", "シズク／雫"]], [$range(37, 42, false), ["シシド／宍戸", "ジロー／次郎、治郎", "チズル／千鶴、千尋"]], [$range(43, 48, false), ["タチバナ／橘、立花", "タケシ／猛、武", "ナオミ／直美、尚美"]], [$range(49, 54, false), ["ツブラヤ／円谷", "ツバサ／翼", "ハル／華、波留"]], [$range(55, 60, false), ["ハヤカワ／早川", "テツ／鉄、哲", "ヒカル／光"]], [$range(61, 66, false), ["ハラダ／原田", "ヒデオ／英雄", "ベニ／紅"]], [$range(67, 72, false), ["フジカワ／藤川", "マサムネ／正宗、政宗", "マチ／真知、町"]], [$range(73, 78, false), ["ホシ／星", "ヤマト／大和", "ミア／深空、美杏"]], [$range(79, 84, false), ["ミゾグチ／溝口", "リュウセイ／流星", "ユリコ／由里子"]], [$range(85, 90, false), ["ヤシダ／矢志田", "レツ／烈、裂", "ルイ／瑠衣、涙"]], [$range(91, 96, false), ["ユウキ／結城", "レン／連、錬", "レナ／玲奈"]], [$range(97, 100, false), ["名無し（何らかの理由で名前を持たない、もしくは失った）"]]]], "海外": [["名（男）", "名（女）", "姓"], [[$range(1, 6, false), ["アルバス", "アイリス", "アレン"]], [$range(7, 12, false), ["クリス", "オリーブ", "ウォーケン"]], [$range(13, 18, false), ["サミュエル", "カーラ", "ウルフマン"]], [$range(19, 24, false), ["シドニー", "キルスティン", "オルセン"]], [$range(25, 30, false), ["スパイク", "グウェン", "カーター"]], [$range(31, 36, false), ["ダミアン", "サマンサ", "キャラダイン"]], [$range(37, 42, false), ["ディック", "ジャスティナ", "シーゲル"]], [$range(43, 48, false), ["デンゼル", "タバサ", "ジョーンズ"]], [$range(49, 54, false), ["ドン", "ナディン", "パーカー"]], [$range(55, 60, false), ["ニコラス", "ノエル", "フリーマン"]], [$range(61, 66, false), ["ネビル", "ハーリーン", "マーフィー"]], [$range(67, 72, false), ["バリ", "マルセラ", "ミラー"]], [$range(73, 78, false), ["ビリー", "ラナ", "ムーア"]], [$range(79, 84, false), ["ブルース", "リンジー", "リーヴ"]], [$range(85, 90, false), ["マーヴ", "ロザリー", "レイノルズ"]], [$range(91, 96, false), ["ライアン", "ワンダ", "ワード"]], [$range(97, 100, false), ["名無し（何らかの理由で名前を持たない、もしくは失った）"]]]]}).$freeze());
    
    Opal.def(self, '$rollHeroNameTemplateChart', $DeadlineHeroes_rollHeroNameTemplateChart$11 = function $$rollHeroNameTemplateChart() {
      var $a, $b, $$12, $$13, $$14, self = this, chart = nil, dice = nil, templateText = nil, result = nil, elements = nil, resolvedElements = nil, text = nil, resultText = nil, $writer = nil;

      
      chart = $$($nesting, 'HERO_NAME_TEMPLATES');
      $b = self.$roll(1, 10), $a = Opal.to_ary($b), (dice = ($a[0] == null ? nil : $a[0])), $b;
      templateText = chart['$[]'](dice)['$[]']("text");
      if ($truthy(templateText['$nil?']())) {
        return nil};
      result = $hash2(["dice", "result"], {"dice": dice, "result": templateText});
      if (templateText['$==']("任意")) {
        return result};
      elements = chart['$[]'](dice)['$[]']("elements");
      resolvedElements = $send(elements, 'map', [], ($$12 = function(i){var self = $$12.$$s || this;

      
        
        if (i == null) {
          i = nil;
        };
        return self.$rollHeroNameBaseChart(i);}, $$12.$$s = self, $$12.$$arity = 1, $$12));
      text = $send(resolvedElements, 'map', [], ($$13 = function(i){var self = $$13.$$s || this;

      
        
        if (i == null) {
          i = nil;
        };
        return self.$getHeroNameElementText(i);}, $$13.$$s = self, $$13.$$arity = 1, $$13)).$join(" ＋ ");
      resultText = $send(resolvedElements, 'map', [], ($$14 = function(i){var self = $$14.$$s || this;

      
        
        if (i == null) {
          i = nil;
        };
        return i['$[]']("coreResult");}, $$14.$$s = self, $$14.$$arity = 1, $$14)).$join("").$sub(/・{2,}/, "・").$sub(/・$/, "");
      
      $writer = ["result", $rb_plus(result['$[]']("result"), "" + " ＞ ( " + (text) + " ) ＞ 「" + (resultText) + "」")];
      $send(result, '[]=', Opal.to_a($writer));
      $writer[$rb_minus($writer["length"], 1)];;
      return result;
    }, $DeadlineHeroes_rollHeroNameTemplateChart$11.$$arity = 0);
    
    Opal.def(self, '$getHeroNameElementText', $DeadlineHeroes_getHeroNameElementText$15 = function $$getHeroNameElementText(info) {
      var self = this, result = nil;

      
      result = "";
      if ($truthy(info['$key?']("chartName"))) {
        result = $rb_plus(result, info['$[]']("chartName").$to_s())};
      if ($truthy(info['$key?']("dice"))) {
        result = $rb_plus(result, "" + "(1D10[" + (info['$[]']("dice")) + "]) ＞ ")};
      if ($truthy(info['$key?']("innerChartName"))) {
        result = $rb_plus(result, "" + "［" + (info['$[]']("innerChartName")) + "］ ＞ 1D10[" + (info['$[]']("innerResult")['$[]']("dice")) + "] ＞ ")};
      return (result = $rb_plus(result, "" + "「" + (info['$[]']("coreResult")) + "」"));
    }, $DeadlineHeroes_getHeroNameElementText$15.$$arity = 1);
    
    Opal.def(self, '$rollHeroNameBaseChart', $DeadlineHeroes_rollHeroNameBaseChart$16 = function $$rollHeroNameBaseChart(chartName) {
      var $a, $b, self = this, defaultResult = nil, chart = nil, dice = nil, result = nil, $writer = nil, innerResult = nil;

      
      defaultResult = $hash2(["result", "coreResult"], {"result": chartName, "coreResult": chartName});
      chart = $$($nesting, 'HERO_NAME_BASE_CHARTS')['$[]'](chartName);
      if ($truthy(chart['$nil?']())) {
        return defaultResult};
      $b = self.$roll(1, 10), $a = Opal.to_ary($b), (dice = ($a[0] == null ? nil : $a[0])), $b;
      if ($truthy(chart['$key?'](dice))) {
      } else {
        return defaultResult
      };
      result = $hash2(["dice", "result", "chartName"], {"dice": dice, "result": chart['$[]'](dice), "chartName": chartName});
      
      $writer = ["coreResult", result['$[]']("result")];
      $send(result, '[]=', Opal.to_a($writer));
      $writer[$rb_minus($writer["length"], 1)];;
      if ($truthy(result['$[]']("result")['$=~'](/［(.+)］/))) {
        
        innerResult = self.$rollHeroNameElementChart($$($nesting, 'Regexp').$last_match(1).$to_s());
        
        $writer = ["innerResult", innerResult];
        $send(result, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];;
        
        $writer = ["innerChartName", innerResult['$[]']("chartName")];
        $send(result, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];;
        
        $writer = ["coreResult", innerResult['$[]']("name")];
        $send(result, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];;
        
        $writer = ["result", $rb_plus(result['$[]']("result"), "" + " ＞ 1D10[" + (innerResult['$[]']("dice")) + "] ＞ " + (innerResult['$[]']("name")) + "（意味：" + (innerResult['$[]']("mean")) + "）")];
        $send(result, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];;};
      return result;
    }, $DeadlineHeroes_rollHeroNameBaseChart$16.$$arity = 1);
    
    Opal.def(self, '$rollHeroNameElementChart', $DeadlineHeroes_rollHeroNameElementChart$17 = function $$rollHeroNameElementChart(chartName) {
      var $a, $b, self = this, chart = nil, dice = nil, name = nil, mean = nil;

      
      chart = $$($nesting, 'HERO_NAME_ELEMENT_CHARTS')['$[]'](chartName.$sub("/", "／"));
      if ($truthy(chart['$nil?']())) {
        return nil};
      $b = self.$roll(1, 10), $a = Opal.to_ary($b), (dice = ($a[0] == null ? nil : $a[0])), $b;
      if ($truthy(chart['$key?'](dice))) {
      } else {
        return nil
      };
      $b = chart['$[]'](dice), $a = Opal.to_ary($b), (name = ($a[0] == null ? nil : $a[0])), (mean = ($a[1] == null ? nil : $a[1])), $b;
      return $hash2(["dice", "name", "coreResult", "mean", "chartName"], {"dice": dice, "name": name, "coreResult": name, "mean": mean, "chartName": chartName});
    }, $DeadlineHeroes_rollHeroNameElementChart$17.$$arity = 1);
    Opal.const_set($nesting[0], 'HERO_NAME_TEMPLATES', $hash(1, $hash2(["text", "elements"], {"text": "ベースＡ＋ベースＢ", "elements": ["ベースＡ", "ベースＢ"]}), 2, $hash2(["text", "elements"], {"text": "ベースＢ", "elements": ["ベースＢ"]}), 3, $hash2(["text", "elements"], {"text": "ベースＢ×２回", "elements": ["ベースＢ", "ベースＢ"]}), 4, $hash2(["text", "elements"], {"text": "ベースＢ＋ベースＣ", "elements": ["ベースＢ", "ベースＣ"]}), 5, $hash2(["text", "elements"], {"text": "ベースＡ＋ベースＢ＋ベースＣ", "elements": ["ベースＡ", "ベースＢ", "ベースＣ"]}), 6, $hash2(["text", "elements"], {"text": "ベースＡ＋ベースＢ×２回", "elements": ["ベースＡ", "ベースＢ", "ベースＢ"]}), 7, $hash2(["text", "elements"], {"text": "ベースＢ×２回＋ベースＣ", "elements": ["ベースＢ", "ベースＢ", "ベースＣ"]}), 8, $hash2(["text", "elements"], {"text": "（ベースＢ）・オブ・（ベースＢ）", "elements": ["ベースＢ", "・オブ・", "ベースＢ"]}), 9, $hash2(["text", "elements"], {"text": "（ベースＢ）・ザ・（ベースＢ）", "elements": ["ベースＢ", "・ザ・", "ベースＢ"]}), 10, $hash2(["text", "elements"], {"text": "任意", "elements": ["任意"]})).$freeze());
    Opal.const_set($nesting[0], 'HERO_NAME_BASE_CHARTS', $hash2(["ベースＡ", "ベースＢ", "ベースＣ"], {"ベースＡ": $hash(1, "ザ・", 2, "キャプテン・", 3, "ミスター／ミス／ミセス・", 4, "ドクター／プロフェッサー・", 5, "ロード／バロン／ジェネラル・", 6, "マン・オブ・", 7, "［強さ］", 8, "［色］", 9, "マダム／ミドル・", 10, "数字（１～10）・"), "ベースＢ": $hash(1, "［神話／夢］", 2, "［武器］", 3, "［動物］", 4, "［鳥］", 5, "［虫／爬虫類］", 6, "［部位］", 7, "［光］", 8, "［攻撃］", 9, "［その他］", 10, "数字（１～10）・"), "ベースＣ": $hash(1, "マン／ウーマン", 2, "ボーイ／ガール", 3, "マスク／フード", 4, "ライダー", 5, "マスター", 6, "ファイター／ソルジャー", 7, "キング／クイーン", 8, "［色］", 9, "ヒーロー／スペシャル", 10, "ヒーロー／スペシャル")}).$freeze());
    return Opal.const_set($nesting[0], 'HERO_NAME_ELEMENT_CHARTS', $hash2(["部位", "武器", "色", "動物", "神話／夢", "攻撃", "その他", "鳥", "光", "虫／爬虫類", "強さ"], {"部位": $hash(1, ["ハート", "心臓"], 2, ["フェイス", "顔"], 3, ["アーム", "腕"], 4, ["ショルダー", "肩"], 5, ["ヘッド", "頭"], 6, ["アイ", "眼"], 7, ["フィスト", "拳"], 8, ["ハンド", "手"], 9, ["クロウ", "爪"], 10, ["ボーン", "骨"]), "武器": $hash(1, ["ナイヴス", "短剣"], 2, ["ソード", "剣"], 3, ["ハンマー", "鎚"], 4, ["ガン", "銃"], 5, ["スティール", "刃"], 6, ["タスク", "牙"], 7, ["ニューク", "核"], 8, ["アロー", "矢"], 9, ["ソウ", "ノコギリ"], 10, ["レイザー", "剃刀"]), "色": $hash(1, ["ブラック", "黒"], 2, ["グリーン", "緑"], 3, ["ブルー", "青"], 4, ["イエロー", "黃"], 5, ["レッド", "赤"], 6, ["バイオレット", "紫"], 7, ["シルバー", "銀"], 8, ["ゴールド", "金"], 9, ["ホワイト", "白"], 10, ["クリア", "透明"]), "動物": $hash(1, ["バニー", "ウサギ"], 2, ["タイガー", "虎"], 3, ["シャーク", "鮫"], 4, ["キャット", "猫"], 5, ["コング", "ゴリラ"], 6, ["ドッグ", "犬"], 7, ["フォックス", "狐"], 8, ["パンサー", "豹"], 9, ["アス", "ロバ"], 10, ["バット", "蝙蝠"]), "神話／夢": $hash(1, ["アポカリプス", "黙示録"], 2, ["ウォー", "戦争"], 3, ["エターナル", "永遠"], 4, ["エンジェル", "天使"], 5, ["デビル", "悪魔"], 6, ["イモータル", "死なない"], 7, ["デス", "死神"], 8, ["ドリーム", "夢"], 9, ["ゴースト", "幽霊"], 10, ["デッド", "死んでいる"]), "攻撃": $hash(1, ["ストローク", "一撃"], 2, ["クラッシュ", "壊す"], 3, ["ブロウ", "吹き飛ばす"], 4, ["ヒット", "打つ"], 5, ["パンチ", "殴る"], 6, ["キック", "蹴る"], 7, ["スラッシュ", "斬る"], 8, ["ペネトレイト", "貫く"], 9, ["ショット", "撃つ"], 10, ["キル", "殺す"]), "その他": $hash(1, ["ヒューマン", "人間"], 2, ["エージェント", "代理人"], 3, ["ブースター", "泥棒"], 4, ["アイアン", "鉄"], 5, ["サンダー", "雷"], 6, ["ウォッチャー", "監視者"], 7, ["プール", "水たまり"], 8, ["マシーン", "機械"], 9, ["コールド", "冷たい"], 10, ["サイド", "側面"]), "鳥": $hash(1, ["ホーク", "鷹"], 2, ["ファルコン", "隼"], 3, ["キャナリー", "カナリア"], 4, ["ロビン", "コマツグミ"], 5, ["イーグル", "鷲"], 6, ["オウル", "フクロウ"], 7, ["レイブン", "ワタリガラス"], 8, ["ダック", "アヒル"], 9, ["ペンギン", "ペンギン"], 10, ["フェニックス", "不死鳥"]), "光": $hash(1, ["ライト", "光"], 2, ["シャドウ", "影"], 3, ["ファイアー", "炎"], 4, ["ダーク", "暗い"], 5, ["ナイト", "夜"], 6, ["ファントム", "幻影"], 7, ["トーチ", "灯火"], 8, ["フラッシュ", "閃光"], 9, ["ランタン", "手さげランプ"], 10, ["サン", "太陽"]), "虫／爬虫類": $hash(1, ["ビートル", "甲虫"], 2, ["バタフライ／モス", "蝶／蛾"], 3, ["スネーク／コブラ", "蛇"], 4, ["アリゲーター", "ワニ"], 5, ["ローカスト", "バッタ"], 6, ["リザード", "トカゲ"], 7, ["タートル", "亀"], 8, ["スパイダー", "蜘蛛"], 9, ["アント", "アリ"], 10, ["マンティス", "カマキリ"]), "強さ": $hash(1, ["スーパー／ウルトラ", "超"], 2, ["ワンダー", "驚異的"], 3, ["アルティメット", "究極の"], 4, ["ファンタスティック", "途方もない"], 5, ["マイティ", "強い"], 6, ["インクレディブル", "凄い"], 7, ["アメージング", "素晴らしい"], 8, ["ワイルド", "狂乱の"], 9, ["グレイテスト", "至高の"], 10, ["マーベラス", "驚くべき"])}).$freeze());
  })($nesting[0], $$($nesting, 'DiceBot'), $nesting)
})(Opal);
