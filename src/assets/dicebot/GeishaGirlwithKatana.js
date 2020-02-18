/* Generated by Opal 0.11.4 */
(function(Opal) {
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $hash = Opal.hash;

  Opal.add_stubs(['$setPrefixes', '$=~', '$getChombaResultText', '$last_match', '$isChomba', '$roll', '$collect', '$split', '$to_i', '$sort!', '$getYaku', '$nil?', '$getResultTextByDice', '$getDemeZorome', '$==', '$debug', '$<=', '$getResultText', '$[]', '$join']);
  return (function($base, $super, $parent_nesting) {
    function $GeishaGirlwithKatana(){};
    var self = $GeishaGirlwithKatana = $klass($base, $super, 'GeishaGirlwithKatana', $GeishaGirlwithKatana);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_GeishaGirlwithKatana_gameName_1, TMP_GeishaGirlwithKatana_gameType_2, TMP_GeishaGirlwithKatana_getHelpMessage_3, TMP_GeishaGirlwithKatana_rollDiceCommand_5, TMP_GeishaGirlwithKatana_isChomba_6, TMP_GeishaGirlwithKatana_getChombaResultText_7, TMP_GeishaGirlwithKatana_getYaku_8, TMP_GeishaGirlwithKatana_getDemeZorome_9, TMP_GeishaGirlwithKatana_getResultTextByDice_10, TMP_GeishaGirlwithKatana_getResultText_11;

    
    self.$setPrefixes(["GK(#\\d+)?", "GL"]);
    
    Opal.defn(self, '$gameName', TMP_GeishaGirlwithKatana_gameName_1 = function $$gameName() {
      var self = this;

      return "ゲイシャ・ガール・ウィズ・カタナ"
    }, TMP_GeishaGirlwithKatana_gameName_1.$$arity = 0);
    
    Opal.defn(self, '$gameType', TMP_GeishaGirlwithKatana_gameType_2 = function $$gameType() {
      var self = this;

      return "GeishaGirlwithKatana"
    }, TMP_GeishaGirlwithKatana_gameType_2.$$arity = 0);
    
    Opal.defn(self, '$getHelpMessage', TMP_GeishaGirlwithKatana_getHelpMessage_3 = function $$getHelpMessage() {
      var self = this;

      return "" + "・判定 (GK#n)\n" + "  役やチョムバを含めて1回分の骰子ロールを判定します。\n" + "　役は　（通常判定）／（戦闘時）　の順で両方出力されます。\n" + "  GK のみの場合5%の確率でチョムバます。\n" + "  GK#3 の様に #n をつけることによってチョムバの確率をn%にすることができます。\n" + "　例）GK　GK#10\n" + "・隠しコマンド (GL)\n" + "  必ずチョムバします。GMが空気を読んでチョムバさせたいときや、\n" + "  GKコマンドを打ち間違えてチョムバするを想定してます。\n" + "　例）GL\n"
    }, TMP_GeishaGirlwithKatana_getHelpMessage_3.$$arity = 0);
    
    Opal.defn(self, '$rollDiceCommand', TMP_GeishaGirlwithKatana_rollDiceCommand_5 = function $$rollDiceCommand(command) {
      var $a, $b, TMP_4, self = this, output = nil, chomba_counter = nil, _ = nil, dice_str = nil, diceList = nil, yakuResult = nil, deme = nil, zorome = nil, yp = nil;

      
      output = nil;
      if ($truthy(/^GL$/i['$=~'](command))) {
        return self.$getChombaResultText()};
      if ($truthy(/^GK(#(\d+))?$/i['$=~'](command))) {
        } else {
        return output
      };
      chomba_counter = Opal.const_get_relative($nesting, 'Regexp').$last_match(2);
      if ($truthy(self.$isChomba(chomba_counter))) {
        return self.$getChombaResultText()};
      $b = self.$roll(3, 6), $a = Opal.to_ary($b), (_ = ($a[0] == null ? nil : $a[0])), (dice_str = ($a[1] == null ? nil : $a[1])), $b;
      diceList = $send(dice_str.$split(/,/), 'collect', [], (TMP_4 = function(i){var self = TMP_4.$$s || this;
if (i == null) i = nil;
      return i.$to_i()}, TMP_4.$$s = self, TMP_4.$$arity = 1, TMP_4));
      diceList['$sort!']();
      yakuResult = self.$getYaku(diceList);
      if ($truthy(yakuResult['$nil?']())) {
        } else {
        return self.$getResultTextByDice(diceList, "" + "【役】" + (yakuResult))
      };
      $b = self.$getDemeZorome(diceList), $a = Opal.to_ary($b), (deme = ($a[0] == null ? nil : $a[0])), (zorome = ($a[1] == null ? nil : $a[1])), $b;
      if (deme['$=='](0)) {
        return self.$getResultTextByDice(diceList, "失敗")};
      yp = (function() {if (zorome['$=='](1)) {
        return " YPが1増加"
        } else {
        return ""
      }; return nil; })();
      output = self.$getResultTextByDice(diceList, "" + "達成値" + (deme) + (yp));
      self.$debug("getGGwKResult(command) result", output);
      return output;
    }, TMP_GeishaGirlwithKatana_rollDiceCommand_5.$$arity = 1);
    
    Opal.defn(self, '$isChomba', TMP_GeishaGirlwithKatana_isChomba_6 = function $$isChomba(chomba_counter) {
      var $a, $b, self = this, chomba = nil;

      
      chomba_counter = ($truthy($a = chomba_counter) ? $a : 5);
      chomba_counter = chomba_counter.$to_i();
      $b = self.$roll(1, 100), $a = Opal.to_ary($b), (chomba = ($a[0] == null ? nil : $a[0])), $b;
      return $rb_le(chomba, chomba_counter);
    }, TMP_GeishaGirlwithKatana_isChomba_6.$$arity = 1);
    
    Opal.defn(self, '$getChombaResultText', TMP_GeishaGirlwithKatana_getChombaResultText_7 = function $$getChombaResultText() {
      var self = this;

      return self.$getResultText("チョムバ！！")
    }, TMP_GeishaGirlwithKatana_getChombaResultText_7.$$arity = 0);
    
    Opal.defn(self, '$getYaku', TMP_GeishaGirlwithKatana_getYaku_8 = function $$getYaku(diceList) {
      var self = this, rule = nil, yaku = nil;

      
      rule = $hash([1, 2, 3], "自動失敗／自分の装甲効果無しでダメージを受けてしまう", [4, 5, 6], "自動成功／敵の装甲を無視してダメージを与える", [1, 1, 1], "10倍成功 YPが10増加／10倍ダメージ YPが10増加", [2, 2, 2], "2倍成功／2倍ダメージ", [3, 3, 3], "3倍成功／3倍ダメージ", [4, 4, 4], "4倍成功／4倍ダメージ", [5, 5, 5], "5倍成功／5倍ダメージ", [6, 6, 6], "6倍成功／6倍ダメージ");
      yaku = rule['$[]'](diceList);
      return yaku;
    }, TMP_GeishaGirlwithKatana_getYaku_8.$$arity = 1);
    
    Opal.defn(self, '$getDemeZorome', TMP_GeishaGirlwithKatana_getDemeZorome_9 = function $$getDemeZorome(diceList) {
      var self = this, deme = nil, zorome = nil;

      
      deme = 0;
      zorome = 0;
      if (diceList['$[]'](0)['$=='](diceList['$[]'](1))) {
        
        deme = diceList['$[]'](2);
        zorome = diceList['$[]'](0);
      } else if (diceList['$[]'](1)['$=='](diceList['$[]'](2))) {
        
        deme = diceList['$[]'](0);
        zorome = diceList['$[]'](1);};
      return [deme, zorome];
    }, TMP_GeishaGirlwithKatana_getDemeZorome_9.$$arity = 1);
    
    Opal.defn(self, '$getResultTextByDice', TMP_GeishaGirlwithKatana_getResultTextByDice_10 = function $$getResultTextByDice(diceList, result) {
      var self = this;

      return self.$getResultText("" + (diceList.$join(",")) + " ＞ " + (result))
    }, TMP_GeishaGirlwithKatana_getResultTextByDice_10.$$arity = 2);
    return (Opal.defn(self, '$getResultText', TMP_GeishaGirlwithKatana_getResultText_11 = function $$getResultText(result) {
      var self = this;

      return "" + "(3B6) ＞ " + (result)
    }, TMP_GeishaGirlwithKatana_getResultText_11.$$arity = 1), nil) && 'getResultText';
  })($nesting[0], Opal.const_get_relative($nesting, 'DiceBot'), $nesting)
})(Opal);

/* Generated by Opal 0.11.4 */
(function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$exit']);
  return Opal.const_get_relative($nesting, 'Kernel').$exit()
})(Opal);
