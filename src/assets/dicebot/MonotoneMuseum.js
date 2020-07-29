/* Generated by Opal 1.0.3 */
(function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy;

  Opal.add_stubs(['$setPrefixes', '$checkRoll', '$empty?', '$debug', '$rollTableCommand', '$=~', '$last_match', '$to_i', '$nil?', '$parren_killer', '$roll', '$+', '$>=', '$<=', '$===', '$mm_emotion_table_ver2', '$mm_emotion_table', '$mm_omens_table_ver2', '$mm_omens_table', '$mm_world_distortion_table_ver2', '$mm_world_distortion_table', '$mm_distortion_table_outdoor', '$mm_distortion_table_sea', '$mm_distortion_table_ver2', '$mm_distortion_table', '$!=', '$get_table_by_d66', '$get_table_by_2d6']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'MonotoneMuseum');

    var $nesting = [self].concat($parent_nesting), $MonotoneMuseum_initialize$1, $MonotoneMuseum_rollDiceCommand$2, $MonotoneMuseum_checkRoll$3, $MonotoneMuseum_rollTableCommand$4, $MonotoneMuseum_mm_emotion_table$5, $MonotoneMuseum_mm_emotion_table_ver2$6, $MonotoneMuseum_mm_omens_table$7, $MonotoneMuseum_mm_distortion_table$8, $MonotoneMuseum_mm_distortion_table_ver2$9, $MonotoneMuseum_mm_world_distortion_table$10, $MonotoneMuseum_mm_world_distortion_table_ver2$11, $MonotoneMuseum_mm_omens_table_ver2$12, $MonotoneMuseum_mm_distortion_table_outdoor$13, $MonotoneMuseum_mm_distortion_table_sea$14;

    self.$$prototype.sortType = nil;
    
    Opal.const_set($nesting[0], 'ID', "MonotoneMuseum");
    Opal.const_set($nesting[0], 'NAME', "モノトーン・ミュージアム");
    Opal.const_set($nesting[0], 'SORT_KEY', "ものとおんみゆうしあむ");
    Opal.const_set($nesting[0], 'HELP_MESSAGE', "" + "・判定\n" + "　・通常判定　　　　　　2D6+m>=t[c,f]\n" + "　　修正値m,目標値t,クリティカル値c,ファンブル値fで判定ロールを行います。\n" + "　　クリティカル値、ファンブル値は省略可能です。([]ごと省略できます)\n" + "　　自動成功、自動失敗、成功、失敗を自動表示します。\n" + "・各種表\n" + "　・感情表　ET／感情表 2.0　ET2\n" + "　・兆候表　　OT／兆候表ver2.0　OT2\n" + "　・歪み表　DT／歪み表ver2.0　DT2／歪み表(野外)　DTO／歪み表(海)　DTS\n" + "　・世界歪曲表　　WDT／世界歪曲表2.0　WDT2\n" + "・D66ダイスあり\n");
    self.$setPrefixes(["2D6.*", "ET", "ET2", "OT", "DT", "DT2", "WDT", "WDT2", "OT2", "DTO", "DTS"]);
    
    Opal.def(self, '$initialize', $MonotoneMuseum_initialize$1 = function $$initialize() {
      var $iter = $MonotoneMuseum_initialize$1.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $MonotoneMuseum_initialize$1.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      $send(self, Opal.find_super_dispatcher(self, 'initialize', $MonotoneMuseum_initialize$1, false), $zuper, $iter);
      self.sendMode = 2;
      self.d66Type = 1;
      return (self.sortType = 1);
    }, $MonotoneMuseum_initialize$1.$$arity = 0);
    
    Opal.def(self, '$rollDiceCommand', $MonotoneMuseum_rollDiceCommand$2 = function $$rollDiceCommand(command) {
      var self = this, result = nil;

      
      result = self.$checkRoll(command);
      if ($truthy(result['$empty?']())) {
      } else {
        return result
      };
      self.$debug("判定ロールではなかった");
      self.$debug("各種表として処理");
      return self.$rollTableCommand(command);
    }, $MonotoneMuseum_rollDiceCommand$2.$$arity = 1);
    
    Opal.def(self, '$checkRoll', $MonotoneMuseum_checkRoll$3 = function $$checkRoll(string) {
      var $a, $b, $c, self = this, output = nil, crit = nil, fumble = nil, modText = nil, target = nil, mod = nil, total = nil, dice_str = nil, total_n = nil;

      
      output = "";
      crit = 12;
      fumble = 2;
      if ($truthy(/^2D6([\+\-\d]*)>=(\d+)(\[(\d+)?(,(\d+))?\])?$/i['$=~'](string))) {
      } else {
        return output
      };
      modText = $$($nesting, 'Regexp').$last_match(1);
      target = $$($nesting, 'Regexp').$last_match(2).$to_i();
      if ($truthy($$($nesting, 'Regexp').$last_match(4))) {
        crit = $$($nesting, 'Regexp').$last_match(4).$to_i()};
      if ($truthy($$($nesting, 'Regexp').$last_match(6))) {
        fumble = $$($nesting, 'Regexp').$last_match(6).$to_i()};
      mod = 0;
      if ($truthy(modText['$nil?']())) {
      } else {
        mod = self.$parren_killer("" + "(0" + (modText) + ")")
      };
      $b = self.$roll(2, 6, ($truthy($c = self.sortType) ? 1 : $c)), $a = Opal.to_ary($b), (total = ($a[0] == null ? nil : $a[0])), (dice_str = ($a[1] == null ? nil : $a[1])), $b;
      total_n = $rb_plus(total, mod.$to_i());
      output = "" + (total) + "[" + (dice_str) + "]＋" + (mod) + " → " + (total_n);
      if ($truthy($rb_ge(total, crit))) {
        output = $rb_plus(output, " ＞ 自動成功")
      } else if ($truthy($rb_le(total, fumble))) {
        output = $rb_plus(output, " ＞ 自動失敗")
      } else if ($truthy($rb_ge(total_n, target))) {
        output = $rb_plus(output, " ＞ 成功")
      } else {
        output = $rb_plus(output, " ＞ 失敗")
      };
      output = "" + "(" + (string) + ") ＞ " + (output);
      return output;
    }, $MonotoneMuseum_checkRoll$3.$$arity = 1);
    
    Opal.def(self, '$rollTableCommand', $MonotoneMuseum_rollTableCommand$4 = function $$rollTableCommand(command) {
      var $a, $b, self = this, output = nil, type = nil, $case = nil, total_n = nil;

      
      output = "";
      type = "";
      $case = command;
      if (/ET2/i['$===']($case)) {
      type = "感情表2.0";
      $b = self.$mm_emotion_table_ver2(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/ET/i['$===']($case)) {
      type = "感情表";
      $b = self.$mm_emotion_table(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/OT2/i['$===']($case)) {
      type = "兆候表ver2.0";
      $b = self.$mm_omens_table_ver2(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/OT/i['$===']($case)) {
      type = "兆候表";
      $b = self.$mm_omens_table(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/WDT2/i['$===']($case)) {
      type = "世界歪曲表ver2.0";
      $b = self.$mm_world_distortion_table_ver2(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/WDT/i['$===']($case)) {
      type = "世界歪曲表";
      $b = self.$mm_world_distortion_table(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/DTO/i['$===']($case)) {
      type = "歪み表(野外)";
      $b = self.$mm_distortion_table_outdoor(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/DTS/i['$===']($case)) {
      type = "歪み表(海)";
      $b = self.$mm_distortion_table_sea(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/DT2/i['$===']($case)) {
      type = "歪み表ver2.0";
      $b = self.$mm_distortion_table_ver2(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;}
      else if (/DT/i['$===']($case)) {
      type = "歪み表";
      $b = self.$mm_distortion_table(), $a = Opal.to_ary($b), (output = ($a[0] == null ? nil : $a[0])), (total_n = ($a[1] == null ? nil : $a[1])), $b;};
      if ($truthy(output['$!='](""))) {
        output = "" + (type) + "(" + (total_n) + ") ＞ " + (output)};
      return output;
    }, $MonotoneMuseum_rollTableCommand$4.$$arity = 1);
    
    Opal.def(self, '$mm_emotion_table', $MonotoneMuseum_mm_emotion_table$5 = function $$mm_emotion_table() {
      var self = this, table = nil;

      
      table = ["【信頼（しんらい）】", "【有為（ゆうい）】", "【友情（ゆうじょう）】", "【純愛（じゅんあい）】", "【慈愛（じあい）】", "【憧れ（あこがれ）】", "【恐怖（きょうふ）】", "【脅威（きょうい）】", "【憎悪（ぞうお）】", "【不快感（ふかいかん）】", "【食傷（しょくしょう）】", "【嫌悪（けんお）】", "【好意（こうい）】", "【庇護（ひご）】", "【遺志（いし）】", "【懐旧（かいきゅう）】", "【尽力（じんりょく）】", "【忠誠（ちゅうせい）】", "【不安（ふあん）】", "【侮蔑（ぶべつ）】", "【嫉妬（しっと）】", "【劣等感（れっとうかん）】", "【優越感（ゆうえつかん）】", "【憐憫（れんびん）】", "【尊敬（そんけい）】", "【感服（かんぷく）】", "【慕情（ぼじょう）】", "【同情（どうじょう）】", "【傾倒（けいとう）】", "【好奇心（こうきしん）】", "【偏愛（へんあい）】", "【執着（しゅうちゃく）】", "【悔悟（かいご）】", "【警戒心（けいかいしん）】", "【敵愾心（てきがいしん）】", "【忘却（ぼうきゃく）】"];
      return self.$get_table_by_d66(table);
    }, $MonotoneMuseum_mm_emotion_table$5.$$arity = 0);
    
    Opal.def(self, '$mm_emotion_table_ver2', $MonotoneMuseum_mm_emotion_table_ver2$6 = function $$mm_emotion_table_ver2() {
      var self = this, table = nil;

      
      table = ["【玩家の任意】", "【同一視（どういつし）】", "【連帯感（れんたいかん）】", "【幸福感（こうふくかん）】", "【親近感（しんきんかん）】", "【誠意（せいい）】", "【懐旧（かいきゅう）】", "【同郷（どうきょう）】", "【同志（どうし）】", "【くされ縁（くされえん）】", "【期待（きたい）】", "【好敵手（こうてきしゅ）】", "【借り（かり）】", "【貸し（かし）】", "【献身（けんしん）】", "【義兄弟（ぎきょうだい）】", "【幼子（おさなご）】", "【親愛（しんあい）】", "【疎外感（そがいかん）】", "【恥辱（ちじょく）】", "【憐憫（れんびん）】", "【隔意（かくい）】", "【嫌悪（けんお）】", "【猜疑心（さいぎしん）】", "【厭気（けんき）】", "【不信感（ふしんかん）】", "【怨念（おんねん）】", "【悲哀（ひあい）】", "【悪意（あくい）】", "【殺意（さつい）】", "【敗北感（はいぼくかん）】", "【徒労感（とろうかん）】", "【黒い泥（くろいどろ）】", "【憤懣（ふんまん）】", "【無関心（むかんしん）】", "【玩家の任意】"];
      return self.$get_table_by_d66(table);
    }, $MonotoneMuseum_mm_emotion_table_ver2$6.$$arity = 0);
    
    Opal.def(self, '$mm_omens_table', $MonotoneMuseum_mm_omens_table$7 = function $$mm_omens_table() {
      var self = this, table = nil;

      
      table = ["【信念の喪失】\n[出自]を喪失する。特徴は失われない。", "【昏倒】\nあなたは[戦闘不能]になる。", "【肉体の崩壊】\nあなたは 2D6点のHPを失う。", "【放心】\nあなたはバッドステータスの[放心]を受ける。", "【重圧】\nあなたはバッドステータスの[重圧]を受ける。", "【現在の喪失】\n現在持っているパートナーをひとつ喪失する。", "【マヒ】\nあなたはバッドステータスの[マヒ]を受ける。", "【邪毒】\nあなたはバッドステータスの[邪毒]5を受ける。", "【色彩の喪失】\n漆黒、墨白、透明化……。その禍々しい色彩の喪失は他らなぬ異形化の片鱗だ。", "【理由の喪失】\n[境遇]を喪失する。特徴は失われない。", "【存在の喪失】\nあなたの存在は一瞬、この世界から消失する。"];
      return self.$get_table_by_2d6(table);
    }, $MonotoneMuseum_mm_omens_table$7.$$arity = 0);
    
    Opal.def(self, '$mm_distortion_table', $MonotoneMuseum_mm_distortion_table$8 = function $$mm_distortion_table() {
      var self = this, table = nil;

      
      table = ["【世界消失】\n演目の舞台がすべて失われる。舞台に残っているのはキミたちと異形、伽藍だけだ。クライマックスフェイズへ。", "【生命減少】\n演目の舞台となっている街や国から動物や人間の姿が少なくなる。特に子供の姿は見られない。", "【空間消失】\n演目の舞台の一部（建物一棟程度）が消失する。", "【天候悪化】\n激しい雷雨に見舞われる。", "【生命繁茂】\nシーン内に植物が爆発的に増加し、建物はイバラのトゲと蔓草に埋没する。", "【色彩喪失】\n世界から色彩が失われる。世界のすべてをモノクロームになったかのように認識する。", "【神権音楽】\n美しいが不安を覚える音が流れる。音は人々にストレスを与え、街の雰囲気は悪化している。", "【鏡面世界】\n演目の舞台に存在するあらゆる文字は鏡文字になる。", "【時空歪曲】\n昼夜が逆転する。昼間であれば夜になり、夜であれば朝となる。", "【存在修正】\nGMが任意に決定したNPCの性別や年齢、外見が変化する。", "【人体消失】\nシーン玩家のパートナーとなっているNPCが消失する。どのNPCが消失するかは、GMが決定する。"];
      return self.$get_table_by_2d6(table);
    }, $MonotoneMuseum_mm_distortion_table$8.$$arity = 0);
    
    Opal.def(self, '$mm_distortion_table_ver2', $MonotoneMuseum_mm_distortion_table_ver2$9 = function $$mm_distortion_table_ver2() {
      var self = this, table = nil;

      
      table = ["【色彩侵食】\nシーン内に存在するあらゆる無生物と生物は、白と黒とのモノトーンの存在となる。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。この効果は歪みをもたらした異形の死によって解除される。", "【色彩侵食】\nシーン内に存在するあらゆる無生物と生物は、白と黒とのモノトーンの存在となる。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。この効果は歪みをもたらした異形の死によって解除される。", "【虚無現出】\nほつれの中から虚無がしみ出す。シーンに登場しているエキストラは虫一匹にいたるまで消滅し、二度と現れない。", "【虚無現出】\nほつれの中から虚無がしみ出す。シーンに登場しているエキストラは虫一匹にいたるまで消滅し、二度と現れない。", "【季節変容】\n季節が突如として変化する。1D6し、1なら春、2なら夏、3なら秋、4なら冬、5ならプレイしている現在の季節、6ならGMの任意とせよ。", "【季節変容】\n季節が突如として変化する。1D6し、1なら春、2なら夏、3なら秋、4なら冬、5ならプレイしている現在の季節、6ならGMの任意とせよ。", "【ほつれ】\n世界がひび割れ、ほつれが現出する。ほつれに触れたものは虚無に飲み込まれ、帰ってくることはない。", "【ほつれ】\n世界がひび割れ、ほつれが現出する。ほつれに触れたものは虚無に飲み込まれ、帰ってくることはない。", "【異形化】\nシーン内のすべてのエキストラは何らかの異形化を受ける。これを治癒する術はない。異形の群れ（『インカルツァンド』P.237）×1D6と戦闘させてもよい。", "【異形化】\nシーン内のすべてのエキストラは何らかの異形化を受ける。これを治癒する術はない。異形の群れ（『インカルツァンド』P.237）×1D6と戦闘させてもよい。", "【死の行進】\n人々の心に虚無が広がり、不安と絶望に満たされていく。逃れられぬ恐怖から逃れようと、人々はみずから、あるいは無意識のうちに死へと向かい行動を始める。", "【死の行進】\n人々の心に虚無が広がり、不安と絶望に満たされていく。逃れられぬ恐怖から逃れようと、人々はみずから、あるいは無意識のうちに死へと向かい行動を始める。", "【時間加速】\nシーン内に存在するあらゆる無生物と生物は、2D6年ぶん時間が加速する。生物なら老化する。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【時間加速】\nシーン内に存在するあらゆる無生物と生物は、2D6年ぶん時間が加速する。生物なら老化する。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【時間逆流】\nシーン内に存在するあらゆる無生物と生物は、2D6年ぶん時間が逆流する。生物ならば若返る。製造年／生年より前に戻った場合は虚無に飲まれ消滅する。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【時間逆流】\nシーン内に存在するあらゆる無生物と生物は、2D6年ぶん時間が逆流する。生物ならば若返る。製造年／生年より前に戻った場合は虚無に飲まれ消滅する。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【災害到来】\n嵐、火山の噴火、洪水など、ほつれによって乱された自然が、人々に牙をむく。", "【災害到来】\n嵐、火山の噴火、洪水など、ほつれによって乱された自然が、人々に牙をむく。", "【人心荒廃】\n歪みによってもたらされた不安と恐怖は、人々を捨て鉢にさせる。", "【人心荒廃】\n歪みによってもたらされた不安と恐怖は、人々を捨て鉢にさせる。", "【平穏無事】\n何も起きない。紡ぎ手は背筋が凍るほどの恐怖を覚える。", "【平穏無事】\n何も起きない。紡ぎ手は背筋が凍るほどの恐怖を覚える。", "【疫病蔓延】\n登場している角色は【肉体】難易度8の判定を行ない、失敗すると［邪毒］5を受ける。病の治療法の有無などについてはGMが決定する。迷ったら、伽藍を倒すと病も消滅する、とせよ。", "【疫病蔓延】\n登場している角色は【肉体】難易度8の判定を行ない、失敗すると［邪毒］5を受ける。病の治療法の有無などについてはGMが決定する。迷ったら、伽藍を倒すと病も消滅する、とせよ。", "【異端審問】\n異端審問の時は近い。PCたちが紡ぎ手であることが知れ渡れば、PCたちも火刑台へと送られることになろう。", "【異端審問】\n異端審問の時は近い。PCたちが紡ぎ手であることが知れ渡れば、PCたちも火刑台へと送られることになろう。", "【歪み出現】\nほつれの破片から歪みが現れ、人々を襲撃する。病魔（『インカルツァンド』P.238）×2と戦闘を行なわせてもよい。また、別の異形でもよい。", "【歪み出現】\nほつれの破片から歪みが現れ、人々を襲撃する。病魔（『インカルツァンド』P.238）×2と戦闘を行なわせてもよい。また、別の異形でもよい。", "【悪夢現出】\nシーン内のあらゆる人々は恐るべき恐怖の夢を見る。心弱きものたちは、伽藍にすがるか、異端者を火あぶりにせねばこの夢から逃れられぬと考えるだろう。", "【悪夢現出】\nシーン内のあらゆる人々は恐るべき恐怖の夢を見る。心弱きものたちは、伽藍にすがるか、異端者を火あぶりにせねばこの夢から逃れられぬと考えるだろう。", "【鼠の宴】\n鼠の大群が出現し、穀物を食い荒らし、疫病をまき散らす。大鼠（『MM』P.240）×1D6と戦闘を行なわせてもよい。", "【鼠の宴】\n鼠の大群が出現し、穀物を食い荒らし、疫病をまき散らす。大鼠（『MM』P.240）×1D6と戦闘を行なわせてもよい。", "【歪曲御標】\n歪んだ御標が下される。歪み表（『MM』P.263）を振ること。", "【歪曲御標】\n歪んだ御標が下される。歪み表（『MM』P.263）を振ること。", "【地域消滅】\n演目の舞台となっている地域そのものが消えてなくなる。影響下にあるすべての角色（伽藍を含む）は【縫製】難易度10の判定に成功すれば脱出できる。失敗した場合即座に死亡する。エキストラは無条件で死亡する。", "【地域消滅】\n演目の舞台となっている地域そのものが消えてなくなる。影響下にあるすべての角色（伽藍を含む）は【縫製】難易度10の判定に成功すれば脱出できる。失敗した場合即座に死亡する。エキストラは無条件で死亡する。"];
      return self.$get_table_by_d66(table);
    }, $MonotoneMuseum_mm_distortion_table_ver2$9.$$arity = 0);
    
    Opal.def(self, '$mm_world_distortion_table', $MonotoneMuseum_mm_world_distortion_table$10 = function $$mm_world_distortion_table() {
      var self = this, table = nil;

      
      table = ["【消失】\n世界からボス角色が消去され、消滅する。エンディングフェイズへ。", "【自己犠牲】\nチャートを振ったPCのパートナーとなっているNPCのひとりが死亡する。チャートを振ったPCのHPとMPを完全に回復させる。", "【生命誕生】\nキミたちは大地の代わりに何かの生き物の臓腑の上に立っている。登場している角色全員に［邪毒］5を与える。", "【歪曲拡大】\nシーンに登場している紡ぎ手ではないNPCひとりが漆黒の凶獣（『MM』P.240）に変身する。", "【暴走】\n“ほつれ ”がいくつも生まれ、シーンに登場しているすべての角色の剥離値を +1 する。", "【幻像世界】\n周囲の空間は歪み、破壊的なエネルギーが充満する。次に行なわれるダメージロールに+5D6する。", "【変調】\n右は左に、赤は青に、上は下に、歪みが身体の動きを妨げる。登場している角色全員に［狼狽］を与える。", "【空間消失】\n演目の舞台が煙のように消失する。圧倒的な喪失感により、登場している角色全員に［放心］を与える。", "【生命消失】\n次のシーン以降、エキストラは一切登場できない。現在のシーンのエキストラに関してはGMが決定する。", "【自己死】\nもっとも剥離値の高いPCひとりが［戦闘不能］になる。複数のPCが該当した場合はGMがランダムに決定する。", "【世界死】\n世界の破滅。難易度12の【縫製】判定に成功すると破滅から逃れられる。失敗すると行方不明になる。エンディングフェイズへ。"];
      return self.$get_table_by_2d6(table);
    }, $MonotoneMuseum_mm_world_distortion_table$10.$$arity = 0);
    
    Opal.def(self, '$mm_world_distortion_table_ver2', $MonotoneMuseum_mm_world_distortion_table_ver2$11 = function $$mm_world_distortion_table_ver2() {
      var self = this, table = nil;

      
      table = ["【歪みの茨】\nシーン全体が鋼鉄よりも硬い茨の棘によって埋め尽くされる。飛行状態でない角色は、移動を行う度に〈刺〉3D6+[そのシーンで登場する角色の中で最大の演者レベル]点のダメージを受ける。", "【歪みの茨】\nシーン全体が鋼鉄よりも硬い茨の棘によって埋め尽くされる。飛行状態でない角色は、移動を行う度に〈刺〉3D6+[そのシーンで登場する角色の中で最大の演者レベル]点のダメージを受ける。", "【世界歪曲】\n世界歪曲表（『MM』P264）を振る。", "【世界歪曲】\n世界歪曲表（『MM』P264）を振る。", "【さかさま世界】\n空か゛地面に、地面が空になる。そのシーン中、全ての飛行状態である角色は飛行状態でないものとして、飛行状態にない角色は飛行状態として扱う。", "【さかさま世界】\n空か゛地面に、地面が空になる。そのシーン中、全ての飛行状態である角色は飛行状態でないものとして、飛行状態にない角色は飛行状態として扱う。", "【海の記憶】\n存在するはずのない潮騒が聞こえ、世界の全てが波に飲み込まれる。このシーン中、飛行状態でない全ての角色は水中状態として扱う。", "【海の記憶】\n存在するはずのない潮騒が聞こえ、世界の全てが波に飲み込まれる。このシーン中、飛行状態でない全ての角色は水中状態として扱う。", "【空間湾曲】\n世界は歪む。こことあそこは意味を失う。このシーンの間、全ての角色の移動力は∞となり、特技と装備の射程は全て「視界」となる。", "【空間湾曲】\n世界は歪む。こことあそこは意味を失う。このシーンの間、全ての角色の移動力は∞となり、特技と装備の射程は全て「視界」となる。", "【濃霧世界】\nミルクよりも白く、濃厚な霧が世界を閉ざす。このシーンの間、特技と装備の射程が「視界」「6m以上」出会った場合、すべて「5m」に変更される。", "【濃霧世界】\nミルクよりも白く、濃厚な霧が世界を閉ざす。このシーンの間、特技と装備の射程が「視界」「6m以上」出会った場合、すべて「5m」に変更される。", "【豪雨】\nすさまじい雨が降る。雨は全ての人の心を凍らせる。このシーンの間、「種別：銃」である武器を用いた攻撃のファンブル値を+6する。また、別エンゲージへの物理攻撃の達成値を-2する。", "【豪雨】\nすさまじい雨が降る。雨は全ての人の心を凍らせる。このシーンの間、「種別：銃」である武器を用いた攻撃のファンブル値を+6する。また、別エンゲージへの物理攻撃の達成値を-2する。", "【どろどろ】\n足下がいつの間にか不定型な泥沼になっている。このシーンの間、飛行状態でない角色が同一エンゲージに対して行う物理攻撃のファンブル値を+6する。", "【どろどろ】\n足下がいつの間にか不定型な泥沼になっている。このシーンの間、飛行状態でない角色が同一エンゲージに対して行う物理攻撃のファンブル値を+6する。", "【暴風】\n風は吹きすさび運命を嘲笑する。このシーンの間、飛行状態でない角色が同一エンゲージに対して行う物理攻撃のファンブル値を+6する", "【暴風】\n風は吹きすさび運命を嘲笑する。このシーンの間、飛行状態でない角色が同一エンゲージに対して行う物理攻撃のファンブル値を+6する", "【魔法暴走】\n魔法の力は暴走し、もう誰の手にも負えない。世界は終わる。消えていく。このシーンの間、「種別：術」の特技を用いた判定のファンブル値は+6される", "【魔法暴走】\n魔法の力は暴走し、もう誰の手にも負えない。世界は終わる。消えていく。このシーンの間、「種別：術」の特技を用いた判定のファンブル値は+6される", "【自己死】\n巨大なほつれが発生し、致命的なダメージを負う。最も剥離値の高いPCひとりが戦闘不能になる。複数のPCが該当した場合はGMがランダムに決定する", "【自己死】\n巨大なほつれが発生し、致命的なダメージを負う。最も剥離値の高いPCひとりが戦闘不能になる。複数のPCが該当した場合はGMがランダムに決定する", "【虚構の報い】\n紡ぎ手によってゆがめられ続けた因果が逆襲する。このシーンで《虚構現出》を使用した場合、代償に加えて10D6点の実ダメージを受ける。このダメージは軽減できず、移し替えることもできない。", "【虚構の報い】\n紡ぎ手によってゆがめられ続けた因果が逆襲する。このシーンで《虚構現出》を使用した場合、代償に加えて10D6点の実ダメージを受ける。このダメージは軽減できず、移し替えることもできない。", "【虚構の果て】\n神が見捨てたのか、神を見捨てたのか。逸脱の果て、世界は終わる。あなたはこのシーンで逸脱能力を使用した場合、上昇した剥離値の10倍だけの実ダメージを受ける。このダメージは軽減できず、移し替えることも出来ない。", "【虚構の果て】\n神が見捨てたのか、神を見捨てたのか。逸脱の果て、世界は終わる。あなたはこのシーンで逸脱能力を使用した場合、上昇した剥離値の10倍だけの実ダメージを受ける。このダメージは軽減できず、移し替えることも出来ない。", "【人格交代】\n魂、厳密には魂の背後にあるナニモノカが入れ替わる。左隣の玩家に角色卡を渡し、このシーン中はその玩家があなたのPCを演じる。GMが認めれば、GMもNPCと入れ替えてもいい。", "【人格交代】\n魂、厳密には魂の背後にあるナニモノカが入れ替わる。左隣の玩家に角色卡を渡し、このシーン中はその玩家があなたのPCを演じる。GMが認めれば、GMもNPCと入れ替えてもいい。", "【因果の糸】\n嗤う声がする。「逸脱の結果は共有しようよ？」PC全員の剥離値を平均し（端数切り上げ）、全員の剥離値をその計算結果に書き換える、", "【因果の糸】\n嗤う声がする。「逸脱の結果は共有しようよ？」PC全員の剥離値を平均し（端数切り上げ）、全員の剥離値をその計算結果に書き換える、", "【剣に斃る】\n人を裁く者に報いを、剣には剣の対価を。このシーンで攻撃を行いファンブルした場合、5D6点の実ダメージを受ける。", "【剣に斃る】\n人を裁く者に報いを、剣には剣の対価を。このシーンで攻撃を行いファンブルした場合、5D6点の実ダメージを受ける。", "【秘密暴露】\n隠しておきたい秘密を小鳥が囀り、リスが囁く。登場している全ての紡ぎ手、異形、伽藍は隠しておきたい秘密（その角色の主観で良い）ひとつを明らかにする。さもなければ、10D6点の実ダメージを受ける。このダメージは軽減も移し替えも出来ない。", "【秘密暴露】\n隠しておきたい秘密を小鳥が囀り、リスが囁く。登場している全ての紡ぎ手、異形、伽藍は隠しておきたい秘密（その角色の主観で良い）ひとつを明らかにする。さもなければ、10D6点の実ダメージを受ける。このダメージは軽減も移し替えも出来ない。", "【荒廃の王】\n気がつくと全ての角色は、虚ろの荒野の荒廃の王（『MM』 p.212）の身体の飢えにいる。全ての角色はその虚無に巻き込まれ、5D6点の実ダメージを受ける。このダメージは軽減も移し替えも出来ない。荒廃の王があなたたちにどのような影響をもたらすかはGMの任意とせよ。", "【荒廃の王】\n気がつくと全ての角色は、虚ろの荒野の荒廃の王（『MM』 p.212）の身体の飢えにいる。全ての角色はその虚無に巻き込まれ、5D6点の実ダメージを受ける。このダメージは軽減も移し替えも出来ない。荒廃の王があなたたちにどのような影響をもたらすかはGMの任意とせよ。"];
      return self.$get_table_by_d66(table);
    }, $MonotoneMuseum_mm_world_distortion_table_ver2$11.$$arity = 0);
    
    Opal.def(self, '$mm_omens_table_ver2', $MonotoneMuseum_mm_omens_table_ver2$12 = function $$mm_omens_table_ver2() {
      var self = this, table = nil;

      
      table = ["【信念の喪失】\nあなたの精神があなたの過去を否定する。あなたは[出自]とそれにまつわる記憶をそのシーン中喪失する。特徴の効果は失われないが、其れを認識することは出来ない。", "【信念の喪失】\nあなたの精神があなたの過去を否定する。あなたは[出自]とそれにまつわる記憶をそのシーン中喪失する。特徴の効果は失われないが、其れを認識することは出来ない。", "【昏倒】\nもうあなたは逸脱の重さに耐えることは出来ない。これが世界に刃向かった報いだ。あなたは[戦闘不能]になる。すでに[戦闘不能]なら、[死亡]する。", "【昏倒】\nもうあなたは逸脱の重さに耐えることは出来ない。これが世界に刃向かった報いだ。あなたは[戦闘不能]になる。すでに[戦闘不能]なら、[死亡]する。", "【肉体の崩壊】\n硝子の砕ける音がして、あなたも砕けていく。あなたは2D6+角色レベル点の【HP】を失う。", "【肉体の崩壊】\n硝子の砕ける音がして、あなたも砕けていく。あなたは2D6+角色レベル点の【HP】を失う。", "【放心】\nあなたの心に大きな衝動が襲いかかる。心は伽藍に向かって歪み、瞳は色のない悪夢を見る。あなたはバッドステータスの[放心を受ける。", "【放心】\nあなたの心に大きな衝動が襲いかかる。心は伽藍に向かって歪み、瞳は色のない悪夢を見る。あなたはバッドステータスの[放心を受ける。", "【重圧】\nどこからかあなたを嘲笑する声がする。「こうして御標に背いた愚か者は、鎖に繋がれて責め苦を受けるのです」。あなたはバッドステータスの[重圧]を受ける。", "【重圧】\nどこからかあなたを嘲笑する声がする。「こうして御標に背いた愚か者は、鎖に繋がれて責め苦を受けるのです」。あなたはバッドステータスの[重圧]を受ける。", "【現在の喪失】\n現在持っているパートナーをひとつ喪失する。あなたは何かを失ったことには気がつくが、その人物のことは思い出せない。この効果はその演目の間、継続する。もちろん、新しく人間関係を構築することも出来ない。", "【現在の喪失】\n現在持っているパートナーをひとつ喪失する。あなたは何かを失ったことには気がつくが、その人物のことは思い出せない。この効果はその演目の間、継続する。もちろん、新しく人間関係を構築することも出来ない。", "【マヒ】\n異形化した肉体の変異に、魂が耐えられない。身体がしびれ、震えが止まらない。あなたはバッドステータスの[マヒ]を受ける。", "【マヒ】\n異形化した肉体の変異に、魂が耐えられない。身体がしびれ、震えが止まらない。あなたはバッドステータスの[マヒ]を受ける。", "【邪毒】\n意識の深いところで異形化が進行し、あなたの肉体を蝕みはじめる。あなたはバッドステータスの[邪毒]5を受ける。", "【邪毒】\n意識の深いところで異形化が進行し、あなたの肉体を蝕みはじめる。あなたはバッドステータスの[邪毒]5を受ける。", "【色彩の喪失】\nあなたの身体から色が消えて曇白へと近付いてゆく。服や化粧などで隠すことは出来るが、ばれれば異端尋問は免れまい。あなたの剥離値を+1D6する。（この効果では兆候表を振らない）", "【色彩の喪失】\nあなたの身体から色が消えて曇白へと近付いてゆく。服や化粧などで隠すことは出来るが、ばれれば異端尋問は免れまい。あなたの剥離値を+1D6する。（この効果では兆候表を振らない）", "【理由の喪失】\nあなたの精神があなたの現在を否定する。あなたは[境遇]とそれにまつわる記憶をそのシーン中喪失する。特徴の効果は失われないが、其れを認識することはできない。", "【理由の喪失】\nあなたの精神があなたの現在を否定する。あなたは[境遇]とそれにまつわる記憶をそのシーン中喪失する。特徴の効果は失われないが、其れを認識することはできない。", "【存在の喪失】\nふいに、煙のようにあなたの姿がかき消えた。あなたの存在は一瞬、この世界から喪失する。あなたの剥離値を+1D6する。（この効果では兆候表を振らない）", "【存在の喪失】\nふいに、煙のようにあなたの姿がかき消えた。あなたの存在は一瞬、この世界から喪失する。あなたの剥離値を+1D6する。（この効果では兆候表を振らない）", "【逸脱の対価】\n逸脱能力を用いた結果この表を振ることになった場合にのみ適用する（そうでないなら振り直し）。この表を振る原因となった逸脱能力はこのラウンド（戦闘中でないならシーン）中はもはや使用できない。", "【逸脱の対価】\n逸脱能力を用いた結果この表を振ることになった場合にのみ適用する（そうでないなら振り直し）。この表を振る原因となった逸脱能力はこのラウンド（戦闘中でないならシーン）中はもはや使用できない。", "【逸脱の重責】\n世界から逸脱した結果、肉体が急激に異形化し身体を苛む。[上昇した剥離値×10]点の【HP】を失う。", "【逸脱の重責】\n世界から逸脱した結果、肉体が急激に異形化し身体を苛む。[上昇した剥離値×10]点の【HP】を失う。", "【急激な異形化】\n身体の一部（耳、指、瞳）などが歪んだ獣のそれになる。しかし、そのことはあなたの力ともなる。【HP】を（角色レベル）D6点回復する（回復できない状態でも回復する）。あなたの剥離値を+2する（この効果では兆候表を振らない）。", "【急激な異形化】\n身体の一部（耳、指、瞳）などが歪んだ獣のそれになる。しかし、そのことはあなたの力ともなる。【HP】を（角色レベル）D6点回復する（回復できない状態でも回復する）。あなたの剥離値を+2する（この効果では兆候表を振らない）。", "【精神の崩壊】\n身体が異形化し、世界から剥離していく。あなたの存在はぼやけてやがて消えていく。魂すらも。あなたは2D6+角色レベル点の【MP】を失う。", "【精神の崩壊】\n身体が異形化し、世界から剥離していく。あなたの存在はぼやけてやがて消えていく。魂すらも。あなたは2D6+角色レベル点の【MP】を失う。", "【逸脱の呪い】\n逸脱能力を用いた結果この表を振ることになった場合にのみ適用する（そうでないなら振り直し）。この表を振る原因となった逸脱能力は、この演目の間あなたが使用する場合、剥離値の上昇を2倍に数える。", "【逸脱の呪い】\n逸脱能力を用いた結果この表を振ることになった場合にのみ適用する（そうでないなら振り直し）。この表を振る原因となった逸脱能力は、この演目の間あなたが使用する場合、剥離値の上昇を2倍に数える。", "【剥離の伝播】\n世界の歪みは広がり、拡散し、誰も逃れられない。あなたの剥離値が、シーンに登場しているPCで最も剥離値の高いPCと同じになる。あなたが最も高いなら、最も低いPCの剥離値があなたと同じになる（複数登場している場合はランダムに選ぶこと）。", "【剥離の伝播】\n世界の歪みは広がり、拡散し、誰も逃れられない。あなたの剥離値が、シーンに登場しているPCで最も剥離値の高いPCと同じになる。あなたが最も高いなら、最も低いPCの剥離値があなたと同じになる（複数登場している場合はランダムに選ぶこと）。", "【運命の恩寵】\n恩寵、あるいは悲劇への対価か。あなたは逸脱能力をその演目中に限り、更に一種類使用できるようになる（任意に選択せよ）。選択した逸脱能力の剥離値上昇は+1される。", "【運命の恩寵】\n恩寵、あるいは悲劇への対価か。あなたは逸脱能力をその演目中に限り、更に一種類使用できるようになる（任意に選択せよ）。選択した逸脱能力の剥離値上昇は+1される。"];
      return self.$get_table_by_d66(table);
    }, $MonotoneMuseum_mm_omens_table_ver2$12.$$arity = 0);
    
    Opal.def(self, '$mm_distortion_table_outdoor', $MonotoneMuseum_mm_distortion_table_outdoor$13 = function $$mm_distortion_table_outdoor() {
      var self = this, table = nil;

      
      table = ["【死の蔓延】\n木は枯れて奇っ怪な姿になり、花はしおれる。大気は淀んだ腐敗臭を放ち、岩はねじくれる。すべてのものが死の気配に包まれる", "【死の蔓延】\n木は枯れて奇っ怪な姿になり、花はしおれる。大気は淀んだ腐敗臭を放ち、岩はねじくれる。すべてのものが死の気配に包まれる", "【歪曲御標】\n歪んだ御標が下される。歪み表（『MM』P263）を振ること。", "【歪曲御標】\n歪んだ御標が下される。歪み表（『MM』P263）を振ること。", "【季節変容】\n季節が突如として変化する。1D6し、1なら春、2なら夏、3なら秋、4なら冬、5なら四季が狂ったように変動し、6ならGMの任意とせよ。急激な季節の変化は、自然と人々の健康を痛めつける。", "【季節変容】\n季節が突如として変化する。1D6し、1なら春、2なら夏、3なら秋、4なら冬、5なら四季が狂ったように変動し、6ならGMの任意とせよ。急激な季節の変化は、自然と人々の健康を痛めつける。", "【ほつれ】\n世界がひび割れ、ほつれが現出する。ほつれに触れたものは虚無に飲み込まれ、帰ってくることはない。", "【ほつれ】\n世界がひび割れ、ほつれが現出する。ほつれに触れたものは虚無に飲み込まれ、帰ってくることはない。", "【異形化】\n周囲の動物たちが歪みによって異形と化し、襲撃してくる。異形の群れ（『IZ』P237）×1D6体と戦闘になっても良い。", "【異形化】\n周囲の動物たちが歪みによって異形と化し、襲撃してくる。異形の群れ（『IZ』P237）×1D6体と戦闘になっても良い。", "【凍結世界】\n気温が異様に低下し、すべてのものが凍結する。また、凍結した世界の中で戦闘する全ての角色は、防御判定にファンブルした場合狼狽を受ける。", "【凍結世界】\n気温が異様に低下し、すべてのものが凍結する。また、凍結した世界の中で戦闘する全ての角色は、防御判定にファンブルした場合狼狽を受ける。", "【天候暴走】\n大嵐、竜巻、吹雪、酷暑などの異常気象が発生する。船は木の葉のように揺れ、獣は恐怖に騒ぐ。このシーン中に行うすべての移動はその距離が半減する。", "【天候暴走】\n大嵐、竜巻、吹雪、酷暑などの異常気象が発生する。船は木の葉のように揺れ、獣は恐怖に騒ぐ。このシーン中に行うすべての移動はその距離が半減する。", "【天の怒り】\n歪みによってあり得ないほどの異常気象が発生する。全てを吹き飛ばす風が吹き、雷鳴が唸る。このシーン中、あらゆる角色は飛行状態になることは出来ない。", "【天の怒り】\n歪みによってあり得ないほどの異常気象が発生する。全てを吹き飛ばす風が吹き、雷鳴が唸る。このシーン中、あらゆる角色は飛行状態になることは出来ない。", "【迷いの森】\n周囲の景色や地形が地図や知識にあるものと全く違っている。どこかに向かっているなら【知覚】難易度12の判定に失敗した場合、迷った結果として【MP】2D6点を失う", "【迷いの森】\n周囲の景色や地形が地図や知識にあるものと全く違っている。どこかに向かっているなら【知覚】難易度12の判定に失敗した場合、迷った結果として【MP】2D6点を失う", "【死の世界】\n世界は異様に美しくなる。水には一匹の魚もなく、藪には一匹の虫もいない。空に鳥は飛ばない。不気味な静寂が世界を包む。", "【死の世界】\n世界は異様に美しくなる。水には一匹の魚もなく、藪には一匹の虫もいない。空に鳥は飛ばない。不気味な静寂が世界を包む。", "【影絵芝居】\nそこかしこの暗闇から、紡ぎ手たちの（あるいは登場するNPCの）不吉な運命を暗示する歌声が聞こえてくる。それは異形の声や虚無の軋みの音、あるいは歪みの幻影かもしれない。", "【影絵芝居】\nそこかしこの暗闇から、紡ぎ手たちの（あるいは登場するNPCの）不吉な運命を暗示する歌声が聞こえてくる。それは異形の声や虚無の軋みの音、あるいは歪みの幻影かもしれない。", "【色彩浸食】\n世界が漆黒と曇白に塗り分けられる。シーン内に登場するあらゆる無生物と生物は、白と黒のモノトーンの存在になる。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【色彩浸食】\n世界が漆黒と曇白に塗り分けられる。シーン内に登場するあらゆる無生物と生物は、白と黒のモノトーンの存在になる。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【濃霧】\nたとえそこが地底であっても、曇白の濃霧があたりを包み込む。手を伸ばしたら、その指先が見えないほどだ。濃霧内での攻撃は、敵との距離を2倍に計算する。", "【濃霧】\nたとえそこが地底であっても、曇白の濃霧があたりを包み込む。手を伸ばしたら、その指先が見えないほどだ。濃霧内での攻撃は、敵との距離を2倍に計算する。", "【異形出現】\nほつれの中から、おぞましく人を襲うことしか考えぬ異形の群れが現れ、恐怖のうちに居合わせた人々を襲撃する。GMが望むなら、異形の群れ（『IZ』P237）×1D6と戦闘を行わせても良い。また、GMは状況に応じて別のエネミーを選択しても良い。", "【異形出現】\nほつれの中から、おぞましく人を襲うことしか考えぬ異形の群れが現れ、恐怖のうちに居合わせた人々を襲撃する。GMが望むなら、異形の群れ（『IZ』P237）×1D6と戦闘を行わせても良い。また、GMは状況に応じて別のエネミーを選択しても良い。", "【鉱脈露出】\nあり得ないほどの豊富な鉱脈が露出する。黄金、宝石、海ならば珊瑚などだ。人々は目の色を変えて鉱脈に群がる。それによってもたらされる混乱についてはGMが決定せよ。", "【鉱脈露出】\nあり得ないほどの豊富な鉱脈が露出する。黄金、宝石、海ならば珊瑚などだ。人々は目の色を変えて鉱脈に群がる。それによってもたらされる混乱についてはGMが決定せよ。", "【虚無現出】\nほつれの中から虚無がしみ出す。シーンに登場しているエキストラは虫一匹にいたるまで消滅し、二度と現れない。", "【虚無現出】\nほつれの中から虚無がしみ出す。シーンに登場しているエキストラは虫一匹にいたるまで消滅し、二度と現れない。", "【汚染世界】\n水は毒を含み、大気は有毒の霧に包まれる。登場している全ての角色は【体力】難易度10の判定を行い、失敗すると邪毒5を受ける。エキストラがどうなるかはGMが決定するが、治療されなければ早晩死亡するだろう。", "【汚染世界】\n水は毒を含み、大気は有毒の霧に包まれる。登場している全ての角色は【体力】難易度10の判定を行い、失敗すると邪毒5を受ける。エキストラがどうなるかはGMが決定するが、治療されなければ早晩死亡するだろう。", "【地域消滅】\n演目の舞台となっている地域そのものが消えてなくなる。影響下にあるすべての角色（伽藍を含む）は【縫製】難易度10の判定に成功すれば脱出できる。失敗した場合即座に死亡する。エキストラは無条件で死亡する。", "【地域消滅】\n演目の舞台となっている地域そのものが消えてなくなる。影響下にあるすべての角色（伽藍を含む）は【縫製】難易度10の判定に成功すれば脱出できる。失敗した場合即座に死亡する。エキストラは無条件で死亡する。"];
      return self.$get_table_by_d66(table);
    }, $MonotoneMuseum_mm_distortion_table_outdoor$13.$$arity = 0);
    return (Opal.def(self, '$mm_distortion_table_sea', $MonotoneMuseum_mm_distortion_table_sea$14 = function $$mm_distortion_table_sea() {
      var self = this, table = nil;

      
      table = ["【海域汚染】\n赤潮が発生する。あるいは海水そのものが毒に変わる。登場している全ての角色は【体力】難易度10の判定を行い、失敗すると邪毒5を受ける。エキストラがどうなるかはGMが決定するが、治療されなければ早晩死亡するだろう。", "【海域汚染】\n赤潮が発生する。あるいは海水そのものが毒に変わる。登場している全ての角色は【体力】難易度10の判定を行い、失敗すると邪毒5を受ける。エキストラがどうなるかはGMが決定するが、治療されなければ早晩死亡するだろう。", "【色彩浸食】\n世界が漆黒と曇白に塗り分けられる。シーン内に登場するあらゆる無生物と生物は、白と黒のモノトーンの存在になる。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【色彩浸食】\n世界が漆黒と曇白に塗り分けられる。シーン内に登場するあらゆる無生物と生物は、白と黒のモノトーンの存在になる。紡ぎ手は【縫製】難易度8の判定に成功すれば、この影響を受けない。", "【異形の海】\n海の生物や海守りたちが異形化する。戦闘となる。GMは適切と思われるエネミーを配置すること。", "【異形の海】\n海の生物や海守りたちが異形化する。戦闘となる。GMは適切と思われるエネミーを配置すること。", "【海底火山】\n海底火山が噴火する。海水は熱されて周囲の生物は次々と死滅し、海守りたちも苦しむ。海からのしぶきは熱湯となる。具体的な効果はGMが決定せよ。", "【海底火山】\n海底火山が噴火する。海水は熱されて周囲の生物は次々と死滅し、海守りたちも苦しむ。海からのしぶきは熱湯となる。具体的な効果はGMが決定せよ。", "【歪曲御標】\n歪んだ御標が下される。歪み表（『MM』P263）を振ること。", "【歪曲御標】\n歪んだ御標が下される。歪み表（『MM』P263）を振ること。", "【曇白の海】\n海の水が曇白になる。虚無への甘い誘いに満ちた海に触れたものは、考えることをやめ、意思なき人形のようになり、いずれ溶けて消滅してしまう。この歪みが1D6シーン（または1D6日）以内に消えない場合、すべての角色は（PCも含め）エキストラとなって二度と自我を取り戻すことはない。GMは何らかの理由で効果を受けない角色を設定しても良い。", "【曇白の海】\n海の水が曇白になる。虚無への甘い誘いに満ちた海に触れたものは、考えることをやめ、意思なき人形のようになり、いずれ溶けて消滅してしまう。この歪みが1D6シーン（または1D6日）以内に消えない場合、すべての角色は（PCも含め）エキストラとなって二度と自我を取り戻すことはない。GMは何らかの理由で効果を受けない角色を設定しても良い。", "【黒い海】\n海の水が漆黒に染まっていく。海の中にいると一寸先も見えない、[種別：射撃]の武器による攻撃のファンブル値を+5する。", "【黒い海】\n海の水が漆黒に染まっていく。海の中にいると一寸先も見えない、[種別：射撃]の武器による攻撃のファンブル値を+5する。", "【壁面崩壊】\n海の壁面が崩壊し、ヒビが入る。ヒビを何とかすることができなければ、水圧によって1D6シーン（または1D6時間）後には崩壊し、海があふれ出すことになる。", "【壁面崩壊】\n海の壁面が崩壊し、ヒビが入る。ヒビを何とかすることができなければ、水圧によって1D6シーン（または1D6時間）後には崩壊し、海があふれ出すことになる。", "【固形化】\n海の水が固形化する。その中にいるものは氷で硬められたように身動きが取れず、ただ死を待つのみ。エキストラは完全に動けなくなる。エネミーやPCは等しく重圧＆捕縛を受ける。この効果は歪みが引き受けられるまでの間、毎シーン＆毎ラウンドの開始後に再度適用される。", "【固形化】\n海の水が固形化する。その中にいるものは氷で硬められたように身動きが取れず、ただ死を待つのみ。エキストラは完全に動けなくなる。エネミーやPCは等しく重圧＆捕縛を受ける。この効果は歪みが引き受けられるまでの間、毎シーン＆毎ラウンドの開始後に再度適用される。", "【氾濫】\n海の水が急激に増幅し、水槽からあふれ出す。シーンに登場している海守りのクラスを持たない角色の【HP】は即座に0になる。ただし《大河の導き》の効果を受けている角色と《ミズモノ》を取得している角色は3D6点の【HP】を消費することでこの効果を打ち消せる。", "【氾濫】\n海の水が急激に増幅し、水槽からあふれ出す。シーンに登場している海守りのクラスを持たない角色の【HP】は即座に0になる。ただし《大河の導き》の効果を受けている角色と《ミズモノ》を取得している角色は3D6点の【HP】を消費することでこの効果を打ち消せる。", "【塩の雪】\n空から雪のように塩が降ってくる。人々は初めは喜ぶが、降り続ける雪は田畑を荒らし、人の身にも害を及ぼす。それでも塩は降り止まない。", "【塩の雪】\n空から雪のように塩が降ってくる。人々は初めは喜ぶが、降り続ける雪は田畑を荒らし、人の身にも害を及ぼす。それでも塩は降り止まない。", "【真水化】\n海が真水になる。人間の中には喜ぶ者もいるが、海の生物たちにとっては死を意味する。", "【真水化】\n海が真水になる。人間の中には喜ぶ者もいるが、海の生物たちにとっては死を意味する。", "【海流消失】\n海の海流が消える。海守りの力を持ってしても潮を起こすことはできない。よどんた海水は腐敗し、海の恩恵を受けて暮らす者たちは次々に病にかかる。", "【海流消失】\n海の海流が消える。海守りの力を持ってしても潮を起こすことはできない。よどんた海水は腐敗し、海の恩恵を受けて暮らす者たちは次々に病にかかる。", "【崩れる世界】\n海の周囲（海の内部ではなく、その外部）で爆発的にほつれが広がっていく。その規模はGMが決定するが、遠からず住人たちは死を迎えることになるだろう。", "【崩れる世界】\n海の周囲（海の内部ではなく、その外部）で爆発的にほつれが広がっていく。その規模はGMが決定するが、遠からず住人たちは死を迎えることになるだろう。", "【酒の海】\n海の水が酒になる。水を飲んだすべての者は酔っ払い理性を失う。その様はまるで暗黒期に滅亡した“怠惰の古都”を彷彿とさせる。", "【酒の海】\n海の水が酒になる。水を飲んだすべての者は酔っ払い理性を失う。その様はまるで暗黒期に滅亡した“怠惰の古都”を彷彿とさせる。", "【冷たき海】\n海の水が魂を凍らせるような冷たさになる。水に触れた者は暗く排他的で疑心暗鬼になり、互いを憎悪するようになる。また、全ての角色は海水に触れている限り、毎シーン【MP】を2D6点失う。", "【冷たき海】\n海の水が魂を凍らせるような冷たさになる。水に触れた者は暗く排他的で疑心暗鬼になり、互いを憎悪するようになる。また、全ての角色は海水に触れている限り、毎シーン【MP】を2D6点失う。", "【大渦巻き】\n巨大な大渦が出現する。渦の中心は虚無に通じており、海守りの力を持ってしても渦を消すことはできない。海中にいる全ての角色は2D6を振り、出た目に等しい【HP】を失う。ただし出目が2の場合、即座に【HP】が0となる。", "【大渦巻き】\n巨大な大渦が出現する。渦の中心は虚無に通じており、海守りの力を持ってしても渦を消すことはできない。海中にいる全ての角色は2D6を振り、出た目に等しい【HP】を失う。ただし出目が2の場合、即座に【HP】が0となる。", "【海の終焉】\n海を維持している生命の力そのものが消える。水は鎖、魚はしに、波は薙ぐ。あらゆる生命は死ぬ。", "【海の終焉】\n海を維持している生命の力そのものが消える。水は鎖、魚はしに、波は薙ぐ。あらゆる生命は死ぬ。"];
      return self.$get_table_by_d66(table);
    }, $MonotoneMuseum_mm_distortion_table_sea$14.$$arity = 0), nil) && 'mm_distortion_table_sea';
  })($nesting[0], $$($nesting, 'DiceBot'), $nesting)
})(Opal);
